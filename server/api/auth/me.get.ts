import { useAdminSession } from '~~/server/utils/session';

export default defineEventHandler(async (event) => {
  const session = await useAdminSession(event);

  if (!session.data.sub) {
    return { authenticated: false as const };
  }

  return {
    authenticated: true as const,
    sub: session.data.sub,
    email: session.data.email,
  };
});
