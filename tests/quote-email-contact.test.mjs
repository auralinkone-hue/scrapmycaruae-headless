import assert from 'node:assert/strict';
import test from 'node:test';
import { buildQuoteEmail, customerContactLinks, notificationKey } from '../src/lib/quote-notifications.ts';

const quote = {
  requestId: 'saved-staging-enquiry', collectionId: 'QuoteRequestsStaging',
  customerName: 'Test Customer', whatsapp: '971501234567', contactPhoneInput: '+971 50 123 4567',
  make: 'TOYOTA', model: 'CAMRY', year: '2014',
  savedAt: '2026-10-22T09:00:00.000Z', sourcePath: '/cars/toyota/'
};
const email = data => buildQuoteEmail(data, { email: 'sender@example.test', name: 'Scrap My Car UAE' }, true, 'a'.repeat(64));

for (const [label, input, international] of [
  ['UAE', '+971 50 123 4567', '971501234567'],
  ['UAE 00 prefix', '00971 50 123 4567', '971501234567'],
  ['UK', '+44 7742 107109', '447742107109'],
  ['UK 00 prefix', '0044 7742 107109', '447742107109'],
  ['US', '+1 (202) 555-0123', '12025550123'],
  ['Pakistan', '+92 300 1234567', '923001234567'],
  ['Italy significant zero', '+39 06 6982 0000', '390669820000']
]) {
  test(`${label}: explicit international number produces matching WhatsApp and call destinations`, () => {
    const data = { ...quote, whatsapp: input.replace(/\D/g, ''), contactPhoneInput: input };
    const links = customerContactLinks(data);
    assert.equal(new URL(links.whatsapp).pathname, `/${international}`);
    assert.equal(links.call, `tel:+${international}`);
    const rendered = email(data);
    assert.ok(rendered.htmlContent.includes(`href="${links.call}"`));
    assert.ok(rendered.htmlContent.includes(`href="${links.whatsapp}"`));
    assert.ok(rendered.textContent.includes(`WhatsApp Customer: ${links.whatsapp}`));
    assert.ok(rendered.textContent.includes(`Call Customer: ${links.call}`));
  });
}

test('ambiguous, invalid and mismatching numbers never produce guessed contact destinations', () => {
  const invalid = [
    '0501234567', '07742107109', '971501234567', '447742107109',
    '+0 123456789', '+999123456789', '+971123', '+9711234567890123',
    '+971 050 123 4567', '+44 07742 107109', '+44 (0) 7742 107109',
    '+971501234567 ext 12', 'javascript:alert(1)', '++971501234567', '+97150123\n4567'
  ];
  for (const input of invalid) {
    const data = { ...quote, whatsapp: input.replace(/\D/g, ''), contactPhoneInput: input };
    assert.equal(customerContactLinks(data), null, input);
    const rendered = email(data);
    assert.doesNotMatch(rendered.htmlContent, /href="(?:tel:|https:\/\/wa\.me\/)/);
    assert.doesNotMatch(rendered.textContent, /(?:tel:|https:\/\/wa\.me\/)/);
    assert.match(rendered.textContent, /Confirm the customer’s international country code/);
  }
  assert.equal(customerContactLinks({ ...quote, contactPhoneInput: '+44 7742 107109' }), null);
  assert.equal(customerContactLinks({ ...quote, contactPhoneInput: undefined }), null);
  assert.equal(customerContactLinks({ ...quote, contactPhoneInput: undefined, whatsapp: '+971501234567' }).call, 'tel:+971501234567');
});

test('prefill references the saved customer and vehicle, URL-encodes special characters and never sends a message', () => {
  const data = { ...quote, customerName: 'Amina & O’Neil <Test>', make: 'BMW & MINI', model: 'X3 / "Sport"', year: '2015' };
  const links = customerContactLinks(data);
  const url = new URL(links.whatsapp);
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.searchParams.get('text'), 'Hi Amina & O’Neil <Test>, this is Scrap My Car UAE regarding your 2015 BMW & MINI X3 / "Sport" valuation enquiry.');
  assert.equal([...url.searchParams.keys()].join(), 'text');
  assert.doesNotMatch(links.whatsapp, /[<>"\s]/);
  const rendered = email(data);
  assert.match(rendered.htmlContent, /Amina &amp; O’Neil &lt;Test&gt;/);
  assert.match(rendered.htmlContent, /BMW &amp; MINI/);
  assert.match(rendered.htmlContent, /X3 \/ &quot;Sport&quot;/);
  assert.ok(rendered.textContent.includes(links.whatsapp));
});

test('hostile customer text stays escaped and message line breaks are removed', () => {
  const data = { ...quote, customerName: '<script>alert("x")</script>\r\nInjected', model: "CAMRY ' onclick='bad" };
  const rendered = email(data);
  assert.doesNotMatch(rendered.htmlContent, /<script|onclick='bad/);
  assert.match(rendered.htmlContent, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(rendered.htmlContent, /&#39; onclick=&#39;bad/);
  assert.doesNotMatch(new URL(customerContactLinks(data).whatsapp).searchParams.get('text'), /[\r\n]/);
});

test('email preserves saved details and staging warning with table-based inline contact buttons below details', () => {
  const rendered = email(quote);
  for (const value of [quote.requestId, quote.whatsapp, quote.sourcePath, quote.collectionId, quote.savedAt, 'Headless Website']) {
    assert.ok(rendered.htmlContent.includes(value));
    assert.ok(rendered.textContent.includes(value));
  }
  assert.match(rendered.subject, /^\[STAGING TEST\]/);
  assert.match(rendered.htmlContent, /Staging test enquiry only/);
  assert.ok(rendered.htmlContent.indexOf('WhatsApp Customer') > rendered.htmlContent.indexOf('CMS collection'));
  assert.ok(rendered.htmlContent.indexOf('Call Customer') < rendered.htmlContent.indexOf('Internal notification'));
  assert.match(rendered.htmlContent, /<table role="presentation"/);
  assert.match(rendered.htmlContent, /padding:16px 20px/);
  assert.doesNotMatch(rendered.htmlContent, /<(script|style|link|img)\b/i);
});

test('notification-only phone formatting does not change the duplicate-protection identity', async () => {
  assert.equal(await notificationKey(quote), await notificationKey({ ...quote, contactPhoneInput: undefined }));
});
