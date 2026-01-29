import * as mammoth from 'mammoth';
import { createReport } from 'docx-templates';
import { readFileSync } from 'fs';
import { join } from 'path';
import { toErrorMessage } from '@/lib/error-utils';

/**
 * 文档服务接口
 */
export interface IDocumentService {
  /**
   * 从 Word 文件中提取文本内容
   */
  extractTextFromWord(file: File): Promise<string>;

  /**
   * 生成 Word 文档
   * @param template 模板文件路径或 Buffer
   * @param data 填充数据
   * @returns 生成的 Word 文档 Buffer
   */
  generateDocx(template: string | Uint8Array, data: Record<string, string>): Promise<Buffer>;

  /**
   * 获取默认模板
   * @param templateName 模板文件名（默认：weekly_plan_template.docx）
   */
  getDefaultTemplate(templateName?: string): Promise<Uint8Array>;

  /**
   * 读取文件为 Uint8Array
   */
  readFileAsUint8Array(file: File): Promise<Uint8Array>;
}

/**
 * 文档服务实现
 */
export class DocumentService implements IDocumentService {
  private defaultTemplatePath: string;

  constructor() {
    this.defaultTemplatePath = join(process.cwd(), 'public', 'templates');
  }

  /**
   * 从 Word 文件中提取文本内容
   */
  async extractTextFromWord(file: File): Promise<string> {
    try {
      const buffer = await this.readFileAsUint8Array(file);

      // 使用mammoth提取文本
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });

      if (result.messages.length > 0) {
        console.log('Word解析警告:', result.messages);
      }

      const text = result.value.trim();
      console.log('从Word文件提取文本，字数:', text.length);

      if (!text) {
        throw new Error('Word文件内容为空');
      }

      return text;
    } catch (error: unknown) {
      console.error('解析Word文件失败:', error);
      throw new Error('解析Word文件失败，请检查文件格式是否正确');
    }
  }

  /**
   * 生成 Word 文档
   */
  async generateDocx(template: string | Uint8Array, data: Record<string, string>): Promise<Buffer> {
    try {
      // 将 template 转换为 Uint8Array
      const templateUint8Array = typeof template === 'string'
        ? new TextEncoder().encode(template)
        : template;

      const report = await createReport({
        template: templateUint8Array,
        data,
        cmdDelimiter: ['{{', '}}'],
      });

      // createReport 返回的是 Uint8Array
      // 转换为 Buffer
      return Buffer.from(report);
    } catch (error: unknown) {
      console.error('生成Word文档失败:', error);
      throw new Error(`生成Word文档失败: ${toErrorMessage(error)}`);
    }
  }

  /**
   * 获取默认模板
   */
  async getDefaultTemplate(templateName: string = 'weekly_plan_template.docx'): Promise<Uint8Array> {
    const templatePath = join(this.defaultTemplatePath, templateName);

    try {
      const template = readFileSync(templatePath);
      console.log('使用默认模板:', templatePath);
      return new Uint8Array(template);
    } catch (e: unknown) {
      console.log('默认模板不存在，需要上传模板文件');
      throw new Error(`默认模板 ${templateName} 不存在，请上传模板文件`);
    }
  }

  /**
   * 读取文件为 Uint8Array
   */
  async readFileAsUint8Array(file: File): Promise<Uint8Array> {
    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
  }
}

/**
 * 创建 DocumentService 实例的工厂函数
 */
export function createDocumentService(): IDocumentService {
  return new DocumentService();
}
