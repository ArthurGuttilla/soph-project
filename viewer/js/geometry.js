import * as THREE from 'three';
import {
  SITE_OUTLINE, CEILING_HEIGHT, SKYLIGHTS, HILLS, STAIR,
  FOUNTAIN_PATHS, PARK_TREES, SPA_POOLS, SAUNAS, COLUMNS,
  GLASS_GARDENS, LOUNGE_PITS, MED_PODS, STUDY_TABLES, ROOM_ZONES,
  PAVING, INTERIOR_WALLS, CHAIRS, RECEPTION, BOOKSHELVES,
  INTERIOR_PLANTS, SOFAS, DANCE_MIRROR, ELEVATOR,
} from './plan.js';

// Re-export for main.js convenience
export const LAYOUT = {
  bounds: outlineBounds(SITE_OUTLINE),
  ceilingHeight: CEILING_HEIGHT,
  rooms: ROOM_ZONES,
  stair: STAIR,
  skylights: SKYLIGHTS,
  hills: HILLS,
  spawn: { x: -6, y: 1.65, z: 2 },
};

function outlineBounds(outline) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  outline.forEach(([x, z]) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  });
  return { minX, maxX, minZ, maxZ };
}

// ---------- Shape helpers ----------

// IMPORTANT: ShapeGeometry lives in the XY plane. We rotate -PI/2 around X
// to make it lie flat, which maps shape Y → world -Z. To keep world
// coordinates consistent with everything else (which uses raw world X/Z),
// every shape-space Y value is the NEGATED world Z.
function shapeFromOutline(outline) {
  const s = new THREE.Shape();
  s.moveTo(outline[0][0], -outline[0][1]);
  for (let i = 1; i < outline.length; i++) s.lineTo(outline[i][0], -outline[i][1]);
  s.closePath();
  return s;
}

function shapeFromPoints(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], -pts[i][1]);
  s.closePath();
  return s;
}

function addEllipseHole(shape, x, z, rx, rz, rot = 0) {
  const hole = new THREE.Path();
  const seg = 32;
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * Math.PI * 2;
    const lx = Math.cos(t) * rx;
    const lz = Math.sin(t) * rz;
    const wx = x + lx * Math.cos(rot) - lz * Math.sin(rot);
    const wz = z + lx * Math.sin(rot) + lz * Math.cos(rot);
    // Path Y stores -worldZ so the hole punches at the right world position.
    if (i === 0) hole.moveTo(wx, -wz);
    else hole.lineTo(wx, -wz);
  }
  shape.holes.push(hole);
}

function setShadows(mesh, cast = true, receive = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
}

function addChair(group, x, z, rot, materials) {
  // Seat
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.05, 0.5),
    materials.wallWhite
  );
  seat.position.set(x, 0.45, z);
  seat.rotation.y = rot;
  seat.userData.collidable = true;
  setShadows(seat);
  group.add(seat);
  // Backrest
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.55, 0.05),
    materials.wallWhite
  );
  back.position.set(
    x - Math.cos(rot) * 0.22, 0.72, z - Math.sin(rot) * 0.22
  );
  back.rotation.y = rot;
  setShadows(back);
  group.add(back);
  // 4 legs
  const legGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6);
  for (let i = 0; i < 4; i++) {
    const lx = (i % 2 === 0 ? 0.2 : -0.2);
    const lz = (i < 2 ? 0.2 : -0.2);
    const wx = x + lx * Math.cos(rot) - lz * Math.sin(rot);
    const wz = z + lx * Math.sin(rot) + lz * Math.cos(rot);
    const leg = new THREE.Mesh(legGeom, materials.metal);
    leg.position.set(wx, 0.225, wz);
    setShadows(leg);
    group.add(leg);
  }
}

