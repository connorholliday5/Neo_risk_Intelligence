import * as THREE from "three";
import { setupPostProcessing } from "./postprocessing.js";
import { PLANET_CONFIG } from "./planetConfig.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.innerHTML = "";
document.body.appendChild(renderer.domElement);

const FRUSTUM_HEIGHT = 40;
let aspect = window.innerWidth / window.innerHeight;

const camera = new THREE.OrthographicCamera(
  (-FRUSTUM_HEIGHT * aspect) / 2,
  ( FRUSTUM_HEIGHT * aspect) / 2,
   FRUSTUM_HEIGHT / 2,
  -FRUSTUM_HEIGHT / 2,
  0.1, 1000
);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

const composer = setupPostProcessing(renderer, scene, camera);

// ─── STARFIELD ────────────────────────────────────────────────────────────────

const starGeo = new THREE.BufferGeometry();
const starVerts = [];
for (let i = 0; i < 3500; i++) {
  starVerts.push(
    (Math.random() - 0.5) * 400,
    (Math.random() - 0.5) * 200,
    -50 - Math.random() * 200
  );
}
starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
scene.add(new THREE.Points(starGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: false })));

const systemGroup = new THREE.Group();
scene.add(systemGroup);
const planetGroup = new THREE.Group();
systemGroup.add(planetGroup);

// ─── STATE ────────────────────────────────────────────────────────────────────

let liveScene = null;
let currentView = "solar";
let solarWs = null;
let earthWs = null;
let skyWs = null;
let sunShader = null;
let planetMeshes = [];
let earthGroup = null;
let issMesh = null;
let neoMeshes = [];
let skyGroup = null;

const PLANET_ORDER = ["mercury","venus","earth","mars","jupiter","saturn","uranus","neptune"];

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
  }
}

// ─── UI ELEMENTS ──────────────────────────────────────────────────────────────

// Solar: big clock top-center
const solarDatetime = document.createElement("div");
solarDatetime.id = "solar-datetime";
solarDatetime.style.cssText = `
  position: fixed;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: rgb(255, 255, 255);
  font-family: monospace;
  pointer-events: none;
  display: none;
`;
document.body.appendChild(solarDatetime);

// Solar: astronomy events bottom-center
const eventsPanel = document.createElement("div");
eventsPanel.id = "events-panel";
eventsPanel.style.cssText = `
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.97);
  font-family: monospace;
  font-size: 30px;
  letter-spacing: 0.08em;
  pointer-events: none;
  display: none;
`;
const year = new Date().getFullYear();
const skyEvents = {
  2026: [
    "JAN 03 — Quadrantids Meteor Shower",
    "AUG 11 — Perseids Peak (best of year)",
    "AUG 12 — Partial Solar Eclipse visible from RI",
    "OCT 21 — Orionids Meteor Shower",
    "DEC 13 — Geminids Meteor Shower",
  ],
  2027: [
    "JAN 03 — Quadrantids Meteor Shower",
    "FEB 20 — Total Lunar Eclipse",
    "AUG 11 — Perseids Peak",
    "SEP 02 — Total Solar Eclipse",
    "DEC 13 — Geminids Meteor Shower",
  ],
};
const yearEvents = skyEvents[year] || skyEvents[2026];
eventsPanel.innerHTML = `
  <div style="font-size:21px;opacity:0.5;margin-bottom:6px;letter-spacing:0.2em">${year} SKY EVENTS — WESTERLY, RI</div>
  ${yearEvents.map(e => `<div style="margin:3px 0">${e}</div>`).join("")}
`;
document.body.appendChild(eventsPanel);

// Earth/Sky: date-time bottom-right
const overlay = document.createElement("div");
overlay.id = "neo-overlay";
overlay.style.cssText = `
  position: fixed;
  bottom: 16px;
  right: 24px;
  color: rgb(255, 255, 255);
  font-family: monospace;
  font-size: 13px;
  letter-spacing: 0.05em;
  pointer-events: none;
  display: none;
`;
document.body.appendChild(overlay);

