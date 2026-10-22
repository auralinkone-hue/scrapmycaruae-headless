import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

const source = await readFile(new URL('../src/lib/blog-author.ts', import.meta.url), 'utf8');
// Execute the real loader against a fake Wix client; these tests make no HTTP requests.
const createLoader = new Function('wixClient', stripTypeScriptTypes(source
  .replace(/^import .*;\n/gm, '')
  .replace(/export /g, '')) + '\nreturn { getBlogAuthor, getBlogAuthorBySlug };');
const memberId = '12345678-1234-4123-8123-123456789abc';
function fixture() {
  const calls = { member: 0, about: 0 };
  const client = {
    members: { async getMember() { calls.member++; return { _id: memberId,
      profile: { nickname: 'SMC UAE Team', photo: { url: 'https://example.com/author.webp' }, slug: 'smc-uae-team' } }; } },
    membersAbout: { queryMemberAbouts() { calls.about++; return {
      eq() { return this; }, limit() { return this; },
      async find() { return { items: [{ content: { nodes: [{ textData: { text: 'Existing biography.' } }] } }] }; }
    }; } }
  };
  return { calls, ...createLoader(client) };
}

test('article byline omits the unused biography request and preserves identity', async () => {
  const f = fixture();
  const author = await f.getBlogAuthor({ memberId }, { includeAbout: false });
  assert.deepEqual(f.calls, { member: 1, about: 0 });
  assert.deepEqual(author, { id: memberId, name: 'SMC UAE Team',
    photoUrl: 'https://example.com/author.webp', slug: 'smc-uae-team' });
  const page = await readFile(new URL('../src/pages/post/[slug].astro', import.meta.url), 'utf8');
  assert.match(page, /getBlogAuthor\(post, \{ includeAbout: false \}\)/);
});

test('default author lookup and author page retain the biography', async () => {
  const f = fixture();
  assert.equal((await f.getBlogAuthor({ memberId })).about, 'Existing biography.');
  assert.equal((await f.getBlogAuthorBySlug(`member-${memberId}`)).about, 'Existing biography.');
  assert.deepEqual(f.calls, { member: 2, about: 2 });
});

test('invalid member IDs never trigger identity or biography requests', async () => {
  const f = fixture();
  assert.equal(await f.getBlogAuthor({ memberId: 'invalid' }, { includeAbout: false }), null);
  assert.deepEqual(f.calls, { member: 0, about: 0 });
});