function addSofa(group, s, materials) {
  // Long puff seating
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(s.w, 0.45, s.d),
    materials.puff
  );
  seat.position.set(s.x, 0.225, s.z);
  seat.rotation.y = s.rot;
  seat.userData.collidable = true;
  setShadows(seat);
  group.add(seat);
  // Cushions on top
  const ncush = Math.max(2, Math.round(s.w / 0.8));
  for (let i = 0; i < ncush; i++) {
    const localX = -s.w / 2 + (i + 0.5) * (s.w / ncush);
    const cushion = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 14, 10),
      materials.puff
    );
    cushion.scale.set(1, 0.5, 1);
    cushion.position.set(
      s.x + localX * Math.cos(s.rot),
      0.55,
      s.z + localX * Math.sin(s.rot)
    );
    setShadows(cushion);
    group.add(cushion);
  }
}

function addBookshelf(group, b, materials) {
  const carcass = new THREE.Mesh(
    new THREE.BoxGeometry(b.w, 2.6, b.d),
    materials.wallWood
  );
  carcass.position.set(b.x, 1.3, b.z);
  carcass.rotation.y = b.rot;
  carcass.userData.collidable = true;
  setShadows(carcass);
  group.add(carcass);
  // Books — variation of colored slim boxes on 4 shelves
  const shelves = 4;
  const colors = [0x8b3a3a, 0x3a5a8b, 0x6b8b3a, 0x8b6f3a, 0x4a4a4a, 0x9b7b3b];
  for (let s = 0; s < shelves; s++) {
    const y = 0.3 + s * 0.6;
    const longSide = Math.max(b.w, b.d);
    const nBooks = Math.floor(longSide / 0.06);
    for (let i = 0; i < nBooks; i++) {
      const localOff = -longSide / 2 + 0.08 + i * (longSide - 0.16) / nBooks;
      const color = colors[(i * 7 + s * 3) % colors.length];
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(b.w > b.d ? 0.05 : Math.max(b.w * 0.7, 0.12),
                              0.32 + Math.random() * 0.12,
                              b.w > b.d ? Math.max(b.d * 0.7, 0.12) : 0.05),
        new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
      );
      const ox = b.w > b.d ? localOff : 0;
      const oz = b.w > b.d ? 0 : localOff;
      book.position.set(
        b.x + ox * Math.cos(b.rot) - oz * Math.sin(b.rot),
        y,
        b.z + ox * Math.sin(b.rot) + oz * Math.cos(b.rot)
      );
      book.rotation.y = b.rot;
      group.add(book);
    }
  }
}

function addPottedPlant(group, x, z, materials) {
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.26, 0.45, 16),
    materials.curvedConcrete
  );
  pot.position.set(x, 0.225, z);
  setShadows(pot);
  group.add(pot);
  // Foliage cluster
  for (let i = 0; i < 4; i++) {
    const r = 0.3 + Math.random() * 0.2;
    const f = new THREE.Mesh(
      new THREE.SphereGeometry(r, 10, 8),
      materials.foliage
    );
    f.position.set(
      x + (Math.random() - 0.5) * 0.3,
      0.55 + Math.random() * 0.6,
      z + (Math.random() - 0.5) * 0.3
    );
    setShadows(f);
    group.add(f);
  }
}

function addTree(group, x, y, z, materials, scale = 1.0) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 1.6 * scale, 10),
    materials.bark
  );
  trunk.position.set(x, y + 0.8 * scale, z);
  setShadows(trunk);
  group.add(trunk);
  for (let i = 0; i < 3; i++) {
    const r = (0.7 + Math.random() * 0.3) * scale;
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(r, 14, 10),
      materials.foliage
    );
    canopy.position.set(
      x + (Math.random() - 0.5) * 0.5 * scale,
      y + (1.6 + i * 0.4) * scale,
      z + (Math.random() - 0.5) * 0.5 * scale
    );
    setShadows(canopy);
    group.add(canopy);
  }
}

// ---------- UNDERGROUND ----------

