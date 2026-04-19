import ipaddr from 'ipaddr.js';

export function isValidPublicIp(ip: string): boolean {
  if (!ipaddr.isValid(ip)) return false;
  try {
    const addr = ipaddr.parse(ip);
    const blockedRanges = [
      'private', 'loopback', 'linkLocal', 'uniqueLocal',
      'multicast', 'reserved', 'broadcast', 'carrierGradeNat',
      'documentation', 'unspecified',
    ];
    if (blockedRanges.includes(addr.range())) return false;
    if (addr.kind() === 'ipv6') {
      const ipv6 = addr as ipaddr.IPv6;
      if (ipv6.isIPv4MappedAddress()) return isValidPublicIp(ipv6.toIPv4Address().toString());
    }
    return true;
  } catch {
    return false;
  }
}

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
