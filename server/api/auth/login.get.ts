import * as oauth from 'oauth4webapi';
import {
  getAuthorizationServer,
  getOidcClient,
  getRedirectUri,
} from '~~/server/utils/oidc';
import { useAdminSession } from '~~/server/utils/session';

// openリダイレクト防止のためサイト内パスのみ許可
const sanitizeReturnTo = (value: unknown) => {
  if (typeof value !== 'string') return '/admin';
  if (!value.startsWith('/') || value.startsWith('//')) return '/admin';
  return value;
};

export default defineEventHandler(async (event) => {
  const authorizationServer = await getAuthorizationServer(event);
  const client = getOidcClient(event);

  const codeVerifier = oauth.generateRandomCodeVerifier();
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
  const state = oauth.generateRandomState();

  const session = await useAdminSession(event);
  await session.update({
    oidcState: state,
    oidcCodeVerifier: codeVerifier,
    returnTo: sanitizeReturnTo(getQuery(event).returnTo),
  });

  const authorizationUrl = new URL(authorizationServer.authorization_endpoint!);
  authorizationUrl.searchParams.set('client_id', client.client_id);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('redirect_uri', getRedirectUri(event));
  authorizationUrl.searchParams.set('scope', 'openid profile email');
  authorizationUrl.searchParams.set('code_challenge', codeChallenge);
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');
  authorizationUrl.searchParams.set('state', state);

  return sendRedirect(event, authorizationUrl.href, 302);
});
