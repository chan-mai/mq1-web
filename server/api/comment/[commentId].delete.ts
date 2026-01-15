export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, "commentId");
  const body = await readBody(event);
  const { secret } = body;

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

  try {
    // Check if comment exists and secret matches
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return {
        status: "error",
        message: "Comment not found",
      };
    }

    if (comment.secret !== secret) {
      return {
        status: "error",
        message: "Invalid secret",
      };
    }

    // Delete the comment
    await prisma.comments.delete({
      where: { id: commentId },
    });

    return {
      status: "success",
      message: "Comment deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return {
      status: "error",
      message: "Failed to delete comment",
    };
  }
});
