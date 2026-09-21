import { createClient, OAuthStrategy } from '@wix/sdk';
import { posts } from '@wix/blog';

const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;

if (!clientId) {
  throw new Error('PUBLIC_WIX_CLIENT_ID is missing');
}

export const wixClient = createClient({
  modules: {
    posts
  },
  auth: OAuthStrategy({
    clientId
  })
});