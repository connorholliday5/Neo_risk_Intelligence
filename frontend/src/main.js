import * as THREE from "three";
import { setupPostProcessing } from "./postprocessing.js";
import { PLANET_CONFIG } from "./planetConfig.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const sunLight = new THREE.PointLight(0xffffff, 4, 2000);
sunLight.position.set(-60, 0, 20);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x666666));
const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
fillLight.position.set(1, 0, 1);
scene.add(fillLight);

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

const solarDatetime = document.createElement("div");
solarDatetime.id = "solar-datetime";
solarDatetime.style.cssText = `
  position: fixed;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: rgba(255,255,255,0.9);
  font-family: monospace;
  pointer-events: none;
  display: none;
`;
document.body.appendChild(solarDatetime);

const eventsPanel = document.createElement("div");
eventsPanel.id = "events-panel";
eventsPanel.style.cssText = `
  position: fixed;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: rgb(255, 255, 255);
  font-family: monospace;
  font-size: 32px;
  letter-spacing: 0.08em;
  pointer-events: none;
  display: none;
  white-space: nowrap;
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

const today = new Date();
const currentYear = today.getFullYear();

function parseEventDate(str) {
  const months = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
  const parts = str.split(" - ")[0].trim().split(" ");
  return new Date(currentYear, months[parts[0]], parseInt(parts[1]));
}

function daysUntil(d) {
  return Math.ceil((d - today) / 86400000);
}

const eventsHTML = yearEvents.map(e => {
  const d = parseEventDate(e);
  const days = daysUntil(d);
  const isPast = days < -1;
  const isNext = !isPast && yearEvents.filter(x => daysUntil(parseEventDate(x)) >= 0).indexOf(e) === 0;
  const label = e.split(" - ").slice(1).join(" - ");
  const date = e.split(" - ")[0];
  if (isPast) {
    return `<div style="margin:3px 0;opacity:0.3;text-decoration:line-through">${e}</div>`;
  } else if (isNext) {
    const tag = days === 0 ? "TODAY" : days === 1 ? "TOMORROW" : `${days}d`;
    return `<div style="margin:5px 0;color:#ffe066;font-weight:bold">${date} - ${label} <span style="font-size:25px;opacity:0.7;margin-left:6px">[${tag}]</span></div>`;
  } else {
    return `<div style="margin:3px 0;opacity:0.6">${e}</div>`;
  }
}).join("");

eventsPanel.innerHTML = `
  <div style="font-size:20px;opacity:1.0;margin-bottom:8px;letter-spacing:0.2em">${year} SKY EVENTS - WESTERLY, RI</div>
  ${eventsHTML}
`;
document.body.appendChild(eventsPanel);

const overlay = document.createElement("div");
overlay.id = "neo-overlay";
overlay.style.cssText = `
  position: fixed;
  bottom: 72px;
  right: 24px;
  color: rgba(255,255,255,0.5);
  font-family: monospace;
  font-size: 13px;
  letter-spacing: 0.05em;
  pointer-events: none;
  display: none;
`;
document.body.appendChild(overlay);

const riskMeter = document.createElement("div");
riskMeter.id = "risk-meter";
riskMeter.style.cssText = `
  position: fixed;
  top: 24px;
  right: 24px;
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  padding: 12px 18px;
  color: white;
  font-family: monospace;
  text-align: center;
  display: none;
  pointer-events: none;
`;
document.body.appendChild(riskMeter);

const backBtn = document.createElement("div");
backBtn.id = "back-btn";
backBtn.style.cssText = `
  position: fixed;
  bottom: 72px;
  left: 24px;
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  padding: 8px 16px;
  color: rgba(255,255,255,0.7);
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

