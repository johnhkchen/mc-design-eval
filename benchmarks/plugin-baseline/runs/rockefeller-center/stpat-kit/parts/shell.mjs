// Part "marble shell": plot 0 masses per plan SITE: plinth + floor, hollow marble walls with window/portal cells left unplaced,
// buttress piers, transept turrets, choir apse, ambulatory chapels, Lady Chapel, pierced parapets. Towers/centre front belong to P2, roofs to P3.
import { marble_wall, pierced_parapet, string_course, POLISHED_ANDESITE } from "../vocab.mjs";

const mx = (g, x, y, z) => marble_wall(g, [x, y, z, x, y, z]);
const inBox = (b, x, y, z) => x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5];

// A wall line (x0,z0)-(x1,z1) from y 3 to top; plinth y 0..2 under it; `holes` boxes [x0,y0,z0,x1,y1,z1] stay unplaced.
function seg(g, x0, z0, x1, z1, top, holes = []) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
      for (let y = 0; y <= 2; y++) g.set(x, y, z, POLISHED_ANDESITE);
      for (let y = 3; y <= top; y++) if (!holes.some((h) => inBox(h, x, y, z))) mx(g, x, y, z);
    }
}
const floor = (g, x0, z0, x1, z1) => g.fill([x0, 0, z0], [x1, 2, z1], POLISHED_ANDESITE);
const mir = (z) => 40 - z;

