import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Prompt 变量定义
 */
export interface PromptVariable {
  name: string;
  description: string;
  required: boolean;
}

/**
 * Prompt 模板接口
 */
export interface PromptTemplate {
  systemPrompt: string;
  userTemplate: string;
  fields?: string[];
  variables?: PromptVariable[];
}

/**
 * Prompt 加载和注册器
 * 负责加载外部 Prompt 文件并提供变量替换功能
 */
export class PromptRegistry {
  private static instance: PromptRegistry | null = null;
  private cache: Map<string, PromptTemplate> = new Map();
  private promptsDir: string;

  private constructor() {
    // 设置 Prompt 文件目录
    this.promptsDir = path.join(process.cwd(), 'src', 'prompts');
  }

  /**
   * 获取 PromptRegistry 单例
   */
  static getInstance(): PromptRegistry {
    if (!PromptRegistry.instance) {
      PromptRegistry.instance = new PromptRegistry();
    }
    return PromptRegistry.instance;
  }

  /**
   * 加载 Prompt 模板
   * @param name Prompt 名称（不包含 .yaml 扩展名）
   * @returns Prompt 模板
   */
  load(name: string): PromptTemplate {
    // 检查缓存
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    // 读取 YAML 文件
    const filePath = path.join(this.promptsDir, `${name}.yaml`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Prompt 文件不存在: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const promptConfig = yaml.load(fileContent) as PromptTemplate;

    // 验证必需字段
    if (!promptConfig.systemPrompt || !promptConfig.userTemplate) {
      throw new Error(`Prompt 模板缺少必需字段: ${name}`);
    }

    // 缓存 Prompt
    this.cache.set(name, promptConfig);

    return promptConfig;
  }

  /**
   * 替换 Prompt 模板中的变量
   * @param template Prompt 模板
   * @param variables 变量值对象
   * @returns 替换后的 Prompt
   */
  replaceVariables(template: string, variables: Record<string, unknown>): string {
    let result = template;

    // 替换 {{variableName}} 格式的变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value ?? ''));
    }

    // 替换条件语句（支持 else 和简单比较）
    result = this.replaceConditionals(result, variables);

    // 移除未定义的变量
    result = result.replace(/{{\w+}}/g, '');

    return result;
  }

  /**
   * 替换条件语句
   * @param template 模板内容
   * @param variables 变量值对象
   * @returns 替换后的内容
   */
  private replaceConditionals(template: string, variables: Record<string, unknown>): string {
    let result = template;

    // 匹配 {% if ... %}...{% else %}...{% endif %} 和无 else 的情况
    const conditionalRegex =
      /{%\s*if\s+([^%]+?)\s*%}([\s\S]*?)(?:{%\s*else\s*%}([\s\S]*?))?{%\s*endif\s*%}/g;

    const evaluateCondition = (condition: string): boolean => {
      const trimmed = condition.trim();
      const comparisonMatch = trimmed.match(/^(\w+)\s*(==|!=)\s*(.+)$/);
      if (comparisonMatch) {
        const [, varName, operator, rawValue] = comparisonMatch;
        const expected = this.parseLiteral(rawValue.trim());
        const actual = variables[varName];

        if (expected === true || expected === false) {
          const actualBool = actual === true || actual === 'true';
          return operator === '==' ? actualBool === expected : actualBool !== expected;
        }

        const actualStr = actual === undefined || actual === null ? '' : String(actual);
        const expectedStr = expected === undefined || expected === null ? '' : String(expected);
        return operator === '==' ? actualStr === expectedStr : actualStr !== expectedStr;
      }

      const value = variables[trimmed];
      if (value === 'false') {
        return false;
      }
      return Boolean(value);
    };

    const apply = (input: string): string =>
      input.replace(
        conditionalRegex,
        (_match, condition, truthyContent, falsyContent) => {
          return evaluateCondition(condition) ? truthyContent : (falsyContent ?? '');
        }
      );

    let prev: string | null = null;
    while (prev !== result) {
      prev = result;
      result = apply(result);
    }

    return result;
  }

  private parseLiteral(value: string): string | boolean | null {
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    return value;
  }

  /**
   * 获取 Prompt 并替换变量
   * @param name Prompt 名称
   * @param variables 变量值对象
   * @returns 替换后的 Prompt 对象
   */
  get(name: string, variables: Record<string, unknown> = {}): Omit<PromptTemplate, 'variables'> {
    const template = this.load(name);

    return {
      systemPrompt: this.replaceVariables(template.systemPrompt, variables),
      userTemplate: this.replaceVariables(template.userTemplate, variables),
      fields: template.fields,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取所有已加载的 Prompt 名称
   */
  getLoadedPrompts(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * 导出单例实例
 */
export const promptRegistry = PromptRegistry.getInstance();
