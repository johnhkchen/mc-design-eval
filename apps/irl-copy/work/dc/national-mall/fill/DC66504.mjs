// 801 9th St NW: a 1920s-style Classical commercial office block (pale stone, glazed bays, shopfront) on the lidar massing.
// Tiers follow the lidar roof heights, smoothed: a 15-block main body (5 storeys at a 3-block pitch), two 17-block corner
// pavilions on the west face, 12-block lower wings to the north-east and south-east, a 3-block one-storey arcade and a 6-block notch.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66504.cells.json", "utf8"));

// the flat tier each footprint cell is built to, from its position (the lidar's 12-17 noise collapses into these)
function tier(x, z) {
  if (x >= 14) return z === 28 && x <= 19 ? 3 : 12;   // south-east wing; row 28 is a one-storey arcade
  if (x <= 5 && z <= 5) return 17;                     // north-west corner pavilion
  if (x <= 5 && z >= 33) return 17;                    // south-west corner pavilion
  if (z <= 5) return 12;                               // north-east lower wing
  if (x === 1 && z >= 18 && z <= 20) return 6;         // two-storey notch on the west face
  return 15;                                           // main body, five storeys
}

const key = (x, z) => `${x},${z}`;
const FP = new Map();
for (const [x, z, g] of cells) FP.set(key(x, z), { H: tier(x, z), g });
const inFP = (x, z) => FP.has(key(x, z));
const hOf = (x, z) => (inFP(x, z) ? FP.get(key(x, z)).H : 0);
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// the outward faces of a cell that are open to air at height y: outside the footprint, or a shorter neighbour's top has passed
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => y >= hOf(x + dx, z + dz));

// what stands at a cell's height y: null is air (interiors, behind the glass)
function materialAt(x, z, y) {
  const { H, g } = FP.get(key(x, z));
  if (y >= H) return null;
  const ex = exposed(x, z, y), wall = ex.length > 0;
  if (y < g) return "stone";                                       // foundation under a sloping cell (none here: ground is 0)
  if (y === 0) return wall ? "polished_granite" : "smooth_stone";  // base course, floor slab
  if (y === H - 1) return wall ? "smooth_quartz" : "gray_concrete"; // cornice / built-up roof deck
  if (y % 3 === 0) return wall ? "smooth_quartz" : "smooth_stone";  // storey line / floor slab
  if (!wall) return null;
  const pier = ex.length >= 2 || (ex[0][0] !== 0 ? z : x) % 3 === 0; // every third cell on a face is a pier; corners too
  return pier ? "calcite" : "glass_pane";
}

const g = new Voxels([21, 29, 39]);
const GLASS_PANE = "glass_pane";

for (const [x, z] of [...FP.keys()].map((k) => k.split(",").map(Number))) {
  const { H } = FP.get(key(x, z));
  for (let y = 0; y < H; y++) {
    const m = materialAt(x, z, y);
    if (m) g.set(x, y, z, m);
  }
  // roof plant on the flat roofs: condenser units in 2 x 2 clusters standing on the deck, kept off the parapet
  if (materialAt(x, z, H - 1) === "gray_concrete" && H === 15 && x % 6 >= 2 && x % 6 <= 3 && z % 8 >= 3 && z % 8 <= 4) {
    g.set(x, H, z, "iron_block");
  }
  if (materialAt(x, z, H - 1) === "gray_concrete" && H === 12 && x % 5 === 1 && z % 6 === 2) {
    g.set(x, H, z, "light_gray_concrete");
  }
}

// warm light: some glazed bays have a glowstone just inside the glass (the one air cell behind the window is kept)
for (const [x, z] of [...FP.keys()].map((k) => k.split(",").map(Number))) {
  const { H } = FP.get(key(x, z));
  for (let y = 1; y < H; y++) {
    if (materialAt(x, z, y) !== GLASS_PANE || (x * 5 + z * 7 + y) % 13 !== 0) continue;
    const d = exposed(x, z, y)[0];
    const ix = x - d[0], iz = z - d[1];
    if (inFP(ix, iz) && materialAt(ix, iz, y) === null) g.set(ix, y, iz, "glowstone");
  }
}

// the entrance: a double door in the west face between two piers, lit by the stone portal's lintel (the storey line above)
for (const z of [28, 29]) for (const y of [1, 2]) {
  g.set(0, y, z, "dark_oak_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: z === 28 ? "left" : "right", open: "false", powered: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66504.nbt");
