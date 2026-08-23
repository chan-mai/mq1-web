import { useAdminSession } from "~~/server/utils/session";

const isAdminApiPath = (pathname: string) =>
  pathname === "/api/admin" || pathname.startsWith("/api/admin/");

const isAdminPagePath = (pathname: string) =>
  pathname === "/admin" || pathname.startsWith("/admin/");

export default defineEventHandler(async (event) => {
  const pathname = event.path.split("?")[0] ?? "";

  if (isAdminApiPath(pathname)) {
    const session = await useAdminSession(event);
    if (!session.data.sub) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    // CSRF対策: 非GETはOrigin一致を要求
    if (event.method !== "GET" && event.method !== "HEAD") {
      const origin = getHeader(event, "origin");
      if (origin && origin !== getRequestURL(event).origin) {
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
      }
    }
    return;
  }

  if (isAdminPagePath(pathname)) {
    const session = await useAdminSession(event);
    if (!session.data.sub) {
      return sendRedirect(
        event,
        `/api/auth/login?returnTo=${encodeURIComponent(event.path)}`,
        302,
      );
    }
  }
});
