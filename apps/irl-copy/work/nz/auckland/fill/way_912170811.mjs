import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey brick shop-top block, c. 1900-1930 (Mt Eden / Newton main-road type): brick walls on a stone base, a
// shopfront with glazed bays on the ground storey, a stone string course, a stone-framed upper storey with windows,
// a moulded cornice, a brick parapet and stone coping. Articulation is by face: piers at every third cell along each
// exposed face and at every corner, glass between them. Footprint cells only.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170811.cells.json", "utf8"));
const g = new Voxels([6, 23, 6]);

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inFoot = (x, z) => ground.has(`${x},${z}`);
const R = Math.max(...cells.map((c) => c[3]));           // the roof height above y 0 (flat here: 10)
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inFoot(x + DIRS[d][0], z + DIRS[d][1]));

// interior: no exposed face; pier: a corner or every third cell along a face; window: the rest of a face
function role(x, z) {
  const ex = exposed(x, z);
  if (!ex.length) return "interior";
  if (ex.length > 1) return "pier";
  const u = ex[0] === "N" || ex[0] === "S" ? x : z;
  return u % 3 === 0 ? "pier" : "window";
}

const DOOR = [2, 0];                                       // the entrance on the lowest (north) face
const FULL = { north: "true", south: "true", east: "true", west: "true" };
const paneState = (face) => (face === "N" || face === "S"
  ? { north: "none", south: "none", east: "true", west: "true" }
  : { north: "true", south: "true", east: "none", west: "none" });

// the floor slab and the roof deck over every footprint cell; walls go over these
for (const [x, z, gr] of cells) {
  g.set(x, gr, z, "stone_bricks");                         // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, 5, z, "smooth_stone");                          // upper floor slab
  g.set(x, R - 1, z, "smooth_stone");                      // roof deck
}

for (const [x, z, gr] of cells) {
  const r = role(x, z);
  if (r === "interior") continue;
  const ex = exposed(x, z);
  const [dx, dz] = DIRS[ex[0]] ?? [0, 0];
  const face = ex.length === 1 ? ex[0] : null;

  g.set(x, gr + 1, z, "stone_bricks");                     // base course
  for (let y = gr + 2; y <= 4; y++) g.set(x, y, z, r === "pier" ? "bricks" : "glass_pane", r === "pier" ? undefined : paneState(face));
  if (r === "window") g.set(x, 4, z, "stone_bricks");      // shopfront lintel
  g.set(x, 5, z, "stone_bricks");                          // string course between the storeys
  if (r === "window") g.set(x, 6, z, "stone_bricks");      // upper sill
  for (let y = 6; y <= 8; y++) {
    if (y === 6 && r === "window") continue;
    g.set(x, y, z, r === "pier" ? "bricks" : "glass_pane", r === "pier" ? undefined : paneState(face));
  }
  g.set(x, R - 1, z, "stone_bricks");                      // moulded cornice
  g.set(x, R, z, "bricks");                                // parapet
  g.set(x, R + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // coping
}

// the entrance: a pair of doors in the north bay, a planked transom and a hood over
const [dX, dZ] = DOOR;
g.set(dX, 1, dZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dX, 2, dZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(dX, 3, dZ, "dark_oak_planks");
g.set(dX, 4, dZ, "oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });

// warm lights behind some windows: a lamp on the floor just inside, the upper ones on a shelf slab
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  if (role(x, z) !== "window" || ex.length !== 1) continue;
  const face = ex[0];
  const [ix, iz] = [x - DIRS[face][0], z - DIRS[face][1]];   // the cell just inside this window
  if (!inFoot(ix, iz) || role(ix, iz) !== "interior") continue;
  const gi = ground.get(`${ix},${iz}`);
  if (gr === 0 && (x + z) % 2 === 1) g.set(ix, gi + 1, iz, "glowstone");   // shopfront bays
  if (gr > 0 && (x + z) % 2 === 0) {
    g.set(ix, 6, iz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    g.set(ix, 7, iz, "glowstone");
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170811.nbt");
console.log(JSON.stringify(info));