// Earth/Sky: risk meter / info panel top-right
const riskMeter = document.createElement("div");
riskMeter.id = "risk-meter";
riskMeter.style.cssText = `
  position: fixed;
  top: 24px;
  right: 24px;
  background: rgba(0,0,0,0.6);
  border: 1px solid rgb(255, 255, 255);
  border-radius: 8px;
  padding: 12px 18px;
  color: white;
  font-family: monospace;
  text-align: center;
  display: none;
  pointer-events: none;
`;
document.body.appendChild(riskMeter);

// Back button bottom-left
const backBtn = document.createElement("div");
backBtn.id = "back-btn";
backBtn.style.cssText = `
  position: fixed;
  bottom: 24px;
  left: 24px;
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  padding: 8px 16px;
  color: rgb(255, 255, 255);
  font-family: monospace;
  font-size: 13px;
  cursor: pointer;
  display: none;
  z-index: 100;
  user-select: none;
`;
backBtn.addEventListener("click", () => {
  if (currentView === "earth") switchToSolar();
  else if (currentView === "sky") switchToEarth();
});
backBtn.addEventListener("mouseenter", () => backBtn.style.color = "white");
backBtn.addEventListener("mouseleave", () => backBtn.style.color = "rgba(255,255,255,0.7)");
document.body.appendChild(backBtn);

// Hover tooltip
const tooltip = document.createElement("div");
tooltip.style.cssText = `
  position: fixed;
  background: rgba(0,0,0,0.75);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  padding: 6px 12px;
  color: white;
  font-family: monospace;
  font-size: 12px;
  pointer-events: none;
  display: none;
  z-index: 100;
`;
document.body.appendChild(tooltip);

// ─── SOLAR VIEW ───────────────────────────────────────────────────────────────

