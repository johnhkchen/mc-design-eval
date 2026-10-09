// Art Deco Dance Hall — 26 x 30 x 24. Front faces NORTH (-z). x east, y up, z south.
// Round is chosen by argv: `node build.mjs 1` or `node build.mjs 2` (round 2 = fixes layered on round 1).
import { Grid, B, fins, cornice, setbacks } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ROUND = Number(process.argv[2] || 1);
const OUT = new URL(`./round-${ROUND}.nbt`, import.meta.url).pathname;
const W = 26, H = 30, D = 24;
const g = new Grid([W, H, D]);

// ---- helpers --------------------------------------------------------------------------------------------------
const flip = (f) => ({ east: "west", west: "east" }[f] ?? f);
const mir = (b) => (Array.isArray(b) && b[1]?.facing ? [b[0], { ...b[1], facing: flip(b[1].facing) }] : b);
const set = (x, y, z, b) => { const [n, s] = Array.isArray(b) ? b : [b]; g.set(x, y, z, n, s); };
const setM = (x, y, z, b) => { set(x, y, z, b); set(W - 1 - x, y, z, mir(b)); };
const box = (x0, y0, z0, x1, y1, z1, b, m = false) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) (m ? setM : set)(x, y, z, b);
};
const air = (x0, y0, z0, x1, y1, z1, m = false) => box(x0, y0, z0, x1, y1, z1, "air", m);
const ST = (mat, f, half = "bottom") => B.stairs(mat, f, half);

// ---- palette (spec material map) -----------------------------------------------------------------------------
const SS = "smooth_sandstone", CS = "cut_sandstone", CH = "chiseled_sandstone", SA = "sandstone";
const NAVY = "blue_concrete", BLK = "black_concrete", WHT = "white_concrete", GOLD = "gold_block";

// ---- 1. massing -----------------------------------------------------------------------------------------------
// Main hall body x2..23, z3..23 (front wall plane z=3; marquee/fins/pilasters stand out to z=0..2).
box(2, 0, 3, 23, 0, 23, "smooth_stone");                       // floor
box(2, 0, 3, 23, 14, 5, WHT);                                  // front wall, 3 thick (windows are recessed into it)
for (const x of [2, 23]) box(x, 0, 6, x, 14, 23, WHT);         // side walls
box(2, 0, 23, 23, 14, 23, WHT);                                // back wall
box(2, 14, 6, 23, 14, 22, SA);                                 // main deck (T0)
for (const x of [2, 23]) box(x, 0, 6, x, 4, 23, CS);           // sandstone base band on the flanks
// rear terraces stepping UP toward the back (each with a quartz edge)
function terrace(x0, x1, z0, z1, yFrom, yDeck) {
  box(x0, yFrom, z0, x1, yDeck - 1, z1, WHT);
  box(x0, yDeck, z0, x1, yDeck, z1, SA);
  for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) set(x, yDeck, z, "smooth_quartz");
  for (let z = z0; z <= z1; z++) for (const x of [x0, x1]) set(x, yDeck, z, "smooth_quartz");
  for (let x = x0 + 1; x <= x1 - 1; x += 2) for (let z = z0 + 1; z <= z1 - 1; z++) if ((x + z) % 4 === 1) set(x, yDeck, z, CS);
}
terrace(2, 23, 9, 14, 15, 16);   // T1: silhouette y16, x2..23
terrace(5, 20, 15, 19, 15, 17);  // T2: silhouette y17, x5..20
terrace(6, 19, 20, 23, 15, 19);  // T3: silhouette y19, x6..19
// central tower x8..17, z3..12, walls to y21; carries the spire
box(8, 15, 3, 17, 21, 12, WHT);
box(8, 21, 3, 17, 21, 12, SA);

