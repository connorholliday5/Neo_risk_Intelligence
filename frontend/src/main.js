import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.innerHTML = '';
document.body.appendChild(renderer.domElement);

// CAMERA
const FRUSTUM_HEIGHT = 40;
let aspect = window.innerWidth / window.innerHeight;

const camera = new THREE.OrthographicCamera(
  (-FRUSTUM_HEIGHT * aspect) / 2,
  (FRUSTUM_HEIGHT * aspect) / 2,
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

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));

scene.add(new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: false })
));

// LIGHT
scene.add(new THREE.AmbientLight(0xffffff, 1));

// GROUPS
const systemGroup = new THREE.Group();
scene.add(systemGroup);

const planetGroup = new THREE.Group();
systemGroup.add(planetGroup);

// PLANET DATA
const planetData = [
  { name: 'mercury', color: 0xb8b8b8, size: 0.45 },
  { name: 'venus',   color: 0xe9c07a, size: 0.75 },
  { name: 'earth',   color: 0x4aa3ff, size: 0.85 },
  { name: 'mars',    color: 0xff6a4a, size: 0.65 },
  { name: 'jupiter', color: 0xe8a98a, size: 1.55 },
  { name: 'saturn',  color: 0xead0a6, size: 1.35 },
  { name: 'uranus',  color: 0x9ad7f7, size: 1.15 },
  { name: 'neptune', color: 0x3d7cff, size: 1.15 }
];

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }
}

function createBelt(startX, endX, count, spreadY) {
  const geometry = new THREE.BufferGeometry();
  const verts = [];

  for (let i = 0; i < count; i++) {
    verts.push(
      startX + Math.random() * (endX - startX),
      (Math.random() - 0.5) * spreadY,
      0
    );
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8
    })
  );
}

function buildScene() {

  clearGroup(systemGroup);
  systemGroup.add(planetGroup);
  clearGroup(planetGroup);

  const viewHeight = camera.top - camera.bottom;
  const left = camera.left;

  // SUN
  const sunRadius = viewHeight * 0.34;

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius, 96, 96),
    new THREE.MeshBasicMaterial({ color: 0xf2c552 })
  );

  sun.scale.y = 1.4;
  sun.position.set(left - sunRadius * 0.42, 0, 0);
  systemGroup.add(sun);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius * 1.2, 96, 96),
    new THREE.MeshBasicMaterial({
      color: 0xffb300,
      transparent: true,
      opacity: 0.12
    })
  );

  glow.position.copy(sun.position);
  systemGroup.add(glow);

  // PLANET POSITIONS
  const positions = [
    -16.5,
    -12.5,
    -8.5,
    -4.5,
     4,
     10,
     16,
     21
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

    if (p.name === 'saturn') {
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

  // ?? ASTEROID BELT (Mars ? Jupiter)
  const asteroidBelt = createBelt(-2, 3, 450, 1.2);
  systemGroup.add(asteroidBelt);

  // ?? KUIPER BELT (beyond Neptune)
  const kuiperBelt = createBelt(22, 34, 500, 2);
  systemGroup.add(kuiperBelt);
}

// RESIZE
function updateCamera() {
  aspect = window.innerWidth / window.innerHeight;

  camera.left = (-FRUSTUM_HEIGHT * aspect) / 2;
  camera.right = (FRUSTUM_HEIGHT * aspect) / 2;
  camera.top = FRUSTUM_HEIGHT / 2;
  camera.bottom = -FRUSTUM_HEIGHT / 2;

  camera.updateProjectionMatrix();
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateCamera();
  buildScene();
});

updateCamera();
buildScene();

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
