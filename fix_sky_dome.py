with open("frontend/src/main.js", "r", encoding="utf-8") as f:
    content = f.read()

old = """function buildSkyView(data) {
  clearGroup(systemGroup);
  skyGroup = new THREE.Group();
  systemGroup.add(skyGroup);

  const viewHeight = camera.top - camera.bottom;
  const viewWidth  = camera.right - camera.left;
  const scale = viewHeight * 0.48;

  if (!data || !data.stars) return;

  // Star color by name (spectral type lookup)
  const starColors = {
    "Sirius": 0xaabbff, "Vega": 0xbbccff, "Rigel": 0xaaccff,
    "Deneb": 0xbbddff, "Spica": 0xaabbff, "Regulus": 0xbbccff,
    "Bellatrix": 0xaabbff, "Adhara": 0xaabbff, "Castor": 0xccddff,
    "Pollux": 0xffcc88, "Arcturus": 0xffaa55, "Aldebaran": 0xff9944,
    "Betelgeuse": 0xff8833, "Antares": 0xff7722, "Gacrux": 0xff9966,
    "Canopus": 0xeeeeff, "Procyon": 0xffeedd, "Altair": 0xeeeeff,
    "Fomalhaut": 0xeeeeff, "Capella": 0xffee99,
  };

  data.stars.forEach(star => {
    const [x, y, z] = star.position;
    const mag = star.magnitude ?? 2.0;
    const radius = Math.max(0.035, 0.22 - mag * 0.04);
    const opacity = Math.min(1.0, Math.max(0.25, 1.1 - mag * 0.18));
    const color = starColors[star.name] || (mag < 0.5 ? 0xffeeff : 0xffffff);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
    );
    mesh.position.set(x * scale, z * scale, 0);
    mesh.userData.name = star.name;
    mesh.userData.magnitude = mag;
    mesh.userData.alt = star.alt;
    mesh.userData.az = star.az;
    skyGroup.add(mesh);
  });

  // Constellation lines
  if (data.constellation_lines) {
    data.constellation_lines.forEach(line => {
      const [ax, ay, az] = line.from;
      const [bx, by, bz] = line.to;
      const points = [
        new THREE.Vector3(ax * scale, az * scale, 0),
        new THREE.Vector3(bx * scale, bz * scale, 0),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0x3355aa, transparent: true, opacity: 0.7 });
      skyGroup.add(new THREE.Line(geo, mat));
    });
  }

  // Star name labels (bright stars)
  data.stars.forEach(star => {
    const mag = star.magnitude ?? 2.0;
    if (mag > 1.5) return;
    const [x, y, z] = star.position;
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(180,210,255,0.8)";
    ctx.font = "20px monospace";
    ctx.fillText(star.name, 8, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.75 })
    );
    sprite.scale.set(2.2, 0.55, 1);
    sprite.position.set(x * scale + 0.3, z * scale + 0.4, 0);
    skyGroup.add(sprite);
  });

  // Horizon line
  const horizonPts = [
    new THREE.Vector3(-viewWidth * 0.6, 0, 0),
    new THREE.Vector3( viewWidth * 0.6, 0, 0),
  ];
  const horizonGeo = new THREE.BufferGeometry().setFromPoints(horizonPts);
  const horizonMat = new THREE.LineBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.5 });
  skyGroup.add(new THREE.Line(horizonGeo, horizonMat));

  // Cardinal direction labels
  const cardinals = [
    { label: "N", x: 0 },
    { label: "E", x: -viewWidth * 0.42 },
    { label: "W", x:  viewWidth * 0.42 },
  ];
  cardinals.forEach(c => {
    const canvas = document.createElement("canvas");
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(100,140,200,0.6)";
    ctx.font = "bold 70px monospace";
    ctx.textAlign = "center";
    ctx.fillText(c.label, 32, 44);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.6 })
    );
    sprite.scale.set(0.8, 0.8, 1);
    sprite.position.set(c.x, -0.6, 0);
    skyGroup.add(sprite);
  });

  // Constellation name labels
  if (data.visible_constellations) {
    data.visible_constellations.forEach(con => {
      const [x, y, z] = con.centroid;
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "rgba(100,160,255,0.55)";
      ctx.font = "bold 50px monospace";
      ctx.textAlign = "center";
      ctx.fillText(con.name.toUpperCase(), 160, 38);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7 })
      );
      sprite.scale.set(3.2, 0.64, 1);
      sprite.position.set(x * scale, z * scale, 0);
      skyGroup.add(sprite);
    });
  }

  updateSkyOverlay(data);
}"""

