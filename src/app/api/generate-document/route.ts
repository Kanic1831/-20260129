import { NextRequest, NextResponse } from 'next/server';
import { limiter } from '@/lib/concurrency-control';
import { validateWordFile } from '@/lib/file-validation';
import { createDocumentService } from '@/services/DocumentService';
import { createStorageService } from '@/services/StorageService';
import { JSONUtils } from '@/lib/json-utils';
import { WeeklyPlanDocData, WeeklyPlanDocSchema, WeeklyPlanAI } from '@/core/schemas/plan.schema';
import { toErrorMessage, toErrorStatus } from '@/lib/error-utils';
import { z } from 'zod';

/**
 * 文档生成请求 Schema
 */
const GenerateDocumentRequestSchema = z.object({
  aiData: z.string().min(1, 'AI数据不能为空'), // JSON 字符串
  useDefaultTemplate: z.boolean(),
  classInfo: z.string().min(1, '班级信息不能为空'),
  weekNumber: z.string().min(1, '第几周不能为空'),
  teacher: z.string().min(1, '教师姓名不能为空'),
  dateRange: z.string().min(1, '日期范围不能为空'),
  ageGroup: z.enum(['small', 'medium', 'large']).default('medium'),
  monthTheme: z.string().optional(), // 月主题
});

