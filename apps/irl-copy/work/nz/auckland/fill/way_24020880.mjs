import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// NZI Building, Auckland: a 1960s office block (white concrete piers, blue glass bays, grey spandrels) on a stone
// plinth. Storeys are 4 blocks: a floor slab, two glazed rows, a head band. The lidar roof is smoothed to four tiers
// (28, 29, 32, 33) so the block steps down in setbacks and wings; the core carries a plant zone above its parapet.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_24020880.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 57, D = 89, H = 47;
const BASE = 4;          // the ground floor's slab: the plinth stands to y 4 (the highest ground under the block)
const SHOP_TOP = 8;      // the ground storey (y 4..7) is the shopfront storey

const grid = new Array(W * D).fill(null);
for (const [x, z, ground, roof] of cells) grid[z * W + x] = { x, z, ground, roof, rs: roof };
const cellAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : grid[z * W + x]);
const inF = (x, z) => cellAt(x, z) !== null;
const list = cells.map(([x, z]) => cellAt(x, z));
const ring = (x, z) => inF(x, z) && (!inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1));

// 1. the lidar roof: median over a 7x7 window of plausible roofs (the 0-roof gaps take their neighbours')
for (const c of list) {
  const vals = [];
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
    const n = cellAt(c.x + dx, c.z + dz);
    if (n && n.roof >= 20) vals.push(n.roof);
  }
  vals.sort((a, b) => a - b);
  c.rs = vals.length ? vals[vals.length >> 1] : c.roof;
}

// 2. tiers: storey tops at 28 or 32 (multiples of 4 above the plinth), a parapet course on the wings and core
function tierOf(c) {
  const core = c.x >= 14 && c.x <= 26 && c.z >= 24 && c.z <= 34;
  if (c.rs >= 32.5) return { top: 32, parapet: 1, plant: c.rs >= 33.5 || core };
  if (c.rs >= 30.5) return { top: 32, parapet: 0, plant: false };
  if (c.rs >= 28.5) return { top: 28, parapet: 1, plant: false };
  return { top: 28, parapet: 0, plant: false };
}

// 3. which edge a ring cell is on: its bay index along the face, and which way it faces
function faceOf(x, z) {
  const zEdge = !inF(x, z - 1) || !inF(x, z + 1);
  const xEdge = !inF(x - 1, z) || !inF(x + 1, z);
  if (zEdge && xEdge) return { corner: true };
  if (zEdge) return { along: x, out: !inF(x, z + 1) ? "south" : "north" };
  return { along: z, out: !inF(x + 1, z) ? "east" : "west" };
}
const STEP = { south: [0, -1], north: [0, 1], east: [-1, 0], west: [1, 0] };   // from outside, into the building
const OUT = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] };
const FACING = { south: "south", north: "north", east: "east", west: "west" };

// 4. the entrance: the south face, the bay nearest the block's middle
let door = null;
for (const c of list) {
  if (!ring(c.x, c.z)) continue;
  const f = faceOf(c.x, c.z);
  if (f.corner || f.out !== "south") continue;
  if (!door || Math.abs(c.x - 28) < Math.abs(door.x - 28)) door = { x: c.x, z: c.z, along: f.along };
}

const vox = new Voxels([W, H, D]);
const panes = [];

for (const c of list) {
  const { x, z } = c;
  const isRing = ring(x, z);
  const f = isRing ? faceOf(x, z) : null;
  const t = tierOf(c);

  // the foundation and plinth: solid from y 0 under every cell (the lowest ground is y 0), up to the base course
  for (let y = 0; y < BASE; y++) vox.set(x, y, z, "stone_bricks");
  for (let y = BASE; y < t.top + t.parapet; y++) {
    if (y === BASE) { vox.set(x, y, z, isRing ? "polished_granite" : "smooth_stone"); continue; }
    if (y >= t.top) { if (isRing) vox.set(x, y, z, "smooth_stone"); continue; }     // the parapet course
    const j = (y - BASE) % 4;
    if (j === 0) { vox.set(x, y, z, isRing ? "gray_concrete" : "light_gray_concrete"); continue; }   // floor slab
    if (j === 3) {                                                                  // head band; the roof
      if (y === t.top - 1) vox.set(x, y, z, isRing ? "gray_concrete" : "light_gray_concrete");
      else if (isRing) vox.set(x, y, z, "gray_concrete");
      continue;
    }
    if (!isRing) continue;                                                          // air behind the glass
    const shop = y < SHOP_TOP;
    const isDoor = door && x === door.x && z === door.z && shop;
    if (isDoor) {
      const facing = FACING[f.out];
      vox.set(x, y, z, "iron_door", { facing, half: y === BASE + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const nearDoor = door && shop && Math.abs(x - door.x) <= 1 && Math.abs(z - door.z) <= 1;
    const pier = f.corner || f.along % 4 === 0 || nearDoor;
    if (pier) { vox.set(x, y, z, shop ? "polished_andesite" : "white_concrete"); continue; }
    if (shop) { vox.set(x, y, z, "light_blue_stained_glass"); continue; }
    vox.set(x, y, z, "light_blue_stained_glass_pane");
    panes.push([x, y, z]);
    // a warm light just inside some upper windows
    if ((x * 7 + z * 3 + y) % 11 === 0) {
      const [dx, dz] = STEP[f.out];
      const ix = x + dx, iz = z + dz;
      if (inF(ix, iz) && !ring(ix, iz)) vox.set(ix, y, iz, "glowstone");
    }
  }

  // plant on the core and the lidar's 33-plus: two blocks of plant above the roof, inside the parapet
  if (t.plant && !isRing) {
    vox.set(x, t.top, z, "light_gray_concrete");
    vox.set(x, t.top + 1, z, "light_gray_concrete");
  }
}

// the door: a two-high iron door, its outward facing toward the street
if (door) {
  const f = faceOf(door.x, door.z);
  for (const [y, half] of [[BASE + 1, "lower"], [BASE + 2, "upper"]]) {
    vox.set(door.x, y, door.z, "iron_door", { facing: FACING[f.out], half, hinge: "left", open: "false", powered: "false" });
  }
}

// glass panes connect to whatever stands beside them along the face (a pier, another pane)
const has = (x, y, z) => vox.get(x, y, z) !== null;
for (const [x, y, z] of panes) {
  vox.set(x, y, z, "light_blue_stained_glass_pane", {
    north: has(x, y, z - 1), south: has(x, y, z + 1), east: has(x + 1, y, z), west: has(x - 1, y, z), waterlogged: false,
  });
}

const out = `${dir}/way_24020880.nbt`;
const info = vox.save(out);
console.log(JSON.stringify({ file: out, ...info, door, panes: panes.length }));
