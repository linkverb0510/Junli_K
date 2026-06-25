#!/usr/bin/env python3
"""
手动修复 new-quiz 题库中选项不足的题目
"""

import json

with open('final/data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# 修复数据
fixes = {
    'new-quiz-choice-7': {
        'prompt': '我军把坚持党对军队的绝对领导，作为军队政治工作的（ ）',
        'options': [
            {'key': 'A', 'text': '重点内容'},
            {'key': 'B', 'text': '核心内容'},
            {'key': 'C', 'text': '根本任务'}
        ]
    },
    'new-quiz-choice-24': {
        'prompt': '国防是国家为了防备和抵抗，制止，保卫国家主权、统一、领土完整和安全所进行的军事活动。（ ）',
        'options': [
            {'key': 'A', 'text': '侵略、武装颠覆'},
            {'key': 'B', 'text': '进攻、暴乱'},
            {'key': 'C', 'text': '进攻、武装颠覆'},
            {'key': 'D', 'text': '侵略、暴乱'}
        ]
    },
    'new-quiz-choice-25': {
        'prompt': '一个国家实施国防的主要手段是（ ）',
        'options': [
            {'key': 'A', 'text': '使用国家武装力量'},
            {'key': 'B', 'text': '发展经济建设'},
            {'key': 'C', 'text': '积极外交'},
            {'key': 'D', 'text': '加强军事实力'}
        ]
    },
    'new-quiz-choice-26': {
        'prompt': '是国防强大的基础。（ ）',
        'options': [
            {'key': 'A', 'text': '政治开明'},
            {'key': 'B', 'text': '军事科技发展'},
            {'key': 'C', 'text': '军队人才培养'},
            {'key': 'D', 'text': '经济发展'}
        ]
    },
    'new-quiz-choice-27': {
        'prompt': '中的国防条款在国防法规体系中居于最高地位。（ ）',
        'options': [
            {'key': 'A', 'text': '宪法'},
            {'key': 'B', 'text': '国防法规'},
            {'key': 'C', 'text': '兵役法'},
            {'key': 'D', 'text': '国防教育法'}
        ]
    }
}

fixed = 0
for q in questions:
    if q['id'] in fixes:
        fix = fixes[q['id']]
        q['prompt'] = fix['prompt']
        q['options'] = fix['options']
        fixed += 1
        print(f"修复: {q['id']} - {len(fix['options'])}个选项")

print(f"\n共修复 {fixed} 道题")

with open('final/data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print("已保存")
