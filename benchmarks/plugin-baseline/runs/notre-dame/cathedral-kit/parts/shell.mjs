// Part: masonry shell. Hollow 1-thick walls (thicker where the west front and belfries are carved later), plinths to y 3,
// piers y4..38. Openings of the plan are left as air (omission). Clipped to plan.md's FOOTPRINT mask.
const MASK = [
".................##.##.......###......",
".####.#############################...",
"####################################..",
"#####################################.",
"#####################################.",
"#####################################.",
"######################################",
"######################################",
"######################################",
"#####################################.",
"#####################################.",
"####################################..",
"###################################...",
".####.###########################.....",
".....................#..#####.........",
"........................#####.........",
".......................#######........",
".......................########.......",
".......................########.......",
".......................########.......",
"...........................###........",
"...........................###........",
"......................................"];
const inMask = (x, z) => x >= 0 && z >= 0 && MASK[Math.floor(z / 5)]?.[Math.floor(x / 5)] === "#";
function groundY(x, z) {
  if (x <= 34) return 3;
  if (x >= 152 && z >= 70) return 0;
  if (z >= 48 && x >= 85 && x <= 170 && !(x >= 86 && x <= 104)) return 1;
  return 2;
}
const mat = (x, y, z) => {
  if (y <= 4) return "stone_bricks";
  if (y % 8 === 0 && y > 8) return "cut_sandstone";
  if (y < 12 && (x * 7 + z * 13 + y * 5) % 10 === 0) return "sandstone";
  return "smooth_sandstone";
};

