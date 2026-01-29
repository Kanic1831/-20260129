import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import { WeeklyPlanFormData } from './types';

interface AIGenerationSectionProps {
    formData: WeeklyPlanFormData;
    setFormData: React.Dispatch<React.SetStateAction<WeeklyPlanFormData>>;
}

export function AIGenerationSection({ formData, setFormData }: AIGenerationSectionProps) {
    const updateField = (field: keyof WeeklyPlanFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-3 sm:space-y-4 rounded-md border border-input bg-gradient-to-r from-purple-50 to-blue-50 p-3 sm:p-4 dark:from-purple-900/20 dark:to-blue-900/20">
            <div className="flex items-center gap-2">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base sm:text-lg font-semibold">AI自动生成区域</h3>
            </div>

            {/* 月主题 */}
            <div className="space-y-1.5">
                <Label htmlFor="monthTheme" className="text-xs sm:text-sm font-medium">月主题 *</Label>
                <Input
                    id="monthTheme"
                    placeholder="例如：春天的脚步"
                    value={formData.monthTheme}
                    onChange={(e) => updateField('monthTheme', e.target.value)}
                    className="h-9 sm:h-9 text-xs sm:text-sm"
                />
            </div>

            {/* 月计划 */}
            <div className="space-y-1.5">
                <Label htmlFor="monthlyPlan" className="text-xs sm:text-sm font-medium">月计划 *（选填）</Label>
                <Textarea
                    id="monthlyPlan"
                    placeholder="请输入详细的月计划内容..."
                    value={formData.monthlyPlan}
                    onChange={(e) => updateField('monthlyPlan', e.target.value)}
                    rows={4}
                    className="text-xs sm:text-sm"
                />
            </div>
        </div>
    );
}
