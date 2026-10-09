// Art Deco dance hall (24 wide x 27 tall at the crown, 22 deep incl. 4-deep canopy).
// Logical coords: x 0..23 (trace columns), y 0..26, d = depth from the facade plane (d<0 proud toward the street,
// d>=0 into the building). Mirror axis between x11 and x12. Grid: x = x+XO, z = d+ZO.
// usage: node build.mjs 1|2
import { Grid, B, face, fins } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ROUND = process.argv[2] === "2" ? 2 : 1;
const R2 = ROUND === 2;
const OUT = new URL(`./round-${ROUND}.nbt`, import.meta.url).pathname;
const XO = 1, ZO = 4, W = 26, H = 28, D = 22;
const g = new Grid([W, H, D]);

const pr = (b) => (Array.isArray(b) ? b : [b, undefined]);
const one = (x, y, d, b) => { const [n, s] = pr(b); g.set(x + XO, y, d + ZO, n, s); };
const mir = (b) => { const [n, s] = pr(b); return [n, s && s.facing ? { ...s, facing: face.mirrorX(s.facing) } : s]; };
const put = (x, y, d, b) => { one(x, y, d, b); one(23 - x, y, d, mir(b)); };            // x and its mirror
const box = (f, x0, x1, y0, y1, d0, d1, b) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let d = d0; d <= d1; d++) f(x, y, d, b); };
const air = "air";

const SAND = "sandstone", CUT = "cut_sandstone", SMOOTH = "smooth_sandstone", Q = "quartz_block";
const RNB = "red_nether_bricks", NB = "nether_bricks", BG = "black_stained_glass", BS = "blackstone";
const slab = (m, t = "bottom") => B.slab(m, t);

// ================================================================ 1. masses
// lower body x0..23, y0..16 solid, roof band y17 (white roof inside a cut-sandstone coping ring)
box(one, 0, 23, 0, 16, 0, 17, SAND);
box(one, 0, 23, 17, 17, 0, 17, CUT);
box(one, 1, 22, 17, 17, 2, 16, Q);
// interior hall
box(one, 3, 20, 1, 16, 3, 15, air);

// tower: front slice d0..5 profiled per column (trace silhouette), rear slice d6..16 flat at y23
const TOP = { 5: 22, 6: 23, 7: 24, 8: 25, 9: 25, 10: 26, 11: 26 };           // left half; mirrored
// round 2: each deeper pair of layers steps down 2 (the receding crown of the 3/4 view), never below the rear roof y23
const topAt = (x, d) => (R2 && x >= 7 ? Math.max(23, TOP[x] - 2 * Math.floor(d / 2)) : TOP[x]);
for (const xs of Object.keys(TOP)) {
  const x = +xs;
  for (let d = 0; d <= 5; d++) {
    const t = topAt(x, d);
    for (let y = 17; y <= t; y++) put(x, y, d, SAND);
    if (x < 10 || (R2 && t < TOP[x])) put(x, t + 1, d, slab(R2 && d >= 2 ? Q : CUT));    // tread caps
  }
}
// rear slice d6..16 (x6..17): solid to y21, white roof y22, coping ring y23
box(put, 6, 11, 17, 21, 6, 16, SAND);
box(put, R2 ? 8 : 7, 11, 22, 22, 7, 15, Q);
for (let x = 6; x <= 11; x++) { put(x, 23, 16, CUT); put(x, 23, 6, CUT); }
if (R2) for (let d = 7; d <= 15; d++) put(7, 23, d, CUT);
for (let d = 6; d <= 16; d++) { put(6, 23, d, CUT); put(6, 22, d, SAND); }
box(put, 6, 11, 22, 22, 6, 6, SAND); box(put, 6, 11, 22, 22, 16, 16, SAND);
// rear step: low coping on the d6 wall so the treads read as terraces
for (let x = 6; x <= 11; x++) put(x, 24, 6, slab(CUT));

// plinth
box(one, 0, 23, 0, 0, 0, 17, CUT);

