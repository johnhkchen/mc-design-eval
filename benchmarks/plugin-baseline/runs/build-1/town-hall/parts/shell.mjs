// Part: Masonry shell. Plinth, brick walls, pavilions, podium, floors y3/y10, ceiling y16, tower shaft, partitions,
// stair flights and the tower ladder. Openings, reserved cells, the string/cornice rings (y10, y16), tower bands
// (y27, y31, y35), quoin corner columns and the clock-face cells are left as air for the dressings and fittings.
import { stairFlight, ladderShaft } from "../vocab.mjs";

export function build(g) {
  const air = new Set(); // cells that stay open
  const key = (x, y, z) => `${x},${y},${z}`;
  const open = (x0, y0, z0, x1, y1, z1) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) air.add(key(x, y, z));
  };
  const put = (x0, y0, z0, x1, y1, z1, block) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++)
      if (!air.has(key(x, y, z))) g.set(x, y, z, block);
  };

  // ---- openings (plan OPENINGS) ----
  const storeys = (fn) => { fn(5, 9); fn(11, 14); }; // window rows (y9 is the flat arch row, left open)
  const winN = (planes, xs) => { for (const p of planes) for (const [a, b] of xs) { open(a, 5, p, b, 9, p); open(a, 11, p, b, 14, p); } };
  winN([9, 10], [[6, 8], [32, 34]]);
  winN([10], [[12, 13], [27, 28], [16, 17], [23, 24]]);
  open(19, 4, 10, 21, 9, 10); open(19, 11, 10, 21, 14, 10); // main door + Palladian window
  for (const x of [4, 36]) for (const [a, b] of [[12, 13], [22, 23]]) { open(x, 5, a, x, 9, b); open(x, 11, a, x, 14, b); }
  for (const [a, b] of [[6, 7], [11, 12], [16, 17], [23, 24], [28, 29], [33, 34]]) { open(a, 5, 26, b, 9, 26); open(a, 11, 26, b, 14, 26); }
  open(20, 4, 26, 20, 6, 26); open(19, 11, 26, 21, 14, 26); // rear door + transom, upper window
  // tower: archway to the hall, belfry faces, clock faces
  open(19, 4, 14, 20, 6, 14);
  open(19, 32, 10, 21, 34, 10); open(19, 32, 14, 21, 34, 14); open(18, 32, 11, 18, 34, 13); open(22, 32, 11, 22, 34, 13);
  open(19, 28, 10, 21, 30, 10); open(19, 28, 14, 21, 30, 14); open(18, 28, 11, 18, 30, 13); open(22, 28, 11, 22, 30, 13);
  // string course, cornice and tower bands
  for (const y of [10, 16]) { open(4, y, 9, 36, y, 9); open(4, y, 26, 36, y, 26); open(4, y, 9, 4, y, 26); open(36, y, 9, 36, y, 26); open(4, y, 10, 36, y, 10); }
  open(18, 27, 10, 22, 27, 14); open(18, 31, 10, 22, 31, 14); open(18, 35, 10, 22, 35, 14);
  open(18, 35, 9, 22, 35, 15);
  // quoin corner columns (front pavilion corners, rear corners, tower corners)
  for (const [x, z] of [[4, 9], [10, 9], [30, 9], [36, 9], [4, 26], [36, 26]]) open(x, 4, z, x, 15, z);
  for (const [x, z] of [[18, 10], [22, 10], [18, 14], [22, 14]]) open(x, 17, z, x, 34, z);
  // doorways inside
  open(10, 4, 16, 10, 5, 16); open(30, 4, 16, 30, 5, 16);
  open(12, 4, 14, 16, 7, 14); open(24, 4, 14, 28, 7, 14);
  open(15, 11, 14, 15, 12, 14); open(25, 11, 14, 25, 12, 14);
  open(19, 11, 14, 20, 12, 14); // council chamber to the clock room (the ladder alone is no walk-in)
  // reserved: chimneys (own footing), portico columns, tower interior
  const chim = [[5, 17], [34, 17]];
  for (const [x, z] of chim) open(x, 1, z, x + 1, 23, z + 1);
  open(15, 4, 6, 25, 14, 6); open(19, 4, 11, 21, 34, 13);

  // ---- plinth, floor, podium ----
  put(4, 1, 10, 36, 2, 26, "polished_andesite");
  put(4, 1, 9, 10, 2, 9, "polished_andesite"); put(30, 1, 9, 36, 2, 9, "polished_andesite");
  put(4, 3, 10, 36, 3, 26, "stone_bricks");
  put(4, 3, 9, 10, 3, 9, "stone_bricks"); put(30, 3, 9, 36, 3, 9, "stone_bricks");
  put(15, 1, 6, 25, 3, 9, "stone_bricks");

  // ---- walls ----
  const wallBox = (x0, z0, x1, z1) => {
    put(x0, 4, z0, x1, 15, z0, "bricks"); put(x0, 4, z1, x1, 15, z1, "bricks");
    put(x0, 4, z0, x0, 15, z1, "bricks"); put(x1, 4, z0, x1, 15, z1, "bricks");
  };
  wallBox(4, 10, 36, 26);
  put(4, 4, 9, 10, 15, 9, "bricks"); put(30, 4, 9, 36, 15, 9, "bricks");
  put(4, 4, 9, 4, 15, 10, "bricks"); put(10, 4, 9, 10, 15, 10, "bricks");
  put(30, 4, 9, 30, 15, 10, "bricks"); put(36, 4, 9, 36, 15, 10, "bricks");
  // tower shaft (footing to the belfry)
  put(18, 1, 10, 22, 34, 14, "bricks");
  // the hollow is carved by not writing: re-open it (air set already covers x19..21 z11..13 y4..34)

  // ---- partitions ----
  put(10, 4, 11, 10, 9, 25, "bricks"); put(30, 4, 11, 30, 9, 25, "bricks"); // office walls
  put(11, 4, 14, 17, 9, 14, "bricks"); put(23, 4, 14, 29, 9, 14, "bricks"); // bay walls, arcade gaps open
  put(5, 11, 14, 17, 15, 14, "bricks"); put(23, 11, 14, 35, 15, 14, "bricks"); // committee rooms

  // ---- floor y10 and ceiling y16 ----
  const wells = [[11, 12], [28, 29]];
  for (let x = 5; x <= 35; x++) for (let z = 11; z <= 25; z++) {
    if (x >= 18 && x <= 22 && z <= 14) continue; // tower
    if (wells.some(([a, b]) => x >= a && x <= b && z >= 18 && z <= 24)) { /* stair well: floor open */ } else
      if (!air.has(key(x, 10, z))) g.set(x, 10, z, "spruce_planks");
  }
  // y10 sits in `air` (string course ring) only as a blanket; floor was set above, so no clash: the ring is x4/36, z9/10/26 cells
  for (let x = 5; x <= 35; x++) for (let z = 11; z <= 25; z++) {
    if (x >= 18 && x <= 22 && z <= 14) continue;
    if (chim.some(([cx, cz]) => x >= cx && x <= cx + 1 && z >= cz && z <= cz + 1)) continue;
    g.set(x, 16, z, "oak_planks");
  }

  // ---- tower floor slabs (ladder hole at x21 z13) ----
  for (const y of [10, 31]) for (let x = 19; x <= 21; x++) for (let z = 11; z <= 13; z++)
    if (!(x === 21 && z === 13)) g.set(x, y, z, "stone_brick_slab", { type: "bottom" });

  // ---- stairs ----
  stairFlight(g, 11, 12, 24, 4, { dir: "north", steps: 7, rail: "east" });
  stairFlight(g, 28, 29, 24, 4, { dir: "north", steps: 7, rail: "west" });
  ladderShaft(g, { x: 21, z: 13, y0: 4, y1: 31, facing: "north" });
}
