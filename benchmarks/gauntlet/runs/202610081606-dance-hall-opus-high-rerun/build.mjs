// Art Deco dance hall — generator. Usage: node build.mjs [1|2]  (round number; round 2 adds the fixes)
import { Grid, B, setbacks, fins, parapet, arch } from "../../../../../minecraft-design/tools/src/build.mjs";

const ROUND = Number(process.argv[2] ?? 1);
const R2 = ROUND >= 2;
const HERE = new URL(".", import.meta.url).pathname;

// Spec coords: x 0..21 along the street, y 0..15, z 0 = front plane (north), marquee to z-3, side pilasters at x-1/x22.
const OX = 1, OZ = 3;
const g = new Grid([24, 16, 24], { dataVersion: 5023 });
const P = (X, Z) => [X + OX, Z + OZ];
const s = (X, Y, Z, b, st) => { const [x, z] = P(X, Z); g.set(x, Y, z, ...(Array.isArray(b) ? b : [b, st ?? {}])); };
const f = (X0, Y0, Z0, X1, Y1, Z1, b) => {
  for (let x = Math.min(X0, X1); x <= Math.max(X0, X1); x++)
    for (let y = Math.min(Y0, Y1); y <= Math.max(Y0, Y1); y++)
      for (let z = Math.min(Z0, Z1); z <= Math.max(Z0, Z1); z++) s(x, y, z, b);
};
const AIR = "air";
const flip = (b) => {
  if (!Array.isArray(b) || !b[1]?.facing) return b;
  const m = { east: "west", west: "east" };
  return [b[0], { ...b[1], facing: m[b[1].facing] ?? b[1].facing }];
};
// symmetric pair about the centre line x = 10.5
const sym = (X, Y, Z, b) => { s(X, Y, Z, b); s(21 - X, Y, Z, flip(b)); };
const symf = (X0, Y0, Z0, X1, Y1, Z1, b) => { f(X0, Y0, Z0, X1, Y1, Z1, b); f(21 - X0, Y0, Z0, 21 - X1, Y1, Z1, b); };

// palette by role (spec MATERIAL MAP)
const M = {
  cream: "cut_sandstone", chis: "chiseled_sandstone", smooth: "smooth_sandstone", white: "white_concrete",
  navy: "blue_concrete", black: "black_concrete", gold: "gold_block", quartz: "smooth_quartz",
  lamp: "glowstone", jewel: "sea_lantern", confetti: "terracotta", confetti2: "orange_terracotta",
  teal: "warped_planks", teal2: "prismarine", door: "dark_oak", pier: "stripped_birch_log",
};
const GLASS = ["yellow_stained_glass", "orange_stained_glass", "light_blue_stained_glass", "blue_stained_glass"];

// ---------------------------------------------------------------- 1. FORM
// Rear hall: stepped terraces descending to the rear and sides (y8 at z4 -> y5 at z19).
let hall;
if (!R2) {
  hall = setbacks(g, {
    base: [0 + OX, 0, 4 + OZ], footprint: [22, 16], align: "front", front: "north",
    tiers: [
      { height: 6, block: M.white, cornice: { block: "blue_concrete_stairs" }, coping: { block: "smooth_sandstone_slab" } },
      { height: 1, inset: 2, block: M.smooth, coping: { block: "smooth_sandstone_slab" } },
      { height: 1, inset: 2, block: M.white, coping: { block: "smooth_sandstone_slab" } },
      { height: 1, inset: 2, block: M.smooth },
    ],
  });
} else {
  // R2: three front-parallel terraces stepping DOWN to the rear (tops y8 / y6 / y4, rear coping y5); each =
  // white body, navy line under a sand deck (navy cornice at y7 on the front terrace); 2-high risers read
  // as steps. One setbacks call per terrace.
  hall = { tiers: [] };
  for (const [z0, z1, top] of [[4, 8, 8], [9, 13, 6], [14, 19, 4]]) {
    const r = setbacks(g, {
      base: [0 + OX, 0, z0 + OZ], footprint: [22, z1 - z0 + 1], align: "front", front: "north",
      tiers: [
        { height: top - 1, block: M.white },
        { height: 1, block: M.navy },
        { height: 1, block: M.smooth, ...(top === 4 ? { coping: { block: "smooth_sandstone_slab" } } : {}) },
      ],
    });
    hall.tiers.push(...r.tiers);
  }
}

// Front block z0..3: wings to y7 + parapet at y8; hollow inside.
f(0, 0, 0, 21, 7, 3, M.white);
f(1, 1, 1, 20, 6, 3, AIR);
f(0, 0, 0, 21, 0, 3, M.navy); // plinth course