export async function POST(req: NextRequest) {
  // 使用并发控制限制同时处理的请求数量
  return limiter.run(async () => {
    try {
      // 1. 解析表单数据
      const formData = await req.formData();
      const aiDataStr = formData.get('aiData') as string;
      const file = formData.get('file') as File | null;
      const lastWeekFile = formData.get('lastWeekFile') as File | null;
      const studentNamesFile = formData.get('studentNamesFile') as File | null;
      const useDefaultTemplate = formData.get('useDefaultTemplate') === 'true';
      const classInfo = formData.get('classInfo') as string;
      const weekNumber = formData.get('weekNumber') as string;
      const teacher = formData.get('teacher') as string;
      const dateRange = formData.get('dateRange') as string;
      const ageGroup = (formData.get('ageGroup') as string) || 'medium';
      const monthTheme = formData.get('monthTheme') as string || ''; // 月主题

      // 2. 验证请求参数
      console.log('文档生成请求参数:', {
        aiDataLength: aiDataStr?.length || 0,
        aiDataPreview: aiDataStr?.substring(0, 200),
        useDefaultTemplate,
        classInfo,
        weekNumber,
        teacher,
        dateRange,
        ageGroup,
      });

      try {
        GenerateDocumentRequestSchema.parse({
          aiData: aiDataStr,
          useDefaultTemplate,
          classInfo,
          weekNumber,
          teacher,
          dateRange,
          ageGroup,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('参数验证失败:', error.issues);
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

      // 4. 解析 AI 数据 - 只验证 JSON 格式，不验证业务规范
      // AI 生成的内容是不可预测的，严格验证会导致大量失败
      let aiData: unknown;
      try {
        console.log('=== AI 数据处理日志 ===');
        console.log('AI 返回的原始数据:', JSON.stringify(aiDataStr, null, 2).substring(0, 1000));

        // 只做 JSON 解析，不做 Schema 验证
        aiData = JSON.parse(aiDataStr);
        console.log('JSON 解析成功');
        if (typeof aiData === 'object' && aiData !== null && '集体活动' in aiData) {
          const collective = (aiData as Record<string, unknown>).集体活动;
          if (typeof collective === 'string') {
            console.log('解析后的集体活动字段:', collective.substring(0, 300));
          }
        }

        // 不再验证 Schema - AI 输出不可预测，验证只会导致失败
        // 只要 JSON 能解析，就直接使用
      } catch (error) {
        console.error('AI 数据处理失败:', error);
        return NextResponse.json(
          { error: 'AI 数据格式错误，请重新生成', details: error instanceof Error ? error.message : String(error) },
          { status: 400 }
        );
      }

      // 5. 创建服务
      const documentService = createDocumentService();
      const storageService = createStorageService();

      // 6. 准备模板数据和提取活动列表
      if (typeof aiData !== 'object' || aiData === null) {
        return NextResponse.json(
          { error: 'AI 数据格式错误，请重新生成' },
          { status: 400 }
        );
      }

      const processedAiData = JSONUtils.processNewlines(aiData) as Partial<WeeklyPlanAI>;

      console.log('处理后的集体活动字段:', processedAiData.集体活动?.substring(0, 300));

      // 清理多条内容字段（确保每条内容独立成行）
      const multiLineFields = ['集体活动', '学习区', '运动区', '公共区域', '班级区域', '过渡环节'];
      const finalAiData = JSONUtils.cleanMultiLineFields(processedAiData as Record<string, unknown>, multiLineFields) as Partial<WeeklyPlanAI>;

      // 确保可选字段有默认值（避免 Word 模板渲染失败）
      if (!finalAiData.周回顾) {
        finalAiData.周回顾 = '';
      }
      if (!finalAiData.观察与反思) {
        finalAiData.观察与反思 = '';
      }

      // 提取集体活动列表（用于日计划生成）
      let activities: string[] = [];
      const collectiveActivities = finalAiData.集体活动;

      if (collectiveActivities) {
        const lines = collectiveActivities.split('\n').filter((line: string) => line.trim());
        activities = lines;
      }

      const templateData: WeeklyPlanDocData = {
        班级: classInfo,
        第几周: weekNumber,
        教师: teacher,
        日期: dateRange,
        本月主题: monthTheme,
        上周回顾: '',
        儿童议会: typeof finalAiData.儿童议会 === 'string' ? finalAiData.儿童议会 : '',
        公共区域: typeof finalAiData.公共区域 === 'string' ? finalAiData.公共区域 : '',
        反思与调整: typeof finalAiData.反思与调整 === 'string' ? finalAiData.反思与调整 : '',
        学习区: typeof finalAiData.学习区 === 'string' ? finalAiData.学习区 : '',
        家园共育: typeof finalAiData.家园共育 === 'string' ? finalAiData.家园共育 : '',
        本周主题: typeof finalAiData.本周主题 === 'string' ? finalAiData.本周主题 : '',
        本周目标: typeof finalAiData.本周目标 === 'string' ? finalAiData.本周目标 : '',
        环境创设: typeof finalAiData.环境创设 === 'string' ? finalAiData.环境创设 : '',
        班级区域: typeof finalAiData.班级区域 === 'string' ? finalAiData.班级区域 : '',
        自主签到: typeof finalAiData.自主签到 === 'string' ? finalAiData.自主签到 : '',
        资源利用: typeof finalAiData.资源利用 === 'string' ? finalAiData.资源利用 : '',
        过渡环节: typeof finalAiData.过渡环节 === 'string' ? finalAiData.过渡环节 : '',
        运动区: typeof finalAiData.运动区 === 'string' ? finalAiData.运动区 : '',
        集体活动: typeof finalAiData.集体活动 === 'string' ? finalAiData.集体活动 : '',
        餐点进餐: typeof finalAiData.餐点进餐 === 'string' ? finalAiData.餐点进餐 : '',
      };

      WeeklyPlanDocSchema.parse(templateData);

      console.log('=== 传递给 Word 模板的数据 ===');
      console.log('集体活动字段:', templateData.集体活动?.substring(0, 300));
      console.log('是否包含实际换行符:', templateData.集体活动?.includes('\n'));
      console.log('是否包含转义换行符:', templateData.集体活动?.includes('\\n'));
      console.log('=====================');

      // 7. 生成 Word 文档
      let docBuffer: Buffer;

      if (useDefaultTemplate) {
        // 获取默认模板并生成文档
        const template = await documentService.getDefaultTemplate();
        docBuffer = await documentService.generateDocx(template, templateData);
      } else if (file) {
        // 使用上传的模板文件
        const fileBuffer = await file.arrayBuffer();
        const fileUint8Array = new Uint8Array(fileBuffer);
        docBuffer = await documentService.generateDocx(fileUint8Array, templateData);
      } else {
        throw new Error('请提供模板文件或使用默认模板');
      }

      // 8. 生成文件名
      const filename = `周计划_${classInfo}_第${weekNumber}周_${Date.now()}.docx`;

      // 9. 上传到对象存储
      const downloadUrl = await storageService.upload(
        filename,
        docBuffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      console.log('文档生成成功:', filename);

      // 10. 返回结果
      return NextResponse.json({
        success: true,
        downloadUrl,
        filename,
        activities,
        dateRange,
        classInfo,
        teacher,
        ageGroup,
      });

    } catch (error: unknown) {
      console.error('生成文档失败:', error);

      // 返回用户友好的错误信息
      const errorMessage = toErrorMessage(error, '生成文档失败，请重试');

      return NextResponse.json(
        { error: errorMessage },
        { status: toErrorStatus(error) }
      );
    }
  });
}
