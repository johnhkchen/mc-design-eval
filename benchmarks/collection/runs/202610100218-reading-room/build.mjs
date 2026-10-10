// The Reading Room — a one-room Concord storeroom annex, adapted by the Operators. Building 7 wide (x0..6 incl. eaves), 9 deep (z), walls 4 tall + a LOW gable.
// Front faces NORTH (-z). Local x runs -2..6 (a 2-block garden strip west of the fence); OX shifts it into the grid.
import { Grid, B } from "../../../../../minecraft-design/tools/src/build.mjs";
import { t } from "../../../../../minecraft-design/tools/src/nbt.mjs";

const OX = 2;
const g = new Grid([9, 7, 9]);
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/collection/runs/202610100218-reading-room/build.nbt";
const set = (x, y, z, ...a) => g.set(x + OX, y, z, ...a);
const fill = (a, b, ...r) => g.fill([a[0] + OX, a[1], a[2]], [b[0] + OX, b[1], b[2]], ...r);

// palette: Concord deepslate + oak (dominant/supporting); Operators' quartz + clean glass + lamps (accent)
const WALL = "deepslate_bricks", PLINTH = "cobbled_deepslate", TRIM = "polished_deepslate", ROOF = "deepslate_tile";
const PANE = (o) => ["glass_pane", { north: String(!!o.n), south: String(!!o.s), east: String(!!o.e), west: String(!!o.w), waterlogged: "false" }];

// ---- walls: solid deepslate brick body, hollow room x2..4 z3..6 (front wall is 2 thick so the openings can be recessed)
fill([1, 0, 1], [5, 3, 7], WALL);
fill([2, 0, 3], [4, 3, 6], "air");
fill([1, 0, 2], [1, 0, 7], PLINTH); fill([5, 0, 2], [5, 0, 7], PLINTH); fill([2, 0, 7], [4, 0, 7], PLINTH);   // plinth on sides/back; the front is plain brick
// weathering on sides/back only (the front is one clean material)
for (const [x, y, z] of [[1, 2, 3], [1, 3, 5], [5, 3, 3], [5, 2, 6], [3, 3, 7], [2, 2, 7], [5, 2, 4]]) set(x, y, z, "cracked_deepslate_bricks");
for (const [x, z] of [[1, 6], [1, 5], [3, 7], [5, 5], [1, 3], [5, 3]]) set(x, 0, z, "mossy_cobblestone");

// ---- front: oak corner posts with proud piers and chiseled capitals, oak beam, brick between
for (const [x, z] of [[1, 1], [5, 1], [1, 7], [5, 7]]) for (let y = 0; y <= 3; y++) set(x, y, z, ...B.log(y === 0 ? "oak" : "stripped_oak", "y"));
for (const x of [1, 5]) { set(x, 0, 0, ...B.log("oak", "y")); set(x, 1, 0, ...B.log("stripped_oak", "y")); set(x, 2, 0, ...B.log("stripped_oak", "y")); set(x, 3, 0, "chiseled_deepslate"); }
for (const x of [2, 3, 4]) set(x, 3, 1, ...B.log("oak", "x"));        // beam across the front

// ---- WINDOW (x2): reveal one deep, glass panes at the back, quartz sill, trapdoor head, curtain + lamp inside
fill([2, 1, 1], [2, 2, 1], "air");
set(2, 1, 1, ...B.slab("smooth_quartz", "bottom"));                      // fresh quartz sill (operators)
set(2, 2, 1, ...B.trapdoor("dark_oak", "south", "top", false));          // trapdoor head board
set(2, 1, 2, ...PANE({ e: 1, w: 1 })); set(2, 2, 2, ...PANE({ e: 1, w: 1 }));
set(2, 2, 3, "red_wool");                    // curtain behind the glass
set(2, 0, 3, "spruce_planks"); set(2, 1, 3, ...B.lantern(false));        // reading lamp on the desk
set(2, 0, 0, "potted_red_tulip");                                        // window box
set(2, 2, 0, ...B.lantern(true));                                        // lamp hung from the eave