export function buildUnderground(materials) {
  const group = new THREE.Group();
  const H = CEILING_HEIGHT;

  // ------ Floor (full site outline, no holes) ------
  const floorShape = shapeFromOutline(SITE_OUTLINE);
  const floorGeom = new THREE.ShapeGeometry(floorShape, 40);
  floorGeom.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeom, materials.floorSoft);
  setShadows(floor, false, true);
  group.add(floor);

  // ------ Spa marble floor patch (inside the spa zone) ------
  const spaShape = shapeFromPoints([
    [-28, 32], [-26, 50], [-10, 52], [ 6, 54], [ 18, 50], [ 22, 38], [ 14, 32], [ -4, 30], [-20, 30],
  ]);
  // Carve pool holes
  SPA_POOLS.forEach(p => addEllipseHole(spaShape, p.x, p.z, p.rx, p.rz, p.rot));
  const spaFloorGeom = new THREE.ShapeGeometry(spaShape, 32);
  spaFloorGeom.rotateX(-Math.PI / 2);
  const spaFloor = new THREE.Mesh(spaFloorGeom, materials.floorMarble);
  spaFloor.position.y = 0.02;
  setShadows(spaFloor, false, true);
  group.add(spaFloor);

  // ------ Ceiling with skylight holes ------
  const ceilShape = shapeFromOutline(SITE_OUTLINE);
  SKYLIGHTS.forEach(s => addEllipseHole(ceilShape, s.x, s.z, s.rx, s.rz, s.rot));
  const ceilGeom = new THREE.ShapeGeometry(ceilShape, 60);
  ceilGeom.rotateX(Math.PI / 2);
  const ceiling = new THREE.Mesh(ceilGeom, materials.ceilingWood);
  ceiling.position.y = H;
  setShadows(ceiling, false, true);
  group.add(ceiling);

  // ------ Perimeter bracing wall (extruded along outline) ------
  const wallH = H;
  for (let i = 0; i < SITE_OUTLINE.length; i++) {
    const a = SITE_OUTLINE[i];
    const b = SITE_OUTLINE[(i + 1) % SITE_OUTLINE.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(len, wallH, 0.6),
      materials.bracingWall
    );
    wall.position.set(mid[0], wallH / 2, mid[1]);
    wall.rotation.y = -Math.atan2(dz, dx);
    wall.userData.collidable = true;
    setShadows(wall);
    group.add(wall);
  }

  // ------ Organic curved interior wall ------
  buildCurvedWall(group, materials);

  // ------ Helical stair ------
  buildHelicalStair(group, materials);

  // ------ Skylights: well rings + light beams ------
  buildSkylightWells(group, materials);

  // ------ Mushroom columns ------
  COLUMNS.forEach(([x, z]) => {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.5, H - 0.4, 24),
      materials.wallWhite
    );
    shaft.position.set(x, (H - 0.4) / 2, z);
    shaft.userData.collidable = true;
    setShadows(shaft);
    group.add(shaft);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 0.5, 0.6, 32),
      materials.wallWhite
    );
    cap.position.set(x, H - 0.35, z);
    setShadows(cap);
    group.add(cap);
  });

  // ------ Spa pools (water) ------
  SPA_POOLS.forEach(p => {
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      materials.water
    );
    water.scale.set(p.rx, p.rz, 1);
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = p.rot;
    water.position.set(p.x, -0.05, p.z);
    setShadows(water, false, true);
    group.add(water);
  });

  // ------ Sauna modules ------
  SAUNAS.forEach(s => {
    const sauna = new THREE.Mesh(
      new THREE.BoxGeometry(s.w, 2.4, s.d),
      materials.saunaWood
    );
    sauna.position.set(s.x, 1.2, s.z);
    sauna.userData.collidable = true;
    setShadows(sauna);
    group.add(sauna);
  });

  // ------ Spa: vertical ribbed curtain (rib cluster forming an arc) ------
  for (let i = 0; i < 26; i++) {
    const t = i / 26;
    const ang = -Math.PI * 0.6 + t * Math.PI * 1.2;
    const cx = -10 + Math.cos(ang) * 14;
    const cz = 42 + Math.sin(ang) * 10;
    const rib = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 4.2, 10),
      materials.wallWhite
    );
    rib.position.set(cx, 2.1, cz);
    rib.userData.collidable = true;
    setShadows(rib);
    group.add(rib);
  }

  // ------ Dance area: piano-key acoustic foam barrier ------
  for (let i = 0; i < 28; i++) {
    const t = i / 28;
    // Sinuous curve through the dance zone
    const cx = -42 + t * 30;
    const cz = -18 + Math.sin(t * Math.PI * 1.5) * 6;
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 3.4, 1.0),
      materials.acousticFoam
    );
    rib.position.set(cx, 1.7, cz);
    rib.rotation.y = Math.cos(t * Math.PI * 1.5) * 0.4;
    rib.userData.collidable = true;
    setShadows(rib);
    group.add(rib);
  }

  // ------ Study area: translucent stretched plastic panel ------
  for (let i = 0; i < 16; i++) {
    const t = i / 16;
    const ang = t * Math.PI * 1.6;
    const cx = 12 + Math.sin(ang) * 1.6;
    const cz = -10 + t * 14;
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 4.2, 1.0),
      materials.glassTrans
    );
    panel.position.set(cx, 2.1, cz);
    panel.rotation.y = Math.cos(ang) * 0.3;
    panel.userData.collidable = true;
    setShadows(panel);
    group.add(panel);
  }

  // ------ Study tables ------
  STUDY_TABLES.forEach(([x, z]) => {
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.05, 32),
      materials.wallWhite
    );
    top.position.set(x, 0.75, z);
    setShadows(top);
    group.add(top);
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8),
      materials.metal
    );
    leg.position.set(x, 0.375, z);
    setShadows(leg);
    group.add(leg);
  });

  // ------ Meditation pods ------
  MED_PODS.forEach(([x, z]) => {
    const pod = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.85, 1.4, 12, 18),
      materials.wallWhite
    );
    pod.position.set(x, 1.55, z);
    setShadows(pod);
    group.add(pod);
  });

  // ------ Glass garden cylinders (13 trees, one under each skylight
  //         except the central one which is the elevator) ------
  GLASS_GARDENS.forEach(g => {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(g.radius, g.radius, g.height, 48, 1, true),
      materials.gardenGlass
    );
    glass.position.set(g.x, g.height / 2, g.z);
    glass.userData.collidable = true;
    group.add(glass);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(g.radius, 0.05, 10, 48),
      materials.metal
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(g.x, g.height, g.z);
    setShadows(rim);
    group.add(rim);
    // Soil
    const soil = new THREE.Mesh(
      new THREE.CircleGeometry(g.radius * 0.95, 32),
      materials.soil
    );
    soil.rotation.x = -Math.PI / 2;
    soil.position.set(g.x, 0.04, g.z);
    setShadows(soil, false, true);
    group.add(soil);
    addTree(group, g.x, 0, g.z, materials, g.treeScale);
  });

  // ------ Interior partition walls (curved, traced from plan) ------
  INTERIOR_WALLS.forEach(pts => {
    const v3 = pts.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(v3, false, 'catmullrom', 0.5);
    const samples = curve.getPoints(Math.max(40, pts.length * 8));
    // Punch periodic 2m gaps (doorways) — every ~14 segments leave 4 segments out
    const segPerGap = 14, gapSize = 4;
    for (let i = 0; i < samples.length - 1; i++) {
      const cycle = i % (segPerGap + gapSize);
      if (cycle >= segPerGap) continue; // door opening
      const a = samples[i], b = samples[i + 1];
      const len = a.distanceTo(b);
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(len + 0.02, 3.0, 0.18),
        materials.wallWhite
      );
      seg.position.set((a.x + b.x) / 2, 1.5, (a.z + b.z) / 2);
      seg.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      seg.userData.collidable = true;
      setShadows(seg);
      group.add(seg);
    }
  });

  // ------ Reception desk (curved counter at the access zone) ------
  {
    const r = RECEPTION.radius;
    const segments = 28;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const ang = -RECEPTION.angle / 2 + t * RECEPTION.angle;
      const cx = RECEPTION.x + Math.cos(ang) * r;
      const cz = RECEPTION.z + Math.sin(ang) * r;
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 1.1, 0.6),
        materials.wallWood
      );
      seg.position.set(cx, 0.55, cz);
      seg.rotation.y = -ang + Math.PI / 2;
      seg.userData.collidable = true;
      setShadows(seg);
      group.add(seg);
    }
    // Counter top
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const ang = -RECEPTION.angle / 2 + t * RECEPTION.angle;
      const cx = RECEPTION.x + Math.cos(ang) * r;
      const cz = RECEPTION.z + Math.sin(ang) * r;
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.05, 0.6),
        materials.floorMarble
      );
      top.position.set(cx, 1.13, cz);
      top.rotation.y = -ang + Math.PI / 2;
      setShadows(top);
      group.add(top);
    }
  }

  // ------ Chairs around tables ------
  CHAIRS.forEach(c => addChair(group, c.x, c.z, c.rot, materials));

  // ------ Sofas ------
  SOFAS.forEach(s => addSofa(group, s, materials));

  // ------ Bookshelves ------
  BOOKSHELVES.forEach(b => addBookshelf(group, b, materials));

  // ------ Interior potted plants ------
  INTERIOR_PLANTS.forEach(([x, z]) => addPottedPlant(group, x, z, materials));

  // ------ Dance area mirror wall ------
  {
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(DANCE_MIRROR.w, DANCE_MIRROR.h, 0.08),
      materials.mirror
    );
    mirror.position.set(DANCE_MIRROR.x, DANCE_MIRROR.h / 2, DANCE_MIRROR.z);
    mirror.rotation.y = DANCE_MIRROR.rot;
    mirror.userData.collidable = true;
    setShadows(mirror);
    group.add(mirror);
  }

  // ------ Lounge pits ------
  LOUNGE_PITS.forEach(p => {
    const pit = new THREE.Mesh(
      new THREE.CircleGeometry(1, 32),
      materials.pitFloor
    );
    pit.scale.set(p.rx, p.rz, 1);
    pit.rotation.x = -Math.PI / 2;
    pit.rotation.z = p.rot;
    pit.position.set(p.x, 0.03, p.z);
    setShadows(pit, false, true);
    group.add(pit);
    // Bean-bag cushion
    const cushion = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 18, 12),
      materials.puff
    );
    cushion.scale.y = 0.55;
    cushion.position.set(p.x + 0.3, 0.28, p.z);
    setShadows(cushion);
    group.add(cushion);
  });

  return group;
}

