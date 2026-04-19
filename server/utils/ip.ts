function parseIPv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map(Number);
  if (nums.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums;
}

function parseIPv6(ip: string): bigint | null {
  try {
    // ::ffff:x.x.x.x IPv4-mapped
    const v4mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (v4mapped) {
      const v4 = parseIPv4(v4mapped[1]!);
      if (!v4) return null;
      return (BigInt(0xffff) << 32n) | BigInt((v4[0]! << 24) | (v4[1]! << 16) | (v4[2]! << 8) | v4[3]!);
    }
    const halves = ip.split('::');
    if (halves.length > 2) return null;
    const expand = (s: string) => s ? s.split(':') : [];
    const left = expand(halves[0] ?? '');
    const right = expand(halves[1] ?? '');
    const missing = 8 - left.length - right.length;
    if (missing < 0) return null;
    const groups = [...left, ...Array(missing).fill('0'), ...right];
    if (groups.length !== 8) return null;
    return groups.reduce((acc, g) => (acc << 16n) | BigInt(parseInt(g, 16)), 0n);
  } catch {
    return null;
  }
}

function inRange4(ip: number[], a: number, b: number, c: number, d: number, prefix: number): boolean {
  const ipNum = (ip[0]! << 24) | (ip[1]! << 16) | (ip[2]! << 8) | ip[3]!;
  const netNum = (a << 24) | (b << 16) | (c << 8) | d;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipNum >>> 0 & mask) === (netNum >>> 0 & mask);
}

export function isValidPublicIp(ip: string): boolean {
  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  const v4mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4mapped) return isValidPublicIp(v4mapped[1]!);

  const v4 = parseIPv4(ip);
  if (v4) {
    // loopback 127.0.0.0/8
    if (inRange4(v4, 127, 0, 0, 0, 8)) return false;
    // private 10.0.0.0/8
    if (inRange4(v4, 10, 0, 0, 0, 8)) return false;
    // private 172.16.0.0/12
    if (inRange4(v4, 172, 16, 0, 0, 12)) return false;
    // private 192.168.0.0/16
    if (inRange4(v4, 192, 168, 0, 0, 16)) return false;
    // link-local 169.254.0.0/16
    if (inRange4(v4, 169, 254, 0, 0, 16)) return false;
    // CGN 100.64.0.0/10
    if (inRange4(v4, 100, 64, 0, 0, 10)) return false;
    // documentation 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24
    if (inRange4(v4, 192, 0, 2, 0, 24)) return false;
    if (inRange4(v4, 198, 51, 100, 0, 24)) return false;
    if (inRange4(v4, 203, 0, 113, 0, 24)) return false;
    // multicast 224.0.0.0/4
    if (inRange4(v4, 224, 0, 0, 0, 4)) return false;
    // broadcast / reserved 240.0.0.0/4
    if (inRange4(v4, 240, 0, 0, 0, 4)) return false;
    // unspecified 0.0.0.0/8
    if (inRange4(v4, 0, 0, 0, 0, 8)) return false;
    return true;
  }

  const v6 = parseIPv6(ip);
  if (v6 !== null) {
    // unspecified ::
    if (v6 === 0n) return false;
    // loopback ::1
    if (v6 === 1n) return false;
    // link-local fe80::/10
    if ((v6 >> 118n) === 0x3f2n) return false;
    // unique local fc00::/7
    if ((v6 >> 121n) === 0x7en) return false;
    // multicast ff00::/8
    if ((v6 >> 120n) === 0xffn) return false;
    return true;
  }

  return false;
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
