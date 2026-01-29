import { NextRequest, NextResponse } from 'next/server';
import { limiter } from '@/lib/concurrency-control';
import { validateWordFile } from '@/lib/file-validation';
import { createPlanService } from '@/services/PlanService';
import { z } from 'zod';

/**
 * 周计划生成请求 Schema
 */
const GenerateWeeklyPlanRequestSchema = z.object({
  file: z.any().optional(),
  lastWeekFile: z.any().optional(),
  studentNamesFile: z.any().optional(),
  monthTheme: z.string().min(1, '月主题不能为空'),
  monthlyPlan: z.string().optional(),
  useDefaultTemplate: z.boolean(),
  classInfo: z.string().min(1, '班级信息不能为空'),
  weekNumber: z.string().min(1, '第几周不能为空'),
  teacher: z.string().min(1, '教师姓名不能为空'),
  dateRange: z.string().min(1, '日期范围不能为空'),
  ageGroup: z.enum(['small', 'medium', 'large']).default('medium'),
});

export async function POST(req: NextRequest) {
  // 使用并发控制限制同时处理的请求数量
  return limiter.run(async () => {
    try {
      // 1. 解析表单数据
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const lastWeekFile = formData.get('lastWeekFile') as File | null;
      const studentNamesFile = formData.get('studentNamesFile') as File | null;
      const monthTheme = formData.get('monthTheme') as string;
      const monthlyPlan = formData.get('monthlyPlan') as string;
      const useDefaultTemplate = formData.get('useDefaultTemplate') === 'true';
      const classInfo = formData.get('classInfo') as string;
      const weekNumber = formData.get('weekNumber') as string;
      const teacher = formData.get('teacher') as string;
      const dateRange = formData.get('dateRange') as string;
      const ageGroup = (formData.get('ageGroup') as string) || 'medium';

      // 2. 验证请求参数
      try {
        GenerateWeeklyPlanRequestSchema.parse({
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
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: '请求参数验证失败', details: error.issues },
            { status: 400 }
          );
        }
        throw error;
      }

      // 3. 验证文件大小和类型
      if (!useDefaultTemplate && file) {
        validateWordFile(file);
      }

      if (lastWeekFile) {
        validateWordFile(lastWeekFile);
      }

      if (studentNamesFile) {
        validateWordFile(studentNamesFile);
      }

      // 4. 创建 PlanService 并调用生成逻辑
      const planService = createPlanService();

      const result = await planService.generateWeeklyPlan({
        file,
        lastWeekFile,
        studentNamesFile,
        monthTheme,
        monthlyPlan: monthlyPlan || '',
        useDefaultTemplate,
        classInfo,
        weekNumber,
        teacher,
        dateRange,
        ageGroup,
      });

      console.log('周计划生成成功');

      // 5. 返回结果
      return NextResponse.json({
        success: true,
        downloadUrl: result.downloadUrl,
        activities: result.activities,
        dateRange: result.dateRange,
        classInfo: result.classInfo,
        teacher: result.teacher,
        ageGroup: result.ageGroup,
      });

    } catch (error: any) {
      console.error('生成周计划失败:', error);

      // 返回用户友好的错误信息
      const errorMessage = error.message || '生成周计划失败，请重试';

      return NextResponse.json(
        { error: errorMessage },
        { status: error.status || 500 }
      );
    }
  });
}