// ---------- Curved interior wall ----------
function buildCurvedWall(group, materials) {
  // The "ribbon" curved concrete wall threading through the plan.
  // Reading from Illustration 52, it loops through the spa, encloses the
  // main lounge from the south, then wraps around the study area.
  const segments = [
    [ // South/spa loop
      [-30,  28], [-22,  32], [-10,  30], [  4,  34], [ 18,  30], [ 26,  24],
      [ 18,  18], [  6,  22], [ -6,  18], [-18,  20], [-26,  18],
    ],
    [ // Study area east enclosure
      [ 10, -10], [ 16,  -2], [ 22,   6], [ 30,  10], [ 36,   2], [ 32,  -8],
    ],
    [ // North-west dance enclosure
      [-44, -28], [-32, -22], [-22, -28], [-16, -18], [-10, -20],
    ],
  ];

  segments.forEach(pts => {
    const v3 = pts.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(v3, false, 'catmullrom', 0.5);
    const samples = curve.getPoints(120);
    for (let i = 0; i < samples.length - 1; i++) {
      const a = samples[i], b = samples[i + 1];
      const len = a.distanceTo(b);
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(len + 0.02, 3.0, 0.22),
        materials.curvedConcrete
      );
      seg.position.set((a.x + b.x) / 2, 1.5, (a.z + b.z) / 2);
      seg.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      seg.userData.collidable = true;
      setShadows(seg);
      group.add(seg);
    }
  });
}

