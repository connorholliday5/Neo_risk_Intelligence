import * as THREE from "three";
import axios from "axios";

const SCALE = 20;

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
const light = new THREE.PointLight(0xffffff,2);
scene.add(light);

// Objects container
const objects = {};

// Planet info
const PLANETS = [
  {name:"sun", color:0xffff00, size:2},
  {name:"mercury", color:0x888888, size:0.3},
  {name:"venus", color:0xff8800, size:0.5},
  {name:"earth", color:0x2233ff, size:0.6},
  {name:"mars", color:0xff2200, size:0.5},
  {name:"jupiter", color:0xffaa33, size:1},
  {name:"saturn", color:0xffdd55, size:0.9},
  {name:"uranus", color:0x88ccff, size:0.7},
  {name:"neptune", color:0x4444ff, size:0.7}
];

// Create planet meshes
PLANETS.forEach(p=>{
  const geo = new THREE.SphereGeometry(p.size,32,32);
  const mat = new THREE.MeshStandardMaterial({color:p.color});
  const mesh = new THREE.Mesh(geo,mat);
  scene.add(mesh);
  objects[p.name] = mesh;
});

// Create ISS mesh
const issGeo = new THREE.SphereGeometry(0.2,16,16);
const issMat = new THREE.MeshStandardMaterial({color:0xff0000});
const iss = new THREE.Mesh(issGeo, issMat);
scene.add(iss);
objects["iss"] = iss;

// Fetch scene and update positions
async function updateScene(page="solar"){
  try{
    const res = await axios.get(`http://127.0.0.1:8000/scene/${page}`);
    const data = res.data;

    // Center
    let cx=0, cy=0, cz=0;
    if(data.bodies){
      data.bodies.forEach(b=>{cx+=b.position[0]; cy+=b.position[1]; cz+=b.position[2];});
      const n=data.bodies.length;
      cx/=n; cy/=n; cz/=n;

      // Planets
      data.bodies.forEach(b=>{
        if(objects[b.name]){
          objects[b.name].position.set(
            (b.position[0]-cx)*SCALE,
            (b.position[1]-cy)*SCALE,
            (b.position[2]-cz)*SCALE
          );
        }
      });
    }

    // ISS
    if(data.iss && objects["iss"]){
      objects["iss"].position.set(
        (data.iss.position[0]-cx)*SCALE,
        (data.iss.position[1]-cy)*SCALE,
        (data.iss.position[2]-cz)*SCALE
      );
    }

    // NEOs
    if(data.neos){
      data.neos.forEach(n=>{
        if(!objects[n.name]){
          const geo = new THREE.SphereGeometry(0.1,8,8);
          const mat = new THREE.MeshStandardMaterial({color:0xff00ff});
          const mesh = new THREE.Mesh(geo,mat);
          scene.add(mesh);
          objects[n.name] = mesh;
        }
        objects[n.name].position.set(
          (n.position[0]-cx)*SCALE,
          (n.position[1]-cy)*SCALE,
          (n.position[2]-cz)*SCALE
        );
      });
    }

  }catch(err){console.error(err);}
}

// Camera
camera.position.set(0,-60,30);
camera.lookAt(0,0,0);

// Animate
function animate(){
  requestAnimationFrame(animate);
  updateScene();
  renderer.render(scene,camera);
}

animate();
