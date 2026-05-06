with open('frontend/src/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = """  const atmo = new THREE.Mesh(
    new THREE.RingGeometry(R * 1.02, R * 1.08, 128),
    new THREE.MeshBasicMaterial({
      color: 0x4488ff, side: THREE.DoubleSide, transparent: true, opacity: 0.15
    })
  );
  earthGroup.add(atmo);"""

content = content.replace(old, '')
with open('frontend/src/main.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