// ---- 2. front pilasters (corner pylons) x0..2 ---------------------------------------------------------------
function pylon(x0) {                    // left pylon; mirrored by setM
  for (let y = 0; y <= 14; y++) for (let z = 1; z <= 7; z++) {
    const reed = y % 2 === 0 ? CH : CS;
    if (y <= 11) setM(0, y, z, CS);
    setM(1, y, z, z === 1 ? reed : CS);
    setM(2, y, z, CS);
  }
  setM(0, 12, 1, B.slab("cut_sandstone")); // stepped top: x0 lower, x1..2 full
  for (let y = 0; y <= 11; y++) setM(0, y, 1, y % 3 === 1 ? CH : CS);
  for (const x of [1, 2]) setM(x, 15, 1, BLK);                  // black end caps of the cornice
  setM(1, 15, 2, BLK); setM(2, 15, 2, BLK); setM(3, 15, 3, BLK);
  setM(2, 16, 3, SS);
}
pylon(0);

if (ROUND >= 2) {
  for (let y = 1; y <= 11; y++) { setM(1, y, 0, B.wall("sandstone")); }        // thin vertical reeds on the pylon face
  for (const x of [0, 2]) for (let y = 12; y <= 14; y++) if (x === 2) setM(x, y, 0, B.slab("cut_sandstone", "top"));
}
// ---- 3. wings x3..7 -------------------------------------------------------------------------------------------
// plinth: black y0, navy y1 either side of the dark doorway
box(3, 0, 3, 6, 0, 3, BLK, true);
setM(3, 1, 3, NAVY); setM(6, 1, 3, NAVY);
setM(7, 0, 3, CS); setM(7, 1, 3, CS);
// doorway x4..5 y1..3, dark glass over blackstone; cream surround stepping up (stairs)
air(4, 1, 3, 5, 3, 3, true);
for (const x of [4, 5]) for (let y = 1; y <= 3; y++) { setM(x, y, 4, "black_stained_glass"); setM(x, y, 5, "blackstone"); }
setM(3, 2, 3, "blackstone"); setM(6, 2, 3, "blackstone");
setM(3, 3, 3, ST("smooth_sandstone", "east")); setM(6, 3, 3, ST("smooth_sandstone", "west"));
for (const x of [4, 5]) setM(x, 4, 3, SS);
setM(3, 4, 3, CS); setM(6, 4, 3, CS);
setM(3, 5, 3, ST("smooth_sandstone", "east")); setM(6, 5, 3, ST("smooth_sandstone", "west"));
// tall stained-glass window x4..5, y6..12, recessed -1; white piers x3 and x6 stand proud +1
air(4, 6, 3, 5, 12, 3, true);
const WG = ROUND >= 2 ? ["light_blue", "light_blue", "blue", "yellow", "light_blue", "orange", "blue"] : ["blue", "light_blue", "yellow", "orange", "light_blue", "blue", "yellow"];
for (let i = 0; i < 7; i++) for (const x of [4, 5]) setM(x, 6 + i, 4, `${WG[(i + (x === 5 ? 1 : 0)) % 7]}_stained_glass`);
for (const x of [3, 6]) box(x, 6, 2, x, 12, 2, WHT, true);
// gold ornament crowning the window
for (const x of [4, 5]) { setM(x, 13, 3, GOLD); setM(x, 14, 3, GOLD); }
setM(3, 13, 3, CH); setM(6, 13, 3, CH);
setM(3, 14, 3, ST("smooth_sandstone", "east")); setM(6, 14, 3, ST("smooth_sandstone", "west"));
// cornice: navy bar y16 with black caps; quartz y15; stepped shoulders rise toward the tower
for (const x of [4, 5]) setM(x, 15, 3, "smooth_quartz");
setM(6, 15, 3, BLK); setM(7, 15, 3, NAVY);
for (let x = 3; x <= 7; x++) setM(x, 16, 3, NAVY);
setM(5, 17, 3, NAVY); setM(6, 17, 3, BLK); setM(7, 17, 3, NAVY);
for (const x of [6, 7]) for (const y of [18, 19]) setM(x, y, 3, CS);
setM(7, 20, 3, ST("smooth_sandstone", "east"));
// shoulders need depth behind
for (const [x, ya, yb] of [[5, 17, 17], [6, 17, 19], [7, 15, 20]]) for (let z = 4; z <= 5; z++) for (let y = ya; y <= yb; y++) setM(x, y, z, WHT);

