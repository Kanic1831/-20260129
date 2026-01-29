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

    it('should validate 集体活动 format', () => {
      // 测试正确的 5 个不同领域的活动
      const validActivity = {
        儿童议会: '测试内容',
        公共区域: '测试内容',
        反思与调整: '反思与调整：本周教学活动取得了较好的效果，幼儿在各个领域都有了明显的进步。科学活动中，孩子们通过观察植物的生长变化，培养了探索精神；语言活动中，孩子们积极讲述春天的故事，提高了表达能力。艺术活动激发了孩子们对美的感知，音乐活动让他们在歌唱中体验快乐，社会活动培养了孩子们关爱小动物的品质。同时，我们也注意到了一些需要改进的地方，比如部分幼儿在自主游戏中缺乏合作意识，今后我们会加强这方面的引导。总体来说，本周的教学活动圆满完成，达到了预期目标。',
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
      const result = WeeklyPlanAISchema.safeParse(validActivity);
      expect(result.success).toBe(true);

      // 测试不是 5 个活动的情况
      const invalidActivity1 = {
        儿童议会: '测试内容',
        公共区域: '测试内容',
        反思与调整: '反思与调整：本周教学活动取得了较好的效果，幼儿在各个领域都有了明显的进步。科学活动中，孩子们通过观察植物的生长变化，培养了探索精神；语言活动中，孩子们积极讲述春天的故事，提高了表达能力。艺术活动激发了孩子们对美的感知，音乐活动让他们在歌唱中体验快乐，社会活动培养了孩子们关爱小动物的品质。同时，我们也注意到了一些需要改进的地方，比如部分幼儿在自主游戏中缺乏合作意识，今后我们会加强这方面的引导。总体来说，本周的教学活动圆满完成，达到了预期目标。',
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
          '1. 科学活动：观察春天的变化。\n2. 语言活动：讲述春天的故事。',
        餐点进餐: '测试内容',
      };
      const result1 = WeeklyPlanAISchema.safeParse(invalidActivity1);
      expect(result1.success).toBe(false);

      // 测试不是不同领域的情况
      const invalidActivity2 = {
        ...validWeeklyPlan,
        集体活动:
          '1. 科学活动：观察春天的变化。\n2. 科学活动：探索春天的奥秘。\n3. 科学活动：研究春天的植物。\n4. 科学活动：了解春天的动物。\n5. 科学活动：发现春天的美丽。',
      };
      const result2 = WeeklyPlanAISchema.safeParse(invalidActivity2);
      expect(result2.success).toBe(false);
    });

    it('should validate 总结性内容 length (150-200 characters)', () => {
      // 测试正确长度的内容（约 100-250 字符）
      const validLength = '这是一段测试内容，长度大约在一百字到两百五十字之间，用于验证 Zod Schema 的长度验证规则是否正确工作。这段内容应该能够通过验证。这是一段测试内容，长度大约在一百字到两百五十字之间，用于验证 Zod Schema 的长度验证规则是否正确工作。';
      const validData = {
        ...validWeeklyPlan,
        反思与调整: validLength,
      };
      const result = WeeklyPlanAISchema.safeParse(validData);
      expect(result.success).toBe(true);

      // 测试过短的内容（少于 100 字符）
      const shortLength = '这是太短的内容。';
      const shortData = {
        ...validWeeklyPlan,
        反思与调整: shortLength,
      };
      const shortResult = WeeklyPlanAISchema.safeParse(shortData);
      expect(shortResult.success).toBe(false);

      // 测试过长的内容（超过 250 字符）
      const longLength =
        '这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。这是一段非常长的内容，超过了250个字符的限制。';
      const longData = {
        ...validWeeklyPlan,
        反思与调整: longLength,
      };
      const longResult = WeeklyPlanAISchema.safeParse(longData);
      expect(longResult.success).toBe(false);
    });

    it('should validate 多条活动 format (每行一句号结尾)', () => {
      // 测试正确的多行格式
      const validMultiLine = {
        儿童议会: '测试内容',
        公共区域: '测试内容',
        反思与调整: '反思与调整：本周教学活动取得了较好的效果，幼儿在各个领域都有了明显的进步。科学活动中，孩子们通过观察植物的生长变化，培养了探索精神；语言活动中，孩子们积极讲述春天的故事，提高了表达能力。艺术活动激发了孩子们对美的感知，音乐活动让他们在歌唱中体验快乐，社会活动培养了孩子们关爱小动物的品质。同时，我们也注意到了一些需要改进的地方，比如部分幼儿在自主游戏中缺乏合作意识，今后我们会加强这方面的引导。总体来说，本周的教学活动圆满完成，达到了预期目标。',
        学习区:
          '1. 科学区：提供材料，让幼儿观察植物。\n2. 美工区：提供彩纸，让幼儿制作手工。\n3. 建构区：提供积木，让幼儿搭建城堡。',
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
      const result = WeeklyPlanAISchema.safeParse(validMultiLine);
      expect(result.success).toBe(true);

      // 测试不正确的格式（缺少句号）
      const invalidMultiLine = {
        儿童议会: '测试内容',
        公共区域: '测试内容',
        反思与调整: '反思与调整：本周教学活动取得了较好的效果，幼儿在各个领域都有了明显的进步。科学活动中，孩子们通过观察植物的生长变化，培养了探索精神；语言活动中，孩子们积极讲述春天的故事，提高了表达能力。艺术活动激发了孩子们对美的感知，音乐活动让他们在歌唱中体验快乐，社会活动培养了孩子们关爱小动物的品质。同时，我们也注意到了一些需要改进的地方，比如部分幼儿在自主游戏中缺乏合作意识，今后我们会加强这方面的引导。总体来说，本周的教学活动圆满完成，达到了预期目标。',
        学习区:
          '1. 科学区：提供材料，让幼儿观察植物\n2. 美工区：提供彩纸，让幼儿制作手工',
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
      const resultInvalid = WeeklyPlanAISchema.safeParse(invalidMultiLine);
      expect(resultInvalid.success).toBe(false);
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
    班级: "大一班",
    教师: "张老师",
    活动名称: "测试活动",
    日期: '5.6',
    早餐: '小米粥、鸡蛋、馒头',
    晨间活动: '晨间阅读、自由活动',
    集体活动: '科学活动：观察植物',
    午餐: '米饭、炒菜、汤',
    午休: '安静休息',
    午点: '水果、饼干',
    离园活动: '整理物品、自由游戏',
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
