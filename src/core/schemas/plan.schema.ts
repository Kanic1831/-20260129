import { z } from 'zod';

/**
 * 单个活动的 Schema
 * 格式：1. 科学活动：观察植物的生长变化。
 */
const ActivitySchema = z.object({
  number: z.number().describe('活动编号'),
  type: z.string().describe('活动类型，如：科学活动、语言活动等'),
  description: z.string().describe('活动描述'),
});

/**
 * 多个活动的 Schema
 * 用于学习区、运动区等包含多个活动的字段
 */
const MultipleActivitiesSchema = z
  .string()
  .describe('多条活动内容，每条独立成行，以句号结尾，使用编号（1. 2. 3.）')
  .refine((val) => {
    // 彻底放宽验证逻辑：只要不是空字符串即可
    return val.trim().length > 0;
  }, {
    message: '活动内容不能为空',
  });

/**
 * 集体活动 Schema（字符串形式）
 * 格式：多行文本，每行一个活动，以编号开头，以句号结尾
 * 验证：只验证格式，不强制数量，通过 Prompt 引导生成5个活动
 */
const CollectiveActivitiesSchema = z
  .string()
  .describe('集体活动，格式：多行文本，每行一个活动（1. 科学活动：描述\\n2. 语言活动：描述）');

/**
 * 总结性内容 Schema
 * 如：周回顾、观察与反思、反思与调整
 * 字数限制：50-250字（放宽限制以适应 AI 生成）
 */
const SummaryContentSchema = z
  .string()
  // 彻底放宽：只要求是字符串，长度不做强制限制（AI有时生成得很短，有时很长）
  .describe('总结性内容');

/**
 * 周计划 AI 生成部分的 Schema
 */
export const WeeklyPlanAISchema = z.object({
  儿童议会: z.string().describe('儿童议会活动内容，1-2条'),
  公共区域: z.string().describe('公共区域活动安排'),
  反思与调整: SummaryContentSchema.describe('反思与调整内容，150-200字（基于本周计划的反思）'),
  学习区: MultipleActivitiesSchema.describe('学习区活动安排，至少3条，每条以句号结尾'),
  家园共育: z.string().describe('家园共育活动安排'),
  本周主题: z.string().describe('本周主题，1-2句话'),
  本周目标: z.string().describe('本周目标，3-5条'),
  环境创设: z.string().describe('环境创设安排'),
  班级区域: z.string().describe('班级区域布置'),
  自主签到: z.string().describe('自主签到活动安排'),
  资源利用: z.string().describe('资源利用安排'),
  过渡环节: z.string().describe('过渡环节活动安排'),
  运动区: MultipleActivitiesSchema.describe('运动区活动安排，至少3条，每条以句号结尾'),
  集体活动: CollectiveActivitiesSchema.describe('集体活动，恰好5个不同领域的活动'),
  餐点进餐: z.string().describe('餐点进餐安排'),
  周回顾: SummaryContentSchema.optional().describe('周回顾内容，150-200字（可选，可省略或返回空字符串）'),
  观察与反思: SummaryContentSchema.optional().describe('观察与反思内容，150-200字（可选，可省略或返回空字符串）'),
});

/**
 * 周计划完整 Schema（包括手动填写和AI生成）
 */
export const WeeklyPlanSchema = z.object({
  // 手动填写的字段
  班级: z.string().describe('班级名称，如：大一班'),
  第几周: z.string().describe('第几周，如：第3周'),
  教师: z.string().describe('教师姓名'),
  日期: z.string().describe('日期范围，如：5.6——5.10'),
  本月主题: z.string().describe('本月主题'),

  // AI 生成的字段
  ...WeeklyPlanAISchema.shape,

  // 可选字段
  上周回顾: SummaryContentSchema.optional().describe('上周回顾内容，150-200字（可选）'),
});

export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;
export type WeeklyPlanAI = z.infer<typeof WeeklyPlanAISchema>;

/**
 * 日计划单个活动的 Schema
 */
export const DailyPlanActivitySchema = z.object({
  日期: z.string().describe('日期，格式：月.日，如：5.6'),
  活动名称: z.string().describe('活动名称'),
  早餐: z.string().describe('早餐安排'),
  晨间活动: z.string().describe('晨间活动安排'),
  集体活动: z.string().describe('集体活动内容'),
  午餐: z.string().describe('午餐安排'),
  午休: z.string().describe('午休安排'),
  午点: z.string().describe('午点安排'),
  离园活动: z.string().describe('离园活动安排'),
});

/**
 * 日计划完整 Schema
 */
export const DailyPlanSchema = z.object({
  班级: z.string().describe('班级名称'),
  教师: z.string().describe('教师姓名'),
  ...DailyPlanActivitySchema.shape,
});

export type DailyPlan = z.infer<typeof DailyPlanSchema>;
export type DailyPlanActivity = z.infer<typeof DailyPlanActivitySchema>;

/**
 * 日计划生成请求 Schema
 */
export const GenerateDailyPlanRequestSchema = z.object({
  activities: z.array(z.string()).describe('5个集体活动名称'),
  dateRange: z.string().describe('日期范围'),
  classInfo: z.string().describe('班级信息'),
  teacher: z.string().describe('教师姓名'),
  startDate: z.string().describe('开始日期'),
  ageGroup: z.enum(['small', 'medium', 'large']).describe('年龄段'),
  weekNumber: z.string().optional().describe('第几周'),
});

export type GenerateDailyPlanRequest = z.infer<typeof GenerateDailyPlanRequestSchema>;