// ---------- Helical stair ----------
function buildHelicalStair(group, materials) {
  const { x, z } = STAIR;
  const turns = 1.5;
  const steps = 32;
  const radius = 2.0;
  const totalHeight = 6.0;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const y = t * totalHeight;
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.14, 0.8),
      materials.curvedConcrete
    );
    step.position.set(
      x + Math.cos(angle) * radius,
      y + 0.07,
      z + Math.sin(angle) * radius
    );
    step.rotation.y = -angle;
    setShadows(step);
    group.add(step);
  }
  // Central elevator shaft (replaces the solid column — glass cabin going
  // from underground floor up through the ceiling).
  const shaftR = 0.75;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(shaftR, shaftR, totalHeight, 24, 1, true),
    materials.gardenGlass
  );
  shaft.position.set(x, totalHeight / 2, z);
  shaft.userData.collidable = true;
  setShadows(shaft);
  group.add(shaft);
  // Cabin (a box inside the shaft at rest at the bottom)
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(shaftR * 1.4, 2.2, shaftR * 1.4),
    materials.wallWhite
  );
  cabin.position.set(x, 1.1, z);
  cabin.userData.collidable = true;
  setShadows(cabin);
  group.add(cabin);
  // Cabin top trim (a darker frame)
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(shaftR * 1.5, 0.08, shaftR * 1.5),
    materials.metal
  );
  trim.position.set(x, 2.25, z);
  setShadows(trim);
  group.add(trim);
  // Subtle warm light inside cabin
  const cabinLight = new THREE.PointLight(0xffe0a8, 0.6, 4, 1.5);
  cabinLight.position.set(x, 2.0, z);
  group.add(cabinLight);

  // Hand rail (spiral tube)
  const railPts = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const angle = t * turns * Math.PI * 2;
    const y = t * totalHeight + 1.0;
    railPts.push(new THREE.Vector3(
      x + Math.cos(angle) * (radius + 0.7),
      y,
      z + Math.sin(angle) * (radius + 0.7)
    ));
  }
  const railCurve = new THREE.CatmullRomCurve3(railPts);
  const railGeom = new THREE.TubeGeometry(railCurve, 80, 0.04, 8, false);
  const rail = new THREE.Mesh(railGeom, materials.metal);
  setShadows(rail);
  group.add(rail);

  // Glow marker on bottom step (interaction zone)
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 2.8, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd180, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.set(x, 0.03, z);
  group.add(marker);
}

