// Art Deco dance hall — generator. `node build.mjs 1` -> round-1.nbt, `node build.mjs 2` -> round-2.nbt
// Spec coords: x 0..21 along street, z 0 = front plane (north), y 0 = ground. Grid is offset (+1,0,+3) so the
// 1-proud side pilasters (x -1/22) and the 3-deep marquee (z -3..-1) fit.
import { Grid, B, DIRS } from "../../../../../minecraft-design/tools/src/build.mjs";
import { fins, parapet, cornice } from "../../../../../minecraft-design/tools/src/shapes-massing.mjs";
import { DATA_VERSIONS } from "../../../../../minecraft-design/tools/src/structure.mjs";

const R = Number(process.argv[2] || 1);
const OX = 1, OZ = 3;
const g = new Grid([24, 17, 23], { dataVersion: DATA_VERSIONS["26.3"] });

// ---- helpers in SPEC coordinates ------------------------------------------------------------------------------
const S = (x, y, z, b, st) => (Array.isArray(b) ? g.set(x + OX, y, z + OZ, b[0], b[1]) : g.set(x + OX, y, z + OZ, b, st));
const F = (x0, y0, z0, x1, y1, z1, b) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) S(x, y, z, b); };
const AIR = "minecraft:air";
const mx = (x) => 21 - x;                         // mirror about the building's centre line
const both = (fn) => { fn((x) => x, false); fn(mx, true); };   // draw once, mirrored once (fn gets x-mapper + mirrored flag)
const flipFace = (f) => ({ east: "west", west: "east" }[f] ?? f);

const SAND = "cut_sandstone", CHIS = "chiseled_sandstone", SMOOTH = "smooth_sandstone";
const WHITE = "white_concrete", NAVY = "blue_concrete", BLACK = "black_concrete", GOLD = "gold_block";
const GLASS = ["yellow_stained_glass", "orange_stained_glass", "light_blue_stained_glass", "blue_stained_glass"];

// ---- 1. massing: terraced hollow body (walls + decks) ---------------------------------------------------------
// tiers along z: A z0..8 top y7 (parapet y8), B z9..13 top y5 (parapet y6), C z14..19 top y4 (parapet y5)
const TIERS = R >= 2
  ? [{ z0: 0, z1: 8, deck: 8 }, { z0: 9, z1: 13, deck: 6 }, { z0: 14, z1: 19, deck: 5 }]
  : [{ z0: 0, z1: 8, deck: 7 }, { z0: 9, z1: 13, deck: 5 }, { z0: 14, z1: 19, deck: 4 }];
for (const t of TIERS) {
  for (let z = t.z0; z <= t.z1; z++) for (let x = 0; x <= 21; x++) {
    const edge = x === 0 || x === 21 || z === 0 || z === 19 || z === t.z0 || z === t.z1;
    for (let y = 1; y <= t.deck - 1; y++) if (edge) S(x, y, z, WHITE);
    S(x, t.deck, z, R >= 2 ? SMOOTH : WHITE);      // deck
  }
  if (R < 2) {
    // round 1: navy line one in from the parapet, white field inside, raised rim (reads as a tray)
    for (let z = t.z0; z <= t.z1; z++) for (let x = 0; x <= 21; x++) {
      const inner = x === 1 || x === 20 || z === t.z0 + 1 || z === t.z1 - 1;
      const rim = x === 0 || x === 21 || z === t.z0 || z === t.z1;
      if (inner && !rim) S(x, t.deck, z, NAVY);
    }
    parapet(g, { from: [0 + OX, t.deck + 1, t.z0 + OZ], to: [21 + OX, t.z1 + OZ], block: SMOOTH, style: "solid" });
    for (let z = Math.max(t.z0, 4); z <= t.z1; z++) { S(0, t.deck, z, NAVY); S(21, t.deck, z, NAVY); }
  } else {
    // round 2: a white band inset in the sand deck, navy edge on the step-down riser, sand coping
    for (let z = t.z0 + 1; z <= t.z1 - 1; z++) for (let x = 2; x <= 19; x++) if (z > 0) S(x, t.deck, z, WHITE);
    if (t.z1 < 19) for (let x = 0; x <= 21; x++) S(x, t.deck - 1, t.z1, NAVY);
    for (let z = Math.max(t.z0, 4); z <= t.z1; z++) { S(0, t.deck - 1, z, NAVY); S(21, t.deck - 1, z, NAVY); }
  }
}
// floor / plinth: navy stripe on wings and flanks, black under the central bay
F(0, 0, 0, 21, 0, 19, NAVY);
F(6, 0, 0, 15, 0, 3, BLACK);

