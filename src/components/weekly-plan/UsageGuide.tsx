import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function UsageGuide() {
    return (
        <Card className="mt-4 sm:mt-6">
            <CardHeader>
                <CardTitle className="text-lg sm:text-xl">使用说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <p>1. 填写基本信息：班级、第几周、教师、日期和本周天数</p>
                <p>2. 选择开始日期和本周天数，系统会自动计算日期范围（如 5.2——5.6日）</p>
                <p>3. 填写月主题和月计划，AI 将自动生成其他内容</p>
                <p>4. 选择使用默认模板或上传自定义模板</p>
                <p>5. 点击"生成周计划"按钮</p>
                <p>6. 生成完成后，点击"下载生成的文档"获取结果</p>
            </CardContent>
        </Card>
    );
}
