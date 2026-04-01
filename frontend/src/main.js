import * as THREE from "three";

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light (Sun simulation)
const light = new THREE.PointLight(0xffffff, 2);
scene.add(light);

// Sun
const sunGeo = new THREE.SphereGeometry(2, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// Earth (test)
const earthGeo = new THREE.SphereGeometry(0.5, 32, 32);
const earthMat = new THREE.MeshStandardMaterial({ color: 0x2233ff });
const earth = new THREE.Mesh(earthGeo, earthMat);
earth.position.x = 5;
scene.add(earth);

// Camera position
camera.position.z = 15;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  earth.position.x = 5 * Math.cos(Date.now() * 0.001);
  earth.position.z = 5 * Math.sin(Date.now() * 0.001);

  renderer.render(scene, camera);
}

animate();