// Central pylon x6..15: stepped tower via setbacks (front flush), cap at y12.
setbacks(g, {
  base: [6 + OX, 8, 0 + OZ], footprint: [10, 4], align: "front", front: "north",
  tiers: [
    { height: 4, block: M.white },                                    // y8..11
    { height: 1, inset: 1, block: M.cream, coping: { block: "cut_sandstone_slab" } }, // y12 cap (x7..14)
  ],
});

// Spire: open arch x9..12, legs x9/x12, y13..14, yellow glass in the opening, 2-wide slab cap at y15.
arch(g, { at: [9 + OX, 13, 1 + OZ], width: 4, height: 2, depth: 2, axis: "x", profile: "round", block: M.cream, carve: false });
f(10, 13, 1, 11, 14, 2, "yellow_stained_glass");
f(10, 15, 1, 11, 15, 2, ["cut_sandstone_slab", { type: "bottom", waterlogged: "false" }]);

// Wing parapets (flat, y8) — brush.
if (!R2) for (const [a, b] of [[0, 5], [16, 21]])
  parapet(g, { from: [a + OX, 8, 0 + OZ], to: [b + OX, 3 + OZ], block: M.smooth, style: "solid" });
if (R2) for (const [a, b] of [[0, 5], [16, 21]])  // flat wing parapet, sides + rear only (front gets the crest)
  parapet(g, { from: [a + OX, 8, 0 + OZ], to: [b + OX, 3 + OZ], block: M.smooth, style: "solid", sides: ["south"] });

// ---------------------------------------------------------------- 2. STRUCTURE & DEPTH
// Fins (1 proud): navy x6/x15 to y11, sand x7/x14 to y12.
fins(g, { face: "north", plane: 0 + OZ, from: 6 + OX, to: 15 + OX, every: 9, y0: 1, y1: 11, depth: 1, block: M.navy });
fins(g, { face: "north", plane: 0 + OZ, from: 7 + OX, to: 14 + OX, every: 7, y0: 1, y1: 12, depth: 1, block: M.cream,
  cap: { block: "cut_sandstone_slab" } });

// End piers x0..1 (+ mirror): 1 proud, cream with chiseled faces, stepped cap at y8.
function endPier() {
  symf(0, 0, -1, 1, 7, 0, M.cream);
  for (let y = 2; y <= 6; y += 2) sym(1, y, -1, M.chis);
  sym(0, 8, -1, M.cream); sym(0, 8, 0, M.cream); sym(1, 8, -1, M.cream);
  sym(0, 9, -1, ["cut_sandstone_slab", { type: "bottom", waterlogged: "false" }]);
  sym(0, 0, -1, M.black);
}
endPier();

// Side bay x2..5 (+ mirror)
function sideBay() {
  symf(2, 1, 0, 5, 7, 0, M.white);
  sym(2, 0, 0, M.navy); sym(3, 0, 0, M.navy); sym(4, 0, 0, M.navy); sym(5, 0, 0, M.navy);
  // lower window: black glass y1..2, recessed z1, framed black + navy
  symf(3, 1, 0, 4, 2, 0, AIR); symf(3, 1, 1, 4, 2, 1, "black_stained_glass");
  sym(2, 1, 0, M.black); sym(2, 2, 0, M.black); sym(5, 1, 0, M.black); sym(5, 2, 0, M.black);
  // tall stained window y3..6, recessed z1
  symf(3, 3, 0, 4, 6, 0, AIR);
  for (let y = 3; y <= 6; y++) { sym(3, y, 1, GLASS[(y - 3) % 4]); sym(4, y, 1, GLASS[(y - 1) % 4]); }
  sym(2, 3, 0, M.navy); sym(5, 3, 0, M.navy); // navy sill-line trim
  // gold rosette 2x1 at y7
  sym(3, 7, 0, M.gold); sym(4, 7, 0, M.gold);
  // zig-zag crest (navy + black stairs) rising toward the pylon
  if (!R2) {
    sym(2, 8, 0, B.stairs("black_concrete", "east"));
    sym(3, 8, 0, M.navy); sym(4, 8, 0, M.navy);
    sym(4, 9, 0, B.stairs("black_concrete", "east"));
    sym(5, 8, 0, M.navy); sym(5, 9, 0, M.navy); sym(5, 10, 0, B.stairs("blue_concrete", "east"));
  } else {
    // stepped shoulder: each column one higher toward the pylon, solid through the wing depth z0..3,
    // stair noses on each step (black at the outer end, navy inward), sand edge on the sides.
    const top = { 2: 8, 3: 8, 4: 9, 5: 10 };
    for (const X of [2, 3, 4, 5]) for (let Z = 0; Z <= 3; Z++) {
      for (let y = 8; y < top[X]; y++) sym(X, y, Z, M.navy);
      sym(X, top[X], Z, X === 2 ? M.black : M.navy);
      sym(X, top[X] + 1, Z, B.stairs(X <= 3 ? "black_concrete" : "blue_concrete", "east"));
    }
    for (let Z = 0; Z <= 3; Z++) { sym(1, 8, Z, M.smooth); sym(0, 8, Z, M.smooth); }
  }
}
sideBay();

