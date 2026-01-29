import { describe, it, expect } from 'vitest';
import {
  MockProvider,
  createMockProvider,
  getGlobalMockProvider,
  resetGlobalMockProvider,
} from '@/core/providers/MockProvider';
import type { LLMMessage } from '@/core/providers/LLMProvider';

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  afterEach(() => {
    resetGlobalMockProvider();
  });

  describe('constructor', () => {
    it('should use default values when no config provided', () => {
      expect(provider.getName()).toBe('Mock');
      expect(provider.getModel()).toBe('mock-model');
    });

    it('should use custom response when provided', () => {
      const customProvider = new MockProvider({
        mockResponse: 'Custom response',
      });
      expect(customProvider.getName()).toBe('Mock');
    });

    it('should support custom stream delay', () => {
      const customProvider = new MockProvider({
        streamDelay: 50,
      });
      // 验证延迟设置（通过测试流式输出）
    });
  });

  describe('invoke', () => {
    it('should return mock response', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const response = await provider.invoke(messages);
      expect(response.content).toBe('This is a mock response.');
    });

    it('should use custom mock response', async () => {
      const customProvider = new MockProvider({
        mockResponse: 'Custom response',
      });

      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const response = await customProvider.invoke(messages);
      expect(response.content).toBe('Custom response');
    });

    it('should ignore config parameter', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const response = await provider.invoke(messages, {
        temperature: 0.8,
        model: 'test-model',
      });
      expect(response.content).toBe('This is a mock response.');
    });

    it('should have small delay to simulate API call', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const start = Date.now();
      await provider.invoke(messages);
      const elapsed = Date.now() - start;

      // 延迟应该在 100ms 左右
      expect(elapsed).toBeGreaterThanOrEqual(50);
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('stream', () => {
    it('should stream mock response character by character', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const chunks: string[] = [];
      for await (const chunk of provider.stream(messages)) {
        chunks.push(chunk.content);
      }

      expect(chunks).toEqual([
        'T',
        'h',
        'i',
        's',
        ' ',
        'i',
        's',
        ' ',
        'a',
        ' ',
        'm',
        'o',
        'c',
        'k',
        ' ',
        's',
        't',
        'r',
        'e',
        'a',
        'm',
        ' ',
        'r',
        'e',
        's',
        'p',
        'o',
        'n',
        's',
        'e',
        '.',
      ]);
    });

    it('should use custom stream response', async () => {
      const customProvider = new MockProvider({
        mockStreamResponse: 'ABC',
      });

      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const chunks: string[] = [];
      for await (const chunk of customProvider.stream(messages)) {
        chunks.push(chunk.content);
      }

      expect(chunks).toEqual(['A', 'B', 'C']);
    });

    it('should handle delay between chunks', async () => {
      const customProvider = new MockProvider({
        mockStreamResponse: 'AB',
        streamDelay: 20,
      });

      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const chunks: string[] = [];
      const timestamps: number[] = [];

      for await (const chunk of customProvider.stream(messages)) {
        chunks.push(chunk.content);
        timestamps.push(Date.now());
      }

      expect(chunks).toEqual(['A', 'B']);
      // 验证延迟
      const delay = timestamps[1] - timestamps[0];
      expect(delay).toBeGreaterThanOrEqual(15);
      expect(delay).toBeLessThan(50);
    });

    it('should not stream when disabled', async () => {
      const customProvider = new MockProvider({
        enableStream: false,
      });

      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const chunks: string[] = [];
      for await (const chunk of customProvider.stream(messages)) {
        chunks.push(chunk.content);
      }

      expect(chunks).toEqual([]);
    });
  });

  describe('getName', () => {
    it('should return "Mock"', () => {
      expect(provider.getName()).toBe('Mock');
    });
  });

  describe('getModel', () => {
    it('should return "mock-model" by default', () => {
      expect(provider.getModel()).toBe('mock-model');
    });
  });

  describe('setMockResponse', () => {
    it('should update mock response', async () => {
      provider.setMockResponse('New response');

      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const response = await provider.invoke(messages);
      expect(response.content).toBe('New response');
    });
  });

  describe('setMockStreamResponse', () => {
    it('should update stream response', async () => {
      provider.setMockStreamResponse('XYZ');

      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const chunks: string[] = [];
      for await (const chunk of provider.stream(messages)) {
        chunks.push(chunk.content);
      }

      expect(chunks).toEqual(['X', 'Y', 'Z']);
    });
  });

  describe('reset', () => {
    it('should reset to default values', async () => {
      provider.setMockResponse('Custom');
      provider.setMockStreamResponse('Custom Stream');

      provider.reset();

      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const response = await provider.invoke(messages);
      expect(response.content).toBe('This is a mock response.');

      const chunks: string[] = [];
      for await (const chunk of provider.stream(messages)) {
        chunks.push(chunk.content);
      }
      expect(chunks[0]).toBe('T'); // 'This is a mock stream response.' 的第一个字符
    });
  });
});

describe('createMockProvider', () => {
  it('should create a new MockProvider instance', () => {
    const provider = createMockProvider();
    expect(provider).toBeInstanceOf(MockProvider);
    expect(provider.getName()).toBe('Mock');
  });

  it('should pass config to provider', () => {
    const provider = createMockProvider({
      mockResponse: 'Test',
    });

    const messages: LLMMessage[] = [
      { role: 'user', content: 'Test message' },
    ];

    return provider.invoke(messages).then((response) => {
      expect(response.content).toBe('Test');
    });
  });
});

describe('getGlobalMockProvider', () => {
  it('should return same instance on multiple calls', () => {
    const instance1 = getGlobalMockProvider();
    const instance2 = getGlobalMockProvider();
    expect(instance1).toBe(instance2);
  });
});

describe('resetGlobalMockProvider', () => {
  it('should reset global provider', () => {
    const instance1 = getGlobalMockProvider();
    resetGlobalMockProvider();
    const instance2 = getGlobalMockProvider();

    expect(instance1).not.toBe(instance2);
  });
});
