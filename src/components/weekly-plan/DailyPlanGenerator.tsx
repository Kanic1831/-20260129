import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Loader2, Download } from 'lucide-react';
import { WeeklyPlanData, DailyPlanState } from './types';

interface DailyPlanGeneratorProps {
    weeklyPlanData: WeeklyPlanData;
    activitiesList: string[];
    dailyPlan: DailyPlanState;
    setDailyPlan: React.Dispatch<React.SetStateAction<DailyPlanState>>;
    handleGenerateDailyPlan: () => Promise<void>;
    handleDownloadAllDailyPlans: () => Promise<void>;
    getDateString: (index: number) => string;
}

export function DailyPlanGenerator({
    weeklyPlanData,
    activitiesList,
    dailyPlan,
    setDailyPlan,
    handleGenerateDailyPlan,
    handleDownloadAllDailyPlans,
    getDateString,
}: DailyPlanGeneratorProps) {
    if (!weeklyPlanData || activitiesList.length === 0) return null;

    const { editingActivities, loading, urls } = dailyPlan;

    return (
        <div className="mt-4 sm:mt-6 rounded-md border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-3 sm:p-4 dark:border-purple-800 dark:from-purple-900/20 dark:to-blue-900/20">
            <div className="mb-2.5 sm:mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-300">
                    生成日计划
                </h3>
            </div>

            <div className="mb-2.5 sm:mb-3 rounded-md bg-white p-2 sm:p-3 dark:bg-gray-800">
                <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                    周计划信息：
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium">日期范围：</span>{weeklyPlanData.dateRange}</p>
                    <p><span className="font-medium">班级：</span>{weeklyPlanData.classInfo}</p>
                    <p><span className="font-medium">教师：</span>{weeklyPlanData.teacher}</p>
                </div>
            </div>

            <div className="mb-4 sm:mb-5 space-y-2 sm:space-y-2.5">
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                    集体活动（点击可编辑）：
                </p>
                {editingActivities.map((activity, index) => (
                    <div key={index} className="space-y-1">
                        <Label htmlFor={`activity-${index}`} className="text-xs">
                            活动 {index + 1}（对应日期 {getDateString(index)}）
                        </Label>
                        <Textarea
                            id={`activity-${index}`}
                            value={activity}
                            onChange={(e) => {
                                const newActivities = [...editingActivities];
                                newActivities[index] = e.target.value;
                                setDailyPlan(prev => ({ ...prev, editingActivities: newActivities }));
                            }}
                            rows={2}
                            className="text-xs sm:text-sm"
                        />
                    </div>
                ))}
            </div>

            <Button
                onClick={handleGenerateDailyPlan}
                disabled={loading || editingActivities.some(a => !a.trim())}
                className="h-10 sm:h-10 w-full text-xs sm:text-sm font-semibold"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                        生成中...
                    </>
                ) : (
                    '生成5个日计划'
                )}
            </Button>

            {/* 日计划下载区域 */}
            {urls.length > 0 && (
                <div className="mt-4 sm:mt-5 rounded-md bg-green-50 px-2.5 py-2 sm:px-3 sm:py-2.5 dark:bg-green-900/20">
                    <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-green-900 dark:text-green-300">
                        日计划已生成成功！
                    </p>
                    <div className="space-y-1 sm:space-y-1.5">
                        {urls.map((url, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 rounded-md bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 dark:bg-gray-800">
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                    日计划 {index + 1}（{getDateString(index)}）
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(url, '_blank')}
                                    className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                                >
                                    <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                                    下载
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button
                        onClick={handleDownloadAllDailyPlans}
                        className="mt-2 sm:mt-3 w-full h-8 sm:h-9 text-xs sm:text-sm"
                        variant="outline"
                    >
                        <Download className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                        打包下载全部
                    </Button>
                </div>
            )}
        </div>
    );
}
