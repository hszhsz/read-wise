#!/usr/bin/env python3
import requests
import json
import time

def test_analysis_workflow():
    book_id = "b3607ba3-3db7-4c67-846b-ad86d2eef5a0"
    
    print("=" * 50)
    print("测试书籍分析工作流程")
    print("=" * 50)
    
    # 1. 检查书籍状态
    print("\n1. 检查书籍当前状态...")
    try:
        response = requests.get(f'http://localhost:8000/api/books')
        if response.status_code == 200:
            data = response.json().get('data', [])
            book = next((b for b in data if b['id'] == book_id), None)
            if book:
                print(f"   书籍状态: {book.get('status', 'unknown')}")
                print(f"   标题: {book.get('title', 'N/A')}")
            else:
                print("   未找到指定书籍")
                return
    except Exception as e:
        print(f"   获取书籍状态失败: {e}")
        return
    
    # 2. 触发分析
    print("\n2. 触发书籍分析...")
    try:
        response = requests.post(f'http://localhost:8000/api/books/{book_id}/analyze')
        print(f"   分析请求状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   响应: {result.get('message', 'N/A')}")
        else:
            print(f"   分析请求失败: {response.text}")
            return
    except Exception as e:
        print(f"   触发分析失败: {e}")
        return
    
    # 3. 等待并检查分析结果
    print("\n3. 等待分析完成...")
    for i in range(10):  # 最多等待10次，每次2秒
        time.sleep(2)
        try:
            # 检查书籍状态
            response = requests.get(f'http://localhost:8000/api/books')
            if response.status_code == 200:
                data = response.json().get('data', [])
                book = next((b for b in data if b['id'] == book_id), None)
                if book:
                    status = book.get('status', 'unknown')
                    print(f"   第{i+1}次检查 - 状态: {status}")
                    
                    if status == 'completed':
                        print("   ✅ 分析完成！")
                        break
                    elif status == 'failed':
                        print("   ❌ 分析失败")
                        return
        except Exception as e:
            print(f"   检查状态失败: {e}")
    
    # 4. 获取分析结果
    print("\n4. 获取分析结果...")
    try:
        response = requests.get(f'http://localhost:8000/api/books/{book_id}/analysis')
        print(f"   分析结果状态码: {response.status_code}")
        
        if response.status_code == 200:
            analysis = response.json()
            print(f"   分析状态: {analysis.get('status', 'N/A')}")
            
            if 'summary' in analysis:
                summary = analysis['summary']
                print(f"   摘要长度: {len(summary)} 字符")
                print(f"   摘要预览: {summary[:100]}...")
            
            if 'key_points' in analysis:
                key_points = analysis['key_points']
                print(f"   关键点数量: {len(key_points)}")
                for i, point in enumerate(key_points[:3], 1):
                    print(f"   关键点{i}: {point[:50]}...")
        else:
            print(f"   获取分析结果失败: {response.text}")
            
    except Exception as e:
        print(f"   获取分析结果失败: {e}")
    
    print("\n" + "=" * 50)
    print("测试完成")
    print("=" * 50)

if __name__ == "__main__":
    test_analysis_workflow()