const AdmZip = require('adm-zip');

const templatePath = './public/templates/weekly_plan_template.docx';

function extractPlaceholders() {
  try {
    const zip = new AdmZip(templatePath);
    const documentEntry = zip.getEntry('word/document.xml');

    if (!documentEntry) {
      console.error('未找到 word/document.xml 文件');
      return;
    }

    const content = documentEntry.getData().toString('utf-8');

    // 提取所有 <w:t> 标签的内容
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    const allTexts = [];
    let match;

    while ((match = textRegex.exec(content)) !== null) {
      allTexts.push(match[1]);
    }

    console.log(`共找到 ${allTexts.length} 个文本节点`);

    // 合并相邻的文本节点，重建完整的占位符
    let mergedText = '';
    const placeholders = new Set();

    for (const text of allTexts) {
      if (text.includes('{{') || text.includes('}}')) {
        // 如果当前文本包含占位符标记，添加到合并文本
        mergedText += text;

        // 如果包含 }}，可能是一个完整的占位符
        if (text.includes('}}')) {
          // 尝试提取完整的占位符
          const placeholderRegex = /\{\{([^<{}]+)\}\}/g;
          let pMatch;
          while ((pMatch = placeholderRegex.exec(mergedText)) !== null) {
            const placeholder = pMatch[1].trim();
            if (placeholder && placeholder.length > 0 && placeholder.length < 100) {
              placeholders.add(placeholder);
            }
          }
          // 重置合并文本
          mergedText = '';
        }
      } else {
        // 重置合并文本
        mergedText = '';
      }
    }

    // 再次尝试从整个文档内容中提取占位符（处理跨越多个标签的情况）
    const allContent = allTexts.join('');
    const fullRegex = /\{\{([^<{}]+)\}\}/g;
    let fullMatch;
    while ((fullMatch = fullRegex.exec(allContent)) !== null) {
      const placeholder = fullMatch[1].trim();
      if (placeholder && placeholder.length > 0 && placeholder.length < 100) {
        placeholders.add(placeholder);
      }
    }

    const uniquePlaceholders = Array.from(placeholders).sort();

    console.log('\n=== 模板中的占位符列表 ===');
    console.log(`共找到 ${uniquePlaceholders.length} 个占位符：\n`);
    uniquePlaceholders.forEach((p, index) => {
      console.log(`${index + 1}. ${p}`);
    });

    console.log('\n=== JSON 格式（可用于复制） ===');
    console.log(JSON.stringify(uniquePlaceholders, null, 2));

  } catch (error) {
    console.error('提取占位符失败:', error.message);
    console.error(error.stack);
  }
}

extractPlaceholders();