// ---- 4. entrance + marquee --------------------------------------------------------------------------------------
// entrance recess x9..16, y0..3, doors at z=4 (recess -1)
air(9, 0, 3, 16, 3, 3, true);
for (const x of [9, 10]) for (let y = 0; y <= 3; y++) setM(x, y, 4, "dark_oak_planks");
for (let y = 0; y <= 3; y++) for (const x of [11, 12, 13, 14]) set(x, y, 5, "dark_oak_planks");
for (const [x, hinge] of [[11, "left"], [12, "right"], [13, "left"], [14, "right"]]) {
  set(x, 0, 4, B.door("dark_oak", "north", "lower", hinge));
  set(x, 1, 4, B.door("dark_oak", "north", "upper", hinge));
}
for (const x of [11, 12, 13, 14]) { set(x, 2, 4, "dark_oak_planks"); set(x, 3, 4, "dark_oak_planks"); }
for (let x = 9; x <= 16; x++) set(x, 4, 3, "dark_oak_planks");           // lintel
// reeded cream entrance pilasters x7..8 (z=1..2): wall strips give the vertical lines
for (const x of [7, 8]) for (let y = 0; y <= 3; y++) { setM(x, y, 2, x === 7 ? SS : CS); setM(x, y, 1, x === 7 ? B.wall("sandstone") : SS); }
// marquee x7..18, z0..2, y4..7
box(7, 4, 0, 18, 4, 2, "spruce_planks");                                  // soffit + front course
box(7, 5, 0, 18, 6, 2, "terracotta");                                     // fascia body
box(7, 7, 0, 18, 7, 2, GOLD);                                             // gold top course
const JEWELS = ["orange_glazed_terracotta", "terracotta", "cyan_glazed_terracotta", "orange_terracotta"];
for (const x of [7, 8, 9]) for (const y of [5, 6]) setM(x, y, 0, JEWELS[(x + y) % 4]);
// white sign panel x10..15 recessed 1, teal diamonds at x12..13
air(10, 5, 0, 15, 6, 0);
box(10, 5, 1, 15, 6, 1, WHT);
for (const [x, y] of [[12, 5], [13, 5], [12, 6], [13, 6]]) set(x, y, 0, "prismarine");
set(12, 5, 1, "sea_lantern"); set(13, 6, 1, "sea_lantern"); set(11, 5, 1, "sea_lantern"); set(14, 5, 1, "sea_lantern");
for (const [x, y] of [[11, 6], [14, 6]]) set(x, y, 0, "yellow_glazed_terracotta");
// gold crest rising toward the centre (and toward the wall): y8 z1 x10..15, y9 z2 x11..14
box(10, 8, 1, 15, 8, 1, GOLD); box(10, 8, 2, 15, 8, 2, GOLD); box(11, 9, 2, 14, 9, 2, GOLD);

