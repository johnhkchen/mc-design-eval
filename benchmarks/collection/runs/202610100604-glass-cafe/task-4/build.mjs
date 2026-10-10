// Modern glass café — 17 x 8 x 13, front NORTH (-z). Viewer on the street: west (x small) is on the RIGHT.
// Plinth y0-1 whole footprint; body x3..14, z4..10, walls y2..5 (floor-to-ceiling glass y2-4, steel header y5);
// terrace = the strip in front (z0..3) and west (x0..2); roof y6 (cafe preset, cantilevered, N2 S1 E1 W1).
import { Grid, B, roof, plaque } from "../../../../../minecraft-design/tools/src/build.mjs";
import { fileURLToPath } from "node:url";
const OUT = fileURLToPath(new URL("./build.nbt", import.meta.url));
const g = new Grid([17, 8, 13]);
const X0 = 3, X1 = 14, Z0 = 4, Z1 = 10, FY = 2;            // body box, first wall course
const STEEL = "black_concrete", PANEL = "deepslate_tiles", GLASS = "glass";
const NOCONN = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
const leaf = (x, y, z, kind) => g.set(x, y, z, kind, { distance: "7", persistent: "true", waterlogged: "false" });
const pane = (x, y, z, c) => g.set(x, y, z, "glass_pane", { north: String(!!c.n), south: String(!!c.s), east: String(!!c.e), west: String(!!c.w), waterlogged: "false" });
const stairs = (x, y, z, mat, facing, half = "bottom") => g.set(x, y, z, ...B.stairs(mat, facing, half));
const lantern = (x, y, z, hanging) => g.set(x, y, z, "lantern", { hanging: String(hanging), waterlogged: "false" });