// ---------- Skylight wells + light beams ----------
function buildSkylightWells(group, materials) {
  SKYLIGHTS.forEach(s => {
    // Cylindrical/elliptical well above the ceiling
    const well = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1.4, 36, 1, true),
      materials.wallWhite
    );
    well.scale.set(s.rx, 1, s.rz);
    well.rotation.y = s.rot;
    well.position.set(s.x, CEILING_HEIGHT + 0.6, s.z);
    setShadows(well, false, true);
    group.add(well);

    // Glowing sky disc inside the well (visible from below)
    const sky = new THREE.Mesh(
      new THREE.CircleGeometry(0.97, 36),
      new THREE.MeshBasicMaterial({ color: 0xeaf4ff, toneMapped: false })
    );
    sky.scale.set(s.rx, s.rz, 1);
    sky.rotation.x = Math.PI / 2;
    sky.rotation.z = s.rot;
    sky.position.set(s.x, CEILING_HEIGHT + 1.25, s.z);
    group.add(sky);

    // SpotLight pouring down through the opening
    const r = Math.max(s.rx, s.rz);
    const intensity = s.big ? 22 : 9;
    const spot = new THREE.SpotLight(0xeaf4ff, intensity, 22, Math.PI / 5, 0.55, 1.3);
    spot.position.set(s.x, CEILING_HEIGHT + 0.5, s.z);
    spot.target.position.set(s.x, 0, s.z);
    // Only the largest skylights cast actual shadows (cost saving).
    if (s.big) {
      spot.castShadow = true;
      spot.shadow.mapSize.set(1024, 1024);
      spot.shadow.bias = -0.0005;
    }
    group.add(spot);
    group.add(spot.target);

    // Soft pool of light on the floor
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1, 36),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, toneMapped: false })
    );
    pool.scale.set(r * 2.2, r * 1.6, 1);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(s.x, 0.04, s.z);
    group.add(pool);
  });
}

