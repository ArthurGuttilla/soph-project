import * as THREE from 'three';

/**
 * Layout for The Inner Center (simplified plan).
 * Coordinate system:
 *   X: west(-) → east(+)
 *   Z: north(-) → south(+)
 *   Y: up
 * Underground level lives at y in [-6, -1] (5m ceiling, slab at -6).
 * For navigation simplicity, each level is internally placed at y=0..5
 * and we move the level group up/down to toggle which one is "active".
 */

export const LAYOUT = {
  bounds: { minX: -38, maxX: 42, minZ: -27, maxZ: 30 },
  ceilingHeight: 5.0,

  // Each room: center (cx, cz), size (w along X, d along Z), label, number, floor material.
  rooms: [
    { id: 'access',       n: 1,  label: 'Access',              cx:   0, cz:   0,  w:  9, d:  9, floor: 'soft' },
    { id: 'main_lounge',  n: 2,  label: 'Main Lounge',         cx: -13, cz:   0,  w: 16, d: 14, floor: 'soft' },
    { id: 'dance',        n: 3,  label: 'Dance Area',          cx: -22, cz: -16,  w: 18, d: 12, floor: 'soft' },
    { id: 'yoga',         n: 4,  label: 'Yoga',                cx:  -5, cz: -19,  w: 12, d:  8, floor: 'soft' },
    { id: 'atelier',      n: 5,  label: 'Atelier',             cx: -28, cz:   4,  w: 12, d: 12, floor: 'soft' },
    { id: 'spa',          n: 6,  label: 'Spa',                 cx: -10, cz:  18,  w: 30, d: 14, floor: 'marble' },
    { id: 'meditation',   n: 7,  label: 'Meditation Lounge',   cx:  17, cz:  14,  w: 14, d: 12, floor: 'soft' },
    { id: 'study',        n: 8,  label: 'Study Area',          cx:  20, cz:  -2,  w: 16, d: 14, floor: 'soft' },
    { id: 'admin',        n: 9,  label: 'Administration',      cx:  22, cz: -17,  w: 12, d: 10, floor: 'soft' },
    { id: 'technical',    n: 10, label: 'Technical Area',      cx:  34, cz: -16,  w:  8, d: 10, floor: 'soft' },
    { id: 'wc_n',         n: 11, label: 'WC',                  cx:   8, cz: -19,  w:  4, d:  4, floor: 'soft' },
    { id: 'wc_s',         n: 11, label: 'WC',                  cx:   8, cz:  24,  w:  4, d:  4, floor: 'soft' },
    { id: 'wc_e',         n: 11, label: 'WC',                  cx:  35, cz:   3,  w:  4, d:  4, floor: 'soft' },
    { id: 'wc_w',         n: 11, label: 'WC',                  cx: -34, cz: -10,  w:  4, d:  4, floor: 'soft' },
  ],

  // Where the helical stair sits (also the spawn point).
  stair: { x: 6, z: 0, radius: 2.0 },

  spawn: { x: -8, y: 1.65, z: 0, yaw: 0 },
};

// ---------- Helpers ----------

function rectWalls(group, cx, cz, w, d, h, mat, gaps = []) {
  // 4 walls; gaps lets you carve openings (per-edge list of [start, end] along the edge).
  // edges: 0=N (z=cz-d/2), 1=E (x=cx+w/2), 2=S (z=cz+d/2), 3=W (x=cx-w/2)
  const t = 0.2; // wall thickness
  const edges = [
    { dir: 'N', x: cx, z: cz - d/2, len: w, axis: 'x' },
    { dir: 'E', x: cx + w/2, z: cz, len: d, axis: 'z' },
    { dir: 'S', x: cx, z: cz + d/2, len: w, axis: 'x' },
    { dir: 'W', x: cx - w/2, z: cz, len: d, axis: 'z' },
  ];
  edges.forEach((e, i) => {
    const segs = segmentEdge(-e.len/2, e.len/2, gaps[i] || []);
    segs.forEach(([a, b]) => {
      const segLen = b - a;
      if (segLen <= 0.01) return;
      const segMid = (a + b) / 2;
      const geom = new THREE.BoxGeometry(
        e.axis === 'x' ? segLen : t,
        h,
        e.axis === 'z' ? segLen : t
      );
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        e.axis === 'x' ? e.x + segMid : e.x,
        h / 2,
        e.axis === 'z' ? e.z + segMid : e.z
      );
      mesh.userData.collidable = true;
      group.add(mesh);
    });
  });
}

