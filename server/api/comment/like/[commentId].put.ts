export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, "commentId");
  const userIp = getHeader(event, "x-forwarded-for") || "unknown";

  if (!commentId) {
    return {
      status: "error",
      message: "Comment ID is required",
    };
  }

  try {
    const like = await prisma.commentLike.create({
      data: {
        commentId,
        userIp,
      },
    });
    return { status: "success", id: like.id };
  } catch (error) {
    console.error("Failed to create like:", error);
    return {
      status: "error",
      message: "Failed to create like",
    };
  }
});
