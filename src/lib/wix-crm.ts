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
  reason?: 'unconfigured' | 'ambiguous-match' | 'label-pending';
};

class WixCrmRequestError extends Error {
  readonly operation: string;
  readonly status: number;

  constructor(operation: string, status: number) {
    super(`Wix CRM ${operation} failed with HTTP ${status}.`);
    this.operation = operation;
    this.status = status;
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

function getCrmConfiguration(runtimeEnv: RuntimeCrmEnv) {
  const apiKey = asNonEmptyString(runtimeEnv.WIX_CRM_API_KEY);
  const siteId = asNonEmptyString(runtimeEnv.WIX_CRM_SITE_ID);
  return apiKey ? { apiKey, siteId } : undefined;
}

function crmHeaders(config: { apiKey: string; siteId?: string }) {
  return {
    Authorization: config.apiKey,
    'Content-Type': 'application/json',
    ...(config.siteId ? { 'wix-site-id': config.siteId } : {})
  };
}

async function crmFetch(
  config: { apiKey: string; siteId?: string },
  operation: string,
  path: string,
  init: RequestInit
) {
  const response = await fetch(`${CONTACTS_API_BASE_URL}${path}`, {
    ...init,
    headers: { ...crmHeaders(config), ...(init.headers ?? {}) }
  });

  if (!response.ok) throw new WixCrmRequestError(operation, response.status);
  return response;
}

async function findExactPhoneMatches(
  config: { apiKey: string; siteId?: string },
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

async function createContact(
  config: { apiKey: string; siteId?: string },
  customerName: string,
  normalizedPhone: string
): Promise<WixContact> {
  const response = await crmFetch(config, 'contact creation', '/v5/contacts', {
    method: 'POST',
    body: JSON.stringify({
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
  config: { apiKey: string; siteId?: string },
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
  config: { apiKey: string; siteId?: string },
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
  config: { apiKey: string; siteId?: string },
  contactId: string,
  labelKey: string
) {
  const response = await crmFetch(config, 'contact labeling', '/v4/bulk/contacts/add-remove-labels', {
    method: 'POST',
    body: JSON.stringify({
      filter: { id: { $in: [contactId] } },
      labelKeysToAdd: [labelKey]
    })
  });
  const data = await response.json() as { jobId?: string };
  if (!data.jobId) throw new Error('Wix CRM labeling returned no job ID.');
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
      // A simultaneous submission can win the duplicate-detection race. Query
      // again rather than intentionally creating a duplicate contact.
      if (!(error instanceof WixCrmRequestError) || error.status !== 409) throw error;
      matches = await findExactPhoneMatches(config, input.normalizedPhone);
      if (matches.length !== 1) return { synced: false, reason: 'ambiguous-match' };
      contact = await fillMissingContactName(config, matches[0], input.customerName);
    }
  }

  if (!contact.id) throw new Error('Wix CRM contact has no ID.');
  const labelKey = await findOrCreateLabel(config, input.labelName);
  await applyLabel(config, contact.id, labelKey);
  return { synced: true, contactId: contact.id, created };
}
