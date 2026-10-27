// Dunningham House: a 1960s-70s reinforced-concrete office block on the Auckland CBD ridge. Seven storeys at the core,
// stepping down to two and three storeys on the wings (lidar roof heights, quantised to 4-block storey lines). White
// concrete piers, light-grey spandrels and blue-tinted glazing in a 4-bay rhythm; a dark andesite plinth and shopfront
// on the ground storey; a recessed entrance on the north face; a cornice, a roof membrane and a plant room on the top tier.
// Massing per footprint cell: foundation below its ground, then a skin (outer ring), an air gap behind the glass with a
// floor slab per storey, and a solid core. Every column is continuous from its foundation to its roof, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128263.cells.json", "utf8"));
const SIZE = [45, 41, 38];
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128263.nbt";

const PIER = "white_concrete", SPANDREL = "light_gray_concrete", GLASS = "light_blue_stained_glass_pane";
const PLINTH = "polished_andesite", FOUNDATION = "stone_bricks", ROOF = "smooth_stone", CORE = "light_gray_concrete";

// key "x,z" -> { g: ground, T: roof top (the roof surface is the top of block row T-1) }; tiers on 4-block storey lines
// lidar noise makes single-cell spikes, so each roof height is the median of its 3 x 3 neighbourhood before it snaps to a storey line
const RAW = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r }]));
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const FOOT = new Map();
for (const { x, z, g } of RAW.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = RAW.get(`${x + dx},${z + dz}`); if (n) near.push(n.r); }
  FOOT.set(`${x},${z}`, { x, z, g, T: Math.max(8, 4 * Math.round(median(near) / 4)) });
}
const TOP = Math.max(...[...FOOT.values()].map((c) => c.T));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                 // E W S N (north is -z)

const inM = (x, z, y) => { const c = FOOT.get(`${x},${z}`); return !!c && y < c.T; };

// per block-row y: which columns are skin (touch air sideways), which are the air-gap ring behind them, the rest is core
const LV = [];
for (let y = 0; y < TOP; y++) {
  const skin = new Set(), ring = new Set();
  for (const c of FOOT.values()) if (y < c.T && DIRS.some(([dx, dz]) => !inM(c.x + dx, c.z + dz, y))) skin.add(`${c.x},${c.z}`);
  for (const c of FOOT.values()) {
    const k = `${c.x},${c.z}`;
    if (y < c.T && !skin.has(k) && DIRS.some(([dx, dz]) => skin.has(`${c.x + dx},${c.z + dz}`))) ring.add(k);
  }
  LV.push({ skin, ring });
}

// the front: the north face's ground-storey column nearest the middle, on a ground of 1 or less, gets the entrance
const cx = [...FOOT.values()].reduce((s, c) => s + c.x, 0) / FOOT.size;
let door = null;
for (const c of FOOT.values()) {
  if (c.g > 1 || LV[1].skin.has(`${c.x},${c.z}`) === false || inM(c.x, c.z - 1, 1)) continue;
  if (!door || Math.abs(c.x - cx) < Math.abs(door.x - cx)) door = c;
}
const doorKey = door ? `${door.x},${door.z}` : null;

const B = new Map();                                           // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });

// the outward face of a skin column: piers at the corners and every fourth column along a face, glazing between
function faceBlock(c, y, k4, r) {
  const { x, z } = c;
  const exN = !inM(x, z - 1, y), exS = !inM(x, z + 1, y), exW = !inM(x - 1, z, y), exE = !inM(x + 1, z, y);
  const along = exN || exS ? x : z;
  const corner = (exN || exS) && (exW || exE);
  if (r === 0) return k4 === 0 ? PLINTH : SPANDREL;             // base course, then a band at every storey line
  if (r === 3 && k4 > 0) return SPANDREL;                         // head band under the next storey line
  if (k4 === 0 && r === 1) return PLINTH;                         // shopfront kickplate
  return corner || along % 4 === 0 ? PIER : GLASS;
}

