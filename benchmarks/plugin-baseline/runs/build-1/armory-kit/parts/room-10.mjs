// Interior designer for "East aisle 2F" (room 10): a mezzanine café and quiet reading strip, 14 wide, 96 long.
// Plan: the doorway at x94..95 z34..35 opens onto a café counter (the focal piece, with a glass blossom on it) across
// the north end; café tables run south along the aisle, two chairs each (stairs), with a hanging lantern between each pair.
// Palette only: oak_fence + smooth_quartz_slab (top) tables, smooth_quartz_stairs chairs, lanterns, stained glass, end_rod.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const TABLE_X = 95;
const CHAIR_W = 94;
const CHAIR_E = 96;
const FLOOR_Y = 8;
const CEIL_HANG_Y = 13;

// the focal counter: a full quartz row across the aisle, two cells in from the doorway, with a glass blossom on it
function counter(g) {
  g.fill([91, FLOOR_Y, 40], [97, FLOOR_Y, 40], "smooth_quartz");
  g.set(94, 9, 40, "orange_stained_glass");
  g.set(94, 10, 40, "red_stained_glass");
  g.set(94, 11, 40, "yellow_stained_glass");
  g.set(94, 12, 40, "end_rod");
  g.set(94, CEIL_HANG_Y, 40, ...B.lantern(true));
}

// one café table pair at z: a fence post with a top slab, a chair each side (stairs facing their back)
function tableGroup(g, z) {
  g.set(TABLE_X, FLOOR_Y, z, ...B.fence("oak"));
  g.set(TABLE_X, 9, z, ...B.slab("smooth_quartz", "top"));
  g.set(CHAIR_W, FLOOR_Y, z, ...B.stairs("smooth_quartz", "west"));
  g.set(CHAIR_E, FLOOR_Y, z, ...B.stairs("smooth_quartz", "east"));
}

export function build(g) {
  counter(g);
  // café tables every 6 cells from z 44 to 128; a hanging lantern sits midway between each pair
  for (let z = 44; z <= 128; z += 6) tableGroup(g, z);
  for (let z = 47; z <= 125; z += 6) g.set(TABLE_X, CEIL_HANG_Y, z, ...B.lantern(true));
  // a standing lantern on each table top: hanging lanterns five blocks up leave the floor too dim (light falls 1 per block)
  for (let z = 44; z <= 128; z += 6) g.set(TABLE_X, 10, z, ...B.lantern(false));
}