new = """function buildSkyView(data) {
  clearGroup(systemGroup);
  skyGroup = new THREE.Group();
  systemGroup.add(skyGroup);

  const viewHeight = camera.top - camera.bottom;
  const domeR = viewHeight * 0.44;

  if (!data || !data.stars) return;

  // Dome projection: alt/az -> screen coords
  // zenith = center, horizon = edge of circle
  // x = sin(az)*cos(alt)*domeR, y = cos(az)*cos(alt)*domeR (N at top)
  function domeXY(alt, az) {
    const altR = alt * Math.PI / 180;
    const azR  = az  * Math.PI / 180;
    const r = Math.cos(altR) * domeR;
    return { x: Math.sin(azR) * r, y: Math.cos(azR) * r };
  }

  // Also works from position vector [px, py, pz] where pz=sin(alt), px=cos(alt)*sin(az), py=cos(alt)*cos(az)
  function domePosFromVec(vec) {
    return { x: vec[0] * domeR, y: vec[1] * domeR };
  }

  const starColors = {
    "Sirius": 0xaabbff, "Vega": 0xbbccff, "Rigel": 0xaaccff,
    "Deneb": 0xbbddff, "Spica": 0xaabbff, "Regulus": 0xbbccff,
    "Bellatrix": 0xaabbff, "Castor": 0xccddff,
    "Pollux": 0xffcc88, "Arcturus": 0xffaa55, "Aldebaran": 0xff9944,
    "Betelgeuse": 0xff8833, "Antares": 0xff7722,
    "Canopus": 0xeeeeff, "Procyon": 0xffeedd, "Altair": 0xeeeeff,
    "Fomalhaut": 0xeeeeff, "Capella": 0xffee99,
  };

  // Horizon circle
  const horizonPts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    horizonPts.push(new THREE.Vector3(Math.cos(a) * domeR, Math.sin(a) * domeR, 0));
  }
  const horizonGeo = new THREE.BufferGeometry().setFromPoints(horizonPts);
  skyGroup.add(new THREE.Line(horizonGeo,
    new THREE.LineBasicMaterial({ color: 0x223355, transparent: true, opacity: 0.6 })));

  // Altitude rings (30, 60 deg)
  [30, 60].forEach(altDeg => {
    const r = Math.cos(altDeg * Math.PI / 180) * domeR;
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    skyGroup.add(new THREE.Line(g,
      new THREE.LineBasicMaterial({ color: 0x1a2233, transparent: true, opacity: 0.4 })));
  });

  // Cardinal labels on horizon
  const cardDirs = [
    { label: "N", az: 0 }, { label: "E", az: 90 },
    { label: "S", az: 180 }, { label: "W", az: 270 },
  ];
  cardDirs.forEach(c => {
    const p = domeXY(0, c.az);
    const canvas = document.createElement("canvas");
    canvas.width = 80; canvas.height = 60;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(80,120,180,0.7)";
    ctx.font = "bold 32px monospace";
    ctx.textAlign = "center";
    ctx.fillText(c.label, 40, 42);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.65 })
    );
    sprite.scale.set(0.9, 0.68, 1);
    sprite.position.set(p.x * 1.08, p.y * 1.08, 0);
    skyGroup.add(sprite);
  });

  // Zenith dot
  const zenith = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.5 })
  );
  skyGroup.add(zenith);

  // Stars
  data.stars.forEach(star => {
    const mag = star.magnitude ?? 2.0;
    const radius = Math.max(0.035, 0.22 - mag * 0.04);
    const opacity = Math.min(1.0, Math.max(0.25, 1.1 - mag * 0.18));
    const color = starColors[star.name] || 0xffffff;
    const p = domeXY(star.alt, star.az);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
    );
    mesh.position.set(p.x, p.y, 0);
    mesh.userData.name = star.name;
    mesh.userData.magnitude = mag;
    mesh.userData.alt = star.alt;
    mesh.userData.az = star.az;
    skyGroup.add(mesh);
  });

  // Constellation lines using position vectors
  if (data.constellation_lines) {
    data.constellation_lines.forEach(line => {
      const a = domePosFromVec(line.from);
      const b = domePosFromVec(line.to);
      const pts = [new THREE.Vector3(a.x, a.y, 0), new THREE.Vector3(b.x, b.y, 0)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      skyGroup.add(new THREE.Line(geo,
        new THREE.LineBasicMaterial({ color: 0x3355aa, transparent: true, opacity: 0.7 })));
    });
  }

  // Bright star labels
  data.stars.forEach(star => {
    if ((star.magnitude ?? 2.0) > 1.5) return;
    const p = domeXY(star.alt, star.az);
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(180,210,255,0.8)";
    ctx.font = "20px monospace";
    ctx.fillText(star.name, 8, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.75 })
    );
    sprite.scale.set(2.2, 0.55, 1);
    sprite.position.set(p.x + 0.3, p.y + 0.3, 0);
    skyGroup.add(sprite);
  });

  // Constellation name labels
  if (data.visible_constellations) {
    data.visible_constellations.forEach(con => {
      const p = domePosFromVec(con.centroid);
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "rgba(100,160,255,0.55)";
      ctx.font = "bold 50px monospace";
      ctx.textAlign = "center";
      ctx.fillText(con.name.toUpperCase(), 160, 38);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7 })
      );
      sprite.scale.set(3.2, 0.64, 1);
      sprite.position.set(p.x, p.y, 0);
      skyGroup.add(sprite);
    });
  }

  updateSkyOverlay(data);
}"""

content = content.replace(old, new)
with open("frontend/src/main.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done" if old in content or new in content else "WARNING: pattern not found")
