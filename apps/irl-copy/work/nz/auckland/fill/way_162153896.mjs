// Office block, Auckland (way 162153896, Mt Eden side of the CBD): a 1970s-80s concrete-frame office. Ten storeys of
// tinted glazing on a basalt plinth, over a 26 x 36 footprint whose core rises one storey higher. Lidar roof heights are
// median-smoothed and snapped to the storey grid: the deck sits at 4 * round((roof - 1) / 4), so the wings (lidar 41) get
// a deck at 40 and the core (lidar 46) one at 44, with a plant room on top. Every column is solid from y 0 up to its deck,
// and the storey slabs run across the whole footprint, so each tier stands on the slab below it. The shell is one block
// thick with air behind the glass; a few windows have glowstone on the floor behind them, lit at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153896.cells.json", "utf8"));
const W = 26, L = 36, H = 59;                                    // x, z, y
const ground = Array.from({ length: W }, () => Array(L).fill(-1)); // foundation height, -1 = not footprint
const roof = Array.from({ length: W }, () => Array(L).fill(0));   // lidar roof height above y 0
for (const [x, z, g, r] of cells) { ground[x][z] = g; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < L && ground[x][z] >= 0;

// median of the 3 x 3 lidar roofs (zeros are holes in the lidar, left out)
const smoothRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++)
    if (inside(x + dx, z + dz) && roof[x + dx][z + dz] > 0) v.push(roof[x + dx][z + dz]);
  if (!v.length) return 0;
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
// the deck (roof slab) of each cell, on the storey grid and never under 8
const deck = Array.from({ length: W }, () => Array(L).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) if (inside(x, z))
  deck[x][z] = Math.max(8, 4 * Math.round((smoothRoof(x, z) - 1) / 4));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
// the faces of cell (x, z) open to air at height y: beside the outside, or beside a neighbour whose deck is lower
const faces = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || deck[nx][nz] < y;
});

// the entrance: a pair of doors on the street-side face with the most lowest-ground cells in a row, and a canopy over them
const front = (x, z, k) => inside(x, z) && ground[x][z] === 0 && !inside(x + DIRS[k][0], z + DIRS[k][1]);
const entrance = new Map();   // "x,z" -> { k, hinge } for the doors, { canopy: true } for the cells the canopy covers
let best = null;
for (const k of Object.keys(DIRS)) {
  const along = k === "N" || k === "S" ? [1, 0] : [0, 1];
  for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) if (front(x, z, k)) {
    let n = 0;
    for (let s = -2; s <= 2; s++) if (front(x + s * along[0], z + s * along[1], k)) n++;
    if (!best || n > best.n) best = { n, k, x, z, along };
  }
}
if (best) {
  const { k, x, z, along } = best;
  const pair = front(x + along[0], z + along[1], k) ? [[x, z], [x + along[0], z + along[1]]] : [[x - along[0], z - along[1]], [x, z]];
  pair.forEach(([a, b], i) => entrance.set(`${a},${b}`, { k, hinge: i === 0 ? "left" : "right" }));
  for (const [a, b] of [[pair[0][0] - along[0], pair[0][1] - along[1]], [pair[1][0] + along[0], pair[1][1] + along[1]]])
    if (inside(a, b)) entrance.set(`${a},${b}`, { canopy: true });
  for (const [a, b] of pair) entrance.set(`${a},${b}`, { ...entrance.get(`${a},${b}`), canopy: true });
}

const BASE = "polished_basalt", SLAB = "light_gray_concrete", GLASS = "light_blue_stained_glass_pane";
const PIER = "white_concrete", SPANDREL = "gray_concrete", CORNICE = "smooth_stone", ROOF = "stone";
// glass panes connect along the wall they sit in
const paneSides = (ns) => ns
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" };

const vox = new Voxels([W, H, L]);
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!inside(x, z)) continue;
  const g = ground[x][z], top = deck[x][z];
  const nb = 4 * Math.floor(g / 4) + 4;                        // the ground storey runs from g to the next storey line
  for (let y = 0; y <= top; y++) {
    const f = faces(x, z, y), shell = f.length > 0;
    if (y < g) { vox.set(x, y, z, BASE); continue; }          // foundation under the cell
    if (y === g) { vox.set(x, y, z, shell ? BASE : SLAB); continue; }
    if (y === top) { vox.set(x, y, z, shell ? CORNICE : ROOF); continue; }
    if (y % 4 === 0) { vox.set(x, y, z, SLAB); continue; }     // storey slab across the whole footprint
    if (!shell) continue;                                     // air behind the glass
    const ns = f.includes("N") || f.includes("S");
    const pier = (ns ? x : z) % 3 === 0;
    const side = paneSides(ns);
    if (y < nb) {                                             // ground storey: shopfront
      const e = entrance.get(`${x},${z}`);
      if (y === nb - 1) vox.set(x, y, z, e?.canopy ? "smooth_stone_slab" : BASE, e?.canopy ? { type: "top", waterlogged: "false" } : undefined);
      else if (e?.k && y <= g + 2) vox.set(x, y, z, "iron_door", { facing: FACING[e.k], half: y === g + 1 ? "lower" : "upper", hinge: e.hinge, open: "false", powered: "false" });
      else vox.set(x, y, z, pier ? BASE : GLASS, pier ? undefined : side);
    } else if (y % 4 === 3) {                                 // spandrel under the next slab
      vox.set(x, y, z, SPANDREL);
    } else if (pier) {                                        // mullion between window bays
      vox.set(x, y, z, PIER);
    } else {
      vox.set(x, y, z, GLASS, side);
      // a warm light on the floor behind some windows (the first window row, the slab under it)
      const [ox, oz] = DIRS[f[0]], ix = x - ox, iz = z - oz;
      if (y % 4 === 1 && (x * 7 + z * 13 + y * 5) % 11 === 0 && inside(ix, iz) && !vox.get(ix, y, iz))
        vox.set(ix, y, iz, "glowstone");
    }
  }
}

// plant room on the core's roof: a block of roof equipment on the 44 deck, in the middle of the core
const core = [];
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++)
  if (inside(x, z) && deck[x][z] === 44 && faces(x, z, 45).length === 0) core.push([x, z]);
if (core.length) {
  const cx = core.reduce((s, [x]) => s + x, 0) / core.length, cz = core.reduce((s, [, z]) => s + z, 0) / core.length;
  for (const [x, z] of core) if (Math.abs(x - cx) <= 2.5 && Math.abs(z - cz) <= 1.5) vox.set(x, 45, z, SLAB);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153896.nbt";
const { blocks, palette } = vox.save(out);
console.log(`way_162153896: ${blocks} blocks, ${palette} palette entries -> ${out}`);