// ---- 5. tower front: fins, piers, glass, sunburst -------------------------------------------------------------
// navy fins +2 (z1..2): x8 to y21, x9 to y22; mirrored
const innerDepth = ROUND >= 2 ? 1 : 2;
fins(g, { face: "north", plane: 3, from: 9, to: 9, every: 1, y0: 8, y1: 22, depth: innerDepth, block: NAVY });
fins(g, { face: "north", plane: 3, from: 16, to: 16, every: 1, y0: 8, y1: 22, depth: innerDepth, block: NAVY });
fins(g, { face: "north", plane: 3, from: 8, to: 8, every: 1, y0: 8, y1: 21, depth: 2, block: NAVY });
fins(g, { face: "north", plane: 3, from: 17, to: 17, every: 1, y0: 8, y1: 21, depth: 2, block: NAVY });
// cream piers +1 at x10, x15
fins(g, { face: "north", plane: 3, from: 10, to: 10, every: 1, y0: 8, y1: 21, depth: 1, block: SS, cap: { block: "smooth_sandstone_slab" } });
fins(g, { face: "north", plane: 3, from: 15, to: 15, every: 1, y0: 8, y1: 21, depth: 1, block: SS, cap: { block: "smooth_sandstone_slab" } });
// central stained-glass column x11..14, y9..16, recessed -1 (glass at z=4, backed by wall z=5)
air(11, 9, 3, 14, 16, 3);
const GL = ROUND >= 2
  ? [["blue", "yellow", "yellow", "light_blue"], ["light_blue", "light_blue", "orange", "blue"]]
  : [["blue", "yellow", "orange", "light_blue"], ["light_blue", "orange", "yellow", "blue"]];
for (let y = 9; y <= 16; y++) for (let i = 0; i < 4; i++) {
  const mull = y === 12 || y === 15;
  set(11 + i, y, 4, mull ? "smooth_sandstone" : `${GL[y % 2][i]}_stained_glass`);
}
// lintel + sunburst fan
box(11, 17, 3, 14, 17, 3, CH);
if (ROUND < 2) {
  for (const x of [12, 13]) { set(x, 17, 2, GOLD); set(x, 20, 2, GOLD); }
  box(11, 18, 2, 14, 19, 2, GOLD);
  set(12, 21, 3, GOLD); set(13, 21, 3, GOLD);
} else {
  box(11, 18, 3, 14, 18, 3, GOLD);                           // bar flush
  for (const x of [12, 13]) { set(x, 19, 2, GOLD); set(x, 20, 3, GOLD); }   // fan core proud +1
  set(11, 19, 3, ST("smooth_sandstone", "east")); set(14, 19, 3, ST("smooth_sandstone", "west"));
  set(11, 19, 2, "end_rod"); set(14, 19, 2, "end_rod");
}

// ---- 6. spire: hollow stepped arch with glass slit ---------------------------------------------------------------
for (let y = 22; y <= 25; y++) for (let z = 3; z <= 8; z++) { box(10, y, z, 11, y, z, SS, true); }
air(12, 22, 3, 13, 25, 8);
for (let y = 22; y <= 25; y++) for (const x of [12, 13]) set(x, y, 4, y < 24 ? "light_blue_stained_glass" : "yellow_stained_glass");
for (let z = 3; z <= 8; z++) { set(11, 26, z, SS); set(14, 26, z, SS); set(12, 26, z, GOLD); set(13, 26, z, GOLD); }
setbacks(g, { base: [11, 27, 3], footprint: [4, 4], align: "front", hollow: false, tiers: [
  { height: 2, block: CH }, { height: 1, inset: 1, block: CS } ] });
set(10, 26, 3, ST("smooth_sandstone", "east", "top")); set(15, 26, 3, ST("smooth_sandstone", "west", "top"));

// ---- 7. flanks: piers, cornice, small windows -------------------------------------------------------------------
for (const [face, plane] of [["west", 2], ["east", 23]]) {
  for (const z0 of [10, 15, 20]) for (const dz of [0, 1])
    fins(g, { face, plane, from: z0 + dz, to: z0 + dz, every: 1, y0: 0, y1: 13, depth: 2, block: SS });
}
cornice(g, { from: [2, 14, 3], to: [23, 23], material: "smooth_sandstone", profile: "simple", sides: ["west", "east"] });
for (const x of [2, 23]) for (const z of [8, 13, 18]) for (let y = 10; y <= 12; y++) set(x, y, z, "light_blue_stained_glass_pane");

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, round: ROUND }));
