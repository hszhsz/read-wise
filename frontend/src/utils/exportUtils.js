/**
 * 导出工具函数
 */

/**
 * 将分析结果导出为Markdown文本
 * @param {Object} bookData 书籍数据
 * @returns {string} Markdown格式的文本
 */
export const exportToMarkdown = (bookData) => {
  if (!bookData) return '';
  
  const { metadata, summary, author_info, reading_recommendations } = bookData;
  
  let markdown = `# ${metadata?.title || '未知书籍'} - 阅读分析
\n`;
  
  // 添加元数据
  markdown += `## 书籍信息\n\n`;
  markdown += `- **书名**: ${metadata?.title || '未知'}\n`;
  markdown += `- **作者**: ${metadata?.author || '未知'}\n`;
  if (metadata?.publisher) {
    markdown += `- **出版社**: ${metadata.publisher}\n`;
  }
  if (metadata?.publication_date) {
    markdown += `- **出版日期**: ${metadata.publication_date}\n`;
  }
  if (metadata?.language) {
    markdown += `- **语言**: ${metadata.language}\n`;
  }
  if (metadata?.file_type) {
    markdown += `- **文件类型**: ${metadata.file_type}\n`;
  }
  if (metadata?.word_count) {
    markdown += `- **字数**: ${metadata.word_count.toLocaleString()}\n`;
  }
  markdown += `\n`;
  
  // 添加摘要
  if (summary) {
    markdown += `## 书籍摘要\n\n`;
    
    if (summary.main_points && summary.main_points.length > 0) {
      markdown += `### 主要观点\n\n`;
      summary.main_points.forEach((point, index) => {
        markdown += `${index + 1}. ${point}\n`;
      });
      markdown += `\n`;
    }
    
    if (summary.key_concepts && summary.key_concepts.length > 0) {
      markdown += `### 关键概念\n\n`;
      summary.key_concepts.forEach((concept, index) => {
        markdown += `${index + 1}. **${concept.name}**: ${concept.description}\n`;
      });
      markdown += `\n`;
    }
    
    if (summary.overall_conclusion) {
      markdown += `### 总体结论\n\n${summary.overall_conclusion}\n\n`;
    }
  }
  
  // 添加作者信息
  if (author_info) {
    markdown += `## 作者背景\n\n`;
    
    if (author_info.background) {
      markdown += `### 背景\n\n${author_info.background}\n\n`;
    }
    
    if (author_info.writing_style) {
      markdown += `### 写作风格\n\n${author_info.writing_style}\n\n`;
    }
    
    if (author_info.notable_works && author_info.notable_works.length > 0) {
      markdown += `### 代表作品\n\n`;
      author_info.notable_works.forEach((work, index) => {
        markdown += `${index + 1}. ${work}\n`;
      });
      markdown += `\n`;
    }
    
    if (author_info.influence) {
      markdown += `### 影响力\n\n${author_info.influence}\n\n`;
    }
  }
  
  // 添加阅读推荐
  if (reading_recommendations && reading_recommendations.length > 0) {
    markdown += `## 阅读推荐\n\n`;
    reading_recommendations.forEach((rec, index) => {
      markdown += `### ${index + 1}. ${rec.title}\n\n`;
      markdown += `**作者**: ${rec.author}\n\n`;
      if (rec.reason) {
        markdown += `**推荐理由**: ${rec.reason}\n\n`;
      }
    });
  }
  
  // 添加生成信息
  markdown += `---\n\n*此分析报告由Readwise智能读书助手生成于${new Date().toLocaleString('zh-CN')}*\n`;
  
  return markdown;
};

/**
 * 下载文本为文件
 * @param {string} text 要下载的文本内容
 * @param {string} filename 文件名
 * @param {string} type 文件类型
 */
export const downloadTextAsFile = (text, filename, type = 'text/markdown') => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 导出书籍分析结果为Markdown文件
 * @param {Object} bookData 书籍数据
 */
export const exportBookAnalysis = (bookData) => {
  if (!bookData || !bookData.metadata) {
    console.error('无效的书籍数据');
    return;
  }
  
  const markdown = exportToMarkdown(bookData);
  const filename = `${bookData.metadata.title || '未知书籍'}_分析报告.md`;
  
  downloadTextAsFile(markdown, filename);
};