const texLoader = new THREE.TextureLoader();

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
    const tex = texLoader.load(`/assets/textures/${name}.jpg`);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 48),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 1.0, metalness: 0.0 })
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

  const earthTex = texLoader.load("/assets/textures/earth.jpg");
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 64),
    new THREE.MeshStandardMaterial({ map: earthTex, roughness: 1.0, metalness: 0.0 })
  );
  earth.userData.name = "earth-sphere";
  earthGroup.add(earth);



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
    const sorted = [...data.neos].sort((a, b) => (a.distance_km || 9e9) - (b.distance_km || 9e9));
    sorted.forEach((neo, idx) => {
      const dist = neo.distance_km || 5000000;
      const ip = neo.impact_probability;

      let color;
      if (ip !== null && ip !== undefined) {
        if (ip > 0.001) color = 0xff2200;
        else if (ip > 0.00001) color = 0xffaa00;
        else color = 0x00ff88;
      } else {
        if (dist < 500000) color = 0xff2200;
        else if (dist < 2000000) color = 0xffaa00;
        else color = 0x00ff88;
      }

      const maxDist = 8000000;
      const sizeFactor = Math.max(0.3, 1.0 - dist / maxDist);
      const dotRadius = R * (0.018 + sizeFactor * 0.028);

      const [nx, ny, nz] = neo.position;
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
      dot.position.set(dx, dy, 0);
      dot.userData.name = neo.name;
      dot.userData.dist = dist;
      dot.userData.ip = ip;
      dot.userData.isClosest = (idx === 0);
      dot.userData.baseRadius = dotRadius;
      earthGroup.add(dot);
      neoMeshes.push(dot);
    });
  }

  // Lunar distance reference ring
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

  const sorted = [...data.neos].sort((a, b) => (a.distance_km || 9e9) - (b.distance_km || 9e9));
  const closest = sorted[0];
  const dist = closest.distance_km || 0;
  const ip = closest.impact_probability;

  let level, color;
  if (ip !== null && ip !== undefined) {
    if (ip > 0.001) { level = "HIGH"; color = "#ff2200"; }
    else if (ip > 0.00001) { level = "ELEVATED"; color = "#ffaa00"; }
    else { level = "NO THREAT"; color = "#00ff88"; }
  } else {
    if (dist < 500000) { level = "HIGH"; color = "#ff2200"; }
    else if (dist < 2000000) { level = "ELEVATED"; color = "#ffaa00"; }
    else { level = "NO THREAT"; color = "#00ff88"; }
  }

  const ipText = (ip !== null && ip !== undefined)
    ? `${(ip * 100).toFixed(4)}%`
    : `< 0.01%`;

  const distText = dist > 999999
    ? `${(dist / 1000000).toFixed(2)} M km`
    : `${Math.round(dist / 1000).toLocaleString()} k km`;

  el.innerHTML = `
    <div style="font-size:9px;opacity:0.5;letter-spacing:1px;margin-bottom:3px">CLOSEST NEO</div>
    <div style="font-size:11px;opacity:0.85;margin-bottom:2px">${closest.name}</div>
    <div style="font-size:18px;font-weight:bold;color:${color};letter-spacing:1px">${level}</div>
    <div style="font-size:10px;opacity:0.6;margin-top:3px">${distText}</div>
    <div style="font-size:10px;opacity:0.6">impact prob: ${ipText}</div>
  `;
}

// ─── SKY VIEW ─────────────────────────────────────────────────────────────────

function buildSkyView(data) {
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
    const radius = Math.max(0.06, 0.28 - mag * 0.04);
    const opacity = Math.min(1.0, Math.max(0.5, 1.3 - mag * 0.18));
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
      canvas.width = 480; canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "rgba(100,160,255,0.65)";
      ctx.font = "bold 36px monospace";
      ctx.textAlign = "center";
      ctx.fillText(con.name.toUpperCase(), 240, 44);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7 })
      );
      sprite.scale.set(4.8, 0.64, 1);
      sprite.position.set(p.x, p.y, 0);
      skyGroup.add(sprite);
    });
  }

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
      const descriptions = {
        mercury: "Mercury — 0.39 AU — 88 day orbit",
        venus:   "Venus — 0.72 AU — 225 day orbit",
        earth:   "Earth — 1.00 AU — click to view",
        mars:    "Mars — 1.52 AU — 687 day orbit",
        jupiter: "Jupiter — 5.20 AU — 12 year orbit",
        saturn:  "Saturn — 9.58 AU — 29 year orbit",
        uranus:  "Uranus — 19.2 AU — 84 year orbit",
        neptune: "Neptune — 30.1 AU — 165 year orbit",
      };
      label = descriptions[name] || name;
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
        const ipStr = (obj.userData.ip !== null && obj.userData.ip !== undefined)
          ? `  |  ip: ${(obj.userData.ip * 100).toFixed(4)}%`
          : '  |  ip: <0.01%';
        label = `${obj.userData.name}  |  ${(obj.userData.dist / 1000).toFixed(0).toLocaleString()} k km${ipStr}`;
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
  planetMeshes.forEach(mesh => {
    mesh.rotation.y += 0.0002;
  });
  // Pulse closest NEO
  if (neoMeshes.length > 0) {
    const t = Date.now() / 600;
    neoMeshes.forEach(dot => {
      if (dot.userData.isClosest) {
        const pulse = 1.0 + Math.sin(t) * 0.35;
        const r = dot.userData.baseRadius * pulse;
        dot.scale.setScalar(pulse);
      }
    });
  }
  composer.render();
}
animate();







