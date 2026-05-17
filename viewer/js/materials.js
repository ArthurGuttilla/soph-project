import * as THREE from 'three';
import { loadColorTexture, loadDataTexture } from './assets.js';

// ---------- Procedural canvas fallback textures ----------

function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function makeData(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  return tex;
}

const procWood = makeCanvas(1024, 1024, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#d0a07a'); g.addColorStop(1, '#8b5e2e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 24) {
    ctx.fillStyle = 'rgba(40,20,8,0.55)'; ctx.fillRect(x, 0, 3, h);
  }
});
const procSoft = makeCanvas(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#d8d2c8'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 12000; i++) {
    const c = 120 + Math.random() * 100;
    ctx.fillStyle = `rgba(${c},${c - 10},${c - 30},0.4)`;
    ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, 1.5, 0, Math.PI*2); ctx.fill();
  }
});
const procMarble = makeCanvas(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#f4f1ec'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(170,160,150,0.35)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 50; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random()*w, Math.random()*h);
    ctx.bezierCurveTo(Math.random()*w, Math.random()*h, Math.random()*w, Math.random()*h, Math.random()*w, Math.random()*h);
    ctx.stroke();
  }
});
const procStone = makeCanvas(2048, 2048, (ctx, w, h) => {
  ctx.fillStyle = '#3f3f42'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 25000; i++) {
    const v = 30 + Math.random() * 60;
    ctx.fillStyle = `rgba(${v},${v},${v + 5},0.55)`;
    ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, 1.2, 0, Math.PI*2); ctx.fill();
  }
  for (let x = 96; x < w; x += 128) {
    ctx.fillStyle = '#b8b8bc'; ctx.fillRect(x, 0, 4, h);
  }
});
const procWall = makeCanvas(512, 512, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#f0eee8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});
const procGrass = makeCanvas(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#6a8a4a'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 18000; i++) {
    const g = 70 + Math.random() * 80;
    ctx.fillStyle = `rgba(${g * 0.55},${g + 15},${g * 0.4},0.5)`;
    ctx.fillRect(Math.random()*w, Math.random()*h, 2, 4);
  }
});
const procFoam = makeCanvas(256, 512, (ctx, w, h) => {
  ctx.fillStyle = '#f5f3ef'; ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 6) {
    ctx.fillStyle = 'rgba(170,165,155,0.4)'; ctx.fillRect(x, 0, 1.5, h);
  }
});
const procConcrete = makeCanvas(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#b5b2ac'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 12000; i++) {
    const v = 140 + Math.random() * 60;
    ctx.fillStyle = `rgba(${v},${v - 5},${v - 10},0.35)`;
    ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, 1.3, 0, Math.PI*2); ctx.fill();
  }
  for (let x = 0; x < w; x += 200) {
    ctx.fillStyle = 'rgba(80,80,75,0.25)'; ctx.fillRect(x, 0, 2, h);
  }
});

const skyTex = makeCanvas(64, 512, (ctx, w, h) => {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.00, '#3d6a96');
  grad.addColorStop(0.35, '#74a0c4');
  grad.addColorStop(0.7,  '#bdd5e3');
  grad.addColorStop(1.0,  '#edece4');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
});

function rep(tex, x, y) {
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(x, y); return t;
}

/**
 * Load real PBR maps where available, fall back to procedural for the
 * rest. Returns a materials dictionary identical in shape to before so
 * geometry.js doesn't have to change.
 */
