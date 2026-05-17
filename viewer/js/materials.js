import * as THREE from 'three';

// ---------- Procedural canvas textures ----------

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

function makeDataTexture(w, h, draw) {
  // Linear texture for normal/roughness — NOT sRGB.
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  return tex;
}

// Warm ribbed wood ceiling (albedo + normal for the ribs)
const woodAlbedo = makeCanvas(1024, 1024, (ctx, w, h) => {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0,  '#d0a07a');
  grad.addColorStop(0.4,'#b8814f');
  grad.addColorStop(0.8,'#a4703c');
  grad.addColorStop(1,  '#8b5e2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // dark rib gaps every 24px
  for (let x = 0; x < w; x += 24) {
    ctx.fillStyle = 'rgba(40,20,8,0.55)';
    ctx.fillRect(x, 0, 3, h);
    ctx.fillStyle = 'rgba(255,220,180,0.12)';
    ctx.fillRect(x + 3, 0, 1, h);
  }
  // wood grain noise
  for (let i = 0; i < 8000; i++) {
    ctx.fillStyle = `rgba(60,30,10,${Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 60, 1);
  }
});
const woodNormal = makeDataTexture(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 24) {
    ctx.fillStyle = '#6060d0';
    ctx.fillRect(x - 1, 0, 2, h);
    ctx.fillStyle = '#a0a0ff';
    ctx.fillRect(x + 1, 0, 2, h);
  }
});

// Soft pebble/terrazzo floor (matches the textured aggregate floor in renders)
const softAlbedo = makeCanvas(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#d8d2c8';
  ctx.fillRect(0, 0, w, h);
  // aggregate flecks
  for (let i = 0; i < 12000; i++) {
    const s = 1 + Math.random() * 3;
    const c = 120 + Math.random() * 100;
    ctx.fillStyle = `rgba(${c},${c - 10},${c - 30},${0.3 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, s, 0, Math.PI * 2);
    ctx.fill();
  }
  // subtle dark grains
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(60,50,40,${Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
});
const softRoughness = makeDataTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(${100 + Math.random() * 150},${100 + Math.random() * 150},${100 + Math.random() * 150},0.4)`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
});

// White porous marble (spa floor)
const marbleAlbedo = makeCanvas(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#f4f1ec';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(170,160,150,0.35)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 50; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.bezierCurveTo(
      Math.random() * w, Math.random() * h,
      Math.random() * w, Math.random() * h,
      Math.random() * w, Math.random() * h,
    );
    ctx.stroke();
  }
  // porous specks
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = `rgba(180,170,160,${Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
});

// Park stone — dark grey with light railway stripes
const stoneAlbedo = makeCanvas(2048, 2048, (ctx, w, h) => {
  ctx.fillStyle = '#3f3f42';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 25000; i++) {
    const v = 30 + Math.random() * 60;
    ctx.fillStyle = `rgba(${v},${v},${v + 5},0.55)`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // light railway lines
  for (let x = 96; x < w; x += 128) {
    ctx.fillStyle = '#b8b8bc';
    ctx.fillRect(x, 0, 4, h);
    ctx.fillStyle = 'rgba(80,80,80,0.5)';
    ctx.fillRect(x - 1, 0, 2, h);
  }
});

// White wall (slightly textured)
const wallAlbedo = makeCanvas(512, 512, (ctx, w, h) => {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#f0eee8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `rgba(200,195,185,${Math.random() * 0.15})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
});

// Grass
const grassAlbedo = makeCanvas(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#6a8a4a';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 18000; i++) {
    const g = 70 + Math.random() * 80;
    ctx.fillStyle = `rgba(${g * 0.55},${g + 15},${g * 0.4},${0.4 + Math.random() * 0.4})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 4);
  }
  // some lighter highlights
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `rgba(180,200,120,${Math.random() * 0.4})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 3);
  }
});

// Acoustic foam (white ribbed)
const foamAlbedo = makeCanvas(256, 512, (ctx, w, h) => {
  ctx.fillStyle = '#f5f3ef';
  ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 6) {
    ctx.fillStyle = 'rgba(170,165,155,0.4)';
    ctx.fillRect(x, 0, 1.5, h);
  }
});

