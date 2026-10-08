// Art Deco dance hall — generator. x east (street), y up, z south; front faces north (-z).
// Design: 42 wide x 50 tall x 42 deep. Facade plane z=6 (marquee projects to z=0).
// Left half authored in x 0..20, mirrored to 41-x. ROUND env selects round-1 / round-2.
import { Grid, mirrorX, carve, B, face, arch, cornice, parapet } from "../../../../../minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "../../../../../minecraft-design/tools/src/structure.mjs";

const ROUND = Number(process.env.ROUND || 1);
const OUT = new URL(`./round-${ROUND}.nbt`, import.meta.url).pathname;
const g = new Grid([42, 50, 42], { dataVersion: DATA_VERSIONS["26.3"] });
const MX = 41;

// ---- helpers ---------------------------------------------------------------------------------------------------
const S = (x, y, z, b, st) => g.set(x, y, z, b, st);
const box = (x0, y0, z0, x1, y1, z1, b, st) => g.fill([x0, y0, z0], [x1, y1, z1], b, st);
const flip = (st) => (st && st.facing ? { ...st, facing: face.mirrorX(st.facing) } : st);
const M = (x, y, z, b, st) => { S(x, y, z, b, st); S(MX - x, y, z, b, flip(st)); };
const mbox = (x0, y0, z0, x1, y1, z1, b, st) => { box(x0, y0, z0, x1, y1, z1, b, st); box(MX - x1, y0, z0, MX - x0, y1, z1, b, flip(st)); };
const air = (x0, y0, z0, x1, y1, z1) => carve(g, [x0, y0, z0], [x1, y1, z1]);
const W = "white_concrete", CUT = "cut_sandstone", SM = "smooth_sandstone", CHI = "chiseled_sandstone";
const BLUE = "blue_concrete", BLACK = "black_concrete", GOLD = "gold_block";
const terra = { facing: "south" };

// ---- 1. massing: terraces step DOWN toward the side walls (concept 3/4 view) -----------------------------------------
box(2, 0, 6, 39, 21, 41, W);          // low block, wing level  (roof surface y21)
box(7, 22, 6, 34, 25, 41, W);         // mid terrace            (surface y25)
box(12, 26, 6, 29, 29, 41, W);        // high roof              (surface y29)
mbox(2, 21, 6, 6, 21, 41, SM);        // roof surfaces: field smooth, outer lip cut
mbox(7, 25, 6, 11, 25, 41, SM);
box(12, 29, 6, 29, 29, 41, SM);
mbox(2, 21, 6, 2, 21, 41, CUT); mbox(7, 25, 6, 7, 25, 41, CUT); box(12, 29, 6, 12, 29, 41, CUT); box(29, 29, 6, 29, 29, 41, CUT);
mbox(2, 21, 41, 6, 21, 41, CUT); mbox(7, 25, 41, 11, 25, 41, CUT); box(12, 29, 41, 29, 29, 41, CUT);
// risers on the sides: black foot, white, windows
M(7, 22, 6, BLACK); for (let z = 7; z <= 41; z++) M(7, 22, z, BLACK);
for (let z = 7; z <= 41; z++) { M(12, 26, z, BLACK); }
for (const zc of [10, 14, 18, 22, 26, 30, 34, 38]) { const rw = ROUND < 2 ? "light_gray_stained_glass" : "black_stained_glass"; M(7, 23, zc, rw); M(7, 24, zc, rw); }
// cornice lips under each terrace edge on the long sides (brush)
for (const [xa, y] of [[2, 21]]) {
  cornice(g, { from: [2, y, 7], to: [39, 38], material: "smooth_sandstone", profile: "simple", sides: ["east", "west"] });
}

// ---- 2. plinth ----------------------------------------------------------------------------------------------------
box(2, 0, 6, 39, 1, 6, BLACK);                     // front
mbox(2, 0, 7, 2, 1, 41, BLACK); box(2, 0, 41, 39, 1, 41, BLACK);
mbox(2, 2, 7, 2, 9, 40, CUT);                      // pale cream base course on the long sides
mbox(3, 2, 6, 11, 2, 6, BLUE);                     // blue base band on the wings

