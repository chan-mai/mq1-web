export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");
  const userIp = getHeader(event, "x-forwarded-for");

  try {
    // likeからcontentIdが一致するものの件数を取得
    const count = await prisma.articleLike.count({
      where: {
        contentId,
      },
    });
  
    return {
      status: "success",
      count,
      userIp,
    }

  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Failed to get like count",
      userIp,
    }
  }
});
