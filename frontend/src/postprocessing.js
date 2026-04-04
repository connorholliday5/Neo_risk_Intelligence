import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { EffectComposer } from "https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/UnrealBloomPass.js";

export function setupPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.6,   // strength — strong but not overpowering
    0.38,  // radius — tight: glow spreads outward into space, not back over the surface
    0.82   // threshold — Saturn (lum ~0.70) stays dark, sun rim exceeds this
  );

  composer.addPass(bloomPass);
  return composer;
}