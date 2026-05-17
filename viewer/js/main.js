import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  EffectComposer, RenderPass, EffectPass,
  BloomEffect, SMAAEffect, VignetteEffect,
  KernelSize,
} from 'postprocessing';
import { makeMaterials } from './materials.js';
import { buildUnderground, buildGround, attachWaterFeatures, LAYOUT } from './geometry.js';
import { FPController } from './controls.js';
import { manager, loadHDR, loadDataTexture, onProgress } from './assets.js';
import { buildSky } from './sky.js';

// ---------- Loader UI ----------
const startScreen = document.getElementById('startScreen');
const ctaButton = document.getElementById('ctaButton');
const loadBarFill = document.querySelector('#loadBar > div');
const loadLabel = document.getElementById('loadLabel');
let assetsReady = false;
function markReady() {
  if (assetsReady) return;
  assetsReady = true;
  loadBarFill.style.width = '100%';
  loadLabel.textContent = 'Ready';
  ctaButton.textContent = 'Click to Enter';
  startScreen.classList.add('ready');
}
onProgress((loaded, total, url) => {
  const pct = total > 0 ? (loaded / total) : 0;
  loadBarFill.style.width = `${Math.min(100, pct * 100)}%`;
  const name = url.split('/').pop().split('?')[0];
  loadLabel.textContent = `Loading ${name}`;
});
manager.onLoad = () => markReady();
manager.onError = (url) => { console.warn('Failed to load', url); };
// Safety net: if assets stall (slow network, blocked CDN), let the user
// enter anyway after 8 s. Procedural fallbacks fill the gaps.
setTimeout(() => {
  if (!assetsReady) {
    console.warn('Asset loading timeout — entering with available assets.');
    markReady();
  }
}, 8000);

// ---------- Renderer ----------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: 'high-performance',
  stencil: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

// ---------- Scene + camera ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141210);
scene.fog = new THREE.Fog(0x1d1815, 30, 90);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.05, 800);
camera.position.set(LAYOUT.spawn.x, LAYOUT.spawn.y, LAYOUT.spawn.z);

// ---------- Environment lighting (HDR + RoomEnvironment fallback) ----------
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

// Procedural interior IBL — used for the underground
const interiorEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
let exteriorEnv = interiorEnv;  // overwritten when the HDR loads

loadHDR('hdr/royal_esplanade_1k.hdr').then((hdr) => {
  if (!hdr) return;
  exteriorEnv = pmrem.fromEquirectangular(hdr).texture;
  hdr.dispose();
  if (currentLevel === 'ground') scene.environment = exteriorEnv;
});

// ---------- Sky + sun ----------
const { sky, sun, setSunAngle } = buildSky({
  elevation: 32, azimuth: 145, turbidity: 5, rayleigh: 2,
});
scene.add(sun);
scene.add(sun.target);

// ---------- Lights ----------
const ambient = new THREE.AmbientLight(0xffe8d0, 0.55);
scene.add(ambient);

const fillLight = new THREE.PointLight(0xffc88a, 0.4, 60, 1.4);
fillLight.position.set(0, 3.5, 0);
scene.add(fillLight);

// ---------- Water normals (for Three.js Water shader) ----------
let waterNormals = null;
loadDataTexture('normals/waternormals.jpg', { repeat: [1, 1] }).then((tex) => {
  waterNormals = tex;
  if (tex) attachWaterFeatures(groundGroup, undergroundGroup, waterNormals, sun);
});

// ---------- Build levels (async — materials need awaited loaders) ----------
let undergroundGroup, groundGroup, currentLevel = 'underground';

(async () => {
  const materials = await makeMaterials();
  undergroundGroup = buildUnderground(materials);
  groundGroup = buildGround(materials);
  groundGroup.add(sky);
  scene.add(undergroundGroup);
  scene.add(groundGroup);
  if (waterNormals) attachWaterFeatures(groundGroup, undergroundGroup, waterNormals, sun);
  spawn('underground');
})();