// Central bay ground: black plinth under doors, door piers, recessed doors, lintel.
f(6, 0, 0, 15, 0, 0, M.black);
f(7, 1, 0, 14, 3, 0, M.white);
f(9, 1, 0, 12, 2, 0, AIR);
for (const X of [8, 13]) for (let y = 1; y <= 3; y++) s(X, y, 0, B.log("stripped_birch"));
f(9, 3, 0, 12, 3, 0, M.chis);
f(9, 0, 1, 12, 0, 1, M.black);
const doorCols = [[9, "left"], [10, "right"], [11, "left"], [12, "right"]];
for (const [X, hinge] of doorCols) {
  s(X, 1, 1, B.door(M.door, "north", "lower", hinge));
  s(X, 2, 1, B.door(M.door, "north", "upper", hinge));
}

// Pylon face y4..11: white field x8/x13, window x9..12 y7..10 recessed z1, sunburst y11.
f(8, 4, 0, 13, 11, 0, M.white);
f(9, 7, 0, 12, 10, 0, AIR);
for (let y = 7; y <= 10; y++) for (let X = 9; X <= 12; X++) {
  const q = (X <= 10 ? 0 : 1) + (y >= 9 ? 0 : 2); // 2x2 checker of quadrants
  s(X, y, 1, GLASS[q]);
}
f(9, 11, 0, 12, 11, 0, M.gold);
f(10, 12, 0, 11, 12, 0, M.gold);

// ---------------------------------------------------------------- 3. MARQUEE (projects z-3..-1)
function marquee() {
  // soffit + body
  f(6, 3, -3, 15, 3, -1, M.quartz);
  f(6, 4, -2, 15, 5, -1, M.white);
  // face z-3: confetti borders, sign panels, teal diamond + jewels
  for (let X = 6; X <= 15; X++) s(X, 3, -3, X % 2 ? M.confetti2 : M.confetti);
  for (const X of [6, 15]) { s(X, 4, -3, M.confetti2); s(X, 5, -3, M.confetti); }
  for (const X of [7, 8, 13, 14]) { s(X, 4, -3, M.quartz); s(X, 5, -3, M.white); }
  s(9, 4, -3, M.lamp); s(12, 4, -3, M.lamp); s(9, 5, -3, M.confetti2); s(12, 5, -3, M.confetti2);
  s(10, 4, -3, M.teal2); s(11, 4, -3, M.teal2); s(10, 5, -3, M.teal); s(11, 5, -3, M.teal);
  // gold crown: stepped ramp rising toward the building, 8 wide -> 4 wide
  f(7, 6, -3, 14, 6, -1, M.gold);
  f(9, 7, -2, 12, 7, -1, M.gold);
  // supports: door piers carried forward as posts
  for (const X of [8, 13]) for (let y = 1; y <= 2; y++) s(X, y, -3, B.log("stripped_birch"));
}
marquee();

// ---------------------------------------------------------------- 4. SIDE WALLS (z4..19): pilasters + slits
for (const side of [-1, 22]) {
  const wallX = side < 0 ? 0 : 21;
  for (let Z = 4; Z <= 19; Z++) {
    const pil = [4, 5, 9, 10, 14, 15, 18, 19].includes(Z);
    const wallTop = !R2 ? 5 : Z <= 8 ? 8 : Z <= 13 ? 6 : 4;
    if (pil) for (let y = 0; y <= wallTop; y++) s(side, y, Z, y === wallTop ? M.smooth : M.cream);
    else if ((Z === 7 || Z === 12 || Z === 16)) for (let y = (R2 && Z > 13 ? 2 : 3); y <= (R2 ? Math.min(5, wallTop - 2) : 4); y++) s(wallX, y, Z, "light_blue_stained_glass");
  }
  for (let Z = 4; Z <= 19; Z++) s(wallX, 0, Z, M.navy);
}

g.save(`${HERE}round-${ROUND}.nbt`);
console.log(JSON.stringify({ saved: `round-${ROUND}.nbt`, hallTiers: hall.tiers, refused: g.refused?.length ?? 0 }));
