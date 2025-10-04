// 管理者用：コメントを削除
export default defineEventHandler(async (event) => {
  // セッション認証チェック
  await requireAdminSession(event);

  const commentId = getRouterParam(event, "commentId");

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

    // コメントを削除
    await prisma.comments.delete({
      where: { id: commentId },
    });

    return {
      status: "success",
      message: "Comment deleted successfully",
      commentId,
    }
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return {
      status: "error",
      message: "Failed to delete comment",
    }
  }
});

