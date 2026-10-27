// Metropolis (OSM way 23904451), Auckland CBD: a 1990s-2000s glass-and-precast office tower on a podium.
// Massing follows the lidar roof: each cell's roof is median-smoothed, snapped to 4-block storeys, then mode-smoothed
// so the stepped tiers come out flat. The building is a solid prism from y 0 to each cell's roof (foundation, core and
// roof are one thing, so nothing floats), with a facade layer on every exposed face: plinth below the ground, a shop
// zone on the ground storey (doors, canopy, shop glass), then 4-block storeys of spandrel, glass bays with concrete piers
// and a head band, a cornice and a parapet at each roof edge. Each glass bay has a one-block air gap behind it (the
// interior is otherwise solid), and some bays are lit from behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23904451.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..91, z 0..90

const W = 92, D = 91, HEIGHT = 177, STOREY = 4, ROOF_MAX = 164;
const at = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? x * D + z : -1);
const inFp = new Uint8Array(W * D), G = new Int32Array(W * D), R = new Int32Array(W * D), T = new Int32Array(W * D);
for (const [x, z, g, r] of cells) { const i = at(x, z); inFp[i] = 1; G[i] = g; R[i] = r; }
const fp = (x, z) => { const i = at(x, z); return i >= 0 && inFp[i] === 1; };
const cellsList = [];
for (let i = 0; i < W * D; i++) if (inFp[i]) cellsList.push(i);

// the storey floor under a cell's ground: never a roof at or below the ground under it
const minRoof = (i) => STOREY * Math.floor(G[i] / STOREY) + STOREY;
const clampRoof = (v, i) => Math.min(ROOF_MAX, Math.max(minRoof(i), v));
const window = (i, k) => {
  const x = Math.floor(i / D), z = i % D, out = [];
  for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) { const j = at(x + dx, z + dz); if (j >= 0 && inFp[j]) out.push(j); }
  return out;
};

// 1. median of the lidar roof over 5x5, snapped to whole storeys; 2. the mode of that over 7x7 (flat tiers, no noise)
const snapped = new Int32Array(W * D);
for (const i of cellsList) {
  const vals = window(i, 2).map((j) => R[j]).sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  snapped[i] = clampRoof(Math.round(med / STOREY) * STOREY, i);
}
for (const i of cellsList) {
  const counts = new Map();
  for (const j of window(i, 3)) counts.set(snapped[j], (counts.get(snapped[j]) ?? 0) + 1);
  let best = snapped[i], bestN = -1;
  for (const [v, n] of counts) if (n > bestN || (n === bestN && v > best)) { best = v; bestN = n; }
  T[i] = clampRoof(best, i);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const hash = (a, b, c) => {
  let v = (Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2246822519)) >>> 0;
  v = Math.imul(v ^ (v >>> 13), 1274126177) >>> 0;
  return (v ^ (v >>> 16)) >>> 0;
};
// a face is exposed when the cell beside it is outside the footprint or its roof is below this height
const exposed = (x, z, y, dx, dz) => {
  const j = at(x + dx, z + dz);
  return j < 0 || !inFp[j] || y >= T[j];
};
const exposures = (x, z, y) => DIRS.filter(([dx, dz]) => exposed(x, z, y, dx, dz));

const g = new Voxels([W, HEIGHT, D]);
const maxRoof = Math.max(...cellsList.map((j) => T[j]));
const pockets = [];   // glass and door bays, carved to air behind the glass in pass 2

// pass 1: the solid prism and its facade
for (const i of cellsList) {
  const x = Math.floor(i / D), z = i % D, top = T[i], ground = G[i];
  const nextLine = STOREY * Math.floor(ground / STOREY) + STOREY;
  for (let y = 0; y < top; y++) {
    const ex = exposures(x, z, y);
    if (!ex.length) {
      g.set(x, y, z, y === top - 1 ? "light_gray_concrete" : "stone");   // roof deck, or core
      continue;
    }
    const [dx, dz] = ex[0];
    const u = dx !== 0 ? z : x;                       // position along the face
    const r = hash(x, y, z) % 16;
    const glass = r === 0 ? "cyan_stained_glass" : r === 1 ? "gray_stained_glass" : "light_blue_stained_glass";
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }                  // plinth below the street
    if (y === top - 1) { g.set(x, y, z, "smooth_quartz"); continue; }             // cornice
    if (y < nextLine) {                                                            // shop zone
      if (u % 13 === 6 && (y === ground || y === ground + 1) && ground + 1 < nextLine) {
        const facing = FACING[`${-dx},${-dz}`];                                    // a door faces into the building
        g.set(x, y, z, "dark_oak_door", { facing, half: y === ground ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        pockets.push({ x, y, z, dx, dz, kind: "door" });
        continue;
      }
      if (y === ground + 2 && ground + 2 < nextLine && u % 13 >= 5 && u % 13 <= 7) {
        g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); // canopy over the entrance
        continue;
      }
      if (u % 3 === 0) { g.set(x, y, z, "polished_andesite"); continue; }
      g.set(x, y, z, "glass"); pockets.push({ x, y, z, dx, dz, kind: "shop" });
      continue;
    }
    if (y % STOREY === 0) { g.set(x, y, z, "white_concrete"); continue; }          // floor line
    if (y % STOREY === 3) { g.set(x, y, z, "smooth_quartz"); continue; }           // head band
    if (u % 3 === 0) { g.set(x, y, z, "gray_concrete"); continue; }                // mullion
    g.set(x, y, z, glass); pockets.push({ x, y, z, dx, dz, kind: "glass" });
  }
  // parapet on the roof edge, and roof equipment on the upper tiers
  if (exposures(x, z, top - 1).length) g.set(x, top, z, "white_concrete");
  if (top >= 152 && x % 12 >= 5 && x % 12 <= 7 && z % 12 >= 5 && z % 12 <= 7) {
    for (let y = top; y < top + 3; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, top + 3, z, "gray_concrete");
  }
  if (x === 45 && z === 45 && top === maxRoof) {
    for (let y = top; y < top + 10; y++) g.set(x, y, z, "iron_block");           // a mast on the tower's roof
  }
}

// pass 2: an air gap behind each glass bay and door, one block deep, with a few lit ones
for (const p of pockets) {
  const cx = p.x - p.dx, cz = p.z - p.dz;             // the cell one block inside the facade
  if (!fp(cx, cz) || p.y >= T[at(cx, cz)] || exposures(cx, cz, p.y).length) continue;
  const h = hash(p.x, p.y, p.z);
  if (p.kind === "shop" && p.y === G[at(p.x, p.z)] && h % 5 === 0) {
    g.set(cx, p.y, cz, "lantern", { hanging: "false", waterlogged: "false" });
  } else if (p.kind === "glass" && p.y % STOREY === 1 && h % 7 === 0) {
    g.set(cx, p.y, cz, "glowstone");
  } else if (p.kind === "glass" && p.y % STOREY === 2 && h % 23 === 0) {
    g.set(cx, p.y, cz, "shroomlight");
  } else {
    g.set(cx, p.y, cz, "air");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23904451.nbt";
const { blocks, palette } = g.save(out);
const tops = cellsList.map((i) => T[i]);
console.log(`way_23904451: ${cellsList.length} cells, roofs ${Math.min(...tops)}..${Math.max(...tops)}, ${blocks} blocks, palette ${palette}`);