// ---- 2. side walls (z 4..19): 2-wide pilasters every 5, slits between ---------------------------------------
const wallTop = (z) => TIERS.find((t) => z >= t.z0 && z <= t.z1).deck - 1;   // top wall row (inclusive)
for (const [plane, outward, to] of [[0, -1, "west"], [21, +1, "east"]]) {
  for (const pz of [4, 9, 14, 18]) for (let z = pz; z <= pz + 1; z++) {
    for (let y = 0; y <= wallTop(z) + (z === 4 || z === 9 || z === 14 ? 0 : 0); y++) S(plane + outward, y, z, y === 0 ? NAVY : SAND);
    S(plane + outward, wallTop(z) + 1, z, SMOOTH); // pilaster cap
  }
  // slits (1 wide x 2-3 tall) centred between pilasters, cycling the stained-glass mix
  [[7, 3, 5], [12, 3, 4], [16, 2, 3]].forEach(([z, ya, yb], i) => {
    for (let y = ya; y <= yb; y++) S(plane, y, z, GLASS[(i + (plane ? 1 : 0)) % 4]);
  });
}

// ---- 3. wings (x 0..5 / 16..21) front, depth z0 --------------------------------------------------------------
both((X, m) => {
  // end piers x0-1: chiseled face, 1 proud, stepped cap
  for (const x of [0, 1]) {
    for (let y = 1; y <= 7; y++) { S(X(x), y, -1, CHIS); }
    for (let y = 0; y <= 7; y++) for (let z = 0; z <= 3; z++) S(X(x), y, z, y === 0 ? NAVY : SAND);
    S(X(x), 8, -1, SAND); S(X(x), 8, 0, SAND);
    S(X(x), 8, 1, SAND); S(X(x), 8, 2, SMOOTH); S(X(x), 8, 3, SMOOTH);
  }
  S(X(0), 9, -1, B.slab("cut_sandstone")); S(X(1), 9, -1, B.slab("cut_sandstone"));
  // side bay x2-5: window x3-4 y3-6 recessed to z1, rosette y7, lower black window y1-2
  for (let y = 1; y <= 7; y++) for (const x of [2, 5]) S(X(x), y, 0, y <= 2 ? (R >= 2 ? NAVY : BLACK) : WHITE);
  for (const x of [3, 4]) {
    for (let y = 3; y <= 6; y++) { S(X(x), y, 0, AIR); S(X(x), y, 1, GLASS[(y + x) % 4]); }
    S(X(x), 7, 0, GOLD);
    for (let y = 1; y <= 2; y++) S(X(x), y, 0, "black_stained_glass");
    if (R < 2) { S(X(x), 1, 1, BLACK); S(X(x), 2, 1, BLACK); }   // dark backing behind the lower slit
  }
  // zig-zag crest at the wing front (y7-8): navy/black stepping toward the centre
  S(X(2), 7, 0, BLACK); S(X(3), 7, 0, NAVY); S(X(4), 7, 0, NAVY); S(X(5), 7, 0, BLACK);
  S(X(2), 8, 0, NAVY); S(X(3), 8, 0, BLACK); S(X(4), 8, 0, NAVY); S(X(5), 8, 0, BLACK);
  S(X(5), 9, 0, NAVY);
  if (R >= 2) {   // crest steps UP toward the pylon: black/navy ascending stair-step, as in the concept
    S(X(2), 8, 0, BLACK); S(X(3), 8, 0, NAVY); S(X(4), 8, 0, BLACK); S(X(5), 8, 0, NAVY);
    S(X(4), 9, 0, NAVY); S(X(5), 9, 0, BLACK); S(X(5), 10, 0, NAVY);
    S(X(2), 7, 0, NAVY); S(X(3), 7, 0, BLACK); S(X(4), 7, 0, NAVY); S(X(5), 7, 0, BLACK);
  }
});

