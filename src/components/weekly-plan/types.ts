'use client';

/**
 * 周计划表单数据类型
 */
export interface WeeklyPlanFormData {
  monthTheme: string;
  monthlyPlan: string;
  classInfo: string;
  weekNumber: string;
  teacher: string;
  selectedDate: string;
  weekDays: string;
  ageGroup: 'small' | 'medium' | 'large';
  useDefaultTemplate: boolean;
}

/**
 * 文件上传状态
 */
export interface FileUploadState {
  file: File | null;
  lastWeekFile: File | null;
  studentNamesFile: File | null;
}

/**
 * 周计划数据（生成后）
 */
export interface WeeklyPlanData {
  activities: string;
  dateRange: string;
  classInfo: string;
  teacher: string;
  ageGroup: string;
  weekNumber: string;
}

/**
 * 流式生成状态
 */
export interface StreamingState {
  isStreaming: boolean;
  streamingContent: string;
  fullJsonContent: string;
  formattedJson: string;
  showStreaming: boolean;
}

/**
 * 实时预览状态
 */
export interface PreviewState {
  collectiveActivities: string;
  weeklyGoal: string;
}

/**
 * 日计划生成状态
 */
export interface DailyPlanState {
  loading: boolean;
  urls: string[];
  editingActivities: string[];
}

/**
 * 周计划 Hook 返回类型
 */
export interface UseWeeklyPlanReturn {
  // 表单数据
  formData: WeeklyPlanFormData;
  setFormData: React.Dispatch<React.SetStateAction<WeeklyPlanFormData>>;
  
  // 文件状态
  files: FileUploadState;
  setFiles: React.Dispatch<React.SetStateAction<FileUploadState>>;
  
  // 加载和错误状态
  loading: boolean;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  
  // 生成结果
  generatedUrl: string;
  weeklyPlanData: WeeklyPlanData | null;
  activitiesList: string[];
  
  // 流式生成
  streaming: StreamingState;
  setStreaming: React.Dispatch<React.SetStateAction<StreamingState>>;
  
  // 预览
  preview: PreviewState;
  
  // 日计划
  dailyPlan: DailyPlanState;
  setDailyPlan: React.Dispatch<React.SetStateAction<DailyPlanState>>;
  
  // 计算属性
  dateRange: string;
  
  // 方法
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'template' | 'lastWeek' | 'studentNames') => void;
  handleGenerate: () => Promise<void>;
  handleGenerateStream: () => Promise<void>;
  handleDownload: () => Promise<void>;
  handleGenerateDailyPlan: () => Promise<void>;
  handleDownloadAllDailyPlans: () => Promise<void>;
  getDateString: (dayIndex: number) => string;
}
