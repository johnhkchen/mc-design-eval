// Plot 0 Smithsonian Castle masonry: masses, tower shafts T1..T9, openings, quoins, string courses, corbels, porch, oriel.
import { B, carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { archedWindow, slitWindow, octoTower, oriel, gableEnd } from "../vocab.mjs";

const BODY = "red_terracotta", PLINTH = "red_nether_bricks", TRIM = "polished_granite";

// local: a slab/stair only into air, never refused
function put(g, x, y, z, block, state) { if (g.inBounds(x, y, z) && g.isAir(x, y, z)) g.set(x, y, z, block, state); }
// solid red mass with plinth, then a hollow inside over a bottom-slab floor
function mass(g, x0, z0, x1, z1, top) {
  g.fill([x0, 0, z0], [x1, 0, z1], PLINTH);
  g.fill([x0, 1, z0], [x1, top, z1], BODY);
  hollow(g, x0, z0, x1, z1, top);
}
function hollow(g, x0, z0, x1, z1, top) {
  if (x1 - x0 < 2 || z1 - z0 < 2) return;
  carve(g, [x0 + 1, 0, z0 + 1], [x1 - 1, top, z1 - 1]);
  g.fill([x0 + 1, 0, z0 + 1], [x1 - 1, 0, z1 - 1], "deepslate_tile_slab", { type: "bottom" });
}
// granite flecks: short horizontal runs on a wall row, deterministic
function flecks(g, x0, x1, z, y, face) {
  for (let x = x0 + 2; x + 1 < x1; x += 11) for (let i = 0; i < 2 + (x % 2); i++) {
    const c = [x + i, y, z]; if (g.isAir(...c) === false && g.get?.(...c)?.name !== undefined) g.set(...c, TRIM);
  }
}
function win(g, x, y, z, face, h, opts = {}) {
  carve(g, [x, y, z], [x, y + h - 1, z]);
  archedWindow(g, x, y, z, face, h, opts);
}
function slit(g, x, y, z, face, h) {
  carve(g, [x, y, z], [x, y + h - 1, z]);
  slitWindow(g, x, y, z, face, h);
}
function course(g, [x0, z0, x1, z1], y) { // granite slab string course proud 1 on the long faces
  for (let x = x0; x <= x1; x++) { put(g, x, y, z0 - 1, ...B.slab("polished_granite", "top")); put(g, x, y, z1 + 1, ...B.slab("polished_granite", "top")); }
}
function corbel(g, [x0, z0, x1, z1], y) {
  for (let x = x0; x <= x1; x++) {
    put(g, x, y, z0 - 1, ...B.stairs("red_nether_brick", "south", "top"));
    put(g, x, y, z1 + 1, ...B.stairs("red_nether_brick", "north", "top"));
  }
}
function quoin(g, x, z, y0, y1) {
  for (let y = y0; y <= y1; y++) if ([0, 1, 3].includes(y % 5) && !g.isAir(x, y, z)) g.set(x, y, z, TRIM);
}

export function build(g) {
  // ---- masses (solid, hollowed) ----
  const main = [14, 8, 40, 14], wr = [7, 8, 13, 14], er = [41, 8, 47, 14];
  mass(g, ...main, 9); mass(g, ...wr, 6); mass(g, ...er, 6);
  mass(g, 1, 7, 6, 15, 8);            // west wing (chapel)
  mass(g, 48, 6, 54, 16, 8);          // east wing
  g.fill([55, 0, 10], [56, 5, 12], BODY); g.fill([55, 0, 10], [56, 0, 12], PLINTH);
  carve(g, [55, 1, 11], [55, 5, 11]); g.fill([55, 0, 11], [55, 0, 11], "deepslate_tile_slab", { type: "bottom" });
  g.fill([55, 6, 10], [56, 6, 12], "deepslate_tile_slab", { type: "bottom" });
  // porch
  g.fill([25, 1, 1], [28, 3, 2], BODY); g.fill([25, 0, 1], [28, 0, 2], PLINTH);
  carve(g, [26, 0, 1], [27, 2, 2]); g.fill([26, 0, 1], [27, 0, 2], "smooth_stone");
  g.fill([25, 4, 1], [28, 4, 1], "deepslate_tile_slab", { type: "bottom" });

  // gable triangles on the wings (N and S ends)
  gableEnd(g, [1, 0, 7, 6, 0, 7], 9, 11, BODY); gableEnd(g, [1, 0, 15, 6, 0, 15], 9, 11, BODY);
  gableEnd(g, [48, 0, 6, 54, 0, 6], 9, 12, BODY); gableEnd(g, [48, 0, 16, 54, 0, 16], 9, 12, BODY);

  // ---- towers ----
  const sq = (x0, z0, x1, z1, top) => { g.fill([x0, 0, z0], [x1, 0, z1], PLINTH); g.fill([x0, 1, z0], [x1, top, z1], BODY); hollowT(x0, z0, x1, z1, top); };
  const hollowT = (x0, z0, x1, z1, top) => { carve(g, [x0 + 1, 0, z0 + 1], [x1 - 1, top, z1 - 1]); g.fill([x0 + 1, 0, z0 + 1], [x1 - 1, 0, z1 - 1], "deepslate_tile_slab", { type: "bottom" }); };
  sq(23, 3, 30, 8, 14);                       // T1
  g.fill([28, 15, 5], [30, 17, 7], BODY); carve(g, [29, 16, 6], [29, 17, 6]); // T2
  sq(12, 7, 15, 10, 12); sq(9, 8, 11, 10, 12); sq(2, 6, 4, 8, 10); sq(52, 6, 54, 8, 12); // T4 T5 T6 T7
  const octo = (x0, z0, x1, z1, top) => { octoTower(g, x0, z0, x1, z1, top, 1, { replace: true }); carve(g, [x0 + 1, 0, z0 + 1], [x1 - 1, top, z1 - 1]); g.fill([x0 + 1, 0, z0 + 1], [x1 - 1, 0, z1 - 1], "deepslate_tile_slab", { type: "bottom" }); };
  octo(39, 7, 42, 10, 14); octo(25, 13, 28, 16, 11); octo(25, 17, 28, 20, 13);
  // pinnacles
  g.fill([14, 0, 15], [15, 10, 15], BODY); g.fill([14, 0, 15], [15, 0, 15], PLINTH); g.fill([40, 0, 15], [40, 10, 15], BODY); g.set(40, 0, 15, PLINTH);
  // belfry: openings y11..12 on four faces with louvre walls at y11
  for (const [x, z] of [[26, 17], [27, 17], [26, 20], [27, 20], [25, 18], [25, 19], [28, 18], [28, 19]]) {
    carve(g, [x, 11, z], [x, 12, z]); g.set(x, 11, z, "red_nether_brick_wall");
  }

  // ---- string courses and corbel tables (proud 1) ----
  for (const [b, y, eave] of [[main, 4, 9], [wr, 4, 6], [er, 4, 6]]) { course(g, b, y); corbel(g, b, eave); }
  for (const b of [[1, 7, 6, 15], [48, 6, 54, 16]]) { const e = [1, 7, 6, 15] === b ? 0 : 0; }
  for (const [x0, z0, x1, z1] of [[1, 7, 6, 15], [48, 6, 54, 16]]) {
    for (let z = z0; z <= z1; z++) { // wings are long along z: courses on W/E faces
      put(g, x0 - 1, 4, z, ...B.slab("polished_granite", "top")); put(g, x1 + 1, 4, z, ...B.slab("polished_granite", "top"));
      put(g, x0 - 1, 8, z, ...B.stairs("red_nether_brick", "east", "top")); put(g, x1 + 1, 8, z, ...B.stairs("red_nether_brick", "west", "top"));
    }
  }
  // T1 corbels on N/E/W at y14 are P2's (battlements). Tower bands one row under each eave:
  for (const [x0, z0, x1, z1, y] of [[12, 7, 15, 10, 11], [9, 8, 11, 10, 11], [2, 6, 4, 8, 9], [52, 6, 54, 8, 11], [25, 13, 28, 16, 10], [25, 17, 28, 20, 12]]) {
    for (let x = x0; x <= x1; x++) { put(g, x, y, z0 - 1, ...B.slab("polished_granite", "top")); put(g, x, y, z1 + 1, ...B.slab("polished_granite", "top")); }
  }

  // ---- quoins ----
  quoin(g, 23, 3, 0, 14); quoin(g, 30, 3, 0, 14); quoin(g, 23, 8, 0, 14); quoin(g, 30, 8, 0, 14);
  for (const [x, z] of [[1, 7], [6, 7], [1, 15], [6, 15]]) quoin(g, x, z, 0, 8);
  for (const [x, z] of [[48, 6], [54, 6], [48, 16], [54, 16]]) quoin(g, x, z, 0, 8);
  for (const [x, z] of [[12, 7], [15, 7], [12, 10], [15, 10]]) quoin(g, x, z, 0, 12);
  for (const [x, z] of [[9, 8], [11, 8], [9, 10], [11, 10]]) quoin(g, x, z, 0, 12);
  for (const [x, z] of [[2, 6], [4, 6], [2, 8], [4, 8], [52, 6], [54, 6], [52, 8], [54, 8]]) quoin(g, x, z, 0, g.isAir(x, 12, z) ? 10 : 12);
  quoin(g, 14, 14, 0, 9); quoin(g, 40, 14, 0, 9); quoin(g, 7, 8, 0, 6); quoin(g, 47, 14, 0, 6);

  // ---- door, porch arch, T1 front ----
  carve(g, [26, 0, 3], [27, 2, 3]); g.fill([26, 0, 3], [27, 0, 3], "smooth_stone");
  g.set(26, 3, 1, ...B.stairs("polished_granite", "east", "top")); g.set(27, 3, 1, ...B.stairs("polished_granite", "west", "top"));
  g.set(26, 3, 3, ...B.stairs("polished_granite", "east", "top")); g.set(27, 3, 3, ...B.stairs("polished_granite", "west", "top"));
  oriel(g, 25, 28, 2, 5, 8);
  for (const x of [26, 27]) slit(g, x, 10, 3, "north", 3);
  for (const y of [6, 11]) { slit(g, 23, y, 5, "west", 2); slit(g, 30, y, 5, "east", 2); }

  // ---- windows ----
  for (const x of [17, 19, 21, 32, 34, 36]) { win(g, x, 5, 8, "north", 3, { sill: false }); win(g, x, 1, 8, "north", 2); }
  for (const x of [17, 19, 21, 23, 30, 32, 34, 36, 38]) { win(g, x, 5, 14, "south", 3, { sill: false }); win(g, x, 1, 14, "south", 2); }
  for (const [x, z, f] of [[7, 8, "north"], [43, 8, "north"], [45, 8, "north"], [47, 8, "north"], [7, 14, "south"], [43, 14, "south"], [45, 14, "south"], [47, 14, "south"]]) {
    win(g, x, 1, z, f, 2); win(g, x, 4, z, f, 1, { sill: false });
  }
  for (const z of [9, 11, 13]) win(g, 1, 2, z, "west", 5);             // chapel windows
  win(g, 3, 2, 7, "north", 5); win(g, 4, 2, 7, "north", 5); win(g, 3, 2, 15, "south", 4); win(g, 4, 2, 15, "south", 4);
  carve(g, [3, 10, 7], [4, 10, 7]); g.set(3, 10, 7, "gray_stained_glass_pane", { east: "true", west: "false", north: "false", south: "false" }); g.set(4, 10, 7, "gray_stained_glass_pane", { east: "false", west: "true", north: "false", south: "false" });
  win(g, 49, 2, 6, "north", 5); win(g, 50, 2, 6, "north", 5);
  for (const z of [9, 13]) { win(g, 54, 1, z, "east", 2); win(g, 54, 4, z, "east", 3); }
  win(g, 56, 2, 11, "east", 3);
  // tower slits
  for (const y of [5, 9]) { slit(g, 13, y, 7, "north", 2); slit(g, 10, y, 8, "north", 2); slit(g, 53, y, 6, "north", 2); }
  for (const y of [4, 8]) slit(g, 3, y, 6, "north", 2);
  for (const y of [4, 8, 11]) { slit(g, 40, y, 7, "north", y === 4 || y === 8 ? 2 : 2); slit(g, 42, y, 8, "east", 2); }
  for (const y of [5, 9]) { slit(g, 28, y, 14, "east", 2); slit(g, 25, y, 14, "west", 2); slit(g, 26, y, 16, "south", 2); }
  slit(g, 30, 16, 6, "east", 2); slit(g, 29, 16, 5, "north", 2);
  // clear the proud granite slab course where it lies on a wall's windows is handled by order: walls first
}