// ---- 1. plinth + terrace deck ------------------------------------------------------------------------------------
g.fill([0, 0, 0], [16, 0, 12], "stone_bricks");
g.fill([0, 1, 0], [16, 1, 12], "polished_andesite");
for (let x = 0; x <= 16; x++) for (const z of [0, 12]) g.set(x, 1, z, "smooth_stone");        // plinth cap ring
for (let z = 0; z <= 12; z++) for (const x of [0, 16]) g.set(x, 1, z, "smooth_stone");
for (let x = 1; x <= 15; x += 2) for (let z = 1; z <= 3; z++) if (x < 7 || x > 11) g.set(x, 1, z, "stone");   // paving checker
// ---- 2. body shell ------------------------------------------------------------------------------------------------
g.fill([X0, FY, Z0], [X1, 5, Z1], PANEL);
g.fill([X0 + 1, FY, Z0 + 1], [X1 - 1, 5, Z1 - 1], "minecraft:air");
g.fill([X0 + 1, 1, Z0 + 1], [X1 - 1, 1, Z1 - 1], "birch_planks");                               // interior floor
g.fill([X0, 5, Z0], [X1, 5, Z0], STEEL); g.fill([X0, 5, Z0], [X0, 5, Z1], STEEL);            // steel header beams on the glazed sides
// front (z=4): steel posts 3,7,14; glass 4-6; double door 8-9; dark sign panel 10-13
for (const x of [3, 7, 14]) g.fill([x, FY, Z0], [x, 5, Z0], STEEL);
g.fill([4, FY, Z0], [6, 4, Z0], GLASS);
g.fill([8, 2, Z0], [9, 4, Z0], "minecraft:air");
g.set(8, 2, Z0, ...B.door("dark_oak", "north", "lower", "left")); g.set(8, 3, Z0, ...B.door("dark_oak", "north", "upper", "left"));
g.set(9, 2, Z0, ...B.door("dark_oak", "north", "lower", "right")); g.set(9, 3, Z0, ...B.door("dark_oak", "north", "upper", "right"));
g.fill([8, 4, Z0], [9, 4, Z0], GLASS);                                                       // transom
// west (x=3): posts z=4,7,10; glass 5-6, 8-9
for (const z of [4, 7, 10]) g.fill([X0, FY, z], [X0, 5, z], STEEL);
g.fill([X0, FY, 5], [X0, 4, 6], GLASS); g.fill([X0, FY, 8], [X0, 4, 9], GLASS);
// east (x=14): solid panel, two tall windows; back (z=10): two windows + service door
for (const [za, zb] of [[5, 6], [8, 9]]) { g.fill([X1, 3, za], [X1, 4, zb], GLASS); g.fill([X1, 2, za], [X1, 2, zb], STEEL); }
for (const [xa, xb] of [[5, 6], [8, 10]]) { g.fill([xa, 3, Z1], [xb, 4, Z1], GLASS); g.fill([xa, 2, Z1], [xb, 2, Z1], STEEL); }
g.fill([12, 2, Z1], [12, 3, Z1], "minecraft:air");
g.set(12, 2, Z1, ...B.door("spruce", "south", "lower")); g.set(12, 3, Z1, ...B.door("spruce", "south", "upper"));
for (const x of [3, 14]) g.fill([x, FY, Z1], [x, 5, Z1], STEEL);
// ---- 3. entrance steps (2 risers) --------------------------------------------------------------------------------
for (let x = 7; x <= 10; x++) {
  g.set(x, 1, 0, "minecraft:air"); stairs(x, 0, 0, "stone_brick", "south");
  stairs(x, 1, 1, "stone_brick", "south");
}
// ---- 4. sign: banner-letter CAFE + glowing neon underline on the dark front panel ---------------------------------
plaque(g, "CAFE", { at: [13, 3, Z0], face: "north", width: 4, height: 2, material: "black_concrete", letter: "orange_concrete", style: "banner", frame: null });
for (let x = 10; x <= 13; x++) g.set(x, 2, Z0, "shroomlight");                       // neon underline, flush in the panel
// ---- 5. timber ceiling + soffit lights ---------------------------------------------------------------------------
g.fill([X0 + 1, 5, Z0 + 1], [X1 - 1, 5, Z1 - 1], "spruce_planks");
for (const [x, z] of [[5, 3], [9, 3], [12, 3], [2, 6], [2, 9], [15, 6], [15, 9], [6, 12], [10, 12]]) g.set(x, 5, z, "ochre_froglight", { axis: "y" });
for (const [x, z] of [[6, 7], [11, 7], [9, 8]]) g.set(x, 5, z, "ochre_froglight", { axis: "y" });
// ---- 6. terrace: glass screens, posts, planters, hedges, tables ---------------------------------------------------
const post = (x, z) => g.set(x, 2, z, "polished_blackstone_wall", { up: "true", ...NOCONN });
for (let x = 1; x <= 15; x++) { if ((x >= 7 && x <= 10) || [6, 11].includes(x)) continue; pane(x, 2, 0, { e: true, w: true }); }
for (const x of [0, 6, 11, 16]) post(x, 0);
for (let z = 1; z <= 11; z++) { if (z % 4 === 0) continue; pane(0, 2, z, { n: true, s: true }); }
for (const z of [4, 8, 12]) post(0, z);
for (let z = 1; z <= 3; z++) pane(16, 2, z, { n: true, s: true });
post(16, 4);
// planter beds: moss soil + open-trapdoor rim + azalea / flowering azalea / fern, in front of the screens
function bed(x0, z0, x1, z1) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    g.set(x, 2, z, "moss_block");
    g.set(x, 3, z, (x + z) % 3 === 0 ? "flowering_azalea" : (x + z) % 3 === 1 ? "azalea" : "fern");
  }
  for (let x = x0; x <= x1; x++) g.set(x, 2, z1 + 1, ...B.trapdoor("spruce", "north", "bottom", true));
  for (let z = z0; z <= z1; z++) { g.set(x0 - 1, 2, z, ...B.trapdoor("spruce", "east", "bottom", true)); g.set(x1 + 1, 2, z, ...B.trapdoor("spruce", "west", "bottom", true)); }
}
bed(1, 1, 2, 1);
// corner hedges (ivy columns against the dark panel / screen corners)
for (const [x, z] of [[15, 2], [16, 2], [15, 3], [16, 3]]) { g.set(x, 2, z, "moss_block"); for (let y = 3; y <= 4; y++) leaf(x, y, z, (x + y) % 2 ? "azalea_leaves" : "oak_leaves"); }
for (const [x, z] of [[1, 11], [2, 11], [1, 12], [2, 12]]) { g.set(x, 2, z, "moss_block"); leaf(x, 3, z, "oak_leaves"); }
// tables: fence leg + pressure-plate top, stair chairs, a lantern on top
function table(x, z, chairAxis, lamp = true) {
  g.set(x, 2, z, "spruce_fence", NOCONN);
  g.set(x, 3, z, "spruce_pressure_plate", { powered: "false" });
  if (lamp) lantern(x, 4, z, false);
  if (chairAxis === "x") { stairs(x - 1, 2, z, "spruce", "west"); stairs(x + 1, 2, z, "spruce", "east"); }
  else { stairs(x, 2, z - 1, "spruce", "north"); stairs(x, 2, z + 1, "spruce", "south"); }
}
table(2, 3, "x"); table(13, 2, "x", false); table(5, 3, "x");
table(1, 6, "z"); table(1, 9, "z");
// ---- 7. interior: counter + back cabinet, pendants, tables, plants -----------------------------------------------
g.fill([X0 + 1, 2, Z1 - 1], [X1 - 1, 4, Z1 - 1], "smooth_sandstone");              // cream back-wall lining (behind the windows)
g.fill([X1 - 1, 2, Z0 + 1], [X1 - 1, 4, Z1 - 1], "smooth_sandstone");              // cream east-wall lining
for (let x = 7; x <= 11; x++) {
  g.set(x, 2, 8, "dark_oak_planks"); g.set(x, 3, 8, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // counter + stone top
  g.set(x, 2, 9, "spruce_planks"); g.set(x, 3, 9, "spruce_slab", { type: "top", waterlogged: "false" });             // back cabinet + shelf
}
g.set(8, 4, 8, "brewing_stand", { has_bottle_0: "false", has_bottle_1: "false", has_bottle_2: "false" });          // espresso machine
g.set(10, 4, 8, "cake", { bites: "0" }); g.set(11, 4, 8, "candle", { candles: "2", lit: "false", waterlogged: "false" });
for (const [x, z] of [[5, 6], [5, 8], [11, 6]]) {
  g.set(x, 2, z, "spruce_fence", NOCONN);
  g.set(x, 3, z, "spruce_pressure_plate", { powered: "false" });
  stairs(x - 1, 2, z, "spruce", "west"); stairs(x + 1, 2, z, "spruce", "east");
}
for (const [x, z] of [[8, 6], [12, 7], [5, 7], [9, 7]]) { g.set(x, 5, z, "spruce_planks"); lantern(x, 4, z, true); }       // pendants
g.set(4, 2, 7, "potted_flowering_azalea_bush"); g.set(12, 2, 5, "potted_fern");
// ---- 8. roof (cafe preset: flat cantilever deck, timber soffit; charcoal per the concept) ------------------------
const rr = roof(g, [[X0, Z0, X1, Z1]], "cafe", { y: 6, material: { mix: [["polished_blackstone_brick", 45], ["cobbled_deepslate", 30], ["smooth_basalt", 15], ["tuff_brick", 10]], gradient: "none" }, fascia: "polished_blackstone_brick", trim: "polished_blackstone_brick" });
if (rr?.notes?.length) console.log("roof notes", rr.notes);
g.save(OUT);
console.log("saved", OUT, g.size);
