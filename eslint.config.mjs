import eslint from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

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

  // ─── Web app (Next.js + React) ─────────────────────────
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
    settings: {
      next: {
        rootDir: 'apps/web/',
      },
      react: {
        version: 'detect',
      },
    },
  },

  // ─── shared: console.log in the logger ────────────────
  {
    files: ['packages/shared/src/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // ─── CLI: console.log IS the output ───────────────────
  {
    files: ['apps/cli/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // ─── Relay: allow console for Worker logger ───────────
  {
    files: ['relay/cloudflare/src/utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // ─── Tests and seeds: relaxed rules ───────────────────
  {
    files: ['**/__tests__/**/*.ts', '**/seeds/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
    },
  },

  // ─── Ignored paths ────────────────────────────────────
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
      'apps/web/.next/**',
    ],
  },
);