// ---- DOOR (x4): oak door recessed one block, stair lintel, quartz stoop, HANGING SIGN over it
fill([4, 0, 1], [4, 2, 1], "air");
set(4, 0, 1, ...B.slab("smooth_quartz", "bottom"));
set(4, 2, 1, ...B.stairs("polished_deepslate", "north", "top"));
set(4, 0, 2, ...B.door("oak", "north", "lower", "left")); set(4, 1, 2, ...B.door("oak", "north", "upper", "left"));
set(4, 0, 0, ...B.slab("smooth_quartz", "bottom"));
const msgs = t.list("string", ["", "READING", "ROOM", ""].map((x) => JSON.stringify({ text: x })));
const face = () => t.compound({ has_glowing_text: t.byte(0), color: t.string("black"), messages: msgs });
set(4, 2, 0, "oak_wall_sign", { facing: "north", waterlogged: "false" }, t.compound({ id: t.string("minecraft:sign"), is_waxed: t.byte(1), front_text: face(), back_text: face() }));   // READING ROOM board over the door
// barrel (the public record) by the door + lamp
set(3, 0, 0, "barrel", { facing: "up", open: "false" }); set(3, 1, 0, ...B.lantern(false));

// side windows (clean panes inside the old stone frame)
for (const x of [1, 5]) { set(x, 1, 4, ...PANE({ n: 1, s: 1 })); set(x, 2, 4, ...PANE({ n: 1, s: 1 })); }
// interior: lectern, shelves, lamp
set(3, 0, 6, "lectern", { facing: "north", has_book: "true", powered: "false" });
for (const x of [2, 4]) for (const y of [0, 1]) set(x, y, 6, "bookshelf");
set(3, 3, 5, ...B.lantern(true));

// ---- ROOF: a LOW gable (ridge along x), deepslate tile stairs + slabs, 1-block eaves with upside-down stair lips, timber gable ends
const S = (f, half = "bottom") => B.stairs(ROOF, f, half);
for (let x = 0; x <= 6; x++) {
  set(x, 3, 0, ...S("south", "top")); set(x, 3, 8, ...S("north", "top"));       // eave lips
  set(x, 4, 1, ...B.slab(ROOF)); set(x, 4, 7, ...B.slab(ROOF));
  set(x, 4, 2, ...S("south")); set(x, 4, 6, ...S("north"));
  set(x, 5, 3, ...B.slab(ROOF)); set(x, 5, 5, ...B.slab(ROOF));
  set(x, 5, 4, "deepslate_tiles");                                              // ridge
}
for (const x of [1, 5]) for (const z of [3, 4, 5]) set(x, 4, z, ...B.log("stripped_oak", "z"));   // timber gable fill
// eave lips over the piers are the chiseled capitals
for (const x of [1, 5]) set(x, 3, 0, "chiseled_deepslate");

// ---- GARDEN: fence run at x0 with an OPEN gate, path out west, a planted bed
const FN = (n, s) => ["oak_fence", { north: String(n), south: String(s), east: "false", west: "false", waterlogged: "false" }];
set(0, 0, 0, ...FN(false, true)); set(0, 0, 1, ...FN(true, true)); set(0, 0, 2, ...FN(true, true)); set(0, 0, 3, ...FN(true, false));
set(0, 0, 6, ...FN(false, true)); set(0, 0, 7, ...FN(true, false));
set(0, 1, 0, ...B.lantern(false));
for (const z of [4, 5]) set(0, 0, z, "oak_fence_gate", { facing: "east", open: "true", in_wall: "false", powered: "false" });
for (const x of [-2, -1, 0]) for (const z of [4, 5]) if (x !== 0) set(x, 0, z, ...B.slab("cobblestone", "bottom"));     // short path through the gate
for (const x of [-2, -1]) set(x, 0, 3, ...B.slab("cobblestone", "bottom"));
for (const x of [-2, -1]) for (const z of [6, 7, 8]) set(x, 0, z, "grass_block", { snowy: "false" });
set(-1, 1, 6, "poppy"); set(-2, 1, 7, "azure_bluet"); set(-1, 1, 8, "azalea_leaves", { persistent: "true", distance: "1", waterlogged: "false" }); set(-2, 1, 8, "flowering_azalea_leaves", { persistent: "true", distance: "1", waterlogged: "false" });
for (const [x, z] of [[0, 8], [1, 8]]) set(x, 0, z, "azalea_leaves", { persistent: "true", distance: "1", waterlogged: "false" });

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused ?? [] }));
