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
  [[-44, -22], [-32, -18], [-22, -22], [-10, -16], [ 2, -20], [16, -16], [28, -22], [42, -18]],
  // Center horizontal through the access hill area
  [[-46,   8], [-30,   4], [-16,  10], [ -4,   6], [ 10,  10], [24,   6], [40,  10]],
  // S edge meander
  [[-50,  48], [-34,  44], [-20,  50], [ -6,  46], [ 10,  50], [26,  46], [46,  50]],
  // Diagonals
  [[-30,  12], [-22,  24], [-14,  30], [-6,  36]],
  [[ 14,  24], [ 22,  30], [ 30,  36], [ 38,  30]],
];

/**
 * Trees in the park — read from Plan 50.
 */
export const PARK_TREES = [
  [-44, -28], [-26, -32], [-12, -32], [  4, -34], [ 18, -32], [ 32, -34], [ 44, -30],
  [-50, -10], [-50,  10], [-50,  28], [-54,  46],
  [ 50, -20], [ 52,   0], [ 52,  18], [ 52,  34],
  [-30,   0], [-14,  -4], [ 10,  -2], [ 22,   8], [ 36,  20],
  [-20,  48], [-4,  52], [ 14,  48], [ 30,  52], [ 44,  46],
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
 * Positioned under skylights as in Perspectives 06/07/09.
 */
export const GLASS_GARDENS = [
  { x:   3, z:  -1, radius: 2.4, height: 4.4, treeScale: 2.2 }, // central, by stair
  { x:  28, z:  -6, radius: 2.0, height: 4.0, treeScale: 1.8 }, // study
  { x: -30, z:  18, radius: 1.8, height: 3.8, treeScale: 1.6 }, // atelier
  { x:  16, z:  12, radius: 1.4, height: 3.6, treeScale: 1.3 }, // meditation
];

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
