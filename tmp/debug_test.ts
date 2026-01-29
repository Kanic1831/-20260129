import { describe, it, expect } from 'vitest';
import { WeeklyPlanAISchema } from '@/core/schemas/plan.schema';

describe('WeeklyPlanAISchema - Debug', () => {
  it('should debug validActivity', () => {
    const validWeeklyPlan = {
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

    const validActivity = {
      ...validWeeklyPlan,
      集体活动:
        '1. 科学活动：观察春天的变化。\n2. 语言活动：讲述春天的故事。\n3. 艺术活动：绘画春天的景色。\n4. 音乐活动：学唱春天的歌曲。\n5. 社会活动：关爱小动物。',
    };

    console.log('集体活动:', validActivity.集体活动);
    console.log('集体活动 length:', validActivity.集体活动.length);
    const lines = validActivity.集体活动.split('\n');
    console.log('Lines count:', lines.length);
    lines.forEach((line, i) => console.log(`Line ${i}: "${line}"`));

    const result = WeeklyPlanAISchema.safeParse(validActivity);
    console.log('Result success:', result.success);
    if (!result.success) {
      console.log('Errors:');
      result.error.issues.forEach(issue => {
        console.log(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
    }
  });
});
