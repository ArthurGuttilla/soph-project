import * as THREE from 'three';

// Procedural canvas textures — no external assets required.

function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// Warm ribbed wood ceiling
export const woodCeilingTexture = makeCanvas(512, 512, (ctx, w, h) => {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#c89668');
  grad.addColorStop(1, '#a87444');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // ribs
  ctx.strokeStyle = 'rgba(60, 30, 10, 0.35)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, h);
    ctx.stroke();
  }
  // grain noise
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `rgba(60,30,10,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 30, 1);
  }
});

// Soft beige floor
export const softFloorTexture = makeCanvas(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#d4cfc8';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(140,130,120,${Math.random() * 0.15})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
});

// Porous white marble
export const marbleTexture = makeCanvas(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#f0edea';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(180,170,160,0.25)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.bezierCurveTo(
      Math.random() * w, Math.random() * h,
      Math.random() * w, Math.random() * h,
      Math.random() * w, Math.random() * h
    );
    ctx.stroke();
  }
});

// Dark stone (ground floor) with light line stripes
export const groundStoneTexture = makeCanvas(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#4a4a4d';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 8000; i++) {
    ctx.fillStyle = `rgba(${30 + Math.random() * 40},${30 + Math.random() * 40},${30 + Math.random() * 40},0.6)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  // Light grey rail lines
  ctx.fillStyle = '#a8a8a8';
  for (let x = 80; x < w; x += 128) {
    ctx.fillRect(x, 0, 3, h);
  }
});

// White wall slight grain
export const wallWhiteTexture = makeCanvas(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#fafaf8';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `rgba(200,200,195,${Math.random() * 0.2})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
});

// Acoustic foam (ribbed white, for dance area)
export const acousticFoamTexture = makeCanvas(256, 512, (ctx, w, h) => {
  ctx.fillStyle = '#f4f4f1';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(160,160,155,0.4)';
  for (let x = 0; x < w; x += 6) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
});

// Grass texture
export const grassTexture = makeCanvas(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#6a8a52';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++) {
    const g = 60 + Math.random() * 80;
    ctx.fillStyle = `rgba(${g * 0.6},${g + 20},${g * 0.5},0.5)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 3);
  }
});

// ---------- Materials ----------

export function makeMaterials() {
  const ceiling = woodCeilingTexture.clone(); ceiling.needsUpdate = true; ceiling.repeat.set(8, 8);
  const soft = softFloorTexture.clone(); soft.needsUpdate = true; soft.repeat.set(10, 10);
  const marble = marbleTexture.clone(); marble.needsUpdate = true; marble.repeat.set(4, 4);
  const stone = groundStoneTexture.clone(); stone.needsUpdate = true; stone.repeat.set(8, 8);
  const wall = wallWhiteTexture.clone(); wall.needsUpdate = true; wall.repeat.set(4, 2);
  const foam = acousticFoamTexture.clone(); foam.needsUpdate = true; foam.repeat.set(2, 1);
  const grass = grassTexture.clone(); grass.needsUpdate = true; grass.repeat.set(20, 20);

  return {
    ceilingWood:   new THREE.MeshStandardMaterial({ map: ceiling, roughness: 0.85, metalness: 0.0 }),
    floorSoft:     new THREE.MeshStandardMaterial({ map: soft, roughness: 0.95 }),
    floorMarble:   new THREE.MeshStandardMaterial({ map: marble, roughness: 0.35, metalness: 0.0, color: 0xffffff }),
    floorStone:    new THREE.MeshStandardMaterial({ map: stone, roughness: 0.9 }),
    wallWhite:     new THREE.MeshStandardMaterial({ map: wall, roughness: 0.8, color: 0xffffff }),
    curvedConcrete:new THREE.MeshStandardMaterial({ color: 0xeeeae3, roughness: 0.85 }),
    wallWood:      new THREE.MeshStandardMaterial({ color: 0x8c6a3f, roughness: 0.7 }),
    bracingWall:   new THREE.MeshStandardMaterial({ color: 0x9a9a98, roughness: 0.95 }),
    acousticFoam:  new THREE.MeshStandardMaterial({ map: foam, roughness: 1.0, color: 0xf2f0ec }),
    glassTrans:    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.2, transmission: 0.6,
      transparent: true, opacity: 0.35, side: THREE.DoubleSide
    }),
    fabric:        new THREE.MeshStandardMaterial({
      color: 0xffffff, transparent: true, opacity: 0.42,
      side: THREE.DoubleSide, roughness: 1.0
    }),
    water:         new THREE.MeshPhysicalMaterial({
      color: 0xa8e6e2, roughness: 0.05, transmission: 0.7,
      transparent: true, opacity: 0.75, metalness: 0.0
    }),
    saunaWood:     new THREE.MeshStandardMaterial({ color: 0x8b6340, roughness: 0.8 }),
    foliage:       new THREE.MeshStandardMaterial({ color: 0x5a8a4a, roughness: 0.9 }),
    bark:          new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.95 }),
    grass:         new THREE.MeshStandardMaterial({ map: grass, roughness: 1.0 }),
    hill:          new THREE.MeshStandardMaterial({ color: 0x7a9866, roughness: 1.0 }),
    puff:          new THREE.MeshStandardMaterial({ color: 0xc7b89a, roughness: 1.0 }),
    metal:         new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4, metalness: 0.6 }),
    sky:           new THREE.MeshBasicMaterial({ color: 0xa8c4d8, side: THREE.BackSide }),
    light:         new THREE.MeshBasicMaterial({ color: 0xffffff }),
  };
}
