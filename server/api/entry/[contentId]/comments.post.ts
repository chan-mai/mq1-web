import { hashSecret } from "~~/server/utils/hashing";
import { articleExists } from "~~/server/utils/article";
import { type CommentStatus } from "~~/generated/prisma/enums";
import crypto from "node:crypto";

export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");
  const userIp = getHeader(event, "x-forwarded-for") || "unknown";

  if (!contentId) {
    return {
      status: "error",
      message: "Content ID is required",
    };
  }

  // リクエストボディを取得
  const body = await readBody(event);
  let { comment } = body;
  const { name, token } = body;

  // Turnstileのバリデーション
  const isValid = await verifyTurnstileToken(
    token || body["cf-turnstile-response"]
  );
  if (isValid.success === false) {
    return {
      status: "error",
      message: "Invalid Turnstile token",
    };
  }

  // バリデーション
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return {
      status: "error",
      message: "Name is required",
    };
  }

  if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
    return {
      status: "error",
      message: "Comment is required",
    };
  }

  // 名前の長さチェック（最大50文字）
  if (name.trim().length > 50) {
    return {
      status: "error",
      message: "Name must be 50 characters or less",
    };
  }

  // コメントの長さチェック（最大1000文字）
  if (comment.trim().length > 1000) {
    return {
      status: "error",
      message: "Comment must be 1000 characters or less",
    };
  }

  const exists = await articleExists(contentId);
  if (!exists) {
    return {
      status: "error",
      message: "Article not found",
    };
  }

  // 親コメントIDのチェック
  let parentCommentId: string | undefined = undefined;
  if (body.parentCommentId !== undefined && body.parentCommentId !== null) {
    if (typeof body.parentCommentId !== 'string') {
      return {
        status: 'error',
        message: 'Parent comment ID must be a string',
      };
    }

    const parentComment = await prisma.comments.findUnique({
      where: { id: body.parentCommentId },
    });

    if (!parentComment) {
      return {
        status: 'error',
        message: 'Parent comment not found',
      };
    }

    // 親コメントが同じ記事に対するものかチェック
    if (parentComment.contentId !== contentId) {
      return {
        status: 'error',
        message: 'Parent comment belongs to different content',
      };
    }

    parentCommentId = body.parentCommentId;
  }

  try {
    // シークレットを生成
    const secret = crypto.randomUUID();
    const hashedSecret = await hashSecret(secret);

    let status: CommentStatus = "APPROVED"; // デフォルトは承認
    const REJECTION_REASON: string[] = [];

    // IPレピュテーションチェック
    if (userIp !== "unknown" && userIp !== "127.0.0.1" && userIp !== "::1") {
      try {
        const ipResponse = await $fetch<any>(
          `http://ip-api.com/json/${userIp}?fields=status,countryCode,proxy,hosting`
        );
        
        if (ipResponse.status === "success") {
          // 日本以外はPENDING
          if (ipResponse.countryCode !== "JP") {
             status = "PENDING";
             REJECTION_REASON.push(`Region: ${ipResponse.countryCode}`);
          }
          // プロキシ利用はPENDING
          if (ipResponse.proxy) {
             status = "PENDING";
             REJECTION_REASON.push("Proxy detected");
          }
          // ホスティング/データセンターはPENDING
          if (ipResponse.hosting) {
             status = "PENDING";
             REJECTION_REASON.push("Hosting IP detected");
          }
        }
      } catch (e) {
        console.error("IP Reputation check failed:", e);
        // PENDINGに倒す
        status = "PENDING";
        REJECTION_REASON.push("IP Reputation check failed");
      }
    }

    // 連投チェック
    // 直近30分間に同一IPから3件以上の投稿がある場合
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentCommentsCount = await prisma.comments.count({
      where: {
        userIp: userIp,
        createdAt: {
          gt: thirtyMinutesAgo,
        },
      },
    });

    if (recentCommentsCount >= 3) {
      status = "PENDING";
      REJECTION_REASON.push(`Rate limit exceeded (${recentCommentsCount} comments in 10m)`);
    }

    // 重複投稿チェック
    // 直近10時間以内に同一IPから全く同じ内容の投稿がある場合
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
    const duplicateComment = await prisma.comments.findFirst({
       where: {
         userIp: userIp,
         comment: comment.trim(),
         createdAt: {
            gt: tenHoursAgo,
         }
       }
    });

    if (duplicateComment) {
       status = "PENDING";
       REJECTION_REASON.push("Duplicate content detected");
    }

    // ログ出力 (デバッグ用)
    if (status === "PENDING") {
      console.log(`[SmartApproval] Comment set to PENDING. IP: ${userIp}, Reasons: ${REJECTION_REASON.join(", ")}`);
    }

    // コメントを作成
    const newComment = await prisma.comments.create({
      data: {
        contentId,
        name: name.trim(),
        comment: comment.trim(),
        userIp,
        status,
        parentCommentId,
        secret: hashedSecret,
      },
    });

    // Discord webhook通知を送信（非同期で実行、失敗してもコメント投稿は成功）
    const config = useRuntimeConfig();
    if (config.discord?.webhookUrl) {
      try {
        const siteUrl = config.public.siteUrl;
        const webhookPayload = {
          embeds: [
            {
              title: "🆕 新しいコメントが投稿されました",
              url: `${siteUrl}admin/comments`,
              color: newComment.status === "APPROVED" ? 0x00ff00 : 0xffa500,
              fields: [
                {
                  name: "記事ID",
                  value: contentId,
                  inline: true,
                },
                {
                  name: "投稿者",
                  value: name.trim(),
                  inline: true,
                },
                {
                  name: "IPアドレス",
                  value: userIp,
                  inline: true,
                },
                {
                  name: "コメント内容",
                  value:
                    comment.trim().length > 1000
                      ? comment.trim().substring(0, 1000) + "..."
                      : comment.trim(),
                  inline: false,
                },
              ],
              footer: {
                text: `ステータス: ${
                  newComment.status === "APPROVED" ? "承認済み" : "承認待ち"
                }`,
              },
              timestamp: new Date().toISOString(),
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 5,
                  label: "記事を見る",
                  url: `${siteUrl}entry/${contentId}`,
                },
                {
                  type: 2,
                  style: 5,
                  label: "管理画面を開く",
                  url: `${siteUrl}admin/comments`,
                },
              ],
            },
          ],
        };

        await $fetch(config.discord.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: webhookPayload,
        });
      } catch (webhookError) {
        console.error(
          "Failed to send Discord webhook notification:",
          webhookError
        );
        // webhookの送信失敗はエラーとしない
      }
    }

    return {
      status: "success",
      message:
        "Comment submitted successfully. It will be visible after approval.",
      comment: {
        id: newComment.id,
        name: newComment.name,
        comment: newComment.comment,
        createdAt: newComment.createdAt,
        status: newComment.status,
        secret: secret,
      },
    };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return {
      status: "error",
      message: "Failed to submit comment",
    };
  }
});