function segmentEdge(min, max, gaps) {
  // gaps = [[a,b], ...] in same coord — subtract
  if (!gaps.length) return [[min, max]];
  const sorted = gaps.slice().sort((p, q) => p[0] - q[0]);
  const result = [];
  let cur = min;
  for (const [a, b] of sorted) {
    if (a > cur) result.push([cur, a]);
    cur = Math.max(cur, b);
  }
  if (cur < max) result.push([cur, max]);
  return result;
}

function addFloor(group, cx, cz, w, d, mat, y = 0.01) {
  const geom = new THREE.PlaneGeometry(w, d);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(cx, y, cz);
  group.add(mesh);
}

function addCeiling(group, cx, cz, w, d, h, mat) {
  const geom = new THREE.PlaneGeometry(w, d);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(cx, h, cz);
  group.add(mesh);
}

// ---------- Underground builder ----------

export function buildUnderground(materials) {
  const group = new THREE.Group();
  const H = LAYOUT.ceilingHeight;
  const B = LAYOUT.bounds;
  const W = B.maxX - B.minX;
  const D = B.maxZ - B.minZ;
  const cx = (B.minX + B.maxX) / 2;
  const cz = (B.minZ + B.maxZ) / 2;

  // Slab (full bounds)
  const slab = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    materials.floorSoft
  );
  slab.rotation.x = -Math.PI / 2;
  slab.position.set(cx, 0, cz);
  group.add(slab);

  // Ribbed wood ceiling
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    materials.ceilingWood
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(cx, H, cz);
  group.add(ceil);

  // Bracing wall (outer perimeter — thick concrete)
  const t = 1.0;
  const perim = [
    { x: cx, z: B.minZ - t/2, w: W + t*2, d: t },
    { x: cx, z: B.maxZ + t/2, w: W + t*2, d: t },
    { x: B.minX - t/2, z: cz, w: t, d: D },
    { x: B.maxX + t/2, z: cz, w: t, d: D },
  ];
  perim.forEach(p => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(p.w, H, p.d),
      materials.bracingWall
    );
    m.position.set(p.x, H/2, p.z);
    m.userData.collidable = true;
    group.add(m);
  });

  // Per-room floors + walls
  // Build a quick map of where doors are. For navigability we leave openings
  // between adjacent rooms by inferring shared edges.
  const floorMatMap = {
    soft: materials.floorSoft,
    marble: materials.floorMarble,
  };

  // Hand-tuned wall configurations per room. Gaps are local coords (relative to
  // edge midpoint along that edge).
  // Each entry: roomId → { N:[], E:[], S:[], W:[] } gaps (each gap is [a,b] from edge midpoint).
  const gapWidth = 2.4;
  const g = (offset = 0) => [offset - gapWidth/2, offset + gapWidth/2];

  const gaps = {
    access:      { N: [g(0)], E: [g(0)], S: [g(0)], W: [g(0)] },        // open hub
    main_lounge: { E: [g(0)],  S: [g(-3)], N: [g(2)], W: [g(0)] },
    atelier:     { E: [g(0)] },
    dance:       { N: [], E: [g(0)], S: [g(-2)], W: [] },
    yoga:        { S: [g(0)], W: [g(0)], E: [g(0)] },
    spa:         { N: [g(-8)], E: [g(0)] },
    study:       { N: [g(0)], W: [g(0)], S: [g(0)] },
    meditation:  { W: [g(0)], N: [g(0)], S: [g(0)] },
    admin:       { N: [g(0)], W: [g(0)], E: [g(0)] },
    technical:   { W: [g(0)] },
    wc_n:        { S: [g(0)] },
    wc_s:        { N: [g(0)] },
    wc_e:        { W: [g(0)] },
    wc_w:        { E: [g(0)] },
  };

  // Build floors first (so they cover seams)
  LAYOUT.rooms.forEach(r => {
    addFloor(group, r.cx, r.cz, r.w, r.d, floorMatMap[r.floor], 0.02);
  });

  // Then walls
  LAYOUT.rooms.forEach(r => {
    const wallMat = (r.id === 'admin' || r.id === 'technical')
      ? materials.wallWood
      : (r.id.startsWith('dance')) ? materials.acousticFoam
      : materials.wallWhite;
    rectWalls(group, r.cx, r.cz, r.w, r.d, H, wallMat,
      [gaps[r.id]?.N, gaps[r.id]?.E, gaps[r.id]?.S, gaps[r.id]?.W]);
  });

  // ---------- Curved internal wall (organic divider) ----------
  buildCurvedWall(group, materials);

  // ---------- Helical stair (access) ----------
  buildHelicalStair(group, LAYOUT.stair.x, LAYOUT.stair.z, materials);

  // ---------- Zenithal openings (skylight cylinders) ----------
  buildSkylights(group, materials);

  // ---------- Room-specific features ----------
  // Dance area — ballet barre
  const barre = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 8, 8),
    materials.metal
  );
  barre.rotation.z = Math.PI / 2;
  barre.position.set(-22, 1.0, -10);
  group.add(barre);

  // Spa — piscinas (3 pools)
  [[ -16, 18 ], [ -8, 20 ], [ 0, 17 ]].forEach(([px, pz]) => {
    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.0, 0.4, 32),
      materials.water
    );
    pool.position.set(px, 0.05, pz);
    group.add(pool);
    // pool rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.1, 8, 32),
      materials.curvedConcrete
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(px, 0.15, pz);
    group.add(rim);
  });

  // Spa — sauna modules
  [[ -18, 14, 2.5, 3 ], [ 2, 22, 2.5, 2.5 ]].forEach(([sx, sz, sw, sd]) => {
    const sauna = new THREE.Mesh(
      new THREE.BoxGeometry(sw, 2.4, sd),
      materials.saunaWood
    );
    sauna.position.set(sx, 1.2, sz);
    sauna.userData.collidable = true;
    group.add(sauna);
  });

  // Spa — fabric divider (semi-translucent curtain in front of marble area)
  const fabric = new THREE.Mesh(
    new THREE.BoxGeometry(20, 4.2, 0.05),
    materials.fabric
  );
  fabric.position.set(-10, 2.1, 12);
  group.add(fabric);

  // Study — translucent stretched plastic panel divider
  const plastic = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 4.2, 12),
    materials.glassTrans
  );
  plastic.position.set(13.5, 2.1, -2);
  group.add(plastic);

  // Study — interior garden (small tree)
  addTree(group, 22, 0, -2, materials, 1.6);

  // Atelier — interior garden
  addTree(group, -28, 0, 4, materials, 1.4);

  // Meditation — pods (capsules)
  [[ 13, 14 ], [ 17, 11 ], [ 21, 16 ]].forEach(([px, pz]) => {
    const pod = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.8, 1.2, 6, 12),
      materials.wallWhite
    );
    pod.position.set(px, 1.4, pz);
    group.add(pod);
  });

  // Main Lounge — puffs (sunken seating cylinders)
  for (let i = 0; i < 6; i++) {
    const px = -13 + (Math.random() - 0.5) * 10;
    const pz = (Math.random() - 0.5) * 8;
    const puff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.4, 16),
      materials.puff
    );
    puff.position.set(px, 0.22, pz);
    group.add(puff);
  }

  // Trees in spa
  addTree(group, -4, 0, 16, materials, 1.3);
  addTree(group, -14, 0, 22, materials, 1.5);

  return group;
}

