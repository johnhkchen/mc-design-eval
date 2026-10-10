// Settlers' League hall — banner shop on an old deepslate stall base. Front faces NORTH (-z).
// Body 7 wide x 7 deep (z 2..8) + 2-deep awning (z 0..1) = 9 deep.
import { Grid, B, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OX = 1;                                   // grid x = building x + 1 (room for the roof overhang)
const g = new Grid([9, 18, 10]);                // height 18: the taller ridge flagpole needs room
const OUT = process.env.OUT ?? "build.nbt";
const put = (x, y, z, ...p) => g.set(x + OX, y, z, ...p);
const fill = (a, b, blk, s) => g.fill([a[0] + OX, a[1], a[2]], [b[0] + OX, b[1], b[2]], blk, s);
const stairs = (x, y, z, m, f, h = "bottom") => put(x, y, z, ...B.stairs(m, f, h));
const slab = (x, y, z, m, t = "bottom") => put(x, y, z, ...B.slab(m, t));
const log = (x, y, z, m, a = "y") => put(x, y, z, ...B.log(m, a));
const pane = (x, y, z, ax) => put(x, y, z, "glass_pane", ax === "x" ? { east: "true", west: "true" } : { north: "true", south: "true" });
const banner = (x, y, z, color, pats, facing) => put(x, y, z, ...B.banner(color, pats, { facing }));
const STR = ["warped", "quartz"];               // awning stripe materials

// ---- base: old deepslate stall, cracked + a little moss ----
fill([0, 0, 2], [6, 0, 8], "deepslate_bricks");
for (const [x, z] of [[0,2],[2,2],[5,3],[6,5],[0,7],[3,8],[6,8],[1,8],[0,4]]) put(x, 0, z, "cracked_deepslate_bricks");
for (const [x, z] of [[1,2],[4,2],[6,3],[0,6]]) put(x, 0, z, "mossy_cobblestone");
fill([0, 0, 0], [6, 0, 1], "cobbled_deepslate");                       // street apron under the awning
for (const x of [1, 3, 5]) stairs(x, 0, 1, "deepslate_brick", "north");
fill([1, 0, 3], [5, 0, 7], "spruce_planks");                           // shop floor

// ---- walls: stone bricks y1..6, hollow, plinth course of deepslate bricks at y1 ----
fill([0, 1, 2], [6, 6, 8], "stone_bricks");
fill([1, 1, 3], [5, 6, 7], "air");
fill([0, 1, 2], [6, 1, 8], "deepslate_bricks");
fill([1, 1, 3], [5, 1, 7], "air");
for (const [x, y, z] of [[0,2,5],[6,3,6],[2,2,8],[4,5,8],[6,5,3],[0,6,4],[3,3,8],[0,3,7]]) put(x, y, z, "cracked_stone_bricks");
for (const [x, y, z] of [[0,2,3],[6,2,4],[5,2,8],[1,2,8]]) put(x, y, z, "mossy_stone_bricks");
// have-not patches: cobble, mud brick, plain planks
fill([6, 2, 6], [6, 3, 7], "mud_bricks");
for (const [x, y, z] of [[0,2,6],[0,3,6],[0,2,7],[6,3,3]]) put(x, y, z, "cobblestone");
fill([0, 5, 6], [0, 6, 7], "oak_planks");

// ---- oak corner posts, band at floor line, proud pilasters above the awning ----
for (const x of [0, 6]) for (const z of [2, 8]) for (let y = 1; y <= 6; y++) log(x, y, z, "oak");
for (const x of [0, 6]) { log(x, 5, 1, "oak"); log(x, 6, 1, "oak"); }
for (const x of [0, 6]) for (let z = 3; z <= 7; z++) log(x, 4, z, "stripped_oak", "z");
for (let x = 1; x <= 5; x++) { log(x, 4, 2, "stripped_oak", "x"); log(x, 4, 8, "stripped_oak", "x"); }

// ---- front: open shop counter y1-2, plank transom y3, beam y4, tripartite upper windows ----
for (let x = 1; x <= 5; x++) { put(x, 1, 2, "air"); put(x, 2, 2, "air"); put(x, 3, 2, "spruce_planks"); }
for (const x of [1, 3, 5]) put(x, 3, 2, "stripped_oak_log", { axis: "x" });          // timber studs through the transom
// counter on the street side of the opening, trapdoor front
for (let x = 1; x <= 5; x++) { put(x, 1, 1, "spruce_planks"); put(x, 1, 0, ...B.trapdoor("spruce", "north", "bottom", true)); }
for (let x = 1; x <= 5; x++) slab(x, 2, 1, "spruce", "bottom");
// upper windows, reveal by exclusion: wall cell left empty, glass set one cell back, sill slab
for (const xs of [[1, 2], [4, 5]]) for (const x of xs) {
  put(x, 5, 2, "air"); put(x, 6, 2, "air");
  for (const y of [5, 6]) pane(x, y, 3, "x");
  slab(x, 5, 2, "stone_brick", "bottom");
}
put(3, 5, 2, "stone_bricks"); put(3, 6, 2, "stone_bricks");
for (const x of [1, 2, 4, 5]) put(x, 7, 2, "air");
// hanging signs on the pier
put(3, 5, 1, ...B.sign("spruce", ["SETTLERS'", "LEAGUE"], { facing: "north", color: "black" }));
put(3, 6, 1, ...B.sign("spruce", ["BANNERS", "FLAGS & CLOTH", "MEETINGS UP"], { facing: "north", color: "black" }));

// ---- awning: teal/white stripe stairs rising to the wall, slab valance, fence posts ----
for (let x = 0; x <= 6; x++) {
  const m = STR[x % 2];
  stairs(x, 4, 1, m, "south");
  stairs(x, 4, 0, STR[(x + 1) % 2], "south");
}
for (const x of [0, 6]) for (let y = 1; y <= 3; y++) put(x, y, 0, "spruce_fence");
for (const x of [2, 4]) put(x, 3, 0, ...B.lantern(true));
// seven banners across the front, each different
const FRONT = [
  ["red", [["cross", "white"]]], ["orange", [["flower", "white"]]], ["yellow", [["rhombus", "white"]]],
  ["lime", [["circle", "white"]]], ["blue", [["rhombus", "white"], ["border", "light_blue"]]],
  ["purple", [["flower", "pink"]]], ["red", [["diagonal_left", "white"], ["border", "red"]]],
];
FRONT.forEach(([c, p], x) => banner(x, 3, 1, c, p, "north"));
// planter barrels + A-board at the street
put(1, 1, 0, "barrel", { facing: "up" }); put(1, 2, 0, "potted_oxeye_daisy");
put(5, 1, 0, "barrel", { facing: "up" }); put(5, 2, 0, "potted_cornflower");
put(3, 1, 0, ...B.sign("spruce", ["OPEN", "ALL DAY"], { wall: false, rotation: 8, color: "black" }));

// ---- side walls: windows, side door east, flags, lanterns ----
// west (x=0): ground window + upper window, hanging banners
for (const y of [2]) for (const z of [4, 5]) { put(0, y, z, "glass_pane", { north: "true", south: "true" }); }
for (const z of [4, 5]) { put(0, 5, z, "glass_pane", { north: "true", south: "true" }); put(0, 6, z, "glass_pane", { north: "true", south: "true" }); }
for (const z of [4, 5]) slab(0, 3, z, "stone_brick", "top");
banner(-1, 3, 3, "red", [["cross", "white"]], "west");
banner(-1, 3, 7, "yellow", [["straight_cross", "red"]], "west");
// east (x=6): side door with lantern, upper windows
put(6, 1, 5, ...B.door("oak", "east", "lower")); put(6, 2, 5, ...B.door("oak", "east", "upper"));
put(7, 1, 5, ...B.lantern(false)); put(7, 0, 5, "cobblestone_slab");
for (const z of [3, 7]) { put(6, 5, z, "glass_pane", { north: "true", south: "true" }); put(6, 6, z, "glass_pane", { north: "true", south: "true" }); slab(6, 4, z, "stone_brick", "top"); }
banner(7, 3, 3, "cyan", [["flower", "white"]], "east");
banner(7, 3, 7, "green", [["stripe_center", "white"]], "east");
// back (z=8): upper windows, ground window, flag
for (const x of [2, 4]) { for (const y of [5, 6]) pane(x, y, 8, "x"); slab(x, 4, 9, "stone_brick", "bottom"); }
for (const x of [2, 4]) pane(x, 2, 8, "x");
banner(3, 3, 9, "cyan", [["flower", "white"]], "south");
put(5, 1, 9, "barrel", { facing: "up" }); put(1, 1, 9, "barrel", { facing: "up" });

// ---- interior ----
fill([1, 4, 3], [5, 4, 7], "spruce_planks");                           // upper floor
for (let z = 3; z <= 5; z++) put(1, 4, z, "air");                      // stair well
for (let i = 0; i < 4; i++) stairs(1, 1 + i, 3 + i, "spruce", "south");
for (const x of [2, 3, 4, 5]) { put(x, 1, 7, "bookshelf"); put(x, 2, 7, "bookshelf"); }
put(1, 1, 7, "barrel", { facing: "up" }); put(5, 1, 6, "barrel", { facing: "up" }); put(5, 1, 5, "barrel", { facing: "up" });
for (const [c, x] of [["red", 2], ["blue", 4]]) put(x, 2, 6, ...B.banner(c, [["cross", "white"]], { wall: false, rotation: 0 }));
put(3, 3, 6, ...B.lantern(true)); put(3, 3, 4, ...B.lantern(true));
// meeting room above
fill([2, 5, 5], [4, 5, 5], "spruce_planks"); put(3, 6, 5, "oak_pressure_plate"); put(3, 5, 5, "spruce_planks");
for (const x of [2, 3, 4]) stairs(x, 5, 6, "spruce", "north");
banner(5, 6, 6, "purple", [["flower", "yellow"]], "west");
put(3, 6, 4, ...B.lantern(false));

// ---- roof: real gable by style, stone brick, oak verge + cornice, chimney ----
const rr = roof(g, [[1, 2, 7, 8]], "gable", {
  y: 7, material: "stone_brick", trim: "stripped_oak", gable: "stone_bricks", ridgeAxis: "z",
  pitch: process.env.PITCH ?? "half", overhang: 0, eave: "plain", verge: "stripped_oak",
  chimneys: [{ at: [2, 7], size: 1, material: "stone_bricks", rise: 1 }],
});
console.log("roof", JSON.stringify({ top: rr.top, shift: rr.shift, refused: rr.refused?.length }));
// ---- flagpole at the front ridge with a standing pennant, gable banner ----
let top = 0; for (let y = 0; y < 14; y++) if (g.blockAt(3 + OX, y, 3) && !/air/.test(String(g.blockAt(3 + OX, y, 3)))) top = y;
for (let y = top + 1; y <= top + 5; y++) put(3, y, 3, "spruce_fence");           // mast raised 2
put(3, top + 6, 3, ...B.banner("cyan", [["flower", "white"]], { wall: false, rotation: 8 }));
put(3, top + 7, 3, "spruce_fence");                                                  // a banner can't stand on a banner
put(3, top + 8, 3, ...B.banner("white", [["stripe_center", "cyan"]], { wall: false, rotation: 8 }));
banner(3, 8, 1, "cyan", [["flower", "white"]], "north");
console.log("ridge top", top);
g.save(OUT);
console.log(JSON.stringify({ saved: OUT, size: g.size, refused: g.refused }));
