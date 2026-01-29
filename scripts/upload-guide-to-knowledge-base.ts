import { KnowledgeClient, Config, KnowledgeDocument, DataSourceType } from 'coze-coding-dev-sdk';
import { readFileSync } from 'fs';

async function uploadGuide() {
  console.log('开始上传《3-6岁儿童学习与发展指南》到知识库...');

  // 初始化知识库客户端
  const config = new Config();
  const client = new KnowledgeClient(config);

  // 读取指南文本
  const guideText = readFileSync('/tmp/3-6岁儿童学习与发展指南.txt', 'utf-8');

  // 创建文档
  const doc: KnowledgeDocument = {
    source: DataSourceType.TEXT,
    raw_data: guideText,
  };

  try {
    // 上传到知识库
    const response = await client.addDocuments([doc], 'education_guide', {
      separator: '\n',
      max_tokens: 1500,
      remove_extra_spaces: true,
      remove_urls_emails: false,
    });

    if (response.code === 0) {
      console.log('✅ 指南上传成功！');
      console.log('文档ID:', response.doc_ids?.join(', '));
    } else {
      console.error('❌ 上传失败:', response.msg);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ 上传出错:', error.message);
    process.exit(1);
  }
}

uploadGuide();
