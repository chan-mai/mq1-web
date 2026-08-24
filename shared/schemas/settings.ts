import * as v from "valibot";

export const settingsPutBodySchema = v.object({
  pinnedArticleIds: v.array(v.pipe(v.string(), v.nonEmpty())),
});
