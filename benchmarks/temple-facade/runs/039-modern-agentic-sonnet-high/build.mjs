// Triumphal-arch FACADE, faces south (+z). x width 56, y height 48, z depth 24 (front relief at high z).
// Design one half (x 0..27), mirror across x = 27.5. Palette: teal (oxidized copper) / orange (red sandstone) /
// yellow terracotta / cream sandstone.
import { Grid, mirrorX, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = process.argv[2] ?? "facade.nbt";
const g = new Grid([56, 48, 24]);
const W = 56, CX = 28; // opening centre line (cell-edge coords)

// ---- palette by role
const ORG = "red_sandstone", ORG2 = "cut_red_sandstone", ORGS = "smooth_red_sandstone";
const TEAL = "oxidized_cut_copper", TEAL2 = "oxidized_copper", TEALD = "warped_planks";
const YEL = "yellow_terracotta", GOLD = "honeycomb_block";
const CRM = "end_stone_bricks", CRM2 = "cut_sandstone", CRM3 = "end_stone_bricks";
const stairs = (m, f, half = "bottom") => B.stairs(m, f, half);
const slab = (m, t = "bottom") => B.slab(m, t);

// z layers: core z 6..17 ; wall face z=17 ; proud 18..23
const Z0 = 6, ZF = 17;

// everything is painted into the left half then mirrored
function half(s) {
  const fill = (x0, y0, z0, x1, y1, z1, b, st) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) s(x, y, z, b, st);
  };
  const put = (x, y, z, bs) => s(x, y, z, bs[0], bs[1]);

  // ---------- core body (hidden mass, coloured by zone so the sides read)
  fill(3, 0, Z0, 27, 19, ZF, CRM3);          // pier
  fill(3, 20, Z0, 27, 22, ZF, TEAL2);        // impost band zone
  fill(3, 23, Z0, 27, 32, ZF, YEL);          // yellow zone
  fill(0, 33, Z0, 27, 44, ZF, YEL);          // frieze + attic + cornices (full width)
  fill(0, 45, Z0, 27, 45, 19, ORG);
  fill(0, 46, Z0, 27, 46, 19, TEAL);

  // ---------- plinth & base (y0..6)
  fill(1, 0, 5, 19, 0, 23 - 1, TEAL);        // lower step
  fill(2, 1, 5, 19, 1, 21, TEAL2);           // upper step
  fill(3, 2, 6, 19, 2, 19, ORG);             // orange base moulding
  for (let x = 3; x <= 19; x++) put(x, 2, 20, stairs(ORG, "north")); // stepped lip
  // cream base panel y3..5, checkered panels, proud 1
  for (let x = 3; x <= 19; x++) for (let y = 3; y <= 5; y++) {
    const c = (((x >> 2) + (y >> 1)) & 1) ? CRM : CRM2;
    s(x, y, 18, c);
  }
  // orange ledge y6 + sculpture pedestal
  fill(3, 6, ZF, 19, 6, 19, ORG);
  for (let x = 3; x <= 19; x++) put(x, 6, 20, stairs(ORG, "north", "top"));
  fill(6, 6, 20, 15, 6, 21, ORG);
  fill(6, 7, 19, 15, 7, 21, ORG2);           // pedestal block
  for (let x = 6; x <= 15; x++) put(x, 7, 22, slab(ORG));

  // ---------- pier field y8..19: cream, edge pilaster strips, sculpture
  for (let x = 3; x <= 19; x++) for (let y = 8; y <= 19; y++) {
    const c = (((x >> 2) + (y >> 2)) & 1) ? CRM : CRM3;
    s(x, y, 18, c);
  }
  fill(3, 8, 19, 3, 19, 19, CRM2); fill(19, 8, 19, 19, 19, 19, CRM2); // framing strips
  // sculpture group: ASCII, row 0 = top (y=19), col 0 = x=5
  const SC = [
    "......TT..",
    "..TT.TTTT.",
    ".TTTT.OOT.",
    "..OOTTTOO.",
    ".TTOOOOT..",
    "..OOOTTOOT",
    ".OOO.TOOT.",
    ".TTT.TOTTO",
    ".OO..OTOOO",
    ".OOO.OOOO.",
    "OOOOOOOOOO",
  ];
  SC.forEach((row, r) => {
    const y = 18 - r;
    [...row].forEach((ch, c) => {
      if (ch === ".") return;
      const x = 6 + c;
      if (ch === "T") { fill(x, y, 19, x, y, 20 + (r % 3 === 0 ? 1 : 0), TEAL); }
      else { fill(x, y, 19, x, y, 21 + ((r + c) % 2), ORG); }
    });
  });

  // ---------- impost: teal band y20..21, orange cornice y22
  fill(3, 20, 18, 19, 21, 19, TEAL);
  for (let x = 3; x <= 19; x++) { if (x % 2 === 0) s(x, 20, 20, TEALD); put(x, 21, 20, stairs(TEAL, "north")); }
  fill(2, 22, 18, 20, 22, 20, ORG);
  for (let x = 2; x <= 20; x++) put(x, 22, 21, stairs(ORG, "north", "top"));
  // shadow slab under ledge on the arch side
  // ---------- upper yellow zone: relief panel (teal frame, orange field, relief figures)
  const px0 = 5, px1 = 16, py0 = 24, py1 = 30;
  fill(px0, py0, 18, px1, py1, 19, TEAL);               // frame, proud 2
  fill(px0 + 1, py0 + 1, 18, px1 - 1, py1 - 1, 18, ORG); // recessed field
  fill(px0 + 1, py0 + 1, 19, px1 - 1, py1 - 1, 19, "air");
  for (let x = px0 + 1; x <= px1 - 1; x++) {
    const h = 1 + ((x * 7 + 3) % 4 === 0 ? 3 : (x * 5) % 3 === 0 ? 2 : 3 - (x % 2));
    for (let y = py0 + 1; y < py0 + 1 + Math.min(h, 4); y++) s(x, y, 19, (x + y) % 3 === 0 ? YEL : TEAL2);
    if (x % 3 === 0) s(x, py0 + 1 + Math.min(h, 4) - 1, 20, YEL); // heads
  }
  // frame inner lip
  for (let x = px0; x <= px1; x++) { put(x, py1 + 1 - 1, 20, slab(TEAL, "top")); }
  // thin teal edge pilaster on pier outer edge
  fill(2, 24, 17, 2, 30, 18, TEAL);

  // ---------- arch ring (archivolt): teal inner, orange outer; small teal victories in the haunches
  for (let x = 14; x <= 27; x++) for (let y = 23; y <= 33; y++) {
    const dx = x + 0.5 - CX, dy = y + 0.5 - 23, r = Math.hypot(dx, dy);
    if (r > 8 && r <= 9) fill(x, y, 18, x, y, 20, TEAL);
    else if (r > 9 && r <= 10.6) fill(x, y, 18, x, y, 19, ORG);
  }
  const SP = ["TT..", ".TT.", "..OT"];
  SP.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === ".") return;
    const x = 20 - c, y = 31 - r + (r === 0 ? 0 : 0);
    fill(x, y, 18, x, y, 19, ch === "T" ? TEAL : ORG);
  }));
  // pier-top shoulder block between arch ring and panel
  // ---------- orange course y32, teal sculpted frieze y33..35
  fill(1, 32, 18, 27, 32, 19, ORG);
  for (let x = 1; x <= 27; x++) put(x, 32, 20, slab(ORG, "top"));
  fill(1, 33, 18, 27, 35, 18, TEAL);
  for (let x = 1; x <= 27; x++) {
    s(x, 33, 19, x % 2 ? TEAL2 : TEALD);
    s(x, 34, 19, x % 4 < 2 ? TEAL2 : TEALD);
    s(x, 35, 19, TEAL2);
  }
  // ---------- dentil course y36..37, main projecting cornice y38, teal fillet y39
  fill(0, 36, 18, 27, 36, 18, ORG);
  for (let x = 0; x <= 27; x++) { if (x % 2 === 0) s(x, 36, 19, ORG2); }
  fill(0, 37, 18, 27, 37, 19, ORG);
  for (let x = 0; x <= 27; x++) { if (x % 2 === 1) s(x, 37, 20, ORG2); }
  fill(0, 38, 18, 27, 38, 22, ORG);
  for (let x = 0; x <= 27; x++) put(x, 38, 23, stairs(ORG, "north", "top"));
  fill(0, 39, 18, 27, 39, 22, TEAL);
  for (let x = 0; x <= 27; x++) put(x, 39, 23, slab(TEAL, "top"));
  // ---------- attic y40..44 : orange base, teal pilasters (2 wide, step 4), gold rondels
  fill(1, 40, 18, 27, 40, 20, ORG2);
  for (let x = 1; x <= 27; x++) put(x, 40, 21, slab(ORG, "top"));
  fill(1, 41, 18, 27, 44, 18, ORG);
  for (let k = 0; k <= 6; k++) {
    const x0 = 3 + 4 * k;
    fill(x0, 41, 19, x0 + 1, 44, 20, TEAL);                  // pilaster
    s(x0, 41, 21, TEAL2); s(x0 + 1, 41, 21, TEAL2);          // base
    put(x0, 44, 21, stairs(TEAL, "north", "top")); put(x0 + 1, 44, 21, stairs(TEAL, "north", "top")); // capital
    // rondel 2x2 between pilasters
    if (x0 + 2 <= 27 && x0 + 3 <= 27) { fill(x0 + 2, 42, 19, x0 + 3, 43, 19, GOLD); fill(x0 + 2, 42, 20, x0 + 3, 43, 20, "air"); }
  }
  // ---------- crowning orange cornice y45, teal crenellated parapet y46..47
  fill(1, 45, 18, 27, 45, 19, ORG);
  for (let x = 1; x <= 27; x++) put(x, 45, 20, stairs(ORG, "north", "top"));
  fill(1, 46, 17, 27, 46, 19, TEAL);
  for (let x = 1; x <= 27; x++) if (((x - 1) >> 1) % 2 === 0) fill(x, 47, 17, x, 47, 19, TEAL2);
  fill(18, 47, 14, 27, 47, 16, ORG); // orange crest behind the merlons
}
mirrorX(g, 27.5, half);

