with open('frontend/src/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '  bottom: 24px;\n  left: 24px;\n  background: rgba(0,0,0,0.6);\n  border: 1px solid rgba(255,255,255,0.2);\n  border-radius: 6px;\n  padding: 8px 16px;\n  color: rgba(255,255,255,0.7);\n  font-family: monospace;\n  font-size: 13px;\n  cursor: pointer;\n  display: none;\n  z-index: 100;\n  user-select: none;',
    '  bottom: 72px;\n  left: 24px;\n  background: rgba(0,0,0,0.6);\n  border: 1px solid rgba(255,255,255,0.2);\n  border-radius: 6px;\n  padding: 8px 16px;\n  color: rgba(255,255,255,0.7);\n  font-family: monospace;\n  font-size: 13px;\n  cursor: pointer;\n  display: none;\n  z-index: 100;\n  user-select: none;'
)

with open('frontend/src/main.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
