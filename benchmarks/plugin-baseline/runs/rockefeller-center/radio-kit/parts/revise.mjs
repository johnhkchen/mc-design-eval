// Revision v2 (the person's comment, comment-v2.txt), run AFTER runParts so it may rebuild what the parts placed:
// 1. a bolder, brighter marquee 3 deep (x0..2 west, z51..53 south), plot 1's run carried the full 50th St face to x100;
// 2. a 3-thick blade x0..4 z51..53 with 3-tall red concrete letters on blue, edged in sea lanterns, and a lit crown;
// 3. the three plot 1 roundels recoloured as concentric terracotta rings; 4. more lit skylight strips on the hall roofs.
import { carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const name = (g, x, y, z) => (g.blockAt(x, y, z) || "air").replace("minecraft:", "");

// One marquee column: cells [d0 outer, d1 front, d2 back] at y6..10; i = position along the run (for alternation).
// y10 top light line, y8..9 red neon (red stained glass over shroomlight, red concrete board behind the banner
// letters at y8), y7 blue neon (blue stained glass over sea lantern), y6 the lit soffit. The outer row d0 leaves
// y7..8 for the banner letters hung on the board.
function column(g, cells, i, { rods = true } = {}) {
  const [d0, d1, d2] = cells;
  const at = (c, y, b, s) => c && g.set(c[0], y, c[1], b, s);
  if (d0) {
    at(d0, 10, "sea_lantern");
    at(d0, 9, "red_stained_glass");
    at(d0, 6, i % 2 ? "glowstone" : "sea_lantern");
    if (rods && i % 2 === 0) at(d0, 11, "end_rod", { facing: "up" });
  }
  at(d1, 10, "glowstone"); at(d1, 9, "shroomlight"); at(d1, 8, "red_concrete");
  at(d1, 7, "blue_stained_glass"); at(d1, 6, "sea_lantern");
  at(d2, 10, i % 2 ? "glowstone" : "sea_lantern"); at(d2, 9, "shroomlight"); at(d2, 8, "light_gray_concrete");
  at(d2, 7, "sea_lantern"); at(d2, 6, "sea_lantern");
}

function cheek(g, x, z) { for (let y = 6; y <= 10; y++) g.set(x, y, z, "iron_block"); }

function marquee(g) {
  const blade = (x, z) => x <= 4 && z >= 51;
  // Plot 0, Sixth Ave: x0 outer, x1 front, x2 back, z5..52 (z51..52 the corner's west half).
  for (let z = 5; z <= 52; z++) column(g, [[0, z], [1, z], [2, z]], z, { rods: !blade(0, z) });
  // The corner: x0 z53 stays air (the round); x1..2 z53 are outer cells of the south run.
  // Plot 0, 50th St: z53 outer, z52 front, z51 back, x1..26 (x1..2 already have their front/back from the west run).
  for (let x = 1; x <= 26; x++) column(g, [[x, 53], x >= 3 ? [x, 52] : null, x >= 3 ? [x, 51] : null], x, { rods: !blade(x, 53) });
  cheek(g, 0, 4); cheek(g, 1, 4); cheek(g, 2, 4);
  for (const z of [51, 52, 53]) cheek(g, 27, z);
  // Plot 1, 50th St: x41..99, over the stage door too (it replaces the small canopy), cheeks at x40 and x100.
  for (let x = 41; x <= 99; x++) column(g, [[x, 53], [x, 52], [x, 51]], x);
  for (const z of [51, 52, 53]) { cheek(g, 40, z); cheek(g, 100, z); }
  // The stage-door canopy's slab and lanterns at z50 under the new marquee: clear them so the run's soffit shows.
  for (let x = 87; x <= 99; x++) for (const y of [6, 7]) if (name(g, x, y, 50) !== "air") carve(g, [x, y, 50], [x, y, 50]);
}

// 3 x 3 glyphs, top row first; column 0 is the viewer's left (west) on the south face.
const GLYPH = {
  R: ["###", "##.", "#.#"], A: [".#.", "###", "#.#"], D: ["##.", "#.#", "##."], I: ["###", ".#.", "###"],
  O: ["###", "#.#", "###"], C: ["###", "#..", "###"], T: ["###", ".#.", ".#."], Y: ["#.#", ".#.", ".#."],
};

function bladeSign(g) {
  const Y0 = 11, TOP = 48;             // body rows y11..48 (the letters need 3 rows each and a row between)
  carve(g, [0, Y0, 51], [4, 40, 53]);  // the old 2-thick blade, its banners and cap
  for (let y = Y0; y <= TOP; y++) for (let x = 0; x <= 4; x++) for (let z = 51; z <= 53; z++) {
    const edge = x === 0 || x === 4 || y === Y0 || y === TOP;
    g.set(x, y, z, edge ? "sea_lantern" : "blue_concrete");
  }
  // Letters on the south face z53, top down, red concrete on blue, each pixel backed by shroomlight in z52.
  let y = TOP - 1;
  for (const ch of "RADIO CITY") {
    if (ch === " ") { y -= 1; continue; }
    GLYPH[ch].forEach((row, r) => [...row].forEach((c, k) => {
      if (c === "#") { g.set(1 + k, y - r, 53, "red_concrete"); g.set(1 + k, y - r, 52, "shroomlight"); }
    }));
    y -= 4;
  }
  // The lit crown: an iron step with sea lanterns, a lantern block and an end rod on top.
  for (let x = 1; x <= 3; x++) for (let z = 51; z <= 53; z++) g.set(x, TOP + 1, z, (x === 2 || z === 52) ? "sea_lantern" : "iron_block");
  g.set(2, TOP + 2, 52, "sea_lantern");
  g.set(2, TOP + 3, 52, "end_rod", { facing: "up" });
  for (const [x, z] of [[0, 51], [4, 51], [0, 53], [4, 53]]) g.set(x, TOP + 1, z, "end_rod", { facing: "up" });
}

// Plot 1 roundels, radius 4 at z51 inside the copper rims (the shell's limestone had refused the discs): rings, outer to centre, each roundel its own order.
function roundels(g) {
  const sets = [
    [52, ["orange", "yellow", "light_blue", "white"]],
    [70, ["light_blue", "orange", "yellow", "white"]],
    [88, ["yellow", "light_blue", "orange", "white"]],
  ];
  for (const [cx, rings] of sets) for (let dx = -4; dx <= 4; dx++) for (let dy = -4; dy <= 4; dy++) {
    const x = cx + dx, y = 17 + dy;
    const d = Math.hypot(dx, dy);
    if (d > 4.3) continue;
    const k = d > 3.2 ? 0 : d > 2.2 ? 1 : d > 1.2 ? 2 : 3;
    g.set(x, y, 51, `${rings[k]}_terracotta`);
  }
}

// A low skylight strip on a deck: glowstone in the deck, clear glass one above it. Only deck cells change
// (gray/light gray concrete); lanterns, vents and the parapet are left.
function skylight(g, x0, x1, z0, z1, y) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const b = name(g, x, y, z);
    if (b !== "gray_concrete" && b !== "light_gray_concrete") continue;
    if (name(g, x, y + 1, z) !== "air") continue;
    g.set(x, y, z, "glowstone"); g.set(x, y + 1, z, "glass");
  }
}

function hallRoofs(g) {
  // H-C hall deck y31: the three strips carried west and east, and a fourth along the south side.
  for (const z of [22, 30, 38]) { skylight(g, 42, 48, z, z + 1, 31); skylight(g, 76, 86, z, z + 1, 31); }
  skylight(g, 42, 86, 47, 47, 31);
  skylight(g, 42, 86, 16, 16, 31);
  // H-B north band decks (y32 west, y33 east) and H-A's 51st St strip (y24).
  skylight(g, 42, 62, 8, 9, 32); skylight(g, 68, 98, 8, 9, 33);
  skylight(g, 44, 80, 1, 2, 24);
  // H-D stage house deck y33.
  skylight(g, 89, 90, 18, 37, 33); skylight(g, 95, 96, 18, 37, 33);
}

export function revise(g) {
  marquee(g);
  bladeSign(g);
  roundels(g);
  hallRoofs(g);
}
