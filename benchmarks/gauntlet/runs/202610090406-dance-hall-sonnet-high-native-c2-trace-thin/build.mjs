// Art Deco dance hall. Logical coords: x 0..23 (trace columns), y 0..26, d = depth from the wall plane
// (d=0 the facade plane, d<0 proud toward the street, d>0 into the building). Mirror axis between x11 and x12.
import { Grid, B, face } from "../../../../../minecraft-design/tools/src/build.mjs";

const ROUND = process.argv[2] === "2" ? 2 : 1;
const OUT = new URL(`./round-${ROUND}.nbt`, import.meta.url).pathname;

const XO = 1, ZO = 3, DEPTH = 20;
const g = new Grid([26, 28, ZO + DEPTH]);

const pair = (b) => (Array.isArray(b) ? b : [b, undefined]);
const raw = (x, y, d, b) => { const [n, s] = pair(b); g.set(x + XO, y, d + ZO, n, s); };
const mir = (b) => { const [n, s] = pair(b); return [n, s && s.facing ? { ...s, facing: face.mirrorX(s.facing) } : s]; };
/** place at x and its mirror 23-x */
const put = (x, y, d, b) => { raw(x, y, d, b); raw(23 - x, y, d, mir(b)); };
/** place at exactly x (no mirror) */
const one = raw;
const fillX = (x0, x1, y0, y1, d0, d1, b) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let d = d0; d <= d1; d++) raw(x, y, d, b); };
/** mirrored fill: x0..x1 and the mirror image */
const fillM = (x0, x1, y0, y1, d0, d1, b) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let d = d0; d <= d1; d++) put(x, y, d, b); };

const SS = "smooth_sandstone", CS = "cut_sandstone", Q = "smooth_quartz", NB = "nether_bricks", RNB = "red_nether_bricks";
const BLUE = "blue_concrete", BLACK = "black_concrete", BG = "black_stained_glass";
const GOLD = "gold_block";
const slab = (m, t = "bottom") => B.slab(m, t);
const stair = (m, f, h = "bottom") => B.stairs(m, f, h);

// ---------------------------------------------------------------- masses (hollow shells, facade 5 thick)
// wings
for (const [x0, x1] of [[0, 5], [18, 23]]) {
  fillX(x0, x1, 0, 18, 0, DEPTH - 1, SS);
  fillX(x0 + (x0 ? 0 : 1), x1 - (x1 === 23 ? 1 : 0), 1, 18, 5, DEPTH - 2, "air");   // interior
}
// tower body
fillX(6, 17, 0, 20, 0, DEPTH - 1, SS);
fillX(7, 16, 1, 20, 5, DEPTH - 2, "air");

// ---------------------------------------------------------------- tower crown, stepped front and rear
const hTop = (x) => { const m = Math.min(x, 23 - x); return m >= 9 ? 26 : m >= 7 ? 25 : 24; };   // front silhouette (spec)
// slice A: z0..5 up to the silhouette
for (let x = 6; x <= 11; x++) for (let y = 21; y <= hTop(x); y++) for (let d = 0; d <= 5; d++) put(x, y, d, SS);
// slice B: d6..11 to y23, slice C: d12..19 to y20 (already), roof quartz slabs on each tread
for (let x = 6; x <= 11; x++) { for (let d = 6; d <= 11; d++) for (let y = 21; y <= 23; y++) put(x, y, d, SS); }
// treads: quartz slab on top of each step
for (let x = 7; x <= 11; x++) for (let d = 1; d <= 5; d++) put(x, hTop(x), d, slab(Q));          // slab replaces top course
for (let x = 6; x <= 11; x++) for (let d = 6; d <= 11; d++) put(x, 23, d, slab(Q));
for (let x = 6; x <= 11; x++) for (let d = 12; d <= DEPTH - 1; d++) put(x, 20, d, slab(Q));
// parapet ring on the rear tread and rear wall for the stepped look
for (let x = 6; x <= 17; x++) { put(x, 21, DEPTH - 1, SS); }
for (let d = 12; d <= DEPTH - 1; d++) { put(6, 21, d, SS); }

// crown fins at x7,10 (mirrors 16,13): proud 1, rising to y24..26; slits between
for (const x of [7, 10]) for (let y = 21; y <= hTop(x); y++) put(x, y, -1, SS);
put(7, 25, -1, slab(SS, "top")); put(10, 26, -1, slab(SS, "top"));
// slits y22..23 at x8 and x11 (mirror 15, 12): recessed black glass
for (const x of [8, 11]) for (const y of [22, 23]) { put(x, y, 0, "air"); put(x, y, 1, BG); put(x, y, 2, BLUE); }
// stepped crown pediment accent at the very top: small dark slits y25 at x9 (mirror 14)
put(9, 25, 0, "air"); put(9, 25, 1, BG); put(9, 25, 2, BLUE);

