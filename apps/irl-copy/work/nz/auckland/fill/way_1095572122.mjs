// Way 1095572122: a 10 x 9 Edwardian shop-top block on Mt Eden's flat, two storeys of brick over a shopfront,
// with plaster string courses, a parapet, and a lift housing on the roof. Roof heights from the lidar snap to two
// flat tiers: the main block (10, parapet) and a low wing (8). Walls are one block thick around an air gap, so
// windows show an air cavity behind the glass; floor slabs and roof lids close each storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095572122.cells.json`, "utf8"));

// [x, z, ground, roof] per footprint cell; the roof snaps to a main tier (10) or a low wing (8)
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof: roof >= 9 ? 10 : 8 });
const inFp = (x, z) => fp.has(`${x},${z}`);
const tierAt = (x, z) => fp.get(`${x},${z}`).roof;
const DIRS = { S: [0, -1], N: [0, 1], W: [-1, 0], E: [1, 0] };          // S is the street front (low z)
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));
const isShell = (x, z) => exposed(x, z).length > 0 ||
  Object.values(DIRS).some(([dx, dz]) => inFp(x + dx, z + dz) && tierAt(x + dx, z + dz) !== tierAt(x, z));

const M = new Map();                                                    // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => M.set(`${x},${y},${z}`, { block, state });
const isPane = (x, y, z) => M.get(`${x},${y},${z}`)?.block === "glass_pane";

// Opening zones: a wall cell is bay-indexed along its main face (S, then N, W, E; x on S/N, z on E/W). The footprint
// is thin and stepped, so most cells are corners; they take the bay of their main face, so windows still run around.
const FACE_ORDER = ["S", "N", "W", "E"];
const mainFace = (exp) => FACE_ORDER.find((d) => exp.includes(d));
const bayOf = (x, z, face) => (face === "S" || face === "N" ? x : z);
const OPEN = { ground: [1, 2], upper: [5, 6] };

for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const H = tierAt(x, z);
  const lidY = H === 10 ? 8 : 7;                                         // roof lid over the interior
  if (!isShell(x, z)) {
    put(x, 0, z, "oak_planks");                                          // ground floor slab
    if (H > 4) put(x, 4, z, "oak_planks");                               // upper floor slab
    put(x, lidY, z, "gray_concrete");                                    // roof membrane
    continue;
  }
  const exp = exposed(x, z);
  const face = mainFace(exp);
  const windowed = face !== undefined && bayOf(x, z, face) % 3 !== 0;   // two windows, then a brick pier
  for (let y = 0; y < H; y++) {
    if (y === 0) put(x, y, z, "polished_andesite");                      // base course
    else if (OPEN.ground.includes(y)) {
      if (exp.includes("S")) put(x, y, z, windowed ? "glass" : "dark_oak_planks");   // shopfront
      else put(x, y, z, windowed ? "glass_pane" : "bricks");
    }
    else if (y === 3) put(x, y, z, exp.includes("S") ? "dark_oak_planks" : "smooth_stone");          // fascia / storey line
    else if (y === 4) put(x, y, z, "white_concrete");                    // plaster string course
    else if (OPEN.upper.includes(y)) put(x, y, z, windowed ? "glass_pane" : "bricks");
    else if (y === 7) put(x, y, z, H === 10 ? "white_concrete" : "stone_bricks");        // lintel band / low cornice
    else if (y === 8) put(x, y, z, "stone_bricks");                      // main cornice
    else put(x, y, z, "bricks");                                         // parapet
  }
}

// The entrance: a single oak door on the street front, in the left bay of the shop
put(1, 1, 0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(1, 2, 0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm light: glowstone behind some upper windows and some shop windows, in the air gap inside the wall
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!isShell(x, z)) continue;
  const face = mainFace(exposed(x, z));
  if (!face) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || isShell(ix, iz)) continue;
  const upper = M.get(`${x},5,${z}`)?.block === "glass_pane";
  const shop = M.get(`${x},1,${z}`)?.block === "glass" && x % 3 === 2;
  if ((upper && (x * 3 + z) % 4 === 0) || shop) put(ix, shop ? 1 : 5, iz, "glowstone");
}

// Glass pane connections: each pane joins the panes beside it on its wall
for (const [k, v] of M) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const c = (b) => (b ? "true" : "false");
  v.state = {
    north: c(isPane(x, y, z - 1)), south: c(isPane(x, y, z + 1)),
    east: c(isPane(x + 1, y, z)), west: c(isPane(x - 1, y, z)), waterlogged: "false",
  };
}

// Roof plant: a lift housing on the main roof (roof ~11 above ground), and a condenser unit by the parapet
for (const [x, z] of [[4, 4], [5, 4], [4, 5], [5, 5]]) { put(x, 9, z, "white_concrete"); put(x, 10, z, "white_concrete"); }
put(7, 9, 3, "iron_block");

const g = new Voxels([10, 23, 9]);
for (const [k, v] of M) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/way_1095572122.nbt`);
console.log(`saved way_1095572122.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
