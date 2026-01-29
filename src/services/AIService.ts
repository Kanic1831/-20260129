import { z } from 'zod';
import { WeeklyPlanAI, DailyPlanActivity, DailyPlanActivitySchema } from '@/core/schemas/plan.schema';
import { WeeklyPlanAISchema } from '@/core/schemas/plan.schema';
import { promptRegistry } from '@/core/promptRegistry';
import { ILLMProvider } from '@/core/providers/LLMProvider';
import { createDoubaoProvider } from '@/core/providers/DoubaoProvider';
import { JSONUtils } from '@/lib/json-utils';

/**
 * AI 服务接口
 * 定义了所有 AI 生成功能的接口
 */
export interface IAIService {
  /**
   * 生成周计划内容
   * @param params 生成参数
   * @returns 生成的周计划内容
   */
  generateWeeklyPlan(params: GenerateWeeklyPlanParams): Promise<WeeklyPlanAI>;

  /**
   * 生成日计划活动详情
   * @param params 生成参数
   * @returns 生成的日计划活动详情
   */
  generateDailyPlan(params: GenerateDailyPlanParams): Promise<DailyPlanActivity>;

  /**
   * 生成上周回顾
   * @param params 生成参数
   * @returns 生成的回顾内容
   */
  generateReview(params: GenerateReviewParams): Promise<string>;

  /**
   * 生成观察与反思
   * @param params 生成参数
   * @returns 生成的观察与反思内容
   */
  generateReflection(params: GenerateReflectionParams): Promise<string>;

  /**
   * 流式生成周计划内容
   * @param params 生成参数
   * @returns 流式输出 AsyncGenerator，每次返回一个文本块
   */
  streamWeeklyPlan(params: GenerateWeeklyPlanParams): AsyncGenerator<string, void, unknown>;
}

/**
 * 生成周计划的参数
 */
export interface GenerateWeeklyPlanParams {
  monthTheme: string;
  monthlyPlan: string;
  ageGroup: string;
  knowledgeBaseInfo?: string;
  selectedNames?: string[];
  hasLastWeekPlan?: boolean; // 是否有上周计划
}

/**
 * 生成日计划的参数
 */
export interface GenerateDailyPlanParams {
  activityName: string;
  classInfo: string;
  teacher: string;
  date: string;
  ageGroup: string;
  weekNumber?: string;
  knowledgeBaseInfo?: string;
}

/**
 * 生成回顾的参数
 */
export interface GenerateReviewParams {
  lastWeekPlan: string;
  ageGroup: string;
  selectedNames?: string[];
}

/**
 * 生成观察与反思的参数
 */
export interface GenerateReflectionParams {
  monthTheme: string;
  monthlyPlan: string;
  ageGroup: string;
  selectedNames?: string[];
}

/**
 * AI 服务实现
 * 使用 ILLMProvider 接口进行生成
 */
export class DoubaoAIService implements IAIService {
  private provider: ILLMProvider;

  constructor(provider?: ILLMProvider) {
    // 如果没有传入 provider，则使用默认的 DoubaoProvider
    this.provider = provider || createDoubaoProvider();
  }

  /**
   * 调用 LLM Provider
   */
  private async callProvider(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, temperature: number = 0.7): Promise<string> {
    const response = await this.provider.invoke(messages, { temperature });

    return response.content;
  }

  /**
   * 调用 LLM Provider 并使用 Zod Schema 验证结果
   */
  private async callProviderWithSchema<T>(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    schema: z.ZodType<T>,
    temperature: number = 0.7
  ): Promise<T> {
    const content = await this.callProvider(messages, temperature);

    // 使用 JSONUtils 解析和修复 JSON
    const jsonContent = JSONUtils.repairAndParse(content);

    // 使用 Zod Schema 验证
    return schema.parse(jsonContent);
  }