export async function makeMaterials() {
  // Real assets (from public/textures — Vite copies to dist root)
  const hardwoodDiffuse = await loadColorTexture('textures/hardwood_diffuse.jpg', { repeat: [12, 12] });
  const hardwoodBump    = await loadDataTexture('textures/hardwood_bump.jpg',    { repeat: [12, 12] });
  const hardwoodRough   = await loadDataTexture('textures/hardwood_roughness.jpg', { repeat: [12, 12] });
  const grassDiff       = await loadColorTexture('textures/grass.jpg',           { repeat: [20, 20] });
  const stoneDiff       = await loadColorTexture('textures/disturb.jpg',         { repeat: [16, 16] });
  const brickDiff       = await loadColorTexture('textures/brick.jpg',           { repeat: [4, 2] });
  const brickBump       = await loadDataTexture('textures/brick_bump.jpg',       { repeat: [4, 2] });
  const floorDiff       = await loadColorTexture('textures/floor_diffuse.jpg',   { repeat: [14, 14] });

  // Tinted stone for the park: layer disturb texture with stripe color in shader,
  // but pragmatically we just darken via material color.
  return {
    // Wood ceiling — use real hardwood maps if available
    ceilingWood: new THREE.MeshStandardMaterial({
      map: hardwoodDiffuse || rep(procWood, 12, 12),
      bumpMap: hardwoodBump || null,
      bumpScale: 0.04,
      roughnessMap: hardwoodRough || null,
      roughness: 0.65, metalness: 0.0,
      envMapIntensity: 0.75,
      color: 0xffd8b0,
    }),
    // Soft pebble/terrazzo floor — use checker floor diffuse as light texture
    floorSoft: new THREE.MeshStandardMaterial({
      map: floorDiff || rep(procSoft, 14, 14),
      roughness: 0.85, envMapIntensity: 0.4,
      color: 0xd8d2c8,
    }),
    floorMarble: new THREE.MeshPhysicalMaterial({
      map: rep(procMarble, 6, 6),
      roughness: 0.15, metalness: 0.0,
      clearcoat: 0.7, clearcoatRoughness: 0.2, envMapIntensity: 1.2,
    }),
    floorStone: new THREE.MeshStandardMaterial({
      map: stoneDiff || rep(procStone, 10, 10),
      roughness: 0.92, envMapIntensity: 0.4,
      color: 0x6a6a6f,
    }),
    wallWhite: new THREE.MeshStandardMaterial({
      map: rep(procWall, 4, 2),
      roughness: 0.7, envMapIntensity: 0.75,
    }),
    curvedConcrete: new THREE.MeshStandardMaterial({
      map: rep(procConcrete, 4, 2),
      roughness: 0.82, envMapIntensity: 0.55,
    }),
    wallWood: new THREE.MeshStandardMaterial({
      map: hardwoodDiffuse ? hardwoodDiffuse.clone() : null,
      color: 0x8c6a3f, roughness: 0.65, envMapIntensity: 0.75,
    }),
    bracingWall: new THREE.MeshStandardMaterial({
      map: brickDiff || rep(procConcrete, 6, 3),
      bumpMap: brickBump || null,
      bumpScale: 0.08,
      roughness: 0.92, envMapIntensity: 0.45,
      color: 0x9a958e,
    }),
    acousticFoam: new THREE.MeshStandardMaterial({
      map: rep(procFoam, 1, 1),
      roughness: 1.0, envMapIntensity: 0.25,
    }),
    glassTrans: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.2, transmission: 0.75,
      transparent: true, opacity: 0.4, side: THREE.DoubleSide,
      ior: 1.4, thickness: 0.1, envMapIntensity: 1.2,
    }),
    fabric: new THREE.MeshStandardMaterial({
      color: 0xffffff, transparent: true, opacity: 0.45,
      side: THREE.DoubleSide, roughness: 1.0,
    }),
    // Fallback "water" for non-Water meshes (rims, etc.)
    water: new THREE.MeshPhysicalMaterial({
      color: 0x9adcd8, roughness: 0.04, transmission: 0.85,
      transparent: true, opacity: 0.85, metalness: 0.0,
      ior: 1.33, thickness: 0.5, envMapIntensity: 1.4,
      clearcoat: 1.0, clearcoatRoughness: 0.04,
    }),
    saunaWood: new THREE.MeshStandardMaterial({
      map: hardwoodDiffuse ? hardwoodDiffuse.clone() : null,
      color: 0x8b6340, roughness: 0.75, envMapIntensity: 0.55,
    }),
    foliage: new THREE.MeshStandardMaterial({
      color: 0x5e9648, roughness: 0.9, envMapIntensity: 0.5,
    }),
    bark: new THREE.MeshStandardMaterial({
      map: hardwoodDiffuse ? hardwoodDiffuse.clone() : null,
      color: 0x5c4030, roughness: 0.95, envMapIntensity: 0.3,
    }),
    grass: new THREE.MeshStandardMaterial({
      map: grassDiff || rep(procGrass, 20, 20),
      roughness: 1.0, envMapIntensity: 0.5,
    }),
    hill: new THREE.MeshStandardMaterial({
      map: grassDiff ? grassDiff.clone() : rep(procGrass, 10, 10),
      roughness: 1.0, envMapIntensity: 0.5, color: 0xb0c896,
    }),
    puff: new THREE.MeshStandardMaterial({
      color: 0xbcd0d8, roughness: 0.95, envMapIntensity: 0.5,
    }),
    pitFloor: new THREE.MeshStandardMaterial({
      color: 0xb8a888, roughness: 1.0, envMapIntensity: 0.3,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0xc8c8c8, roughness: 0.3, metalness: 0.85, envMapIntensity: 1.2,
    }),
    soil: new THREE.MeshStandardMaterial({
      color: 0x4e362a, roughness: 1.0, envMapIntensity: 0.3,
    }),
    sky: new THREE.MeshBasicMaterial({
      map: skyTex, side: THREE.BackSide, toneMapped: false,
    }),
    skylightGlass: new THREE.MeshPhysicalMaterial({
      color: 0xeaf4ff, roughness: 0.05, transmission: 0.95,
      transparent: true, opacity: 0.3, metalness: 0.0,
      ior: 1.5, thickness: 0.05, envMapIntensity: 1.5,
    }),
    gardenGlass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.05, transmission: 0.9,
      transparent: true, opacity: 0.2, metalness: 0.0,
      ior: 1.5, thickness: 0.03, envMapIntensity: 1.2, side: THREE.DoubleSide,
    }),
    mirror: new THREE.MeshStandardMaterial({
      color: 0xe8eef2, roughness: 0.02, metalness: 1.0, envMapIntensity: 2.0,
    }),
    pavingStripe: new THREE.MeshStandardMaterial({
      color: 0xbababf, roughness: 0.9, envMapIntensity: 0.3,
    }),
  };
}
