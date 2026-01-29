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
  static repairAndParse(rawContent: string): any {
    // 步骤 1: 提取纯 JSON 对象
    const cleanedContent = this.extractJSON(rawContent);

    // 步骤 2: 基础清理（移除控制字符、修复尾随逗号）
    const basicCleaned = this.basicClean(cleanedContent);

    // 尝试多种解析策略
    const strategies = [
      // 策略 1: 直接解析
      () => JSON.parse(basicCleaned),

      // 策略 2: 修复 AI 常见的中文引号问题 (""xxx"" -> "xxx")
      () => {
        const fixed = basicCleaned
          .replace(/""([^""]*)""/g, '"$1"')  // 中文双引号包裹 -> 普通引号
          .replace(/「([^」]*)」/g, '"$1"')   // 中文书名号 -> 普通引号
          .replace(/"([^"]*)"/g, '"$1"');    // 中文引号 -> 普通引号
        return JSON.parse(fixed);
      },

      // 策略 3: 移除所有非结构性引号
      () => {
        // 先将所有中文引号转换为空格，然后清理多余空格
        const fixed = basicCleaned
          .replace(/[""]/g, ' ')
          .replace(/\s+/g, ' ');
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
  static processNewlines(data: any): any {
    if (typeof data === 'string') {
      // 将转义的换行符 \\n 替换为实际的换行符 \n
      return data.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }

    if (Array.isArray(data)) {
      return data.map(item => this.processNewlines(item));
    }

    if (typeof data === 'object' && data !== null) {
      const processed: Record<string, any> = {};
      for (const key in data) {
        processed[key] = this.processNewlines(data[key]);
      }
      return processed;
    }

    return data;
  }

  /**
   * 格式化 JSON 对象为缩进字符串
   */
  static stringify(data: any, space: number = 2): string {
    try {
      return JSON.stringify(data, null, space);
    } catch (error) {
      throw new Error(`JSON 序列化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
