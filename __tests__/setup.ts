import { beforeEach, afterEach, vi } from 'vitest';

// 在每个测试之前运行
beforeEach(() => {
  // 重置所有的 mock
  vi.clearAllMocks();
});

// 在每个测试之后运行
afterEach(() => {
  // 清理工作
  vi.restoreAllMocks();
});
