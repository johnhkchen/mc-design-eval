// SPDX-License-Identifier: AGPL-3.0-or-later
// Masonry shell: main and wing walls (bricks, deepslate plinth), quartz trim (lintels, quoins, string courses, eaves),
// floors y13/18/23 and the ground floors, interior partitions, aisle partitions. Openings stay air. The street and
// lot surface are laid by build.mjs; garden detail belongs to the grounds part.
import { brickWall, quoinPair, aislePartition, QUARTZ, FLOOR_SPRUCE, FLOOR_STONE } from "../vocab.mjs";

export function build(g) {
  // ---- trim cells (quartz), written after the walls; walls leave them as holes ----
  const trim = new Set();
  const T = (x, y, z) => trim.add(`${x},${y},${z}`);
  const row = (x0, x1, y, z0, z1) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) T(x, y, z); };
  const quoins = [];
  const Q = (x, z, y) => { quoins.push([x, z, y]); T(x, y, z); T(x, y + 1, z); };

  // openings, as [x0,y0,z0,x1,y1,z1] boxes
  const open = [];
  const O = (x0, y0, z0, x1, y1, z1) => open.push([x0, y0, z0, x1, y1, z1]);

  // front (z 5, glass at z 6 behind a reveal)
  O(6, 6, 5, 7, 8, 5); O(6, 10, 5, 7, 11, 5);
  for (const [a, b] of [[6, 7], [11, 12], [16, 17]]) for (const y of [14, 19]) {
    O(a, y, 5, b, y + 2, 6);
    row(a - 1, b + 1, y + 3, 5, 5);
  }
  // east x 19
  for (const z of [9, 17]) for (const y of [14, 19]) { O(19, y, z, 19, y + 2, z + 1); row(19, 19, y + 3, z - 1, z + 2); }
  // west x 4
  for (const z of [9, 18]) for (const y of [14, 19]) { O(4, y, z, 4, y + 2, z); row(4, 4, y + 3, z - 1, z + 1); }
  // rear z 22
  O(16, 6, 22, 16, 7, 22); O(12, 7, 22, 12, 8, 22); row(11, 13, 9, 22, 22);
  O(6, 6, 22, 6, 7, 22); O(7, 14, 22, 7, 15, 22);
  for (const [a, b] of [[13, 14], [16, 17]]) for (const y of [14, 19]) { O(a, y, 22, b, y + 2, 22); row(a - 1, b + 1, y + 3, 22, 22); }
  // wing
  O(11, 6, 27, 11, 7, 27); O(11, 7, 24, 11, 9, 25); row(11, 11, 10, 23, 26);
  for (const [a, b] of [[24, 25], [27, 28]]) { O(11, 14, a, 11, 16, b); row(11, 11, 17, a - 1, b + 1); }
  for (const x of [5, 10]) { O(x, 14, 30, x, 16, 30); row(x - 1, x + 1, 17, 30, 30); }
  O(4, 14, 26, 4, 16, 27); row(4, 4, 17, 25, 28);

  // string courses y 18 and eaves y 23
  for (const y of [18, 23]) { row(4, 19, y, 5, 5); row(4, 19, y, 22, 22); row(4, 4, y, 6, 21); row(19, 19, y, 6, 21); }
  row(4, 4, 18, 23, 30); row(11, 11, 18, 23, 30); row(4, 11, 18, 30, 30);
  // quoins on the corners and the side faces next to them
  for (const y of [14, 18, 22]) for (const [x, z] of [[4, 5], [19, 5], [4, 6], [19, 6], [4, 22], [19, 22], [4, 21], [19, 21]]) Q(x, z, y);
  for (const y of [7, 11]) for (const x of [4, 19]) Q(x, 5, y);
  for (const y of [14, 18]) for (const [x, z] of [[4, 30], [11, 30], [4, 29], [11, 29]]) Q(x, z, y);

  const inBox = (b, x, y, z) => x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5];
  const wall = (box, plinth = true) => {
    const extra = [];
    for (let x = box[0]; x <= box[3]; x++) for (let y = box[1]; y <= box[4]; y++) for (let z = box[2]; z <= box[5]; z++)
      if (trim.has(`${x},${y},${z}`)) extra.push([x, y, z, x, y, z]);
    return brickWall(g, box, plinth, [...open.filter((o) => true), ...extra]);
  };

  // ---- walls ----
  wall([4, 5, 5, 9, 12, 5]);            // front, lobby bay
  wall([19, 5, 5, 19, 12, 5]);          // front, east pier
  wall([4, 13, 5, 19, 23, 5], false);   // front, upper (outer leaf)
  wall([5, 13, 6, 18, 23, 6], false);   // front, upper (inner leaf)
  wall([4, 5, 6, 4, 12, 21]); wall([4, 13, 6, 4, 23, 21], false);   // west
  wall([19, 5, 6, 19, 12, 21]); wall([19, 13, 6, 19, 23, 21], false); // east
  wall([4, 5, 22, 19, 12, 22]); wall([4, 13, 22, 19, 23, 22], false); // rear
  wall([4, 5, 23, 4, 12, 29]); wall([4, 13, 23, 4, 18, 29], false);   // wing west
  wall([11, 5, 23, 11, 12, 29]); wall([11, 13, 23, 11, 18, 29], false); // wing east
  wall([4, 5, 30, 11, 12, 30]); wall([4, 13, 30, 11, 18, 30], false);   // wing south
  // trim
  for (const k of trim) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, QUARTZ); }

  // ---- interior partitions (plain brick, doors air) ----
  const part = (box, doors = []) => brickWall(g, box, false, doors);
  part([9, 5, 6, 9, 12, 21], [[9, 6, 20, 9, 7, 20]]);                         // lobby / shop
  part([9, 14, 7, 9, 17, 21], [[9, 14, 9, 9, 15, 9], [9, 14, 18, 9, 15, 18]]); // first floor hall wall
  part([9, 19, 7, 9, 22, 21], [[9, 19, 13, 9, 20, 13]]);                      // second floor hall wall
  part([10, 19, 12, 18, 22, 12], [[17, 19, 12, 17, 20, 12]]);                 // parents / corridor
  part([10, 19, 14, 18, 22, 14], [[11, 19, 14, 11, 20, 14], [16, 19, 14, 16, 20, 14]]); // corridor / children
  part([14, 19, 15, 14, 22, 21]);                                             // child A / B
  part([5, 19, 17, 8, 22, 17], [[7, 19, 17, 7, 20, 17]]);                     // hall / bath
  aislePartition(g, [14, 18], 19, { y0: 5, y1: 12 });

  // ---- floors ----
  const fl = (x0, z0, x1, z1, y, b) => g.fill([x0, y, z0], [x1, y, z1], b);
  const planks = "oak_planks";
  // y13: well x7..8 z10..15
  for (const [a, b, c, d] of [[5, 7, 6, 21], [9, 7, 18, 21], [7, 7, 8, 9], [7, 16, 8, 21]]) fl(a, b, c, d, 13, planks);
  // y18: well x5..6 z12..16
  for (const [a, b, c, d] of [[7, 7, 18, 21], [5, 7, 6, 11], [5, 17, 6, 21]]) fl(a, b, c, d, 18, planks);
  // y23: hatch x16 z20
  for (const [a, b, c, d] of [[5, 7, 18, 19], [5, 20, 15, 21], [17, 20, 18, 21]]) fl(a, b, c, d, 23, FLOOR_SPRUCE);
  fl(5, 23, 10, 29, 13, planks); fl(5, 23, 10, 29, 18, planks);
  // ground floors (the sockets own the shop itself)
  fl(5, 6, 8, 21, 5, FLOOR_SPRUCE);
  fl(10, 16, 13, 21, 5, FLOOR_STONE); fl(14, 20, 18, 21, 5, FLOOR_STONE);
  fl(5, 23, 10, 29, 5, FLOOR_STONE);

  // quoins are set above as plain quartz cells; quoinPair kept for the paired pattern check
  void quoinPair;
}