function buildScene() {
  clearGroup(systemGroup);
  systemGroup.add(planetGroup);
  clearGroup(planetGroup);
  planetMeshes = [];

  const viewWidth  = camera.right - camera.left;
  const viewHeight = camera.top - camera.bottom;
  const left       = camera.left;
  const sunRadius  = viewHeight * 0.34;

  sunShader = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0.0 } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec3 vNormal;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float hash1(float n) { return fract(sin(n) * 43758.5453); }

      float noise(vec2 p) {
        vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
                   mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
      }

      float fbm(vec2 p, int oct) {
        float v=0.0, a=0.5;
        for(int i=0;i<8;i++){if(i>=oct)break; v+=a*noise(p); p*=2.13; a*=0.5;}
        return v;
      }

      float worley(vec2 p) {
        vec2 ip=floor(p), fp=fract(p); float d=8.0;
        for(int y=-2;y<=2;y++) for(int x=-2;x<=2;x++){
          vec2 n=vec2(float(x),float(y));
          vec2 r=n+vec2(hash(ip+n+vec2(3.7,1.3)),hash(ip+n+vec2(8.1,5.9)))-fp;
          d=min(d,dot(r,r));
        }
        return sqrt(d);
      }

      float arch(float a, float seed) {
        float peak=hash1(seed)*6.283, width=0.16+hash1(seed+1.0)*0.13;
        float t=clamp(1.0-abs(mod(a-peak+3.14159,6.283)-3.14159)/width,0.0,1.0);
        return pow(t,1.6)*(0.88+sin(a*20.0+time*2.3+seed)*0.12);
      }

      void main() {
        vec2  uv = vNormal.xy;
        float r2 = clamp(length(uv), 0.0, 1.0);
        float mu = clamp(vNormal.z, 0.0, 1.0);

        float st    = time * 0.012;
        vec2  drift = vec2(sin(st*1.2+uv.y*1.8), cos(st*0.8+uv.x*1.5)) * 0.06;
        vec2  p     = uv * 4.5 + drift;

        float large = fbm(p*0.85+vec2( st*0.7,-st*0.5), 4);
        float med   = fbm(p*2.0 +vec2(-st*1.1, st*0.8), 5);
        float gran  = worley(p*5.0+vec2(st*0.35,-st*0.28));
              gran  = smoothstep(0.04, 0.50, gran);
        float fine  = fbm(p*8.5 +vec2( st*1.4, st*0.6), 4);
        float surf  = clamp(large*0.35 + med*0.30 + gran*0.25 + fine*0.10, 0.0, 1.0);

        float sn       = fbm(p*0.55+vec2(st*0.25,-st*0.18),3)*0.6
                       + fbm(p*0.80+vec2(-st*0.30,st*0.22),3)*0.4;
        float umbra    = smoothstep(0.658, 0.680, sn);
        float penumbra = smoothstep(0.622, 0.668, sn) * (1.0 - umbra);

        float ld = pow(mu, 0.50);

        vec3 cAbyss  = vec3(0.03, 0.003, 0.000);
        vec3 cDeep   = vec3(0.14, 0.015, 0.002);
        vec3 cOrange = vec3(0.80, 0.22,  0.022);
        vec3 cYellow = vec3(0.95, 0.70,  0.14);

        vec3 col = mix(cDeep,   cOrange, smoothstep(0.20, 0.52, surf));
             col = mix(col,     cYellow, smoothstep(0.50, 0.84, surf));
        col = mix(col, cAbyss,   umbra    * 0.94);
        col = mix(col, cDeep*1.5,penumbra * 0.82);
        col *= ld;

        float core = pow(max(0.0, 1.0 - r2 * 1.15), 2.6);
        col += vec3(1.0, 0.85, 0.50) * core * 1.50;

        float chromo = smoothstep(0.78, 0.94, r2) * (1.0 - smoothstep(0.94, 1.00, r2));
        col += vec3(1.00, 0.72, 0.16) * chromo * 0.75;

        float rim   = smoothstep(0.87, 1.00, r2);
        float spike = smoothstep(0.95, 1.00, r2);
        col += vec3(1.20, 0.28, 0.02) * rim   * 1.00;
        col += vec3(1.40, 0.45, 0.06) * spike * 0.70;

        float angle = atan(uv.y, uv.x);
        if (r2 > 0.96 && r2 < 1.22) {
          float pn    = (r2 - 0.96) / 0.26;
          float shell = pow(pn, 0.6) * pow(1.0-pn, 0.9) * 3.5;
          float pro   = 0.0;
          for(int k=0;k<6;k++) pro = max(pro, arch(angle,float(k))*shell);
          float turb  = fbm(uv*7.0+vec2(time*0.07,-time*0.05),5);
          pro = clamp(pow(pro - turb*0.35, 1.3), 0.0, 1.0);
          vec3 proCol = mix(vec3(1.2,0.08,0.005), vec3(1.8,0.50,0.04), pro);
          col = mix(col, proCol, pro * 0.95);
        }

        col *= 1.0
          + sin(time*3.3+r2*4.8)*0.007
          + sin(time*7.1+r2*8.5)*0.004
          + sin(time*14.2+r2*2.9)*0.003;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius, 256, 256),
    sunShader
  );
  sun.position.set(left - sunRadius * 0.42, 0, 0);
  systemGroup.add(sun);

  const usableRight = camera.right - viewWidth * 0.07;
  const mercuryX    = sun.position.x + sunRadius + 4.2;
  const neptuneX    = usableRight - 3.2;
  const step        = (neptuneX - mercuryX) / 7.0;

  const positions = [
    mercuryX,
    mercuryX + step * 0.75,
    mercuryX + step * 1.65,
    mercuryX + step * 2.35,
    mercuryX + step * 3.65,
    mercuryX + step * 4.75,
    mercuryX + step * 5.91,
    neptuneX
  ];

  const sizeScale = viewHeight * 0.075;

  PLANET_ORDER.forEach((name, i) => {
    const cfg = PLANET_CONFIG[name] || { color: 0xffffff, size: 1.0 };
    const radius = cfg.size * sizeScale * 0.5;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 48),
      new THREE.MeshBasicMaterial({ color: cfg.color })
    );
    mesh.position.set(positions[i], 0, 0);
    mesh.userData.baseX = positions[i];
    mesh.userData.name = name;
    planetGroup.add(mesh);
    planetMeshes.push(mesh);

    if (name === "saturn") {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * 1.1, radius * 1.6, 96),
        new THREE.MeshBasicMaterial({
          color: 0xb09878, side: THREE.DoubleSide, transparent: true, opacity: 0.9
        })
      );
      ring.rotation.x = Math.PI / 2.7;
      ring.rotation.z = -0.12;
      mesh.add(ring);
    }
  });
}

