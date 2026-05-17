import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/**
 * First-person controller with simple AABB collision against meshes
 * marked `userData.collidable = true`.
 */
export class FPController {
  constructor(camera, domElement, getCollidables) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);
    this.getCollidables = getCollidables;

    this.keys = { forward: false, back: false, left: false, right: false };
    this.velocity = new THREE.Vector3();
    this.speed = 6.0;
    this.radius = 0.4;
    this.eyeHeight = 1.65;

    this.onInteract = null;

    document.addEventListener('keydown', (e) => this._key(e, true));
    document.addEventListener('keyup', (e) => this._key(e, false));
  }

  _key(e, down) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward = down; break;
      case 'KeyS': case 'ArrowDown':  this.keys.back = down; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left = down; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = down; break;
      case 'KeyE': case 'Enter':
        if (down && this.onInteract) this.onInteract();
        break;
    }
  }

  lock() { this.controls.lock(); }

  update(dt) {
    if (!this.controls.isLocked) return;

    const forward = (this.keys.forward ? 1 : 0) - (this.keys.back ? 1 : 0);
    const right = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);

    // Build movement vector in world space
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();
    const strafe = new THREE.Vector3(-dir.z, 0, dir.x);

    const move = new THREE.Vector3();
    move.addScaledVector(dir, forward);
    move.addScaledVector(strafe, right);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(this.speed * dt);

    // X then Z with collision
    const pos = this.camera.position;
    const tryX = pos.clone(); tryX.x += move.x;
    if (!this._collides(tryX)) pos.x = tryX.x;
    const tryZ = pos.clone(); tryZ.z += move.z;
    if (!this._collides(tryZ)) pos.z = tryZ.z;

    // Lock eye height to whatever the level expects
    pos.y = this.eyeHeight + (this.floorY ?? 0);
  }

  _collides(pos) {
    const collidables = this.getCollidables();
    const r = this.radius;
    for (const m of collidables) {
      if (!m.geometry?.boundingBox) m.geometry?.computeBoundingBox();
      const bb = new THREE.Box3().setFromObject(m);
      // Inflate by radius then check XZ inclusion at camera Y
      if (pos.x > bb.min.x - r && pos.x < bb.max.x + r &&
          pos.z > bb.min.z - r && pos.z < bb.max.z + r &&
          pos.y > bb.min.y && pos.y < bb.max.y) {
        return true;
      }
    }
    return false;
  }
}
