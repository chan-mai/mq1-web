import { tagSlugParamsSchema } from '#shared/schemas/tag';
import { fetchTagBySlug } from '~~/server/utils/tag';

export default defineEventHandler(async event => {
	const { slug } = validateParams(event, tagSlugParamsSchema);

	const tag = await fetchTagBySlug(event, slug);
	if (!tag) {
		throw createError({
			statusCode: 404,
			statusMessage: `Tag not found: ${slug}`,
		});
	}
	return tag;
});
