// 38 West 46 Street: a 1967 precast-concrete parking garage. Pier-and-spandrel facade with recessed glazed bays and
// louvred spandrel panels, a polished-andesite plinth, a lobby and vehicle entry on the 46th Street (south) face, and
// the lidar massing: a six-storey podium with an eight-storey block set on it, a penthouse and a plant box on the roofs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 18, D = 28, H = 36;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034264.cells.json`, "utf8"));

const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };          // outward normal of each face (z 0 = north)
const foot = Array.from({ length: W }, () => new Array(D).fill(false));
const roof = Array.from({ length: W }, () => new Array(D).fill(0));
const ground = Array.from({ length: W }, () => new Array(D).fill(0));
for (const [x, z, g, r] of cells) { foot[x][z] = true; roof[x][z] = r; ground[x][z] = g; }

const isFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && foot[x][z];
// Lidar roofs are noisy: a 3x3 median, then whole storeys (3 blocks), from 6 (two storeys) to 24 (eight).
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (isFoot(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = Array.from({ length: W }, (_, x) => Array.from({ length: D }, (_, z) =>
  foot[x][z] ? Math.min(24, Math.max(6, 3 * Math.round(median(x, z) / 3))) : 0));

// Nested footprints: F(h) = the cells whose roof reaches h. Each storey stands on the one below, so no tier hangs.
const inT = (x, z, h) => isFoot(x, z) && tier[x][z] >= h;
const exits = (x, z, h) => Object.keys(OUT).filter((f) => { const [dx, dz] = OUT[f]; return !inT(x + dx, z + dz, h); });
const cellsAt = (h) => { const out = []; for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inT(x, z, h)) out.push([x, z]); return out; };

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

// Foundation below each cell's ground (all 0 here), then a slab on every storey line over the cells that reach it:
// a floor where the storey continues, the roof cap where a setback or the top stops.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (isFoot(x, z)) for (let y = 0; y < ground[x][z]; y++) put(x, y, z, "stone");
for (let k = 0; k <= 8; k++) for (const [x, z] of cellsAt(3 * k)) put(x, 3 * k, z, "smooth_stone");

const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// Walls: two blocks per storey on the exterior cells, piers at the corners and every third cell, recessed glazed bays
// (glass one cell inside, air behind it to the next floor), louvred spandrel panels, and warm light behind some glass.
for (let k = 0; k < 8; k++) {
  const h = 3 * k + 3, y1 = 3 * k + 1, y2 = 3 * k + 2;
  for (const [x, z] of cellsAt(h)) {
    const ex = exits(x, z, h);
    if (!ex.length) continue;
    if (ex.length > 1) { put(x, y1, z, "light_gray_concrete"); put(x, y2, z, "light_gray_concrete"); continue; }   // corner pier
    const face = ex[0], [dx, dz] = OUT[face];
    const idx = face === "N" || face === "S" ? x : z;
    if (k === 0) {
      if (face === "S" && idx >= 4 && idx <= 6) continue;                          // vehicle entry, open to the sky-lintel
      if (face === "S" && idx === 11) {                                            // pedestrian door into the lobby
        put(x, y1, z, "iron_door", doorState("lower")); put(x, y2, z, "iron_door", doorState("upper")); continue;
      }
      if (face === "S" && idx >= 8 && idx <= 14) {                                 // lobby glass, recessed one cell
        for (const y of [y1, y2]) put(x - dx, y, z - dz, "light_blue_stained_glass");
        continue;
      }
      put(x, y1, z, "polished_andesite"); put(x, y2, z, "polished_andesite"); continue;   // plinth
    }
    if (idx % 3 === 0) { put(x, y1, z, "light_gray_concrete"); put(x, y2, z, "light_gray_concrete"); continue; }   // pier
    const b = Math.floor(idx / 3);
    const ix = x - dx, iz = z - dz;
    if (face === "W" || face === "E" || !inT(ix, iz, h)) {                       // blind side wall: louvred spandrel panels
      put(x, y1, z, "white_concrete"); put(x, y2, z, "white_concrete"); continue;
    }
    const glass = (b + idx) % 2 ? "gray_stained_glass" : "light_blue_stained_glass";
    for (const y of [y1, y2]) put(ix, y, iz, glass);
    if ((b * 5 + k * 3 + idx) % 23 === 4 && inT(x - 2 * dx, z - 2 * dz, h)) {    // a lit office behind the glass
      for (const y of [y1, y2]) put(x - 2 * dx, y, z - 2 * dz, "glowstone");
    }
  }
}

// Lobby lanterns hang from the first-floor slab, just inside the glass.
put(10, 2, 25, "lantern", { hanging: "true" });
put(13, 2, 25, "lantern", { hanging: "true" });

// Roof: a parapet on every roof edge, a stair and lift penthouse on the eight-storey roof, a plant box on the podium.
for (const [x, z] of cellsAt(0)) {
  const t = tier[x][z];
  if (exits(x, z, t).length) put(x, t + 1, z, "light_gray_concrete");
}
const findRect = (w, d, t) => {
  let best = null;
  for (let x = 1; x + w < W - 1; x++) for (let z = 1; z + d < D - 1; z++) {
    let ok = true;
    for (let i = 0; i < w && ok; i++) for (let j = 0; j < d && ok; j++) {
      const cx = x + i, cz = z + j;
      if (tier[cx][cz] !== t || exits(cx, cz, t).length) ok = false;
    }
    if (!ok) continue;
    const dist = Math.hypot(x + w / 2 - W / 2, z + d / 2 - D / 2);
    if (!best || dist < best.dist) best = { x, z, dist };
  }
  return best;
};
const box = (r, w, d, y0, y1, block) => {
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) for (let y = y0; y <= y1; y++) put(r.x + i, y, r.z + j, block);
};
const pent = findRect(4, 3, 24);
if (pent) { box(pent, 4, 3, 25, 26, "stone_bricks"); box(pent, 4, 3, 27, 27, "smooth_stone"); }
const plant = findRect(2, 2, 15);
if (plant) box(plant, 2, 2, 16, 17, "light_gray_concrete");

const { blocks, palette } = g.save(`${DIR}/NYC1034264.nbt`);
console.log(`NYC1034264: ${blocks} blocks, ${palette} palette entries`);
