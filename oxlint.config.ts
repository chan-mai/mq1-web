import { defineOxlintConfig } from '@chan-mai/oxc-config';

export default defineOxlintConfig({
	features: {
		nuxt: true,
		vitest: true,
	},
	overrides: {
		ignorePatterns: ['**/dist/**', '.nuxt/**', '.output/**', '**/generated/**', '.wrangler/**', '.pnpm-store/**', 'scripts/migration-data/**'],
	},
});