function applyLiveData(data) {
  if (!data || !data.bodies) return;
  const viewHeight = camera.top - camera.bottom;
  const maxOffset = viewHeight * 0.18;
  data.bodies.forEach(body => {
    const mesh = planetMeshes.find(m => m.userData.name === body.name);
    if (!mesh) return;
    mesh.position.y = body.position[2] * maxOffset;
  });
  if (data.time) {
    const dt = document.getElementById("solar-datetime");
    if (dt) dt.innerHTML = `
      <div style="font-size:72px;font-weight:200;letter-spacing:0.12em">${data.time.time}</div>
      <div style="font-size:22px;font-weight:300;letter-spacing:0.2em;opacity:0.7;margin-top:4px">${data.time.date}</div>
    `;
  }
}

// ─── EARTH VIEW ───────────────────────────────────────────────────────────────

function buildEarthView(data) {
  clearGroup(systemGroup);
  earthGroup = new THREE.Group();
  systemGroup.add(earthGroup);

  const viewHeight = camera.top - camera.bottom;
  const R = viewHeight * 0.22;

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x1a6fa8 })
  );
  earth.userData.name = "earth-sphere";
  earthGroup.add(earth);

  const atmo = new THREE.Mesh(
    new THREE.RingGeometry(R * 1.02, R * 1.08, 128),
    new THREE.MeshBasicMaterial({
      color: 0x4488ff, side: THREE.DoubleSide, transparent: true, opacity: 0.15
    })
  );
  earthGroup.add(atmo);

  const orbitRing = new THREE.Mesh(
    new THREE.RingGeometry(R * 1.12, R * 1.13, 128),
    new THREE.MeshBasicMaterial({
      color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.25
    })
  );
  earthGroup.add(orbitRing);

  issMesh = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.04, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  issMesh.userData.name = "ISS";
  earthGroup.add(issMesh);

  neoMeshes = [];
  if (data && data.neos) {
    data.neos.forEach(neo => {
      const dist = neo.distance_km || 5000000;
      let color;
      if (dist < 500000) color = 0xff2200;
      else if (dist < 2000000) color = 0xffaa00;
      else color = 0x00ff88;

      const angle = Math.random() * Math.PI * 2;
      const r = R * (1.3 + Math.random() * 2.5);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(R * 0.025, 6, 6),
        new THREE.MeshBasicMaterial({ color })
      );
      dot.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      dot.userData.name = neo.name;
      dot.userData.dist = dist;
      earthGroup.add(dot);
      neoMeshes.push(dot);
    });
  }

  updateRiskMeter(data);
}

function updateISSPosition(data) {
  if (!issMesh || !data || !data.iss) return;
  const viewHeight = camera.top - camera.bottom;
  const R = viewHeight * 0.22;
  const issOrbitR = R * 1.125;
  const pos = data.iss.position;
  const angle = Math.atan2(pos[1], pos[0]);
  issMesh.position.set(Math.cos(angle) * issOrbitR, Math.sin(angle) * issOrbitR, 0);
}

function updateRiskMeter(data) {
  const el = document.getElementById("risk-meter");
  if (!el || !data || !data.neos || data.neos.length === 0) return;
  const closest = Math.min(...data.neos.map(n => n.distance_km || 99999999));
  let level, color;
  if (closest < 500000) { level = "HIGH"; color = "#ff2200"; }
  else if (closest < 2000000) { level = "ELEVATED"; color = "#ffaa00"; }
  else { level = "NOMINAL"; color = "#00ff88"; }
  el.innerHTML = `
    <div style="font-size:10px;opacity:0.6;margin-bottom:2px">CLOSEST NEO</div>
    <div style="font-size:18px;font-weight:bold;color:${color}">${level}</div>
    <div style="font-size:11px;opacity:0.7">${(closest / 1000).toFixed(0).toLocaleString()} k km</div>
  `;
}

// ─── SKY VIEW ─────────────────────────────────────────────────────────────────

