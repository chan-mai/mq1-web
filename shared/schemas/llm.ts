import * as v from "valibot";

export const proofreadBodySchema = v.object({
  text: v.pipe(v.string(), v.trim(), v.nonEmpty()),
});
