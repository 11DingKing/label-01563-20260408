/**
 * Commitlint 配置
 * 规范 Git Commit Message 格式
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 Bug
        'docs',     // 文档变更
        'style',    // 代码格式（不影响功能）
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'build',    // 构建系统或外部依赖变更
        'ci',       // CI 配置变更
        'chore',    // 其他杂项
        'revert',   // 回滚提交
      ],
    ],
    'subject-case': [0], // 允许中文提交信息
    'subject-max-length': [2, 'always', 100],
  },
};