function buildSkyView(data) {
  clearGroup(systemGroup);
  skyGroup = new THREE.Group();
  systemGroup.add(skyGroup);

  const viewHeight = camera.top - camera.bottom;
  const scale = viewHeight * 0.48;

  if (!data || !data.stars) return;

  data.stars.forEach(star => {
    const [x, y, z] = star.position;
    const mag = star.magnitude ?? 2.0;
    const radius = Math.max(0.04, 0.22 - mag * 0.04);
    const opacity = Math.min(1.0, Math.max(0.3, 1.1 - mag * 0.18));
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity })
    );
    mesh.position.set(x * scale, z * scale, 0);
    mesh.userData.name = star.name;
    mesh.userData.magnitude = mag;
    mesh.userData.alt = star.alt;
    mesh.userData.az = star.az;
    skyGroup.add(mesh);
  });

  if (data.constellation_lines) {
    data.constellation_lines.forEach(line => {
      const [ax, ay, az] = line.from;
      const [bx, by, bz] = line.to;
      const points = [
        new THREE.Vector3(ax * scale, az * scale, 0),
        new THREE.Vector3(bx * scale, bz * scale, 0),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.6 });
      skyGroup.add(new THREE.Line(geo, mat));
    });
  }

  data.stars.forEach(star => {
    const mag = star.magnitude ?? 2.0;
    if (mag > 1.5) return;
    const [x, y, z] = star.position;
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(180,200,255,0.85)";
    ctx.font = "22px monospace";
    ctx.fillText(star.name, 8, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.8 })
    );
    sprite.scale.set(2.2, 0.55, 1);
    sprite.position.set(x * scale + 0.3, z * scale + 0.3, 0);
    skyGroup.add(sprite);
  });

  updateSkyOverlay(data);
}

function updateSkyOverlay(data) {
  if (data && data.time) {
    const ol = document.getElementById("neo-overlay");
    if (ol) ol.textContent = `${data.time.date}  ${data.time.time}`;
  }
  const rm = document.getElementById("risk-meter");
  if (rm) {
    rm.innerHTML = `
      <div style="font-size:10px;opacity:0.6;margin-bottom:2px">LOCAL SKY</div>
      <div style="font-size:14px;font-weight:bold;color:#aaccff">WESTERLY, RI</div>
      <div style="font-size:11px;opacity:0.7">41.38°N  71.83°W</div>
    `;
    rm.style.display = "block";
  }
}

// ─── WEBSOCKETS ───────────────────────────────────────────────────────────────

function connectSolarWS() {
  solarWs = new WebSocket("ws://localhost:8000/ws/solar");
  solarWs.onopen = () => console.log("[WS] Solar connected");
  solarWs.onmessage = (e) => {
    try {
      liveScene = JSON.parse(e.data);
      if (currentView === "solar") applyLiveData(liveScene);
    } catch(_) {}
  };
  solarWs.onclose = () => setTimeout(connectSolarWS, 3000);
}

function connectEarthWS() {
  earthWs = new WebSocket("ws://localhost:8000/ws/earth");
  earthWs.onopen = () => console.log("[WS] Earth connected");
  earthWs.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (currentView === "earth") {
        updateISSPosition(data);
        updateRiskMeter(data);
        if (data.time) {
          const ol = document.getElementById("neo-overlay");
          if (ol) ol.textContent = `${data.time.date}  ${data.time.time}`;
        }
      }
    } catch(_) {}
  };
  earthWs.onclose = () => setTimeout(connectEarthWS, 3000);
}

function connectSkyWS() {
  skyWs = new WebSocket("ws://localhost:8000/ws/sky");
  skyWs.onopen = () => console.log("[WS] Sky connected");
  skyWs.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (currentView === "sky") buildSkyView(data);
    } catch(_) {}
  };
  skyWs.onclose = () => setTimeout(connectSkyWS, 3000);
}

// ─── VIEW SWITCHING ───────────────────────────────────────────────────────────

function showSolarUI() {
  solarDatetime.style.display = "block";
  eventsPanel.style.display = "block";
  overlay.style.display = "none";
  riskMeter.style.display = "none";
  backBtn.style.display = "none";
}

function showSecondaryUI() {
  solarDatetime.style.display = "none";
  eventsPanel.style.display = "none";
  overlay.style.display = "block";
  riskMeter.style.display = "block";
  backBtn.style.display = "block";
}

