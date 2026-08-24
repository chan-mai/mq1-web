import type { H3Event } from 'h3';

export interface AdminSessionData {
  sub?: string;
  email?: string;
  loggedInAt?: string;
  oidcState?: string;
  oidcCodeVerifier?: string;
  returnTo?: string;
}

export const useAdminSession = (event: H3Event) => {
  const config = useRuntimeConfig(event);
  const password = config.sessionPassword;

  if (!password || password.length < 32) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Session password is not configured',
    });
  }

  return useSession<AdminSessionData>(event, {
    password,
    name: 'mq1_admin',
    maxAge: 60 * 60 * 24 * 30,
    cookie: {
      httpOnly: true,
      secure: !import.meta.dev,
      sameSite: 'lax',
      path: '/',
    },
  });
};

export const isAuthenticated = async (event: H3Event) => {
  const session = await useAdminSession(event);
  return Boolean(session.data.sub);
};
