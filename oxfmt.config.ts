import { defineOxfmtConfig } from '@chan-mai/oxc-config';

export default defineOxfmtConfig({
	overrides: {
		ignorePatterns: ['**/dist/**', '.nuxt/**', '.output/**', '.wrangler/**', '.pnpm-store/**', 'scripts/migration-data/**'],
	},
});
