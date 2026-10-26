import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A stripped-classical Federal office block in pale limestone: a 12-block wing ring round a 14-block core, the core
// setting back in a 12 x 6 attic tier. Storey lines every 3 blocks, a rusticated plinth, quoins at the corners, a
// cornice and parapet, glazing in pane bays with stone mullions, a central portico on the north (z=0) bay, and a
// hollow interior: each storey is a floor slab, the glass has an air gap behind it, and the lamps sit in those gaps.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63463.cells.json`, "utf8"));

const W = 21, H = 26, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));
const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && foot.has(key(x, z));
// The lidar's 14 is the core; its 13s are noise between the two tiers, so everything under 14 is a 12-block wing
const isCore = (x, z) => inFoot(x, z) && foot.get(key(x, z)) >= 14;
// The attic tier: core cells whose four neighbours are all core, so it steps in one block from the core's edge
const isTier = (x, z) => isCore(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => isCore(x + dx, z + dz));

const FLOORS = new Set([0, 3, 6, 9, 12]);          // floor slabs (and the ground), each storey's bottom course
const BANDS = new Set([1, 2, 4, 5, 7, 8, 10]);     // window rows; 3, 6, 9 and 12 are string courses
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Occupancy: the wings to 12, the core to 12, and the attic tier to 14
const occ = (x, y, z) => inFoot(x, z) && y >= 0 && (y < 12 || (y < 14 && isTier(x, z)));
const above = (x, y, z) => occ(x, y + 1, z);
const exposed = (x, y, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !occ(x + dx, y, z + dz)).map(([k]) => k);

const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: what each occupied cell is made of, and which exterior cells are glazed
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const isSolid = (x, y, z) => plan.has(`${x},${y},${z}`);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
  if (!occ(x, y, z)) continue;
  const ex = exposed(x, y, z);
  if (!above(x, y, z)) {                                   // a top surface: the parapet rim, or the flat roof
    if (ex.length) put(x, y, z, "stone_bricks");
    else put(x, y, z, "smooth_stone");
    continue;
  }
  if (!ex.length) {                                        // inside: the floor slabs and the storey-11 deck under the attic
    if (FLOORS.has(y) || y === 11) put(x, y, z, "smooth_stone");
    continue;
  }
  // quoins only at the block's outer corners; the jogs in its outline are plain wall
  const corner = ex.length >= 2 && (x === 0 || x === W - 1 || z === 0 || z === D - 1);
  if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                  // plinth course
  if (FLOORS.has(y)) { put(x, y, z, "smooth_stone"); continue; }             // string course at each storey line
  if (corner) { put(x, y, z, "chiseled_stone_bricks"); continue; }          // quoins
  if (BANDS.has(y)) {
    const face = ex[0];
    const along = face === "N" || face === "S" ? x : z;
    if (along % 3 !== 0) {                                                 // panes two to a bay, stone mullion between
      put(x, y, z, "light_blue_stained_glass_pane", face === "N" || face === "S" ? PANE_NS : PANE_EW);
      continue;
    }
  }
  put(x, y, z, "calcite");
}

// Pass 2: the portico on the south (street) front, z=11. Two iron doors, lanterns under the lintel
const PZ = D - 1;
const doorState = (half, hinge) => ({ facing: "south", half, hinge, open: "false", powered: "false" });
for (const [x, hinge] of [[9, "right"], [10, "left"]]) {
  put(x, 1, PZ, "iron_door", doorState("lower", hinge));
  put(x, 2, PZ, "iron_door", doorState("upper", hinge));
}
put(8, 2, PZ, "lantern", { hanging: "true", waterlogged: "false" });
put(11, 2, PZ, "lantern", { hanging: "true", waterlogged: "false" });

// Pass 3: lamps in the air gap behind some panes, warm light through the glass at dusk
for (const [k, v] of [...plan.entries()]) {
  if (!v.block.endsWith("stained_glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number);
  const face = Object.entries(DIRS).find(([, [dx, dz]]) => !occ(x + dx, y, z + dz));
  if (!face || ![1, 4, 7, 10].includes(y)) continue;
  if ((x * 7 + y * 3 + z) % 5 !== 0) continue;
  const [dx, dz] = face[1];
  const ix = x - dx, iz = z - dz;                          // the cell inward of the pane
  if (!occ(ix, y, iz) || isSolid(ix, y, iz)) continue;     // only into a free air gap
  put(ix, y, iz, "glowstone");
}

// Pass 4: roof kit. Iron air-handling boxes on the wing roofs, and two on the attic tier's roof
const roofTop = (x, z) => inFoot(x, z) && !isTier(x, z) && !isCore(x, z) && occ(x, 11, z) && !above(x, 11, z);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (roofTop(x, z) && !exposed(x, 11, z).length && x % 6 === 3 && z % 3 === 2) put(x, 12, z, "iron_block");
}
put(6, 14, 6, "iron_block");
put(11, 14, 8, "iron_block");

// Write it. Air is nothing: the gap behind glass and the storey interiors are left out of the file
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}

const info = g.save(`${DIR}/DC63463.nbt`);
console.log(JSON.stringify(info));
