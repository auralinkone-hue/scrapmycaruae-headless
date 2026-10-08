const CONTACTS_API_BASE_URL = 'https://www.wixapis.com/contacts';

type RuntimeCrmEnv = {
  WIX_CRM_API_KEY?: unknown;
  WIX_CRM_SITE_ID?: unknown;
};

type WixContact = {
  id?: string;
  revision?: string;
  name?: { first?: string; last?: string };
};

type CrmSyncInput = {
  runtimeEnv: RuntimeCrmEnv;
  normalizedPhone: string;
  customerName: string;
  labelName: string;
};

export type CrmSyncResult = {
  synced: boolean;
  contactId?: string;
  created?: boolean;
  reason?: 'unconfigured' | 'ambiguous-match';
};

class WixCrmRequestError extends Error {
  readonly operation: string;
  readonly status: number;
  readonly code?: string;

  constructor(operation: string, status: number, code?: string) {
    super(`Wix CRM ${operation} failed with HTTP ${status}.`);
    this.operation = operation;
    this.status = status;
    this.code = code;
  }
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function contactName(customerName: string) {
  const [first, ...rest] = customerName.trim().split(/\s+/);
  return rest.length ? { first, last: rest.join(' ') } : { first };
}

function hasMeaningfulName(contact: WixContact): boolean {
  return Boolean(asNonEmptyString(contact.name?.first) || asNonEmptyString(contact.name?.last));
}

function wixErrorCode(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const error = value as {
    code?: unknown;
    errorCode?: unknown;
    error?: { code?: unknown };
    details?: { applicationError?: { code?: unknown }; code?: unknown };
  };
  const candidate = error.code
    ?? error.errorCode
    ?? error.error?.code
    ?? error.details?.applicationError?.code
    ?? error.details?.code;
  return typeof candidate === 'string' ? candidate : undefined;
}

async function crmRequestError(operation: string, response: Response) {
  let code: string | undefined;
  try {
    code = wixErrorCode(await response.json());
  } catch {
    // Error bodies are deliberately not retained or exposed.
  }
  return new WixCrmRequestError(operation, response.status, code);
}

function isDuplicateContactError(error: unknown): error is WixCrmRequestError {
  return error instanceof WixCrmRequestError
    && (error.code === 'DUPLICATE_CONTACT_EXISTS' || error.status === 409);
}

function getCrmConfiguration(runtimeEnv: RuntimeCrmEnv) {
  const apiKey = asNonEmptyString(runtimeEnv.WIX_CRM_API_KEY);
  const siteId = asNonEmptyString(runtimeEnv.WIX_CRM_SITE_ID);
  return apiKey && siteId ? { apiKey, siteId } : undefined;
}

function crmHeaders(config: { apiKey: string; siteId: string }) {
  return {
    Authorization: config.apiKey,
    'Content-Type': 'application/json',
    'wix-site-id': config.siteId
  };
}

async function crmFetch(
  config: { apiKey: string; siteId: string },
  operation: string,
  path: string,
  init: RequestInit
) {
  const response = await fetch(`${CONTACTS_API_BASE_URL}${path}`, {
    ...init,
    headers: { ...crmHeaders(config), ...(init.headers ?? {}) }
  });

  if (!response.ok) throw await crmRequestError(operation, response);
  return response;
}

async function findExactPhoneMatches(
  config: { apiKey: string; siteId: string },
  normalizedPhone: string
): Promise<WixContact[]> {
  const response = await crmFetch(config, 'contact lookup', '/v5/contacts/query', {
    method: 'POST',
    body: JSON.stringify({
      query: {
        filter: { 'phone.phone': { $eq: normalizedPhone } },
        paging: { limit: 2, offset: 0 }
      }
    })
  });
  const data = await response.json() as { contacts?: WixContact[] };
  return data.contacts ?? [];
}

async function findMatchingContacts(
  config: { apiKey: string; siteId: string },
  normalizedPhone: string
): Promise<WixContact[]> {
  const response = await crmFetch(
    config,
    'matching contact lookup',
    `/v5/contacts/find-matching?phone=${encodeURIComponent(normalizedPhone)}`,
    { method: 'GET' }
  );
  const data = await response.json() as { contacts?: WixContact[] };
  return data.contacts ?? [];
}

async function createContact(
  config: { apiKey: string; siteId: string },
  customerName: string,
  normalizedPhone: string
): Promise<WixContact> {
  const response = await crmFetch(config, 'contact creation', '/v5/contacts', {
    method: 'POST',
    body: JSON.stringify({
      allowDuplicates: false,
      contact: {
        name: contactName(customerName),
        phone: { tag: 'MOBILE', phone: normalizedPhone }
      }
    })
  });
  const data = await response.json() as { contact?: WixContact };
  if (!data.contact?.id) throw new Error('Wix CRM contact creation returned no contact ID.');
  return data.contact;
}

async function fillMissingContactName(
  config: { apiKey: string; siteId: string },
  contact: WixContact,
  customerName: string
) {
  if (!contact.id || !contact.revision || hasMeaningfulName(contact)) return contact;

  const response = await crmFetch(config, 'contact name update', `/v5/contacts/${encodeURIComponent(contact.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      contact: {
        id: contact.id,
        revision: contact.revision,
        name: contactName(customerName)
      }
    })
  });
  const data = await response.json() as { contact?: WixContact };
  return data.contact?.id ? data.contact : contact;
}

async function findOrCreateLabel(
  config: { apiKey: string; siteId: string },
  labelName: string
): Promise<string> {
  const response = await crmFetch(config, 'label resolution', '/v4/labels', {
    method: 'POST',
    body: JSON.stringify({ displayName: labelName })
  });
  const data = await response.json() as { label?: { key?: string } };
  if (!data.label?.key) throw new Error('Wix CRM label resolution returned no label key.');
  return data.label.key;
}

async function applyLabel(
  config: { apiKey: string; siteId: string },
  contactId: string,
  labelKey: string
) {
  await crmFetch(config, 'contact labeling', `/v4/contacts/${encodeURIComponent(contactId)}/labels`, {
    method: 'POST',
    body: JSON.stringify({ labelKeys: [labelKey] })
  });
}

/**
 * CRM is deliberately secondary to a quote save. Callers must catch failures
 * and still return the successful quote response/WhatsApp handoff.
 */
export async function syncQuoteContact(input: CrmSyncInput): Promise<CrmSyncResult> {
  const config = getCrmConfiguration(input.runtimeEnv);
  if (!config) return { synced: false, reason: 'unconfigured' };

  let matches = await findExactPhoneMatches(config, input.normalizedPhone);
  if (matches.length > 1) return { synced: false, reason: 'ambiguous-match' };

  let contact: WixContact;
  let created = false;
  if (matches.length === 1) {
    contact = await fillMissingContactName(config, matches[0], input.customerName);
  } else {
    try {
      contact = await createContact(config, input.customerName, input.normalizedPhone);
      created = true;
    } catch (error) {
      // Wix's v5 duplicate flow resolves the existing contact through Find
      // Matching Contacts, including when the structured duplicate code is
      // returned with a status other than 409.
      if (!isDuplicateContactError(error)) throw error;
      matches = await findMatchingContacts(config, input.normalizedPhone);
      if (matches.length !== 1) return { synced: false, reason: 'ambiguous-match' };
      contact = await fillMissingContactName(config, matches[0], input.customerName);
    }
  }

  if (!contact.id) throw new Error('Wix CRM contact has no ID.');
  const labelKey = await findOrCreateLabel(config, input.labelName);
  await applyLabel(config, contact.id, labelKey);
  return { synced: true, contactId: contact.id, created };
}
