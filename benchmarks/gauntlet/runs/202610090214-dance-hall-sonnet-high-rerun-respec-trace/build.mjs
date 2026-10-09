// Art Deco dance hall — 52 wide x 60 tall x 40 deep body (+ marquee 8 forward). Front faces NORTH (-z).
// usage: node build.mjs [round]   (round 1 -> round-1.nbt, round 2 -> round-2.nbt)
import { Grid, B, face, setbacks, cornice, fins } from "../../../../../minecraft-design/tools/src/build.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROUND = Number(process.argv[2] || 1);
const HERE = dirname(fileURLToPath(import.meta.url));
const OX = 2;                       // x margin for side pilasters (2 proud)
const g = new Grid([56, 62, 50]);   // x east, y up, z south
const R2 = ROUND >= 2;               // round-2 fixes are gated so round 1 stays reproducible
const FZ = 8;                       // facade plane (wing face)
const X = (x) => x + OX;            // trace column -> grid x

// ---- palette (MATERIAL MAP from spec.md) ------------------------------------------------------------------------
const WHITE = "white_concrete", QUARTZ = "smooth_quartz";
const CREAM = "cut_sandstone", SMOOTH = "smooth_sandstone";
const BLUE = "blue_concrete", LAPIS = "lapis_block", BLACK = "black_concrete", GOLD = "gold_block";
const SIGN = "sea_lantern", ORANGE = "orange_terracotta", RED = "red_sandstone";
// panes need explicit connections in a structure file or they render as a bare post
const paneX = (c) => [`${c}_stained_glass_pane`, R2 ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : {}];
const paneZ = (c) => [`${c}_stained_glass_pane`, R2 ? { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" } : {}];
const pair = (b) => (Array.isArray(b) ? b : [b, undefined]);

// ---- painters ----------------------------------------------------------------------------------------------------
const mirrorState = (s) => (s && s.facing ? { ...s, facing: face.mirrorX(s.facing) } : s);
/** one cell, mirrored about the centre axis (trace x <-> 51-x) */
function M(x, y, z, b) {
  const [n, s] = pair(b);
  g.set(X(x), y, z, n, s);
  g.set(X(51 - x), y, z, n, mirrorState(s));
}
/** box in trace coords, mirrored */
function MF(x0, y0, z0, x1, y1, z1, b) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) M(x, y, z, b);
}
/** box in trace coords, not mirrored */
function F(x0, y0, z0, x1, y1, z1, b) {
  const [n, s] = pair(b);
  g.fill([X(x0), y0, z0], [X(x1), y1, z1], n, s);
}
const AIR = "minecraft:air";
const carveM = (x0, y0, z0, x1, y1, z1) => MF(x0, y0, z0, x1, y1, z1, AIR);

// ---- 1. massing: stepped roof ziggurat, front flush (setbacks align:front) ---------------------------------------
// left edges x' = 0,3,7,11,13,15,17 ; tops y = 29,31,33,35,37,39,41  (the traced diagonal, 2-block risers)
const TIERS = R2 ? [[0, 29], [3, 31], [7, 33], [12, 38], [15, 41]]
  : [[0, 29], [3, 31], [7, 33], [11, 35], [13, 37], [15, 39], [17, 41]];
const tierTop = (x) => { let t = TIERS[0][1]; for (const [l, y] of TIERS) if (x >= l) t = y; return t; };
const sb = setbacks(g, {
  base: [OX, 0, FZ], footprint: [52, 40], align: "front", front: "north", hollow: true,
  tiers: TIERS.map(([l, y], i) => ({
    height: i === 0 ? 30 : 2,
    inset: i === 0 ? 0 : l - TIERS[i - 1][0],
    block: WHITE,
  })),
});
// terrace tops read as sandstone; cornice lips on the sides and rear only (the front is the elevation)
sb.tiers.forEach((t, i) => {
  const [x0, z0, x1, z1] = t.rect;
  g.fill([x0, t.y1, z0], [x1, t.y1, z1], SMOOTH);
  cornice(g, { from: [x0, t.y1, z0], to: [x1, z1], material: "smooth_sandstone", profile: "simple", sides: ["west", "east", "south"] });
});
if (R2) {   // the black cap course and the blue band carry round the sides as tier risers (as in the 3/4 view)
  [[1, BLACK], [2, BLUE]].forEach(([i, blk]) => {
    const [x0, z0, x1, z1] = sb.tiers[i].rect, { y0, y1 } = sb.tiers[i];
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { g.set(x0, y, z, blk); g.set(x1, y, z, blk); }
  });
}
// dance floor + thick front wall (so openings can be recessed 2-3 by exclusion)
F(1, 0, FZ + 1, 50, 0, 47, "dark_oak_planks");
for (let x = 0; x <= 25; x++) MF(x, 0, FZ, x, tierTop(x) - 1, FZ + 3, WHITE);

