import * as oauth from "oauth4webapi";
import type { H3Event } from "h3";

// discovery結果のisolate内キャッシュ
let cachedAuthorizationServer: oauth.AuthorizationServer | null = null;

const getZitadelConfig = (event: H3Event) => {
  const config = useRuntimeConfig(event);
  const { issuer, clientId } = config.zitadel;

  if (!issuer || !clientId) {
    throw createError({
      statusCode: 500,
      statusMessage: "ZITADEL configuration is missing",
    });
  }

  return { issuer, clientId };
};

export const getAuthorizationServer = async (event: H3Event) => {
  if (cachedAuthorizationServer) return cachedAuthorizationServer;

  const { issuer } = getZitadelConfig(event);
  const issuerUrl = new URL(issuer);
  const response = await oauth.discoveryRequest(issuerUrl, {
    algorithm: "oidc",
  });
  cachedAuthorizationServer = await oauth.processDiscoveryResponse(
    issuerUrl,
    response,
  );
  return cachedAuthorizationServer;
};

export const getOidcClient = (event: H3Event): oauth.Client => {
  const { clientId } = getZitadelConfig(event);
  return { client_id: clientId };
};

export const getRedirectUri = (event: H3Event) => {
  const origin = getRequestURL(event).origin;
  return new URL("/api/auth/callback", origin).href;
};
