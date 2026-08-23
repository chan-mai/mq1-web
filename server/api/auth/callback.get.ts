import * as oauth from "oauth4webapi";
import {
  getAuthorizationServer,
  getOidcClient,
  getRedirectUri,
} from "~~/server/utils/oidc";
import { useAdminSession } from "~~/server/utils/session";

export default defineEventHandler(async (event) => {
  const session = await useAdminSession(event);
  const { oidcState, oidcCodeVerifier, returnTo } = session.data;

  if (!oidcState || !oidcCodeVerifier) {
    throw createError({
      statusCode: 400,
      statusMessage: "Login session not found",
    });
  }

  const authorizationServer = await getAuthorizationServer(event);
  const client = getOidcClient(event);

  let claims: oauth.IDToken;
  try {
    const callbackParameters = oauth.validateAuthResponse(
      authorizationServer,
      client,
      getRequestURL(event),
      oidcState,
    );

    const tokenResponse = await oauth.authorizationCodeGrantRequest(
      authorizationServer,
      client,
      oauth.None(),
      callbackParameters,
      getRedirectUri(event),
      oidcCodeVerifier,
    );

    const result = await oauth.processAuthorizationCodeResponse(
      authorizationServer,
      client,
      tokenResponse,
      { requireIdToken: true },
    );

    claims = oauth.getValidatedIdTokenClaims(result)!;
  } catch (error) {
    console.error("OIDC callback failed", error);
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication failed",
    });
  }

  // 認可はZITADEL側のプロジェクト認可チェックに委任
  await session.clear();
  await session.update({
    sub: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    loggedInAt: new Date().toISOString(),
  });

  return sendRedirect(event, returnTo || "/admin", 302);
});
