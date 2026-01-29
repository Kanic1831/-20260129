import {
  ILLMProvider,
  LLMMessage,
  LLMConfig,
  LLMResponse,
  LLMStreamChunk,
} from './LLMProvider';

/**
 * Mock Provider 配置接口
 */
export interface MockProviderConfig {
  /**
   * 预设的响应内容（用于 invoke）
   */
  mockResponse?: string;

  /**
   * 预设的流式响应内容（用于 stream）
   */
  mockStreamResponse?: string;

  /**
   * 流式输出的延迟时间（毫秒）
   */
  streamDelay?: number;

  /**
   * 是否启用流式输出
   */
  enableStream?: boolean;
}

/**
 * Mock Provider 实现
 * 用于单元测试，不调用真实的 LLM API
 */
export class MockProvider implements ILLMProvider {
  private mockResponse: string;
  private mockStreamResponse: string;
  private streamDelay: number;
  private enableStream: boolean;
  private model: string;

  constructor(config: MockProviderConfig = {}) {
    this.mockResponse = config.mockResponse || 'This is a mock response.';
    this.mockStreamResponse =
      config.mockStreamResponse || 'This is a mock stream response.';
    this.streamDelay = config.streamDelay || 10;
    this.enableStream = config.enableStream !== false;
    this.model = 'mock-model';
  }

  /**
   * 发起 LLM 调用（非流式）
   * 返回预设的响应内容
   */
  async invoke(messages: LLMMessage[], config?: LLMConfig): Promise<LLMResponse> {
    // 模拟网络延迟
    await this.delay(100);

    return {
      content: this.mockResponse,
    };
  }

  /**
   * 发起 LLM 调用（流式）
   * 逐字符返回预设的响应内容
   */
  async *stream(
    messages: LLMMessage[],
    config?: LLMConfig
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    if (!this.enableStream) {
      return;
    }

    const content = this.mockStreamResponse;
    const chars = content.split('');

    for (const char of chars) {
      // 模拟流式输出延迟
      await this.delay(this.streamDelay);

      yield {
        content: char,
      };
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取 Provider 名称
   */
  getName(): string {
    return 'Mock';
  }

  /**
   * 获取当前模型名称
   */
  getModel(): string {
    return this.model;
  }

  /**
   * 设置预设响应内容
   */
  setMockResponse(response: string): void {
    this.mockResponse = response;
  }

  /**
   * 设置流式响应内容
   */
  setMockStreamResponse(response: string): void {
    this.mockStreamResponse = response;
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.mockResponse = 'This is a mock response.';
    this.mockStreamResponse = 'This is a mock stream response.';
    this.streamDelay = 10;
    this.enableStream = true;
  }
}

/**
 * 创建 MockProvider 实例的工厂函数
 */
export function createMockProvider(config?: MockProviderConfig): MockProvider {
  return new MockProvider(config);
}

/**
 * 创建全局共享的 MockProvider 实例
 * 用于测试时的默认 Mock Provider
 */
let globalMockProvider: MockProvider | null = null;

export function getGlobalMockProvider(): MockProvider {
  if (!globalMockProvider) {
    globalMockProvider = new MockProvider();
  }
  return globalMockProvider;
}

export function resetGlobalMockProvider(): void {
  globalMockProvider = null;
}
