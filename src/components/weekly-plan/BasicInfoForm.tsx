import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklyPlanFormData } from './types';

interface BasicInfoFormProps {
    formData: WeeklyPlanFormData;
    setFormData: React.Dispatch<React.SetStateAction<WeeklyPlanFormData>>;
    dateRange: string;
}

export function BasicInfoForm({ formData, setFormData, dateRange }: BasicInfoFormProps) {
    const updateField = (field: keyof WeeklyPlanFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-3 sm:space-y-4 rounded-md border border-input bg-background p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold">基本信息（手动填写）</h3>

            <div className="grid grid-cols-1 gap-x-3 sm:gap-x-4 gap-y-2.5 sm:gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* 班级 */}
                <div className="space-y-1.5">
                    <Label htmlFor="classInfo" className="text-xs sm:text-sm font-medium">班级</Label>
                    <Input
                        id="classInfo"
                        placeholder="例如：大班"
                        value={formData.classInfo}
                        onChange={(e) => updateField('classInfo', e.target.value)}
                        className="h-9 sm:h-9 w-full text-xs sm:text-sm"
                    />
                </div>

                {/* 年龄段 */}
                <div className="space-y-1.5">
                    <Label htmlFor="ageGroup" className="text-xs sm:text-sm font-medium">年龄段</Label>
                    <Select value={formData.ageGroup} onValueChange={(val) => updateField('ageGroup', val)}>
                        <SelectTrigger className="h-9 sm:h-9 w-full text-xs sm:text-sm">
                            <SelectValue placeholder="选择" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="small">小班（3-4岁）</SelectItem>
                            <SelectItem value="medium">中班（4-5岁）</SelectItem>
                            <SelectItem value="large">大班（5-6岁）</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 第几周 */}
                <div className="space-y-1.5">
                    <Label htmlFor="weekNumber" className="text-xs sm:text-sm font-medium">第几周</Label>
                    <Input
                        id="weekNumber"
                        placeholder="例如：第1周"
                        value={formData.weekNumber}
                        onChange={(e) => updateField('weekNumber', e.target.value)}
                        className="h-9 sm:h-9 w-full text-xs sm:text-sm"
                    />
                </div>

                {/* 教师 */}
                <div className="space-y-1.5">
                    <Label htmlFor="teacher" className="text-xs sm:text-sm font-medium">教师</Label>
                    <Input
                        id="teacher"
                        placeholder="例如：王老师"
                        value={formData.teacher}
                        onChange={(e) => updateField('teacher', e.target.value)}
                        className="h-9 sm:h-9 w-full text-xs sm:text-sm"
                    />
                </div>

                {/* 本周天数 */}
                <div className="space-y-1.5">
                    <Label htmlFor="weekDays" className="text-xs sm:text-sm font-medium">本周天数</Label>
                    <Select value={formData.weekDays} onValueChange={(val) => updateField('weekDays', val)}>
                        <SelectTrigger className="h-9 sm:h-9 w-full text-xs sm:text-sm">
                            <SelectValue placeholder="选择" />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                    {day}天
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 开始日期 */}
                <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-xs sm:text-sm font-medium">开始日期</Label>
                    <Input
                        id="startDate"
                        type="date"
                        value={formData.selectedDate}
                        onChange={(e) => updateField('selectedDate', e.target.value)}
                        className="h-9 sm:h-9 w-full text-xs sm:text-sm"
                    />
                </div>
            </div>

            {/* 日期范围显示 */}
            {dateRange && (
                <div className="rounded-md bg-blue-50 px-2.5 py-1.5 sm:px-3 sm:py-2 dark:bg-blue-900/20">
                    <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-300">
                        日期范围：{dateRange}
                    </p>
                </div>
            )}
        </div>
    );
}