// ---- 2. outer pilasters x0-5 (cream, reeded, stepped cap) ---------------------------------------------------------
for (let x = 0; x <= 6; x++) {
  const top = [22, 30, 30, 29, 29, 29, 29][x];
  const z0 = x >= 1 && x <= 4 ? FZ - 1 : FZ;                      // x1-4 stand 1 proud
  for (let y = 0; y <= top; y++) for (let z = z0; z <= FZ + 3; z++) M(x, y, z, x % 2 ? CREAM : SMOOTH);
}
MF(5, 32, FZ, 6, 32, FZ + 1, CREAM); MF(6, 33, FZ, 6, 33, FZ + 1, CREAM);
// stepped cap lips on the pilaster tops
M(1, 31, FZ - 1, B.stairs("smooth_sandstone", "south", "bottom")); M(2, 31, FZ - 1, B.stairs("smooth_sandstone", "south", "bottom"));
M(0, 23, FZ, B.slab("smooth_sandstone", "bottom"));

// ---- 3. wing base: black plinth, blue band, door niches -----------------------------------------------------------
MF(7, 0, FZ, 14, 1, FZ + 3, BLACK);                // plinth y0-1
MF(13, 2, FZ, 14, 3, FZ + 1, BLUE); MF(7, 2, FZ, 12, 2, FZ + 1, BLUE);
MF(7, 3, FZ, 12, 7, FZ + 3, BLACK);                 // niche block
carveM(9, 3, FZ, 10, 6, FZ + 1);                    // recess 2
MF(9, 3, FZ + 2, 10, 6, FZ + 2, paneX("yellow"));
MF(9, 3, FZ + 3, 10, 6, FZ + 3, GOLD);              // gold light behind
MF(9, 7, FZ - 1, 10, 7, FZ - 1, B.stairs("smooth_sandstone", "south", "bottom"));  // small hood over the niche

// ---- 4. wing windows: tall banded glass strip in a recessed cream arched frame ---------------------------------------
carveM(8, 9, FZ, 11, 24, FZ + 1);                   // recess 2
MF(8, 9, FZ + 1, 8, 24, FZ + 1, CREAM); MF(11, 9, FZ + 1, 11, 24, FZ + 1, CREAM);   // jambs
const BANDS = ["blue", "blue", "blue", "blue", "orange", "orange", "orange", "orange", "green", "green", "green", "green", "yellow", "yellow", "yellow", "yellow"];
for (let i = 0; i < 16; i++) MF(9, 9 + i, FZ + 2, 10, 9 + i, FZ + 2, paneX(BANDS[i]));
MF(9, 25, FZ, 10, 25, FZ + 1, CREAM);               // arched head: stair steps
MF(8, 25, FZ, 8, 25, FZ + 1, B.stairs("smooth_sandstone", "east", "top")); MF(11, 25, FZ, 11, 25, FZ + 1, B.stairs("smooth_sandstone", "west", "top"));
// zig-zag hood + small gold sunburst
MF(7, 26, FZ - 1, 12, 26, FZ, CREAM);
MF(7, 27, FZ - 1, 8, 27, FZ, CREAM); MF(11, 27, FZ - 1, 12, 27, FZ, CREAM);
MF(8, 28, FZ - 1, 8, 28, FZ, CREAM); MF(11, 28, FZ - 1, 11, 28, FZ, CREAM);
MF(9, 27, FZ, 10, 27, FZ + 1, QUARTZ);
MF(9, 28, FZ, 10, 30, FZ, GOLD);                    // sunburst y28-30
MF(8, 29, FZ, 8, 30, FZ, CREAM); MF(11, 29, FZ, 11, 30, FZ, CREAM);
MF(7, 29, FZ - 1, 7, 29, FZ, CREAM); MF(12, 29, FZ - 1, 12, 29, FZ, CREAM);

