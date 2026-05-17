# The Inner Center — 3D Visualizer

A browser-based first-person walkthrough of *The Inner Center* (Sophia Valerio, TFG FAU Mackenzie + Architettura Ferrara, 2021) — a subterranean wellbeing center in Graz, Austria.

Built with vanilla Three.js (loaded via CDN ESM). No build step, no `npm install`.

## Run

```bash
cd viewer
python3 -m http.server 8080
# or: npx http-server . -p 8080
```

Open <http://localhost:8080>.

## Controls

| Key | Action |
|---|---|
| `W A S D` / Arrows | Move |
| Mouse | Look around |
| `E` / `Enter` | Use helical stairs (when near them) |
| `Esc` | Release the mouse |

## What's in the viewer

**Underground (-6.00 m, 5.00 m ceiling)** — the 12 programmed spaces:
1. Access · 2. Main Lounge · 3. Dance Area · 4. Yoga · 5. Atelier · 6. Spa
· 7. Meditation Lounge · 8. Study Area · 9. Administration · 10. Technical Area
· 11. WC (×4) · 12. Emergency Exits

Key spatial features represented:
- Ribbed wood ceiling (warm 3000K interior light)
- Zenithal skylight cylinders with cool 6500K beams cutting through
- Organic curved interior wall (concrete) threading through the plan
- Helical access stair at center
- Spa: three pools, sauna modules, semi-translucent fabric divider, porous white marble floor
- Study Area: stretched-plastic translucent panel, interior garden
- Dance Area: acoustic-foam walls, ballet barre
- Meditation: individual capsule pods
- Main Lounge: scattered sunken puffs

**Ground (Park)** — the public space above:
- Main access hill (4.5 m) with portal down to the helical stair
- Four emergency-exit hills (3.5 m)
- Curvilinear water fountain across the plan
- Dark grey stone floor with light line stripes (railway reference)
- Grass patches, perimeter trees, sky dome

## File layout

```
viewer/
  index.html
  js/
    main.js        - scene init, levels, minimap, animation loop
    geometry.js    - layout + all room/feature meshes
    materials.js   - procedural canvas textures + materials
    controls.js    - first-person controller with AABB collision
```

Textures are generated procedurally on canvas — no external assets needed.

## Layout reference

Room positions live in `viewer/js/geometry.js` under `LAYOUT.rooms` (centers and sizes in meters). Tune those to refine the plan. Wall openings between rooms are defined per-room in the `gaps` table just below.

## Known simplifications (v1.0)

- Hills are flattened hemispheres, not true heightmaps
- The organic curved wall is sampled-segment, not a single extrusion
- Helical stair geometry is segmented blocks, not a smooth ribbon
- Skylight openings are visual approximations (no CSG cut into the ceiling plane)
- Mobiliary and parametric CLT/cone-node structure are not modeled

See PRD §12 for the v1.5+ roadmap.
