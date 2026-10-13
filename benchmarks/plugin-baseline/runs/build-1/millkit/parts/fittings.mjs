// P3 Fittings: doors, windows, shutters, porch posts, rails and steps, the store's door transom and windows, the STORE
// banner and the MILL CO sign. The shell has already left every opening air; these helpers only fill air, so a
// shutter or pane never lands on wall. Plan.md coordinates throughout.
import { B, bannerWord, signboard } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { door, window, shutter, porch } from "../vocab.mjs";

// STORE banner and MILL CO board, local to this part: white letters on black banners (the palette has no white banner),
// and an oak board with no chains (the palette has no chain; iron_chain is the 1.21.4+ id the grid does not write).
function store_sign(g, { center, face, sign }) {
  const letters = bannerWord(g, "STORE", { center, face, letter: "white", base: "black" });
  const board = sign ? signboard(g, "MILL CO", { at: sign, face, mode: "hanging", width: 2, wood: "oak", chains: false }).cells : 0;
  return letters + board;
}

export function build(g) {
  // ---- plot 0 shotgun (birch): double front door, glazed front, side shutters, back door
  door(g, 5, 9, "birch", "north", "left");
  door(g, 6, 9, "birch", "north", "right");
  window(g, 4, 4, 9, "north", 1, 2, "birch");
  window(g, 7, 4, 9, "north", 1, 2, "birch");
  window(g, 5, 8, 9, "north", 2, 1, "birch"); // gable vent
  porch(g, 3, 8, "oak_planks", { block: "stripped_birch_log", xs: [3, 8] }, "birch_fence", [5, 6]);
  window(g, 3, 4, 11, "west", 1, 2, "birch");
  window(g, 3, 4, 15, "west", 1, 2, "birch");
  for (const z of [10, 12, 14, 16]) shutter(g, [2, 4, z], "west", "dark_oak", { height: 2 });
  window(g, 8, 4, 10, "east", 1, 2, "birch");
  window(g, 8, 4, 15, "east", 1, 2, "birch");
  for (const z of [11, 14, 16]) shutter(g, [9, 4, z], "east", "dark_oak", { height: 2 });
  door(g, 6, 17, "birch", "south", "left");
  window(g, 4, 4, 17, "south", 1, 2, "birch");

  // ---- plot 1 saddlebag duplex (spruce): two front doors, four front windows, two back windows, gable vents
  door(g, 15, 9, "spruce", "north", "left");
  door(g, 20, 9, "spruce", "north", "left");
  for (const x of [14, 16, 19, 21]) window(g, x, 4, 9, "north", 1, 2, "spruce");
  window(g, 15, 4, 16, "south", 1, 2, "spruce");
  window(g, 20, 4, 16, "south", 1, 2, "spruce");
  window(g, 13, 9, 12, "west", 2, 1, "spruce");
  window(g, 22, 9, 12, "east", 2, 1, "spruce");
  porch(g, 13, 22, "oak_planks", { block: "stripped_spruce_log", xs: [13, 17, 18, 22] }, "spruce_fence", [15, 20]);

  // ---- plot 2 hall-and-parlour (oak, birch trim): one front door, 2x2 front windows, side windows and shutters
  door(g, 29, 9, "oak", "north", "left");
  window(g, 27, 4, 9, "north", 2, 2, "birch");
  window(g, 32, 4, 9, "north", 2, 2, "birch");
  window(g, 26, 4, 10, "west", 1, 2, "birch");
  window(g, 26, 4, 15, "west", 1, 2, "birch");
  window(g, 34, 4, 11, "east", 1, 2, "birch");
  window(g, 34, 4, 14, "east", 1, 2, "birch");
  for (const z of [10, 12, 13, 15]) shutter(g, [35, 4, z], "east", "spruce", { height: 2 });
  door(g, 28, 16, "oak", "south", "left");
  window(g, 32, 4, 16, "south", 1, 2, "birch");
  porch(g, 26, 34, "oak_planks", { block: "stripped_birch_log", xs: [26, 30, 34] }, "birch_fence", [29, 30]);

  // ---- plot 3 shotgun, mirrored (jungle, dark oak trim): double front door, glazed front, side shutters, back door
  door(g, 41, 9, "jungle", "north", "left");
  door(g, 42, 9, "jungle", "north", "right");
  window(g, 40, 4, 9, "north", 1, 2, "dark_oak");
  window(g, 43, 4, 9, "north", 1, 2, "dark_oak");
  porch(g, 39, 44, "oak_planks", { block: "stripped_dark_oak_log", xs: [39, 44] }, "dark_oak_fence", [41, 42]);
  window(g, 39, 4, 10, "west", 1, 2, "dark_oak");
  window(g, 39, 4, 15, "west", 1, 2, "dark_oak");
  for (const z of [9, 11, 14, 16]) shutter(g, [38, 4, z], "west", "birch", { height: 2 });
  window(g, 44, 4, 11, "east", 1, 2, "dark_oak");
  window(g, 44, 4, 15, "east", 1, 2, "dark_oak");
  for (const z of [10, 12, 14, 16]) shutter(g, [45, 4, z], "east", "birch", { height: 2 });
  door(g, 41, 17, "jungle", "south", "left");
  window(g, 43, 4, 17, "south", 1, 2, "dark_oak");

  // ---- plot 7 company store: double door with transom, shop windows, side windows, stock door, porch, signs
  door(g, 89, 9, "dark_oak", "north", "left");
  door(g, 90, 9, "dark_oak", "north", "right");
  for (const x of [89, 90]) g.set(x, 5, 9, ...B.pane());
  window(g, 86, 3, 9, "north", 2, 3, "dark_oak");
  window(g, 92, 3, 9, "north", 2, 3, "dark_oak");
  window(g, 85, 4, 12, "west", 1, 2, "dark_oak");
  window(g, 85, 4, 15, "west", 1, 2, "dark_oak");
  window(g, 94, 4, 12, "east", 1, 2, "dark_oak");
  window(g, 94, 4, 15, "east", 1, 2, "dark_oak");
  door(g, 93, 17, "dark_oak", "south", "left");
  porch(g, 85, 94, "spruce_planks", { block: "stripped_dark_oak_log", xs: [85, 88, 91, 94] }, "oak_fence", [88, 89, 90, 91]);
  store_sign(g, { center: [89, 10, 8], face: "north", sign: [89, 6, 8] });
}