// ---- 3. side walls: ribs every 8, 1x2 windows, dark low windows ----------------------------------------------------------------
for (const z of [14, 22, 30]) {
  mbox(0, 0, z, 1, 23, z + 2, CUT);
  mbox(0, 24, z, 1, 24, z + 2, CUT);
  mbox(0, 2, z + 1, 0, 22, z + 1, CHI);
  if (ROUND < 2) mbox(0, 0, z, 1, 1, z + 2, BLACK);
  else { mbox(0, 0, z, 1, 0, z + 2, BLACK); mbox(0, 25, z, 0, 25, z + 2, CUT); mbox(0, 25, z + 1, 1, 26, z + 1, CUT); }
}
for (const zc of [10, 18, 26, 34, 38]) {
  M(2, 4, zc, "black_stained_glass"); M(2, 5, zc, "black_stained_glass");
  const uw = ROUND < 2 ? "light_gray_stained_glass" : "gray_stained_glass"; M(2, 15, zc, uw); M(2, 16, zc, uw);
}
for (const zc of [18, 26]) { M(2, 15, zc + 1, "light_gray_stained_glass"); M(2, 16, zc + 1, "light_gray_stained_glass"); }

// ---- 4. corner pilasters (3 wide, 2 proud), chiseled face ---------------------------------------------------------------
for (const [z0, z1] of [[4, 6], [39, 41]]) {
  mbox(0, 0, z0, 2, 23, z1, CUT);
  mbox(0, 0, z0, 2, 0, z1, BLACK);
  mbox(0, 2, z0, 1, 22, z1, CHI);
  mbox(0, 24, z0, 2, 24, z1, SM);
  mbox(1, 25, Math.max(z0, 4) + (z0 === 4 ? 1 : 0), 2, 25, z1, CUT);
}

// ---- 5. wing bay (left, x3..11; mirrored): ground window, glass-slot niche, crest -------------------------------------------
// ground windows: black stepped, gold bar, yellow centre
mbox(5, 2, 7, 10, 5, 7, BLACK);
for (let x = 5; x <= 10; x++) for (const y of [2, 3]) M(x, y, 6, "black_stained_glass");
for (let x = 6; x <= 9; x++) M(x, 4, 6, "black_stained_glass");
for (const x of [7, 8]) { M(x, 3, 6, "yellow_stained_glass"); M(x, 4, 6, GOLD); M(x, 5, 6, "yellow_stained_glass"); }
for (const x of [5, 10]) { M(x, 4, 6, CUT); M(x, 5, 6, CUT); }
for (const x of [5, 6, 9, 10]) M(x, 5, 6, CUT);
for (let x = 4; x <= 11; x++) M(x, 6, 6, CUT);
// glass-slot niche, recessed 1 behind a stepped cream arch
for (let x = 5; x <= 10; x++) M(x, 7, 6, CUT);            // sill
air(5, 8, 6, 10, 18, 6); air(6, 19, 6, 9, 19, 6); air(7, 20, 6, 8, 20, 6);
air(MX - 10, 8, 6, MX - 5, 18, 6); air(MX - 9, 19, 6, MX - 6, 19, 6); air(MX - 8, 20, 6, MX - 7, 20, 6);
for (const x of [5, 10]) M(x, 19, 6, CUT);
for (const x of [5, 6, 9, 10]) M(x, 20, 6, CUT);
for (let x = 5; x <= 10; x++) M(x, 21, 6, CUT);
const SLOT = ["blue", "light_gray", "orange", "yellow", "orange", "light_gray", "yellow", "blue", "light_gray", "blue"];
for (const x of [7, 8]) for (let y = 10; y <= 19; y++) M(x, y, 7, `${SLOT[(y - 10 + (x === 8 ? 3 : 0)) % SLOT.length]}_stained_glass`);
// crest: stepped screen wall (z6..7), cream edge rising 1:1 toward the fins, black + blue bands
for (let x = 3; x <= 11; x++) {
  const h = 25 + (x - 3);
  for (let y = 22; y <= h; y++) {
    let b = W;
    if (y === h) b = CUT;
    else if (y >= h - 1 && [3, 4].includes(x)) b = BLACK;
    else if (y >= h - (ROUND < 2 ? 2 : 3) && x >= 8) b = BLACK;
    else if (ROUND >= 2 && y >= h - 2 && x >= 5 && x <= 7) b = BLACK;
    else if (y >= 26 && y <= 27 && x >= 5) b = BLUE;
    for (const z of [6, 7]) M(x, y, z, b);
  }
}
// small arch + gold sunburst above each niche
for (let x = 5; x <= 10; x++) M(x, 22, 6, CUT);
for (const x of [5, 6, 9, 10]) M(x, 23, 6, CUT);
for (const x of [6, 9]) M(x, 24, 6, CUT);
for (const x of [7, 8]) { M(x, 23, 6, GOLD); M(x, 24, 6, GOLD); }
M(7, 25, 6, "yellow_stained_glass");