  /**
   * 生成周计划内容
   */
  async generateWeeklyPlan(params: GenerateWeeklyPlanParams): Promise<WeeklyPlanAI> {
    const { monthTheme, monthlyPlan, ageGroup, knowledgeBaseInfo, selectedNames, hasLastWeekPlan } = params;

    // 从外部加载 Prompt
    const prompt = promptRegistry.get('weekly-plan', {
      monthTheme,
      monthlyPlan,
      ageGroup,
      knowledgeBaseInfo,
      selectedNames: selectedNames?.join('、'),
      hasLastWeekPlan: hasLastWeekPlan ? 'true' : 'false',
    });

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: prompt.userTemplate },
    ];

    return this.callProviderWithSchema(messages, WeeklyPlanAISchema);
  }

  /**
   * 生成日计划活动详情
   */
  async generateDailyPlan(params: GenerateDailyPlanParams): Promise<DailyPlanActivity> {
    const { activityName, classInfo, teacher, date, ageGroup, weekNumber, knowledgeBaseInfo } = params;

    // 从外部加载 Prompt
    const prompt = promptRegistry.get('daily-plan', {
      activityName,
      classInfo,
      teacher,
      date,
      weekNumber,
      knowledgeBaseInfo,
    });

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: prompt.userTemplate },
    ];

    const result = await this.callProviderWithSchema(messages, DailyPlanActivitySchema);

    return result as DailyPlanActivity;
  }

  /**
   * 生成上周回顾
   */
  async generateReview(params: GenerateReviewParams): Promise<string> {
    const { lastWeekPlan, ageGroup, selectedNames } = params;

    // 从外部加载 Prompt
    const prompt = promptRegistry.get('review', {
      lastWeekPlan,
      ageGroup,
      selectedNames: selectedNames?.join('、'),
    });

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: prompt.userTemplate },
    ];

    return this.callProvider(messages);
  }

  /**
   * 生成观察与反思
   */
  async generateReflection(params: GenerateReflectionParams): Promise<string> {
    const { monthTheme, monthlyPlan, ageGroup, selectedNames } = params;

    // 从外部加载 Prompt
    const prompt = promptRegistry.get('reflection', {
      monthTheme,
      monthlyPlan,
      ageGroup,
      selectedNames: selectedNames?.join('、'),
    });

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: prompt.userTemplate },
    ];

    return this.callProvider(messages);
  }

  /**
   * 流式生成周计划内容
   */
  async *streamWeeklyPlan(params: GenerateWeeklyPlanParams): AsyncGenerator<string, void, unknown> {
    const { monthTheme, monthlyPlan, ageGroup, knowledgeBaseInfo, selectedNames, hasLastWeekPlan } = params;

    // 从外部加载 Prompt
    const prompt = promptRegistry.get('weekly-plan', {
      monthTheme,
      monthlyPlan,
      ageGroup,
      knowledgeBaseInfo,
      selectedNames: selectedNames?.join('、'),
      hasLastWeekPlan: hasLastWeekPlan ? 'true' : 'false',
    });

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: prompt.userTemplate },
    ];

    const stream = this.provider.stream(messages, { temperature: 0.7 });

    for await (const chunk of stream) {
      yield chunk.content;
    }
  }
}

import { createSiliconFlowProvider } from '@/core/providers/SiliconFlowProvider';

/**
 * 创建 AIService 实例的工厂函数
 * @param provider 可选的 LLM Provider，如果不提供则使用默认的 DoubaoProvider
 * @returns AIService 实例
 */
export function createAIService(provider?: ILLMProvider): IAIService {
  if (provider) {
    return new DoubaoAIService(provider);
  }

  // 检查是否配置了 SiliconFlow
  const siliconFlowKey = process.env.SILICONFLOW_API_KEY;
  const useSiliconFlow = process.env.USE_SILICONFLOW === 'true';

  if (useSiliconFlow && siliconFlowKey) {
    console.log('Using SiliconFlow Provider');
    const siliconProvider = createSiliconFlowProvider(siliconFlowKey);
    return new DoubaoAIService(siliconProvider);
  }

  return new DoubaoAIService();
}
