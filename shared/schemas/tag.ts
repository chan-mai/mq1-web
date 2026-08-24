import * as v from 'valibot';
import { nonEmptyId, tagSlug } from './common';

export const tagUpsertBodySchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty()),
  slug: tagSlug,
});

export const tagIdParamsSchema = v.object({ id: nonEmptyId });

export const tagSlugParamsSchema = v.object({ slug: nonEmptyId });

export const tagOgParamsSchema = v.object({ tagId: nonEmptyId });
