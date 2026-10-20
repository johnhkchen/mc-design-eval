// Part 3: roofs, dormers, chimneys (plan.md PARTS 3). The museum roof is laid by runParts from roof.json; every other
// roof is laid here with roof() (into air, after the shell), with the dormer and stack boxes kept clear.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { dormer, stack, leanTo } from "../vocab.mjs";

const RED = "polished_granite";
// the soffit course under the overhang defaults to spruce; hand it the red slab instead (role soffit only, the rest falls back)
const RED_SOFFIT = ({ role }) => (role === "soffit" ? RED : null);
// one block for every course of the red tile roof (field, eave, verge, hip, ridge): texture off keeps it in the palette
const TILE = { texture: false, contrast: false, soffit: false, material: RED, trim: RED, fascia: RED, verge: RED, hips: RED, materialAt: RED_SOFFIT };

// dormer and stack boxes the roofs must not touch (plan.md RESERVED)
const keepBox = (from, to) => ({ from, to });
const BARRACKS_KEEP = [
  keepBox([27, 10, 11], [29, 12, 14]), keepBox([32, 10, 11], [34, 12, 14]),
  keepBox([39, 10, 11], [41, 12, 14]), keepBox([44, 10, 11], [46, 12, 14]),
  keepBox([30, 10, 6], [31, 13, 7]), keepBox([42, 10, 6], [43, 13, 7]),
];
const VC_KEEP = [keepBox([84, 5, 4], [87, 8, 7])];
// the entrance gable block's stucco (club shell, built up to y 9) stands where the range and gable roofs would pass
// over it: the roofs stay off it and only add above and beside it
const CLUB_KEEP = [keepBox([59, 7, 16], [67, 9, 21])];

export function build(g) {
  // barracks main block: hipped, steep, overhang 0, eave at y 10 (the walls top out at y 9)
  roof(g, [24, 6, 49, 13], "hip", {
    y: 10, pitch: 45, overhang: 0, ridge: "none", maxHeight: 4, ...TILE, keep: BARRACKS_KEEP,
  });

  // barracks rear wings: hipped, eave at y 7, south end stops at z 5 against the main block
  roof(g, [24, 0, 30, 5], "hip", { y: 7, pitch: 45, overhang: 0, ...TILE });
  roof(g, [43, 0, 49, 5], "hip", { y: 7, pitch: 45, overhang: 0, ...TILE });

  // the Officers' Club: range roof (gable, ridge along x, overhang 1), gable block (ridge along z), rear wings
  roof(g, [51, 9, 75, 17], "gable", { ridgeAxis: "x", pitch: "half", y: 7, overhang: 1, maxHeight: 3, ...TILE, keep: CLUB_KEEP });
  // gable block: side eaves flush (east/west 0) so they do not hang over the arcade's bottom slabs at x 58 and 68
  roof(g, [59, 17, 67, 21], "gable", { ridgeAxis: "z", pitch: "half", y: 8, overhang: { north: 1, south: 1, east: 0, west: 0 }, maxHeight: 3, ...TILE, keep: CLUB_KEEP });
  // wing eaves stay flush with their walls (no side or south overhang): an overhang lands on the courtyard air and on
  // the range roof's south course at z 8, where the red slabs stood on bottom slabs with air under them
  roof(g, [51, 1, 57, 7], "gable", { ridgeAxis: "z", pitch: "half", y: 5, overhang: { north: 1, south: 0, east: 0, west: 0 }, maxHeight: 3, ...TILE });
  roof(g, [69, 1, 75, 7], "gable", { ridgeAxis: "z", pitch: "half", y: 5, overhang: { north: 1, south: 0, east: 0, west: 0 }, maxHeight: 3, ...TILE });

  // Officers' Club arcade lean-tos (granite stairs facing north), one step each
  for (const [x0, x1] of [[51, 58], [68, 75]]) {
    leanTo(g, x0, x1, 20, 21, 5);
    leanTo(g, x0, x1, 18, 19, 6);
  }

  // dormers: museum (face z 14, back z 12) and barracks (face z 13, back z 11)
  for (const [x0, x2] of [[3, 5], [8, 10], [13, 15], [18, 20]]) dormer(g, x0, x2, 14, 2);
  for (const [x0, x2] of [[27, 29], [32, 34], [39, 41], [44, 46]]) dormer(g, x0, x2, 13, 2);

  // cold brick stacks: museum x 5 and 17 (z 7), barracks x 30 and 42 (z 6)
  stack(g, 5, 7);
  stack(g, 17, 7);
  stack(g, 30, 6);
  stack(g, 42, 6);

  // Visitor Center: broad hipped roof over the 1.5-storey block, eave at y 5, overhang 1; porch roof by hand
  // north overhang 0: at z 0 the fascia would sit at z -1, off the grid (the roof tool grows and shifts the build)
  roof(g, [79, 1, 92, 6], "hip", { y: 5, pitch: 45, overhang: { north: 0, south: 1, east: 1, west: 1 }, maxHeight: 3, ...TILE, keep: VC_KEEP });
  leanTo(g, 80, 91, 8, 9, 5);
}