// ---------- Post-processing ----------
// Bloom + vignette + SMAA. SSAO was removed because the postprocessing
// v6.39 NormalPass + DepthDownsamplingPass combo emits GL framebuffer
// blit errors on some drivers (depth/stencil sharing) that break the
// whole render pipeline on certain GPUs.
const composer = new EffectComposer(renderer, {
  frameBufferType: THREE.HalfFloatType,
});
composer.addPass(new RenderPass(scene, camera));

const bloomEffect = new BloomEffect({
  intensity: 0.55,
  luminanceThreshold: 0.75,
  luminanceSmoothing: 0.2,
  mipmapBlur: true,
  kernelSize: KernelSize.LARGE,
});
const vignetteEffect = new VignetteEffect({ offset: 0.35, darkness: 0.55 });
const smaaEffect = new SMAAEffect();

composer.addPass(new EffectPass(camera, bloomEffect, vignetteEffect, smaaEffect));

// ---------- Level switching ----------
function setLevel(level) {
  currentLevel = level;
  if (level === 'underground') {
    if (undergroundGroup) undergroundGroup.visible = true;
    if (groundGroup) groundGroup.visible = false;
    scene.background = new THREE.Color(0x141210);
    scene.fog = new THREE.Fog(0x1d1815, 30, 90);
    scene.environment = interiorEnv;
    ambient.intensity = 0.55;
    ambient.color.setHex(0xffe8d0);
    fillLight.visible = true;
    sun.visible = false;
    renderer.toneMappingExposure = 1.1;
    bloomEffect.intensity = 0.55;
  } else {
    if (undergroundGroup) undergroundGroup.visible = false;
    if (groundGroup) groundGroup.visible = true;
    scene.background = null;  // sky dome handles it
    scene.fog = new THREE.Fog(0xb6cad8, 90, 320);
    scene.environment = exteriorEnv;
    ambient.intensity = 0.55;
    ambient.color.setHex(0xffffff);
    fillLight.visible = false;
    sun.visible = true;
    renderer.toneMappingExposure = 0.95;
    bloomEffect.intensity = 0.25;
  }
  document.getElementById('levelIndicator').textContent =
    level === 'underground' ? 'Underground' : 'Ground · Park';
}

// ---------- Resize ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Controls ----------
const collidables = [];
function refreshCollidables() {
  collidables.length = 0;
  const group = currentLevel === 'underground' ? undergroundGroup : groundGroup;
  if (!group) return;
  group.traverse(obj => {
    if (obj.isMesh && obj.userData.collidable) collidables.push(obj);
  });
}
const controller = new FPController(camera, renderer.domElement, () => collidables);

function spawn(level) {
  setLevel(level);
  refreshCollidables();
  if (level === 'underground') {
    camera.position.set(LAYOUT.spawn.x, 1.65, LAYOUT.spawn.z);
    controller.floorY = 0;
  } else {
    const h = LAYOUT.hills[0];
    camera.position.set(h.x + h.radius + 6, 1.65, h.z + 2);
    controller.floorY = 0;
  }
}

controller.onInteract = () => {
  const p = camera.position;
  const d = Math.hypot(p.x - LAYOUT.stair.x, p.z - LAYOUT.stair.z);
  if (d < 5.0) spawn(currentLevel === 'underground' ? 'ground' : 'underground');
};

// Start screen click handler
startScreen.addEventListener('click', () => {
  if (!assetsReady) return;
  startScreen.classList.add('hidden');
  controller.lock();
});

// ---------- Room label + minimap ----------
const roomLabel = document.getElementById('roomLabel');
const prompt = document.getElementById('prompt');

function currentRoom() {
  if (currentLevel !== 'underground') return null;
  const p = camera.position;
  for (const r of LAYOUT.rooms) {
    if (p.x > r.cx - r.w/2 && p.x < r.cx + r.w/2 &&
        p.z > r.cz - r.d/2 && p.z < r.cz + r.d/2) {
      return r;
    }
  }
  return null;
}

const minimap = document.getElementById('minimap');
const mctx = minimap.getContext('2d');