// ---- 4. central pylon x6..15, z0..3 ---------------------------------------------------------------------------
// open the hall up into the pylon
F(7, 7, 1, 14, 7, 2, AIR);
for (let x = 6; x <= 15; x++) for (let z = 0; z <= 3; z++) S(x, 8, z, AIR);
// pylon shell: walls to y11, white field; fins flush at z0
for (let y = 1; y <= 12; y++) for (let x = 6; x <= 15; x++) for (let z = 0; z <= 3; z++) {
  const edge = z === 0 || z === 3 || x === 6 || x === 15;
  if (!edge) continue;
  let b = WHITE;
  if (x === 6 || x === 15) b = y <= 11 ? NAVY : AIR;
  else if (x === 7 || x === 14) b = SAND;
  if (b !== AIR) S(x, y, z, b);
}
for (const [x] of [[6], [15]]) for (let z = 1; z <= 2; z++) for (let y = 8; y <= 11; y++) S(x, y, z, NAVY);
// pylon cap y12
F(8, 12, 0, 13, 12, 3, SAND);
F(7, 12, 1, 7, 12, 2, SAND); F(14, 12, 1, 14, 12, 2, SAND);
// fins project 1 (z-1): navy x6/x15 to y11, sand x7/x14 to y12, from y1
for (const [x, top, blk] of [[6, 11, NAVY], [7, 12, SAND], [14, 12, SAND], [15, 11, NAVY]]) {
  fins(g, { face: "north", plane: 0 + OZ, from: x + OX, to: x + OX, every: 1, y0: 1, y1: top, depth: 1, block: blk });
}
// white field beside the glass: x8 and x13 flush, up to y11
for (const x of [8, 13]) for (let y = 4; y <= 11; y++) S(x, y, 0, WHITE);
// recessed doorway (z1) with lintel
for (let y = 1; y <= 2; y++) for (let x = 9; x <= 12; x++) S(x, y, 0, AIR);
for (let x = 9; x <= 12; x++) { S(x, 3, 0, CHIS); S(x, 2, 1, B.door("dark_oak", "north", "upper", x % 2 ? "left" : "right")); S(x, 1, 1, B.door("dark_oak", "north", "lower", x % 2 ? "left" : "right")); }
for (const x of [8, 13]) for (let y = 1; y <= 3; y++) { S(x, y, 0, ["stripped_birch_log", { axis: "y" }]); }
// central window: recessed to z1, 2x2 checker glass, sandstone mullion knot
for (let y = 7; y <= 10; y++) for (let x = 9; x <= 12; x++) {
  S(x, y, 0, AIR);
  const quad = (x >= 11 ? 1 : 0) + (y >= 9 ? 2 : 0);
  S(x, y, 1, GLASS[quad]);
}
for (let y = 8; y <= 9; y++) for (const x of [10, 11]) S(x, y, 1, SAND);
if (R >= 2) for (let y = 7; y <= 10; y++) for (let x = 9; x <= 12; x++) S(x, y, 2, WHITE);   // back the glass so it reads lit
// sunburst y11 (4 base) + y12 (2 top step) gold fan, flush
for (let x = 9; x <= 12; x++) S(x, 11, 0, GOLD);
for (const x of [10, 11]) S(x, 12, 0, GOLD);
// spire: open arch x9-12, legs x9/x12 y13-15, yellow glass x10-11 y13-14, slab cap y15
for (let y = 13; y <= 15; y++) for (const x of [9, 12]) for (const z of [1, 2]) S(x, y, z, SAND);
for (let y = 13; y <= 14; y++) for (const x of [10, 11]) for (const z of [1, 2]) S(x, y, z, "yellow_stained_glass");
for (const x of [10, 11]) for (const z of [1, 2]) S(x, 15, z, B.slab("cut_sandstone", "top"));
// cornice lip under the pylon cap (front face)
cornice(g, { from: [8 + OX, 12 + 0, 0 + OZ], to: [13 + OX, 0 + OZ], material: "smooth_sandstone", profile: "slab", sides: ["north"] });

// ---- 5. marquee: x6..15, z-3..-1, face y4-5, crown y6-7 -----------------------------------------------------
for (let z = -3; z <= -1; z++) for (let x = 6; x <= 15; x++) { S(x, 4, z, z === -3 ? "terracotta" : "smooth_quartz"); }
for (let x = 6; x <= 15; x++) {
  S(x, 4, -3, x % 2 ? "orange_terracotta" : "terracotta");
  let b = WHITE;
  if (x === 6 || x === 15) b = "terracotta";
  else if (x === 9 || x === 12) b = "glowstone";
  else if (x === 10 || x === 11) b = "warped_planks";
  S(x, 5, -3, b);
  S(x, 5, -2, WHITE); S(x, 5, -1, WHITE);
}
// teal diamond: prismarine centre jewel on top row, orange jewels
S(10, 4, -3, "prismarine"); S(11, 4, -3, "prismarine"); S(9, 4, -3, "orange_terracotta"); S(12, 4, -3, "orange_terracotta");
S(7, 5, -3, "smooth_quartz"); S(8, 5, -3, "smooth_quartz"); S(13, 5, -3, "smooth_quartz"); S(14, 5, -3, "smooth_quartz");
if (R >= 2) {   // 2-tall white sign panels; confetti only on the side borders and as a thin soffit edge
  for (const x of [7, 8, 13, 14]) S(x, 4, -3, "smooth_quartz");
  for (const x of [6, 15]) for (const y of [4, 5]) S(x, y, -3, (x + y) % 2 ? "orange_terracotta" : "terracotta");
  for (let x = 6; x <= 15; x++) S(x, 3, -3, (x % 3 === 0) ? "orange_terracotta" : (x % 3 === 1 ? "terracotta" : "smooth_quartz"));
}
// supports: door piers at the marquee front and at the wall
for (const x of [8, 13]) for (let y = 1; y <= 3; y++) S(x, y, -3, ["stripped_birch_log", { axis: "y" }]);
// gold crown: stepped 8 -> 4 wide, ramp descending outward (stairs face the wall = high at south)
// (gold has no stairs: step the crown with full blocks)
for (let x = 7; x <= 14; x++) { S(x, 6, -1, GOLD); S(x, 6, -2, GOLD); S(x, 6, -3, GOLD); }
for (let x = 9; x <= 12; x++) { S(x, 7, -1, GOLD); S(x, 7, -2, GOLD); }
for (const x of [6, 15]) S(x, 6, -1, GOLD);

g.save(new URL(`./round-${R}.nbt`, import.meta.url).pathname);
console.log(JSON.stringify({ saved: `round-${R}.nbt`, refused: g.refused?.length ?? 0 }));
