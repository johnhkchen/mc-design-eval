// Art Deco Dance Hall — generator. Usage: node build.mjs [round-1.nbt]   (ROUND=2 → round-2.nbt)
// Front elevation = the trace, cell for cell (left half x0..13 written as a char map, mirrored about x=13).
// Depth is added by rules: pylons/fins/pilasters proud, windows & doorways recessed by exclusion,
// marquee projecting 3 with gold terraces rising back, rear roof dropping in tiers.
import { Grid, B } from "../../../../../minecraft-design/tools/src/build.mjs";
import { setbacks, parapet } from "../../../../../minecraft-design/tools/src/shapes-massing.mjs";

const ROUND = Number(process.env.ROUND || 1);
const OUT = new URL(`./round-${ROUND}.nbt`, import.meta.url).pathname;
const g = new Grid([26, 30, 27]); // x east, y up, z south; front faces north
const CX = 13, Z0 = 3;            // tower axis; front wall plane

// ---- palette (spec MATERIAL MAP, exact ids) --------------------------------------------------------------------
const pane = (c, ns = false) => [`${c}_stained_glass_pane`, ns ? { north: "true", south: "true" } : { east: "true", west: "true" }];
const BLK = {
  Q: "smooth_quartz", s: "cut_sandstone", S: "smooth_sandstone", C: "chiseled_sandstone", B: "blue_concrete",
  K: "black_concrete", G: "gold_block", b: "smooth_basalt", P: "polished_blackstone", D: "deepslate_tiles",
  h: "honeycomb_block", W: "white_concrete", t: "warped_planks", r: "red_terracotta", e: "waxed_weathered_copper",
};
const PANE = { Y: "yellow", O: "orange", N: "brown", U: "blue" };
const flip = (f) => (f === "east" ? "west" : f === "west" ? "east" : f);
function blockOf(c, mirrored = false) {
  if (BLK[c]) return [BLK[c], {}];
  if (c === "q") return B.slab("smooth_quartz");
  if (c === "v") return B.stairs("cut_sandstone", mirrored ? "west" : "east"); // shoulder stair rising toward the tower
  if (c === "l") return B.stairs("cut_sandstone", mirrored ? "east" : "west", "bottom"); // notch around the sunburst
  if (c === "j") return B.stairs("cut_sandstone", mirrored ? "west" : "east", "bottom");
  return null;
}
const put = (x, y, z, b) => { const [n, s] = Array.isArray(b) ? b : [b]; g.set(x, y, z, n, s); };

// ---- front elevation: x0..x13, top row = y29 (the trace; recoloured onto the spec's blocks) --------------------
const ROWS = {
  29: ".............s",
  28: "............sS",
  27: "............sN",
  26: "...........sNG",
  25: "...........sQG",
  24: "...........sQG",
  23: "...........sQG",
  22: ".........BqsQG",
  21: ".........BSQQG",
  20: "........BBSQQG",
  19: ".......sBBSQGG",
  18: "......vKBBSGGG",
  17: ".....vKKBBSQsr",
  16: "...sBBBBBBSQUU",
  15: ".qKKSSSKBBSQUU",
  14: ".ssSsGSQBBSQNN",
  13: ".CQslsjsBBSQNU",
  12: ".CCQsQsQBBSQNN",
  11: ".CCQQUQQBBSQUU",
  10: ".CCQQUQQBBSQQG",
  9: ".CCQQYQQBBSGGG",
  8: ".CCQQOQQBBGGeG",
  7: ".CCQQNQQhhGGrt",
  6: ".CCQQUQQhtWWGt",
  5: ".CCQQsQQhhWWWt",
  4: ".CCQsssQGGGGGG",
  3: ".CCssDsssbbbbb",
  2: ".CCsPDPssbbKKs",
  1: ".CCBPDPBsPKkks",
  0: ".bsKKKKKssKkks",
};
const cellAt = (x, y) => { // full-width lookup with mirroring
  const row = ROWS[y]; if (!row) return [".", false];
  return x <= CX ? [row[x], false] : [row[2 * CX - x], true];
};

// window / doorway recesses: cells excluded at the front plane, glazing one block back
const slit = (x, y) => (x === 5 || x === 21) && y >= 6 && y <= 11;
const centralWin = (x, y) => x >= 12 && x <= 14 && y >= 11 && y <= 16;
const doorway = (x, y) => (x >= 4 && x <= 6 || x >= 20 && x <= 22) && (y === 1 || y === 2 || (y === 3 && (x === 5 || x === 21)));
const WIN = { // central window: blue cross mullion, warm quadrants, navy head and sill
  16: ["U", "U", "U"], 15: ["U", "U", "U"], 14: ["Y", "U", "O"], 13: ["U", "U", "U"], 12: ["N", "U", "Y"], 11: ["U", "U", "U"],
};

