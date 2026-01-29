import { NextRequest } from 'next/server';
import { createAIService } from '@/services/AIService';
import { WeeklyPlanAISchema } from '@/core/schemas/plan.schema';
import { z } from 'zod';

/**
 * 生成参数验证 Schema
 */
const GeneratePlanSchema = z.object({
  monthTheme: z.string().min(1, '月主题不能为空'),
  monthlyPlan: z.string().min(1, '月计划不能为空'),
  ageGroup: z.string().min(1, '年龄组不能为空'),
  knowledgeBaseInfo: z.string().optional(),
  selectedNames: z.array(z.string()).optional(),
  hasLastWeekPlan: z.boolean().optional(), // 是否有上周计划
});

/**
 * POST /api/generate-plan-stream
 * 流式生成周计划
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求参数
    const body = await request.json();
    const params = GeneratePlanSchema.parse(body);

    // 2. 创建 AI 服务
    const aiService = createAIService();

    // 3. 流式生成周计划
    const stream = aiService.streamWeeklyPlan(params);

    // 4. 创建 SSE 流
    const encoder = new TextEncoder();

    // 5. 返回流式响应
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            let fullContent = '';
            let buffer = '';

            for await (const chunk of stream) {
              // 收集完整内容
              fullContent += chunk;

              // 将 chunk 转换为 SSE 格式
              buffer += chunk;

              // 发送 SSE 数据
              const data = JSON.stringify({ content: chunk, fullContent });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));

              // 清空缓冲区
              buffer = '';
            }

            // 发送完成信号
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();

          } catch (error) {
            console.error('流式生成错误:', error);
            const errorMsg = JSON.stringify({
              error: error instanceof Error ? error.message : '生成失败',
            });
            controller.enqueue(encoder.encode(`data: ${errorMsg}\n\n`));
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      }
    );
  } catch (error) {
    console.error('生成周计划失败:', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: '参数验证失败', details: error.issues },
        { status: 400 }
      );
    }

    return Response.json(
      { error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 }
    );
  }
}
