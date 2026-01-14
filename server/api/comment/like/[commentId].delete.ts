export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, "commentId");
  const query = getQuery(event);
  const id = query.id as string;

  if (!commentId) {
    return {
        status: "error",
        message: "Comment ID is required",
    };
  }

  if (!id) {
    return {
      status: "error",
      message: "Like ID is required",
    };
  }

  try {
    // コメントに紐づくか確認（任意の安全性チェック）
    const existing = await prisma.commentLike.findFirst({
        where: { id, commentId }
    });

    if (!existing) {
        return {
            status: "error",
            message: "Like not found or mismatch",
        };
    }

    await prisma.commentLike.delete({
      where: { id },
    });
    return { status: "success" };
  } catch (error) {
     console.error("Failed to delete like:", error);
     return {
       status: "error",
       message: "Failed to delete like",
     };
  }
});