// ---- 5. wing caps: black course, blue band, black wedge, cream diagonal -------------------------------------------
MF(3, 30, FZ, 7, 31, FZ + 1, BLACK); MF(12, 30, FZ, 14, 31, FZ + 1, BLACK);
MF(8, 30, FZ - 1, 11, 31, FZ, CREAM);               // pale hood tops (zig-zag)
MF(8, 30, FZ + 1, 11, 31, FZ + 1, QUARTZ);
MF(7, 32, FZ, 14, 33, FZ + 1, BLUE);                // blue band y32-33
MF(7, 32, FZ - 1, 14, 32, FZ - 1, B.stairs("smooth_sandstone", "south", "top"));
MF(11, 34, FZ, 14, 35, FZ + 1, BLACK); MF(13, 36, FZ, 14, 37, FZ + 1, BLACK);
const T = { 11: 36, 12: 38, 13: 38, 14: 39, 15: 41, 16: 42 };      // traced diagonal outline
if (!R2) for (const x of [11, 12, 13, 14, 15]) for (let y = tierTop(x) + 1; y <= T[x]; y++) MF(x, y, FZ, x, y, FZ + 1, CREAM);
else for (const x of [11, 12, 13, 14]) {   // tiers stand coarser than the trace: the cream diagonal is a front parapet
  const capLo = { 11: 36, 12: 36, 13: 38, 14: 38 }[x];
  for (let y = tierTop(x) + 1; y < capLo; y++) MF(x, y, FZ, x, y, FZ + 1, BLACK);
  for (let y = capLo; y <= Math.max(T[x], tierTop(x)); y++) MF(x, y, FZ, x, y, FZ + 1, CREAM);
}

// ---- 6. fins and tower flank (x15-20), proud of the wing wall -----------------------------------------------------
const F0 = X(15);
for (const [a, b, yTop, depth, block] of [
  [15, 15, 40, 1, CREAM], [17, 17, 41, 2, CREAM],
  [16, 16, 42, 3, BLUE], [18, 18, 46, 3, BLUE],
  [19, 20, 46, 4, CREAM],
]) {
  for (const mir of [false, true]) {
    const from = mir ? X(51 - b) : X(a), to = mir ? X(51 - a) : X(b);
    fins(g, { face: "north", plane: FZ, from, to, every: 1, y0: 8, y1: yTop, depth, stepped: depth > 2, stepBy: 2, block });
  }
}
// blue-over-cream stripe on the cream fins' outer edge (lapis accent at the foot of the blue fins)
M(16, 21, FZ - 3, LAPIS); M(18, 21, FZ - 3, LAPIS);

// ---- 7. tower shaft x21-30 (2 forward), window, sunburst ----------------------------------------------------------
F(21, 8, FZ - 2, 30, 43, FZ - 1, QUARTZ);
MF(21, 8, FZ - 2, 22, 43, FZ - 1, CREAM);           // cream edge piers
// stained window x23-28 y20-34: 2x2-block checker, mullion x25-26
F(23, 20, FZ - 2, 28, 34, FZ - 2, AIR); carveM(23, 20, FZ, 28, 34, FZ + 2);
const CHK = ["blue", "orange", "green", "gray"];
for (let k = 0; k < 8; k++) for (let dy = 0; dy < 2; dy++) {
  const y = 34 - 2 * k - dy; if (y < 20) continue;
  const cl = k === 0 ? "blue" : CHK[k % 4], cr = k === 0 ? "blue" : CHK[(k + 2) % 4];
  for (const x of [23, 24]) g.set(X(x), y, FZ - 1, ...paneX(cl));
  for (const x of [27, 28]) g.set(X(x), y, FZ - 1, ...paneX(cr));
}
MF(23, 20, FZ + 3, 26, 34, FZ + 3, QUARTZ);         // light backing so the colour reads
MF(25, 20, FZ - 2, 25, 34, FZ - 1, CREAM);          // mullion x25-26
F(23, 35, FZ - 2, 28, 35, FZ - 2, CREAM);           // sill under sunburst
M(24, 33, FZ + 1, B.lantern(true)); M(24, 34, FZ + 1, B.chain("y", false));   // chandeliers behind glass
// gold sunburst: triangular fan y36-42
MF(23, 36, FZ - 2, 28, 37, FZ - 2, GOLD); MF(24, 38, FZ - 2, 27, 39, FZ - 2, GOLD); MF(25, 40, FZ - 2, 26, 42, FZ - 2, GOLD);
M(23, 38, FZ - 2, CREAM); M(23, 39, FZ - 2, CREAM);
// tower cap above the terrace
F(21, 42, FZ - 2, 30, 43, FZ + 7, CREAM);

// ---- 8. spire: open pointed-arch frame, glass slot, stepped tip ---------------------------------------------------
MF(21, 44, FZ - 2, 22, 53, FZ + 7, CREAM);          // legs
MF(21, 52, FZ - 2, 26, 53, FZ + 7, CREAM);          // lintel (gap x23-24 below stays sky)
MF(25, 44, FZ + 1, 26, 51, FZ + 1, paneX("yellow"));
MF(25, 46, FZ, 26, 48, FZ + 2, GOLD);               // gold y46-48
setbacks(g, { base: [X(23), 54, FZ - 2], footprint: [6, 10], hollow: false,
  tiers: [{ height: 2, block: CREAM }, { height: 2, inset: 1, block: CREAM }, { height: 2, inset: 1, block: CREAM }] });
