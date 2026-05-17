import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

/**
 * Build a Hosek-Wilkie atmospheric Sky and a directional light placed
 * at the sun's position. Returns { sky, sun, setSunAngle }.
 */
export function buildSky(opts = {}) {
  const sky = new Sky();
  sky.scale.setScalar(800);

  const u = sky.material.uniforms;
  u.turbidity.value = opts.turbidity ?? 6;
  u.rayleigh.value = opts.rayleigh ?? 2;
  u.mieCoefficient.value = opts.mieCoefficient ?? 0.005;
  u.mieDirectionalG.value = opts.mieDirectionalG ?? 0.8;

  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 300;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.02;

  const sunPos = new THREE.Vector3();
  function setSunAngle(elevationDeg = 35, azimuthDeg = 130) {
    const phi = THREE.MathUtils.degToRad(90 - elevationDeg);
    const theta = THREE.MathUtils.degToRad(azimuthDeg);
    sunPos.setFromSphericalCoords(1, phi, theta);
    u.sunPosition.value.copy(sunPos);
    sun.position.copy(sunPos).multiplyScalar(120);
    sun.target.position.set(0, 0, 0);
  }
  setSunAngle(opts.elevation ?? 35, opts.azimuth ?? 130);

  return { sky, sun, setSunAngle };
}
