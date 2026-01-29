import { useState } from 'react';
import { JSONUtils } from '@/lib/json-utils';
import {
    WeeklyPlanFormData,
    FileUploadState,
    WeeklyPlanData,
    StreamingState,
    PreviewState,
    DailyPlanState,
    UseWeeklyPlanReturn
} from '@/components/weekly-plan/types';

export function useWeeklyPlan(): UseWeeklyPlanReturn {
    // 基本信息字段
    const [formData, setFormData] = useState<WeeklyPlanFormData>({
        monthTheme: '',
        monthlyPlan: '',
        classInfo: '',
        weekNumber: '',
        teacher: '',
        selectedDate: '',
        weekDays: '5',
        ageGroup: 'medium',
        useDefaultTemplate: true,
    });

    // 文件状态
    const [files, setFiles] = useState<FileUploadState>({
        file: null,
        lastWeekFile: null,
        studentNamesFile: null,
    });

    // 加载和错误状态
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');

    // 生成结果
    const [weeklyPlanData, setWeeklyPlanData] = useState<WeeklyPlanData | null>(null);
    const [activitiesList, setActivitiesList] = useState<string[]>([]);

    // 流式生成状态
    const [streaming, setStreaming] = useState<StreamingState>({
        isStreaming: false,
        streamingContent: '',
        fullJsonContent: '',
        formattedJson: '',
        showStreaming: false,
    });

    // 实时预览状态
    const [preview, setPreview] = useState<PreviewState>({
        collectiveActivities: '',
        weeklyGoal: '',
    });

    // 日计划状态
    const [dailyPlan, setDailyPlan] = useState<DailyPlanState>({
        loading: false,
        urls: [],
        editingActivities: [],
    });

    // 计算日期范围
    const calculateDateRange = () => {
        if (!formData.selectedDate || !formData.weekDays) return '';

        const date = new Date(formData.selectedDate);
        const days = parseInt(formData.weekDays);

        const endDate = new Date(date);
        endDate.setDate(date.getDate() + days - 1);

        const formatDate = (d: Date) => {
            return `${d.getMonth() + 1}.${d.getDate()}日`;
        };

        return `${formatDate(date)}——${formatDate(endDate)}`;
    };

    const dateRange = calculateDateRange();

    // 根据日期范围和索引获取具体日期
    const getDateString = (dayIndex: number): string => {
        if (!formData.selectedDate) return '';

        const date = new Date(formData.selectedDate);
        date.setDate(date.getDate() + dayIndex);
        return `${date.getMonth() + 1}.${date.getDate()}`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'template' | 'lastWeek' | 'studentNames') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFiles(prev => {
                switch (type) {
                    case 'template': return { ...prev, file };
                    case 'lastWeek': return { ...prev, lastWeekFile: file };
                    case 'studentNames': return { ...prev, studentNamesFile: file };
                    default: return prev;
                }
            });
            setError('');
        }
    };

    /**
     * 从流式 JSON 内容中提取特定字段
     */
    const extractFieldFromStreamingJSON = (content: string, fieldName: string): string | null => {
        const keyValueRegex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
        const match = content.match(keyValueRegex);
        if (match) {
            return match[1].replace(/\\"/g, '"');
        }

        const chineseQuoteRegex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^""\\]|\\.)*)"`, 's');
        const chineseMatch = content.match(chineseQuoteRegex);
        if (chineseMatch) {
            return chineseMatch[1].replace(/""/g, '"');
        }

        try {
            const json = JSONUtils.repairAndParse(content);
            if (typeof json === 'object' && json !== null && fieldName in json) {
                const value = (json as Record<string, unknown>)[fieldName];
                if (typeof value === 'string') {
                    return value;
                }
            }
        } catch (error) {
            // 忽略解析错误
        }

        return null;
    };

    const handleGenerateStream = async () => {
        if (!formData.monthTheme || !formData.monthlyPlan) {
            setError('请填写月主题和月计划');
            return;
        }

        if (!formData.useDefaultTemplate && !files.file) {
            setError('请上传周计划模板文件');
            return;
        }

        setStreaming(prev => ({
            ...prev,
            isStreaming: true,
            streamingContent: '',
            fullJsonContent: '',
            showStreaming: true,
        }));
        setError('');
        setGeneratedUrl('');
        setWeeklyPlanData(null);
        setActivitiesList([]);

        try {
            const response = await fetch('/api/generate-plan-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monthTheme: formData.monthTheme,
                    monthlyPlan: formData.monthlyPlan,
                    classInfo: formData.classInfo,
                    weekNumber: formData.weekNumber,
                    teacher: formData.teacher,
                    dateRange,
                    ageGroup: formData.ageGroup,
                    hasLastWeekPlan: !!files.lastWeekFile,
                }),
            });

            if (!response.ok) throw new Error('流式生成请求失败');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error('无法读取响应流');

            let fullContent = '';
            let buffer = '';
            let streamEnded = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trimEnd();
                    if (trimmedLine.startsWith('data: ')) {
                        const data = trimmedLine.slice(6);
                        if (data === '[DONE]') {
                            setStreaming(prev => ({ ...prev, isStreaming: false }));
                            streamEnded = true;
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) {
                                setError(parsed.error);
                                setStreaming(prev => ({ ...prev, isStreaming: false }));
                                streamEnded = true;
                                break;
                            }

                            if (parsed.content) {
                                setStreaming(prev => ({ ...prev, streamingContent: prev.streamingContent + parsed.content }));
                                fullContent += parsed.content;

                                const collectiveActivities = extractFieldFromStreamingJSON(fullContent, '集体活动');
                                const weeklyGoal = extractFieldFromStreamingJSON(fullContent, '本周目标');

                                setPreview(prev => ({
                                    collectiveActivities: collectiveActivities || prev.collectiveActivities,
                                    weeklyGoal: weeklyGoal || prev.weeklyGoal,
                                }));
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }

                if (streamEnded) {
                    break;
                }
            }

            if (!fullContent) throw new Error('未收到有效的 AI 生成内容');

            let aiData: unknown;
            try {
                aiData = JSONUtils.repairAndParse(fullContent);
                setStreaming(prev => ({
                    ...prev,
                    formattedJson: JSONUtils.stringify(aiData),
                    fullJsonContent: JSONUtils.stringify(aiData),
                }));
            } catch (parseError) {
                console.error('JSON 解析失败:', parseError);
                throw new Error(`JSON 解析失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            }

            // 验证必填字段
            if (!formData.classInfo.trim()) throw new Error('请填写班级信息');
            if (!formData.weekNumber.trim()) throw new Error('请填写第几周');
            if (!formData.teacher.trim()) throw new Error('请填写教师姓名');
            if (!dateRange.trim()) throw new Error('请选择开始日期和本周天数');

            const apiFormData = new FormData();
            apiFormData.append('aiData', JSON.stringify(aiData));
            apiFormData.append('useDefaultTemplate', formData.useDefaultTemplate.toString());
            apiFormData.append('classInfo', formData.classInfo);
            apiFormData.append('weekNumber', formData.weekNumber);
            apiFormData.append('teacher', formData.teacher);
            apiFormData.append('dateRange', dateRange);
            apiFormData.append('ageGroup', formData.ageGroup);
            apiFormData.append('monthTheme', formData.monthTheme);

            if (!formData.useDefaultTemplate && files.file) apiFormData.append('file', files.file);
            if (files.lastWeekFile) apiFormData.append('lastWeekFile', files.lastWeekFile);
            if (files.studentNamesFile) apiFormData.append('studentNamesFile', files.studentNamesFile);

            const docResponse = await fetch('/api/generate-document', {
                method: 'POST',
                body: apiFormData,
            });

            if (!docResponse.ok) {
                const errorData = await docResponse.json();
                throw new Error(errorData.error || '文档生成失败');
            }

            const docResult = await docResponse.json();

            setGeneratedUrl(docResult.downloadUrl);
            setActivitiesList(docResult.activities || []);
            setDailyPlan(prev => ({ ...prev, editingActivities: docResult.activities || [] }));
            setWeeklyPlanData({
                activities: '',
                dateRange: docResult.dateRange,
                classInfo: docResult.classInfo,
                teacher: docResult.teacher,
                ageGroup: docResult.ageGroup,
                weekNumber: formData.weekNumber,
            });

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '流式生成失败，请重试';
            setError(message);
            setStreaming(prev => ({ ...prev, isStreaming: false }));
        }
    };

    const handleGenerate = async () => {
        if (!formData.monthTheme || !formData.monthlyPlan) {
            setError('请填写月主题和月计划');
            return;
        }

        if (!formData.useDefaultTemplate && !files.file) {
            setError('请上传周计划模板文件');
            return;
        }

        setLoading(true);
        setError('');
        setGeneratedUrl('');

        try {
            const apiFormData = new FormData();
            apiFormData.append('monthTheme', formData.monthTheme);
            apiFormData.append('monthlyPlan', formData.monthlyPlan);
            apiFormData.append('classInfo', formData.classInfo);
            apiFormData.append('weekNumber', formData.weekNumber);
            apiFormData.append('teacher', formData.teacher);
            apiFormData.append('dateRange', dateRange);
            apiFormData.append('ageGroup', formData.ageGroup);
            apiFormData.append('useDefaultTemplate', formData.useDefaultTemplate.toString());

            if (files.lastWeekFile) apiFormData.append('lastWeekFile', files.lastWeekFile);
            if (files.studentNamesFile) apiFormData.append('studentNamesFile', files.studentNamesFile);
            if (!formData.useDefaultTemplate && files.file) apiFormData.append('file', files.file);

            const response = await fetch('/api/generate-plan', {
                method: 'POST',
                body: apiFormData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '生成失败');
            }

            const data = await response.json();
            setGeneratedUrl(data.downloadUrl);

            if (data.activities) {
                const activities = data.activities
                    .split('\n')
                    .map((line: string) => line.trim())
                    .filter((line: string) => line.length > 0)
                    .map((line: string) => line.replace(/^\d+\.\s*/, ''));

                // 移除前端数量检查，完全信任后端生及
                // if (activities.length !== 5) {
                //    setError(`生成的活动数量不对（需要5个，实际生成${activities.length}个）`);
                //    return;
                // }

                setWeeklyPlanData({
                    activities: data.activities,
                    dateRange: data.dateRange || '',
                    classInfo: data.classInfo || '',
                    teacher: data.teacher || '',
                    ageGroup: formData.ageGroup,
                    weekNumber: formData.weekNumber,
                });

                setActivitiesList(activities);
                setDailyPlan(prev => ({ ...prev, editingActivities: [...activities] }));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '生成失败，请重试';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!generatedUrl) return;
        try {
            let blob: Blob;

            // 检测是否是 base64 data URL（本地环境）
            if (generatedUrl.startsWith('data:')) {
                // 解析 data URL: data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,xxxxx
                const [header, base64Data] = generatedUrl.split(',');
                const mimeType = header.split(':')[1].split(';')[0];

                // 将 base64 转换为二进制数据
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                blob = new Blob([bytes], { type: mimeType });
            } else {
                // 普通 URL（云存储）
                const response = await fetch(generatedUrl);
                blob = await response.blob();
            }

            const fileName = weeklyPlanData
                ? `${weeklyPlanData.classInfo}班第${weeklyPlanData.weekNumber}周周计划.docx`
                : '周计划.docx';

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            // 使用 setTimeout 确保在点击后再移除，并放在 finally 块中无法保证执行环境一致时更安全
            // 这里不立即移除，或者给一点延迟
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Download failed', error);
            window.open(generatedUrl, '_blank');
        }
    };

    const handleGenerateDailyPlan = async () => {
        if (!weeklyPlanData || !formData.selectedDate || dailyPlan.editingActivities.some(a => !a.trim())) {
            setError('请完善活动内容');
            return;
        }

        setDailyPlan(prev => ({ ...prev, loading: true, urls: [] }));
        setError('');

        try {
            const response = await fetch('/api/generate-daily-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activities: dailyPlan.editingActivities,
                    dateRange: weeklyPlanData.dateRange,
                    classInfo: weeklyPlanData.classInfo,
                    teacher: weeklyPlanData.teacher,
                    startDate: formData.selectedDate,
                    ageGroup: weeklyPlanData.ageGroup,
                    weekNumber: weeklyPlanData.weekNumber,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '生成日计划失败');
            }

            const data = await response.json();
            setDailyPlan(prev => ({ ...prev, urls: data.downloadUrls || [] }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '生成日计划失败，请重试';
            setError(message);
        } finally {
            setDailyPlan(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDownloadAllDailyPlans = async () => {
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        for (let index = 0; index < dailyPlan.urls.length; index++) {
            try {
                const url = dailyPlan.urls[index];
                const response = await fetch(url);
                const blob = await response.blob();
                const dayName = weekDays[index % weekDays.length];
                const fileName = weeklyPlanData
                    ? `${weeklyPlanData.classInfo}班第${weeklyPlanData.weekNumber}周${dayName}日计划.docx`
                    : `${dayName}日计划.docx`;

                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    if (document.body.contains(link)) {
                        document.body.removeChild(link);
                    }
                    window.URL.revokeObjectURL(blobUrl);
                }, 100);

                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`下载第${index + 1}个日计划失败:`, error);
            }
        }
    };

    return {
        formData,
        setFormData,
        files,
        setFiles,
        loading,
        error,
        setError,
        generatedUrl,
        weeklyPlanData,
        activitiesList,
        streaming,
        setStreaming,
        preview,
        dailyPlan,
        setDailyPlan,
        dateRange,
        handleFileChange,
        handleGenerate,
        handleGenerateStream,
        handleDownload,
        handleGenerateDailyPlan,
        handleDownloadAllDailyPlans,
        getDateString,
    };
}
