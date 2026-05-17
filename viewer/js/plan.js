/**
 * Data tables traced (approximately) from the original drawings:
 *   Illustration 50 — Ground Floor Plan (esc 1:500)
 *   Illustration 52 — Underground Floor Plan (esc 1:500)
 *
 * Coordinate system:
 *   X: -west … +east  (top edge of plan is X axis)
 *   Z: -north … +south
 *   All values in meters at 1:1.
 *
 * The site is an irregular quadrilateral:
 *   top edge   93.40 m (north)
 *   right edge 78.99 m
 *   bottom edge 113.80 m (south, Steyrergasse)
 *   left edge  98.44 m
 *
 * The four corners are approximately (counter-clockwise from NE):
 */
export const SITE_OUTLINE = [
  [  46, -39 ],  // NE
  [ -46, -39 ],  // NW
  [ -57,  60 ],  // SW
  [  57,  40 ],  // SE
];

export const CEILING_HEIGHT = 5.0;
export const UNDERGROUND_DEPTH = 6.0;

/**
 * Skylight openings — these are the gray ellipses scattered across the
 * ground plan. Each one is a real hole that punches through the park
 * surface AND through the underground ceiling, so daylight falls into
 * the rooms below.
 */
export const SKYLIGHTS = [
  // Northwest cluster
  { x: -30, z: -28, rx: 1.8, rz: 1.2, rot: 0.2 },
  { x: -18, z: -22, rx: 1.5, rz: 1.0, rot: -0.3 },
  { x: -32, z: -10, rx: 2.0, rz: 1.4, rot: 0.5 },
  // North cluster (dance/yoga)
  { x:  -8, z: -26, rx: 1.6, rz: 1.1, rot: 0.0 },
  { x:   6, z: -28, rx: 1.4, rz: 1.0, rot: 0.4 },
  // Northeast cluster (admin)
  { x:  22, z: -28, rx: 2.0, rz: 1.3, rot: -0.2 },
  { x:  36, z: -20, rx: 1.6, rz: 1.0, rot: 0.3 },
  // Central oculus over access (the big one, over helical stair)
  { x:   3, z:  -1, rx: 3.2, rz: 2.4, rot: 0.0, big: true },
  // East / study area
  { x:  28, z:  -6, rx: 2.4, rz: 1.7, rot: 0.2 },
  { x:  40, z:   6, rx: 1.6, rz: 1.1, rot: -0.4 },
  { x:  30, z:  18, rx: 2.0, rz: 1.4, rot: 0.3 },
  // West / atelier
  { x: -42, z:  10, rx: 1.8, rz: 1.2, rot: -0.2 },
  { x: -30, z:  18, rx: 2.4, rz: 1.7, rot: 0.0 },
  // Spa (south) — these are large because the spa wants the most light
  { x: -22, z:  38, rx: 3.0, rz: 2.0, rot: 0.4 },
  { x:  -8, z:  44, rx: 3.4, rz: 2.2, rot: -0.2 },
  { x:   6, z:  38, rx: 2.6, rz: 1.8, rot: 0.3 },
  // Southeast
  { x:  26, z:  30, rx: 2.0, rz: 1.4, rot: -0.3 },
  { x:  40, z:  26, rx: 1.6, rz: 1.1, rot: 0.2 },
  // Southwest
  { x: -48, z:  40, rx: 1.6, rz: 1.1, rot: 0.0 },
  // Meditation cluster
  { x:  16, z:  12, rx: 1.4, rz: 1.0, rot: 0.5 },
];

/**
 * Hills (above-ground topography). Reading the topographic contour
 * lines in Illustration 50. Heights are peak elevation in meters.
 */
export const HILLS = [
  { x:   2, z:  -1, radius: 11, height: 4.5 },  // main access hill (over stair)
  { x: -28, z: -22, radius: 6,  height: 3.5 },
  { x:  28, z: -25, radius: 6,  height: 3.5 },
  { x: -36, z:  22, radius: 7,  height: 3.5 },
  { x:  32, z:  16, radius: 6,  height: 3.5 },
  { x:   8, z:  44, radius: 8,  height: 3.5 },
];

/**
 * Helical stair — center of the building, the access point.
 */
