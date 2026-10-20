// Part 1: brick shells and pavilion (plan.md PARTS 1). All openings and reserved cells are left air.
import { groundCourse, brickBlock, cornice, pavilion } from "../vocab.mjs";

const rows = (xs, ys, z) => xs.flatMap((x) => ys.flatMap((y) => [[x, y, z], [x, y + 1, z]]));
const rowsX = (x, zs, ys) => zs.flatMap((z) => ys.flatMap((y) => [[x, y, z], [x, y + 1, z]]));
const W3 = [2, 5, 8];
const door = (x, z) => [[x, 1, z], [x, 2, z], [x, 3, z], [x + 1, 1, z], [x + 1, 2, z], [x + 1, 3, z]];

export function build(g) {
  groundCourse(g, 0, 7, 23, 14);
  groundCourse(g, 2, 1, 21, 6);
  groundCourse(g, 24, 6, 49, 13);
  groundCourse(g, 24, 0, 30, 5);
  groundCourse(g, 43, 0, 49, 5);
  groundCourse(g, 79, 1, 92, 6);

  // museum
  const mx = [2, 4, 6, 8, 10, 13, 15, 17, 19, 21];
  brickBlock(g, 0, 7, 23, 14, {
    holes: [
      ...rows(mx, W3, 14), ...door(11, 14),
      ...rows(mx, [8], 7), ...door(11, 7).slice(0, 4),
      ...rowsX(0, [9, 12], W3), ...rowsX(23, [9, 12], W3),
    ],
  });
  cornice(g, 0, 23, 15, "south");
  cornice(g, 0, 23, 6, "north");
  pavilion(g, 2, 1, 21, 6, {
    mullions: { x: [2, 6, 10, 13, 17, 21], z: [1, 4, 6] },
    open: (x, y, z) => z === 1 && (x === 11 || x === 12) && (y === 1 || y === 2),
  });

  // barracks
  const bx = [26, 28, 30, 32, 34, 39, 41, 43, 45, 47];
  brickBlock(g, 24, 6, 49, 13, {
    holes: [
      ...rows(bx, W3, 13), ...door(36, 13),
      ...rows([32, 34, 39, 41], W3, 6), ...door(36, 6),
      ...rowsX(24, [8, 11], W3), ...rowsX(49, [8, 11], W3),
    ],
  });
  cornice(g, 24, 49, 14, "south");
  cornice(g, 31, 42, 5, "north");
  const wing = (x0, x1, nx, ex) =>
    brickBlock(g, x0, 0, x1, 5, { y1: 6, holes: [...rows(nx, [2, 5], 0), ...rowsX(ex, [2, 4], [2, 5])] });
  wing(24, 30, [26, 28], 24);
  wing(43, 49, [45, 47], 49);

  // visitor center
  brickBlock(g, 79, 1, 92, 6, {
    y1: 4,
    holes: [
      ...rows([80, 82, 89, 91], [2], 6), ...door(85, 6),
      ...rowsX(79, [3], [2]), ...rowsX(92, [3], [2]),
      ...rows([82, 89], [2], 1),
    ],
  });
}
