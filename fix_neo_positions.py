with open('frontend/src/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = """      const angle = Math.random() * Math.PI * 2;
      const r = R * (1.35 + (dist / maxDist) * 2.0);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(dotRadius, 8, 8),
        new THREE.MeshBasicMaterial({ color })
      );
      dot.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);"""

new = """      const [nx, ny, nz] = neo.position;
      const r = R * (1.35 + (dist / maxDist) * 2.0);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(dotRadius, 8, 8),
        new THREE.MeshBasicMaterial({ color })
      );
      dot.position.set(nx * r, nz * r, 0);"""

content = content.replace(old, new)
with open('frontend/src/main.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
