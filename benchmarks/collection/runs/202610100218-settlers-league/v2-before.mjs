// Settlers' League hall — banner shop on an old deepslate stall base. Front faces NORTH (-z).
import { Grid, B, replace } from "../../../../../minecraft-design/tools/src/build.mjs";
import { gableRoof } from "../../../../../minecraft-design/tools/src/shapes-massing.mjs";

const g = new Grid([7, 10, 9]);
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/collection/runs/202610100218-settlers-league/build.nbt";
const W = 7, Z0 = 1, Z1 = 8;              // building z = 1..8; z = 0 is awning / stoop
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const fill = (a, b, blk, s) => g.fill(a, b, blk, s);
const stairs = (x, y, z, m, f, h = "bottom") => g.set(x, y, z, ...B.stairs(m, f, h));
const slab = (x, y, z, m, t = "bottom") => g.set(x, y, z, ...B.slab(m, t));
const log = (x, y, z, m, a = "y") => g.set(x, y, z, ...B.log(m, a));

// ---- base: old deepslate stall (cobbled, cracked, a little moss) ----
fill([0, 0, Z0], [6, 0, Z1], "deepslate_bricks");
for (const [x, z] of [[0,1],[2,1],[5,2],[6,4],[0,6],[3,8],[6,7],[1,8],[0,3]]) set(x, 0, z, "cracked_deepslate_bricks");
for (const [x, z] of [[1,1],[4,1],[6,2],[0,5]]) set(x, 0, z, "mossy_cobblestone");
for (const [x, z] of [[3,1],[6,6],[0,7]]) set(x, 0, z, "cobbled_deepslate");
// shop floor (plank) over the base inside
fill([1, 0, 2], [5, 0, 7], "spruce_planks");
// stoop out front
for (let x = 0; x <= 6; x++) slab(x, 0, 0, "cobbled_deepslate");
for (let x = 2; x <= 4; x++) stairs(x, 0, 0, "deepslate_brick", "south");   // hmm: steps up into the shop

// ---- walls: deepslate bricks, y1..6 ----
fill([0, 1, Z0], [6, 6, Z1], "deepslate_bricks");
fill([1, 1, Z0 + 1], [5, 6, Z1 - 1], "air");                // hollow
fill([1, 1, Z0], [5, 3, Z0], "air");                         // shop opening (re-filled below)
// aging on the stone
for (const [x, y, z] of [[0,1,3],[0,2,6],[6,1,5],[6,3,7],[0,4,5],[6,5,3],[3,1,8],[4,3,8],[1,5,8]]) set(x, y, z, "cracked_deepslate_bricks");
for (const [x, y, z] of [[0,1,2],[6,1,6],[0,2,4]]) set(x, y, z, "mossy_cobblestone");
// cheap plank / cobble / mud-brick patches
fill([6, 1, 3], [6, 2, 4], "oak_planks"); set(6, 3, 4, "oak_planks");
fill([0, 1, 5], [0, 2, 6], "spruce_planks"); set(0, 3, 6, "spruce_planks");
set(6, 5, 6, "mud_bricks"); set(6, 5, 7, "mud_bricks"); set(6, 6, 6, "mud_bricks");
set(0, 1, 7, "cobblestone"); set(0, 2, 7, "cobblestone"); set(0, 1, 8, "cobblestone");

// ---- front (z=1): oak corner posts, shop opening, beam, upper windows ----
for (let y = 1; y <= 6; y++) { log(0, y, Z0, "stripped_oak"); log(6, y, Z0, "stripped_oak"); }
// post proud of the wall: front pilasters out at z=0
for (let y = 1; y <= 4; y++) { log(0, y, 0, "oak"); log(6, y, 0, "oak"); }
// beam over the shopfront (y3) — carries the banners; upper-floor line
for (let x = 1; x <= 5; x++) log(x, 3, Z0, "stripped_oak", "x");
// counters at y1 either side of the door bay, display opening at y2
for (const x of [1, 2, 4, 5]) {
  set(x, 1, Z0, "oak_planks");
  g.set(x, 1, 0, ...B.trapdoor("spruce", "north", "bottom", true));      // counter front: open trapdoors read as shelving slats
  slab(x, 2, 0, "spruce", "bottom");                                     // counter shelf on top of... (moved: sill)
  set(x, 2, Z0, "air");
}
// door bay x=3: 2-tall oak door, lamp over
g.set(3, 1, Z0, ...B.door("oak", "north", "lower"));
g.set(3, 2, Z0, ...B.door("oak", "north", "upper"));
// quartz-free: this is a have-not building; trim is oak and deepslate
// upper storey front: windows x1..2 and x4..5 at y5..6, glass inset one block (deep reveal), pier x3
fill([1, 4, Z0], [5, 4, Z0], "deepslate_tiles");
for (const x of [1, 2, 4, 5]) for (const y of [5, 6]) {
  set(x, y, Z0, "air");
  g.set(x, y, Z0 + 1, "glass_pane", { east: "true", west: "true" });
  set(x, y, Z0 + 2 - 0, "air");
}
for (const x of [1, 2, 4, 5]) { slab(x, 5, Z0, "polished_deepslate", "bottom"); }
for (const x of [1, 2, 4, 5]) set(x, 6, Z0, "air");
set(3, 5, Z0, "chiseled_deepslate"); set(3, 6, Z0, "polished_deepslate");