export const STAIR = { x: 2, z: -1, radius: 2.2 };

/**
 * Water fountain — curvilinear channels in the park.
 * Each entry is a polyline that gets thickened into a water ribbon.
 */
export const FOUNTAIN_PATHS = [
  // NW → NE meandering across the top
  [[-44, -22], [-36, -16], [-26, -22], [-16, -14], [-4, -18], [8, -14], [20, -20], [32, -14], [44, -18]],
  // Center horizontal — undulating
  [[-50,   6], [-38,  10], [-26,   2], [-14,   8], [ -2,  4], [10,  10], [22,  4], [34, 10], [46,  6]],
  // S edge meander
  [[-52,  46], [-38,  50], [-24,  44], [-12,  52], [  2,  46], [16,  52], [28,  46], [40, 52], [52, 48]],
  // Diagonals connecting layers
  [[-30,  12], [-22,  20], [-16,  28], [-8, 36], [-2,  44]],
  [[ 14,  20], [ 20,  28], [ 26,  36], [ 32,  42], [ 38, 50]],
  [[-22, -10], [-18,   0], [-22,  14]],
  [[ 18, -10], [ 22,   2], [ 18,  16]],
];

/**
 * Diagonal paving stripe count + angle (Plan 50 shows ~10 stripes at ~30°)
 */
export const PAVING = {
  stripes: 14,
  angle: Math.PI * 0.18,
  width: 0.6,
};

/**
 * Trees in the park — read from Plan 50.
 */
export const PARK_TREES = [
  [-44, -28], [-26, -32], [-12, -32], [  4, -34], [ 18, -32], [ 32, -34], [ 44, -30],
  [-50, -10], [-50,  10], [-50,  28], [-54,  46],
  [ 50, -20], [ 52,   0], [ 52,  18], [ 52,  34],
  [-30,   0], [-14,  -4], [ 10,  -2], [ 22,   8], [ 36,  20],
  [-20,  48], [-4,  52], [ 14,  48], [ 30,  52], [ 44,  46],
  [-36, -10], [-12,  12], [  4,  20], [ 16, -2], [ 28, 12],
];

/**
 * Spa pools (within zone 6, in the south). Traced from Plan 52.
 */
export const SPA_POOLS = [
  { x: -22, z: 38, rx: 3.4, rz: 2.0, rot:  0.3 },
  { x: -10, z: 44, rx: 4.2, rz: 2.4, rot: -0.4 },
  { x:   3, z: 40, rx: 3.0, rz: 2.2, rot:  0.5 },
  { x:  -2, z: 50, rx: 2.4, rz: 1.6, rot:  0.0 },
];

/**
 * Sauna modules — wooden boxes in spa zone.
 */
export const SAUNAS = [
  { x: -26, z: 44, w: 3.2, d: 2.6 },
  { x:  10, z: 46, w: 2.8, d: 2.4 },
];

/**
 * Mushroom columns — distributed structural columns.
 */
export const COLUMNS = [
  [-30, -12], [-18,  -6], [-10,   6], [ -2,  -8], [  8,   2],
  [ 16, -10], [ 24,   4], [ 32, -10], [ 24,  18], [ 36,  20],
  [-28,  10], [-14,  22], [  0,  18], [  14,  30], [ -22,  30],
];

/**
 * Glass garden cylinders — tall transparent enclosures with trees.
 * Positioned under the skylights (Perspectives 06/07/09). 13 trees in
 * the underground, one under each skylight EXCEPT the central one
 * (which is the elevator).
 */
