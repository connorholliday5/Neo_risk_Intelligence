with open('frontend/src/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '  bottom: 16px;\n  right: 24px;',
    '  bottom: 72px;\n  right: 24px;'
)

with open('frontend/src/main.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