// first the skin (so the air gap can see which bays are glazed), then the air-gap ring, then the core
for (let y = 0; y < TOP; y++) {
  const { skin } = LV[y];
  const k4 = Math.floor(y / 4), r = y % 4;
  for (const c of FOOT.values()) {
    if (y >= c.T) continue;
    const key = `${c.x},${c.z}`;
    if (y < c.g) { put(c.x, y, c.z, FOUNDATION); continue; }
    if (!skin.has(key)) continue;
    if (key === doorKey && (y === 1 || y === 2)) {
      put(c.x, y, c.z, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    } else put(c.x, y, c.z, faceBlock(c, y, k4, r));
  }
  for (const c of FOOT.values()) {
    if (y >= c.T || y < c.g) continue;
    const key = `${c.x},${c.z}`;
    if (skin.has(key)) continue;
    if (LV[y].ring.has(key)) {
      if (y === c.T - 1) put(c.x, y, c.z, ROOF);                  // roof membrane over the air gap
      else if (r === 0) put(c.x, y, c.z, SPANDREL);               // floor slab per storey, spanning the gap
      else if (r === 1 && k4 > 0) {                               // a warm light behind some glazed bays
        const glazed = DIRS.some(([dx, dz]) => skin.has(`${c.x + dx},${c.z + dz}`) && B.get(`${c.x + dx},${y},${c.z + dz}`)?.block === GLASS);
        const h = (c.x * 31 + c.z * 17 + k4 * 7) % 11;
        if (glazed && h === 0) put(c.x, y, c.z, "glowstone");
        else if (glazed && h === 5) put(c.x, y, c.z, "lantern", { hanging: "false", waterlogged: "false" });
      }
      continue;
    }
    put(c.x, y, c.z, y === c.T - 1 ? ROOF : CORE);                // solid core, its top the roof membrane
  }
}

// cornice on the outer edge of every tier
for (const c of FOOT.values()) {
  if (LV[c.T - 1].skin.has(`${c.x},${c.z}`)) put(c.x, c.T, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// plant room on the top tier: a 7 x 4 box of walls at the centre of the highest roof, capped
const top = [...FOOT.values()].filter((c) => c.T === TOP && !LV[TOP - 1].skin.has(`${c.x},${c.z}`));
const inTop = new Set(top.map((c) => `${c.x},${c.z}`));
const tx = top.reduce((s, c) => s + c.x, 0) / top.length, tz = top.reduce((s, c) => s + c.z, 0) / top.length;
const boxOk = (x0, z0) => { for (let x = x0; x < x0 + 7; x++) for (let z = z0; z < z0 + 4; z++) if (!inTop.has(`${x},${z}`)) return false; return true; };
const origins = top.map((c) => [c.x, c.z]).sort((a, b) => Math.hypot(a[0] - tx, a[1] - tz) - Math.hypot(b[0] - tx, b[1] - tz));
const box = origins.find(([x0, z0]) => boxOk(x0, z0));
if (box) {
  const [x0, z0] = box;
  for (let x = x0; x < x0 + 7; x++) for (let z = z0; z < z0 + 4; z++) {
    const wall = x === x0 || x === x0 + 6 || z === z0 || z === z0 + 3;
    if (wall) for (let y = TOP; y < TOP + 3; y++) put(x, y, z, PIER);
    put(x, TOP + 3, z, FOUNDATION);                               // cap
  }
}

// glass panes connect to their neighbours (panes and solid blocks), as the game draws them
const SIDE = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
for (const [k, v] of B) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const state = { waterlogged: "false" };
  for (const [side, [dx, dz]] of Object.entries(SIDE)) {
    const n = B.get(`${x + dx},${y},${z + dz}`);
    state[side] = n && n.block !== "air" ? "true" : "false";
  }
  v.state = state;
}

const g = new Voxels(SIZE);
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const info = g.save(OUT);
console.log(JSON.stringify({ top: TOP, door: doorKey, box, ...info }));
