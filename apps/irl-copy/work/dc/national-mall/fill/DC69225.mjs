// H Street NW, 20001: a 1920s-30s brick-and-stone commercial block (Chicago-school massing, stone string courses and a
// stone cornice over brick walls), set on the lidar's stepped roof: a 17-block office tower on the south half, 12- and
// 8-block tiers stepping down to the north, and 4-block shopfronts on the low wing. Built as a hollow shell with floor
// slabs per storey and an air gap behind every pane; no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC69225.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [38, 29, 19];

// the lidar roof, smoothed into four clean tiers (4 / 8 / 12 / 17 blocks; 2 is a low wall for the bare edge cells)
const tierOf = (r) => (r <= 2 ? 2 : r <= 6 ? 4 : r <= 10 ? 8 : r <= 14 ? 12 : 17);
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, H: tierOf(r) });
const at2 = (x, z) => foot.get(`${x},${z}`);

const NEIGH = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E
// the outward direction of an exposed face at height y (the cell's edge, or the step down to a lower tier), else null
function exposed(x, z, y) {
  for (const [dx, dz] of NEIGH) {
    const n = at2(x + dx, z + dz);
    if (!n || n.H <= y) return [dx, dz];
  }
  return null;
}

const plan = new Map();
const K = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => plan.set(K(x, y, z), { block, state });
const ok = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < SIZE[0] && y < SIZE[1] && z < SIZE[2];

for (const [x, z, g, r] of cells) {
  const { H } = at2(x, z);
  for (let y = 0; y < H; y++) {
    const dir = exposed(x, z, y);
    if (y === H - 1) { put(x, y, z, dir ? "smooth_stone" : "stone"); continue; }            // cornice / roof deck
    if (y === 0) { put(x, y, z, dir ? "stone_bricks" : "smooth_stone"); continue; }         // plinth / ground slab
    if (y % 4 === 0) { put(x, y, z, "smooth_stone"); continue; }                            // string course / floor slab
    if (!dir) continue;                                                                      // interior air
    if (y % 4 === 3) { put(x, y, z, "bricks"); continue; }                                  // spandrel
    // window row: the wall's index along the face sets the bay; the ground storey is a shopfront with wider glazing
    const idx = dir[0] !== 0 ? z : x;
    const shop = y < 4;
    const pier = shop ? idx % 4 === 0 : idx % 3 === 0;
    put(x, y, z, pier ? "stone_bricks" : "glass_pane");
  }
}

// the entrance on the south face: double oak doors, a stone surround, and a hanging lantern under the string course
const DOOR_X = 18, DOOR_Z = 18;
put(DOOR_X, 1, DOOR_Z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR_X, 2, DOOR_Z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dx of [-1, 1]) for (let y = 1; y <= 3; y++) put(DOOR_X + dx, y, DOOR_Z, "stone_bricks");
put(DOOR_X, 3, DOOR_Z, "lantern", { hanging: "true", waterlogged: "false" });

// warm light behind some panes: glowstone or shroomlight in the air gap just inside the glass
for (const [key, v] of [...plan.entries()]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const dir = exposed(x, z, y);
  if (!dir) continue;
  const ix = x - dir[0], iz = z - dir[1];
  const inner = at2(ix, iz);
  if (!inner || inner.H <= y || exposed(ix, iz, y) || plan.has(K(ix, y, iz))) continue;
  if ((x * 31 + y * 17 + z * 13) % 14 === 0) put(ix, y, iz, "glowstone");
}

// rooftop: a stone-banded penthouse on the tower roof, and two brick flues on the 8-block tier
const roofAt = (x, z, H) => { const n = at2(x, z); return n && n.H === H && !exposed(x, z, H - 1); };
for (let x = 12; x <= 17; x++) for (let z = 12; z <= 14; z++) {
  if (!roofAt(x, z, 17)) continue;
  put(x, 17, z, "bricks"); put(x, 18, z, "bricks"); put(x, 19, z, "stone_bricks");
}
for (const [x, z] of [[20, 4], [25, 4]]) {
  if (!roofAt(x, z, 8)) continue;
  for (let y = 8; y <= 10; y++) put(x, y, z, y === 10 ? "smooth_stone" : "bricks");
}

// pane connections: a pane joins a neighbour that is a pane or a whole block, as the vanilla blockstate does
const FULL = /^(stone_bricks|bricks|smooth_stone|stone|glowstone|shroomlight)$/;
for (const [key, v] of plan) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const side = {};
  const names = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
  for (const [d, [dx, dz]] of Object.entries(names)) {
    const n = plan.get(K(x + dx, y, z + dz));
    side[d] = n && (n.block === "glass_pane" || FULL.test(n.block)) ? "true" : "false";
  }
  v.state = { ...side, waterlogged: "false" };
}

const g = new Voxels(SIZE);
let n = 0;
for (const [key, v] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  if (!ok(x, y, z)) throw new Error(`out of bounds ${key}`);
  g.set(x, y, z, v.block, v.state); n++;
}
const out = g.save(`${DIR}/DC69225.nbt`);
console.log(`DC69225.nbt: ${out.blocks} blocks, ${out.palette} palette entries (${n} placed)`);