// ---- 1. massing --------------------------------------------------------------------------------------------------
// main body: four roof tiers dropping toward the rear (deck y15, 14, 13, 12), hollow quartz shells
const TIERS = [{ z0: 3, z1: 9, deck: 15 }, { z0: 10, z1: 15, deck: 14 }, { z0: 16, z1: 21, deck: 13 }, { z0: 22, z1: 26, deck: 12 }];
const deckAt = (z) => TIERS.find((t) => z >= t.z0 && z <= t.z1).deck;
for (const t of TIERS) {
  for (let x = 2; x <= 24; x++) for (let z = t.z0; z <= t.z1; z++) for (let y = 0; y <= t.deck; y++) {
    const edge = x === 2 || x === 24 || z === t.z0 || z === t.z1 || y === 0 || y === t.deck;
    if (edge) put(x, y, z, "smooth_quartz");
  }
}
// rear and side wall bands: sandstone cornice course under each deck edge, blue riser line on the first step
TIERS.forEach((t, i) => {
  for (let x = 2; x <= 24; x++) for (let z = t.z0; z <= t.z1; z++) {
    const rim = x === 2 || x === 24 || z === t.z1;
    put(x, t.deck, z, rim ? (z === t.z1 && i === 0 ? "blue_concrete" : i === 1 ? "smooth_quartz" : "cut_sandstone") : "smooth_sandstone");
  }
});
// tower body (x8..18, y16..21) 8 deep, then the spire stepped on top (setbacks brush, front flush)
for (let x = 8; x <= 18; x++) for (let y = 16; y <= 21; y++) for (let z = Z0; z <= 10; z++) put(x, y, z, "smooth_quartz");
setbacks(g, { base: [11, 22, 3], footprint: [5, 6], align: "front", hollow: false, tiers: [
  { height: 5, block: "smooth_quartz" }, { height: 2, inset: 1, block: "smooth_quartz" }, { height: 1, inset: 1, block: "smooth_quartz" },
] });
// shoulders: thin buttress mass (x3..7 / 19..23, y16..18) 4 deep behind the lintel and stair edge
for (const [xa, xb] of [[3, 7], [19, 23]]) for (let x = xa; x <= xb; x++) for (let z = Z0; z <= 6; z++) put(x, 16, z, x >= 3 && x <= 7 || x >= 19 ? "cut_sandstone" : "smooth_quartz");
for (const [xa, xb, dir] of [[5, 7, 1], [19, 21, -1]]) for (let x = xa; x <= xb; x++) for (let y = 17; y <= 18; y++) for (let z = Z0; z <= 6; z++) {
  const inside = dir > 0 ? x - 5 + 17 >= y + 0 && (y === 17 || x === 7) : (21 - x) + 17 >= y && (y === 17 || x === 19);
  if (inside) put(x, y, z, "black_concrete");
}
// wing parapet ring behind the front row (y16)
parapet(g, { from: [3, 16, 3], to: [7, 9], block: "cut_sandstone", style: "solid" });
parapet(g, { from: [19, 16, 3], to: [23, 9], block: "cut_sandstone", style: "solid" });

// ---- 2. the front elevation, plane by plane -----------------------------------------------------------------------
const frontZ = (x, y, c) => {
  if (x === 1 || x === 25) return 1;                         // outer pylon column: 2 proud
  if (x === 2 || x === 24) return 2;                         // pylon: 1 proud
  if (c === "B" && (x === 8 || x === 18) && y >= 8) return 2; // outer fin
  if (c === "B" && (x === 9 || x === 17) && y >= 8) return 1; // inner fin, further proud
  if ((x === 10 || x === 16) && y >= 9) return 2;            // cream pilasters
  return Z0;
};
for (let y = 29; y >= 0; y--) for (let x = 0; x <= 25; x++) {
  let [c, m] = cellAt(x, y);
  if (c === ".") continue;
  if (x === 0) continue;
  const marq = x >= 8 && x <= 18 && y >= 4 && (y <= 7 || (y === 8 && x >= 10 && x <= 16));
  if (marq) { // marquee area: z3 plane is plain wall; the face is built at z0 below
    put(x, y, Z0, "smooth_quartz"); continue;
  }
  if (x >= 10 && x <= 16 && y === 9) c = "Q"; // crown steps are built forward; wall stays quartz
  const win = slit(x, y) ? "slit" : centralWin(x, y) ? "win" : doorway(x, y) ? "door" : null;
  if (ROUND >= 2 && win) g.set(x, y, Z0, "air"); // recess by exclusion: clear the front-plane cell so the glazing one block back shows
  if (win === "slit") { put(x, y, Z0 + 1, pane(PANE[c] ?? "yellow")); put(x, y, Z0 + 2, "smooth_quartz"); continue; }
  if (win === "win") { put(x, y, Z0 + 1, pane(PANE[WIN[y][x - 12]])); put(x, y, Z0 + 2, "smooth_quartz"); continue; }
  if (win === "door") { put(x, y, Z0 + 1, blockOf(c, m)); continue; }
  if (c === "k") { // dark_oak door leaf: lower at y0, upper at y1
    put(x, y, Z0, B.door("dark_oak", "north", y === 0 ? "lower" : "upper", x % 2 ? "left" : "right")); continue;
  }
  if ("YONU".includes(c)) { if (ROUND >= 2) g.set(x, y, Z0, "air"); put(x, y, Z0 + 1, pane(PANE[c])); put(x, y, Z0 + 2, "smooth_quartz"); continue; } // spire slits
  const b = blockOf(c, m); if (!b) continue;
  const fz = frontZ(x, y, c);
  const single = c === "v" || c === "l" || c === "j";
  for (let z = fz; z <= (single ? fz : Z0 + 2); z++) put(x, y, z, b);
}
// the central doors need their transom + the entrance post depth: porch floor
for (let x = 10; x <= 16; x++) for (let z = 0; z <= 2; z++) put(x, 0, z, "smooth_sandstone");

