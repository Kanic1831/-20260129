/**
 * 文件大小限制常量
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 验证文件大小
 */
export function validateFileSize(file: File | null, maxSize: number = MAX_FILE_SIZE): void {
  if (!file) {
    return;
  }

  if (file.size > maxSize) {
    throw new Error(
      `文件大小超出限制。最大允许 ${maxSize / (1024 * 1024)}MB，当前文件 ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    );
  }
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File | null, allowedTypes: string[]): void {
  if (!file) {
    return;
  }

  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    throw new Error(
      `不支持的文件类型。仅支持 ${allowedTypes.join(', ')} 格式`
    );
  }
}

/**
 * 验证Word文件
 */
export function validateWordFile(file: File | null): void {
  validateFileSize(file);
  validateFileType(file, ['.docx']);
}
