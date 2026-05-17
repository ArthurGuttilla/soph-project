import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeMaterials } from './materials.js';
import { buildUnderground, buildGround, LAYOUT } from './geometry.js';
import { FPController } from './controls.js';

// ---------- Renderer ----------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({
  antialias: false,         // we use SMAA in post
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.Fog(0x141210, 30, 110);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 600);
camera.position.set(LAYOUT.spawn.x, LAYOUT.spawn.y, LAYOUT.spawn.z);

// HDR-ish environment (RoomEnvironment is procedural, built-in)
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new RoomEnvironment(renderer);
const envTexture = pmrem.fromScene(envScene, 0.04).texture;
scene.environment = envTexture;

// ---------- Build levels ----------
const materials = makeMaterials();
const undergroundGroup = buildUnderground(materials);
const groundGroup = buildGround(materials);
scene.add(undergroundGroup);
scene.add(groundGroup);

// ---------- Lights ----------
// Underground warm interior ambient
const ambient = new THREE.AmbientLight(0xffe8d0, 0.55);
scene.add(ambient);

// Park sun
const sun = new THREE.DirectionalLight(0xfff4e0, 1.6);
sun.position.set(60, 100, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 250;
sun.shadow.bias = -0.0003;
scene.add(sun);
scene.add(sun.target);

// Warm point fill in underground (overall lift)
const fillLight = new THREE.PointLight(0xffc88a, 0.4, 60, 1.4);
fillLight.position.set(0, 3.5, 0);
scene.add(fillLight);

// ---------- Level switching ----------
let currentLevel = 'underground';

function setLevel(level) {
  currentLevel = level;
  if (level === 'underground') {
    undergroundGroup.visible = true;
    groundGroup.visible = false;
    scene.background = new THREE.Color(0x141210);
    scene.fog = new THREE.Fog(0x1d1815, 30, 90);
    ambient.intensity = 0.55;
    ambient.color.setHex(0xffe8d0);
    fillLight.visible = true;
    sun.visible = false;
    renderer.toneMappingExposure = 1.05;
    bloomPass.strength = 0.6;
  } else {
    undergroundGroup.visible = false;
    groundGroup.visible = true;
    scene.background = new THREE.Color(0xb6cad8);
    scene.fog = new THREE.Fog(0xb6cad8, 80, 280);
    ambient.intensity = 0.9;
    ambient.color.setHex(0xffffff);
    fillLight.visible = false;
    sun.visible = true;
    renderer.toneMappingExposure = 1.0;
    bloomPass.strength = 0.25;
  }
  document.getElementById('levelIndicator').textContent =
    level === 'underground' ? 'Underground' : 'Ground · Park';
}

// ---------- Post-processing ----------
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(window.innerWidth, window.innerHeight);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.6,    // strength
  0.7,    // radius
  0.85    // threshold
);
composer.addPass(bloomPass);

const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
composer.addPass(smaaPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

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
    // Spawn near the top of the access hill so they can see the park
    camera.position.set(LAYOUT.stair.x + 12, LAYOUT.hills[0].height + 1.7, LAYOUT.stair.z + 12);
    controller.floorY = LAYOUT.hills[0].height;
  }
}
spawn('underground');

controller.onInteract = () => {
  const p = camera.position;
  const d = Math.hypot(p.x - LAYOUT.stair.x, p.z - LAYOUT.stair.z);
  if (d < 5.0) spawn(currentLevel === 'underground' ? 'ground' : 'underground');
};

// Start screen
const startScreen = document.getElementById('startScreen');
startScreen.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  controller.lock();
});

// ---------- Room label by proximity ----------
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

// ---------- Minimap ----------
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
    // Room zones
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
    // Skylights as small dots
    LAYOUT.skylights.forEach(s => {
      const [sx, sz] = toCanvas(s.x, s.z);
      mctx.fillStyle = 'rgba(180,210,255,0.7)';
      mctx.beginPath();
      mctx.ellipse(sx, sz, s.rx * scale * 0.5, s.rz * scale * 0.5, s.rot, 0, Math.PI * 2);
      mctx.fill();
    });
  } else {
    // Hills
    mctx.fillStyle = 'rgba(120,170,90,0.55)';
    LAYOUT.hills.forEach(h => {
      const [cx, cz] = toCanvas(h.x, h.z);
      mctx.beginPath();
      mctx.arc(cx, cz, h.radius * scale, 0, Math.PI * 2);
      mctx.fill();
    });
    // Skylights
    LAYOUT.skylights.forEach(s => {
      const [sx, sz] = toCanvas(s.x, s.z);
      mctx.fillStyle = 'rgba(220,235,255,0.85)';
      mctx.beginPath();
      mctx.ellipse(sx, sz, s.rx * scale * 0.6, s.rz * scale * 0.6, s.rot, 0, Math.PI * 2);
      mctx.fill();
    });
  }

  // Stair indicator
  const [stx, stz] = toCanvas(LAYOUT.stair.x, LAYOUT.stair.z);
  mctx.fillStyle = '#ffd180';
  mctx.beginPath();
  mctx.arc(stx, stz, 5, 0, Math.PI * 2);
  mctx.fill();

  // Player
  const [px, pz] = toCanvas(camera.position.x, camera.position.z);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const ang = Math.atan2(dir.z, dir.x);
  mctx.save();
  mctx.translate(px, pz);
  mctx.rotate(ang);
  mctx.fillStyle = '#ff5c5c';
  mctx.beginPath();
  mctx.moveTo(8, 0);
  mctx.lineTo(-5, 5);
  mctx.lineTo(-5, -5);
  mctx.closePath();
  mctx.fill();
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