// ---------------------------------------------------------------- piers and fins
// tall quartz fins x6 (y1..23, +2) and x1 (y1..17, +1)
for (let y = 1; y <= 23; y++) { put(6, y, -1, Q); put(6, y, -2, Q); }
put(6, 24, -2, slab(Q)); put(6, 24, -1, SS);   // cap
for (let y = 1; y <= 17; y++) put(1, y, -1, Q);
put(1, 18, -1, slab(Q));
// sand piers x9 (mirror x14), proud 1, y4..26
for (let y = 4; y <= 25; y++) put(9, y, -1, SS);
// edge strips x0 (mirror 23): cut_sandstone courses
for (let y = 0; y <= 19; y++) put(0, y, 0, (y === 0 || y % 4 === 3) ? CS : SS);
for (let x = 0; x <= 23; x++) put(x, 0, 0, CS);      // plinth

// ---------------------------------------------------------------- wing glass bays (x2..5, mirrors 21..18)
// base windows y1..2 and tall windows y4..16, sill y3
const wingBay = (y0, y1) => {
  for (let y = y0; y <= y1; y++) {
    for (const x of [2, 3, 4, 5]) {
      put(x, y, 0, "air"); put(x, y, 1, "air");
      let glass;
      if (x === 2 || x === 5) glass = BG;
      else glass = ROUND === 2 ? (y % 4 === 1 ? "red_stained_glass" : "orange_stained_glass") : (y % 2 === 0 ? "orange_stained_glass" : "red_stained_glass");
      put(x, y, 2, glass); put(x, y, 3, BLUE);
    }
  }
};
wingBay(1, 2); wingBay(4, 16);
// sill and lintel at y3 / y17
for (const x of [2, 3, 4, 5]) { put(x, 3, 0, SS); put(x, 3, -1, slab(SS, "top")); }
for (let y of [17]) for (const x of [2, 3, 4, 5]) { put(x, y, 0, "air"); put(x, y, 1, "air"); put(x, y, 2, x === 2 || x === 5 ? BG : BG); put(x, y, 3, BLUE); }

// ---------------------------------------------------------------- sunburst crown on each wing (project 1)
const sun = () => {
  // dark band y19: nether bricks x1,2,5 ; gold centre x3-4 y18..19
  for (const x of [1, 2, 5]) put(x, 19, -1, NB);
  for (const x of [3, 4]) { put(x, 19, -1, GOLD); put(x, 18, -1, GOLD); }
  for (const x of [2, 5]) put(x, 18, -1, BLUE);
  // fan on blue_concrete above: y20 x2..5, y21 x3..4, with gold rays
  for (const x of [2, 3, 4, 5]) put(x, 20, -1, BLUE);
  for (const x of [3, 4]) put(x, 21, -1, BLUE);
  put(2, 20, -1, GOLD); put(5, 20, -1, GOLD);
  put(1, 20, -1, SS); put(6, 20, -1, SS);
  // backing so the crown has mass behind it
  for (const x of [1, 2, 3, 4, 5]) { put(x, 19, 0, NB); put(x, 20, 0, SS); }
  for (const x of [3, 4]) put(x, 21, 0, BLUE);
};
sun();
// wing roof deck (quartz slabs) and stepped sand parapet
for (const x of [0, 1, 2, 3, 4, 5]) for (let d = 1; d <= DEPTH - 1; d++) put(x, 19, d, slab(Q));
for (let d = 1; d <= DEPTH - 1; d++) { put(0, 20, d, SS); put(5, 20, d, d > 6 ? SS : "air"); }
for (let x = 0; x <= 5; x++) put(x, 20, DEPTH - 1, SS);

// ---------------------------------------------------------------- tower windows (depth 2..3)
const tg = (y, kind) => {
  if (kind === "side") return y % 3 === 0 ? "orange_stained_glass" : "red_stained_glass";
  return "red_stained_glass";
};
// side windows x7..8 (mirror 16..15) y7..19 arched
for (let y = 7; y <= 19; y++) for (const x of [7, 8]) {
  if (y === 19 && x === 7) continue;
  put(x, y, 0, "air"); put(x, y, 1, "air"); put(x, y, 2, tg(y, "side")); put(x, y, 3, BLUE);
}
put(7, 19, 0, stair(SS, "west", "top")); // diagonal arch corner (empty lower-east quarter)
// central window x10..13, y7..19: purple/blue verticals, red core, pointed arch
for (let y = 7; y <= 19; y++) for (const x of [10, 11]) {
  const peak = y >= 18 && x === 10;       // narrows to x11..12 at y18-19
  if (peak) continue;
  const gd = ROUND === 2 ? 2 : 3;
  for (let d = 0; d < gd; d++) put(x, y, d, "air");
  const glass = x === 10 ? (y % 2 ? "purple_stained_glass" : "blue_stained_glass") : "red_stained_glass";
  put(x, y, gd, glass); put(x, y, gd + 1, BLUE);
}
put(10, 18, 0, stair(SS, "west", "top"));
// pointed top above y19? y20 wall is solid already.