// ---------- Curved interior wall ----------
function buildCurvedWall(group, materials) {
  // A long organic wall threading through the plan as a divider/visual element.
  const pts = [
    new THREE.Vector3(-32, 0, -8),
    new THREE.Vector3(-22, 0, -4),
    new THREE.Vector3(-14, 0, -8),
    new THREE.Vector3( -6, 0,  6),
    new THREE.Vector3(  4, 0,  9),
    new THREE.Vector3( 12, 0,  4),
    new THREE.Vector3( 18, 0,  8),
    new THREE.Vector3( 28, 0,  6),
    new THREE.Vector3( 32, 0, -2),
  ];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const segments = 120;
  const samples = curve.getPoints(segments);
  // Build a thin extruded strip following the curve
  const shape = new THREE.Shape();
  const halfT = 0.12;
  shape.moveTo(-halfT, 0);
  shape.lineTo(halfT, 0);
  shape.lineTo(halfT, 3.0);
  shape.lineTo(-halfT, 3.0);
  shape.lineTo(-halfT, 0);

  // Instead of ExtrudeGeometry along curve (complex), build small boxes along samples
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    const len = a.distanceTo(b);
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(len + 0.02, 3.0, 0.18),
      materials.curvedConcrete
    );
    seg.position.set((a.x + b.x) / 2, 1.5, (a.z + b.z) / 2);
    seg.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    group.add(seg);
  }
}

