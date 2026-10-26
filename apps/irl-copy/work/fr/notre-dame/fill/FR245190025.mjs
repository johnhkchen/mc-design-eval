// FR245190025: a Haussmann-era block (1850s-70s), cream render over a stone plinth. Ground floor is a shopfront
// with a door and an awning; five upper storeys sit on a cordon/lintel rhythm with windows on the odd faces
// (corners are piers); the tall cells end in a mansard of deepslate tiles with dormers; lower wings step down
// to the north-west; two brick chimneys. Interiors are air behind the glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245190025.cells.json", "utf8"));

const SIZE = 5, HEIGHT = 48;
const WALL = "smooth_quartz", PLINTH = "stone_bricks", ROOF = "deepslate_tiles", FLOOR = "oak_planks";
const byXZ = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const g = new Voxels([SIZE, HEIGHT, SIZE]);

const isEdge = (x, z) => x === 0 || z === 0 || x === SIZE - 1 || z === SIZE - 1;
const isCorner = (x, z) => (x === 0 || x === SIZE - 1) && (z === 0 || z === SIZE - 1);
const onZFace = (z) => z === 0 || z === SIZE - 1;
const pane = (x, z) => onZFace(z)
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// The block at (x, y, z) for a cell whose ground is gc and roof top is rc (exclusive): [id, state?] or null for air.
function skin(x, z, y, gc, rc) {
  const li = y - gc;                       // 0 = the plinth course
  const k = Math.floor(li / 5);            // storey index above the plinth
  const idx = onZFace(z) ? x : z;          // position along the face: 0 and 4 are the corner piers
  if (y < gc) return [PLINTH];             // foundation under the ground
  if (y === rc - 1) return [ROOF];         // roof cap
  if (!isEdge(x, z)) {                     // inside: air behind the glass, a slab per storey and a ceiling
    return y === rc - 2 || li % 5 === 0 ? [FLOOR] : null;
  }
  if (y === rc - 2) return ["stone_brick_slab", { type: "bottom" }];                 // cornice
  const mansard = rc - gc >= 15 && y >= rc - 6 && y <= rc - 3;                       // mansard of tall cells
  if (mansard) {
    const dormer = !isCorner(x, z) && idx % 2 === 1 && (y === rc - 5 || y === rc - 4);
    return dormer ? ["glass_pane", pane(x, z)] : [ROOF];
  }
  if (li === 0) return [PLINTH];
  if (isCorner(x, z)) return [WALL];
  if (li < 5) {                            // ground floor: shopfront, door at the south face, awning over the glass
    if (z === SIZE - 1 && x === 2 && li <= 2) {
      return ["dark_oak_door", { facing: "south", half: li === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    }
    if (li === 3 && z === SIZE - 1 && idx >= 1 && idx <= 3) return ["dark_oak_slab", { type: "bottom" }];
    if (li === 4) return [WALL];          // lintel
    return idx >= 1 && idx <= 3 ? ["glass"] : [WALL];
  }
  if (li % 5 === 0 || li % 5 === 4) return [WALL];   // cordon and lintel courses
  if (idx % 2 === 0) return [WALL];                   // the wall between windows
  if ((idx + k) % 3 === 0) return ["glowstone"];      // a lit room
  return ["glass_pane", pane(x, z)];
}

for (let x = 0; x < SIZE; x++) for (let z = 0; z < SIZE; z++) {
  const c = byXZ.get(`${x},${z}`);
  if (!c || c.roof <= 0) continue;         // (0,0) is not on the footprint; nothing where the lidar has no roof
  for (let y = 0; y < c.roof; y++) {
    const m = skin(x, z, y, c.ground, c.roof);
    if (m) g.set(x, y, z, m[0], m[1]);
  }
}

// Two brick chimney stacks on roofs that stand clear, from the roof cap up
for (const [x, z] of [[1, 3], [3, 2]]) {
  const c = byXZ.get(`${x},${z}`);
  for (let y = c.roof; y < c.roof + 3; y++) g.set(x, y, z, "bricks");
  g.set(x, c.roof + 3, z, "stone_brick_slab", { type: "bottom" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245190025.nbt";
console.log(g.save(out));
