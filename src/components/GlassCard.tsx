/**
 * 玻璃拟态卡片组件
 * 用于实时预览 AI 生成的关键信息
 */
import { Card } from '@/components/ui/card';

interface GlassCardProps {
  title: string;
  content: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function GlassCard({ title, content, icon, isLoading }: GlassCardProps) {
  return (
    <Card
      className="relative overflow-hidden backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/40"
    >
      {/* 背景装饰 */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl" />
      <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-2xl" />

      {/* 卡片内容 */}
      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          {icon && <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
            {icon}
          </div>}
          <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
            {title}
          </h3>
        </div>

        <div className="min-h-[60px] rounded-xl bg-white/50 p-4 text-sm leading-relaxed text-gray-700 shadow-inner backdrop-blur-sm dark:bg-gray-900/50 dark:text-gray-300">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
            </div>
          ) : content ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="text-gray-400 dark:text-gray-600">等待生成...</div>
          )}
        </div>
      </div>
    </Card>
  );
}
