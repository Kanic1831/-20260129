import { NextRequest, NextResponse } from 'next/server';
import { limiter } from '@/lib/concurrency-control';
import { validateWordFile } from '@/lib/file-validation';
import { createDocumentService } from '@/services/DocumentService';
import { createStorageService } from '@/services/StorageService';
import { WeeklyPlanAISchema } from '@/core/schemas/plan.schema';
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
      let aiData: any;
      try {
        console.log('=== AI 数据处理日志 ===');
        console.log('AI 返回的原始数据:', JSON.stringify(aiDataStr, null, 2).substring(0, 1000));

        // 只做 JSON 解析，不做 Schema 验证
        aiData = JSON.parse(aiDataStr);
        console.log('JSON 解析成功');
        console.log('解析后的集体活动字段:', aiData.集体活动?.substring(0, 300));

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
      const processedAiData = { ...aiData };

      // 统一处理换行符：将所有字符串字段中的 \\n 替换为实际换行符
      const processField = (value: any): any => {
        if (typeof value === 'string') {
          // 将转义的换行符 \\n 替换为实际的换行符 \n
          const processed = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
          if (value.includes('\\n')) {
            console.log(`  - 发现转义换行符，处理前长度: ${value.length}, 处理后长度: ${processed.length}`);
          }
          return processed;
        }
        return value;
      };

      // 处理所有字段
      for (const key in processedAiData) {
        processedAiData[key] = processField(processedAiData[key]);
      }

      console.log('处理后的集体活动字段:', processedAiData.集体活动?.substring(0, 300));

      // 防御性处理：将单个活动内部的换行符替换为空格（确保每个活动在一行内）
      // 针对包含多条内容的字段：集体活动、学习区、运动区、公共区域等
      const multiLineFields = ['集体活动', '学习区', '运动区', '公共区域', '班级区域', '过渡环节'];
      for (const fieldName of multiLineFields) {
        if (processedAiData[fieldName] && typeof processedAiData[fieldName] === 'string') {
          const originalValue = processedAiData[fieldName];
          console.log(`处理前 ${fieldName}:`, originalValue.substring(0, 200));

          // 按行分割（按数字编号开头的模式分割）
          // 使用正则表达式匹配 "数字." 或 "数字、" 作为行分隔符
          const lines = originalValue.split(/(?<=\d+[.、])/).map((line: string) => {
            // 去除首尾空格
            return line.trim();
          }).filter((line: string) => line.length > 0);

          // 对每一行，将其内部的多个空格、换行符合并为单个空格
          const processedLines = lines.map((line: string) => {
            // 将行内的多个空白字符（包括空格、制表符、换行等）替换为单个空格
            return line.replace(/\s+/g, ' ').trim();
          });

          // 重新组合，每行之间用 \n 分隔
          processedAiData[fieldName] = processedLines.join('\n');
          console.log(`处理后 ${fieldName}:`, processedAiData[fieldName].substring(0, 200));
        }
      }

      // 确保可选字段有默认值（避免 Word 模板渲染失败）
      if (!processedAiData.周回顾) {
        processedAiData.周回顾 = '';
      }
      if (!processedAiData.观察与反思) {
        processedAiData.观察与反思 = '';
      }

      // 提取集体活动列表（用于日计划生成）
      let activities: string[] = [];
      const collectiveActivities = processedAiData.集体活动;

      if (collectiveActivities) {
        // 按行分割并提取活动
        const lines = collectiveActivities.split('\n').filter((line: string) => line.trim());
        activities = lines;
      }

      const templateData = {
        班级: classInfo,
        第几周: weekNumber,
        教师: teacher,
        日期: dateRange,
        本月主题: monthTheme,
        年龄段: ageGroup === 'small' ? '3~4岁' : ageGroup === 'medium' ? '4~5岁' : '5~6岁',
        上周回顾: '',
        ...processedAiData,
      };

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

    } catch (error: any) {
      console.error('生成文档失败:', error);

      // 返回用户友好的错误信息
      const errorMessage = error.message || '生成文档失败，请重试';

      return NextResponse.json(
        { error: errorMessage },
        { status: error.status || 500 }
      );
    }
  });
}
