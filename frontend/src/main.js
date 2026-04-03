import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.innerHTML = "";
document.body.appendChild(renderer.domElement);

// CAMERA
const FRUSTUM_HEIGHT = 40;
let aspect = window.innerWidth / window.innerHeight;

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

// STARFIELD
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
scene.add(
  new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: false })
  )
);

// LIGHT
scene.add(new THREE.AmbientLight(0xffffff, 1));

// GROUPS
const systemGroup = new THREE.Group();
scene.add(systemGroup);

const planetGroup = new THREE.Group();
systemGroup.add(planetGroup);

// PLANET DATA
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

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  }
}

function createBelt(startX, endX, count, spreadY, size, opacity) {
  const geometry = new THREE.BufferGeometry();
  const verts = [];

  for (let i = 0; i < count; i++) {
    verts.push(
      startX + Math.random() * (endX - startX),
      (Math.random() - 0.5) * spreadY,
      (Math.random() - 0.5) * 1.2
    );
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size,
      transparent: true,
      opacity
    })
  );
}

let sunShader = null;
let sun = null;
let sunGlow = null;
let asteroidBelt = null;
let kuiperBelt = null;

function buildScene() {
  clearGroup(systemGroup);
  systemGroup.add(planetGroup);
  clearGroup(planetGroup);

  const viewWidth = camera.right - camera.left;
  const viewHeight = camera.top - camera.bottom;
  const left = camera.left;

  const sunRadius = viewHeight * 0.34;

  // SUN
  sunShader = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
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

      float hash(vec2 p){
        return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
      }

      void main() {
        vec2 uv = vPos.xy * 0.18;

        float n1 = hash(uv * 1.6 + time * 0.020);
        float n2 = hash(uv * 3.4 - time * 0.014);
        float n3 = hash(uv * 7.2 + time * 0.008);

        float g = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
        g = smoothstep(0.22, 0.82, g);
        g = pow(g, 1.9);

        vec3 deep = vec3(0.62, 0.12, 0.05);
        vec3 mid  = vec3(0.90, 0.28, 0.10);
        vec3 hot  = vec3(0.98, 0.46, 0.18);

        vec3 col = mix(deep, mid, g);
        col = mix(col, hot, g * 0.28);

        float edge = length(vPos.xy) / ${sunRadius.toFixed(2)};
        col *= mix(1.0, 0.72, edge);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  sun = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius, 128, 128),
    sunShader
  );

  // IMPORTANT: no Y stretch, keep sun round
  sun.position.set(left - sunRadius * 0.42, 0, 0);
  systemGroup.add(sun);

  sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius * 1.08, 96, 96),
    new THREE.MeshBasicMaterial({
      color: 0xff5a1f,
      transparent: true,
      opacity: 0.06
    })
  );
  sunGlow.position.copy(sun.position);
  systemGroup.add(sunGlow);

  // PLANET SPACING
  const usableRight = camera.right - viewWidth * 0.07;
  const mercuryX = sun.position.x + sunRadius + 4.2;
  const neptuneX = usableRight - 3.2;
  const step = (neptuneX - mercuryX) / 7.0;

  const positions = [
    mercuryX,
    mercuryX + step * .75,
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

    if (p.name === "saturn") {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * 1.1, radius * 1.6, 96),
        new THREE.MeshBasicMaterial({
          color: 0xcdbb97,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        })
      );
      ring.rotation.x = Math.PI / 2.7;
      ring.rotation.z = -0.12;
      planet.add(ring);
    }
  });

  // BELTS
  asteroidBelt = createBelt(
    positions[3] + 0.8,
    positions[4] - 1.6,
    520,
    1.35,
    0.16,
    0.7
  );
  systemGroup.add(asteroidBelt);

  kuiperBelt = createBelt(
    positions[7] + 1.8,
    camera.right - 1.5,
    620,
    2.0,
    0.14,
    0.6
  );
  systemGroup.add(kuiperBelt);
}

function updateCamera() {
  aspect = window.innerWidth / window.innerHeight;
  camera.left = (-FRUSTUM_HEIGHT * aspect) / 2;
  camera.right = ( FRUSTUM_HEIGHT * aspect) / 2;
  camera.top = FRUSTUM_HEIGHT / 2;
  camera.bottom = -FRUSTUM_HEIGHT / 2;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateCamera();
  buildScene();
});

updateCamera();
buildScene();

function animate() {
  requestAnimationFrame(animate);

  if (sunShader) {
    sunShader.uniforms.time.value += 0.002;
  }

  renderer.render(scene, camera);
}

animate();
