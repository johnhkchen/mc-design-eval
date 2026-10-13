// P5 Yards: plots 4-6 (kitchen garden, chicken run and trough, shared well yard), the plot 0 back step and wood pile,
// the plot 1 back-yard flower beds and the plot 7 loading barrels. The coop itself (walls, floor, nests) is the shell's.
import { feedShed } from "./coop.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  gate_pair, scarecrow, woodpile, wash_line, well, tree, channel, crop_bed, trough,
} from "../vocab.mjs";

const AIR = /(^|:)(cave_|void_)?air$/;

/** One write, only into air: an earlier part's cell is never overwritten. */
function put(g, x, y, z, block, state) {
  if (!g.inBounds(x, y, z) || !AIR.test(g.blockAt(x, y, z))) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

/** A path cell on the ground row: the ground is the only block here that is not air, so it is written over directly. */
function ground(g, x, y, z, block) {
  g.set(x, y, z, block);
}

/** A fence run on y1 through the given [x, z] cells: each post connects to its neighbours in the run. */
function fenceCells(g, cells, block) {
  const has = new Set(cells.map(([x, z]) => `${x},${z}`));
  let n = 0;
  for (const [x, z] of cells) {
    const dirs = {
      north: has.has(`${x},${z - 1}`), south: has.has(`${x},${z + 1}`),
      east: has.has(`${x + 1},${z}`), west: has.has(`${x - 1},${z}`),
    };
    const state = Object.fromEntries([...Object.entries(dirs).map(([d, on]) => [d, String(on)]), ["waterlogged", "false"]]);
    n += put(g, x, 1, z, block, state);
  }
  return n;
}

/** The perimeter of the box x0..x1 by z0..z1 at ground row, leaving the cells in `gaps` open. */
function ring(x0, z0, x1, z1, gaps = []) {
  const skip = new Set(gaps.map(([x, z]) => `${x},${z}`));
  const cells = [];
  for (let x = x0; x <= x1; x++) { cells.push([x, z0], [x, z1]); }
  for (let z = z0 + 1; z < z1; z++) { cells.push([x0, z], [x1, z]); }
  return cells.filter(([x, z]) => !skip.has(`${x},${z}`));
}

export function build(g) {
  // ---- plot 4: kitchen garden (x 48..59, z 5..18) ----
  // Fence ring round the garden with the gate in the north side at x 53..54.
  fenceCells(g, ring(48, 5, 59, 18, [[53, 5], [54, 5]]), "oak_fence");
  gate_pair(g, 53, 5, "oak");
  // Centre path, then the water channel (x 49..52 and 55..58 at z 11) with the path bridged over it.
  for (let z = 6; z <= 17; z++) for (const x of [53, 54]) ground(g, x, 0, z, "dirt_path");
  channel(g, 49, 52, 11);
  channel(g, 55, 58, 11);
  for (const x of [53, 54]) g.set(x, 0, 11, "oak_planks");
  // Four beds of crops on farmland, north and south of the channel.
  crop_bed(g, 49, 52, 7, 10, "wheat", { soil: true });
  crop_bed(g, 55, 58, 7, 10, "carrots", { soil: true });
  crop_bed(g, 49, 52, 12, 15, "potatoes", { soil: true });
  crop_bed(g, 55, 58, 12, 15, "beetroots", { soil: true });
  // Work strip at the back: scarecrow, rain barrel (water cauldron), composter and barrel.
  scarecrow(g, 50, 17);
  put(g, 49, 1, 16, "water_cauldron", { level: "3" });
  put(g, 57, 1, 17, "composter", { level: "4" });
  put(g, 58, 1, 17, "barrel", { facing: "up", open: "false" });
  // Lantern standing on the back fence post: the centre path and the work strip are dark (0) without it.
  put(g, 54, 2, 18, "lantern", { hanging: "false" });

  // ---- plot 5: coop run (x 60..71, z 5..18) and yard fittings ----
  // The run is fenced round with its gate at x 65..66 on the north side; the coop box itself is the shell's.
  fenceCells(g, ring(60, 5, 71, 18, [[65, 5], [66, 5]]), "oak_fence");
  gate_pair(g, 65, 5, "oak");
  // Coop ramp (spruce slab, bottom half) up to the chicken door's floor, straw corner, feed trough and water trough.
  feedShed(g);
  trough(g, 62, 63, 8);
  trough(g, 69, 69, 8, { water: true });
  put(g, 61, 1, 10, "hay_block", { axis: "y" });

  // ---- plot 6: shared well yard (x 72..83, z 5..18) ----
  well(g, 76, 9);
  // Bench: two oak stairs facing south, with an oak fence post as each armrest (the open trapdoor armrest from
  // the vocabulary hangs in air, which `fit` flags as a floating shutter).
  for (const x of [74, 75]) put(g, x, 1, 14, ...B.stairs("oak", "south", "bottom"));
  for (const x of [73, 76]) put(g, x, 1, 14, "oak_fence", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  tree(g, 81, 15, 6);
  wash_line(g, 73, 79, 17, [75, 77]);
  // Lantern standing on the wash line's west post: the back corner at x 72, z 18 is dark otherwise.
  put(g, 73, 5, 17, "lantern", { hanging: "false" });
  // Paths: gate to the well's north side, and the cross path from the well down to the bench.
  for (let x = 77; x <= 78; x++) for (let z = 5; z <= 8; z++) ground(g, x, 0, z, "dirt_path");
  for (let x = 74; x <= 79; x++) ground(g, x, 0, 13, "dirt_path");
  for (let x = 74; x <= 75; x++) ground(g, x, 0, 14, "dirt_path");

  // ---- plot 0 back: back step and wood pile (x 4..7, z 18) ----
  woodpile(g, 4, 18, { wood: "stripped_birch_log" });
  for (const x of [6, 7]) put(g, x, 1, 18, ...B.stairs("oak", "north", "bottom"));

  // ---- plot 1 back yard: two flower beds (x 14..16 and 19..21, z 17) ----
  put(g, 14, 1, 17, "poppy");
  put(g, 15, 1, 17, "cornflower");
  put(g, 16, 1, 17, "poppy");
  put(g, 19, 1, 17, "cornflower");
  put(g, 20, 1, 17, "poppy");
  put(g, 21, 1, 17, "cornflower");

  // ---- plot 7 loading platform: barrels against the outside of the back wall (x 93..94, z 18) ----
  put(g, 93, 1, 18, "barrel", { facing: "up", open: "false" });
  put(g, 94, 1, 18, "barrel", { facing: "up", open: "false" });
  put(g, 93, 2, 18, "barrel", { facing: "up", open: "false" });
}
