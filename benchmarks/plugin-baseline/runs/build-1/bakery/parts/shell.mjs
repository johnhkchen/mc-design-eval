// Part 1, Massing and shell: sidewalk, main ground storey, floors, stairs, partitions, jettied half-timber storey, gable frames, bakehouse wing walls.
// Every opening, brace cell and RESERVED cell (plan.md) is left unset for later parts.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  scatterBlend, masonryWall, fachwerkWall, postRun, beamRun, gableFrame, stairHousing,
  COBBLESTONE, MOSSY_COBBLESTONE, COBBLED_DEEPSLATE, SPRUCE_PLANKS, WHITE_WOOL, GABLE,
} from "../vocab.mjs";

const free = (g, x, y, z) => !g.get(x, y, z);
/** Fill a box with block (+state) into cells that are still empty. */
function fillFree(g, [x0, y0, z0], [x1, y1, z1], block, state, skip = () => false) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++)
    if (free(g, x, y, z) && !skip(x, y, z)) g.set(x, y, z, block, state);
}
const inBox = (x, y, z, [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const wood = (g, x, y, z, axis) => { if (free(g, x, y, z)) g.set(x, y, z, ...B.wood("stripped_spruce", axis)); };
const log = (g, x, y, z) => { if (free(g, x, y, z)) g.set(x, y, z, ...B.log("stripped_spruce", "y")); };

/**
 * The attic stair: spruce stairs up the x=10 column from the bedroom floor (y=7, step (10,7,21)) to the attic floor
 * (y=11, step (10,11,17)), one step per cell northward, planks under each step. The loft hole (10,11,18..20) stays air
 * so the climber has headroom under the bedroom ceiling. A walkable stair, unlike a ladder, so mcd walk can verify it.
 */
function atticStair(g) {
  for (let k = 0; k <= 4; k++) {
    const z = 21 - k, y = 7 + k;
    g.set(10, y, z, ...B.stairs("spruce", "north", "bottom"));
    for (let fy = 7; fy < y; fy++) g.set(10, fy, z, SPRUCE_PLANKS);
  }
}

export function build(g) {
  // sidewalk (kerb and gravel lane are laid by build.mjs)
  scatterBlend(g, 0, 23, 4, 7, COBBLESTONE, MOSSY_COBBLESTONE, 0.15);

  // stairs first: the floors then skip the cells the stair housing already owns
  stairHousing(g);

  // ---- main ground storey: masonry on four sides, openings unset ----
  masonryWall(g, "x", 9, 6, 16, 1, 4, { openings: [[7, 9, 2, 4], [10, 10, 2, 4], [11, 11, 2, 4], [12, 12, 2, 4], [13, 15, 2, 4]] });
  masonryWall(g, "z", 6, 9, 22, 1, 4, { openings: [[11, 12, 3, 4], [17, 18, 3, 4]] });
  masonryWall(g, "z", 16, 9, 22, 1, 4, { openings: [[10, 11, 3, 4], [15, 15, 2, 3]] });
  masonryWall(g, "x", 22, 6, 16, 1, 4, { openings: [[8, 8, 2, 3], [13, 14, 3, 4]] });
  for (const x of [10, 12]) postRun(g, x, 2, 4, 9);
  beamRun(g, "x", 6, 16, 9, 5); beamRun(g, "x", 6, 16, 22, 5);
  beamRun(g, "z", 9, 21, 6, 5); beamRun(g, "z", 9, 21, 16, 5);

  // ---- floors ----
  fillFree(g, [7, 1, 10], [15, 1, 21], SPRUCE_PLANKS);
  fillFree(g, [18, 1, 14], [20, 1, 21], COBBLED_DEEPSLATE);
  fillFree(g, [7, 6, 9], [15, 6, 21], SPRUCE_PLANKS, undefined, (x, y, z) => x <= 8 && z >= 14 && z <= 17);
  fillFree(g, [7, 11, 9], [15, 11, 21], SPRUCE_PLANKS, undefined, (x, y, z) => x === 10 && z >= 18 && z <= 20);
  atticStair(g);

  // ---- partitions ----
  // ground z=16, archway (11..12, 2..3)
  for (const x of [9, 13, 15]) for (let y = 2; y <= 5; y++) log(g, x, y, 16);
  fillFree(g, [9, 2, 16], [15, 5, 16], WHITE_WOOL, undefined, (x, y) => x >= 11 && x <= 12 && y <= 3);
  // upper z=14, doorway (11..12, 7..8)
  for (const x of [9, 13, 15]) for (let y = 7; y <= 10; y++) log(g, x, y, 14);
  fillFree(g, [9, 7, 14], [15, 10, 14], WHITE_WOOL, undefined, (x, y) => x >= 11 && x <= 12 && y <= 8);

  // ---- jettied upper storey (braces and windows unset) ----
  const braceCells = (axis, pos, y) => pos.map((p) => [p, p, y, y]);
  fachwerkWall(g, "x", 8, 6, 16, 6, 10, [6, 8, 11, 14, 16], [[9, 10, 8, 9], [12, 13, 8, 9], ...braceCells("x", [7, 15], 8)]);
  const sidePosts = [8, 10, 13, 15, 18, 20, 22];
  const sideWin = [[11, 12, 8, 9], [16, 17, 8, 9], ...braceCells("z", [9, 14, 19, 21], 8)];
  fachwerkWall(g, "z", 6, 8, 22, 6, 10, sidePosts, sideWin);
  fachwerkWall(g, "z", 16, 8, 22, 6, 10, sidePosts, sideWin);
  fachwerkWall(g, "x", 22, 6, 16, 6, 10, [6, 8, 11, 14, 16], [[9, 10, 8, 9], [12, 13, 8, 9]]);

  // gable frames; the loft door (11,15..16,8) and hoist cells are not touched
  gableFrame(g, GABLE.front);
  gableFrame(g, GABLE.back);

  // ---- bakehouse wing walls (cobbled_deepslate), openings unset ----
  const wingOpen = [
    [19, 19, 3, 4, 13], [21, 21, 2, 3, 17], [21, 21, 3, 4, 15], [21, 21, 3, 4, 20],
    [17, 17, 2, 3, 15], [19, 19, 2, 3, 22],
  ];
  const isOpen = (x, y, z) => wingOpen.some(([x0, x1, y0, y1, zz]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z === zz);
  for (let x = 17; x <= 21; x++) for (let y = 1; y <= 4; y++) for (const z of [13, 22]) if (!isOpen(x, y, z)) fillFree(g, [x, y, z], [x, y, z], COBBLED_DEEPSLATE);
  for (let z = 13; z <= 22; z++) for (let y = 1; y <= 4; y++) for (const x of [17, 21]) if (!isOpen(x, y, z)) fillFree(g, [x, y, z], [x, y, z], COBBLED_DEEPSLATE);
  for (const z of [13, 22]) for (let y = 1; y <= 5; y++) log(g, 21, y, z);
  for (let x = 17; x <= 20; x++) wood(g, x, 5, 13, "x");
  for (let x = 17; x <= 20; x++) wood(g, x, 5, 22, "x");
  for (let z = 14; z <= 21; z++) wood(g, 21, 5, z, "z");
  fillFree(g, [17, 5, 14], [17, 5, 21], COBBLED_DEEPSLATE);
  // wing gable end at the street; king post, vent cell (19,7,13) unset
  log(g, 19, 6, 13);
  fillFree(g, [18, 6, 13], [20, 7, 13], WHITE_WOOL, undefined, (x, y) => x === 19);
}