// ---- 6. entrance: recess, soffit, doors, columns --------------------------------------------------------------------------
air(16, 0, 6, 25, 6, 6);
box(12, 6, 0, 29, 6, 6, SM);                                      // soffit
mbox(12, 0, 6, 15, 5, 6, CUT); mbox(12, 0, 7, 16, 6, 7, CUT);
for (let y = 1; y <= 5; y += 2) { mbox(13, y, 6, 14, y, 6, CHI); }
box(16, 5, 7, 25, 6, 7, SM);
box(20, 0, 7, 21, 4, 7, CHI);
for (const x of [17, 18, 19]) { S(x, 0, 7, ...B.door("dark_oak", "north", "lower", x === 18 ? "right" : "left")); S(x, 1, 7, ...B.door("dark_oak", "north", "upper", x === 18 ? "right" : "left")); }
for (const x of [22, 23, 24]) { S(x, 0, 7, ...B.door("dark_oak", "north", "lower", x === 23 ? "left" : "right")); S(x, 1, 7, ...B.door("dark_oak", "north", "upper", x === 23 ? "left" : "right")); }
for (const x of [17, 18, 19, 22, 23, 24]) for (let y = 2; y <= 4; y++) S(x, y, 7, "dark_oak_planks");
if (ROUND < 2) { mbox(12, 0, 1, 12, 5, 1, CUT); mbox(12, 3, 1, 12, 3, 1, CHI); }     // soffit corner columns
else {  // stout 2x2 corner piers + a middle pair of piers carrying the marquee, soffit steps dark
  mbox(12, 0, 0, 13, 5, 1, CUT); mbox(12, 0, 0, 13, 0, 1, BLACK);
  for (const y of [2, 4]) mbox(12, y, 0, 13, y, 0, CHI);
  mbox(16, 0, 3, 16, 5, 3, CUT); mbox(16, 2, 3, 16, 2, 3, CHI);
  mbox(12, 5, 2, 15, 5, 5, SM);
}

// ---- 7. fin clusters + fluted columns (blue proud of cream) -----------------------------------------------------------------
mbox(11, 7, 5, 11, 33, 5, CUT);
mbox(12, 7, 4, 12, 35, 5, BLUE);
mbox(13, 7, 5, 13, 36, 5, CUT);
mbox(14, 7, 4, 14, 38, 5, BLUE);
mbox(15, 7, 4, 15, 37, 6, CUT); mbox(16, 7, 4, 16, 37, 6, SM);
for (let y = 8; y <= 36; y += 3) { M(15, y, 4, CHI); }

// ---- 8. central pier, glass, sunburst, tower ----------------------------------------------------------------------------------
box(17, 7, 5, 24, 36, 5, W);
box(17, 30, 6, 24, 44, 12, W);
air(18, 16, 5, 23, 27, 5);
const PANES = ["blue", "light_gray", "yellow", "orange", "light_gray", "blue", "orange", "yellow", "light_gray", "blue", "yellow", "light_gray"];
for (let y = 16; y <= 27; y++) for (let x = 18; x <= 23; x++) {
  const c = x === 20 || x === 21 ? ["orange", "yellow", "light_gray"][(y + 1) % 3] : PANES[(y + (x < 20 ? 0 : 5)) % PANES.length];
  S(x, y, 6, `${c}_stained_glass`);
}
box(18, 28, 5, 23, 28, 5, CUT);
box(18, 30, 5, 23, 30, 5, GOLD);
for (const x of [19, 22]) S(x, 31, 5, GOLD);
for (const x of [18, 23]) S(x, 32, 5, GOLD);
box(20, 31, 5, 21, 34, 5, GOLD);

