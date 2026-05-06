with open("frontend/src/main.js", "r", encoding="utf-8") as f:
    content = f.read()

old = """      const [nx, ny, nz] = neo.position;
      const r = R * (1.35 + (dist / maxDist) * 2.0);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(dotRadius, 8, 8),
        new THREE.MeshBasicMaterial({ color })
      );
      dot.position.set(nx * r, nz * r, 0);"""

new = """      const [nx, ny, nz] = neo.position;
      const LUNAR_DIST = 384400;
      const innerR = R * 1.25;
      const outerR = R * 3.5;
      const t = Math.min(dist / maxDist, 1.0);
      const r = innerR + t * (outerR - innerR);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(dotRadius, 8, 8),
        new THREE.MeshBasicMaterial({ color })
      );
      // Use true direction from position vector
      const len2d = Math.sqrt(nx * nx + ny * ny) || 1;
      const dx = (nx / len2d) * r;
      const dy = (ny / len2d) * r;
      dot.position.set(dx, dy, 0);"""

content = content.replace(old, new)

# Add lunar distance reference ring to buildEarthView
old2 = """  updateRiskMeter(data);
}

function updateISSPosition"""

new2 = """  // Lunar distance reference ring
  const lunarR = R * 1.28;
  const lunarPts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    lunarPts.push(new THREE.Vector3(Math.cos(a) * lunarR, Math.sin(a) * lunarR, 0));
  }
  const lunarGeo = new THREE.BufferGeometry().setFromPoints(lunarPts);
  const lunarLine = new THREE.Line(lunarGeo,
    new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.3 }));
  earthGroup.add(lunarLine);

  updateRiskMeter(data);
}

function updateISSPosition"""

content = content.replace(old2, new2)

with open("frontend/src/main.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