// ---- 3. marquee: projects 3 (z0..2), face at z0, gold terraces rising back toward the wall ------------------------
for (let x = 8; x <= 18; x++) for (let y = 4; y <= 7; y++) for (let z = 0; z <= 2; z++) {
  const edge = x === 8 || x === 18;
  put(x, y, z, y === 4 ? "gold_block" : edge ? "honeycomb_block" : "white_concrete");
}
for (let y = 4; y <= 8; y++) for (let x = 8; x <= 18; x++) {
  const [c, m] = cellAt(x, y);
  if (c !== ".") put(x, y, 0, blockOf(c, m));
}
put(17, 6, 0, "honeycomb_block"); put(17, 5, 0, "warped_planks"); put(9, 5, 0, "honeycomb_block"); // trace asymmetry kept
// terraces: z0 tops at y8, z1 at y9, z2 at y10 (peak) — a sloped gold crown
for (let x = 10; x <= 16; x++) for (const z of [1, 2]) put(x, 8, z, "gold_block");
for (let x = 11; x <= 15; x++) for (const z of [1, 2]) put(x, 9, z, "gold_block");
put(13, 10, 2, "gold_block");
// entrance pillars (x8-9, x17-18) under the marquee: cream, dark footing; the trace's columns carried forward 3
for (const x of [8, 9, 17, 18]) for (let y = 0; y <= 3; y++) for (let z = 0; z <= 2; z++) {
  const [c, m] = cellAt(x, y); put(x, y, z, blockOf(c, m));
}
// flanking jambs
for (const x of [10, 16]) for (let y = 0; y <= 3; y++) { const [c, m] = cellAt(x, y); put(x, y, 2, blockOf(c, m)); }

// ---- 4. side walls: buttress piers every 6, slit windows --------------------------------------------------------------
for (const z of [8, 14, 20, 25]) for (const dz of [0, 1]) {
  const zz = Math.min(26, z + dz), top = deckAt(zz) - 2;
  for (const x of [1, 25]) {
    for (let y = 0; y <= top; y++) put(x, y, zz, "chiseled_sandstone");
    put(x, top + 1, zz, B.slab("cut_sandstone"));
  }
}
for (const z of [6, 12, 18, 23]) {
  const d = deckAt(z), y0 = z === 6 ? 11 : 10;
  for (const x of [2, 24]) { put(x, y0, z, pane("yellow", true)); put(x, y0 + 1, z, pane("blue", true)); }
}

if (ROUND >= 2) {
  // side/rear walls: black base course, navy band under the deck cornice, sandstone sill band, stair-lip cornice on the decks
  for (const t of TIERS) for (let z = t.z0; z <= t.z1; z++) for (const x of [2, 24]) {
    put(x, 0, z, "black_concrete");
    put(x, t.deck - 1, z, "blue_concrete");
    put(x, 4, z, "cut_sandstone");
  }
  for (let x = 2; x <= 24; x++) { put(x, 0, 26, "black_concrete"); put(x, 11, 26, "blue_concrete"); put(x, 4, 26, "cut_sandstone"); }
  for (const t of TIERS) for (let z = t.z0; z <= t.z1; z++) for (const [x, f] of [[3, "east"], [23, "west"]]) {
    if (z > 3) put(x, t.deck + 1, z, B.slab("cut_sandstone")); // low parapet lip along both deck edges
  }
  // tier risers (facing the rear): quartz stair lip stepping down
  TIERS.slice(0, 3).forEach((t) => { for (let x = 3; x <= 23; x++) put(x, t.deck + 1, t.z1, B.slab("smooth_quartz")); });
  // tower sides: blue fin continues down the flank, quartz pilaster band
  for (const x of [8, 18]) for (let y = 16; y <= 20; y++) for (const z of [Z0 + 3, Z0 + 4]) put(x === 8 ? 7 : 19, y, z, "blue_concrete");
}

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused?.length ?? 0 }));