function drawMinimap() {
  const B = LAYOUT.bounds;
  const W = B.maxX - B.minX;
  const D = B.maxZ - B.minZ;
  const cw = minimap.width;
  const ch = minimap.height;
  const pad = 18;
  const scale = Math.min((cw - pad * 2) / W, (ch - pad * 2) / D);
  mctx.clearRect(0, 0, cw, ch);
  mctx.fillStyle = 'rgba(20,20,22,0.85)';
  mctx.fillRect(0, 0, cw, ch);
  const toCanvas = (x, z) => [pad + (x - B.minX) * scale, pad + (z - B.minZ) * scale];

  if (currentLevel === 'underground') {
    mctx.lineWidth = 1.2;
    LAYOUT.rooms.forEach(r => {
      const [x0, z0] = toCanvas(r.cx - r.w/2, r.cz - r.d/2);
      mctx.fillStyle = 'rgba(200,180,140,0.18)';
      mctx.strokeStyle = 'rgba(255,255,255,0.45)';
      mctx.fillRect(x0, z0, r.w * scale, r.d * scale);
      mctx.strokeRect(x0, z0, r.w * scale, r.d * scale);
      const [tx, tz] = toCanvas(r.cx, r.cz);
      mctx.fillStyle = 'rgba(255,255,255,0.85)';
      mctx.font = '13px sans-serif';
      mctx.textAlign = 'center';
      mctx.textBaseline = 'middle';
      mctx.fillText(String(r.n), tx, tz);
    });
    LAYOUT.skylights.forEach(s => {
      const [sx, sz] = toCanvas(s.x, s.z);
      mctx.fillStyle = 'rgba(180,210,255,0.7)';
      mctx.beginPath();
      mctx.ellipse(sx, sz, s.rx * scale * 0.5, s.rz * scale * 0.5, s.rot, 0, Math.PI * 2);
      mctx.fill();
    });
  } else {
    mctx.fillStyle = 'rgba(120,170,90,0.55)';
    LAYOUT.hills.forEach(h => {
      const [cx, cz] = toCanvas(h.x, h.z);
      mctx.beginPath();
      mctx.arc(cx, cz, h.radius * scale, 0, Math.PI * 2);
      mctx.fill();
    });
    LAYOUT.skylights.forEach(s => {
      const [sx, sz] = toCanvas(s.x, s.z);
      mctx.fillStyle = 'rgba(220,235,255,0.85)';
      mctx.beginPath();
      mctx.ellipse(sx, sz, s.rx * scale * 0.6, s.rz * scale * 0.6, s.rot, 0, Math.PI * 2);
      mctx.fill();
    });
  }
  const [stx, stz] = toCanvas(LAYOUT.stair.x, LAYOUT.stair.z);
  mctx.fillStyle = '#ffd180';
  mctx.beginPath(); mctx.arc(stx, stz, 5, 0, Math.PI * 2); mctx.fill();
  const [px, pz] = toCanvas(camera.position.x, camera.position.z);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const ang = Math.atan2(dir.z, dir.x);
  mctx.save();
  mctx.translate(px, pz);
  mctx.rotate(ang);
  mctx.fillStyle = '#ff5c5c';
  mctx.beginPath();
  mctx.moveTo(8, 0); mctx.lineTo(-5, 5); mctx.lineTo(-5, -5);
  mctx.closePath(); mctx.fill();
  mctx.restore();
}

// ---------- Animation loop ----------
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  controller.update(dt);

  const r = currentRoom();
  roomLabel.textContent = currentLevel === 'underground'
    ? (r ? `${r.n}. ${r.label}` : 'The Inner Center')
    : 'The Park · Ground Floor';

  const dx = camera.position.x - LAYOUT.stair.x;
  const dz = camera.position.z - LAYOUT.stair.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 5.0 && controller.controls.isLocked) {
    prompt.classList.add('visible');
    prompt.innerHTML = currentLevel === 'underground'
      ? 'Press <b>E</b> to go up to the park'
      : 'Press <b>E</b> to descend into The Inner Center';
  } else {
    prompt.classList.remove('visible');
  }

  drawMinimap();
  composer.render();
}
animate();