// ---------- GROUND FLOOR ----------

export function buildGround(materials) {
  const group = new THREE.Group();

  // Build the park surface as ShapeGeometry with skylight HOLES so the
  // player can look down through them into the underground.
  const parkShape = shapeFromOutline(SITE_OUTLINE);
  SKYLIGHTS.forEach(s => addEllipseHole(parkShape, s.x, s.z, s.rx, s.rz, s.rot));
  const parkGeom = new THREE.ShapeGeometry(parkShape, 64);
  parkGeom.rotateX(-Math.PI / 2);
  const park = new THREE.Mesh(parkGeom, materials.floorStone);
  park.position.y = 0;
  setShadows(park, false, true);
  group.add(park);

  // Grass patches as overlay shapes
  const grassPatches = [
    [[-44, -28], [-26, -34], [-12, -32], [-6, -22], [-20, -20], [-36, -18]],
    [[ 12, -32], [ 30, -32], [ 40, -24], [ 32, -16], [ 18, -20]],
    [[-50,   0], [-38,   4], [-30,  10], [-40,  18], [-50,  14]],
    [[ 44,   0], [ 52,   6], [ 50,  18], [ 40,  16], [ 38,   8]],
    [[-30,  44], [-10,  56], [ 10,  56], [ 28,  50], [ 18,  38], [ -8,  34], [-26,  36]],
  ];
  grassPatches.forEach(pts => {
    const s = shapeFromPoints(pts);
    // Also carve any skylights that fall inside (so they show through grass too)
    SKYLIGHTS.forEach(sk => {
      if (Math.hypot(sk.x - centroidX(pts), sk.z - centroidZ(pts)) < 12) {
        addEllipseHole(s, sk.x, sk.z, sk.rx, sk.rz, sk.rot);
      }
    });
    const g = new THREE.ShapeGeometry(s, 24);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, materials.grass);
    m.position.y = 0.015;
    setShadows(m, false, true);
    group.add(m);
  });

  // Hills (mound geometry, also with skylight holes possibly poking through)
  HILLS.forEach(h => buildHill(group, h, materials));

  // Diagonal paving stripes (railway reference, before fountains so water sits on top)
  buildPavingStripes(group, materials);

  // Fountain ribbons
  FOUNTAIN_PATHS.forEach(path => buildFountain(group, path, materials));

  // Trees
  PARK_TREES.forEach(([x, z]) => addTree(group, x, 0, z, materials, 1.7 + Math.random() * 0.6));

  // Skylight glass disks (clear, slightly above ground)
  SKYLIGHTS.forEach(s => {
    const glass = new THREE.Mesh(
      new THREE.CircleGeometry(0.97, 32),
      materials.skylightGlass
    );
    glass.scale.set(s.rx, s.rz, 1);
    glass.rotation.x = -Math.PI / 2;
    glass.rotation.z = s.rot;
    glass.position.set(s.x, 0.12, s.z);
    group.add(glass);
    // Raised concrete rim
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(0.97, 1.06, 48),
      materials.curvedConcrete
    );
    rim.scale.set(s.rx, s.rz, 1);
    rim.rotation.x = -Math.PI / 2;
    rim.rotation.z = s.rot;
    rim.position.set(s.x, 0.18, s.z);
    setShadows(rim);
    group.add(rim);
  });

  // Stair portal marker (interaction)
  const portal = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 3.0, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd180, transparent: true, opacity: 0.55, side: THREE.DoubleSide, toneMapped: false })
  );
  portal.rotation.x = -Math.PI / 2;
  portal.position.set(STAIR.x, HILLS[0].height + 0.01, STAIR.z);
  group.add(portal);

  // Sky dome (low-poly hemisphere)
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(220, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.sky
  );
  group.add(sky);

  return group;
}