// ---------- Helical stair ----------
function buildHelicalStair(group, x, z, materials) {
  const turns = 1.5;
  const steps = 22;
  const radius = 1.8;
  const totalHeight = 6.0; // goes from underground floor up to ground level
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const y = t * totalHeight;
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.12, 0.6),
      materials.curvedConcrete
    );
    step.position.set(
      x + Math.cos(angle) * radius,
      y + 0.06,
      z + Math.sin(angle) * radius
    );
    step.rotation.y = -angle;
    group.add(step);
  }
  // Central column
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, totalHeight, 16),
    materials.curvedConcrete
  );
  column.position.set(x, totalHeight / 2, z);
  group.add(column);

  // Glowing marker on bottom step (interaction zone)
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 2.4, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd180, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.set(x, 0.03, z);
  group.add(marker);
}

// ---------- Skylights / zenithal openings ----------
function buildSkylights(group, materials) {
  const positions = [
    { x: 0,   z: 0,   r: 1.2 }, // over access
    { x: -10, z: 18,  r: 1.6 }, // over spa
    { x: 20,  z: -2,  r: 1.4 }, // over study
    { x: -22, z: -14, r: 1.0 }, // over dance
    { x: 17,  z: 14,  r: 1.0 }, // over meditation
    { x: -28, z: 4,   r: 0.9 }, // over atelier
    { x: -13, z: 0,   r: 1.2 }, // over main lounge
  ];
  positions.forEach(p => {
    // Cylindrical light well punching through ceiling
    const well = new THREE.Mesh(
      new THREE.CylinderGeometry(p.r, p.r, 1.2, 32, 1, true),
      materials.wallWhite
    );
    well.position.set(p.x, LAYOUT.ceilingHeight + 0.4, p.z);
    group.add(well);
    // Top disk (sky)
    const top = new THREE.Mesh(
      new THREE.CircleGeometry(p.r, 32),
      new THREE.MeshBasicMaterial({ color: 0xeaf2ff })
    );
    top.rotation.x = Math.PI / 2;
    top.position.set(p.x, LAYOUT.ceilingHeight + 0.95, p.z);
    group.add(top);
    // Glowing oculus disk inside the room (just below ceiling) so the opening
    // reads from underneath without needing to CSG-cut the ceiling.
    const oculus = new THREE.Mesh(
      new THREE.CircleGeometry(p.r * 0.95, 32),
      new THREE.MeshBasicMaterial({ color: 0xf4faff })
    );
    oculus.rotation.x = Math.PI / 2;
    oculus.position.set(p.x, LAYOUT.ceilingHeight - 0.02, p.z);
    group.add(oculus);
    // Light beam: spotlight pointing down
    const spot = new THREE.SpotLight(0xeaf2ff, 6, 18, Math.PI / 6, 0.6, 1.2);
    spot.position.set(p.x, LAYOUT.ceilingHeight + 0.8, p.z);
    spot.target.position.set(p.x, 0, p.z);
    group.add(spot);
    group.add(spot.target);
    // Soft floor pool of light (decal)
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(p.r * 1.6, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(p.x, 0.03, p.z);
    group.add(pool);
  });
}

// ---------- Trees ----------
function addTree(group, x, y, z, materials, scale = 1.0) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 1.6 * scale, 8),
    materials.bark
  );
  trunk.position.set(x, y + 0.8 * scale, z);
  group.add(trunk);

  for (let i = 0; i < 3; i++) {
    const r = (0.7 + Math.random() * 0.3) * scale;
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(r, 12, 8),
      materials.foliage
    );
    canopy.position.set(
      x + (Math.random() - 0.5) * 0.5 * scale,
      y + (1.6 + i * 0.4) * scale,
      z + (Math.random() - 0.5) * 0.5 * scale
    );
    group.add(canopy);
  }
}

