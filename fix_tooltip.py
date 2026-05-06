with open('frontend/src/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = "        label = `${obj.userData.name}  |  ${(obj.userData.dist / 1000).toFixed(0).toLocaleString()} k km`;"
new = """        const ipStr = (obj.userData.ip !== null && obj.userData.ip !== undefined)
          ? `  |  ip: ${(obj.userData.ip * 100).toFixed(4)}%`
          : '  |  ip: <0.01%';
        label = `${obj.userData.name}  |  ${(obj.userData.dist / 1000).toFixed(0).toLocaleString()} k km${ipStr}`;"""

content = content.replace(old, new)
with open('frontend/src/main.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