// ================================================================ 2. wing front (x0..5, mirrored)
const wing = () => {
  put(0, 1, 0, CUT); box(put, 0, 0, 1, 16, 0, 0, CUT);
  // white fins x1, x5 (+1)
  box(put, 1, 1, 1, 17, -1, -1, Q); box(put, 5, 5, 1, 17, -1, -1, Q);
  put(1, 18, -1, slab(Q)); put(5, 18, -1, slab(Q));
  // cornice band y17 proud
  box(put, 0, 4, 17, 17, -1, -1, CUT);
  // crest wall y18..: x0 to 19, x1-2 to 20, x3-4 to 21 (2 thick)
  const top = { 0: 19, 1: 20, 2: 20, 3: 21, 4: 21 };
  for (const [xs, t] of Object.entries(top)) box(put, +xs, +xs, 18, t, 0, 1, SAND);
  // dark band y19
  for (const x of [1, 2, 5]) put(x, 19, -1, BS);
  put(5, 19, 0, BS);
  // sunburst: gold core y18-19, rays beside, navy fan above
  box(put, 3, 4, 18, 19, -1, -1, "gold_block");
  put(2, 18, -1, "yellow_concrete"); put(5, 18, 0, "yellow_concrete"); put(2, 19, -1, "blue_terracotta");
  put(2, 20, -1, "yellow_concrete"); put(3, 20, -1, "blue_terracotta"); put(4, 20, -1, "blue_terracotta");
  box(put, 3, 4, 21, 21, -1, -1, "blue_terracotta");
  put(1, 20, -1, BS);
  // chevron eyebrow y16
  put(2, 16, -1, B.stairs("smooth_sandstone", "east", "top")); put(4, 16, -1, B.stairs("smooth_sandstone", "west", "top"));
  put(3, 16, -1, SMOOTH);
  // window y4..15 recessed (core x3 orange/red, edges navy)
  for (let y = 4; y <= 15; y++) for (let x = 2; x <= 4; x++) {
    one(x, y, 0, air); one(23 - x, y, 0, air);
    const core = x === 3;
    const gl = !core ? BG : (y >= 12 || y <= 6) ? "orange_stained_glass" : (y >= 8 && y <= 10 ? "red_stained_glass" : "brown_stained_glass");
    put(x, y, 1, gl); put(x, y, 2, BS);
  }
  // base: small dark windows y1-2, sill band y3
  for (let y = 1; y <= 2; y++) for (let x = 2; x <= 4; x++) { put(x, y, 0, air); put(x, y, 1, BG); put(x, y, 2, BS); }
  box(put, 2, 4, 3, 3, -1, -1, SMOOTH);
  // lintel over windows
  box(put, 2, 4, 16, 16, 0, 0, SAND);
};
wing();

// ================================================================ 3. tower front
// wall y0..16 at x6 pier etc. are already sandstone. White tall fin x6 (+2) above the wing roofline.
for (let y = 17; y <= 23; y++) { put(6, y, -1, Q); put(6, y, -2, Q); }
put(6, 24, -1, slab(Q)); put(6, 24, -2, slab(Q));
// shoulder x5 above the wing roof
for (let y = 18; y <= 22; y++) put(5, y, -1, SMOOTH);
// canopy y4-5 (x6..17, d-1..-4), gold lip, copper line
box(put, 6, 11, 4, 4, -1, -3, CUT);
box(put, 6, 11, 5, 5, -1, -4, slab("cut_sandstone"));
box(put, 6, 11, 4, 4, -4, -4, "gold_block");
box(put, 6, 11, 3, 3, -4, -4, slab("waxed_weathered_copper", "top"));
// entrance: openings x8-9, 11-12 (and mirror 14-15), y1..3, recessed 2
for (const [a, b] of [[8, 9], [11, 12]]) for (let x = a; x <= b; x++) {
  for (let y = 1; y <= 3; y++) { put(x, y, 0, air); put(x, y, 1, air); }
  put(x, 1, 2, B.trapdoor("dark_oak", "north", "bottom", true));
  put(x, 2, 2, BG); put(x, 3, 2, BG);
}
for (let x = 11; x <= 12; x++) { one(x, 3, 0, SAND); one(x, 3, 1, SAND); }      // (centre door lower lintel kept below)
for (let x = 11; x <= 12; x++) { one(x, 3, 0, air); one(x, 3, 1, air); }
// lanterns hang from the canopy beside the doors (x10, mirrored x13)
put(10, 3, -1, B.chain()); put(10, 2, -1, B.lantern(true));

