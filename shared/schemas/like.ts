import * as v from 'valibot';
import { nonEmptyId } from './common';

export const likeParamsSchema = v.object({ contentId: nonEmptyId });

// secretはUUID形式非強制(legacy値許容)
export const likeDeleteBodySchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty(), v.maxLength(64)),
  secret: v.pipe(v.string(), v.nonEmpty(), v.maxLength(128)),
});
