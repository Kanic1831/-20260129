/**
 * 并发控制工具类
 * 用于限制同时处理的请求数量
 */
export class ConcurrencyLimiter {
  private maxConcurrent: number;
  private running: number;
  private queue: Array<() => void>;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      // 等待直到有空闲槽位
      await new Promise<void>(resolve => {
        this.queue.push(resolve);
      });
    }

    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      // 处理队列中的下一个任务
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next!();
      }
    }
  }
}

// 全局并发限制器
export const limiter = new ConcurrencyLimiter(5); // 最多同时处理5个请求