function centroidX(pts) { return pts.reduce((s, p) => s + p[0], 0) / pts.length; }
function centroidZ(pts) { return pts.reduce((s, p) => s + p[1], 0) / pts.length; }

function buildHill(group, h, materials) {
  // Open hemisphere, scaled vertically with mild vertex displacement so it
  // doesn't read as a perfect half-sphere.
  const seg = 56;
  const radSeg = 36;
  const geom = new THREE.SphereGeometry(h.radius, seg, radSeg, 0, Math.PI * 2, 0, Math.PI / 2);
  geom.scale(1, h.height / h.radius, 1);

  // Procedural lumpiness — pseudo-random per-vertex displacement.
  const pos = geom.attributes.position;
  const seed = h.x * 31.7 + h.z * 13.1;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Don't displace the bottom ring (so it sits flush with the ground)
    if (y < 0.1) continue;
    const n = Math.sin(x * 0.7 + seed) * Math.cos(z * 0.6 + seed * 1.3) * 0.45;
    pos.setX(i, x + n * 0.4);
    pos.setY(i, y + Math.abs(n) * 0.25);
    pos.setZ(i, z + n * 0.4);
  }
  geom.computeVertexNormals();

  const mesh = new THREE.Mesh(geom, materials.hill);
  mesh.position.set(h.x, 0, h.z);
  setShadows(mesh, true, true);
  group.add(mesh);
}

function buildFountain(group, path, materials) {
  // Smooth water channel as Catmull-Rom + flat ribbon (constructed via
  // small segmented boxes that follow the curve, with sloped concrete
  // banks on each side).
  const v3 = path.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(v3, false, 'catmullrom', 0.5);
  const samples = curve.getPoints(Math.max(80, path.length * 12));
  const width = 1.5;
  const bankWidth = 0.35;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    const len = a.distanceTo(b);
    const angle = -Math.atan2(b.z - a.z, b.x - a.x);
    const cx = (a.x + b.x) / 2;
    const cz = (a.z + b.z) / 2;

    // Bank — wider concrete edge slightly raised
    const bank = new THREE.Mesh(
      new THREE.BoxGeometry(len + 0.05, 0.18, width + bankWidth * 2),
      materials.curvedConcrete
    );
    bank.position.set(cx, 0.07, cz);
    bank.rotation.y = angle;
    setShadows(bank, false, true);
    group.add(bank);

    // Water surface (slightly recessed)
    const water = new THREE.Mesh(
      new THREE.BoxGeometry(len + 0.02, 0.08, width),
      materials.water
    );
    water.position.set(cx, 0.13, cz);
    water.rotation.y = angle;
    setShadows(water, false, true);
    group.add(water);
  }
}

function buildPavingStripes(group, materials) {
  // Diagonal paving stripes across the park (railway reference).
  const angle = PAVING.angle;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  // Range to cover the trapezoid + margin
  const diag = 140;
  for (let i = -PAVING.stripes; i < PAVING.stripes; i++) {
    const offset = i * 7.5;
    const sx = -offset * sin;
    const sz = offset * cos;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(diag, 0.012, PAVING.width),
      materials.pavingStripe
    );
    stripe.position.set(sx, 0.025, sz);
    stripe.rotation.y = angle;
    setShadows(stripe, false, true);
    group.add(stripe);
  }
}
