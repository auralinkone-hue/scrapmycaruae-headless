import type { APIRoute } from 'astro';
import { wixClient } from '../../lib/wix';
import { requireQuoteRequestsCollectionId } from '../../lib/quote-collection';
import { normalizeUaeMobilePhone } from '../../lib/phone';
import { syncQuoteContact } from '../../lib/wix-crm';

export const prerender = false;
const INSERT_URL = 'https://www.wixapis.com/data/v2/items';
const QUERY_URL = 'https://www.wixapis.com/data/v2/items/query';
const WHATSAPP_NUMBER = '971557458322';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const cleanText = (value: unknown, max = 100) => String(value ?? '').trim().slice(0, max);
const CUSTOMER_NAME_PATTERN = /^[\p{L}][\p{L}\s.'-]*$/u;

async function queryOne(accessToken: string, collectionId: string, filter: Record<string, unknown>) {
  const response = await fetch(QUERY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: accessToken }, body: JSON.stringify({ dataCollectionId: collectionId, query: { filter, paging: { limit: 1, offset: 0 } } }) });
  if (!response.ok) throw new Error(`${collectionId} validation query failed`);
  const data = await response.json();
  return (data.dataItems ?? [])[0] ?? null;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    let quoteRequestsCollectionId: string;
    try { quoteRequestsCollectionId = requireQuoteRequestsCollectionId(import.meta.env.WIX_QUOTE_REQUESTS_COLLECTION_ID); }
    catch { console.error('Quote submission collection configuration is unavailable.'); return json({ ok: false, message: 'We could not submit your request right now. Please try again.' }, 500); }

    const body = await request.json();
    if (cleanText(body?.website, 200)) return json({ ok: true });
    const make = cleanText(body?.make, 80);
    const model = cleanText(body?.model, 120);
    const year = cleanText(body?.year, 4);
    const customerName = cleanText(body?.name, 120);
    const whatsapp = cleanText(body?.whatsapp, 40).replace(/[^\d]/g, '');
    if (!make || !model || !year || !customerName || !whatsapp) return json({ ok: false, message: 'Please complete all required fields.' }, 400);
    if (!/^\d{4}$/.test(year)) return json({ ok: false, message: 'Please select a valid vehicle year.' }, 400);
    const normalizedPhone = normalizeUaeMobilePhone(body?.whatsapp);
    if (!normalizedPhone) return json({ ok: false, message: 'Please enter a valid UAE mobile number.' }, 400);
    if (!CUSTOMER_NAME_PATTERN.test(customerName)) return json({ ok: false, message: 'Please enter a valid name.' }, 400);

    const tokens = await wixClient.auth.generateVisitorTokens();
    const accessToken = tokens.accessToken?.value;
    if (!accessToken) throw new Error('Could not generate Wix visitor token.');
    const [makeRow, modelRow, yearRow] = await Promise.all([
      queryOne(accessToken, 'VehicleMakes', { $and: [{ active: true }, { make }] }),
      queryOne(accessToken, 'VehicleModels', { $and: [{ active: true }, { make }, { model }] }),
      queryOne(accessToken, 'VehicleYears', { $and: [{ active: true }, { year: Number(year) }] })
    ]);
    if (!makeRow || !modelRow || !yearRow) return json({ ok: false, message: 'Please select valid vehicle details from the dropdowns.' }, 400);

    const title = `${make} ${model} ${year} - ${customerName}`;
    const insertResponse = await fetch(INSERT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: accessToken }, body: JSON.stringify({ dataCollectionId: quoteRequestsCollectionId, dataItem: { data: { title, make, model, year: Number(year), customerName, whatsapp, status: 'New', source: 'Headless Website' } } }) });
    if (!insertResponse.ok) throw new Error(`Quote request insert failed: ${insertResponse.status} ${await insertResponse.text()}`);

    const inserted = await insertResponse.json();
    let crmSynced = false;
    try {
      const crmResult = await syncQuoteContact({
        runtimeEnv: locals.runtime.env,
        normalizedPhone,
        customerName,
        labelName: quoteRequestsCollectionId === 'QuoteRequestsStaging'
          ? 'Headless Staging Test'
          : 'Website Valuation Lead'
      });
      crmSynced = crmResult.synced;
      if (!crmSynced) {
        console.warn(`Quote CRM synchronization was skipped (${crmResult.reason ?? 'unknown'}).`);
      }
    } catch (crmError) {
      // CRM is secondary. Never lose a confirmed CMS quote or expose CRM data
      // and error details to the browser.
      console.error(
        'Quote CRM synchronization failed.',
        crmError instanceof Error ? crmError.message : 'Unknown CRM error.'
      );
    }
    const message = ['Hi Scrap My Car UAE, I would like a free valuation.', '', `Make: ${make}`, `Model: ${model}`, `Year: ${year}`, `Name: ${customerName}`, `Phone: ${whatsapp}`].join('\n');
    return json({ ok: true, requestId: inserted.dataItem?.id ?? '', crmSynced, whatsappUrl: `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}` });
  } catch (error) {
    console.error('Quote submission failed', error);
    return json({ ok: false, message: 'We could not submit your request right now. Please try again.' }, 500);
  }
};
