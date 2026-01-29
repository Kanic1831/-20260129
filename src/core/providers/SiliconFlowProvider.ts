import {
    ILLMProvider,
    LLMMessage,
    LLMConfig,
    LLMResponse,
    LLMStreamChunk,
} from './LLMProvider';

/**
 * SiliconFlow (硅基流动) Provider 实现
 * 兼容 OpenAI 接口格式
 * 包含重试机制和超时处理
 */
export class SiliconFlowProvider implements ILLMProvider {
    private apiKey: string;
    private baseUrl: string;
    private model: string;
    private maxRetries: number;
    private timeout: number;

    constructor(
        apiKey: string,
        model: string = 'deepseek-ai/DeepSeek-V2.5',
        options: { maxRetries?: number; timeout?: number } = {}
    ) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.siliconflow.cn/v1';
        this.model = model;
        this.maxRetries = options.maxRetries ?? 3;
        this.timeout = options.timeout ?? 60000; // 60秒超时
    }

    /**
     * 获取 Headers
     */
    private getHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
        };
    }

    /**
     * 带重试的 fetch
     */
    private async fetchWithRetry(
        url: string,
        options: RequestInit,
        retries: number = this.maxRetries
    ): Promise<Response> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // 创建 AbortController 用于超时控制
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);
                return response;
            } catch (error: unknown) {
                lastError = error instanceof Error ? error : new Error('未知错误');
                const message = error instanceof Error ? error.message : String(error);
                console.warn(`SiliconFlow API 请求失败 (尝试 ${attempt}/${retries}):`, message);

                // 如果是最后一次尝试，不再等待
                if (attempt < retries) {
                    // 指数退避：1秒、2秒、4秒...
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    console.log(`等待 ${delay}ms 后重试...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw new Error(`SiliconFlow API 请求失败 (已重试 ${retries} 次): ${lastError?.message || '未知错误'}`);
    }

    /**
     * 发起 LLM 调用（非流式）
     */
    async invoke(messages: LLMMessage[], config?: LLMConfig): Promise<LLMResponse> {
        const response = await this.fetchWithRetry(
            `${this.baseUrl}/chat/completions`,
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    model: config?.model || this.model,
                    messages: messages,
                    temperature: config?.temperature ?? 0.7,
                    stream: false,
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SiliconFlow API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || '',
        };
    }

    /**
     * 发起 LLM 调用（流式）
     */
    async *stream(
        messages: LLMMessage[],
        config?: LLMConfig
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const response = await this.fetchWithRetry(
            `${this.baseUrl}/chat/completions`,
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    model: config?.model || this.model,
                    messages: messages,
                    temperature: config?.temperature ?? 0.7,
                    stream: true,
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SiliconFlow API Error: ${response.status} - ${errorText}`);
        }

        if (!response.body) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.trim() === 'data: [DONE]') return;
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const content = data.choices[0]?.delta?.content;
                        if (content) {
                            yield { content };
                        }
                    } catch (e) {
                        // 忽略解析错误，继续处理下一行
                    }
                }
            }
        }
    }

    /**
     * 获取 Provider 名称
     */
    getName(): string {
        return 'SiliconFlow';
    }

    /**
     * 获取当前模型名称
     */
    getModel(): string {
        return this.model;
    }
}

/**
 * 创建 SiliconFlowProvider 实例的工厂函数
 */
export function createSiliconFlowProvider(
    apiKey: string,
    model?: string,
    options?: { maxRetries?: number; timeout?: number }
): SiliconFlowProvider {
    return new SiliconFlowProvider(apiKey, model, options);
}
