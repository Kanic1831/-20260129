import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CardDescription } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { WeeklyPlanFormData, FileUploadState } from './types';

interface TemplateSectionProps {
    formData: WeeklyPlanFormData;
    setFormData: React.Dispatch<React.SetStateAction<WeeklyPlanFormData>>;
    files: FileUploadState;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'template' | 'lastWeek' | 'studentNames') => void;
}

export function TemplateSection({ formData, setFormData, files, handleFileChange }: TemplateSectionProps) {
    return (
        <div className="space-y-2.5 sm:space-y-3 rounded-md border border-input bg-background p-3 sm:p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                {/* 左边：使用默认模板 */}
                <div className="w-full sm:flex-1">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="useDefaultTemplate"
                            checked={formData.useDefaultTemplate}
                            onCheckedChange={(checked) => {
                                setFormData(prev => ({ ...prev, useDefaultTemplate: checked === true }));
                            }}
                        />
                        <Label htmlFor="useDefaultTemplate" className="cursor-pointer text-xs sm:text-sm font-medium">
                            使用默认模板
                        </Label>
                    </div>
                    <div className="mt-1.5 sm:mt-2">
                        <CardDescription className="text-xs sm:text-sm">
                            默认模板: <code className="rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-800">weekly_plan_template.docx</code>
                        </CardDescription>
                    </div>
                </div>

                {/* 右边：上传学生名册 */}
                <div className="w-full sm:flex-1">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <Label htmlFor="studentNamesFile" className="text-xs sm:text-sm font-medium">上传学生名册</Label>
                        <span className="text-xs font-normal text-gray-500">（可选，docx）</span>
                    </div>
                    <div className="mt-1.5 sm:mt-2 flex items-center gap-2 sm:gap-3">
                        <CardDescription className="flex-1 text-xs sm:text-sm truncate">
                            {files.studentNamesFile ? files.studentNamesFile.name : '随机嵌入学生姓名'}
                        </CardDescription>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                            onClick={() => document.getElementById('studentNamesFile')?.click()}
                        >
                            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Input
                            id="studentNamesFile"
                            type="file"
                            accept=".docx"
                            onChange={(e) => handleFileChange(e, 'studentNames')}
                            className="hidden"
                        />
                    </div>
                </div>
            </div>

            {/* 自定义模板上传 */}
            {!formData.useDefaultTemplate && (
                <div className="space-y-1.5 pt-2">
                    <Label htmlFor="templateFile" className="text-xs sm:text-sm font-medium">上传自定义模板 * (.docx)</Label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <Input
                            id="templateFile"
                            type="file"
                            accept=".docx"
                            onChange={(e) => handleFileChange(e, 'template')}
                            className="h-9 sm:h-9 flex-1 text-xs sm:text-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