MF(25, 53, FZ - 2, 26, 55, FZ - 1, GOLD);           // gold y53-55 at the front of the slot

// ---- 9. marquee: x15-36, y8-20, projects 8 (z0..7) ---------------------------------------------------------------
const crownT = (x) => { const d = Math.abs(x - 25.5) - 0.5; return 20 - Math.min(Math.ceil(d / 2), 4); };   // 16..20
for (let x = 15; x <= 36; x++) {
  const xs = x <= 25 ? x : 51 - x;                   // symmetric lookups
  const Tx = crownT(x);
  for (let z = 0; z <= 7; z++) {
    const top = R2 ? Math.max(16, Tx - Math.floor((7 - z) / 2)) : Math.min(20, Tx + z);
    g.set(X(x), 8, z, QUARTZ);                       // quartz soffit
    for (let y = 9; y <= top; y++) {
      let b = y <= 15 ? ((x + y) % 2 ? ORANGE : RED) : GOLD;
      if (y === 9) b = CREAM;                        // moulding
      g.set(X(x), y, z, b);
    }
  }
}
// front face (z=0): gold crown, terrazzo band y14-15, sign y10-13, jewels
for (let x = 15; x <= 36; x++) {
  const xs = x <= 25 ? x : 51 - x;
  g.set(X(x), 9, 0, CREAM);
  for (let y = 10; y <= 15; y++) g.set(X(x), y, 0, ((x >> 1) + y) % 2 ? ORANGE : RED);   // terrazzo checker
  for (let y = 16; y <= (R2 ? Math.max(16, crownT(x) - 3) : crownT(x)); y++) g.set(X(x), y, 0, GOLD);
}
F(19, 10, 0, 32, 13, 0, SIGN);                       // lit sign panel
F(19, 10, 1, 32, 13, 1, QUARTZ);
M(17, 10, 0, B.block(ORANGE)); 
for (const [x0, x1, y0, y1, name] of [[17, 18, 10, 13, "cyan"], [15, 16, 11, 12, "orange"], [25, 25, 14, R2 ? 17 : 18, "cyan"], [23, 24, 14, 15, "orange"]]) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) M(x, y, 0, [`${name}_glazed_terracotta`, { facing: "north" }]);
}
F(25, 14, 0, 26, R2 ? 17 : 18, 0, ["cyan_glazed_terracotta", { facing: "north" }]);
// entrance piers (fluted quartz) and soffit-side
MF(17, 0, FZ - 2, 20, 7, FZ - 1, B.pillar("quartz_pillar", "y"));
// entrance recess: doors 3 behind
carveM(21, 0, FZ, 30, 5, FZ + 2);
F(25, 0, FZ, 26, 7, FZ + 2, CREAM);                  // mullion
MF(21, 6, FZ, 30, 7, FZ + 3, CREAM);                 // lintel
for (const x of [21, 22, 23, 24]) {
  const hinge = x % 2 ? "left" : "right";
  for (const xx of [x, 51 - x]) {
    g.set(X(xx), 0, FZ + 3, ...B.door("dark_oak", "north", "lower", hinge));
    g.set(X(xx), 1, FZ + 3, ...B.door("dark_oak", "north", "upper", hinge));
    for (let y = 2; y <= 5; y++) g.set(X(xx), y, FZ + 3, "dark_oak_planks");
  }
}

// ---- 10. side walls: cream plinth, pilaster groups (2 proud), small upper windows --------------------------------
for (const wx of [OX, OX + 51]) for (let z = FZ; z <= 47; z++) for (let y = 0; y <= 7; y++) g.set(wx, y, z, CREAM);
for (const [face_, plane] of [["west", OX], ["east", OX + 51]]) {
  fins(g, { face: face_, plane, from: 12, to: 38, every: 8, width: 3, y0: 0, y1: 28, depth: 2, stepped: true, stepBy: 2, block: CREAM,
    cap: { block: "smooth_sandstone_slab" } });
}
for (const wx of [OX, OX + 51]) for (const z of [16, 24, 32, 40]) for (let y = 22; y <= 26; y++) g.set(wx, y, z, ...paneZ("gray"));

g.save(join(HERE, `round-${ROUND}.nbt`));
console.log(JSON.stringify({ saved: `round-${ROUND}.nbt`, refused: g.refused?.length ?? 0 }));
