/**
 * LLM 消息接口
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM 配置接口
 */
export interface LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * LLM 响应接口
 */
export interface LLMResponse {
  content: string;
}

/**
 * LLM 流式输出 Chunk 接口
 */
export interface LLMStreamChunk {
  content: string;
}

/**
 * LLM Provider 接口
 * 定义了所有 LLM 服务提供商必须实现的方法
 */
export interface ILLMProvider {
  /**
   * 发起 LLM 调用（非流式）
   * @param messages 消息列表
   * @param config 配置项
   * @returns LLM 响应
   */
  invoke(messages: LLMMessage[], config?: LLMConfig): Promise<LLMResponse>;

  /**
   * 发起 LLM 调用（流式）
   * @param messages 消息列表
   * @param config 配置项
   * @returns 流式输出 AsyncGenerator
   */
  stream(
    messages: LLMMessage[],
    config?: LLMConfig
  ): AsyncGenerator<LLMStreamChunk, void, unknown>;

  /**
   * 获取 Provider 名称
   * @returns Provider 名称
   */
  getName(): string;

  /**
   * 获取当前模型名称
   * @returns 模型名称
   */
  getModel(): string;
}