// Bracing wall (rough concrete with vertical formwork lines)
const concreteAlbedo = makeCanvas(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#b5b2ac';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 12000; i++) {
    const v = 140 + Math.random() * 60;
    ctx.fillStyle = `rgba(${v},${v - 5},${v - 10},${Math.random() * 0.35})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // formwork verticals every 200px
  for (let x = 0; x < w; x += 200) {
    ctx.fillStyle = 'rgba(80,80,75,0.25)';
    ctx.fillRect(x, 0, 2, h);
  }
  // tie holes
  ctx.fillStyle = 'rgba(60,60,55,0.6)';
  for (let x = 100; x < w; x += 200) {
    for (let y = 100; y < h; y += 300) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
});

// ---------- Material factory ----------

export function makeMaterials() {
  function rep(tex, x, y) {
    const t = tex.clone(); t.needsUpdate = true; t.repeat.set(x, y); return t;
  }

  const ceiling = rep(woodAlbedo, 12, 12);
  const ceilingN = rep(woodNormal, 12, 12);
  const soft = rep(softAlbedo, 14, 14);
  const softR = rep(softRoughness, 14, 14);
  const marble = rep(marbleAlbedo, 6, 6);
  const stone = rep(stoneAlbedo, 10, 10);
  const wall = rep(wallAlbedo, 4, 2);
  const grass = rep(grassAlbedo, 24, 24);
  const foam = rep(foamAlbedo, 1, 1);
  const concrete = rep(concreteAlbedo, 4, 2);

  return {
    ceilingWood: new THREE.MeshStandardMaterial({
      map: ceiling, normalMap: ceilingN, normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 0.78, metalness: 0.0, envMapIntensity: 0.5,
    }),
    floorSoft: new THREE.MeshStandardMaterial({
      map: soft, roughnessMap: softR, roughness: 0.95, envMapIntensity: 0.3,
    }),
    floorMarble: new THREE.MeshPhysicalMaterial({
      map: marble, roughness: 0.18, metalness: 0.0,
      clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 1.0,
    }),
    floorStone: new THREE.MeshStandardMaterial({
      map: stone, roughness: 0.9, envMapIntensity: 0.3,
    }),
    wallWhite: new THREE.MeshStandardMaterial({
      map: wall, roughness: 0.7, envMapIntensity: 0.6,
    }),
    curvedConcrete: new THREE.MeshStandardMaterial({
      map: concrete, roughness: 0.82, envMapIntensity: 0.5,
    }),
    wallWood: new THREE.MeshStandardMaterial({
      color: 0x8c6a3f, roughness: 0.65, envMapIntensity: 0.7,
    }),
    bracingWall: new THREE.MeshStandardMaterial({
      map: concrete, roughness: 0.9, envMapIntensity: 0.4,
    }),
    acousticFoam: new THREE.MeshStandardMaterial({
      map: foam, roughness: 1.0, envMapIntensity: 0.2,
    }),
    glassTrans: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.25, transmission: 0.65,
      transparent: true, opacity: 0.35, side: THREE.DoubleSide,
      ior: 1.4, thickness: 0.1, envMapIntensity: 1.0,
    }),
    fabric: new THREE.MeshStandardMaterial({
      color: 0xffffff, transparent: true, opacity: 0.45,
      side: THREE.DoubleSide, roughness: 1.0,
    }),
    water: new THREE.MeshPhysicalMaterial({
      color: 0x9adcd8, roughness: 0.04, transmission: 0.8,
      transparent: true, opacity: 0.85, metalness: 0.0,
      ior: 1.33, thickness: 0.5, envMapIntensity: 1.3,
      clearcoat: 1.0, clearcoatRoughness: 0.05,
    }),
    saunaWood: new THREE.MeshStandardMaterial({
      color: 0x8b6340, roughness: 0.75, envMapIntensity: 0.5,
    }),
    foliage: new THREE.MeshStandardMaterial({
      color: 0x5e9648, roughness: 0.85, envMapIntensity: 0.4,
    }),
    bark: new THREE.MeshStandardMaterial({
      color: 0x5c4030, roughness: 0.95, envMapIntensity: 0.3,
    }),
    grass: new THREE.MeshStandardMaterial({
      map: grass, roughness: 1.0, envMapIntensity: 0.4,
    }),
    hill: new THREE.MeshStandardMaterial({
      map: grass, roughness: 1.0, envMapIntensity: 0.4, color: 0xa8be88,
    }),
    puff: new THREE.MeshStandardMaterial({
      color: 0xbcd0d8, roughness: 0.95, envMapIntensity: 0.4,
    }),
    pitFloor: new THREE.MeshStandardMaterial({
      color: 0xb8a888, roughness: 1.0, envMapIntensity: 0.2,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0xc8c8c8, roughness: 0.35, metalness: 0.85, envMapIntensity: 1.0,
    }),
    soil: new THREE.MeshStandardMaterial({
      color: 0x4e362a, roughness: 1.0, envMapIntensity: 0.2,
    }),
    sky: new THREE.MeshBasicMaterial({
      color: 0xb4c8d8, side: THREE.BackSide, toneMapped: false,
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
      color: 0xe8eef2, roughness: 0.02, metalness: 1.0, envMapIntensity: 1.8,
    }),
    pavingStripe: new THREE.MeshStandardMaterial({
      color: 0xbababf, roughness: 0.9, envMapIntensity: 0.3,
    }),
  };
}
