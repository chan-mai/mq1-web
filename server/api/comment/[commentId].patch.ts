import { verifySecret } from "~~/server/utils/hashing";

export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, "commentId");
  const body = await readBody(event);
  const { secret, comment: newContent } = body;

  if (!commentId) {
    return {
      status: "error",
      message: "Comment ID is required",
    };
  }

  if (!secret) {
    return {
      status: "error",
      message: "Secret is required",
    };
  }

  if (!newContent || typeof newContent !== "string" || newContent.trim().length === 0) {
    return {
      status: "error",
      message: "Content is required",
    };
  }

  if (newContent.trim().length > 1000) {
    return {
      status: "error",
      message: "Comment must be 1000 characters or less",
    };
  }

  try {
    // 1. コメントの存在とシークレットの検証
    const existingComment = await prisma.comments.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return {
        status: "error",
        message: "Comment not found",
      };
    }

    if (!existingComment.secret || !(await verifySecret(secret, existingComment.secret))) {
      return {
        status: "error",
        message: "Invalid secret",
      };
    }

    // 2. 更新実行
    const updatedComment = await prisma.comments.update({
      where: { id: commentId },
      data: {
        comment: newContent.trim(),
        // statusは変更しない（あるいは編集された場合に再度承認待ちにするなら PENDING に戻すが、今回は変更なしとする）
      },
    });

    return {
      status: "success",
      message: "Comment updated successfully",
      comment: updatedComment,
    };
  } catch (error) {
    console.error("Failed to update comment:", error);
    return {
      status: "error",
      message: "Failed to update comment",
    };
  }
});
