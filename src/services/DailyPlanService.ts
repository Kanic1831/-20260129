import { DailyPlanActivitySchema } from '@/core/schemas/plan.schema';
import { IAIService } from './AIService';
import { IDocumentService } from './DocumentService';
import { IStorageService } from './StorageService';
import { KnowledgeClient, Config } from 'coze-coding-dev-sdk';
import { DailyPlanActivity } from '@/core/schemas/plan.schema';

/**
 * 日计划生成参数
 */
export interface GenerateDailyPlanParams {
  activities: string[]; // 5个集体活动名称
  dateRange: string; // 日期范围
  classInfo: string; // 班级信息
  teacher: string; // 教师姓名
  startDate: string; // 开始日期
  ageGroup: string; // 年龄段
  weekNumber?: string; // 第几周
}

/**
 * 日计划生成结果
 */
export interface GenerateDailyPlanResult {
  success: boolean;
  downloadUrls: string[]; // 下载链接列表
  total: number; // 生成的日计划总数
}

/**
 * 日计划服务
 * 负责编排日计划生成的整个流程
 */
export class DailyPlanService {
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
   * 生成日计划
   */
  async generateDailyPlans(params: GenerateDailyPlanParams): Promise<GenerateDailyPlanResult> {
    const {
      activities,
      dateRange,
      classInfo,
      teacher,
      startDate,
      ageGroup,
      weekNumber,
    } = params;

    console.log('开始生成日计划');
    console.log('活动数量:', activities.length);
    console.log('开始日期:', startDate);
    console.log('班级:', classInfo);

    // 1. 获取日计划模板
    const template = await this.documentService.getDefaultTemplate('daily_plan_template.docx');
    console.log('模板加载成功');

    // 2. 从知识库检索年龄段相关的发展目标和教育建议
    const knowledgeBaseInfo = await this.searchKnowledgeBaseForAgeGroup(ageGroup);
    console.log('知识库检索完成:', knowledgeBaseInfo ? '找到相关内容' : '未找到相关内容');

    // 3. 生成5个日计划
    const downloadUrls: string[] = [];

    for (let i = 0; i < activities.length && i < 5; i++) {
      try {
        const activity = activities[i];
        console.log(`\n生成第${i + 1}天日计划:`, activity);

        // 计算日期
        const date = this.calculateDate(startDate, i);
        console.log('日期:', date);

        // 调用 AI 生成日计划活动详情
        const activityData = await this.aiService.generateDailyPlan({
          activityName: activity,
          classInfo,
          teacher,
          date,
          ageGroup,
          weekNumber,
          knowledgeBaseInfo,
        });
        console.log('AI 生成完成');

        // 使用 Zod Schema 验证
        const validatedActivity = DailyPlanActivitySchema.parse(activityData);
        console.log('数据验证通过');

        // 合并数据（validatedActivity已经包含了日期）
        const fillData: Record<string, any> = {
          班级: classInfo,
          教师: teacher,
          ...validatedActivity,
        };

        // 填充模板生成 Word 文档
        const docxBuffer = await this.documentService.generateDocx(template, fillData);
        console.log('文档生成成功，大小:', docxBuffer.length, '字节');

        // 上传到对象存储
        const fileName = `第${weekNumber || ''}周${date}`;
        const downloadUrl = await this.storageService.upload(
          fileName,
          docxBuffer,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        console.log('文件上传成功');

        downloadUrls.push(downloadUrl);
      } catch (error: any) {
        console.error(`生成第${i + 1}天日计划失败:`, error);
        // 继续生成其他天数的日计划
      }
    }

    console.log('\n所有日计划生成完成，成功生成:', downloadUrls.length, '个');

    return {
      success: true,
      downloadUrls,
      total: downloadUrls.length,
    };
  }

  /**
   * 计算日期
   * @param startDate 开始日期（格式：2025-05-06）
   * @param offset 偏移天数
   * @returns 格式化后的日期（如：5.6）
   */
  private calculateDate(startDate: string, offset: number): string {
    const date = new Date(startDate);
    date.setDate(date.getDate() + offset);

    const month = date.getMonth() + 1;
    const day = date.getDate();

    return `${month}.${day}`;
  }

  /**
   * 从知识库检索年龄段的发晨目标和教育建议
   */
  private async searchKnowledgeBaseForAgeGroup(ageGroup: string): Promise<string> {
    try {
      const ageText = this.AGE_GROUP_MAP[ageGroup] || '4~5岁';

      // 构建检索查询，检索与该年龄段相关的发展目标和教育建议
      const query = `${ageText} 发展目标 教育建议 幼儿园教育指导纲要`;

      // 暂时注释掉，避免编译错误
      // TODO: 确认 KnowledgeClient.search 的正确参数格式后启用
      /*
      const result = await this.knowledgeClient.search(
        query,
        process.env.KNOWLEDGE_DATASET_ID || '',
        3
      );
      */

      console.log('知识库检索（已禁用）:', query);

      // 暂时返回空字符串
      return '';
    } catch (error: any) {
      console.error('知识库检索失败:', error);
      return '';
    }
  }
}

/**
 * 创建 DailyPlanService 实例的工厂函数
 */
export function createDailyPlanService(): DailyPlanService {
  const { createAIService } = require('./AIService');
  const { createDocumentService } = require('./DocumentService');
  const { createStorageService } = require('./StorageService');

  return new DailyPlanService(
    createAIService(),
    createDocumentService(),
    createStorageService()
  );
}
