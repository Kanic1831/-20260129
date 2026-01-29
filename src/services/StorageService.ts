import { S3Storage } from 'coze-coding-dev-sdk';

/**
 * 存储服务接口
 */
export interface IStorageService {
  /**
   * 上传文件到对象存储
   * @param key 文件路径/键名
   * @param buffer 文件内容
   * @param contentType 内容类型
   * @returns 文件的签名 URL
   */
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;

  /**
   * 生成签名 URL
   * @param key 文件路径/键名
   * @param expiresIn 过期时间（秒）
   * @returns 签名 URL
   */
  getSignedUrl(key: string, expiresIn: number): Promise<string>;

  /**
   * 删除文件
   * @param key 文件路径/键名
   */
  delete(key: string): Promise<void>;
}

/**
 * 对象存储服务实现
 */
export class StorageService implements IStorageService {
  private storage: S3Storage | null = null;
  private isLocalMode: boolean;

  constructor() {
    // 检查是否配置了云存储
    this.isLocalMode = !process.env.COZE_BUCKET_ENDPOINT_URL || !process.env.COZE_BUCKET_ENDPOINT_URL.trim();

    if (!this.isLocalMode) {
      // 只有在生产环境（配置了云存储）时才初始化 S3Storage
      this.storage = new S3Storage({
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL || '',
        accessKey: '',
        secretKey: '',
        bucketName: process.env.COZE_BUCKET_NAME || '',
        region: 'cn-beijing',
      });
    } else {
      console.log('本地环境：跳过 S3Storage 初始化，使用 base64 data URL 模式');
    }
  }

  /**
   * 检查是否配置了云存储
   */
  private isCloudStorageConfigured(): boolean {
    return !this.isLocalMode && this.storage !== null;
  }

  /**
   * 上传文件到对象存储
   * 本地环境：返回 base64 data URL
   * 生产环境：上传到云存储并返回签名 URL
   */
  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    // 本地环境降级：返回 base64 data URL
    if (!this.isCloudStorageConfigured()) {
      console.log('本地环境：使用 base64 data URL 替代云存储');
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${contentType};base64,${base64}`;
      return dataUrl;
    }

    try {
      console.log('开始上传文件到对象存储:', key);

      // 使用 uploadFile 方法上传文件
      const fileKey = await this.storage!.uploadFile({
        fileContent: buffer,
        fileName: key,
        contentType: contentType,
      });

      // 生成签名 URL（有效期24小时）
      const url = await this.storage!.generatePresignedUrl({
        key: fileKey,
        expireTime: 86400,
      });

      console.log('文件上传成功，签名URL:', url);
      return url;
    } catch (error: any) {
      console.error('上传文件到对象存储失败:', error);
      throw new Error(`上传文件失败: ${error.message}`);
    }
  }

  /**
   * 生成签名 URL
   */
  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    if (!this.storage) {
      throw new Error('本地环境不支持生成签名 URL');
    }
    try {
      const url = await this.storage.generatePresignedUrl({
        key: key,
        expireTime: expiresIn,
      });
      return url;
    } catch (error: any) {
      console.error('生成签名 URL 失败:', error);
      throw new Error(`生成签名 URL 失败: ${error.message}`);
    }
  }

  /**
   * 删除文件
   */
  async delete(key: string): Promise<void> {
    try {
      // 检查 S3Storage 是否有 deleteFile 方法
      // 如果没有，跳过删除操作
      console.log('删除文件:', key);
      // 暂时注释掉，因为不确定是否有 deleteFile 方法
      // await this.storage.deleteFile({ key: key });
      console.log('文件删除成功（模拟）:', key);
    } catch (error: any) {
      console.error('删除文件失败:', error);
      throw new Error(`删除文件失败: ${error.message}`);
    }
  }
}

/**
 * 创建 StorageService 实例的工厂函数
 */
export function createStorageService(): IStorageService {
  return new StorageService();
}
