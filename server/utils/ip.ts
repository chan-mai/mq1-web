/**
 * IPアドレスを取得する（プロキシ考慮）
 */
export function getClientIP(event: any): string {
  const headers = getHeaders(event);

  // プロキシヘッダーをチェック
  const forwardedFor = headers["x-forwarded-for"];
  if (forwardedFor) {
    const ips = forwardedFor.split(",");
    return ips[0]?.trim() || "unknown";
  }

  const realIP = headers["x-real-ip"];
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers["cf-connecting-ip"];
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // フォールバック
  return event.node?.req?.socket?.remoteAddress || "unknown";
}
