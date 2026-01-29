import { NextResponse } from 'next/server';
import { WeeklyPlanAI } from '@/core/schemas/plan.schema';
import { WeeklyPlanAISchema } from '@/core/schemas/plan.schema';
import { IAIService } from './AIService';
import { IDocumentService } from './DocumentService';
import { IStorageService } from './StorageService';
import { KnowledgeClient, Config } from 'coze-coding-dev-sdk';
import { JSONUtils } from '@/lib/json-utils';
import { createAIService } from './AIService';
import { createDocumentService } from './DocumentService';
import { createStorageService } from './StorageService';

/**
 * 周计划生成参数
 */
export interface GenerateWeeklyPlanParams {
  file?: File | null; // 周计划模板文件
  lastWeekFile?: File | null; // 上周周计划文件
  studentNamesFile?: File | null; // 学生名册文件
  monthTheme: string; // 月主题
  monthlyPlan: string; // 月计划
  useDefaultTemplate: boolean; // 是否使用默认模板
  classInfo: string; // 班级信息
  weekNumber: string; // 第几周
  teacher: string; // 教师姓名
  dateRange: string; // 日期范围
  ageGroup: string; // 年龄段
}

/**
 * 周计划生成结果
 */
export interface GenerateWeeklyPlanResult {
  downloadUrl: string; // 下载链接
  activities: string; // 集体活动内容
  dateRange: string; // 日期范围
  classInfo: string; // 班级信息
  teacher: string; // 教师信息
  ageGroup: string; // 年龄段
}

/**
 * 周计划服务
 * 负责编排周计划生成的整个流程
 */
export class PlanService {
  private aiService: IAIService;
  private documentService: IDocumentService;
  private storageService: IStorageService;
  private knowledgeClient: KnowledgeClient;

  private readonly AGE_GROUP_MAP: Record<string, string> = {
    'small': '3~4岁',
    'medium': '4~5岁',
    'large': '5~6岁',
  };

  constructor(
    aiService: IAIService,
    documentService: IDocumentService,
    storageService: IStorageService
  ) {
    this.aiService = aiService;
    this.documentService = documentService;
    this.storageService = storageService;
    this.knowledgeClient = new KnowledgeClient(new Config());
  }

