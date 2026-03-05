export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'test', 'refactor', 'style', 'ci', 'perf', 'revert'],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
  },
};
