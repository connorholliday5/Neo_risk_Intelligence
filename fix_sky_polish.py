with open("frontend/src/main.js", "r", encoding="utf-8") as f:
    content = f.read()

# Fix constellation label canvas width
content = content.replace(
    'canvas.width = 320; canvas.height = 64;\n      const ctx = canvas.getContext("2d");\n      ctx.fillStyle = "rgba(100,160,255,0.55)";\n      ctx.font = "bold 50px monospace";\n      ctx.textAlign = "center";\n      ctx.fillText(con.name.toUpperCase(), 160, 38);',
    'canvas.width = 480; canvas.height = 64;\n      const ctx = canvas.getContext("2d");\n      ctx.fillStyle = "rgba(100,160,255,0.65)";\n      ctx.font = "bold 36px monospace";\n      ctx.textAlign = "center";\n      ctx.fillText(con.name.toUpperCase(), 240, 44);'
)

# Fix constellation label sprite scale
content = content.replace(
    'sprite.scale.set(3.2, 0.64, 1);\n      sprite.position.set(p.x, p.y, 0);',
    'sprite.scale.set(4.8, 0.64, 1);\n      sprite.position.set(p.x, p.y, 0);'
)

# Make stars brighter
content = content.replace(
    'const opacity = Math.min(1.0, Math.max(0.25, 1.1 - mag * 0.18));',
    'const opacity = Math.min(1.0, Math.max(0.5, 1.3 - mag * 0.18));'
)

# Make stars bigger
content = content.replace(
    'const radius = Math.max(0.035, 0.22 - mag * 0.04);',
    'const radius = Math.max(0.06, 0.28 - mag * 0.04);'
)

with open("frontend/src/main.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