export function build(g) {
  // ---- floors (plinth block y 0..2 under every mass) ----
  for (const r of [[11,14,45,26],[11,4,38,13],[11,27,38,36],[39,0,45,13],[39,27,45,40],[46,0,58,40],[59,0,65,13],[59,27,65,40],
    [59,14,79,26],[66,6,83,13],[66,27,83,34],[84,9,89,14],[84,26,89,31],[80,14,84,26],[85,16,99,24],[100,16,104,24]]) floor(g, ...r);

  // ---- high vessel: nave and choir clerestory walls (y 3..32), windows y 24..32 ----
  const bays = (xs) => xs.map((x) => [x, 24, 0, x + 2, 32, 99]);
  const clere = (xs, z) => bays(xs).map((b) => [b[0], b[1], z, b[3], b[4], z]);
  for (const z of [14, 26]) {
    seg(g, 11, z, 45, z, 32, clere([12,18,24,30,36,42], z));
    seg(g, 59, z, 79, z, 32, clere([60,66,72], z));
    pierced_parapet(g, [11, z, 45, z], 33);
    pierced_parapet(g, [59, z, 79, z], 33);
  }
  // transept sides and ends
  for (const x of [46, 58]) for (const [a, b] of [[0, 13], [27, 40]]) seg(g, x, a, x, b, 32);
  for (const z of [0, 40]) {
    seg(g, 46, z, 58, z, 33, [[50, 3, z, 54, 11, z], [48, 15, z, 56, 30, z]]);
    pierced_parapet(g, [46, z, 58, z], 34);
    // the turrets stand on the coping at x 46 and x 58: a top slab there lets their marble sit flush, not on half a block of air
    for (const x of [46, 58]) g.set(x, 35, z, "polished_diorite_slab", { type: "top", waterlogged: "false" });
  }
  // turrets: solid 3 x 3 at the high vessel corners, to y 42
  for (const x of [44, 58]) for (const z of [0, 38]) marble_wall(g, [x, 3, z, x + 2, 42, z + 2]);

  // ---- apse (3-sided, stepped): column x covers z e(x)..e(x+1) ----
  const e = { 80: 14, 81: 14, 82: 15, 83: 16, 84: 17 };
  for (let x = 80; x <= 84; x++) {
    const a = e[x], b = x === 84 ? 23 : (e[x + 1] ?? a);
    const hole = (zz) => (x === 82 && (zz === 15 || zz === 25)) || (x === 84 && zz >= 19 && zz <= 21) ? [[x, 24, zz, x, 32, zz]] : [];
    for (const zz of x === 84 ? [] : []) hole(zz);
    for (let z = a; z <= b; z++) for (const zz of x === 84 ? [z] : [z, mir(z)]) {
      const win = (x === 82 && (zz === 15 || zz === 25)) || (x === 84 && zz >= 19 && zz <= 21);
      seg(g, x, zz, x, zz, 32, win ? [[x, 24, zz, x, 32, zz]] : []);
    }
  }

  // ---- low aisles: wall y 3..17, string course y 18, pierced parapet y 19..20 ----
  const lan = (xs, z) => xs.map((x) => [x, 6, z, x + 2, 16, z]);
  const pier = (x, z, top) => { for (let y = 0; y <= 2; y++) g.set(x, y, z, POLISHED_ANDESITE); for (let y = 3; y <= top; y++) mx(g, x, y, z); };
  const aisleWall = (x0, z0, x1, z1, holes, face) => {
    seg(g, x0, z0, x1, z1, 17, holes);
    const [a, b, c, d] = face === "north" ? [x0, z0 - 1, x1, z0 - 1] : face === "south" ? [x0, z0 + 1, x1, z0 + 1] : face === "west" ? [x0 - 1, z0, x0 - 1, z1] : [x0 + 1, z0, x0 + 1, z1];
    if (Math.min(b, d) >= 0 && Math.max(b, d) <= 41 && Math.min(a, c) >= 0) string_course(g, a, b, c, d, 18, face);
    pierced_parapet(g, [x0, z0, x1, z1], 19);
  };
  for (const [z, f] of [[4, "north"], [36, "south"]]) {
    aisleWall(11, z, 39, z, lan([12,18,24,30,36], z), f);
    for (const x of [16, 22, 28, 34]) pier(x, z + (f === "north" ? -1 : 1), 22);
  }
  for (const [z, f] of [[0, "north"], [40, "south"]]) {
    aisleWall(39, z, 45, z, lan([41], z), f);
    aisleWall(59, z, 65, z, lan([61], z), f);
  }
  const zr = (a, b) => [Math.min(a, b), Math.max(a, b)];
  for (const [a, b] of [[0, 4], [36, 40]]) aisleWall(39, a, 39, b, [], "west");
  aisleWall(65, 0, 65, 13, [], "east"); aisleWall(65, 27, 65, 40, [], "east");
  for (const [z, f] of [[6, "north"], [34, "south"]]) {
    aisleWall(66, z, 83, z, lan([66,72,79], z), f);
    for (const x of [70, 76, 82]) pier(x, z + (f === "north" ? -1 : 1), 22);
  }
  aisleWall(83, 6, 83, 13, [], "east"); aisleWall(83, 27, 83, 34, [], "east");

  // ---- ambulatory chapels (walls y 3..20) ----
  for (const [z0, z1, zo] of [[9, 14, 9], [26, 31, 31]]) {
    seg(g, 84, zo, 89, zo, 20, [[85, 6, zo, 87, 14, zo]]);
    seg(g, 89, z0, 89, z1, 20);
    pierced_parapet(g, [84, zo, 89, zo], 21);
  }

  // ---- Lady Chapel (walls y 3..20, parapet y 21) and five-sided apse ----
  const lc = [86, 89, 93, 97].map((x, i) => [x, 5, 0, x + (i === 0 ? 1 : 2), 18, 0]);
  for (const z of [16, 24]) {
    seg(g, 85, z, 99, z, 20, lc.map((b) => [b[0], b[1], z, b[3], b[4], z]));
    pierced_parapet(g, [85, z, 99, z], 21);
    for (const x of [88, 92, 96]) pier(x, z + (z === 16 ? -1 : 1), 21);
  }
  const L = { 100: 16, 101: 17, 102: 18, 103: 18, 104: 19 };
  for (let x = 100; x <= 104; x++) {
    const a = L[x], b = x === 104 ? 21 : L[x + 1];
    for (let z = a; z <= b; z++) for (const zz of x === 104 ? [z] : [z, mir(z)]) {
      const win = (x === 101 && (zz === 18 || zz === 22)) || (x === 104 && zz === 20);
      seg(g, x, zz, x, zz, 20, win ? [[x, 5, zz, x, 18, zz]] : []);
    }
  }
}
