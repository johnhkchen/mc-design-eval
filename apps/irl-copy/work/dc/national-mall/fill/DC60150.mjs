// DC60150: 1801 N St NW, a 1970s commercial office block (Commercial-Office-Large), in pale precast with blue-tinted glazing.
// Massing from the lidar roof grid: wings (roof <= 3) one storey; a 14-block body of six storeys (ground + five floors);
// a 17-block tower over the west-centre of the body. Walls are a one-block skin with floor slabs at each storey line and
// air behind the glass; roofs and the cornice cap every tier, so every tier stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60150.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const [W, H, D] = [23, 29, 17];
const key = (x, z) => `${x},${z}`;

// Smooth the lidar roof into three tiers: wings (<= 3), the body (14), and the tower (17): a clean rectangle over the
// west-centre (x 3..11, z 8..14) plus its north bump (x 7..11, z 5..7, where the lidar reads 16). The lidar's notch of
// 15s inside the tower is noise, so the rectangle is taken whole.
const top = new Map();
for (const [x, z, , r] of cells) {
  const tower = r > 3 && ((x >= 3 && x <= 11 && z >= 8 && z <= 14) || (x >= 7 && x <= 11 && z >= 5 && z <= 7 && r >= 16));
  top.set(key(x, z), r <= 3 ? 3 : tower ? 17 : 14);
}
const topAt = (x, z) => top.get(key(x, z)) ?? 0;
const inside = (x, z) => top.has(key(x, z));

// Which outward horizontal neighbours a cell is open to at height y (outside the footprint, or a lower tier).
const exposure = (x, y, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || topAt(nx, nz) <= y;
});

// Glazing rhythm: warm lights behind some panes, chosen by a fixed hash so the build is repeatable.
const lit = (x, y, z) => (x * 7 + y * 5 + z * 3) % 11 === 0;

const blocks = new Map();   // "x,y,z" -> { block, state? }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => blocks.has(`${x},${y},${z}`);

for (const [x, z] of [...top.keys()].map((k) => k.split(",").map(Number))) {
  const t = topAt(x, z);
  for (let y = 0; y < t; y++) {
    const exp = y === 0 ? [] : exposure(x, y, z);
    const skin = exp.length > 0;
    const corner = exp.some(([dx]) => dx !== 0) && exp.some(([, dz]) => dz !== 0);
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                              // plinth under the whole footprint
    if (y === t - 1) { put(x, y, z, skin ? "stone_bricks" : "smooth_stone"); continue; }  // cornice / roof surface
    if (y % 2 === 1 && y >= 3) { put(x, y, z, "white_concrete"); continue; }             // storey slab (pale precast spandrel on the skin)
    if (!skin) continue;                                                                  // air behind the glass
    if (y === 1 && t > 3) { put(x, y, z, "polished_andesite"); continue; }                // shopfront bulkhead
    if (corner) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    // Along a z-face the bays run by x, along an x-face by z: every third column is a white pier between the panes.
    const along = exp.some(([dx]) => dx !== 0) ? z : x;
    if (along % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane");
    const [dx, dz] = exp[0];
    const ix = x - dx, iz = z - dz;                                                       // the room behind this pane
    if (lit(x, y, z) && inside(ix, iz) && topAt(ix, iz) > y) put(ix, y, iz, "glowstone");
  }
}

// Panes join their neighbours (panes, piers, corners) across the wall.
for (const [k, v] of blocks) {
  if (v.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const conn = (x2, z2) => (has(x2, y, z2) ? "true" : "false");
  v.state = { north: conn(x, z - 1), south: conn(x, z + 1), east: conn(x + 1, z), west: conn(x - 1, z), waterlogged: "false" };
}

// The entrance: a recessed pair of iron doors in the south face, flanked by quartz piers, with a hanging lantern in the lobby.
const DOOR_X = 10, DOOR_Z = 16;
put(DOOR_X, 1, DOOR_Z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR_X, 2, DOOR_Z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [DOOR_X - 1, DOOR_X + 1]) for (const y of [1, 2]) put(x, y, DOOR_Z, "quartz_pillar", { axis: "y" });
put(DOOR_X, 2, DOOR_Z - 1, "lantern", { hanging: "true" });

// Roof plant: a penthouse box on the tower, and a row of air-handling units on the body roof.
for (let x = 6; x <= 9; x++) for (let z = 9; z <= 11; z++) {
  if (topAt(x, z) !== 17) throw new Error(`penthouse cell ${x},${z} is not on the tower`);
  for (const y of [17, 18]) put(x, y, z, "light_gray_concrete");
  put(x, 19, z, "stone_bricks");
}
for (const [x, z] of [[15, 9], [16, 9], [15, 10], [16, 10]]) {
  if (topAt(x, z) !== 14) throw new Error(`plant cell ${x},${z} is not on the body`);
  put(x, 14, z, "iron_block");
}

const g = new Voxels([W, H, D]);
for (const [k, v] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) throw new Error(`out of bounds ${k}`);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/DC60150.nbt`);
console.log(JSON.stringify({ cells: cells.length, ...out }));