function switchToSolar() {
  currentView = "solar";
  showSolarUI();
  buildScene();
}

function switchToEarth() {
  currentView = "earth";
  showSecondaryUI();
  backBtn.textContent = "← SOLAR SYSTEM";
  fetch("http://localhost:8000/scene/earth")
    .then(r => r.json())
    .then(data => buildEarthView(data));
}

function switchToSky() {
  currentView = "sky";
  showSecondaryUI();
  backBtn.textContent = "← EARTH";
  fetch("http://localhost:8000/scene/sky")
    .then(r => r.json())
    .then(data => buildSkyView(data));
}

// ─── RAYCASTER ────────────────────────────────────────────────────────────────

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  let label = null;

  if (currentView === "solar") {
    const hits = raycaster.intersectObjects(planetMeshes);
    if (hits.length > 0) {
      const name = hits[0].object.userData.name;
      label = name.charAt(0).toUpperCase() + name.slice(1);
      renderer.domElement.style.cursor = name === "earth" ? "pointer" : "default";
    } else {
      renderer.domElement.style.cursor = "default";
    }

  } else if (currentView === "earth" && earthGroup) {
    const targets = issMesh ? [earthGroup.children[0], issMesh, ...neoMeshes] : [earthGroup.children[0], ...neoMeshes];
    const hits = raycaster.intersectObjects(targets);
    if (hits.length > 0) {
      const obj = hits[0].object;
      if (obj.userData.name === "earth-sphere") {
        label = "Earth — click to view local sky";
        renderer.domElement.style.cursor = "pointer";
      } else if (obj === issMesh) {
        label = "ISS — International Space Station";
        renderer.domElement.style.cursor = "crosshair";
      } else {
        label = `${obj.userData.name}  |  ${(obj.userData.dist / 1000).toFixed(0).toLocaleString()} k km`;
        renderer.domElement.style.cursor = "crosshair";
      }
    } else {
      renderer.domElement.style.cursor = "default";
    }

  } else if (currentView === "sky" && skyGroup) {
    const starMeshes = skyGroup.children.filter(c => c.isMesh && c.userData.name);
    const hits = raycaster.intersectObjects(starMeshes);
    if (hits.length > 0) {
      const s = hits[0].object;
      label = `${s.userData.name}  |  mag ${(s.userData.magnitude ?? 0).toFixed(2)}  |  alt ${(s.userData.alt ?? 0).toFixed(1)}°`;
      renderer.domElement.style.cursor = "crosshair";
    } else {
      renderer.domElement.style.cursor = "default";
    }
  }

  if (label) {
    tooltip.textContent = label;
    tooltip.style.display = "block";
    tooltip.style.left = (e.clientX + 14) + "px";
    tooltip.style.top  = (e.clientY - 10) + "px";
  } else {
    tooltip.style.display = "none";
  }
});

renderer.domElement.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});

renderer.domElement.addEventListener("click", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (currentView === "solar") {
    const hits = raycaster.intersectObjects(planetMeshes);
    if (hits.length > 0 && hits[0].object.userData.name === "earth") {
      switchToEarth();
    }
  } else if (currentView === "earth" && earthGroup) {
    const hits = raycaster.intersectObject(earthGroup.children[0]);
    if (hits.length > 0) switchToSky();
  }
});

// ─── CAMERA + RESIZE ──────────────────────────────────────────────────────────

function updateCamera() {
  aspect        = window.innerWidth / window.innerHeight;
  camera.left   = (-FRUSTUM_HEIGHT * aspect) / 2;
  camera.right  = ( FRUSTUM_HEIGHT * aspect) / 2;
  camera.top    =  FRUSTUM_HEIGHT / 2;
  camera.bottom = -FRUSTUM_HEIGHT / 2;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  updateCamera();
  buildScene();
});

// ─── INIT ─────────────────────────────────────────────────────────────────────

updateCamera();
buildScene();
showSolarUI();
connectSolarWS();
connectEarthWS();
connectSkyWS();

function animate() {
  requestAnimationFrame(animate);
  if (sunShader) sunShader.uniforms.time.value += 0.01;
  composer.render();
}
animate();