export const GLASS_GARDENS = [
  // NW / dance / yoga
  { x: -30, z: -28, radius: 1.4, height: 3.6, treeScale: 1.3 },
  { x: -18, z: -22, radius: 1.2, height: 3.4, treeScale: 1.1 },
  { x:  -8, z: -26, radius: 1.3, height: 3.5, treeScale: 1.2 },
  // North / admin
  { x:  22, z: -28, radius: 1.6, height: 3.8, treeScale: 1.5 },
  // East / study
  { x:  28, z:  -6, radius: 2.0, height: 4.0, treeScale: 1.8 },
  { x:  30, z:  18, radius: 1.6, height: 3.8, treeScale: 1.5 },
  // West / atelier
  { x: -42, z:  10, radius: 1.4, height: 3.6, treeScale: 1.3 },
  { x: -30, z:  18, radius: 1.8, height: 3.8, treeScale: 1.6 },
  // South / spa
  { x: -22, z:  38, radius: 2.4, height: 4.2, treeScale: 2.0 },
  { x:  -8, z:  44, radius: 2.6, height: 4.4, treeScale: 2.2 },
  { x:   6, z:  38, radius: 2.0, height: 4.0, treeScale: 1.8 },
  // SE
  { x:  26, z:  30, radius: 1.6, height: 3.8, treeScale: 1.5 },
  // Meditation
  { x:  16, z:  12, radius: 1.4, height: 3.6, treeScale: 1.3 },
];

/**
 * Elevator shaft — at the center of the helical stair (replaces the
 * central tree garden).
 */
export const ELEVATOR = {
  x: STAIR.x, z: STAIR.z,
  width: 2.2, depth: 2.2, height: 5.0,
};

/**
 * Sunken lounge pits — in the main lounge floor (Perspective 06).
 */
export const LOUNGE_PITS = [
  { x: -14, z:   2, rx: 2.4, rz: 1.4, rot:  0.2 },
  { x:  -6, z:   8, rx: 2.0, rz: 1.3, rot: -0.3 },
  { x: -18, z:  -6, rx: 1.6, rz: 1.0, rot:  0.4 },
];

/**
 * Meditation pods — capsule shells scattered through the plan.
 */
export const MED_PODS = [
  [-14, 14], [-10, 18], [16, 14], [20, 10], [18, 18], [22, -10], [-2, 12],
];

/**
 * Study tables (zone 8) — small disks suggesting work surfaces.
 */
export const STUDY_TABLES = [
  [16, -4], [22, -6], [20, -10], [26, -2], [22, 0], [16, 4],
  [22, 18], [26, 22], [30, 18],
];

/**
 * Room zone labels — for the proximity-based "current room" UI.
 * Each entry: rectangular bounding zone (axis-aligned) that triggers a label.
 */
export const ROOM_ZONES = [
  { id: 'access',      n: 1,  label: 'Access',             cx:   2, cz:  -1, w:  8, d:  8 },
  { id: 'main_lounge', n: 2,  label: 'Main Lounge',        cx: -10, cz:   2, w: 20, d: 18 },
  { id: 'dance',       n: 3,  label: 'Dance Area',         cx: -28, cz: -20, w: 24, d: 18 },
  { id: 'yoga',        n: 4,  label: 'Yoga',               cx:  -4, cz: -26, w: 14, d: 10 },
  { id: 'atelier',     n: 5,  label: 'Atelier',            cx: -34, cz:  14, w: 16, d: 18 },
  { id: 'spa',         n: 6,  label: 'Spa',                cx: -10, cz:  42, w: 38, d: 18 },
  { id: 'meditation',  n: 7,  label: 'Meditation Lounge',  cx:  18, cz:  14, w: 14, d: 14 },
  { id: 'study',       n: 8,  label: 'Study Area',         cx:  24, cz:  -4, w: 20, d: 18 },
  { id: 'admin',       n: 9,  label: 'Administration',     cx:  28, cz: -25, w: 20, d: 12 },
  { id: 'technical',   n: 10, label: 'Technical Area',     cx:  42, cz: -28, w: 12, d: 12 },
];

export const SPAWN = { x: -6, y: 1.65, z: 2 };

/**
 * Interior partition walls — traced from Illustration 52.
 * Each entry is a Catmull-Rom polyline that becomes a curved wall.
 * Use gaps (door openings) by breaking the polyline into segments.
 */
