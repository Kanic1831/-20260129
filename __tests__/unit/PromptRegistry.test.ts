import { describe, it, expect } from 'vitest';
import { PromptRegistry } from '@/core/promptRegistry';
import * as fs from 'fs';
import * as path from 'path';

describe('PromptRegistry', () => {
  let registry: PromptRegistry;

  beforeEach(() => {
    // 清除缓存
    PromptRegistry['instance'] = null;
    registry = PromptRegistry.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = PromptRegistry.getInstance();
      const instance2 = PromptRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('load', () => {
    it('should load a valid prompt template', () => {
      const prompt = registry.load('weekly-plan');
      expect(prompt).toBeDefined();
      expect(prompt.systemPrompt).toBeDefined();
      expect(prompt.userTemplate).toBeDefined();
    });

    it('should cache loaded prompts', () => {
      registry.load('weekly-plan');
      registry.load('weekly-plan');
      expect(registry.getLoadedPrompts()).toContain('weekly-plan');
    });

    it('should throw error for non-existent prompt', () => {
      expect(() => {
        registry.load('non-existent-prompt');
      }).toThrow('Prompt 文件不存在');
    });

    it('should validate required fields', () => {
      const promptsDir = path.join(process.cwd(), 'src', 'prompts');
      const filePath = path.join(promptsDir, 'invalid-prompt.yaml');
      
      // 创建无效的 Prompt 文件
      fs.writeFileSync(filePath, 'invalid: content', 'utf-8');

      expect(() => {
        registry.load('invalid-prompt');
      }).toThrow('Prompt 模板缺少必需字段');

      // 清理测试文件
      fs.unlinkSync(filePath);
    });
  });

  describe('replaceVariables', () => {
    it('should replace simple variables', () => {
      const template = 'Hello {{name}}!';
      const result = registry.replaceVariables(template, { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should replace multiple variables', () => {
      const template = '{{greeting}} {{name}}, {{message}}!';
      const result = registry.replaceVariables(template, {
        greeting: 'Hello',
        name: 'World',
        message: 'Welcome'
      });
      expect(result).toBe('Hello World, Welcome!');
    });

    it('should handle missing variables', () => {
      const template = 'Hello {{name}}!';
      const result = registry.replaceVariables(template, {});
      expect(result).toBe('Hello !');
    });

    it('should handle null and undefined values', () => {
      const template = 'Value: {{value}}';
      const result = registry.replaceVariables(template, { value: null });
      expect(result).toBe('Value: ');
    });

    it('should convert values to string', () => {
      const template = 'Count: {{count}}';
      const result = registry.replaceVariables(template, { count: 42 });
      expect(result).toBe('Count: 42');
    });
  });

  describe('replaceConditionals', () => {
    it('should render content when condition is true', () => {
      const template = '{% if show %}Visible{% endif %}';
      const result = registry.replaceVariables(template, { show: true });
      expect(result).toBe('Visible');
    });

    it('should hide content when condition is false', () => {
      const template = '{% if show %}Hidden{% endif %}';
      const result = registry.replaceVariables(template, { show: false });
      expect(result).toBe('');
    });

    it('should hide content when condition is undefined', () => {
      const template = '{% if show %}Hidden{% endif %}';
      const result = registry.replaceVariables(template, {});
      expect(result).toBe('');
    });

    it('should hide content when condition is empty string', () => {
      const template = '{% if show %}Hidden{% endif %}';
      const result = registry.replaceVariables(template, { show: '' });
      expect(result).toBe('');
    });

    it('should handle multiple conditionals', () => {
      const template = '{% if a %}A{% endif %}{% if b %}B{% endif %}';
      const result = registry.replaceVariables(template, { a: true, b: false });
      expect(result).toBe('A');
    });

    it('should handle conditionals with mixed content', () => {
      const template = 'Start {% if show %}Middle{% endif %} End';
      const result = registry.replaceVariables(template, { show: true });
      expect(result).toBe('Start Middle End');
    });

    it('should handle else branches', () => {
      const template = '{% if show %}Visible{% else %}Hidden{% endif %}';
      const resultTrue = registry.replaceVariables(template, { show: true });
      const resultFalse = registry.replaceVariables(template, { show: false });
      expect(resultTrue).toBe('Visible');
      expect(resultFalse).toBe('Hidden');
    });

    it('should handle equality comparisons', () => {
      const template = '{% if flag == \"true\" %}Yes{% else %}No{% endif %}';
      const resultTrue = registry.replaceVariables(template, { flag: 'true' });
      const resultFalse = registry.replaceVariables(template, { flag: 'false' });
      expect(resultTrue).toBe('Yes');
      expect(resultFalse).toBe('No');
    });
  });

  describe('get', () => {
    it('should load and replace variables', () => {
      const prompt = registry.get('review', {
        lastWeekPlan: 'Test Plan',
        ageGroup: 'medium',
      });
      expect(prompt.userTemplate).toContain('Test Plan');
      expect(prompt.userTemplate).toContain('medium');
    });

    it('should handle optional variables', () => {
      const prompt = registry.get('review', {
        lastWeekPlan: 'Test Plan',
        ageGroup: 'medium',
      });
      // selectedNames 是可选的，不应该包含在模板中（因为没有提供）
      expect(prompt.userTemplate).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('should clear all cached prompts', () => {
      registry.load('weekly-plan');
      registry.load('daily-plan');
      expect(registry.getLoadedPrompts().length).toBe(2);

      registry.clearCache();
      expect(registry.getLoadedPrompts().length).toBe(0);
    });
  });

  describe('getLoadedPrompts', () => {
    it('should return list of loaded prompt names', () => {
      registry.load('weekly-plan');
      registry.load('daily-plan');

      const loaded = registry.getLoadedPrompts();
      expect(loaded).toContain('weekly-plan');
      expect(loaded).toContain('daily-plan');
      expect(loaded.length).toBe(2);
    });

    it('should return empty array when no prompts loaded', () => {
      const loaded = registry.getLoadedPrompts();
      expect(loaded).toEqual([]);
    });
  });
});