// tower glass bays: side bays x7-8 (peak toward centre), centre bay x10-13
const SIDE = { 7: [7, 17], 8: [7, 19] };
const sideGlass = (x, y) => x === 7 ? "blue_stained_glass" : (y % 4 === 3 ? "orange_stained_glass" : "red_stained_glass");
for (const [xs, [y0, y1]] of Object.entries(SIDE)) { const x = +xs; for (let y = y0; y <= y1; y++) { put(x, y, 0, air); put(x, y, 1, sideGlass(x, y)); put(x, y, 2, BS); } }
const CEN = { 10: [7, 19], 11: [7, 21] };
for (const [xs, [y0, y1]] of Object.entries(CEN)) {
  const x = +xs;
  for (let y = y0; y <= y1; y++) {
    put(x, y, 0, air);
    const gl = x === 10 ? (y % 3 === 0 ? "blue_stained_glass" : "gray_stained_glass") : (y % 5 === 2 ? "orange_stained_glass" : "red_stained_glass");
    put(x, y, 1, gl); put(x, y, 2, BS);
  }
}
// chandelier in the centre bay (replaces glass at d1)
for (const x of [11, 12]) { one(x, 18, 1, B.chain()); one(x, 17, 1, "glowstone"); one(x, 16, 1, B.lantern(true)); one(x, 15, 1, "end_rod"); }
// tower fins (+2): x9, mirrored x14, from y6, proud to d-1 below the marquee and d-2 above
for (let y = 6; y <= 25; y++) { put(9, y, -1, SAND); if (y >= 11) put(9, y, -2, SAND); }
put(9, 26, -1, slab(SAND)); put(9, 26, -2, slab(SAND));
// outer crown fins x7 (mirrored 16): above the glass
for (let y = 18; y <= 24; y++) put(7, y, -1, CUT);
put(7, 25, -1, slab(CUT));
// centre crown fins x11-12 (+2)
for (let y = 22; y <= 26; y++) for (const x of [11, 12]) { one(x, y, -1, SAND); one(x, y, -2, SAND); }
// dark slits y22-23 at x8, x10 (mirror 15, 13)
for (const x of [8, 10]) for (let y = 22; y <= 23; y++) { put(x, y, 0, air); put(x, y, 1, BS); }
// slits near the very top at x10/x13
put(10, 25, 0, air); put(10, 25, 1, BS);
if (R2) { for (const x of [8]) put(x, 24, 0, air), put(x, 24, 1, BS); for (const y of [24]) put(10, y, 0, air), put(10, y, 1, BS); }

// marquee at d-2, x8..15, y6..10
const MQ = (x, y, b) => one(x, y, -2, b);
for (let x = 8; x <= 15; x++) {
  const edge = x === 8 || x === 15;
  MQ(x, 6, edge ? RNB : (x % 2 ? "shroomlight" : RNB));
  MQ(x, 7, edge ? RNB : "sea_lantern");
  MQ(x, 8, (x % 2) ? NB : RNB); MQ(x, 9, (x % 2) ? RNB : NB);
  MQ(x, 10, RNB);
}
for (const x of [11, 12]) MQ(x, 11, NB);
for (const x of [8, 15]) for (let y = 6; y <= 10; y++) one(x, y, -1, RNB);

// ================================================================ 4. side walls (x0 plane + mirror)
const SIDEROWS = {
  16: "WsssssssNNssNNNNNs", 15: "WNNNsNNsNNssNNNNNs", 14: "WNNNsNNsNNssNNNNNs", 13: "WNNNsNNsNNsssNNsNs",
  12: "WNNNsNNsNNssNNNNNs", 11: "WNNNsNNsNNssNNNNNs", 10: "WNNNsNNsNNssNNNNNs", 9: "WNNNsNNsNNsssNNsNs",
  8: "WNNNsNNsNssssNNsNs", 7: "WNNNsNNsNsssssNsNs", 6: "WNNNsNNsNsNsNsNsNs", 5: "WNNNsNNsNsNsNsNsNs",
  4: "WNNNsNNsNsNsNsNsNs", 2: "WNNNNsNNNsNNNsNNNs", 1: "WNNNNsNNNsNNNsNNNs",
};
for (const [ys, row] of Object.entries(SIDEROWS)) {
  const y = +ys;
  for (let i = 0; i < row.length; i++) {
    const d = i;                                   // col 4 = d0
    if (row[i] === "N") { for (const f of [(x, b) => one(x, y, d, b), (x, b) => one(23 - x, y, d, b)]) { f(0, air); f(1, BG); f(2, BS); } }
  }
  // corner fin d0, proud (-x)
}
// west/east corner fins: white at d0 proud, y1..17
for (let y = 1; y <= 17; y++) { g.set(0, y, ZO, Q); g.set(W - 1, y, ZO, Q); }
// upper tier windows on the tower side planes (x6 / x17), d7..16, y18..22
for (let y = 18; y <= 22; y++) for (const d of [7, 10, 13]) { one(5, y, d, Q); one(18, y, d, Q); }
for (let y = 18; y <= 22; y++) for (const d of [8, 9, 11, 12, 14, 15]) { for (const x of [6, 17]) one(x, y, d, air); one(7, y, d, BG); one(16, y, d, BG); one(8, y, d, y === 22 && R2 ? Q : BS); one(15, y, d, y === 22 && R2 ? Q : BS); }

g.save(OUT);
console.log("saved", OUT, "refused:", g.refused?.length ?? 0);