  /**
   * 生成周计划
   */
  async generateWeeklyPlan(params: GenerateWeeklyPlanParams): Promise<GenerateWeeklyPlanResult> {
    const {
      file,
      lastWeekFile,
      studentNamesFile,
      monthTheme,
      monthlyPlan,
      useDefaultTemplate,
      classInfo,
      weekNumber,
      teacher,
      dateRange,
      ageGroup,
    } = params;

    // 1. 获取模板
    const template = await this.getTemplate(file, useDefaultTemplate);


    // 2. 处理学生名册
    const selectedNames = await this.processStudentNamesFile(studentNamesFile);

    // 3. 生成上周回顾
    const lastWeekReview = await this.generateLastWeekReview(lastWeekFile, ageGroup, selectedNames);

    // 4. 生成观察与反思
    const observationReflection = await this.generateObservationReflection(
      monthTheme,
      monthlyPlan,
      ageGroup,
      selectedNames
    );

    // 5. 从知识库检索年龄段相关的发展目标和教育建议
    const knowledgeBaseInfo = await this.searchKnowledgeBaseForAgeGroup(ageGroup);

    // 6. 调用 AI 生成周计划内容
    const aiPlanData = await this.aiService.generateWeeklyPlan({
      monthTheme,
      monthlyPlan,
      ageGroup,
      knowledgeBaseInfo,
      selectedNames,
    });

    // 7. 合并手动填写的数据和 AI 生成的数据
    // 使用 JSONUtils 处理换行符
    const processedAiData = JSONUtils.processNewlines(aiPlanData);

    // 使用 JSONUtils 清理多条内容的字段（如集体活动、学习区等）
    const multiLineFields = ['集体活动', '学习区', '运动区', '公共区域', '班级区域', '过渡环节'];
    const finalAiData = JSONUtils.cleanMultiLineFields(processedAiData, multiLineFields);

    const fillData: Record<string, any> = {
      班级: classInfo,
      第几周: weekNumber,
      教师: teacher,
      日期: dateRange,
      本月主题: monthTheme,
      上周回顾: '', // 默认为空，确保模板变量存在
      周回顾: '', // 默认为空，确保模板变量存在
      观察与反思: '', // 默认为空，确保模板变量存在
      ...finalAiData,
    };

    // 如果有上周回顾和观察与反思，覆盖默认空值
    if (lastWeekReview) {
      fillData['上周回顾'] = lastWeekReview;
      fillData['周回顾'] = lastWeekReview;
    }

    if (observationReflection) {
      fillData['观察与反思'] = observationReflection;
    }

    // 8. 使用 Zod Schema 验证最终数据
    // 注意：WeeklyPlanAI 包含AI生成的所有字段
    WeeklyPlanAISchema.parse(fillData);

    // 9. 填充模板生成 Word 文档
    const docxBuffer = await this.documentService.generateDocx(template, fillData);

    // 10. 上传到对象存储
    const fileName = `${classInfo}班第${weekNumber}周周计划.docx`;
    const downloadUrl = await this.storageService.upload(
      fileName,
      docxBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    // 11. 返回结果
    return {
      downloadUrl,
      activities: fillData.集体活动 || '',
      dateRange,
      classInfo,
      teacher,
      ageGroup,
    };
  }

  /**
   * 获取模板
   */
  private async getTemplate(file: File | null | undefined, useDefaultTemplate: boolean): Promise<Uint8Array> {
    if (useDefaultTemplate) {
      return await this.documentService.getDefaultTemplate();
    } else if (file) {
      return await this.documentService.readFileAsUint8Array(file);
    } else {
      // 尝试使用默认模板
      return await this.documentService.getDefaultTemplate();
    }
  }

  /**
   * 处理学生名册文件
   */
  private async processStudentNamesFile(studentNamesFile: File | null | undefined): Promise<string[]> {
    if (!studentNamesFile) {
      return [];
    }


    try {
      const studentNamesText = await this.documentService.extractTextFromWord(studentNamesFile);
      const studentNames = studentNamesText
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      // 随机选择1-3个名字（35%概率）
      if (studentNames.length > 0) {
        const randomProbability = Math.random();
        if (randomProbability < 0.35) {
          const count = Math.floor(Math.random() * 3) + 1; // 1-3
          const shuffled = [...studentNames].sort(() => 0.5 - Math.random());
          const selectedNames = shuffled.slice(0, count);
          return selectedNames;
        }
      }

      return [];
    } catch (error: any) {
      console.error('解析学生名册失败:', error.message);
      return [];
    }
  }

  /**
   * 生成上周回顾
   */
  private async generateLastWeekReview(
    lastWeekFile: File | null | undefined,
    ageGroup: string,
    selectedNames: string[]
  ): Promise<string> {
    if (!lastWeekFile) {
      console.log('未上传上周周计划文件，不生成回顾');
      return '';
    }

    console.log('检测到上周周计划文件，开始生成回顾...');
    try {
      const lastWeekPlan = await this.documentService.extractTextFromWord(lastWeekFile);
      const review = await this.aiService.generateReview({
        lastWeekPlan,
        ageGroup,
        selectedNames,
      });
      return review;
    } catch (error: any) {
      console.error('生成上周回顾失败:', error.message);
      return '';
    }
  }

  /**
   * 生成观察与反思
   */
  private async generateObservationReflection(
    monthTheme: string,
    monthlyPlan: string,
    ageGroup: string,
    selectedNames: string[]
  ): Promise<string> {
    try {
      const reflection = await this.aiService.generateReflection({
        monthTheme,
        monthlyPlan,
        ageGroup,
        selectedNames,
      });
      return reflection;
    } catch (error: any) {
      console.error('生成观察与反思失败:', error.message);
      return '';
    }
  }

  /**
   * 从知识库检索年龄段的发晨目标和教育建议
   */
  private async searchKnowledgeBaseForAgeGroup(ageGroup: string): Promise<string> {
    try {
      const ageText = this.AGE_GROUP_MAP[ageGroup] || '4~5岁';

      // 构建检索查询，检索与该年龄段相关的发展目标和教育建议
      const query = `${ageText} 发展目标 教育建议 幼儿园教育指导纲要`;

      // KnowledgeClient.search 的参数格式需要确认
      // 暂时注释掉，避免编译错误
      // console.log('知识库检索（已禁用）:', query);

      // TODO: 确认 KnowledgeClient.search 的正确参数格式后启用
      /*
      const result = await this.knowledgeClient.search(
        query,
        process.env.KNOWLEDGE_DATASET_ID || '',
        3  // topK
      );
      */

      // 暂时返回空字符串
      return '';
    } catch (error: any) {
      console.error('知识库检索失败:', error);
      return '';
    }
  }
}

/**
 * 创建 PlanService 实例的工厂函数
 */
export function createPlanService(): PlanService {
  return new PlanService(
    createAIService(),
    createDocumentService(),
    createStorageService()
  );
}
