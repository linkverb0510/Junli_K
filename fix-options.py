#!/usr/bin/env python3
"""
修复选项不足4个的题目
从题干中提取被合并的选项
"""

import json
import re

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

fixed = 0
for q in questions:
    if q['type'] in ('single_choice', 'multiple_choice') and len(q.get('options', [])) < 4:
        prompt = q['prompt']
        
        # 找选项开始（A. 或 A、或 A．）
        opt_match = re.search(r'[A-D][.．、]\s', prompt)
        if opt_match:
            new_prompt = prompt[:opt_match.start()].strip()
            options_text = prompt[opt_match.start():]
            
            # 解析选项
            new_options = []
            for m in re.finditer(r'([A-D])[.．、]\s*([^A-D.．、]+?)(?=[A-D][.．、]\s|\s*$)', options_text):
                key = m.group(1)
                text = m.group(2).strip()
                new_options.append({'key': key, 'text': text})
            
            if len(new_options) >= 2:
                q['prompt'] = new_prompt
                q['options'] = new_options
                fixed += 1
                print(f"修复: {q['id']} - {len(new_options)}个选项")

print(f'\n共修复 {fixed} 道题')

with open('data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print('已保存')
