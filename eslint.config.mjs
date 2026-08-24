import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

const sharedTsRules = {
  semi: ['error', 'always'],
  quotes: [2, 'single', { avoidEscape: true }],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/node_modules/**',
      '**/generated/**',
      '**/.wrangler/**',
      '.pnpm-store/**',
      'scripts/migration-data/**',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
    },
    rules: {
      ...sharedTsRules,
      'space-before-blocks': [2, 'always'],
      'space-in-parens': [2, 'never'],
    },
  },
  // サーバーサイドはNode, クライアントのみbrowser
  {
    files: [
      'server/**/*.ts',
      'scripts/**/*.ts',
      'shared/**/*.ts',
      'tests/**/*.ts',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['app/**/*.{ts,vue}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.vue'],
    extends: [...tseslint.configs.recommended],
    plugins: { vue: pluginVue },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: globals.browser,
    },
    rules: {
      ...pluginVue.configs['flat/recommended'].rules,
      ...sharedTsRules,
    },
  },
);