export const INTERIOR_WALLS = [
  // Spa enclosure (south, curving around the pools)
  [[-30,  30], [-26,  36], [-22,  46], [-12,  54], [  0,  56], [ 14,  54], [ 22,  50], [ 26,  40], [ 22,  30], [ 14,  28]],
  // Atelier enclosure (mid-west)
  [[-44,   6], [-40,  16], [-32,  24], [-22,  20], [-20,  10], [-26,   0], [-38,  -2]],
  // Yoga / dance partition (NW)
  [[-44, -32], [-32, -28], [-22, -32], [-14, -26], [-6, -28]],
  // Yoga north wall
  [[ -10, -30], [ -4, -32], [  4, -30], [  8, -22]],
  // Admin area
  [[ 14, -32], [ 22, -30], [ 32, -32], [ 36, -22], [ 30, -16]],
  // Study east enclosure
  [[ 10, -10], [ 14,  -2], [ 22,   6], [ 30,  10], [ 36,   2], [ 38, -10], [ 34, -18]],
  // Meditation south-east
  [[ 14,  18], [ 22,  22], [ 28,  16], [ 24,   8], [ 14,  10]],
  // Curved bench-wall around main lounge (south side)
  [[-22,  14], [-14,  18], [ -6,  14], [  6,  16], [ 14,  12]],
];

/**
 * Furniture: dining/work tables (already in STUDY_TABLES) + chairs around them.
 * Each chair is a position + rotation facing the nearest table.
 */
export const CHAIRS = [
  // Around study tables — 4-5 per table cluster
  { x: 14.5, z: -4, rot:  Math.PI },
  { x: 17.5, z: -4, rot:  0 },
  { x: 16, z: -2.5, rot: -Math.PI/2 },
  { x: 16, z: -5.5, rot:  Math.PI/2 },
  { x: 21, z: -7, rot:  Math.PI/2 },
  { x: 23, z: -7, rot: -Math.PI/2 },
  { x: 22, z: -5, rot:  0 },
  { x: 22, z: -9, rot:  Math.PI },
  { x: 19, z: -10, rot:  Math.PI/2 },
  { x: 21, z: -10, rot: -Math.PI/2 },
  { x: 25, z: -1, rot:  Math.PI/2 },
  { x: 27, z: -3, rot: -Math.PI/2 },
  { x: 21, z:  1, rot:  -Math.PI/2 },
  { x: 22, z:  17, rot: Math.PI },
  { x: 22, z:  19, rot: 0 },
  { x: 26, z:  21, rot: Math.PI },
  { x: 28, z:  23, rot: 0 },
];

/**
 * Reception desk position (curved counter at access zone).
 */
export const RECEPTION = { x: -4, z: 4, radius: 3.2, angle: Math.PI * 0.5 };

/**
 * Bookshelves along walls — tall thin units.
 */
export const BOOKSHELVES = [
  { x:  36, z:  -8, w: 0.5, d: 3.0, rot: -Math.PI / 2 },
  { x:  36, z:  -2, w: 0.5, d: 3.0, rot: -Math.PI / 2 },
  { x:  36, z:   6, w: 0.5, d: 3.0, rot: -Math.PI / 2 },
  { x: -42, z:  10, w: 3.0, d: 0.5, rot: 0 },
  { x: -42, z:  16, w: 3.0, d: 0.5, rot: 0 },
];

/**
 * Interior potted plants — scattered through underground.
 */
export const INTERIOR_PLANTS = [
  [-12,  -8], [ -4,  -2], [  6,  -4], [ 14,   0], [ 20,  4],
  [-22,  -8], [-30,   2], [-26,  14], [-18,  24], [-8,  28],
  [ 12,  20], [ 22,  12], [ 28,  20], [ 34,  -2], [ 40, -14],
  [ -2,  20], [  8,  26], [ 18,  32], [-14,  36], [ -6,  42],
];

/**
 * Sofas / curved benches — long lounge seating.
 */
export const SOFAS = [
  { x: -16, z:   8, w: 4, d: 1, rot:  0.2 },
  { x:  -8, z:  12, w: 3, d: 1, rot: -0.3 },
  { x:  14, z:  16, w: 3, d: 1, rot:  0.5 },
  { x:  -2, z:  -8, w: 3, d: 1, rot: -0.2 },
  { x:  26, z:   2, w: 3, d: 1, rot:  0.7 },
];

/**
 * Dance area mirror wall (reflective panel, NW).
 */
export const DANCE_MIRROR = { x: -36, z: -18, w: 12, h: 3.4, rot: 0.2 };
