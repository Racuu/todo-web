"""Check the navigation table against tracked documents and actual source definitions."""
import re
from pathlib import Path

root = Path(__file__).resolve().parent
source = (root / 'index.html').read_text()
index = (root / 'AGENTS.md').read_text()
rows = [line.split('|')[1:-1] for line in index.splitlines() if line.startswith('| ')]
errors = []
if len(rows) < 3:
    errors.append('索引表缺失')
for cells in rows[2:]:
    if len(cells) != 3:
        errors.append('索引列数错误')
        continue
    topic, doc, anchors = (cell.strip() for cell in cells)
    link = re.fullmatch(r'\[[^\]]+\]\(([^)#]+)(?:#([^)]*))?\)', doc)
    if not link or not (root / link[1]).is_file():
        errors.append(f'{topic}：文档链接无效')
        continue
    if link[2]:
        headings = re.findall(r'^#{1,6} (.+)$', (root / link[1]).read_text(), re.M)
        if link[2] not in [h.strip().lower().replace(' ', '-') for h in headings]:
            errors.append(f'{topic}：缺少小节 {link[2]}')
    if anchors == '—':
        continue
    names = re.findall(r'`([\w$-]+)`', anchors)
    if not names:
        errors.append(f'{topic}：缺少代码入口')
    for name in names:
        token = re.escape(name)
        pattern = token + r'\s*:' if name.startswith('--') else rf'\b(?:function\s+{token}\s*\(|(?:const|let|class)\s+{token}\b)'
        if not re.search(pattern, source):
            errors.append(f'{topic}：找不到定义 {name}')
if errors:
    raise SystemExit('\n'.join(errors))
print('索引通过')