// ---------------------------------------------------------------- canopy, fascia, marquee, entrance
fillM(7, 11, 3, 3, 0, 0, SS);                                // fascia under canopy
for (let x = 7; x <= 11; x++) { put(x, 4, 0, SS); put(x, 4, -1, slab(SS, "top")); put(x, 4, -2, slab(SS, "top")); put(x, 4, -3, GOLD); put(x, 3, -3, slab("prismarine_brick", "top")); }
// marquee x8..11 (mirror), y5..9, dz 1..2
for (let x = 8; x <= 11; x++) for (let y = 5; y <= 9; y++) for (const d of [-1, -2]) {
  let b = RNB;
  if (y === 5) b = x % 2 ? "glowstone" : "shroomlight";
  else if (y === 6) b = x % 2 ? "shroomlight" : "glowstone";
  else if (y === 7 || y === 8) b = (x >= 9) ? "sea_lantern" : NB;
  else if (y === 9) b = (x >= 9) ? RNB : NB;
  put(x, y, d, b);
}
put(8, 9, -1, NB); put(8, 9, -2, NB);
// peak and diamond crown y9..10 x11..12 / x10,13 at y9
put(11, 10, -1, RNB); put(11, 10, -2, RNB); put(10, 10, -2, slab(RNB));
// entrance: recessed 3 under canopy, x8..11 (mirror), y0..2
for (let x = 8; x <= 11; x++) for (let y = 0; y <= 2; y++) for (let d = 0; d <= 2; d++) put(x, y, d, "air");
for (let x = 8; x <= 11; x++) for (let y = 0; y <= 2; y++) put(x, y, 3, (x === 8 || x === 11) ? BLACK : SS);
for (let y = 0; y <= 2; y++) { put(8, y, 2, y ? BLACK : BLACK); }
put(9, 0, 1, SS); put(9, 1, 1, SS); put(9, 2, 1, B.lantern(false));
put(8, 0, 0, SS); put(8, 1, 0, SS); put(8, 2, 0, SS);   // door reveals
for (let y = 0; y <= 2; y++) { put(8, y, 0, "air"); }   // dark reveal under the pier
for (const x of [8, 11]) for (let y = 0; y <= 2; y++) put(x, y, 1, BLACK);
for (let d = 0; d <= 2; d++) put(10, 0, d, CS);          // floor strip inside
// chandelier in central window
const cd = ROUND === 2 ? 1 : 2;
put(11, 17, cd, B.chain("y")); put(11, 16, cd, B.chain("y")); put(11, 15, cd, B.lantern(true));

// ---------------------------------------------------------------- sides: fins every 3 with dark slots (wings)
for (const sx of [0, 23]) {
  const out = sx === 0 ? -1 : 24;
  for (let k = 0; k * 3 < DEPTH; k++) {
    const d = k * 3;
    for (let y = 1; y <= 19; y++) { raw(out, y, d, SS); }
    for (const dd of [1, 2]) for (let y = 3; y <= 18; y++) {
      if (d + dd >= DEPTH) continue;
      raw(sx, y, d + dd, BG);
      raw(sx === 0 ? 1 : 22, y, d + dd, BLUE);
    }
  }
}

if (ROUND === 2) {
  // dark band y20 on wing front (spec) behind the sunburst
  for (const x of [0, 1]) put(x, 20, 0, NB);
  // mullions: sandstone transoms across tower windows (thin lines -> slabs/walls at glass plane)
  // sunburst rays: gold blocks fan out on the wing parapet
  for (const x of [1, 6]) put(x, 21, -1, slab(GOLD === "gold_block" ? "cut_sandstone" : SS, "bottom"));
  // tower side fins above the wing roofs (every 3), proud 1 toward the wing
  for (let d = 0; d < DEPTH; d += 3) for (let y = 21; y <= (d < 6 ? 25 : d < 12 ? 23 : 20); y++) put(5, y, d, SS);
  // stepped crown shoulders: stair chamfers
  put(6, 24, -1, stair(SS, "east", "bottom"));
  put(7, 25, -2, stair(SS, "east", "bottom"));
  put(9, 26, -2, stair(SS, "east", "bottom"));
  // wing front parapet sand cap with a quartz lip so the top steps
  for (const x of [0, 1]) put(x, 21, 0, slab(Q));
  // marquee: sea-lantern grid mullions (thin red nether brick walls over the panel)
  for (const x of [10, 12 - 1]) for (const y of [7, 8]) put(x, y, -3, B.wall("red_nether_brick"));
}
g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused?.length ?? 0 }));
