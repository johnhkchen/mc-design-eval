import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Orams Marine Village Boat Park, Westhaven: a dry-stack boat store of the 1990s-2000s, a concrete frame with
// pale painted precast walls, dark dry-stack bays on the ground, a glazed office entrance, and a six-storey main
// block stepping down to four- and three-storey wings and a low ground annex. Storey lines sit at absolute heights
// (5, 9, 13 ...); each cell's own ground g is its foundation, so a downhill cell shows an extra storey at grade.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_158617404.cells.json", "utf8"));

const W = 193, D = 157, H = 40;
const FLOORS = [5, 9, 13, 17, 21, 25];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const id = (x, z) => z * W + x;

const G = new Int16Array(W * D).fill(-1);   // ground under the cell, -1 outside the footprint
const R = new Int16Array(W * D);            // roof tier (top, exclusive) of the cell
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[id(x, z)] >= 0;

// lidar roof heights quantised to four clean tiers (27 main block, 21 and 17 wings, 13 annex)
const tierOf = (r) => (r >= 25 ? 27 : r >= 19 ? 21 : r >= 15 ? 17 : 13);
for (const [x, z, g, r] of cells) { G[id(x, z)] = g; R[id(x, z)] = tierOf(r); }

// majority filter over the footprint, so the lidar noise becomes flat tiers and smooth ground steps
function mode(vals, self) {
  const n = new Map();
  for (const v of vals) n.set(v, (n.get(v) || 0) + 1);
  let best = self, bc = -1;
  for (const [v, c] of n) if (c > bc || (c === bc && (v === self || (best !== self && v > best)))) { best = v; bc = c; }
  return best;
}
function smooth(arr, passes) {
  for (let p = 0; p < passes; p++) {
    const out = Int16Array.from(arr);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const i = id(x, z); if (G[i] < 0) continue;
      const vals = [];
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) vals.push(arr[id(x + dx, z + dz)]);
      out[i] = mode(vals, arr[i]);
    }
    arr.set(out);
  }
}
smooth(R, 2);
smooth(G, 1);
for (let i = 0; i < W * D; i++) if (G[i] >= 0) R[i] = Math.max(R[i], G[i] + 4);

// the entrance: the face with the most outward-facing cells, centred on its middle
const faces = {};
for (const [x, z] of cells) for (const d of DIRS) if (!inside(x + d[0], z + d[1])) (faces[d.join()] ??= []).push(d[0] ? z : x);
const ekey = Object.keys(faces).sort((a, b) => faces[b].length - faces[a].length)[0];
const eus = faces[ekey].sort((a, b) => a - b);
const ent = { key: ekey, u: eus[eus.length >> 1] };

// the facade of an exposed wall cell: dir is its outward normal, u its position along the wall, y its height
function facade(dir, u, y, g, r) {
  const eu = ent.key === dir.join() ? Math.abs(u - ent.u) : Infinity;
  const pane = dir[0] !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  if (eu <= 1 && y <= g + 1) return null;                              // doorway, through the wall
  if (y === g) return ["polished_andesite"];                           // base course
  if (eu <= 3 && y <= g + 2) return [eu === 3 ? "gray_concrete" : "glass", undefined];  // office frontage and posts
  if (eu <= 3 && y === g + 3) return ["smooth_stone"];                 // canopy band over the door
  if (y <= g + 2) return u % 6 === 0 || u % 6 === 5 ? ["light_gray_concrete"] : ["gray_concrete"];  // dry-stack bays
  if (y === g + 3 || y === r - 2) return ["light_gray_concrete"];      // lintel and cornice band
  if (y < 5) return ["white_concrete"];
  if (FLOORS.includes(y) || (y - 5) % 4 === 3) return ["light_gray_concrete"];  // floor lines and spandrels
  if (u % 4 === 0) return ["gray_concrete"];                           // window mullions
  return ["glass_pane", pane];
}

// a roof is a terrace where a lower neighbour's roof sits on this cell's floor
const isTerrace = (x, z, y) => DIRS.some(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return inside(nx, nz) && R[id(nx, nz)] < R[id(x, z)] && y === R[id(nx, nz)] - 1;
});

const v = new Voxels([W, H, D]);
const windows = [];

for (const [x, z] of cells) {
  const i = id(x, z), g = G[i], r = R[i];
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");        // foundation to the lowest ground
  for (let y = g; y < r; y++) {
    const ex = DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || y >= R[id(x + dx, z + dz)]);
    if (ex.length) {
      if (y === r - 1) { v.set(x, y, z, "smooth_stone"); continue; }  // parapet cap
      const outward = ex.filter(([dx, dz]) => !inside(x + dx, z + dz));
      const dir = outward[0] ?? ex[0];
      const m = facade(dir, dir[0] ? z : x, y, g, r);
      if (m) {
        v.set(x, y, z, m[0], m[1]);
        if (m[0] === "glass_pane" && (y - 5) % 4 === 1) windows.push({ x, y, z, dir });
      }
      continue;
    }
    if (y === r - 1) {                                                // roof deck, a solar array on the wings
      const solar = r === 21 && x % 6 >= 1 && x % 6 <= 4 && z % 6 >= 1 && z % 6 <= 4;
      v.set(x, y, z, solar ? "blue_concrete" : "light_gray_concrete");
    } else if (isTerrace(x, z, y)) v.set(x, y, z, "gray_concrete");
    else if (y === g || FLOORS.includes(y)) v.set(x, y, z, "light_gray_concrete");  // floor slab per storey
    else if (x % 8 === 4 && z % 8 === 4) v.set(x, y, z, "gray_concrete");          // frame columns
  }
}

// warm light behind some glass: a lantern standing on the floor inside a window, never in a column's place
for (const w of windows) {
  if ((w.x * 7 + w.z * 13 + w.y * 5) % 7 !== 0) continue;
  const bx = w.x - w.dir[0], bz = w.z - w.dir[1];
  if (!inside(bx, bz) || v.val(bx, w.y, bz) || (bx % 8 === 4 && bz % 8 === 4)) continue;
  v.set(bx, w.y, bz, "lantern", { hanging: "false", waterlogged: "false" });
}

// roof plant: pale housings with a steel vent on top, on the main block, each standing on the deck
for (let cz = 10; cz + 4 < D - 10; cz += 28) for (let cx = 10; cx + 8 < W - 10; cx += 28) {
  let ok = true;
  for (let z = cz; z < cz + 4 && ok; z++) for (let x = cx; x < cx + 8 && ok; x++) {
    if (!inside(x, z) || R[id(x, z)] !== 27) ok = false;
    else for (const [dx, dz] of DIRS) if (!inside(x + dx, z + dz)) ok = false;
  }
  if (!ok) continue;
  for (let z = cz; z < cz + 4; z++) for (let x = cx; x < cx + 8; x++) {
    v.set(x, 27, z, "light_gray_concrete");
    v.set(x, 28, z, "light_gray_concrete");
  }
  for (let z = cz + 1; z < cz + 3; z++) for (let x = cx + 2; x < cx + 6; x++) v.set(x, 29, z, "iron_block");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_158617404.nbt";
console.log(v.save(out), { entrance: ent, windows: windows.length });
