// Part "masonry shell": brick walls with a polished_andesite plinth, string courses, floors at y 13 and 18, flat partitions,
// quoins. Every opening / trim cell the plan gives to a later part is left as air (those parts build into air only).
// Stair flights belong to the stairs part (parts/stairs.mjs); the shell leaves the wells open.
import { brickWall, quoins } from "../vocab.mjs";

const inR = (v, a, b) => v >= a && v <= b;
const any = (rs, x, y) => rs.some(([x0, x1, y0, y1]) => inR(x, x0, x1) && inR(y, y0, y1));

export function build(g) {
  const prot = (x, y, z) => g.protected?.has(`${x},${y},${z}`);
  const free = (x, y, z) => /(^|:)(cave_)?air$/.test(g.blockAt(x, y, z));
  const put = (x, y, z, b, s) => { if (!prot(x, y, z) && free(x, y, z)) g.set(x, y, z, b, s); };
  const wallCell = (x, y, z) => brickWall(g, [x, y, z, x, y, z]);
  const trim = (x, y, z) => put(x, y, z, "smooth_sandstone");
  const floor = (y, x0, x1, z0, z1, mat) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(x, y, z, mat); };

  // ---- front wall z 19: openings (x0,x1,y0,y1) left for shopfronts / windows / oriels / door ----
  const front = [
    [4, 20, 7, 9],                 // open shop fronts
    [5, 11, 10, 12], [13, 19, 10, 12], [4, 4, 10, 12], [12, 12, 10, 12], [20, 20, 10, 12], // fascia + console cells
    [3, 3, 6, 12], [21, 21, 6, 12], // end pilasters
    [5, 5, 15, 17], [11, 11, 15, 17], [13, 13, 15, 17], [19, 19, 15, 17],
    [5, 5, 19, 21], [11, 11, 19, 21], [13, 13, 19, 21], [19, 19, 19, 21],
    [7, 9, 15, 17], [15, 17, 15, 17], [7, 9, 19, 21], [15, 17, 19, 21], // oriel backs
    [23, 24, 15, 17], [23, 24, 19, 21], // stair windows
    [23, 24, 7, 9],                 // flats' door + fanlight
    [22, 25, 10, 10], // door hood stairs sit at z 20; keep the brick
  ].filter((r) => !(r[2] === 10 && r[0] === 22));
  for (let x = 3; x <= 26; x++) for (let y = 6; y <= 23; y++) {
    if (any(front, x, y)) continue;
    if (y === 18 || y === 23) trim(x, y, 19); else wallCell(x, y, 19);
  }
  // ---- rear wall z 2 ----
  const rear = [[7, 7, 6, 7], [15, 15, 6, 7], [23, 23, 7, 8],
    [6, 6, 15, 16], [10, 10, 15, 16], [14, 14, 15, 16], [18, 18, 15, 16], [23, 24, 15, 16],
    [6, 6, 20, 21], [10, 10, 20, 21], [14, 14, 20, 21], [18, 18, 20, 21], [23, 24, 20, 21]];
  for (let x = 3; x <= 26; x++) for (let y = 6; y <= 23; y++) {
    if (any(rear, x, y)) continue;
    if (y === 18) trim(x, y, 2); else wallCell(x, y, 2);
  }
  // ---- end walls x 3, x 26 and the shared wall x 21 (corridor doors at z 3) ----
  for (let z = 3; z <= 18; z++) for (let y = 6; y <= 23; y++) {
    wallCell(3, y, z); wallCell(26, y, z);
    if (!(z === 3 && (inR(y, 14, 15) || inR(y, 19, 20)))) wallCell(21, y, z);
  }
  // ---- floors: planks in the flats, stone in the stair bay and aisles ----
  for (const y of [13, 18]) {
    floor(y, 4, 20, 3, 18, "oak_planks");
    if (y === 13) { floor(y, 22, 25, 3, 9, "oak_planks"); floor(y, 24, 25, 10, 18, "oak_planks"); floor(y, 22, 23, 16, 18, "oak_planks"); }
    else { floor(y, 22, 25, 3, 11, "oak_planks"); floor(y, 24, 25, 12, 18, "oak_planks"); floor(y, 22, 23, 17, 18, "oak_planks"); }
  }
  // The keeper aisles sit at the shop floor level (feet at y 6, on the y 5 ground course) like the sockets' service cells, so
  // the floor is stone ON the ground (y 5), not a course above it; nothing is laid at y 6 in x 4..20 z 3..9.
  const aisle = [[4, 20, 3, 5], [8, 11, 6, 9], [16, 20, 6, 9]];
  for (const [x0, x1, z0, z1] of aisle) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.set(x, 5, z, "smooth_stone");
  floor(6, 22, 25, 3, 18, "smooth_stone");
  // ---- keeper partition between the tenants ----
  for (let y = 6; y <= 12; y++) for (let z = 3; z <= 5; z++) wallCell(12, y, z);
  // ---- flat partitions: corridor wall z 5, party wall x 12, front/back partition z 11 ----
  const doorsZ5 = [[8, 8], [16, 16]], doorsZ11 = [[7, 7], [15, 15]];
  for (const [y0, y1] of [[14, 17], [19, 22]]) for (let y = y0; y <= y1; y++) {
    const lowDoor = y - y0 <= 1;
    for (let x = 4; x <= 20; x++) {
      if (!(lowDoor && doorsZ5.some(([a, b]) => inR(x, a, b)))) wallCell(x, y, 5);
      if (x !== 12 && !(lowDoor && doorsZ11.some(([a, b]) => inR(x, a, b)))) wallCell(x, y, 11);
    }
    for (let z = 6; z <= 18; z++) wallCell(12, y, z);
  }
  // ---- quoins at the four corners (front/rear faces, and the end faces) ----
  for (const x of [3, 26]) {
    quoins(g, x, [19, 2]);
    for (const z of [3, 18]) quoins(g, x, [z], { yBands: [15, 19] }); // end-face quoins, staggered
  }
}
