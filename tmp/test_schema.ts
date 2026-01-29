import { describe, it, expect } from 'vitest';
import { WeeklyPlanAISchema, DailyPlanSchema } from '@/core/schemas/plan.schema';

// Helper function to print errors
function printErrors(result: any) {
  if (!result.success) {
    console.log('Validation errors:');
    result.error.issues.forEach((issue: any) => {
      console.log(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
  }
}

describe('WeeklyPlanAISchema', () => {
  const validWeeklyPlan = {
    儿童议会: '测试内容',
    公共区域: '测试内容',
    反思与调整:
      '这是一段反思与调整内容，大约100字到250字之间，用于测试验证规则。长度应该在这个范围内。',
    学习区: '1. 科学区：测试内容。\n2. 美工区：测试内容。',
    家园共育: '测试内容',
    本周主题: '春天的脚步',
    本周目标: '测试目标',
    环境创设: '测试内容',
    班级区域: '测试内容',
    自主签到: '测试内容',
    资源利用: '测试内容',
    过渡环节: '测试内容',
    运动区: '1. 跳绳：测试内容。\n2. 跑步：测试内容。',
    集体活动:
      '1. 科学活动：观察春天的变化。\n2. 语言活动：讲述春天的故事。\n3. 艺术活动：绘画春天的景色。\n4. 音乐活动：学唱春天的歌曲。\n5. 社会活动：关爱小动物。',
    餐点进餐: '测试内容',
  };

  describe('validation', () => {
    it('should validate a valid weekly plan', () => {
      const result = WeeklyPlanAISchema.safeParse(validWeeklyPlan);
      printErrors(result);
      expect(result.success).toBe(true);
    });
  });
});
