// Part 1: masonry shell. Ground floors, walls of all three plots, decks, galleries; every opening left as air.
import { arcadeBay, pilasterPair, quoinCorner } from "../vocab.mjs";

const isAir = (g, x, y, z) => /air$/.test(g.blockAt(x, y, z));

export function build(g) {
  // fill only the cells still air (so arcadeBay rings and earlier fills survive)
  const F = (x0, y0, z0, x1, y1, z1, block, state) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++)
      if (isAir(g, x, y, z)) g.set(x, y, z, block, state);
  };
  const A = (x0, y0, z0, x1, y1, z1) => g.fill([x0, y0, z0], [x1, y1, z1], "air"); // carve my own walls
  const X = (x) => x; void X;

  // v2: top course of a gable wall under a roof that rises half a block per cell from y27 (L cells in from the eave)
  const gableTop = (L) => (L % 2 ? 27 + (L - 1) / 2 : 26 + L / 2);
  const CAL = "calcite", Q = "smooth_quartz", AND = "polished_andesite", SS = "smooth_stone";

  // ---- floors: the nave, walk and shops stand on polished andesite (ground course y 0)
  g.fill([0, 0, 5], [100, 0, 77], AND);
  g.fill([0, 0, 3], [100, 0, 4], SS);

  // ---- land front: wing bars (z 3..14), bays at x0
  const bars = [[0, 8], [38, 47], [48, 63], [64, 80]];
  const bays = [0, 40, 48, 56, 64, 72];
  for (const x0 of bays) arcadeBay(g, x0);
  for (const [a, b] of bars) {
    F(a, 1, 3, b, 25, 4, CAL);                       // piers / front wall
    F(a, 12, 5, b, 12, 13, SS);                      // deck y12 (walk/shop ceiling, office floor)
    F(a, 26, 3, b, 26, 14, SS);                      // roof deck
    F(a, 1, 9, b, 11, 9, CAL);                       // inner arcade wall
    F(a, 1, 14, b, 25, 14, CAL);                     // back wall to the nave
  }
  const plainBays = [0, 40, 48, 56, 64, 72];
  for (const x0 of plainBays) {
    A(x0 + 3, 1, 9, x0 + 4, 3, 9);                   // shop door
    A(x0 + 1, 2, 9, x0 + 2, 5, 9); A(x0 + 5, 2, 9, x0 + 6, 5, 9); // shop windows
    A(x0 + 2, 1, 14, x0 + 5, 7, 14); A(x0 + 3, 8, 14, x0 + 4, 8, 14); // arches into nave
    A(x0 + 2, 15, 3, x0 + 5, 20, 4); A(x0 + 3, 21, 3, x0 + 4, 21, 4); // upper windows
  }

  // ---- entrance pavilion (x 9..37, z 1..14)
  const arch = (x0, y0, z0, z1) => {                 // 7-wide arch x0..x0+6
    A(x0, y0, z0, x0 + 6, y0 + 16, z1);
    A(x0 + 1, y0 + 17, z0, x0 + 5, y0 + 17, z1);
    A(x0 + 2, y0 + 18, z0, x0 + 4, y0 + 18, z1);
    A(x0 + 3, y0 + 19, z0, x0 + 3, y0 + 19, z1);
  };
  g.fill([9, 1, 1], [37, 28, 3], Q);
  g.fill([9, 1, 4], [10, 28, 14], Q); g.fill([36, 1, 4], [37, 28, 14], Q);
  g.fill([11, 1, 14], [35, 28, 14], Q);
  g.fill([9, 22, 1], [37, 22, 14], SS);              // landing y22
  g.fill([9, 29, 1], [37, 30, 14], SS);              // roof deck (y30, cornice y29 by roofs)
  for (const x0 of [11, 20, 29]) {
    arch(x0, 1, 1, 3);
    A(x0 + 1, 1, 14, x0 + 5, 7, 14); A(x0 + 2, 8, 14, x0 + 4, 8, 14); // hall to nave
  }
  g.fill([9, 29, 1], [37, 29, 14], SS);
  g.fill([9, 31, 1], [37, 31, 14], "air");
  for (const x of [9, 18, 27, 36]) pilasterPair(g, x, 0);

  // ---- bay side: grey bars z 64..78
  const bayBars = [[0, 12], [34, 47], [48, 63], [64, 100]];
  for (const [a, b] of bayBars) {
    F(a, 1, 77, b, 25, 78, AND);
    F(a, 1, 77, b, 2, 78, "stone_bricks");
    F(a, 12, 65, b, 12, 76, SS);
    F(a, 26, 64, b, 26, 78, SS);
    if (a < 64) F(a, 1, 64, b, 25, 64, AND);
  }
  F(64, 1, 64, 100, 25, 64, AND);
  const bayBays = [0, 40, 48, 56, 64, 72, 80, 88];
  for (const x0 of bayBays) {
    for (const x of [x0, x0 + 7]) { F(x, 1, 79, x, 25, 79, "stone_bricks"); }
    if (x0 < 64) { A(x0 + 2, 4, 77, x0 + 5, 20, 78); A(x0 + 3, 21, 77, x0 + 4, 21, 78); }
    if (x0 < 64 || x0 >= 98) A(x0 + 2, 1, 64, x0 + 5, 7, 64);
    A(x0 + 2, 1, 64, x0 + 5, 7, 64); A(x0 + 3, 8, 64, x0 + 4, 8, 64);
  }
  A(51, 1, 77, 52, 3, 78);                           // service door
  // plot 0 central gabled hall x 13..33, z 58..78
  A(13, 1, 64, 33, 25, 64);                          // hall open to the nave (clears the inner wall)
  F(13, 1, 64, 13, 27, 78, AND); F(33, 1, 64, 33, 27, 78, AND);
  F(13, 1, 77, 33, 27, 78, AND);
  A(14, 1, 64, 32, 26, 76);                          // v2: y27 is the roof's (its L=1 slab course)
  // v2: the hall's lamp posts go in with the carve (later parts can't write into this air): wall post + lantern
  for (const x of [17, 23, 29]) for (const z of [67, 74]) {
    const post = { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" };
    g.set(x, 1, z, "stone_brick_wall", post); g.set(x, 2, z, "stone_brick_wall", post);
    g.set(x, 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // v2: the bay gables share the nave's pitch (rise 1 per 2 cells from the y27 eave); the wall stops under the roof
  for (let x = 14; x <= 32; x++) F(x, 28, 78, x, gableTop(Math.min(x - 13, 33 - x)), 78, AND);
  for (const x of [13, 14, 32, 33]) F(x, 1, 79, x, 27, 79, "stone_bricks");
  // great lunette x17..29
  const lun = (cx, hw, y0, y1, zA, zB, axis) => {};
  void lun;
  A(17, 4, 77, 29, 22, 78);
  for (let k = 0; k < 4; k++) A(18 + k, 23 + k, 77, 28 - k, 23 + k, 78);

  // ---- plot 0 nave side bars at the wings are handled above; gallery decks y12
  for (const [a, b] of [[0, 47], [48, 63], [64, 99]]) {
    F(a, 12, 15, b, 12, 18, SS);
    F(a, 12, 60, b, 12, 63, SS);
    F(a, 13, 18, b, 13, 18, "stone_brick_wall");
    F(a, 13, 60, b, 13, 60, "stone_brick_wall");
  }
  A(14, 12, 60, 32, 13, 63);                         // hall side is open

  // ---- plot 2: corner block (x 81..100, z 2..14)
  arcadeBay(g, 82, { z: 2 }); arcadeBay(g, 92, { z: 2 });
  F(80, 1, 3, 81, 25, 4, CAL);
  F(81, 1, 2, 81, 31, 2, CAL);
  F(81, 26, 2, 100, 31, 3, CAL); F(81, 1, 2, 100, 31, 3, CAL);
  F(90, 1, 2, 91, 31, 3, CAL);
  F(99, 1, 2, 100, 31, 14, CAL);                      // east wall x99..100
  F(81, 1, 4, 81, 31, 14, CAL);                       // west return
  F(81, 12, 4, 99, 12, 13, SS); F(81, 26, 4, 99, 26, 13, SS); F(81, 32, 2, 100, 32, 14, SS);
  F(81, 1, 14, 100, 31, 14, CAL);
  F(81, 1, 9, 96, 11, 9, CAL);
  for (const x0 of [82, 92]) {
    A(x0 + 3, 1, 9, x0 + 4, 3, 9);
    A(x0 + 1, 2, 9, x0 + 2, 5, 9); A(x0 + 5, 2, 9, x0 + 6, 5, 9);
    A(x0 + 2, 1, 14, x0 + 5, 7, 14); A(x0 + 3, 8, 14, x0 + 4, 8, 14);
    A(x0 + 2, 15, 2, x0 + 5, 20, 3); A(x0 + 3, 21, 2, x0 + 4, 21, 3);
  }
  A(81, 1, 14, 81, 7, 14);
  A(85, 29, 2, 86, 30, 3); A(95, 29, 2, 96, 30, 3);  // attic oculi
  A(99, 1, 5, 100, 7, 10); A(99, 8, 6, 100, 9, 9); A(99, 10, 7, 100, 10, 8); // east arches
  A(99, 15, 6, 100, 20, 9); A(99, 21, 7, 100, 21, 8);
  quoinCorner(g, 99, 2, 1, 31, { overwrite: true });

  // ---- plot 2 east end: nave x100 and bay hall x100
  const navH = (z) => { const m = Math.min(z, 78 - z); return m <= 33 ? 27 + Math.floor((m - 15) / 2) : 37; };
  for (let z = 15; z <= 63; z++) {
    const m = Math.min(z, 78 - z);
    const top = (m >= 34) ? 37 : navH(z) - 1;
    F(100, 1, z, 100, top, z, AND);
  }
  F(99, 12, 15, 99, 12, 18, SS);
  for (let z = 64; z <= 78; z++) F(100, 1, z, 100, Math.max(26, gableTop(Math.min(z - 64, 78 - z))), z, AND);
  // east lunettes
  A(100, 8, 33, 100, 26, 45); A(100, 27, 34, 100, 27, 44); A(100, 28, 35, 100, 28, 43); A(100, 29, 37, 100, 29, 41);
  A(100, 6, 68, 100, 20, 74); A(100, 21, 69, 100, 21, 73); A(100, 22, 70, 100, 22, 72);

  // ---- plot 2 cross-gables (x 67..79, 85..97) on the south face
  for (const x0 of [67, 85]) {
    F(x0, 1, 78, x0 + 12, 27, 78, AND);
    for (let x = x0 + 1; x <= x0 + 11; x++) F(x, 28, 78, x, gableTop(Math.min(x - x0, x0 + 12 - x)), 78, AND);
    A(x0 + 2, 6, 77, x0 + 10, 24, 78);
    A(x0 + 3, 25, 77, x0 + 9, 25, 78); A(x0 + 4, 26, 77, x0 + 8, 26, 78); A(x0 + 5, 27, 77, x0 + 7, 27, 78);
  }

  // ---- v2: glaze the great lunettes in the outer wall plane (later parts can't write into the shell's air):
  // gray panes, a polished_deepslate mullion down the centre column and a transom across the spring line
  const glaze = (plane, at, c, rows, spring) => {
    const pane = plane === "z"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    for (const [y, a, b] of rows) for (let u = a; u <= b; u++) {
      const [x, z] = plane === "z" ? [u, at] : [at, u];
      if (u === c || y === spring) g.set(x, y, z, "polished_deepslate"); else g.set(x, y, z, "gray_stained_glass_pane", pane);
    }
  };
  const body = (y0, y1, a, b) => Array.from({ length: y1 - y0 + 1 }, (_, i) => [y0 + i, a, b]);
  glaze("z", 78, 23, [...body(4, 22, 17, 29), [23, 18, 28], [24, 19, 27], [25, 20, 26], [26, 21, 25]], 22);
  for (const x0 of [67, 85]) {
    glaze("z", 78, x0 + 6, [...body(6, 24, x0 + 2, x0 + 10), [25, x0 + 3, x0 + 9], [26, x0 + 4, x0 + 8], [27, x0 + 5, x0 + 7]], 24);
  }
  glaze("x", 100, 39, [...body(8, 26, 33, 45), [27, 34, 44], [28, 35, 43], [29, 37, 41]], 26);
  glaze("x", 100, 71, [...body(6, 20, 68, 74), [21, 69, 73], [22, 70, 72]], 20);
}