// ---------- Ground floor (park) ----------
export function buildGround(materials) {
  const group = new THREE.Group();
  const B = LAYOUT.bounds;
  const W = B.maxX - B.minX;
  const D = B.maxZ - B.minZ;
  const cx = (B.minX + B.maxX) / 2;
  const cz = (B.minZ + B.maxZ) / 2;

  // Park surface (gray stone with grass patches)
  const stone = new THREE.Mesh(
    new THREE.PlaneGeometry(W + 20, D + 20),
    materials.floorStone
  );
  stone.rotation.x = -Math.PI / 2;
  stone.position.set(cx, 0.01, cz);
  group.add(stone);

  // Grass patches (5 organic blobs as flattened ellipses)
  const grassPatches = [
    { x: -22, z: -16, rx: 8, rz: 6 },
    { x: 20,  z: -14, rx: 7, rz: 6 },
    { x: -20, z: 18,  rx: 9, rz: 7 },
    { x: 18,  z: 16,  rx: 8, rz: 7 },
    { x: 0,   z: 24,  rx: 12, rz: 4 },
  ];
  grassPatches.forEach(p => {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(1, 32),
      materials.grass
    );
    patch.scale.set(p.rx, p.rz, 1);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(p.x, 0.02, p.z);
    group.add(patch);
  });

  // Main access hill (4.5m) — flattened sphere with grass
  const mainHill = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.hill
  );
  mainHill.scale.set(1, 0.45, 1);
  mainHill.position.set(LAYOUT.stair.x, 0, LAYOUT.stair.z);
  group.add(mainHill);

  // Opening on top of main hill — visible portal down to stairs
  const portal = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 2.6, 32),
    new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide })
  );
  portal.rotation.x = -Math.PI / 2;
  portal.position.set(LAYOUT.stair.x, 4.5, LAYOUT.stair.z);
  group.add(portal);
  // Interaction marker on hilltop
  const hillMarker = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 3.0, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd180, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  hillMarker.rotation.x = -Math.PI / 2;
  hillMarker.position.set(LAYOUT.stair.x, 4.52, LAYOUT.stair.z);
  group.add(hillMarker);

  // 4 emergency exit hills (3.5m)
  const exitHills = [
    { x: -28, z: -18 },
    { x:  28, z: -22 },
    { x: -30, z:  18 },
    { x:  30, z:  20 },
  ];
  exitHills.forEach(h => {
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      materials.hill
    );
    hill.scale.set(1, 0.55, 1);
    hill.position.set(h.x, 0, h.z);
    group.add(hill);
  });

  // Water fountain — curvilinear pools (sequence of ellipses)
  const fountainPath = [
    { x: -22, z: 8, rx: 3.5, rz: 2 },
    { x: -12, z: 5, rx: 4, rz: 2.5 },
    { x: -4, z: 9, rx: 3, rz: 2 },
    { x: 6, z: 6, rx: 4, rz: 2.5 },
    { x: 16, z: 9, rx: 3.5, rz: 2 },
    { x: 26, z: 6, rx: 3, rz: 2 },
  ];
  fountainPath.forEach(p => {
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(1, 32),
      materials.water
    );
    water.scale.set(p.rx, p.rz, 1);
    water.rotation.x = -Math.PI / 2;
    water.position.set(p.x, 0.04, p.z);
    group.add(water);
    // raised concrete edge
    const edgeGeom = new THREE.RingGeometry(0.97, 1.03, 48);
    const edge = new THREE.Mesh(edgeGeom, materials.curvedConcrete);
    edge.scale.set(p.rx, p.rz, 1);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(p.x, 0.05, p.z);
    group.add(edge);
  });

  // Trees around perimeter
  const treePositions = [
    [-34, -22], [-30, -10], [-32, 0], [-34, 12], [-30, 24],
    [-15, -24], [0, -25], [15, -24],
    [34, -20], [36, -8], [36, 4], [34, 16], [30, 26],
    [-10, 26], [10, 26], [22, 24],
  ];
  treePositions.forEach(([tx, tz]) => addTree(group, tx, 0, tz, materials, 1.6 + Math.random() * 0.5));

  // Sky dome
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(200, 24, 16),
    materials.sky
  );
  group.add(sky);

  return group;
}
