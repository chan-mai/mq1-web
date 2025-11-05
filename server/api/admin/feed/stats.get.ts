import { requirePermission } from "../../../utils/auth";
import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  // 管理者権限チェック
  await requirePermission(event, "FEED_STATS_VIEW");

  const query = getQuery(event);
  const period = (query.period as string) || "week"; // day, week, month, year, all

  try {
    // 期間の開始日を計算
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = new Date(0); // Unix epoch
        break;
    }

    // 総アクセス数
    const totalAccess = await prisma.feedAccessLog.count({
      where: {
        accessedAt: {
          gte: startDate,
        },
      },
    });

    // ユニークIP数（推定購読者数）
    const uniqueIPs = await prisma.feedAccessLog.groupBy({
      by: ["ipAddress"],
      where: {
        accessedAt: {
          gte: startDate,
        },
      },
      _count: {
        ipAddress: true,
      },
    });

    // リーダーの種類別統計
    const readerStats = await prisma.feedAccessLog.groupBy({
      by: ["readerType"],
      where: {
        accessedAt: {
          gte: startDate,
        },
      },
      _count: {
        readerType: true,
      },
      orderBy: {
        _count: {
          readerType: "desc",
        },
      },
    });

    // 日別アクセス統計（過去30日）
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyStats = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT 
        DATE_TRUNC('day', accessed_at) as date,
        COUNT(*) as count
      FROM feed_access_logs
      WHERE accessed_at >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('day', accessed_at)
      ORDER BY date ASC
    `;

    // 時間帯別アクセス統計
    const hourlyStats = await prisma.$queryRaw<
      Array<{ hour: number; count: bigint }>
    >`
      SELECT 
        EXTRACT(HOUR FROM accessed_at) as hour,
        COUNT(*) as count
      FROM feed_access_logs
      WHERE accessed_at >= ${startDate}
      GROUP BY EXTRACT(HOUR FROM accessed_at)
      ORDER BY hour ASC
    `;

    // アクティブな購読者（選択期間内に2回以上アクセスしたIP）
    const activeSubscribers = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM (
        SELECT ip_address
        FROM feed_access_logs
        WHERE accessed_at >= ${startDate}
        GROUP BY ip_address
        HAVING COUNT(*) >= 2
      ) as active_ips
    `;

    // 最近のアクセス（上位10件）
    const recentAccess = await prisma.feedAccessLog.findMany({
      take: 10,
      orderBy: {
        accessedAt: "desc",
      },
      select: {
        readerType: true,
        ipAddress: true,
        accessedAt: true,
      },
    });

    return {
      period,
      startDate,
      summary: {
        totalAccess,
        uniqueSubscribers: uniqueIPs.length,
        activeSubscribers: Number(activeSubscribers[0]?.count || 0),
      },
      readerStats: readerStats.map((stat) => ({
        readerType: stat.readerType || "Unknown",
        count: stat._count.readerType,
        percentage: ((stat._count.readerType / totalAccess) * 100).toFixed(2),
      })),
      dailyStats: dailyStats.map((stat) => ({
        date: stat.date,
        count: Number(stat.count),
      })),
      hourlyStats: hourlyStats.map((stat) => ({
        hour: Number(stat.hour),
        count: Number(stat.count),
      })),
      recentAccess: recentAccess.map((access) => ({
        readerType: access.readerType || "Unknown",
        ipAddress: access.ipAddress,
        accessedAt: access.accessedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching feed stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch feed statistics",
    });
  }
});
