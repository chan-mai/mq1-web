import { createError } from 'h3';

import type { R2Bucket } from '@cloudflare/workers-types';
import type { H3Event } from 'h3';

export const getR2Bucket = (event: H3Event) => {
	const bucket = (event.context as { cloudflare?: { env?: Record<string, unknown> } }).cloudflare?.env?.IMAGES as R2Bucket | undefined;
	if (!bucket) {
		throw createError({
			statusCode: 500,
			statusMessage: 'R2 binding not configured',
			message: 'Cloudflare R2 binding `IMAGES` is missing',
		});
	}
	return bucket;
};
