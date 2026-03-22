import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '*.config.ts',
            'packages/*/tsup.config.ts',
            'packages/*/*.config.ts',
            'apps/*/tsup.config.ts',
            'apps/*/*.config.ts',
            'relay/*/*.config.ts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'warn',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // ─── shared: console.log in the logger ────────────────────
  {
    files: ['packages/shared/src/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // ─── CLI: console.log IS the output ────────────────────
  {
    files: ['apps/cli/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // ─── Relay: allow console for Worker logger ────────────
  {
    files: ['relay/cloudflare/src/utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // ─── Tests and seeds: relaxed rules ────────────────────
  {
    files: ['**/__tests__/**/*.ts', '**/seeds/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // ─── Ignored paths ─────────────────────────────────────
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.wrangler/**',
      '**/vite.config.ts',
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
    ],
  },
);