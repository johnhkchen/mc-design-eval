// Part "roofs plots 0-3": roof.json (W3, laid by runParts after the shell) and, here, the other masses of plots 0-3:
// W1, W2, W4 (grey gables), A + A1 (red hips), H (grey gable), L1-L3 (red gables), then the hand lean-tos, the
// vestibule deck, the arcade roof, the porch and the rear roofs.
import { reroof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { leanTo, porch } from "../vocab.mjs";
import { SMOOTH_SANDSTONE, SMOOTH_STONE_SLAB, QUARTZ_SLAB, BRICK_SLAB, BRICK_STAIRS, POLISHED_ANDESITE_STAIRS, STONE_BRICK_STAIRS } from "../vocab/base.mjs";

const GREY = { mix: [["polished_andesite", 5], ["stone_bricks", 2]] };
const GREY_TRIM = { fascia: "polished_andesite", soffit: "polished_andesite", verge: "quartz", ridge: "slab" };
const RED = { mix: [["bricks", 1]] };
const RED_TRIM = { fascia: "brick", soffit: "brick", verge: "quartz", ridge: "slab" };
// plot-edge roofs (A1, L1 on z0): no overhang and no soffit course; an overhang or soffit there puts a cell at z -1,
// and the roof tool then resizes the whole build by one cell (see the note in the summary)
const RED_EDGE = { fascia: "brick", verge: "quartz", ridge: "slab" };

// the W3 keep boxes, and the shell's wall-top and floor cells the eave courses would overwrite (the shell already
// built them, so the roof leaves them as they are: W2's north verge, A's north eave, A1's eave and floor deck)
// plot 4's west wall (x98, the office shell): L2 and L3 clear 3 cells past their footprints and would reach it
const KEEP = [{ from: [0, 5, 16], to: [26, 5, 16] }, { from: [0, 5, 17], to: [26, 10, 27] }, { from: [98, 4, 0], to: [98, 10, 39] }];
const SHELL_KEEP = [[18, 5, 12], [46, 4, 4], [53, 4, 4], [46, 3, 4], [47, 4, 1], [52, 4, 1], [47, 3, 1], [48, 3, 1]].map((c) => ({ from: c, to: c }));

// one roof of its own: a rect or a list of rects (the footprint), its style, its wall infill
function roofOf(g, footprint, { keep = [], ...spec }) {
  const r = reroof(g, { keep: [...KEEP, ...SHELL_KEEP, ...keep], footprint, ...spec });
  if (r.refused) console.log(`roofs-a: ${spec.style} ${JSON.stringify(footprint)} kept ${r.refused} cells`);
  return r;
}

export function build(g) {
  // ---- plot 0: W1, W2, W4 grey gables (W3 is roof.json, laid first)
  roofOf(g, [8, 2, 17, 11], { style: "gable", pitch: 1, ridgeAxis: "z", y: 6, overhang: 1, material: GREY, ...GREY_TRIM, gable: "white_concrete" });
  roofOf(g, [8, 12, 21, 17], { style: "gable", pitch: "half", ridgeAxis: "z", y: 6, overhang: { N: 1, S: 0, E: 1, W: 1 }, material: GREY, ...GREY_TRIM, gable: "white_concrete" });
  roofOf(g, [16, 26, 25, 35], { style: "gable", pitch: 1, ridgeAxis: "z", y: 6, overhang: { N: 0, S: 1, E: 1, W: 1 }, material: GREY, ...GREY_TRIM, gable: "white_concrete" });

  // ---- plot 1: A (hip, T with A3) and A1 (entrance pavilion hip), red tile
  roofOf(g, [[31, 4, 54, 17], [33, 18, 42, 21]], { style: "hip", pitch: 1, ridgeAxis: "x", y: 5, overhang: { N: 0, S: 1, E: 1, W: 1 }, material: RED, ...RED_TRIM, gable: "smooth_sandstone" });
  roofOf(g, [47, 0, 52, 3], { style: "hip", pitch: 1, y: 5, keep: [{ from: [46, 3, 4], to: [53, 6, 4] }], overhang: 0, material: RED, ...RED_EDGE });

  // ---- plot 2: H grey gable, E-W ridge
  roofOf(g, [57, 2, 82, 15], { style: "gable", pitch: "steep", ridgeAxis: "x", y: 5, overhang: { W: 0, E: 1, N: 1, S: 1 }, material: GREY, ...GREY_TRIM, gable: "white_concrete" });

  // ---- plot 3: L1, L2, L3 red gables, low, ridges along z
  roofOf(g, [86, 0, 93, 7], { style: "gable", pitch: "half", ridgeAxis: "z", y: 4, overhang: 0, material: RED, ...RED_EDGE, gable: "smooth_sandstone" });
  roofOf(g, [86, 8, 95, 25], { style: "gable", pitch: "half", ridgeAxis: "z", y: 4, overhang: 1, material: RED, ...RED_TRIM, gable: "smooth_sandstone" });
  roofOf(g, [88, 26, 97, 35], { style: "gable", pitch: "half", ridgeAxis: "z", y: 4, overhang: { N: 1, S: 0, E: 1, W: 1 }, material: RED, ...RED_TRIM, gable: "smooth_sandstone" });

  // ---- hand lean-tos, plot 0: one course of stairs at y4 facing the hall
  const W_LEAN = [[[4, 4, 7, 7], "west"], [[6, 8, 7, 13], "west"], [[18, 8, 19, 11], "east"], [[4, 16, 7, 17], "west"],
    [[0, 18, 1, 23], "west"], [[24, 22, 25, 25], "east"], [[2, 26, 9, 27], "south"], [[12, 26, 15, 27], "south"],
    [[14, 28, 15, 33], "west"], [[26, 28, 27, 35], "east"], [[16, 36, 23, 37], "south"]];
  for (const [rect, dir] of W_LEAN) leanTo(g, rect, 4, dir, POLISHED_ANDESITE_STAIRS, STONE_BRICK_STAIRS);

  // vestibule V: flat deck at y5, quartz coping on the north row
  g.fill([12, 5, 0], [15, 5, 0], QUARTZ_SLAB);
  g.fill([12, 5, 1], [15, 5, 1], SMOOTH_STONE_SLAB);

  // plot 1 lean-tos: side sheds at y3 in brick, A2 arcade shed at y4 over the arch course, rear sheds
  leanTo(g, [29, 6, 30, 13], 3, "west", BRICK_STAIRS, BRICK_STAIRS);
  leanTo(g, [55, 12, 56, 17], 3, "east", BRICK_STAIRS, BRICK_STAIRS);
  leanTo(g, [31, 18, 32, 19], 3, "south", BRICK_STAIRS, BRICK_STAIRS);
  leanTo(g, [43, 18, 48, 19], 3, "south", BRICK_STAIRS, BRICK_STAIRS);
  leanTo(g, [39, 2, 46, 3], 4, "north", BRICK_STAIRS, BRICK_STAIRS);
  g.fill([33, 3, 22], [34, 3, 22], BRICK_SLAB);   // back stoop shed: slab roof

  // plot 2: porch roof, deck and posts (the porch helper), rear sheds H2/H3 on the grey mix
  porch(g, 67, 82, 0, 1, { open: [74, 75] });
  // the post bases are full quartz blocks, not bottom slabs: a post on a bottom slab floats half a block
  for (const x of [67, 70, 73, 76, 79, 82]) g.set(x, 1, 0, ...B.block("quartz_block"));
  leanTo(g, [59, 16, 82, 17], 3, "south", POLISHED_ANDESITE_STAIRS, STONE_BRICK_STAIRS);
  leanTo(g, [59, 18, 68, 19], 3, "south", POLISHED_ANDESITE_STAIRS, STONE_BRICK_STAIRS);

  // plot 3: dock shed west and lean-to east, brick sheds at y3
  leanTo(g, [84, 0, 85, 5], 3, "west", BRICK_STAIRS, BRICK_STAIRS);
  leanTo(g, [96, 22, 97, 25], 3, "east", BRICK_STAIRS, BRICK_STAIRS);
}
