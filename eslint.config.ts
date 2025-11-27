import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import ts from 'typescript-eslint'
import react from '@eslint-react/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-plugin-prettier/recommended'

const GLOB_JS = '**/*.?([cm])js'
const GLOB_JSX = '**/*.?([cm])jsx'
const GLOB_TS = '**/*.?([cm])ts'
const GLOB_TSX = '**/*.?([cm])tsx'

export default defineConfig([
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/output',
      '**/temp',
      '**/.temp',
      '**/tmp',
      '**/.tmp',
      '**/.nuxt',
      '**/.next',
      '**/.svelte-kit',
      '**/.vercel',
      '**/.idea',
      '**/.cache',
      '**/.output',
      '**/.yarn',
    ],
  },
  {
    files: [GLOB_JS, GLOB_JSX],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    extends: [
      prettier,
      js.configs.recommended,
      react.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.recommended,
    ],
  },
  {
    files: [GLOB_TS, GLOB_TSX],
    extends: [
      prettier,
      js.configs.recommended,
      ts.configs.recommended,
      react.configs['recommended-typescript'],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.recommended,
    ],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description' }],
    },
  },
])
