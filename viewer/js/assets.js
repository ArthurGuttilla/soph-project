import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

/**
 * Centralised asset loader with a single LoadingManager so the start
 * screen can show real progress.
 *
 * Falls back gracefully if a file is missing — the caller can `await`
 * and the procedural defaults take over.
 */

export const manager = new THREE.LoadingManager();

let onProgressCb = null;
manager.onProgress = (url, loaded, total) => {
  if (onProgressCb) onProgressCb(loaded, total, url);
};
export function onProgress(cb) { onProgressCb = cb; }

const textureLoader = new THREE.TextureLoader(manager);
const rgbeLoader = new RGBELoader(manager);

export function loadColorTexture(url, { repeat = [1, 1], anisotropy = 16 } = {}) {
  return new Promise((resolve) => {
    textureLoader.load(
      url,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeat[0], repeat[1]);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = anisotropy;
        resolve(tex);
      },
      undefined,
      () => resolve(null),  // missing → null, caller falls back
    );
  });
}

export function loadDataTexture(url, { repeat = [1, 1], anisotropy = 16 } = {}) {
  return new Promise((resolve) => {
    textureLoader.load(
      url,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeat[0], repeat[1]);
        tex.anisotropy = anisotropy;
        // Linear (not sRGB) for normal/roughness/ao maps
        resolve(tex);
      },
      undefined,
      () => resolve(null),
    );
  });
}

export function loadHDR(url) {
  return new Promise((resolve) => {
    rgbeLoader.load(
      url,
      (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        resolve(tex);
      },
      undefined,
      () => resolve(null),
    );
  });
}

/**
 * Load a PBR set (diffuse + bump/normal + roughness). Returns an object
 * of textures, with nulls for slots that failed to load.
 */
export async function loadPbrSet({ diffuse, bump, normal, roughness, ao, repeat = [4, 4] }) {
  const [d, b, n, r, a] = await Promise.all([
    diffuse  ? loadColorTexture(diffuse, { repeat }) : Promise.resolve(null),
    bump     ? loadDataTexture(bump,    { repeat }) : Promise.resolve(null),
    normal   ? loadDataTexture(normal,  { repeat }) : Promise.resolve(null),
    roughness? loadDataTexture(roughness, { repeat }) : Promise.resolve(null),
    ao       ? loadDataTexture(ao,      { repeat }) : Promise.resolve(null),
  ]);
  return { diffuse: d, bump: b, normal: n, roughness: r, ao: a };
}
