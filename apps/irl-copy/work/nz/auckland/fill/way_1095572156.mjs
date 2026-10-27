// Way 1095572156, Eden Terrace: a two-storey brick commercial block with a shopfront, a timber fascia, a
// stone string course and a parapet on a flat roof. The lidar roof is 9 above y 0, so the parapet top is y 8.
// Storeys: ground y 1-3 (shop), floor band y 4, upper y 5-6, cornice y 7 (also the roof deck), parapet y 8.
// Interiors are air behind 1-block walls, with one floor slab per storey; no interiors are fitted out.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_1095572156.cells.json`, "utf8"));

// [x, z, ground, roof] per footprint cell
const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);
const exX = (x, z) => !inF(x - 1, z) || !inF(x + 1, z);     // a face looks east or west
const exZ = (x, z) => !inF(x, z - 1) || !inF(x, z + 1);     // a face looks north or south
const edge = (x, z) => exX(x, z) || exZ(x, z);
const front = (x, z) => !inF(x, z + 1);                      // the street side (+z)
const bay = (x, z) => (exX(x, z) && !exZ(x, z) && z % 2 === 1) || (exZ(x, z) && !exX(x, z) && x % 2 === 1);

const ROOF = Math.max(...cells.map((c) => c[3]));
if (ROOF !== 9) throw new Error(`the layers are cut for a roof at 9, got ${ROOF}`);

const g = new Voxels([9, 22, 9]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const doorX = Math.min(...cells.filter(([x, z]) => front(x, z)).map((c) => c[0]));

for (const [k, { ground }] of F) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");        // foundation (none here: ground is 0)
  put(x, 0, z, "stone_bricks");                                          // plinth and ground floor slab
  put(x, 4, z, "smooth_stone");                                          // floor band and string course
  put(x, 7, z, "stone");                                                 // roof deck (cornice on the edge)
  if (!edge(x, z)) continue;

  // ground storey: shopfront glass on the street side, a door at its west end, windows on bays, brick piers
  for (const y of [1, 2]) {
    if (front(x, z)) {
      if (x === doorX) put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "glass_pane");
    } else put(x, y, z, bay(x, z) ? "glass_pane" : "bricks");
  }
  put(x, 3, z, front(x, z) ? "dark_oak_planks" : "smooth_stone");        // shop fascia and lintel course
  if (front(x, z) && x === doorX) put(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });  // entry light

  // upper storey: windows on bays, brick piers between
  for (const y of [5, 6]) put(x, y, z, bay(x, z) ? "glass_pane" : "bricks");
  put(x, 8, z, "bricks");                                                 // parapet
}

// warm lights inside, behind some windows: lanterns on the ground floor, glowstone on the upper floor
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  if (edge(x, z)) continue;
  if ((x * 3 + z) % 5 === 0) put(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  if ((x + 2 * z) % 4 === 1) put(x, 5, z, "glowstone");
}

// roof equipment: a 2 x 2 plant plinth on the deck, if the footprint has room for it
const plant = [[3, 3], [4, 3], [3, 4], [4, 4]];
if (plant.every(([x, z]) => inF(x, z) && !edge(x, z))) for (const [x, z] of plant) put(x, 8, z, "stone_bricks");

// glass panes connect to the wall or pane beside them, as the game would
const solidish = (b) => b && (b === "glass_pane" || /bricks|stone|planks/.test(b));
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  for (const y of [1, 2, 5, 6]) {
    const here = g.get(x, y, z);
    if (here?.block !== "glass_pane") continue;
    const link = (dx, dz) => (solidish(g.get(x + dx, y, z + dz)?.block) ? "true" : "false");
    put(x, y, z, "glass_pane", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" });
  }
}

const out = g.save(`${dir}/way_1095572156.nbt`);
console.log(`way_1095572156: ${cells.length} cells, ${out.blocks} blocks, ${out.palette} palette entries`);
