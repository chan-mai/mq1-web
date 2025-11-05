import { prisma } from "./prisma";

/**
 * RSSリーダーの種類を判別する
 */
export function detectRSSReader(userAgent: string | null | undefined): string {
  if (!userAgent) {
    return "Unknown";
  }

  const ua = userAgent.toLowerCase();

  // 主要なRSSリーダーを判別
  const readers: { [key: string]: RegExp } = {
    Feedly: /feedly/i,
    Inoreader: /inoreader/i,
    NewsBlur: /newsblur/i,
    "The Old Reader": /theoldreader/i,
    Feedbin: /feedbin/i,
    Miniflux: /miniflux/i,
    FreshRSS: /freshrss/i,
    NetNewsWire: /netnewswire/i,
    Reeder: /reeder/i,
    Vienna: /vienna/i,
    ReadKit: /readkit/i,
    Feedreader: /feedreader/i,
    Akregator: /akregator/i,
    QuiteRSS: /quiterss/i,
    "Apple News": /applenews|applebot/i,
    "Google Podcast": /google.*podcast/i,
    "Pocket Casts": /pocketcasts/i,
    Overcast: /overcast/i,
    Castro: /castro/i,
    Slack: /slackbot/i,
    Telegram: /telegram/i,
    WordPress: /wordpress/i,
    "RSS Bot": /rss.*bot|feedfetcher|feedparser/i,
  };

  // リーダーの種類を判別
  for (const [name, pattern] of Object.entries(readers)) {
    if (pattern.test(ua)) {
      return name;
    }
  }

  // ブラウザからの直接アクセスを判別
  if (
    /mozilla|chrome|safari|firefox|edge|opera/i.test(ua) &&
    !/bot/i.test(ua)
  ) {
    return "Browser";
  }

  // Botを判別
  if (/bot|crawler|spider|scraper/i.test(ua)) {
    return "Bot";
  }

  return "Other";
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
    return ips[0].trim();
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

/**
 * フィードアクセスログを非同期で記録
 */
export async function logFeedAccessAsync(event: any) {
  // レスポンスをブロックしないように、Promiseをawaitせずにバックグラウンドで実行
  const userAgent = getHeader(event, "user-agent");
  const referer = getHeader(event, "referer");
  const ipAddress = getClientIP(event);
  const readerType = detectRSSReader(userAgent);

  // 非同期でログ記録（エラーが起きてもメインの処理に影響しない）
  setImmediate(async () => {
    try {
      await prisma.feedAccessLog.create({
        data: {
          userAgent: userAgent?.substring(0, 500) || null, // User-Agentが長すぎる場合は切り詰め
          readerType,
          ipAddress: ipAddress.substring(0, 100),
          referer: referer?.substring(0, 500) || null,
        },
      });
    } catch (error) {
      // エラーをログに出力するが、メイン処理は継続
      console.error("Failed to log feed access:", error);
    }
  });
}
