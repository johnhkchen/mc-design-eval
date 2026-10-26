// DC69684: a three-storey Neoclassical (Beaux-Arts palazzo) office block on the Mall's south-east edge, 15 x 12 blocks.
// Stone base, a piano nobile of tall glazed bays, an attic storey, a chiseled-quartz cornice and a stone parapet. The
// lidar's 10-high cluster in the north-west is a single raised cap; the rest is one flat tier at 9 (parapet to 10).
// Hollow: floor slabs at y 0, 3, 6 and the roof deck at 8, air between, glass in the walls, lamps on the floors inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC69684.cells.json`, "utf8"));   // [x, z, ground, roof]

const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => foot.has(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missing = (x, z) => NB.filter(([dx, dz]) => !inF(x + dx, z + dz)).length;
const isEdge = (x, z) => missing(x, z) > 0;

const g = new Voxels([15, 22, 12]);
const placed = new Map();   // "x,y,z" -> block id, for pane/wall connections after the fact
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.set(`${x},${y},${z}`, block); };
const has = (x, y, z) => placed.has(`${x},${y},${z}`);

// The entrance: the middle of the south (high-z) front
const DOOR = [11, 11];

for (const [x, z, ground, roof] of cells) {
  const top = roof >= 10 ? 10 : 9;     // smooth the lidar's 9/10 noise to two flat tiers
  const edge = isEdge(x, z), corner = missing(x, z) >= 3;   // a stepped diagonal face exposes two sides per cell: only a true tip is a corner
  // base course and the floor slab, full footprint (nothing floats)
  for (let y = ground; y < top; y++) {
    if (!edge) {
      if (y === 0) put(x, y, z, "stone_bricks");
      else if (y === 3 || y === 6) put(x, y, z, "smooth_quartz");
      else if (y === 8) put(x, y, z, "stone");
    }
  }
  if (!edge) {
    if (top === 10) put(x, 9, z, "smooth_stone");          // the raised cap over the north-west pavilion
    continue;
  }
  // the walls: a full column from the base to the parapet on every edge cell
  for (let y = ground; y <= 9; y++) {
    if (y === 0) put(x, y, z, "stone_bricks");
    else if (y === 3 || y === 6) put(x, y, z, "chiseled_quartz_block");     // storey lines
    else if (y === 8) put(x, y, z, "smooth_quartz");                        // cornice
    else if (y === 9) put(x, y, z, "stone_bricks");                             // parapet
    else if (corner || (x + z) % 3 === 0) put(x, y, z, "quartz_pillar", { axis: "y" });  // piers
    else put(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }); // glazed bays
  }
  // ground-floor door under a chiseled hood
  if (x === DOOR[0] && z === DOOR[1]) {
    put(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Warm lights inside, on the floor, behind some of the ground and piano nobile windows
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!isEdge(x, z) || corner(x, z)) continue;
  if ((x + z) % 3 === 0 || (x * 3 + z) % 4 !== 0) continue;
  const inner = NB.map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => inF(a, b) && !isEdge(a, b));
  if (!inner) continue;
  if (x === DOOR[0] && z === DOOR[1]) continue;
  if (!has(inner[0], 1, inner[1])) put(inner[0], 1, inner[1], "lantern", { hanging: "false", waterlogged: "false" });
  if (!has(inner[0], 4, inner[1]) && (x + 2 * z) % 2 === 0) put(inner[0], 4, inner[1], "shroomlight");
}
function corner(x, z) { return missing(x, z) >= 3; }

// rooftop plant: a 2 x 2 mechanical box on the roof deck
for (const [x, z] of [[9, 7], [10, 7], [9, 8], [10, 8]]) put(x, 9, z, "light_gray_concrete");

// glass panes connect to their neighbours, as vanilla shapes them
for (const [key, block] of placed) {
  if (block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const c = (dx, dz) => (has(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, "light_blue_stained_glass_pane", { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" });
}

const r = g.save(`${DIR}/DC69684.nbt`);
console.log(`DC69684: ${r.blocks} blocks, palette ${r.palette}`);
