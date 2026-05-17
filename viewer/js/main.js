import * as THREE from 'three';
import { makeMaterials } from './materials.js';
import { buildUnderground, buildGround, LAYOUT } from './geometry.js';
import { FPController } from './controls.js';

// ---------- Scene setup ----------
const app = document.getElementById('app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.Fog(0x111111, 40, 120);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(LAYOUT.spawn.x, LAYOUT.spawn.y, LAYOUT.spawn.z);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
app.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Build levels ----------
const materials = makeMaterials();
const undergroundGroup = buildUnderground(materials);
const groundGroup = buildGround(materials);

scene.add(undergroundGroup);
scene.add(groundGroup);

// Level switching
let currentLevel = 'underground';

function setLevel(level) {
  currentLevel = level;
  if (level === 'underground') {
    undergroundGroup.visible = true;
    groundGroup.visible = false;
    scene.background = new THREE.Color(0x161412);
    scene.fog = new THREE.Fog(0x1d1815, 30, 90);
    // Warm interior lights
    ambient.intensity = 0.45;
    ambient.color.setHex(0xffe0bf);
    sun.visible = false;
  } else {
    undergroundGroup.visible = false;
    groundGroup.visible = true;
    scene.background = new THREE.Color(0xb6cad8);
    scene.fog = new THREE.Fog(0xb6cad8, 60, 200);
    ambient.intensity = 0.75;
    ambient.color.setHex(0xffffff);
    sun.visible = true;
  }
  document.getElementById('levelIndicator').textContent =
    level === 'underground' ? 'Underground' : 'Ground · Park';
}

// ---------- Lighting ----------
const ambient = new THREE.AmbientLight(0xffe0bf, 0.45);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
sun.position.set(40, 80, 30);
scene.add(sun);

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

// Spawn point logic
function spawn(level) {
  setLevel(level);
  refreshCollidables();
  if (level === 'underground') {
    camera.position.set(LAYOUT.spawn.x, 1.65, LAYOUT.spawn.z);
    controller.floorY = 0;
  } else {
    // Spawn on top of the access hill so the player can look out
    camera.position.set(LAYOUT.stair.x + 8, 1.65, LAYOUT.stair.z + 8);
    controller.floorY = 0;
  }
}
spawn('underground');

// Interaction: stair triggers
controller.onInteract = () => {
  const p = camera.position;
  const dx = p.x - LAYOUT.stair.x;
  const dz = p.z - LAYOUT.stair.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 4.0) {
    spawn(currentLevel === 'underground' ? 'ground' : 'underground');
  }
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
  const pad = 16;
  const scale = Math.min((cw - pad * 2) / W, (ch - pad * 2) / D);

  mctx.clearRect(0, 0, cw, ch);
  // Background
  mctx.fillStyle = 'rgba(20,20,20,0.85)';
  mctx.fillRect(0, 0, cw, ch);

  const toCanvas = (x, z) => [
    pad + (x - B.minX) * scale,
    pad + (z - B.minZ) * scale,
  ];

  if (currentLevel === 'underground') {
    // Rooms
    mctx.strokeStyle = 'rgba(255,255,255,0.55)';
    mctx.fillStyle = 'rgba(200,180,150,0.18)';
    mctx.lineWidth = 1.5;
    LAYOUT.rooms.forEach(r => {
      const [x0, z0] = toCanvas(r.cx - r.w/2, r.cz - r.d/2);
      mctx.fillRect(x0, z0, r.w * scale, r.d * scale);
      mctx.strokeRect(x0, z0, r.w * scale, r.d * scale);
      // number
      const [tx, tz] = toCanvas(r.cx, r.cz);
      mctx.fillStyle = 'rgba(255,255,255,0.85)';
      mctx.font = '14px sans-serif';
      mctx.textAlign = 'center';
      mctx.textBaseline = 'middle';
      mctx.fillText(String(r.n), tx, tz);
      mctx.fillStyle = 'rgba(200,180,150,0.18)';
    });
    // Stair
    const [sx, sz] = toCanvas(LAYOUT.stair.x, LAYOUT.stair.z);
    mctx.fillStyle = '#ffd180';
    mctx.beginPath();
    mctx.arc(sx, sz, 5, 0, Math.PI * 2);
    mctx.fill();
  } else {
    // Ground: hills as circles
    mctx.fillStyle = 'rgba(120,160,100,0.5)';
    const drawHill = (x, z, r) => {
      const [cx, cz] = toCanvas(x, z);
      mctx.beginPath();
      mctx.arc(cx, cz, r * scale, 0, Math.PI * 2);
      mctx.fill();
    };
    drawHill(LAYOUT.stair.x, LAYOUT.stair.z, 10);
    drawHill(-28, -18, 6);
    drawHill( 28, -22, 6);
    drawHill(-30,  18, 6);
    drawHill( 30,  20, 6);
    // Stair portal
    const [sx, sz] = toCanvas(LAYOUT.stair.x, LAYOUT.stair.z);
    mctx.fillStyle = '#ffd180';
    mctx.beginPath();
    mctx.arc(sx, sz, 5, 0, Math.PI * 2);
    mctx.fill();
  }

  // Player
  const [px, pz] = toCanvas(camera.position.x, camera.position.z);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const ang = Math.atan2(dir.z, dir.x);
  mctx.save();
  mctx.translate(px, pz);
  mctx.rotate(ang);
  mctx.fillStyle = '#ff5252';
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

  // Label update
  const r = currentRoom();
  if (currentLevel === 'underground') {
    roomLabel.textContent = r ? `${r.n}. ${r.label}` : 'The Inner Center';
  } else {
    roomLabel.textContent = 'The Park · Ground Floor';
  }

  // Stair proximity prompt
  const dx = camera.position.x - LAYOUT.stair.x;
  const dz = camera.position.z - LAYOUT.stair.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 4.0 && controller.controls.isLocked) {
    prompt.classList.add('visible');
    prompt.innerHTML = currentLevel === 'underground'
      ? 'Press <b>E</b> to go up to the park'
      : 'Press <b>E</b> to descend into The Inner Center';
  } else {
    prompt.classList.remove('visible');
  }

  drawMinimap();
  renderer.render(scene, camera);
}
animate();
