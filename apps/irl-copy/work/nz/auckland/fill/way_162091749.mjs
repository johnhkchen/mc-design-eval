// Way 162091749: a three-storey reinforced-concrete office and shop block of the 1960s-70s, stepped down to a
// single-storey shop wing on the low side. The lidar roof gives four flat tiers (tops at y 6, 10, 12, 14); the storey
// lines are floor bands on y 2, 6, 10, the window zone is two blocks between them and a spandrel closes each storey.
// The walls are a one-block skin with air behind the glass and a floor slab per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091749.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..42, z 0..40

const g = new Voxels([43, 27, 41]);
const key = (x, z) => `${x},${z}`;
const ground = new Map(), roof = new Map();
for (const [x, z, gr, r] of cells) { ground.set(key(x, z), gr); roof.set(key(x, z), r); }
const has = (x, z) => ground.has(key(x, z));
const FLOORS = [2, 6, 10, 14];                                       // storey lines on the absolute grid
const NORMALS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];

// Roof tiers: the 5x5 median of the lidar roof over footprint cells, quantised to four flat tops.
const tier = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (has(x + dx, z + dz)) vals.push(roof.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  tier.set(key(x, z), m <= 7.5 ? 6 : m <= 10.5 ? 10 : m <= 12.5 ? 12 : 14);
}
const T = (x, z) => tier.get(key(x, z));

// Open faces of a column cell at height y: off the footprint, or above the neighbour's roof (a setback).
const exposed = (x, z, y) => NORMALS.filter(([dx, dz]) => !has(x + dx, z + dz) || y >= T(x + dx, z + dz));
// Position along a face (z on east/west faces, x on north/south): sets the bay rhythm.
const along = (x, z, [dx]) => (dx !== 0 ? z : x);

// Pass 1: foundation to the ground, base course to y 2, then storeys, spandrels and roof caps.
for (const [x, z, gr] of cells) {
  const t = T(x, z);
  for (let y = 0; y < 2; y++) g.set(x, y, z, y < gr ? "stone" : "stone_bricks");
  for (let y = 2; y < t; y++) {
    const ex = exposed(x, z, y);
    const open = ex.length > 0;
    const rel = (y - 2) % 4;                                         // 0 floor line, 1-2 window zone, 3 spandrel
    if (y === t - 1) {                                               // roof cap: a parapet on the open edge, roof covering inside
      g.set(x, y, z, open ? "light_gray_concrete" : "stone");
    } else if (FLOORS.includes(y)) {                                 // floor slab (a white band on the open edge)
      g.set(x, y, z, open ? "white_concrete" : "smooth_stone");
    } else if (open) {
      const [face] = ex;
      const shop = y < 6;                                            // the ground storey is shopfront
      if (rel === 3) g.set(x, y, z, shop ? "dark_oak_slab" : "gray_concrete", shop ? { type: "bottom", waterlogged: "false" } : undefined);
      else if (along(x, z, face) % 4 === 0) g.set(x, y, z, shop ? "dark_oak_planks" : "white_concrete");   // piers every 4
      else g.set(x, y, z, shop ? "glass" : "light_blue_stained_glass");
    }
    // else: interior air behind the skin
  }
  // a cornice on the top of the outer edge (off the footprint), sitting on the parapet
  if (NORMALS.some(([dx, dz]) => !has(x + dx, z + dz))) g.set(x, t, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: the front door on the face with the most open wall at street level, in the middle of that face.
const faceCount = new Map(NORMALS.map(([, , n]) => [n, 0]));
for (const [x, z] of cells.map(([x, z]) => [x, z])) for (const [, , n] of exposed(x, z, 3)) faceCount.set(n, faceCount.get(n) + 1);
const frontName = [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
const [fdx, fdz] = NORMALS.find(([, , n]) => n === frontName);
const front = cells.map(([x, z]) => [x, z]).filter(([x, z]) => exposed(x, z, 3).some(([dx, dz]) => dx === fdx && dz === fdz));
const alongs = front.map(([x, z]) => along(x, z, [fdx, fdz])).sort((a, b) => a - b);
const mid = alongs[alongs.length >> 1];
const [dX, dZ] = front.find(([x, z]) => along(x, z, [fdx, fdz]) === mid) ?? front[0];
for (const y of [3, 4]) g.set(dX, y, dZ, "dark_oak_door", { facing: frontName, half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
// The ground-storey spandrel (y 5) is the dark fascia that reads as the canopy over the entrance bay.

// Pass 3: warm lights standing on the floor line, one cell in behind the glass (the lower window row of each storey).
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z);
  for (let y = 3; y < t - 1; y += 4) {
    const ex = exposed(x, z, y);
    if (!ex.length) continue;
    const [face] = ex;
    const ix = x - face[0], iz = z - face[1];                         // the cell one step in
    if (!has(ix, iz) || T(ix, iz) - 1 <= y || exposed(ix, iz, y).length || g.get(ix, y, iz)) continue;
    const k = (along(x, z, face) * 7 + y * 3) % 11;
    const shop = y < 6;
    if (shop && k % 3 === 0) {
      if (k % 2) g.set(ix, y, iz, "glowstone");
      else g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    } else if (!shop && k === 0) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else if (!shop && k === 5) g.set(ix, y, iz, "shroomlight");
  }
}

// Pass 4: roof plant standing on the roof covering inside the parapets, and a stair core on the top tier.
const fits = (x0, z0, w, d, t) => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) if (!has(x, z) || T(x, z) !== t) return false;
  return true;
};
const box = (x0, z0, w, d, y0, h, block) => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) for (let y = y0; y < y0 + h; y++) g.set(x, y, z, block);
};
// the 4x4 core on the 14 tier nearest its middle
let core = null;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!fits(x, z, 4, 4, 14)) continue;
  const d = Math.hypot(x + 1.5 - 21, z + 1.5 - 20);
  if (!core || d < core.d) core = { x, z, d };
}
if (core) {
  for (let x = core.x; x < core.x + 4; x++) for (let z = core.z; z < core.z + 4; z++) for (let y = 14; y < 16; y++) {
    const edge = x === core.x || x === core.x + 3 || z === core.z || z === core.z + 3;
    if (!edge) continue;
    const glazed = y === 15 && (x === core.x + 1 || x === core.x + 2) && (z === core.z || z === core.z + 3);
    g.set(x, y, z, glazed ? "light_blue_stained_glass" : "light_gray_concrete");
  }
  box(core.x, core.z, 4, 4, 16, 1, "light_gray_concrete");
}
const plant = [[14, 20, 3, 2, 14, "gray_concrete"], [26, 12, 3, 2, 14, "gray_concrete"], [8, 16, 2, 2, 10, "iron_block"]];
const placed = plant.filter(([x, z, w, d, y0, b]) => fits(x, z, w, d, y0 === 14 ? 14 : 10)).map(([x, z, w, d, y0, b]) => { box(x, z, w, d, y0, 2, b); return b; });

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091749.nbt");
console.log({ footprint: cells.length, ...out, front: frontName, door: [dX, dZ], core: core && [core.x, core.z], plant: placed.length, tiers: [...new Set(tier.values())].sort((a, b) => a - b) });
