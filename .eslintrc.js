module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2022: true
  },
  ignorePatterns: [
    'dist/',
    'build/',
    '.next/',
    'node_modules/',
    '*.js'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      files: ['apps/web/**/*', 'apps/admin/**/*'],
      extends: [
        'next/core-web-vitals'
      ],
      env: {
        browser: true
      }
    },
    {
      files: ['services/**/*'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'warn'
      }
    }
  ]
};