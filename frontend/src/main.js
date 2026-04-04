import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { setupPostProcessing } from "./postprocessing.js";

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

// STARFIELD
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

const planetData = [
  { color: 0xb8b8b8, size: 0.45 },
  { color: 0xe9c07a, size: 0.75 },
  { color: 0x4aa3ff, size: 0.85 },
  { color: 0xff6a4a, size: 0.65 },
  { color: 0xe8a98a, size: 1.55 },
  { color: 0xc8b090, size: 1.35 },
  { color: 0x9ad7f7, size: 1.15 },
  { color: 0x3d7cff, size: 1.15 }
];

let sunShader = null;

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

function buildScene() {
  clearGroup(systemGroup);
  systemGroup.add(planetGroup);
  clearGroup(planetGroup);

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

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
      }
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

        // ── Surface texture ───────────────────────────────────────────────
        float large = fbm(p*0.85+vec2( st*0.7,-st*0.5), 4);
        float med   = fbm(p*2.0 +vec2(-st*1.1, st*0.8), 5);
        float gran  = worley(p*5.0+vec2(st*0.35,-st*0.28));
              gran  = smoothstep(0.04, 0.50, gran);
        float fine  = fbm(p*8.5 +vec2( st*1.4, st*0.6), 4);
        float surf  = clamp(large*0.35 + med*0.30 + gran*0.25 + fine*0.10, 0.0, 1.0);

        // ── Sunspots ───────────────────────────────────────────────────────
        float sn       = fbm(p*0.55+vec2(st*0.25,-st*0.18),3)*0.6
                       + fbm(p*0.80+vec2(-st*0.30,st*0.22),3)*0.4;
        float umbra    = smoothstep(0.658, 0.680, sn);
        float penumbra = smoothstep(0.622, 0.668, sn) * (1.0 - umbra);

        // ── Limb darkening on the photosphere only ─────────────────────────
        float ld = pow(mu, 0.50);

        // ── Surface color (mid-brightness, won't trigger bloom by itself) ──
        vec3 cAbyss  = vec3(0.03, 0.003, 0.000);
        vec3 cDeep   = vec3(0.14, 0.015, 0.002);
        vec3 cOrange = vec3(0.80, 0.22,  0.022);
        vec3 cYellow = vec3(0.95, 0.70,  0.14);

        vec3 col = mix(cDeep,   cOrange, smoothstep(0.20, 0.52, surf));
             col = mix(col,     cYellow, smoothstep(0.50, 0.84, surf));
        col = mix(col, cAbyss,   umbra    * 0.94);
        col = mix(col, cDeep*1.5,penumbra * 0.82);
        col *= ld;

        // ── Core brightness (bloom fires here — centre only) ───────────────
        float core = pow(max(0.0, 1.0 - r2 * 1.15), 2.6);
        col += vec3(1.0, 0.85, 0.50) * core * 1.50;

        // ── Chromosphere ring — self-luminous, no ld ──────────────────────
        float chromo = smoothstep(0.78, 0.94, r2) * (1.0 - smoothstep(0.94, 1.00, r2));
        col += vec3(1.00, 0.72, 0.16) * chromo * 0.75;

        // ── Rim emission — corona bloom trigger, no ld ────────────────────
        // Rim: orange glow at the edge
        float rim   = smoothstep(0.87, 1.00, r2);
        // Spike: very thin bright ring exactly at the limb
        float spike = smoothstep(0.95, 1.00, r2);

        col += vec3(1.20, 0.28, 0.02) * rim   * 1.00;  // was 1.20 — slightly tamed
        col += vec3(1.40, 0.45, 0.06) * spike * 0.70;  // was (2.00)*0.90 — much tamer spike

        // ── Prominences ────────────────────────────────────────────────────
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

        // ── P-mode oscillation ─────────────────────────────────────────────
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

  // PLANETS
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

  planetData.forEach((p, i) => {
    const radius = p.size * sizeScale * 0.5;
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 48),
      new THREE.MeshBasicMaterial({ color: p.color })
    );
    planet.position.set(positions[i], 0, 0);
    planetGroup.add(planet);

    if (i === 5) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * 1.1, radius * 1.6, 96),
        new THREE.MeshBasicMaterial({
          color: 0xb09878, side: THREE.DoubleSide, transparent: true, opacity: 0.9
        })
      );
      ring.rotation.x = Math.PI / 2.7;
      ring.rotation.z = -0.12;
      planet.add(ring);
    }
  });
}

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

updateCamera();
buildScene();

function animate() {
  requestAnimationFrame(animate);
  if (sunShader) sunShader.uniforms.time.value += 0.01;
  composer.render();
}
animate();