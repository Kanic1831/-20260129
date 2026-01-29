import { NextRequest, NextResponse } from 'next/server';
import { limiter } from '@/lib/concurrency-control';
import { createDailyPlanService } from '@/services/DailyPlanService';
import { toErrorStatus } from '@/lib/error-utils';
import { z } from 'zod';

/**
 * 日计划生成请求 Schema
 */
const GenerateDailyPlanRequestSchema = z.object({
  activities: z.array(z.string()).min(1, '活动列表不能为空').max(5, '最多5个活动'),
  dateRange: z.string().min(1, '日期范围不能为空'),
  classInfo: z.string().min(1, '班级信息不能为空'),
  teacher: z.string().min(1, '教师姓名不能为空'),
  startDate: z.string().min(1, '开始日期不能为空'),
  ageGroup: z.enum(['small', 'medium', 'large']).default('medium'),
  weekNumber: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // 使用并发控制限制同时处理的请求数量
  return limiter.run(async () => {
    try {
      // 1. 解析请求体
      const body = await req.json();

      // 2. 验证请求参数
      try {
        GenerateDailyPlanRequestSchema.parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: '请求参数验证失败', details: error.issues },
            { status: 400 }
          );
        }
        throw error;
      }

      const {
        activities,
        dateRange,
        classInfo,
        teacher,
        startDate,
        ageGroup,
        weekNumber,
      } = body;

      console.log('开始生成日计划');
      console.log('活动数量:', activities.length);
      console.log('班级:', classInfo);
      console.log('教师:', teacher);
      console.log('开始日期:', startDate);

      // 3. 创建 DailyPlanService 并调用生成逻辑
      const dailyPlanService = createDailyPlanService();

      const result = await dailyPlanService.generateDailyPlans({
        activities,
        dateRange,
        classInfo,
        teacher,
        startDate,
        ageGroup,
        weekNumber,
      });

      console.log('日计划生成成功，总数:', result.total);

      // 4. 返回结果
      return NextResponse.json({
        success: true,
        downloadUrls: result.downloadUrls,
        total: result.total,
      });

    } catch (error: unknown) {
      console.error('生成日计划失败:', error);

      // 返回用户友好的错误信息
      const errorMessage = error instanceof Error ? error.message : '生成日计划失败，请重试';

      return NextResponse.json(
        { error: errorMessage },
        { status: toErrorStatus(error) }
      );
    }
  });
}