// ---- awning: striped cyan/white wool at y4, z=0 ----
for (let x = 1; x <= 5; x++) set(x, 4, 0, x % 2 ? "white_wool" : "cyan_wool");
set(0, 4, 0, "oak_log"); set(6, 4, 0, "oak_log");
for (const x of [0, 6]) g.set(x, 3, 0, ...B.lantern(true));
// hanging banners (as wool pennants — the viewer draws banner entities as wood boxes): one colour each
const cols = { 1: "red", 2: "yellow", 3: "orange", 4: "lime", 5: "blue" };
for (const [x, c] of Object.entries(cols)) set(+x, 3, 0, `${c}_wool`);
for (const [x, c] of Object.entries({ 1: "purple", 5: "red" })) set(+x, 2, 0, `${c}_wool`);

// ---- sign: oak hanging sign at the awning, on the east post side ----


// side windows (upper room) with polished sills, timber back posts
for (const x of [0, 6]) { for (const z of [4, 5]) { for (const y of [5, 6]) g.set(x, y, z, "glass_pane", { north: "true", south: "true" }); slab(x, 4, z, "polished_deepslate", "top"); } 
  for (let y = 1; y <= 6; y++) log(x, y, Z1, "stripped_oak"); }
// ---- interior ----
fill([1, 3, 2], [5, 3, Z1 - 1], "spruce_planks");               // upper floor
for (const [x, y, z] of [[1,1,7],[2,1,7],[5,1,7],[5,1,6]]) set(x, y, z, "barrel", { facing: "up" });
set(3, 1, 7, "bookshelf"); set(4, 1, 7, "bookshelf"); set(2, 2, 7, "bookshelf"); set(4, 2, 7, "bookshelf");
g.set(3, 2, 7, ...B.lantern(false));
// upstairs meeting room: lit, warm, banners on the back wall (visible through the windows)
fill([1, 4, 7], [5, 4, 7], "spruce_planks");
fill([1, 6, 7], [5, 6, 7], "spruce_planks");
["red", "yellow", "blue", "lime", "purple"].forEach((c, i) => set(1 + i, 5, 7, `${c}_wool`));
for (const x of [1, 5]) { set(x, 4, 2, "spruce_planks"); }
fill([2, 4, 4], [4, 4, 4], "spruce_planks");                     // meeting table
set(3, 5, 4, "oak_pressure_plate");
g.set(3, 6, 3, ...B.lantern(true)); set(3, 7, 3, "air");
for (const x of [1, 5]) { set(x, 4, 3, "air"); }
g.set(1, 4, 3, "lantern", { hanging: "false" }); g.set(5, 4, 3, "lantern", { hanging: "false" });

// ---- roof: gable, ridge along z; front gable stepped up as a deepslate false front ----
for (let x = 0; x <= 6; x++) for (let z = Z0; z <= Z1; z++) if (g.blockAt(x, 7, z) == null) {}
const rr = gableRoof(g, { from: [0, 7, Z0], to: [6, Z1], ridge: "z", material: "deepslate_tile", gableBlock: "oak_planks",
  overhang: 0, pitch: 0.5 });
console.log("roof", JSON.stringify(rr.bounds), rr.refused?.length);

set(3, 7, 1, "cyan_wool"); set(3, 8, 1, "chiseled_deepslate");   // league mark in the plank gable
g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused }));
