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

