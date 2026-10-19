// 60 West 45th Street (NYC1034236): a 1920 three-storey Midtown brick walk-up over shops. The lidar roof is 9 blocks
// (3 storeys of 3) with a 7-block wing at the rear. The footprint has a rear light court open to the rear lot, and a
// one-cell recess on the street face where the entrance sits. The shell is one cell thick; the interior is air apart
// from the floor slabs and a few glowstone lamps behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1034236.cells.json", "utf8"));
const X = 6, Z = 25;

const roof = Array.from({ length: X }, () => new Array(Z).fill(0));
for (const [x, z, , r] of cells) roof[x][z] = r;

const R = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : roof[x][z]);
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Shell = a building cell with a neighbour outside the footprint or in the court (roof 0).
const edge = (x, z) => R(x, z) > 0 && SIDES.some(([dx, dz]) => R(x + dx, z + dz) === 0);
// Street face: the z=0 row, and the back wall of the one-cell recess at x=2.
const street = (x, z) => z === 0 || (x === 2 && z === 1);
// Window rows are the middle two of each three-row storey: 1-2, 4-5, 7 (8 is the cornice).
const windowRow = (y) => y % 3 !== 0;

function facadeKind(x, y, z) {
  if (street(x, z)) {
    if (y < 3) return x === 2 && z === 1 ? "door" : (x === 0 || x === 5 ? "brick" : "glass");
    return [1, 3].includes(x) ? "glass" : "brick";
  }
  return z % 2 === 1 ? "glass" : "brick";
}

const glassAt = (x, y, z) => edge(x, z) && windowRow(y) && facadeKind(x, y, z) === "glass";

function kindAt(x, y, z) {
  const h = R(x, z);
  if (h === 0) return y === 0 ? "court" : null;
  if (y >= h) return null;
  const shell = edge(x, z);
  if (y === h - 1) return shell ? "cornice" : "roof";
  if (y === 0) return shell ? "base" : "floor";
  if (y % 3 === 0) return shell ? "band" : "floor";
  if (shell) return facadeKind(x, y, z);
  const lit = SIDES.some(([dx, dz]) => glassAt(x + dx, y, z + dz)) && (x * 7 + y * 3 + z * 5) % 12 === 0;
  return lit ? "lamp" : null;
}

const MATERIAL = {
  court: "stone_bricks", base: "polished_andesite", floor: "stone", band: "smooth_stone",
  cornice: "smooth_stone", roof: "stone", brick: "bricks", glass: "glass", lamp: "glowstone",
};

const g = new Voxels([X, 21, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  for (let y = 0; y < 21; y++) {
    const kind = kindAt(x, y, z);
    if (!kind) continue;
    if (kind === "door") {
      g.set(x, y, z, "oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      g.set(x, y, z, MATERIAL[kind]);
    }
  }
}

// Lantern on the paving in front of the recessed door, and the lintel over the recess.
g.set(2, 3, 0, "smooth_stone");
g.set(2, 1, 0, "lantern", { hanging: "false", waterlogged: "false" });

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1034236.nbt");
console.log(JSON.stringify(stats));