// ---------- carve the opening (through the whole depth) : straight to spring y=22, round arch r=8 above
for (let x = 20; x <= 35; x++) for (let y = 0; y <= 31; y++) {
  const dx = x + 0.5 - CX, dy = y + 0.5 - 23;
  const inside = y <= 22 ? true : Math.hypot(dx, dy) <= 8;
  if (inside) for (let z = 0; z < 24; z++) g.unset(x, y, z);
}
// ---------- vault soffit: orange coffer ring with teal ribs, cream passage floor, side wall detailing
for (let x = 18; x <= 37; x++) for (let y = 0; y <= 33; y++) for (let z = Z0; z <= ZF; z++) {
  // cells adjacent to the opening
  const open = (xx, yy) => {
    if (xx < 20 || xx > 35 || yy < 0) return false;
    return yy <= 22 || Math.hypot(xx + 0.5 - CX, yy + 0.5 - 23) <= 8;
  };
  if (open(x, y) || !g.blockAt(x, y, z) || g.blockAt(x, y, z) === "minecraft:air") continue;
  const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => open(x + a, y + b));
  if (!n) continue;
  if (y >= 23) s2(x, y, z, (z % 4 === 0) ? TEAL : ORG);
  else if (y >= 5) s2(x, y, z, (z % 4 === 0 || y === 22) ? TEAL2 : CRM);
}
function s2(x, y, z, b) { g.set(x, y, z, b); }
// passage floor
for (let x = 20; x <= 35; x++) for (let z = Z0; z <= 23; z++) g.set(x, 0, z, (x + z) % 2 ? CRM2 : CRM3);
// keystone
for (const y of [31, 32, 33]) { g.fill([27, y, 18], [28, y, 21], y === 32 ? TEAL : ORG); }
g.set(27, 31, 22, ...stairs(ORG, "north", "top")); g.set(28, 31, 22, ...stairs(ORG, "north", "top"));

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, size: g.size }));
