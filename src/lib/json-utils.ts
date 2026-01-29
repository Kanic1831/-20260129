/**
 * JSON 清洗与修复工具类
 *
 * 负责处理 AI 返回的 JSON 内容，包括：
 * 1. 提取纯 JSON 对象（去除 Markdown 代码块标记）
 * 2. 移除不可见控制字符
 * 3. 修复尾随逗号
 * 4. 多阶段解析策略确保最大兼容性
 */

export class JSONUtils {
  /**
   * 修复并解析 JSON 字符串
   * 使用多阶段策略，确保最大程度兼容各种 AI 输出格式
   *
   * @param rawContent AI 返回的原始内容
   * @returns 解析后的 JSON 对象
   * @throws {Error} 如果无法解析为有效的 JSON
   */
  static repairAndParse(rawContent: string): unknown {
    // 步骤 1: 提取纯 JSON 对象
    const cleanedContent = this.extractJSON(rawContent);

    // 步骤 2: 基础清理（移除控制字符、修复尾随逗号）
    const basicCleaned = this.basicClean(cleanedContent);

    // 尝试多种解析策略
    const strategies = [
      // 策略 1: 直接解析
      () => JSON.parse(basicCleaned),

      // 策略 2: 修复 AI 常见的中文/全角引号问题
      () => {
        const fixed = basicCleaned
          .replace(/""([^""]*)""/g, '"$1"')  // 中文双引号包裹 -> 普通引号
          .replace(/「([^」]*)」/g, '"$1"')   // 中文书名号 -> 普通引号
          .replace(/[“”]/g, '"')             // 中文双引号 -> 普通引号
          .replace(/[‘’]/g, "'");            // 中文单引号 -> 半角单引号
        return JSON.parse(fixed);
      },
    ];

    let lastError: Error | null = null;
    for (const strategy of strategies) {
      try {
        return strategy();
      } catch (error) {
        lastError = error as Error;
        continue;
      }
    }

    throw new Error(`JSON 解析失败: ${lastError?.message || '未知错误'}\n\n清理后的内容:\n${basicCleaned}`);
  }

  /**
   * 提取纯 JSON 对象
   * 优先匹配 Markdown 代码块内容，其次匹配完整 JSON 对象
   */
  private static extractJSON(content: string): string {
    // 尝试提取 Markdown 代码块中的 JSON
    const markdownJsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownJsonMatch && markdownJsonMatch[1]) {
      const extracted = markdownJsonMatch[1].trim();
      // 验证是否看起来像 JSON
      if (extracted.startsWith('{') || extracted.startsWith('[')) {
        return extracted;
      }
    }

    // 尝试提取第一个完整的 JSON 对象
    const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      return jsonObjectMatch[0].trim();
    }

    // 如果没有找到 JSON 对象，返回原始内容
    return content.trim();
  }

  /**
   * 基础清理 JSON 内容
   */
  private static basicClean(content: string): string {
    let cleaned = content;

    // 移除不可见控制字符（保留 \t, \n, \r）
    cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // 修复尾随逗号（如 }," 或 ]}）
    cleaned = cleaned.replace(/,\s*[}\]]/g, (match) => match.replace(',', ''));

    return cleaned;
  }

  /**
   * 处理所有字符串字段中的换行符
   * 将转义的换行符 \\n 替换为实际换行符 \n
   */
  static processNewlines(data: unknown): unknown {
    if (typeof data === 'string') {
      return this.normalizeNewlines(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.processNewlines(item));
    }

    if (typeof data === 'object' && data !== null) {
      const processed: Record<string, unknown> = {};
      const record = data as Record<string, unknown>;
      for (const [key, value] of Object.entries(record)) {
        processed[key] = this.processNewlines(value);
      }
      return processed;
    }

    return data;
  }

  /**
   * 清理多条内容字段
   * - 确保每条内容独立成行
   * - 合并行内多余空白
   */
  static cleanMultiLineFields<T extends Record<string, unknown>>(
    data: T,
    fieldNames: string[]
  ): T {
    const result: Record<string, unknown> = { ...data };

    for (const fieldName of fieldNames) {
      const rawValue = result[fieldName];
      if (typeof rawValue !== 'string') continue;

      const normalized = this.normalizeNewlines(rawValue);
      let lines: string[] = [];

      if (normalized.includes('\n')) {
        lines = normalized.split('\n');
      } else {
        lines = this.splitNumberedLines(normalized);
      }

      const processedLines = lines
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter((line) => line.length > 0);

      result[fieldName] = processedLines.join('\n');
    }

    return result as T;
  }

  /**
   * 统一换行符（处理转义换行符与不同平台换行）
   */
  private static normalizeNewlines(value: string): string {
    return value
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  }

  /**
   * 尝试按编号拆分（1. 2. 3. / 1、2、3、）
   */
  private static splitNumberedLines(text: string): string[] {
    const marked = text.replace(/(^|[^\d])(\d{1,2}[.、])(?!\d)/g, (_match, prefix, marker) => {
      return `${prefix}\n${marker}`;
    });
    return marked.split('\n');
  }

  /**
   * 格式化 JSON 对象为缩进字符串
   */
  static stringify(data: unknown, space: number = 2): string {
    try {
      return JSON.stringify(data, null, space);
    } catch (error) {
      throw new Error(`JSON 序列化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