export function build(g) {
  const put = (x, y, z, b) => { x = Math.round(x); z = Math.round(z); if (inMask(x, z) && y < 139) g.set(x, y, z, b ?? mat(x, y, z)); };
  const box = (x0, y0, z0, x1, y1, z1, b) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) put(x, y, z, b); };
  const mir = (f) => { f(false); f(true); };
  const MZ = (z, m) => (m ? 74 - z : z);
  // box mirrored about z 37
  const mbox = (x0, y0, z0, x1, y1, z1, b) => mir((m) => { const a = MZ(z0, m), c = MZ(z1, m); box(x0, y0, Math.min(a, c), x1, y1, Math.max(a, c), b); });
  const plinth = (x0, z0, x1, z1) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { if (!inMask(x, z)) continue; for (let y = groundY(x, z) + 1; y <= 3; y++) put(x, y, z, y === 3 ? "polished_andesite" : "stone_bricks"); } };

  // ---- plinths
  plinth(2, 7, 22, 67); plinth(23, 5, 85, 69); plinth(86, 1, 104, 69); plinth(105, 5, 149, 69);
  for (let x = 150; x <= 185; x++) for (let z = 4; z <= 69; z++) { const r = Math.hypot(x - 150, z - 37); if (r <= 32.5 || (r <= 35.5 && Math.abs(z - 37) <= 8)) { if (inMask(x, z)) for (let y = groundY(x, z) + 1; y <= 3; y++) put(x, y, z, y === 3 ? "polished_andesite" : "stone_bricks"); } }

  // ---- west towers (north defined, mirrored) + centre block
  const front = (z0, z1, mirrorSafe) => {
    // front wall layering at x 2.. for a z range
    for (let z = z0; z <= z1; z++) {
      for (let y = 4; y <= 29; y++) for (let x = 2; x <= 6; x++) put(x, y, z);
      for (let y = 30; y <= 59; y++) for (let x = 2; x <= 4; x++) put(x, y, z);
      for (let y = 60; y <= 65; y++) put(5, y, z);
      for (let y = 66; y <= 68; y++) for (let x = 2; x <= 5; x++) put(x, y, z);
    }
  };
  const inPortal = (z, y, zc, hw, apex) => { const h = hw - Math.max(0, y - (apex - hw)); return Math.abs(z - zc) <= h; };
  const carveFront = [];
  const isVoidFront = (x, y, z) => {
    if (x <= 6 && y <= 29) {
      if (inPortal(z, y, 37, 5, 22) && y <= 22) return true;
      if (inPortal(z, y, 17, 4, 19) && y <= 19) return true;
      if (inPortal(z, y, 57, 4, 19) && y <= 19) return true;
    }
    if (x === 2 && y >= 32 && y <= 34 && z >= 8 && z <= 66 && z % 2 === 0) return true; // kings' niches
    if (x <= 3 && y >= 39 && y <= 59) {
      if ((y - 49) ** 2 + (z - 37) ** 2 <= 8 * 8 && z >= 29 && z <= 45) return true; // west rose
      if (y >= 42 && y <= 56) for (const zc of [11, 23, 51, 63]) if (Math.abs(z - zc) <= 1) return true; // tower lancets
    }
    return false;
  };
  // front wall over towers and centre
  for (let z = 7; z <= 67; z++) {
    for (let y = 4; y <= 68; y++) for (let x = 2; x <= 6; x++) {
      if (y >= 30 && x > 4 && y <= 59) continue;
      if (y >= 60 && y <= 65 && x !== 5) continue;
      if (y >= 66 && x > 5) continue;
      if (isVoidFront(x, y, z)) continue;
      put(x, y, z);
    }
  }
  // centre block: side walls are the towers'; back wall x22, floors y59 (gallery floor), cap y66
  box(7, 59, 28, 22, 59, 46, "cut_sandstone"); box(5, 66, 28, 22, 66, 46, "smooth_sandstone_slab");
  box(22, 4, 28, 22, 65, 46); box(2, 59, 28, 6, 59, 46, "cut_sandstone");
  // towers
  const tower = (m) => {
    const Z = (z) => MZ(z, m);
    const wallz = (x0, y0, x1, y1, za, zb, b) => box(x0, y0, Math.min(Z(za), Z(zb)), x1, y1, Math.max(Z(za), Z(zb)), b);
    // thin walls y4..68
    wallz(2, 4, 22, 68, 7, 7); wallz(2, 4, 22, 68, 27, 27); wallz(22, 4, 22, 95, 7, 27);
    for (const y of [40, 69]) wallz(3, y, 21, y, 8, 26, "cut_sandstone");
    // belfry stage y69..95, 4 thick, with louvre openings left as air
    for (let y = 69; y <= 95; y++) for (let x = 2; x <= 22; x++) for (let z = 7; z <= 27; z++) {
      const wx = x <= 5 || x >= 19, wz = z <= 10 || z >= 24;
      if (!wx && !wz) continue;
      if (y >= 71 && y <= 91) {
        if (x <= 5 && (( z >= 9 && z <= 12) || (z >= 22 && z <= 25)) && x <= 4) continue; // west face
        if (x >= 20 && ((z >= 9 && z <= 12) || (z >= 22 && z <= 25))) continue; // east face
        if (z <= 9 && ((x >= 4 && x <= 7) || (x >= 15 && x <= 18))) continue; // north face
        if (z >= 25 && ((x >= 4 && x <= 7) || (x >= 15 && x <= 18))) continue; // south face
      }
      put(x, y, Z(z));
    }
    wallz(2, 96, 22, 96, 7, 27, "smooth_sandstone");
  };
  tower(false); tower(true);
  // buttress feet at the west face plinth line are the west part's.

  // ---- nave + choir bands (x ranges), walls mirrored
  const bands = (x0, x1) => {
    const cs = x0 === 23 ? [27, 36, 45, 54, 63, 72, 81] : [109, 118, 127, 136, 145];
    const wwall = (z, ytop, wy) => mir((m) => { for (let x = x0; x <= x1; x++) for (let y = 4; y <= ytop; y++) { if (y >= wy[0] && y <= wy[1] && cs.some((c) => Math.abs(x - c) <= 1)) continue; put(x, y, MZ(z, m)); } });
    wwall(5, 21, [6, 16]); wwall(19, 33, [31, 33]); wwall(27, 45, [35, 43]);
    mbox(x0, 4, 11, x1, 24, 11);          // outer aisle outer wall
    mbox(x0, 21, 5, x1, 21, 10, "smooth_sandstone_slab"); // chapel terrace (y21 slab? floor of terrace)
  };
  bands(23, 85); bands(105, 149);
  // end walls at the west of the nave aisles
  mbox(23, 4, 5, 23, 21, 26);
  // clerestory windows: lancets left as air (carve by omission): redo with gaps
  // (walls were filled whole; windows are the glazier's cells, cut here before locking is not possible, so rebuild)
  // piers
  const piers = (xs) => { for (const px of xs) mir((m) => { const a = MZ(4, m), b = MZ(10, m); box(px, 4, Math.min(a, b), px + 1, 38, Math.max(a, b), "smooth_sandstone"); }); };
  piers([31, 40, 49, 58, 67, 76]); piers([113, 122, 131, 140]);
  // transept piers wall faces
  // ---- transept arms
  mir(() => {});
  box(86, 4, 1, 86, 45, 26); box(104, 4, 1, 104, 45, 26); box(86, 4, 48, 86, 45, 69); box(104, 4, 48, 104, 45, 69);
  const gable = (z) => { for (let y = 4; y <= 57; y++) { const hw = y <= 45 ? 9 : Math.max(0, Math.floor(9 - (y - 45) / 1.33)); for (let x = 95 - hw; x <= 95 + hw; x++) {
    if (y <= 45) { const dx = x - 95, rose = (x - 95) ** 2 + (y - 34) ** 2 <= 8 * 8; const portal = Math.abs(dx) <= 3 && y <= 17; if (rose || portal) continue; }
    else if (y >= 49 && y <= 53 && (x - 95) ** 2 + (y - 51) ** 2 <= 3 * 3) continue;
    put(x, y, z); } } };
  gable(1); gable(69);
  // transept corner buttresses
  for (const [x0, z0] of [[84, 0], [104, 0], [84, 66], [104, 66]]) box(x0, 4, z0, x0 + 1, 50, z0 + 3, "smooth_sandstone");
  // ---- chevet (polar, centre 150,37)
  const polar = (r0, r1, y0, y1, a0, a1, bays, win) => {
    for (let x = 150; x <= 186; x++) for (let z = 4; z <= 69; z++) {
      const r = Math.hypot(x - 150, z - 37), ri = Math.round(r); if (ri < r0 || ri > r1) continue;
      const a = Math.atan2(z - 37, x - 150) * 180 / Math.PI; if (a < a0 || a > a1) continue;
      for (let y = y0; y <= y1; y++) {
        if (win && y >= win[0] && y <= win[1] && bays) {
          const bw = (a1 - a0) / bays, k = Math.min(bays - 1, Math.floor((a - a0) / bw)), ac = a0 + (k + 0.5) * bw;
          if (Math.abs((a - ac) * Math.PI / 180 * r) <= 1.6) continue;
        }
        put(x, y, z);
      }
    }
  };
  polar(10, 10, 4, 45, -90, 90, 7, [35, 43]);
  polar(17, 17, 4, 36, -90, 90, 7, [31, 33]);
  polar(24, 24, 4, 27, -90, 90, 0, null);
  polar(32, 32, 4, 20, -90, 90, 5, [6, 15]);
  polar(35, 35, 4, 20, -14, 14, 0, null);
  box(182, 4, 29, 185, 20, 29); box(182, 4, 45, 185, 20, 45);
  // chevet piers
  for (const ad of [-72, -54, -18, 18, 54, 72].map((a) => a)) {
    const ang = ([-72, -54, -18, 18, 54, 72].indexOf(ad), ad); }
  for (const ad of [-72, -54, -18, 18, 54, 72]) {
    const t = ad * Math.PI / 180, ux = Math.cos(t), uz = Math.sin(t);
    for (let x = 150; x <= 186; x++) for (let z = 3; z <= 69; z++) { const dx = x - 150, dz = z - 37, al = dx * ux + dz * uz, pp = -dx * uz + dz * ux; if (al >= 26 && al <= 33 && Math.abs(pp) <= 1.0) for (let y = 4; y <= 38; y++) put(x, y, z, "smooth_sandstone"); }
  }
  // ---- sacristy (floor = ground)
  const wallsBox = (x0, x1, z0, z1, ytop) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue; for (let y = groundY(x, z) + 1; y <= ytop; y++) { if (x === 144 && z0 === 70 && x1 === 144 && y <= 3 && z >= 76 && z <= 77) continue; put(x, y, z); } } };
  wallsBox(120, 144, 70, 84, 11);
  wallsBox(125, 154, 85, 99, 17);
  wallsBox(115, 124, 80, 99, 14);
  wallsBox(135, 149, 100, 109, 18);
  for (let k = 0; k <= 7; k++) for (let x = 142 - (7 - k); x <= 142 + (7 - k); x++) put(x, 19 + k, 109);
  box(105, 2, 70, 109, 12, 72, "smooth_sandstone");
}
