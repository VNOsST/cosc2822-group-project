//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      '.output/**',
      'dist/**',
      'build/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      'no-shadow': 'warn',
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],
    },
  },
]
