// The Reading Room — a one-room Concord storeroom annex, adapted by the Operators. 7 wide (x), 9 deep (z), 7 tall (y).
// Front faces NORTH (-z). y0 = standing level (placed on grade). Body x1..5 z1..7, walls y0..3, gable roof y4..6
// (ridge along x, 1-block eaves), garden strip + fence + open gate at x0.
import { Grid, shell, B, gableRoof } from "../../../../../minecraft-design/tools/src/build.mjs";

const g = new Grid([7, 7, 9]);
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/collection/runs/202610100218-reading-room/build.nbt";

// palette: Concord deepslate + oak (dominant/supporting); Operators' quartz + clean glass + lamps (accent)
const WALL = "deepslate_bricks", PLINTH = "cobbled_deepslate", TRIM = "polished_deepslate";

// walls (hollow room), plinth of cobbled deepslate at y0
shell(g, [1, 0, 1], [5, 3, 7], WALL, { floor: false, ceiling: false });
g.fill([1, 0, 1], [5, 0, 7], PLINTH);
g.fill([2, 0, 2], [4, 3, 6], "air");
// weathering: cracked bricks and a little moss at the base
for (const [x, y, z] of [[1, 2, 3], [1, 3, 5], [5, 3, 3], [5, 2, 6], [3, 3, 7], [2, 2, 7], [1, 3, 2], [5, 2, 4], [3, 3, 1], [4, 3, 1]]) g.set(x, y, z, "cracked_deepslate_bricks");
for (const [x, y, z] of [[1, 0, 6], [1, 0, 5], [3, 0, 7], [5, 0, 5], [2, 0, 1], [1, 0, 3], [5, 0, 2]]) g.set(x, y, z, "mossy_cobblestone");
g.set(1, 1, 6, "mossy_stone_bricks"); g.set(3, 1, 7, "mossy_stone_bricks");

// oak corner posts, flush full height (stripped), with proud piers under the front eave
for (const [x, z] of [[1, 1], [5, 1], [1, 7], [5, 7]]) for (let y = 0; y <= 3; y++) g.set(x, y, z, ...B.log(y === 0 ? "oak" : "stripped_oak", "y"));
for (const x of [1, 5]) { g.set(x, 0, 0, ...B.log("oak", "y")); g.set(x, 1, 0, ...B.log("stripped_oak", "y")); g.set(x, 2, 0, ...B.log("stripped_oak", "y")); }
// carved capital: chiseled deepslate boss at the pier heads
g.set(1, 3, 0, "chiseled_deepslate"); g.set(5, 3, 0, "chiseled_deepslate");
// oak beam across the front at y3
for (const x of [2, 3, 4]) g.set(x, 3, 1, ...B.log("oak", "x"));

// WINDOW (x2, y1..2): old frame, deep reveal, re-glazed with a big clean pane (operators), curtains behind, lamp hung above
g.fill([2, 1, 1], [2, 2, 1], "air");
g.set(2, 1, 2, "glass"); g.set(2, 2, 2, "glass");
g.set(2, 1, 1, ...B.slab("smooth_quartz", "bottom"));          // fresh quartz sill inside the old reveal
g.set(2, 2, 1, "air");
g.set(2, 1, 3, "red_wool"); g.set(2, 2, 3, "red_wool");           // curtains hanging behind the glass
g.set(2, 0, 0, "potted_red_tulip");                                 // window box
g.set(2, 2, 0, ...B.lantern(true));                                  // lamp hung from the eave

// DOOR (x4): oak door set INTO the old opening, hand-painted board beside it, quartz stoop
g.set(4, 0, 1, ...B.door("oak", "north", "lower", "left")); g.set(4, 1, 1, ...B.door("oak", "north", "upper", "left"));
g.set(4, 2, 1, TRIM);                                          // lintel
g.set(3, 1, 0, "oak_wall_sign", { facing: "north", waterlogged: "false" });  // READING ROOM board (on the wall at x3)
g.set(4, 0, 0, ...B.slab("smooth_quartz", "bottom"));         // stoop (operators)
g.set(3, 0, 0, ...B.slab("smooth_quartz", "bottom"));
// barrel (the public record) + lamp
g.set(5, 0, 0, "barrel", { facing: "up", open: "false" }); g.set(5, 1, 0, ...B.lantern(false));

// side windows (clean panes inside the old stone frame), east and west
for (const x of [1, 5]) { g.set(x, 1, 4, "glass_pane"); g.set(x, 2, 4, "glass_pane"); }
// interior: lectern, shelves, lamp
g.set(3, 0, 6, "lectern", { facing: "north", has_book: "true", powered: "false" });
for (const x of [2, 4]) for (const y of [0, 1]) g.set(x, y, 6, "bookshelf");
g.set(3, 3, 5, ...B.lantern(true));

// garden: fence line at x0 with an OPEN gate leading west into the sanctuary village; hedge at the back
const FN = (n, s) => ["oak_fence", { north: String(n), south: String(s), east: "false", west: "false", waterlogged: "false" }];
g.set(0, 0, 0, ...FN(false, true)); g.set(0, 0, 1, ...FN(true, true)); g.set(0, 0, 2, ...FN(true, true)); g.set(0, 0, 3, ...FN(true, false));
g.set(0, 0, 6, ...FN(false, true)); g.set(0, 0, 7, ...FN(true, false));
g.set(0, 1, 0, ...B.lantern(false));
for (const z of [4, 5]) g.set(0, 0, z, "oak_fence_gate", { facing: "east", open: "true", in_wall: "false", powered: "false" });
for (const [x, z] of [[0, 8], [1, 8]]) g.set(x, 0, z, "azalea_leaves", { persistent: "true", distance: "1", waterlogged: "false" });

// ROOF: gable, ridge along x, deepslate tile, 1-block eaves; gable ends filled with the wall block
gableRoof(g, { from: [1, 4, 1], to: [5, 7], ridge: "x", material: "deepslate_tile", gableBlock: WALL,
  verge: { block: "polished_deepslate" }, pitch: 0.5, overhang: 1 });

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused ?? [] }));
