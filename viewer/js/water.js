import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

/**
 * Build a Three.js Water mesh (animated normal-mapped surface with
 * planar reflections) along a Catmull-Rom polyline. Returns an Object3D
 * containing one Water tile per curve segment.
 */
export function buildWaterRibbon(path, sun, normalsTex, opts = {}) {
  const width = opts.width ?? 1.5;
  const group = new THREE.Group();
  const v3 = path.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(v3, false, 'catmullrom', 0.5);
  const samples = curve.getPoints(Math.max(40, path.length * 8));

  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    const len = a.distanceTo(b);
    if (len < 0.05) continue;
    const angle = -Math.atan2(b.z - a.z, b.x - a.x);

    const geom = new THREE.PlaneGeometry(len + 0.04, width, 1, 1);
    const water = new Water(geom, {
      textureWidth: 256,
      textureHeight: 256,
      waterNormals: normalsTex,
      sunDirection: sun.position.clone().normalize(),
      sunColor: 0xffffff,
      waterColor: 0x4fa3b3,
      distortionScale: 1.4,
      fog: false,
      alpha: 0.95,
    });
    water.rotation.x = -Math.PI / 2;
    water.position.set((a.x + b.x) / 2, opts.y ?? 0.13, (a.z + b.z) / 2);
    // Plane is in XY so rotation.x already lays it flat; we need Y rotation
    // applied after lay-flat — use a parent for clean composition.
    const holder = new THREE.Group();
    holder.position.copy(water.position);
    water.position.set(0, 0, 0);
    holder.rotation.y = angle;
    holder.add(water);
    group.add(holder);
  }
  return group;
}

/**
 * Pool of water (elliptical, single Water mesh) for the spa.
 */
export function buildWaterPool({ x, z, rx, rz, rot = 0 }, sun, normalsTex, y = 0.05) {
  // Build a circle-segment plane approximating the ellipse via a CircleGeometry
  // scaled to ellipse aspect ratio.
  const geom = new THREE.CircleGeometry(1, 48);
  const water = new Water(geom, {
    textureWidth: 256,
    textureHeight: 256,
    waterNormals: normalsTex,
    sunDirection: sun.position.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x4fa3b3,
    distortionScale: 1.0,
    fog: false,
    alpha: 0.95,
  });
  water.rotation.x = -Math.PI / 2;
  water.scale.set(rx, rz, 1);
  water.rotation.z = rot;
  water.position.set(x, y, z);
  return water;
}
