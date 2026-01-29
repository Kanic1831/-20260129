import { describe, it, expect } from 'vitest';
import { WeeklyPlanAISchema, DailyPlanSchema } from '@/core/schemas/plan.schema';

describe('WeeklyPlanAISchema', () => {
  const validWeeklyPlan = {
    儿童议会: '测试内容',
    公共区域: '测试内容',
    反思与调整:
      '反思与调整：本周教学活动取得了较好的效果，幼儿在各个领域都有了明显的进步。科学活动中，孩子们通过观察植物的生长变化，培养了探索精神；语言活动中，孩子们积极讲述春天的故事，提高了表达能力。艺术活动激发了孩子们对美的感知，音乐活动让他们在歌唱中体验快乐，社会活动培养了孩子们关爱小动物的品质。同时，我们也注意到了一些需要改进的地方，比如部分幼儿在自主游戏中缺乏合作意识，今后我们会加强这方面的引导。总体来说，本周的教学活动圆满完成，达到了预期目标。',
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
      expect(result.success).toBe(true);
    });

    it('should require all required fields', () => {
      const result = WeeklyPlanAISchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorFields = result.error.issues.map((i) => i.path.join('.'));
        expect(errorFields).toContain('儿童议会');
        expect(errorFields).toContain('本周主题');
        expect(errorFields).toContain('集体活动');
      }
    });

    it('should allow flexible 集体活动 content', () => {
      const flexibleActivity = {
        ...validWeeklyPlan,
        集体活动: '1. 科学活动：观察春天的变化。\n2. 语言活动：讲述春天的故事。',
      };
      const result = WeeklyPlanAISchema.safeParse(flexibleActivity);
      expect(result.success).toBe(true);
    });

    it('should allow flexible summary length', () => {
      const shortLength = '这是太短的内容。';
      const shortData = {
        ...validWeeklyPlan,
        反思与调整: shortLength,
      };
      const shortResult = WeeklyPlanAISchema.safeParse(shortData);
      expect(shortResult.success).toBe(true);
    });

    it('should allow optional fields to be optional', () => {
      const withoutOptional = {
        ...validWeeklyPlan,
      };

      const result = WeeklyPlanAISchema.safeParse(withoutOptional);
      expect(result.success).toBe(true);
    });

    it('should validate optional fields when present', () => {
      const withOptional = {
        ...validWeeklyPlan,
        周回顾: '周回顾：本周整体教学活动顺利完成，孩子们在各个领域都有所收获。通过本周的活动，孩子们不仅学到了知识，还培养了良好的习惯。家长们对我们的工作给予了积极的评价，表示孩子们回家后能主动分享在园所的经历。我们也会继续努力，为孩子们提供更好的教育环境。总体来说，本周工作圆满结束。',
        观察与反思: '观察与反思：通过观察孩子们在本周活动中的表现，我注意到他们对科学探索活动特别感兴趣。孩子们在观察植物生长时表现出的专注和好奇心让我印象深刻。同时，我也发现部分孩子在语言表达方面还需要加强，今后我们会提供更多的机会让孩子们练习表达。艺术活动中，孩子们的创造力得到了很好的发挥，每个孩子都能用自己独特的方式表达对春天的理解。',
      };

      const result = WeeklyPlanAISchema.safeParse(withOptional);
      expect(result.success).toBe(true);
    });
  });
});

describe('DailyPlanSchema', () => {
  const validDailyPlan = {
    班级: '大一班',
    教师: '张老师',
    日期: '5.6',
    入园签到: '入园问候、晨检',
    学习区: '阅读角、建构区',
    运动区: '跳跃练习',
    公共区域: '走廊巡游',
    班级区域: '整理区角',
    过渡环节: '整理物品',
    自主进餐: '自助取餐',
    午睡: '安静休息',
    学习与发展: '培养观察能力',
    活动组织: '以“测试活动”为核心组织活动',
    指导与调整: '教师示范并个别指导',
    观察与反思: '关注幼儿参与情况',
    童言稚语: '孩子们分享感受',
    经验梳理: '总结活动收获',
    区域活动材料: '积木、绘本',
    集体活动材料: '图片卡、实验材料',
    户外活动材料: '皮球、跳绳',
    保育与安全材料提供: '消毒用品、医药箱',
  };

  describe('validation', () => {
    it('should validate a valid daily plan', () => {
      const result = DailyPlanSchema.safeParse(validDailyPlan);
      expect(result.success).toBe(true);
    });

    it('should require all fields', () => {
      const result = DailyPlanSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorFields = result.error.issues.map((i) => i.path.join('.'));
        expect(errorFields.length).toBeGreaterThan(0);
      }
    });

    it('should validate string types', () => {
      const withNonString = {
        ...validDailyPlan,
        日期: 123, // 应该是字符串
      };
      const result = DailyPlanSchema.safeParse(withNonString);
      expect(result.success).toBe(false);
    });
  });
});
