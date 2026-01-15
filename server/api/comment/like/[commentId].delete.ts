export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, "commentId");
  const body = await readBody(event);
  const { id, secret } = body;

  if (!commentId) {
    return {
        status: "error",
        message: "Comment ID is required",
    };
  }

  if (!id || !secret) {
    return {
      status: "error",
      message: "Like ID and secret are required",
    };
  }

  try {
    // 存在確認とシークレット照合
    const existing = await prisma.commentLike.findFirst({
        where: { id, commentId }
    });

    if (!existing) {
        return {
            status: "error",
            message: "Like not found",
        };
    }

    if (existing.secret !== secret) {
        return {
            status: "error",
            message: "Invalid secret",
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
