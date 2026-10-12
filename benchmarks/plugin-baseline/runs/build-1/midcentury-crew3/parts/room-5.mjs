// ROOM atrium (interior designer): open-sky courtyard in the glass ring. Inner air is the box [17,1,12,21,4,17]; the
// ground is dirt at y=0 (locked by the shell), so everything here stands on y=1. Plan.md's stepping path runs between the
// two door pairs at x=19..20. A small jungle tree on the west side is the focal piece; a quartz bench faces it from the
// east; ferns, a grass patch and potted cacti fill the rest. Lanterns hang from the open beam at x=19 over the path, so
// the brightest light sits by the tree. Every write is into air (layers() skips a legend-less character).
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 17, Z0 = 12; // the room's first floor cell (x 17..21, z 12..17)

// y=1 floor: g grass, f large fern (lower half), p stepping path (smooth_stone), c potted cactus, L trunk base,
// B quartz bench seat (stairs, back to the glass), '.' free floor
const FLOOR = [
  "gfppc",
  "ggpp.",
  "LgppB",
  "g.ppB",
  "fgppg",
  "cgppg",
];
const FLOOR_LEGEND = {
  g: "short_grass",
  f: ["large_fern", { half: "lower" }],
  p: "smooth_stone",
  c: "potted_cactus",
  L: ["jungle_log", { axis: "y" }],
  B: B.stairs("smooth_quartz", "east"),
};

// y=2: upper halves of the ferns and the trunk
const UPPER = [
  ".F...",
  ".....",
  "L....",
  ".....",
  "F....",
  ".....",
];
const UPPER_LEGEND = {
  F: ["large_fern", { half: "upper" }],
  L: ["jungle_log", { axis: "y" }],
};

// y=3 and y=4: the jungle sapling's crown (leaves kept by persistent=true), a trunk tip, and two hanging lanterns at y=4
const CROWN_LOW = [
  ".....",
  "vv...",
  "Lv...",
  "vv...",
  ".....",
  ".....",
];
const CROWN_HIGH = [
  ".....",
  "vvl..",
  "vv...",
  "vv...",
  "..l..",
  ".....",
];
const CROWN_LEGEND = {
  v: ["jungle_leaves", { persistent: "true", waterlogged: "false" }],
  L: ["jungle_log", { axis: "y" }],
  l: B.lantern(true),
};

export function build(g) {
  layers(g, [X0, 1, Z0], FLOOR_LEGEND, FLOOR);
  layers(g, [X0, 2, Z0], UPPER_LEGEND, UPPER);
  layers(g, [X0, 3, Z0], CROWN_LEGEND, CROWN_LOW);
  layers(g, [X0, 4, Z0], CROWN_LEGEND, CROWN_HIGH);
}
