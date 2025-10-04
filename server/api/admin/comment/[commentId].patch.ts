// 管理者用：コメントのステータスを更新（承認/拒否）
export default defineEventHandler(async (event) => {
  // セッション認証チェック
  await requireAdminSession(event);

  const commentId = getRouterParam(event, "commentId");
  const body = await readBody(event);
  const { status } = body;

  // ステータスのバリデーション
  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  if (!status || !validStatuses.includes(status)) {
    return {
      status: "error",
      message: "Invalid status. Must be PENDING, APPROVED, or REJECTED",
    }
  }

  try {
    // コメントが存在するか確認
    const existingComment = await prisma.comments.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return {
        status: "error",
        message: "Comment not found",
      }
    }

    // ステータスを更新
    const updatedComment = await prisma.comments.update({
      where: { id: commentId },
      data: { status },
    });

    return {
      status: "success",
      message: `Comment ${status.toLowerCase()} successfully`,
      comment: {
        id: updatedComment.id,
        status: updatedComment.status,
        updatedAt: updatedComment.updatedAt,
      },
    }
  } catch (error) {
    console.error("Failed to update comment status:", error);
    return {
      status: "error",
      message: "Failed to update comment status",
    }
  }
});

