// Way 1095572124, Auckland: a two-storey brick commercial block of the 1920s-30s, with a ground-floor shopfront,
// a stone string course and cornice, and a brick parapet over a tar-and-stone roof. Lidar gives every cell a roof at
// y 10 and ground at y 0, so the massing is one flat tier (no setbacks to step). Only footprint cells are built.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095572124.cells.json`, "utf8"));   // [x, z, ground, roof]

// Storeys (y is the block row; roof 10 = the top row is y 9):
//   0      floor slab (plinth course on the walls)
//   1-3    shopfront, lintel course at 3
//   4      upper floor slab (string course on the walls)
//   5-7    upper storey: brick pilasters and glass panes
//   8      roof deck (cornice course on the walls)
//   9      brick parapet on the walls; a plant/AC box on the roof
const TOP = 10;
if (cells.some(([, , , roof]) => roof !== TOP)) throw new Error("roof is not uniform; this massing needs tiers");

const [X, Z] = [11, 9];
const g = new Voxels([X, 23, Z]);

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => cell.has(`${x},${z}`);
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const sidesOf = (x, z) => Object.keys(OUT).filter((s) => !inFp(x + OUT[s][0], z + OUT[s][1]));
const isWall = (x, z) => sidesOf(x, z).length > 0;
// corners and every third cell along a wall are brick pilasters; the rest is glazing
const pilaster = (x, z) => {
  const s = sidesOf(x, z);
  return s.length >= 2 || (s.some((d) => d === "north" || d === "south") ? x % 3 === 0 : z % 3 === 0);
};
// a pane joins the wall it sits in and stands clear of the perpendicular one
const pane = (x, z) => {
  const alongX = sidesOf(x, z).some((d) => d === "north" || d === "south");
  return alongX
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };
};

// the entrance: the middle non-pilaster south-facing wall cell (the renderer's street front)
const doorCands = cells.map(([x, z]) => [x, z]).filter(([x, z]) => {
  const s = sidesOf(x, z); return s.length === 1 && s[0] === "south" && !pilaster(x, z);
}).sort((a, b) => a[0] - b[0]);
const door = doorCands.length ? { at: doorCands[Math.floor(doorCands.length / 2)], facing: "south" } : null;

const lanternsGround = [], lanternsUpper = [];
let winIndex = 0;

for (const [x, z, ground] of cells) {
  // foundation under anything above a sloped ground (none here: ground is 0 everywhere, the loop is the rule)
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  const wall = isWall(x, z);
  g.set(x, 0, z, wall ? "polished_andesite" : "stone_bricks");   // plinth on the walls, floor inside
  g.set(x, 4, z, wall ? "smooth_stone" : "stone_bricks");        // string course / upper floor slab
  g.set(x, 8, z, wall ? "smooth_stone" : "stone");               // cornice / roof deck
  if (!wall) continue;

  const pil = pilaster(x, z);
  const isDoor = door && door.at[0] === x && door.at[1] === z;

  // shopfront, y 1-3
  for (const y of [1, 2]) {
    if (isDoor) {
      g.set(x, y, z, "oak_door", { facing: door.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    } else if (pil) {
      g.set(x, y, z, "stone_bricks");
    } else {
      g.set(x, y, z, "glass_pane", pane(x, z));
    }
  }
  if (isDoor) g.set(x, 3, z, "stone_brick_stairs", { facing: door.facing, half: "top", shape: "straight", waterlogged: "false" });   // hood over the door
  else g.set(x, 3, z, "stone_bricks");                                                                                         // lintel course

  // upper storey, y 5-7
  for (const y of [5, 6, 7]) g.set(x, y, z, pil ? "bricks" : "glass_pane", pil ? undefined : pane(x, z));

  // parapet
  g.set(x, 9, z, "bricks");

  // warm light in every other window, set just inside the glass
  if (!pil && !isDoor) {
    const [dx, dz] = OUT[sidesOf(x, z)[0]];
    const ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && !isWall(ix, iz) && winIndex++ % 2 === 0) {
      (lanternsUpper.push([ix, 7, iz]), lanternsGround.push([ix, 1, iz]));
    }
  }
}

// lanterns: a hanging one under the upper roof deck, a standing one on the ground floor
lanternsUpper.forEach(([x, y, z]) => g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }));
lanternsGround.forEach(([x, y, z]) => g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" }));

// roof: two low plant/AC boxes on the interior of the deck, one near each end of the roof
const inside = cells.map(([x, z]) => [x, z]).filter(([x, z]) => !isWall(x, z));
const far = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
if (inside.length) {
  const cx = inside.reduce((s, [x]) => s + x, 0) / inside.length, cz = inside.reduce((s, [, z]) => s + z, 0) / inside.length;
  const near = inside.reduce((b, p) => (far(p, [cx, cz]) < far(b, [cx, cz]) ? p : b));
  const apart = inside.reduce((b, p) => (far(p, near) > far(b, near) ? p : b));
  for (const [x, z] of [near, apart]) g.set(x, 9, z, "light_gray_concrete");
}

g.save(`${DIR}/way_1095572124.nbt`);
