import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1722 19th St NW (Dupont Circle): a brick apartment block of the 1910s. A tall front bay (x1-5) stands
// on a set-back podium of lower brick wings; the front (north, z=0) carries the storey lines, the glazing
// and the entrance; the back (south, z=2) is glazed the same way; the one-cell air gap (z=1) sits behind both.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63130.cells.json", "utf8"));
const g = new Voxels([10, 23, 3]);

const BRICK = "bricks", STONE = "smooth_stone", BASE = "polished_granite", FLOOR = "stone_bricks";
const BELTS = [3, 5, 7];          // storey lines (floor slabs, sills and heads)
const GLAZED = [1, 2, 4, 6, 8];   // glazing rows: ground storey is two blocks, upper storeys one
const DOOR_X = 3;                 // lobby door in the middle of the tower's front
const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const open = (x, z) => !has.has(`${x},${z}`);
const pane = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

for (const [x, z, ground, roof] of cells) {
  const n = open(x, z - 1), s = open(x, z + 1), w = open(x - 1, z), e = open(x + 1, z);
  const shell = n || s || w || e;                   // exterior wall (else an air-gap cell)
  const facade = (z === 0 && n) || (z === 2 && s);   // the two faces that carry glazing
  const top = roof - 1;
  for (let y = 0; y < roof; y++) {
    if (y < ground) { g.set(x, y, z, BASE); continue; }             // foundation under the lidar ground
    if (y === top) { g.set(x, y, z, shell ? STONE : FLOOR); continue; } // cornice / roof membrane
    if (!shell) {                                                     // air gap: floors only
      if (y === 0 || BELTS.includes(y)) g.set(x, y, z, FLOOR);
      continue;
    }
    if (y === 0) { g.set(x, y, z, BASE); continue; }                  // base course
    if (BELTS.includes(y) || y === 9) { g.set(x, y, z, STONE); continue; } // storey lines, tower cornice
    if (facade && z === 0 && x === DOOR_X && (y === 1 || y === 2)) {  // lobby door
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (facade && GLAZED.includes(y)) {
      if (x % 2 === 0) g.set(x, y, z, "glass_pane", pane);            // panes on even bays, brick piers between
      else g.set(x, y, z, BRICK);
      continue;
    }
    g.set(x, y, z, BRICK);
  }
}

// entrance canopy over the lobby door (dark band on the storey line), and warm lights behind the glazing
for (const x of [DOOR_X - 1, DOOR_X, DOOR_X + 1]) g.set(x, 3, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });
g.set(2, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
g.set(4, 1, 1, "glowstone");
g.set(2, 4, 1, "shroomlight");
g.set(4, 4, 1, "glowstone");

// roof equipment: a two-storey mechanical penthouse on the back wing (stands on its cap at y5)
for (const x of [5, 6]) {
  g.set(x, 6, 2, "light_gray_concrete");
  g.set(x, 7, 2, STONE);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63130.nbt");