// ---- 9. marquee: pattern face, bulbs, lit panels, stepped gold crown ----------------------------------------------------------
box(12, 7, 0, 29, 11, 5, "orange_glazed_terracotta", terra);
for (let x = 12; x <= 29; x++) { S(x, 7, 0, "glowstone"); S(x, 11, 0, GOLD); }
for (let y = 8; y <= 10; y++) { S(12, y, 0, "glowstone"); S(29, y, 0, "glowstone"); }
box(16, 8, 0, 19, 10, 0, "sea_lantern"); box(22, 8, 0, 25, 10, 0, "sea_lantern");
S(20, 8, 0, "sea_lantern"); S(21, 8, 0, "sea_lantern");
box(20, 9, 0, 21, 9, 0, "prismarine_bricks");
S(20, 10, 0, GOLD); S(21, 10, 0, GOLD);
M(13, 9, 0, "prismarine_bricks"); M(14, 9, 0, "prismarine_bricks");
for (let k = 0; k <= 5; k++) {
  const x0 = 13 + k, x1 = 28 - k;
  box(x0, 12 + k, 0, x1, 12 + k, 5, GOLD);
}
for (let y = 12; y <= 14; y++) for (let x = 15 + (y - 12); x <= 26 - (y - 12); x++) S(x, y, 0, "orange_glazed_terracotta", terra);
for (let y = 12; y <= 14; y++) { S(20, y, 0, "prismarine_bricks"); S(21, y, 0, "prismarine_bricks"); }
S(20, 13, 0, "sea_lantern"); S(21, 13, 0, "sea_lantern");

// ---- 10. spire: open pointed arch frame (brush), glass slit, stepped crown ------------------------------------------------------
if (ROUND < 2) {
  arch(g, { at: [17, 36, 5], width: 8, height: 9, depth: 2, axis: "x", profile: "pointed", block: CUT, carve: false });
  for (let y = 37; y <= 42; y++) { S(20, y, 7, "yellow_stained_glass"); S(21, y, 7, "yellow_stained_glass"); }
  for (let y = 43; y <= 44; y++) { S(20, y, 7, GOLD); S(21, y, 7, GOLD); }
  for (let y = 38; y <= 43; y += 1) for (const z of [9, 10]) { S(24, y, z, "light_gray_stained_glass"); S(17, y, z, "light_gray_stained_glass"); }
  box(17, 45, 6, 24, 45, 12, CUT);                        // crown steps 8 -> 6 -> 4 -> 2
  box(18, 46, 7, 23, 46, 11, CUT);
  box(19, 47, 8, 22, 47, 10, SM);
  box(20, 48, 8, 21, 48, 9, CUT);
} else {
  // opening x19..22 (4 wide) cleared THROUGH the tower's front two layers, inner pointed arch by brush,
  // outer 2-wide jambs + stepped shoulders by hand; tower back wall and slit show through.
  air(19, 36, 5, 22, 44, 6);
  arch(g, { at: [19, 36, 5], width: 4, height: 8, depth: 2, axis: "x", profile: "pointed", block: CUT, carve: false });
  for (const x of [17, 24]) for (let y = 36; y <= 42; y++) for (const z of [5, 6]) S(x, y, z, CUT);
  for (const x of [18, 23]) for (const z of [5, 6]) { S(x, 43, z, CUT); S(x, 42, z, CUT); }
  for (const x of [19, 22]) for (const z of [5, 6]) S(x, 44, z, CUT);
  for (const x of [17, 24]) for (const z of [5, 6]) S(x, 43, z, "air");
  for (let y = 37; y <= 42; y++) for (const x of [20, 21]) S(x, y, 7, "yellow_stained_glass");
  for (let y = 43; y <= 44; y++) for (const x of [20, 21]) S(x, y, 7, GOLD);
  for (let y = 38; y <= 43; y++) for (const z of [9, 10]) { S(24, y, z, "black_stained_glass"); S(17, y, z, "black_stained_glass"); }
  box(18, 45, 6, 23, 45, 12, CUT);                        // crown steps 6 -> 4 -> 2 (spec), narrowing in depth too
  box(19, 46, 7, 22, 46, 11, CUT);
  box(20, 47, 8, 21, 48, 10, CUT);
  S(20, 49, 8, SM); S(21, 49, 8, SM);
  box(17, 44, 6, 17, 44, 12, "air"); // tidy: nothing proud of the shoulders
}

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused?.length ?? 0 }));
