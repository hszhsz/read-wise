import re
import logging
from typing import List, Optional


class TextProcessor:
    """文本处理工具类"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def split_text(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
        """智能文本分块
        
        Args:
            text: 输入文本
            chunk_size: 块大小（字符数）
            chunk_overlap: 重叠大小（字符数）
            
        Returns:
            文本块列表
        """
        if not text or not text.strip():
            return []
        
        # 清理文本
        cleaned_text = self.clean_text(text)
        
        if len(cleaned_text) <= chunk_size:
            return [cleaned_text]
        
        # 尝试按段落分割
        chunks = self._split_by_paragraphs(cleaned_text, chunk_size, chunk_overlap)
        
        if not chunks:
            # 降级到按句子分割
            chunks = self._split_by_sentences(cleaned_text, chunk_size, chunk_overlap)
        
        if not chunks:
            # 最后降级到固定长度分割
            chunks = self._split_by_length(cleaned_text, chunk_size, chunk_overlap)
        
        # 过滤空块和过短的块
        filtered_chunks = []
        for chunk in chunks:
            chunk = chunk.strip()
            if chunk and len(chunk) >= 50:  # 最小块长度
                filtered_chunks.append(chunk)
        
        self.logger.info(f"文本分块完成: 原文本长度 {len(cleaned_text)}, 分成 {len(filtered_chunks)} 块")
        return filtered_chunks
    
    def _split_by_paragraphs(self, text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
        """按段落分割文本
        
        Args:
            text: 输入文本
            chunk_size: 块大小
            chunk_overlap: 重叠大小
            
        Returns:
            文本块列表
        """
        # 按段落分割（双换行符或多个换行符）
        paragraphs = re.split(r'\n\s*\n', text)
        
        if len(paragraphs) <= 1:
            return []
        
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            
            # 如果当前段落本身就超过块大小，需要进一步分割
            if len(paragraph) > chunk_size:
                # 先保存当前块
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""
                
                # 分割大段落
                sub_chunks = self._split_by_sentences(paragraph, chunk_size, chunk_overlap)
                chunks.extend(sub_chunks)
                continue
            
            # 检查添加当前段落是否会超过块大小
            if current_chunk and len(current_chunk) + len(paragraph) + 2 > chunk_size:
                # 保存当前块
                chunks.append(current_chunk.strip())
                
                # 处理重叠
                if chunk_overlap > 0 and len(current_chunk) > chunk_overlap:
                    overlap_text = current_chunk[-chunk_overlap:]
                    current_chunk = overlap_text + "\n\n" + paragraph
                else:
                    current_chunk = paragraph
            else:
                # 添加到当前块
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph
        
        # 添加最后一个块
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _split_by_sentences(self, text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
        """按句子分割文本
        
        Args:
            text: 输入文本
            chunk_size: 块大小
            chunk_overlap: 重叠大小
            
        Returns:
            文本块列表
        """
        # 按句子分割（中英文句号、问号、感叹号）
        sentences = re.split(r'[。！？.!?]\s*', text)
        
        if len(sentences) <= 1:
            return []
        
        chunks = []
        current_chunk = ""
        
        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # 恢复句号（除了最后一个句子）
            if i < len(sentences) - 1:
                # 简单判断中英文
                if re.search(r'[\u4e00-\u9fff]', sentence):
                    sentence += "。"
                else:
                    sentence += "."
            
            # 检查添加当前句子是否会超过块大小
            if current_chunk and len(current_chunk) + len(sentence) + 1 > chunk_size:
                # 保存当前块
                chunks.append(current_chunk.strip())
                
                # 处理重叠
                if chunk_overlap > 0:
                    overlap_sentences = self._get_overlap_sentences(current_chunk, chunk_overlap)
                    current_chunk = overlap_sentences + " " + sentence if overlap_sentences else sentence
                else:
                    current_chunk = sentence
            else:
                # 添加到当前块
                if current_chunk:
                    current_chunk += " " + sentence
                else:
                    current_chunk = sentence
        
        # 添加最后一个块
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _split_by_length(self, text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
        """按固定长度分割文本
        
        Args:
            text: 输入文本
            chunk_size: 块大小
            chunk_overlap: 重叠大小
            
        Returns:
            文本块列表
        """
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # 如果不是最后一块，尝试在单词边界分割
            if end < len(text):
                # 向后查找空格或标点符号
                for i in range(min(50, len(text) - end)):
                    if text[end + i] in ' \n\t，。！？,.!?':
                        end = end + i + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # 计算下一个开始位置（考虑重叠）
            if chunk_overlap > 0 and end < len(text):
                start = end - chunk_overlap
            else:
                start = end
        
        return chunks
    
    def _get_overlap_sentences(self, text: str, overlap_size: int) -> str:
        """获取重叠的句子
        
        Args:
            text: 文本
            overlap_size: 重叠大小
            
        Returns:
            重叠文本
        """
        if len(text) <= overlap_size:
            return text
        
        # 从末尾开始查找句子边界
        overlap_text = text[-overlap_size:]
        
        # 查找第一个句子的开始
        sentence_start = 0
        for i, char in enumerate(overlap_text):
            if char in '。！？.!?':
                sentence_start = i + 1
                break
        
        return overlap_text[sentence_start:].strip()
    
    def clean_text(self, text: str) -> str:
        """清理文本
        
        Args:
            text: 原始文本
            
        Returns:
            清理后的文本
        """
        if not text:
            return ""
        
        # 移除多余的空白字符
        cleaned = re.sub(r'\s+', ' ', text)
        
        # 移除特殊字符（保留基本标点）
        cleaned = re.sub(r'[^\w\s\u4e00-\u9fff，。！？；：""''（）【】《》、.!?;:"\'\'\(\)\[\]<>,-]', '', cleaned)
        
        # 规范化换行符
        cleaned = re.sub(r'\n+', '\n', cleaned)
        
        # 移除首尾空白
        cleaned = cleaned.strip()
        
        return cleaned
    
    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """提取关键词（简单实现）
        
        Args:
            text: 输入文本
            max_keywords: 最大关键词数量
            
        Returns:
            关键词列表
        """
        if not text:
            return []
        
        # 清理文本
        cleaned = self.clean_text(text)
        
        # 分词（简单按空格和标点分割）
        words = re.findall(r'[\w\u4e00-\u9fff]+', cleaned)
        
        # 过滤短词和常见停用词
        stop_words = {
            '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
        }
        
        filtered_words = []
        for word in words:
            if len(word) >= 2 and word.lower() not in stop_words:
                filtered_words.append(word)
        
        # 统计词频
        word_count = {}
        for word in filtered_words:
            word_count[word] = word_count.get(word, 0) + 1
        
        # 按频率排序
        sorted_words = sorted(word_count.items(), key=lambda x: x[1], reverse=True)
        
        # 返回前N个关键词
        keywords = [word for word, count in sorted_words[:max_keywords]]
        
        return keywords
    
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """计算文本相似度（简单实现）
        
        Args:
            text1: 文本1
            text2: 文本2
            
        Returns:
            相似度分数 (0-1)
        """
        if not text1 or not text2:
            return 0.0
        
        # 提取关键词
        keywords1 = set(self.extract_keywords(text1, 20))
        keywords2 = set(self.extract_keywords(text2, 20))
        
        if not keywords1 or not keywords2:
            return 0.0
        
        # 计算Jaccard相似度
        intersection = len(keywords1.intersection(keywords2))
        union = len(keywords1.union(keywords2))
        
        similarity = intersection / union if union > 0 else 0.0
        
        return similarity
    
    def summarize_text(self, text: str, max_length: int = 200) -> str:
        """文本摘要（简单实现）
        
        Args:
            text: 输入文本
            max_length: 最大摘要长度
            
        Returns:
            摘要文本
        """
        if not text or len(text) <= max_length:
            return text
        
        # 按句子分割
        sentences = re.split(r'[。！？.!?]\s*', text)
        
        if len(sentences) <= 1:
            return text[:max_length] + "..."
        
        # 选择前几个句子作为摘要
        summary = ""
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            if len(summary) + len(sentence) + 1 <= max_length:
                if summary:
                    summary += "。" + sentence
                else:
                    summary = sentence
            else:
                break
        
        if not summary.endswith(('。', '！', '？', '.', '!', '?')):
            summary += "。"
        
        return summary