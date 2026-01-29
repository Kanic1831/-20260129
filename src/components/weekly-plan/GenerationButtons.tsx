import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Download } from 'lucide-react';
import { StreamingState } from './types';

interface GenerationButtonsProps {
    loading: boolean;
    generatedUrl: string;
    streaming: StreamingState;
    setStreaming: React.Dispatch<React.SetStateAction<StreamingState>>;
    handleGenerate: () => Promise<void>;
    handleGenerateStream: () => Promise<void>;
    handleDownload: () => Promise<void>;
}

export function GenerationButtons({
    loading,
    generatedUrl,
    streaming,
    setStreaming,
    handleGenerate,
    handleGenerateStream,
    handleDownload,
}: GenerationButtonsProps) {
    const { isStreaming, showStreaming } = streaming;

    return (
        <div className="space-y-4">
            {/* 流式生成选项 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 rounded-md border border-purple-200 bg-purple-50 px-2.5 py-2 sm:px-3 sm:py-2 dark:border-purple-800 dark:bg-purple-900/20">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="useStreaming"
                        checked={showStreaming}
                        onCheckedChange={(checked) => setStreaming(prev => ({ ...prev, showStreaming: checked === true }))}
                    />
                    <Label htmlFor="useStreaming" className="cursor-pointer text-xs sm:text-sm font-medium">
                        启用流式生成（实时显示进度）
                    </Label>
                </div>
                {showStreaming && (
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                        {isStreaming ? '生成中...' : '准备就绪'}
                    </span>
                )}
            </div>

            {/* 生成按钮 */}
            {showStreaming ? (
                <Button
                    onClick={handleGenerateStream}
                    disabled={isStreaming}
                    className="h-10 sm:h-10 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-xs sm:text-sm font-semibold hover:from-purple-700 hover:to-blue-700"
                >
                    {isStreaming ? (
                        <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            流式生成中...
                        </>
                    ) : (
                        '开始流式生成'
                    )}
                </Button>
            ) : (
                <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="h-10 sm:h-10 w-full text-xs sm:text-sm font-semibold"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            生成中...
                        </>
                    ) : (
                        '生成周计划'
                    )}
                </Button>
            )}

            {/* 下载按钮 */}
            {generatedUrl && (
                <div className="rounded-md bg-green-50 px-2.5 py-2 sm:px-3 sm:py-2.5 dark:bg-green-900/20">
                    <div className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-green-900 dark:text-green-300">
                        周计划已生成成功！
                    </div>
                    <Button
                        onClick={handleDownload}
                        className="w-full h-9 sm:h-9 text-xs sm:text-sm"
                        variant="outline"
                    >
                        <Download className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        下载生成的文档
                    </Button>
                </div>
            )}
        </div>
    );
}
