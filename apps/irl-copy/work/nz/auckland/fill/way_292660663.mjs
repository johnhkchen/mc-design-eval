// Cathedral House, Mt Eden Road side of the CBD edge (way 292660663): a nine-storey 1960s-70s concrete-frame office block.
// Basalt plinth and fascia, white concrete mullions, grey spandrels, blue glass bays, a flat roof with a parapet and a plant
// box. Storeys follow the lidar roof: each cell's roof is median-smoothed, quantised to 4-block storeys above its own
// ground, then the count is a 3x3 median so the tiers are flat. Every column is solid from y 0 to its roof, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292660663.cells.json`, "utf8"));
const SIZE = [35, 53, 34];
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const K = (x, z) => `${x},${z}`;

const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(K(x, z), { x, z, g, r });
const at = (x, z) => fp.get(K(x, z));
const cs = [...fp.values()];
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const around = (c, R) => { const out = []; for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const n = at(c.x + dx, c.z + dz); if (n) out.push(n); } return out; };

// massing: lidar roof -> median over 5x5 (kills the stray edge cells) -> storeys above this cell's ground -> 3x3 median
for (const c of cs) c.rs = median(around(c, 2).map((n) => n.r));
for (const c of cs) c.n0 = Math.round((c.rs - 1 - c.g) / 4);
for (const c of cs) c.n = median(around(c, 1).map((n) => n.n0));
for (const c of cs) c.T = c.g + 4 * c.n;                       // roof deck level
const nMax = Math.max(...cs.map((c) => c.n));

// depth from the outside: 1 = perimeter wall, 2 = air gap, 3 = the lit rooms behind the glass
let frontier = [];
for (const c of cs) if (NB.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { c.depth = 1; frontier.push(c); }
while (frontier.length) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of NB) { const n = at(c.x + dx, c.z + dz); if (n && !n.depth) { n.depth = c.depth + 1; next.push(n); } }
  frontier = next;
}

// an enclosed office cell: every side neighbour is body at this height, and it is not a storey slab row
const interior = (c, y) => y > c.g && y < c.T && (y - c.g) % 4 !== 0 &&
  NB.every(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.T >= y; });

const v = new Voxels(SIZE);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

for (const c of cs) {
  const { x, z, g: gr, T } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                       // foundation up to this cell's ground
  const mullion = (x + z) % 3 === 0;                                                 // concrete piers every third cell
  for (let y = gr; y <= T; y++) {
    if (y === T) { put(x, y, z, "gray_concrete"); continue; }                       // roof deck
    const dy = (y - gr) % 4;
    if (dy === 0) { put(x, y, z, "smooth_stone"); continue; }                       // storey slab
    if (interior(c, y)) continue;                                                    // air gap behind the glass
    if (y < gr + 4) {                                                                // ground storey: plinth, shopfront, fascia
      put(x, y, z, mullion ? "white_concrete" : dy === 2 ? "light_blue_stained_glass_pane" : "stone_bricks");
    } else {                                                                         // office storeys: glazed bays, grey spandrel
      put(x, y, z, mullion ? "white_concrete" : dy === 3 ? "light_gray_concrete" : "light_blue_stained_glass_pane");
    }
  }
  if (c.depth === 1) put(x, T + 1, z, "stone_bricks");                              // parapet
  if (c.n === nMax && c.depth >= 4 && x >= 11 && x <= 21 && z >= 9 && z <= 18) {  // plant room on the top tier
    put(x, T + 1, z, "light_gray_concrete");
    put(x, T + 2, z, "light_gray_concrete");
  }
}

// entrance on the north frontage, a lantern hung over the door
const door = at(10, 0);
if (door) {
  const st = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(10, door.g + 1, 0, "oak_door", st("lower"));
  put(10, door.g + 2, 0, "oak_door", st("upper"));
  put(10, door.g + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// warm lights in the rooms three cells in, one air cell behind the glass
for (const c of cs) if (c.depth === 3 && (c.x + c.z) % 6 === 0) {
  for (let y = c.g + 2; y < c.T; y += 4) if (interior(c, y)) put(c.x, y, c.z, "glowstone");
}

// glass panes connect to whatever is beside them in the wall
for (const c of cs) for (let y = c.g; y <= c.T; y++) {
  const b = v.get(c.x, y, c.z);
  if (!b || !/stained_glass_pane$/.test(b.block)) continue;
  const st = { waterlogged: "false" };
  for (const [dir, dx, dz] of [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]]) {
    const n = v.get(c.x + dx, y, c.z + dz);
    st[dir] = n && !/lantern|glowstone|door/.test(n.block) ? "true" : "false";
  }
  put(c.x, y, c.z, b.block, st);
}

const out = v.save(`${DIR}/way_292660663.nbt`);
const hist = {};
for (const c of cs) hist[c.n] = (hist[c.n] || 0) + 1;
console.log(JSON.stringify({ cells: cs.length, storeysHistogram: hist, maxRoof: Math.max(...cs.map((c) => c.T + 2)), blocks: out.blocks, palette: out.palette }));
