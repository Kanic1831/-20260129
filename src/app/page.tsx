'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

import {
  BasicInfoForm,
  AIGenerationSection,
  TemplateSection,
  StreamingPreview,
  DailyPlanGenerator,
  GenerationButtons,
  UsageGuide
} from '@/components/weekly-plan';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';

function WeeklyPlanGenerator() {
  const {
    formData, setFormData,
    files, handleFileChange,
    loading, error,
    generatedUrl,
    weeklyPlanData, activitiesList,
    streaming, setStreaming,
    preview,
    dailyPlan, setDailyPlan,
    dateRange,
    handleGenerate,
    handleGenerateStream,
    handleDownload,
    handleGenerateDailyPlan,
    handleDownloadAllDailyPlans,
    getDateString
  } = useWeeklyPlan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            幼儿园周计划生成系统
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300">
            基于月主题和月计划，AI 自动生成完整的周计划内容
          </p>
        </div>

        <div className="mx-auto w-full max-w-4xl sm:max-w-5xl md:max-w-6xl lg:max-w-5xl">
          <Card className="shadow-xl">
            <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                {/* 左边：标题和副标题 */}
                <div className="w-full sm:flex-1">
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    生成周计划
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm sm:text-base">
                    填写基本信息和月计划，AI 将自动填充模板内容
                  </CardDescription>
                </div>

                {/* 右边：上传上周计划 */}
                <div className="w-full sm:flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    上传上周周计划
                    <span className="text-xs sm:text-sm font-normal text-gray-500">（可选）</span>
                  </CardTitle>
                  <div className="mt-1 sm:mt-2 flex items-center gap-2 sm:gap-3">
                    <CardDescription className="text-xs sm:text-sm">
                      上传后将自动生成"上周回顾"（150-200字）
                    </CardDescription>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                      onClick={() => document.getElementById('lastWeekFile')?.click()}
                    >
                      <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Input
                      id="lastWeekFile"
                      type="file"
                      accept=".docx"
                      onChange={(e) => handleFileChange(e, 'lastWeek')}
                      className="hidden"
                    />
                    <div className="flex-1 truncate text-xs text-muted-foreground">
                      {files.lastWeekFile ? files.lastWeekFile.name : ''}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 py-3 sm:py-6">
              <BasicInfoForm
                formData={formData}
                setFormData={setFormData}
                dateRange={dateRange}
              />

              <AIGenerationSection
                formData={formData}
                setFormData={setFormData}
              />

              <TemplateSection
                formData={formData}
                setFormData={setFormData}
                files={files}
                handleFileChange={handleFileChange}
              />

              {/* 错误提示 */}
              {error && (
                <div className="rounded-md bg-red-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <StreamingPreview
                streaming={streaming}
                preview={preview}
              />

              <GenerationButtons
                loading={loading}
                generatedUrl={generatedUrl}
                streaming={streaming}
                setStreaming={setStreaming}
                handleGenerate={handleGenerate}
                handleGenerateStream={handleGenerateStream}
                handleDownload={handleDownload}
              />

              <DailyPlanGenerator
                weeklyPlanData={weeklyPlanData!}
                activitiesList={activitiesList}
                dailyPlan={dailyPlan}
                setDailyPlan={setDailyPlan}
                handleGenerateDailyPlan={handleGenerateDailyPlan}
                handleDownloadAllDailyPlans={handleDownloadAllDailyPlans}
                getDateString={getDateString}
              />
            </CardContent>
          </Card>

          <UsageGuide />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ErrorBoundary>
      <WeeklyPlanGenerator />
    </ErrorBoundary>
  );
}
