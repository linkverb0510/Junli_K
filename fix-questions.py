#!/usr/bin/env python3
"""
修复题库问题：
1. 清理题干末尾的答案字母（如 "：D"）
2. 重命名 "2018级期末考试题" 为 "2018期末题库"
"""

import json
import re

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

fixed_count = 0
chapter_rename_count = 0

for q in questions:
    # 1. 修复题干末尾的答案字母
    prompt = q['prompt']
    # 匹配末尾的 "：D"、"：C"、"：B"、"：A" 或 ": D" 等
    cleaned = re.sub(r'[：:]\s*[A-D]\s*$', '', prompt)
    if cleaned != prompt:
        q['prompt'] = cleaned
        fixed_count += 1
    
    # 2. 重命名章节
    if q.get('chapterTitle') == '2018级期末考试题':
        q['chapterTitle'] = '2018期末题库'
        chapter_rename_count += 1

print(f'修复了 {fixed_count} 道题的答案字母')
print(f'重命名了 {chapter_rename_count} 道题的章节标题')

with open('data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print('已保存')
