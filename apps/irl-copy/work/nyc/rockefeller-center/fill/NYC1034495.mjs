// 36 West 48th Street, 1920: a six-storey brick loft-office on a narrow midblock lot (7 x 26 blocks, about 25 ft by 100 ft).
// The street front is the z = 0 end: a granite base and shopfront with a central entrance under a dark canopy, then brick
// piers and paired storey windows, stone belt courses at every floor line and a stone cornice and parapet. The lidar's
// tall strip along the west edge is the party wall, carried up as a fire wall above the roofs. Behind the front, a
// five-storey setback, the six-storey body, a five-storey south wing, and a one-storey rear wing over the yard.
// The side walls are blank brick, as on a midblock lot. The roof has a stair bulkhead and a wooden water tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034495.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 7, Y = 34, Z = 26;

// Roof tiers from the lidar, smoothed into flat levels (roof height in blocks above y 0; walls stand to tier - 1).
// 0 and noise are read as the surrounding tier, so the lidar's holes and single-cell dips do not show as steps.
const tierOf = (x, z, r) => {
  if (z === 25 || (z === 24 && x === 1)) return 6;             // rear one-storey wing over the yard
  if (r >= 21 || (x === 1 && z >= 2 && z <= 22)) return 22;    // west party wall, a fire wall above the roofs
  if (z <= 1) return 16;                                       // street front, five storeys
  if (z <= 15) return 19;                                      // six-storey body
  return 15;                                                   // south wing, five storeys
};

const H = new Map(), footprint = [];
for (const [x, z, , r] of cells) { H.set(`${x},${z}`, tierOf(x, z, r)); footprint.push([x, z]); }
const topAt = (x, z) => H.get(`${x},${z}`) ?? -1;              // off the footprint is open to the air at every height

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
// The exposed faces of a cell at height y: a neighbour that does not reach y (or no neighbour) leaves the face open.
const facesAt = (x, z, y) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return topAt(x + dx, z + dz) <= y; });

const GLASS = { block: "glass_pane", state: { north: "false", south: "false", east: "true", west: "true" } };   // arms run into the piers
const DOOR = (half) => ({ block: "dark_oak_door", state: { facing: "north", half, hinge: "left", open: "false", powered: "false" } });
const BRICK = { block: "bricks" };
const STONE = { block: "smooth_sandstone" };
const GRANITE = { block: "polished_granite" };
const STONE_PIER = { block: "stone_bricks" };
const DECK = { block: "smooth_stone" };

// Walls of a cell at height y, by the face it shows. Belt courses and the cornice run on every face.
function wallAt(x, y, z, top, faces) {
  if (z === 0 && y === 3 && x >= 3 && x <= 5 && faces.includes("n")) return { block: "black_concrete" };   // entrance canopy
  if (y === 0) return GRANITE;                                    // base course
  if (y === top - 1 || y % 3 === 0) return STONE;                 // cornice and storey belt courses
  if (faces.includes("n")) {                                      // street front (and the setback face above it)
    if (z === 0 && y <= 2) {                                      // shopfront: glass either side of a central door, granite piers
      if (x === 4) return DOOR(y === 1 ? "lower" : "upper");
      return x === 3 || x === 5 ? GLASS : GRANITE;
    }
    return x === 3 || x === 5 ? GLASS : BRICK;
  }
  if (faces.includes("s")) return x % 2 === 0 ? GLASS : BRICK;    // rear windows on the yard side
  return z % 3 === 2 ? STONE_PIER : BRICK;                        // blank party-wall sides, with stone pilasters
}

const g = new Voxels([X, Y, Z]);

for (const [x, z, ground] of cells) {
  const top = topAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "polished_granite");   // foundation under any sloped ground
  for (let y = ground; y < top; y++) {
    const faces = facesAt(x, z, y);
    // Perimeter cells are walls; interior cells are air with a floor slab at every storey line and a roof deck on top.
    const b = faces.length ? wallAt(x, y, z, top, faces) : (y === top - 1 || y % 3 === 0 ? DECK : null);
    if (b) g.set(x, y, z, b.block, b.state);
  }
  // Parapet and coping on any roof edge: the cell's top wall stands under a brick parapet with a stone cap.
  if (facesAt(x, z, top - 1).length) {
    g.set(x, top, z, "bricks");
    g.set(x, top + 1, z, "smooth_sandstone_slab", { type: "bottom" });
  }
}

// Stair and elevator bulkhead on the body roof, 3 x 3 (x 3..5, z 8..10), brick with a stone cap, door to the north.
for (let x = 3; x <= 5; x++) for (let z = 8; z <= 10; z++) {
  for (let y = 19; y <= 21; y++) g.set(x, y, z, "bricks");
  g.set(x, 22, z, "smooth_sandstone_slab", { type: "bottom" });
}
g.set(4, 19, 8, DOOR("lower").block, DOOR("lower").state);
g.set(4, 20, 8, DOOR("upper").block, DOOR("upper").state);
g.set(3, 20, 8, GLASS.block, GLASS.state);
g.set(5, 20, 8, GLASS.block, GLASS.state);

// Wooden water tower on four posts over the body's rear roof (x 2..4, z 12..13).
for (const x of [2, 4]) for (const z of [12, 13]) for (let y = 19; y <= 21; y++) g.set(x, y, z, "spruce_log");
for (let x = 2; x <= 4; x++) for (let z = 12; z <= 13; z++) for (let y = 22; y <= 23; y++) g.set(x, y, z, "oak_planks");

// Warm light behind the shopfront and the first-floor windows, in the air gap just inside the glass.
for (const [x, y] of [[3, 1], [5, 4], [3, 7], [5, 10], [3, 13]]) g.set(x, y, 1, "glowstone");

const out = g.save(`${DIR}/NYC1034495.nbt`);
console.log(JSON.stringify(out));
