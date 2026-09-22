import type { APIRoute } from 'astro';
import { wixClient } from '../../lib/wix';

export const prerender = false;

const INSERT_URL = 'https://www.wixapis.com/data/v2/items';
const QUERY_URL = 'https://www.wixapis.com/data/v2/items/query';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

function cleanText(value: unknown, max = 100) {
  return String(value ?? '').trim().slice(0, max);
}

async function queryOne(
  accessToken: string,
  collectionId: string,
  filter: Record<string, unknown>
) {
  const response = await fetch(QUERY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: accessToken
    },
    body: JSON.stringify({
      dataCollectionId: collectionId,
      query: {
        filter,
        paging: { limit: 1, offset: 0 }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`${collectionId} validation query failed`);
  }

  const data = await response.json();
  return (data.dataItems ?? [])[0] ?? null;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (cleanText(body?.website, 200)) {
      return json({ ok: true });
    }

    const make = cleanText(body?.make, 80);
    const model = cleanText(body?.model, 120);
    const year = Number(body?.year);
    const customerName = cleanText(body?.name, 120);
    const countryCode = cleanText(body?.countryCode, 8);
    const whatsappLocal = cleanText(body?.whatsapp, 40).replace(/[^\d]/g, '');

    if (!make || !model || !Number.isInteger(year) || !customerName || !countryCode || !whatsappLocal) {
      return json({ ok: false, message: 'Please complete all required fields.' }, 400);
    }

    if (!/^\+\d{1,4}$/.test(countryCode)) {
      return json({ ok: false, message: 'Please select a valid country code.' }, 400);
    }

    const whatsappDigits = countryCode.replace('+', '') + whatsappLocal.replace(/^0+/, '');

    if (whatsappDigits.length < 7 || whatsappDigits.length > 15) {
      return json({ ok: false, message: 'Please enter a valid mobile number.' }, 400);
    }

    const tokens = await wixClient.auth.generateVisitorTokens();
    const accessToken = tokens.accessToken?.value;

    if (!accessToken) {
      throw new Error('Could not generate Wix visitor token.');
    }

    const [makeRow, modelRow, yearRow] = await Promise.all([
      queryOne(accessToken, 'VehicleMakes', {
        $and: [{ active: true }, { make }]
      }),
      queryOne(accessToken, 'VehicleModels', {
        $and: [{ active: true }, { make }, { model }]
      }),
      queryOne(accessToken, 'VehicleYears', {
        $and: [{ active: true }, { year }]
      })
    ]);

    if (!makeRow || !modelRow || !yearRow) {
      return json({ ok: false, message: 'Please select a valid vehicle from the dropdowns.' }, 400);
    }

    const whatsapp = `+${whatsappDigits}`;
    const title = `${make} ${model} ${year} - ${customerName}`;

    const insertResponse = await fetch(INSERT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: accessToken
      },
      body: JSON.stringify({
        dataCollectionId: 'QuoteRequests',
        dataItem: {
          data: {
            title,
            make,
            model,
            year,
            customerName,
            whatsapp,
            status: 'New',
            source: 'Headless Website'
          }
        }
      })
    });

    if (!insertResponse.ok) {
      const detail = await insertResponse.text();
      throw new Error(`QuoteRequests insert failed: ${insertResponse.status} ${detail}`);
    }

    const inserted = await insertResponse.json();
    const requestId = inserted.dataItem?.id ?? '';

    return json({
      ok: true,
      requestId,
      redirect: requestId
        ? `/thank-you?request=${encodeURIComponent(requestId)}`
        : '/thank-you'
    });
  } catch (error) {
    console.error('Quote submission failed', error);
    return json(
      {
        ok: false,
        message: 'We could not submit your request right now. Please try again.'
      },
      500
    );
  }
};
