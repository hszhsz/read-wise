#!/usr/bin/env python3
import sys
import os
sys.path.append('/Users/heshaozhong/code/read-wise/backend')

from utils.text_processing import TextProcessor
from utils.file_utils import extract_text_from_file

def test_chunking():
    tp = TextProcessor()
    
    # 读取文件内容
    file_path = '/Users/heshaozhong/code/read-wise/uploads/d4cd8852-67f6-4806-8ada-004b3fdc9d5d.txt'
    content = extract_text_from_file(file_path)
    
    print(f'原文本长度: {len(content)}')
    print(f'原文本前200字符: {content[:200]}')
    print('\n' + '='*50 + '\n')
    
    # 测试分块
    chunks = tp.split_text(content, chunk_size=1000, chunk_overlap=200)
    
    print(f'分块数量: {len(chunks)}')
    
    for i, chunk in enumerate(chunks):
        print(f'\n块{i+1} (长度: {len(chunk)}):')
        print(f'前100字符: {chunk[:100]}...')
        print(f'后100字符: ...{chunk[-100:]}')

if __name__ == '__main__':
    test_chunking()