export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");
  const userIp = getHeader(event, "x-forwarded-for") || "unknown";

  // リクエストボディを取得
  const body = await readBody(event);
  const { name, comment, token } = body;

  // Turnstileのバリデーション
  const isValid = await verifyTurnstileToken(token || body['cf-turnstile-response']);
  if (isValid.success === false) {
    return {
      status: "error",
      message: "Invalid Turnstile token",
    }
  }

  // バリデーション
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      status: "error",
      message: "Name is required",
    }
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    return {
      status: "error",
      message: "Comment is required",
    }
  }

  // 名前の長さチェック（最大50文字）
  if (name.trim().length > 50) {
    return {
      status: "error",
      message: "Name must be 50 characters or less",
    }
  }

  // コメントの長さチェック（最大1000文字）
  if (comment.trim().length > 1000) {
    return {
      status: "error",
      message: "Comment must be 1000 characters or less",
    }
  }

  try {
    // コメントを作成（デフォルトでPENDINGステータス）
    const newComment = await prisma.comments.create({
      data: {
        contentId,
        name: name.trim(),
        comment: comment.trim(),
        userIp,
        status: "PENDING", // 承認待ち
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
              color: 0xffa500,
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
                  value: comment.trim().length > 1000 
                    ? comment.trim().substring(0, 1000) + "..." 
                    : comment.trim(),
                  inline: false,
                },
              ],
              footer: {
                text: "ステータス: 承認待ち",
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
        console.error("Failed to send Discord webhook notification:", webhookError);
        // webhookの送信失敗はエラーとしない
      }
    }

    return {
      status: "success",
      message: "Comment submitted successfully. It will be visible after approval.",
      comment: {
        id: newComment.id,
        name: newComment.name,
        comment: newComment.comment,
        createdAt: newComment.createdAt,
      },
    }
  } catch (error) {
    console.error("Failed to create comment:", error);
    return {
      status: "error",
      message: "Failed to submit comment",
    }
  }
});

