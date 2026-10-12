// Part "Store shell": floors, walls, plinth, piers, sign band, partitions. Openings and reserved cells are never written (stay air).
const W = "white_concrete", G = "gray_concrete", K = "black_concrete", R = "red_concrete";
const inb = (x, y, z, [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// openings left as air (plan OPENINGS) plus interior doorways and the slot recess
const OPEN = [
  [11, 1, 24, 12, 4, 24], [14, 1, 24, 15, 4, 24], [16, 1, 24, 17, 4, 24], [18, 1, 24, 19, 4, 24], [21, 1, 24, 22, 4, 24],
  [28, 2, 24, 28, 6, 24], [28, 2, 25, 28, 6, 25], // slot recess + glass cell
  [9, 2, 26, 9, 4, 31], [32, 1, 31, 32, 2, 31], [29, 1, 33, 29, 2, 33],
  [24, 1, 30, 24, 2, 30], [27, 1, 27, 27, 2, 27], [29, 1, 27, 29, 2, 27], [28, 1, 29, 28, 2, 29],
];

export function build(g) {
  // floors
  g.fill([9, 0, 24], [23, 0, 33], "smooth_quartz");
  g.fill([24, 0, 24], [32, 0, 33], "polished_andesite");

  const open = (x, y, z) => OPEN.some((b) => inb(x, y, z, b));
  const put = (x, y, z, b) => { if (!open(x, y, z)) g.set(x, y, z, b); };

  const wallCell = (x, y, z, body) => {
    if (y === 1) return put(x, y, z, K); // plinth course
    put(x, y, z, body);
  };
  // shop ring x9..23, z24..33, y1..5
  for (let y = 1; y <= 5; y++)
    for (let x = 9; x <= 23; x++)
      for (let z = 24; z <= 33; z++) {
        if (x !== 9 && x !== 23 && z !== 24 && z !== 33) continue;
        if (z === 24) {
          if (y === 5) put(x, y, z, R); // red sign band
          else if (x === 23) put(x, y, z, K); // slim black pier
          else if (x === 13 || x === 20) put(x, y, z, K); // mullions
          else wallCell(x, y, z, W);
        } else wallCell(x, y, z, W);
      }
  // west window sill course: y1 black already; sill under band
  // service ring x24..32, z24..33, y1..7 (x=24 is the shared wall, rises above the shop roof)
  for (let y = 1; y <= 7; y++)
    for (let x = 24; x <= 32; x++)
      for (let z = 24; z <= 33; z++) {
        if (x !== 24 && x !== 32 && z !== 24 && z !== 33) continue;
        if (z === 24 && y >= 2 && (x === 27 || x === 29) && y <= 6) put(x, y, z, K); // slot frames
        else wallCell(x, y, z, G);
      }
  // partitions
  for (let y = 1; y <= 7; y++) {
    for (let z = 25; z <= 28; z++) { put(27, y, z, G); put(29, y, z, G); }
    for (let x = 25; x <= 31; x++) put(x, y, 29, G);
  }
}
