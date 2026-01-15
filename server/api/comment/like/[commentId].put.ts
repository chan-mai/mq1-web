import { hashSecret } from "~~/server/utils/hashing";
import crypto from "node:crypto";

export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, "commentId");
  const userIp = getHeader(event, "x-forwarded-for") || "unknown";

  if (!commentId) {
    return {
      status: "error",
      message: "Comment ID is required",
    };
  }

  // コメントの存在確認
  const existingComment = await prisma.comments.findUnique({
    where: { id: commentId },
  });

  if (!existingComment) {
    return {
      status: "error",
      message: "Comment not found",
    };
  }

  try {
    const secret = crypto.randomUUID();
    const hashedSecret = await hashSecret(secret);
    const like = await prisma.commentLike.create({
      data: {
        commentId,
        userIp,
        secret: hashedSecret,
      },
    });
    return { status: "success", id: like.id, secret };
  } catch (error) {
    console.error("Failed to create like:", error);
    return {
      status: "error",
      message: "Failed to create like",
    };
  }
});
