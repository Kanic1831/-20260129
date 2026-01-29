import { GlassCard } from '@/components/GlassCard';
import { Users, Target } from 'lucide-react';
import { StreamingState, PreviewState } from './types';

interface StreamingPreviewProps {
    streaming: StreamingState;
    preview: PreviewState;
}

/**
 * 格式化内容：将转义的换行符转换为真正的换行符
 */
function formatContent(content: string | undefined): string {
    if (!content) return '';
    // 将 \\n 转换为真正的换行符 \n
    return content.replace(/\\n/g, '\n');
}

export function StreamingPreview({ streaming, preview }: StreamingPreviewProps) {
    const { isStreaming, streamingContent, formattedJson, showStreaming } = streaming;
    const { collectiveActivities, weeklyGoal } = preview;

    if (!showStreaming || (!streamingContent && !collectiveActivities && !weeklyGoal)) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* 玻璃拟态实时预览卡片 */}
            <div className="grid gap-4 sm:grid-cols-2">
                <GlassCard
                    title="集体活动"
                    content={formatContent(collectiveActivities)}
                    icon={<Users className="h-5 w-5" />}
                    isLoading={isStreaming && !collectiveActivities}
                />
                <GlassCard
                    title="本周目标"
                    content={formatContent(weeklyGoal)}
                    icon={<Target className="h-5 w-5" />}
                    isLoading={isStreaming && !weeklyGoal}
                />
            </div>

            {/* JSON 原始内容（可折叠） */}
            <div className="rounded-md border border-blue-200 bg-blue-50 p-2.5 sm:p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="mb-1.5 sm:mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                    <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-300">
                        AI 生成内容（实时）
                    </span>
                    {isStreaming && (
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" />
                        </div>
                    )}
                </div>
                <div className="max-h-64 sm:max-h-96 overflow-auto rounded bg-white p-2 sm:p-3 dark:bg-gray-800">
                    <pre className="whitespace-pre-wrap text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 font-mono">
                        {formattedJson || streamingContent}
                    </pre>
                </div>
            </div>
        </div>
    );
}
