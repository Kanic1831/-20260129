import { LLMClient, Config } from 'coze-coding-dev-sdk';
import {
  ILLMProvider,
  LLMMessage,
  LLMConfig,
  LLMResponse,
  LLMStreamChunk,
} from './LLMProvider';

/**
 * Doubao Provider 实现
 * 使用 coze-coding-dev-sdk 调用豆包 LLM
 */
export class DoubaoProvider implements ILLMProvider {
  private client: LLMClient;
  private model: string;

  constructor(model: string = 'doubao-seed-1-8-251228') {
    const config = new Config();
    this.client = new LLMClient(config);
    this.model = model;
  }

  /**
   * 发起 LLM 调用（非流式）
   */
  async invoke(messages: LLMMessage[], config?: LLMConfig): Promise<LLMResponse> {
    const response = await this.client.invoke(
      messages,
      {
        model: config?.model || this.model,
        temperature: config?.temperature,
      }
    );

    return {
      content: response.content.trim(),
    };
  }

  /**
   * 发起 LLM 调用（流式）
   */
  async *stream(
    messages: LLMMessage[],
    config?: LLMConfig
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    try {
      const stream = this.client.stream(messages, {
        model: config?.model || this.model,
        temperature: config?.temperature,
      });

      for await (const chunk of stream) {
        if (chunk.content) {
          yield {
            content: chunk.content.toString(),
          };
        }
      }
    } catch (error) {
      console.error('DoubaoProvider stream error:', error);
      throw error;
    }
  }

  /**
   * 获取 Provider 名称
   */
  getName(): string {
    return 'Doubao';
  }

  /**
   * 获取当前模型名称
   */
  getModel(): string {
    return this.model;
  }
}

/**
 * 创建 DoubaoProvider 实例的工厂函数
 */
export function createDoubaoProvider(model?: string): DoubaoProvider {
  return new DoubaoProvider(model);
}
