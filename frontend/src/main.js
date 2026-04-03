import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

/* =========================
   SCENE / CAMERA / RENDERER
   ========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.innerHTML = "";
document.body.appendChild(renderer.domElement);

const FRUSTUM_HEIGHT = 40;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  (-FRUSTUM_HEIGHT * aspect) / 2,
  ( FRUSTUM_HEIGHT * aspect) / 2,
   FRUSTUM_HEIGHT / 2,
  -FRUSTUM_HEIGHT / 2,
  0.1,
  1000
);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

/* =========
   STARFIELD
   ========= */
const starGeometry = new THREE.BufferGeometry();
const starVerts = [];
for (let i = 0; i < 3500; i++) {
  starVerts.push(
    (Math.random() - 0.5) * 400,
    (Math.random() - 0.5) * 200,
    -50 - Math.random() * 200
  );
}
starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: false })
);
scene.add(stars);

/* =========
   LIGHTING
   ========= */
scene.add(new THREE.AmbientLight(0xffffff, 0.2));
const sunLight = new THREE.PointLight(0xffffff, 3.0, 1000);
scene.add(sunLight);

/* ======
   GROUPS
   ====== */
const systemGroup = new THREE.Group();
scene.add(systemGroup);

const planetGroup = new THREE.Group();
systemGroup.add(planetGroup);

/* ============
   SUN SHADER
   ============ */
const sunShader = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 }
  },
  vertexShader: `
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    varying vec3 vPos;

    void main() {

      vec2 uv = vPos.xy * 0.12;

      // NON-REPEATING TURBULENCE
      float n1 = sin(uv.x * 2.3 + uv.y * 1.7 + time * 0.12);
      float n2 = sin(uv.x * 4.7 - uv.y * 2.9 - time * 0.09);
      float n3 = sin(uv.x * 9.1 + uv.y * 3.3 + time * 0.05);

      float g = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
      g = g * 0.5 + 0.5;

      g = smoothstep(0.2, 0.8, g);
      g = pow(g, 1.8);

      float plasma = sin(uv.x * 1.5 + time * 0.08) * sin(uv.y * 1.2);
      plasma = plasma * 0.5 + 0.5;

      g = mix(g, plasma, 0.25);

      // COLOR (RED-ORANGE, NOT WHITE)
      vec3 deep = vec3(0.7, 0.18, 0.05);
      vec3 mid  = vec3(1.0, 0.35, 0.08);
      vec3 hot  = vec3(1.0, 0.55, 0.18);

      vec3 color = mix(deep, mid, g);
      color = mix(color, hot, g * 0.35);

      // slight limb darkening
      float edge = length(vPos.xy) / 8.0;
      color *= mix(1.0, 0.75, edge);

      gl_FragColor = vec4(color, 1.0);
    }
  `
});

/* =========
   PLANETS
   ========= */
const planetData = [
  { name: "mercury", color: 0xb8b8b8, size: 0.45 },
  { name: "venus",   color: 0xe9c07a, size: 0.75 },
  { name: "earth",   color: 0x4aa3ff, size: 0.85 },
  { name: "mars",    color: 0xff6a4a, size: 0.65 },
  { name: "jupiter", color: 0xe8a98a, size: 1.55 },
  { name: "saturn",  color: 0xead0a6, size: 1.35 },
  { name: "uranus",  color: 0x9ad7f7, size: 1.15 },
  { name: "neptune", color: 0x3d7cff, size: 1.15 }
];

/* =========
   BUILD SCENE
   ========= */
let sun;

function buildScene() {

  // CLEAR
  while (systemGroup.children.length) {
    systemGroup.remove(systemGroup.children[0]);
  }
  systemGroup.add(planetGroup);
  while (planetGroup.children.length) {
    planetGroup.remove(planetGroup.children[0]);
  }

  const viewWidth = camera.right - camera.left;
  const viewHeight = camera.top - camera.bottom;
  const left = camera.left;

  // SUN (placement unchanged)
  const sunRadius = viewHeight * 0.20;
  sun = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius, 128, 128),
    sunShader
  );

  sun.position.set(left - sunRadius * 0.22, 0, 0);
  systemGroup.add(sun);

  // light follows sun
  sunLight.position.copy(sun.position);

  // spacing (unchanged logic)
  const sizeScale = viewHeight * 0.085;
  let currentX = sun.position.x + sunRadius * 0.7;

  planetData.forEach((p, i) => {
    const radius = p.size * sizeScale * 0.5;

    if (i !== 0) {
      currentX += radius * 3.2; // spread others, keep first tight
    }

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 48),
      new THREE.MeshStandardMaterial({ color: p.color })
    );

    planet.position.set(currentX, 0, 0);
    planetGroup.add(planet);

    // SATURN RINGS
    if (p.name === "saturn") {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * 1.15, radius * 1.8, 96),
        new THREE.MeshBasicMaterial({
          color: 0xcdbb97,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        })
      );
      ring.rotation.x = Math.PI / 2.6;
      ring.rotation.z = -0.18;
      planet.add(ring);
    }

    currentX += radius * 2.5;
  });
}

/* =========
   RESIZE
   ========= */
function updateCamera() {
  const aspectNow = window.innerWidth / window.innerHeight;
  camera.left = (-FRUSTUM_HEIGHT * aspectNow) / 2;
  camera.right = ( FRUSTUM_HEIGHT * aspectNow) / 2;
  camera.top = FRUSTUM_HEIGHT / 2;
  camera.bottom = -FRUSTUM_HEIGHT / 2;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateCamera();
  buildScene();
});

/* =========
   INIT
   ========= */
updateCamera();
buildScene();

/* =========
   ANIMATE
   ========= */
function animate() {
  requestAnimationFrame(animate);

  sunShader.uniforms.time.value += 0.002;

  renderer.render(scene, camera);
}
animate();
