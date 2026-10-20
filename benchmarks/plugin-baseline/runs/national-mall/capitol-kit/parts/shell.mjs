// P1 Masonry shell: rusticated podiums, 2-thick walls, smooth_stone core, decks, connectors, central block, antae,
// west steps, arcade podium, terrace plinths. Window/door/arch cells and RESERVED cells are never written (left unset,
// so the later parts can fill them).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { G, WALL, RUSTIC, CORE, DECK_SLAB, westSteps } from "../vocab.mjs";

const key = (x, y, z) => `${x},${y},${z}`;
const MZ = (z) => 95 - z;
const FLIP = { north: "south", south: "north", east: "east", west: "west" };
const DIR = { west: [1, 0], east: [-1, 0], north: [0, 1], south: [0, -1] }; // inward step

export function build(g) {
  const R = new Set();   // reserved: never written
  const P = new Set();   // placed by this part
  const res = (x, y0, y1, z) => { for (let y = y0; y <= y1; y++) R.add(key(x, y, z)); };
  const put = (x, y, z, block, state) => {
    const k = key(x, y, z);
    if (R.has(k) || P.has(k)) return;
    P.add(k);
    if (state) g.set(x, y, z, block, state); else g.set(x, y, z, block);
  };
  const box = (x0, x1, y0, y1, z0, z1, block, state) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) put(x, y, z, block, state);
  };

  // ---- reserved cells: windows (outer recess, pane cell, glow cell), doors, arches, columns, pediments, dome, cupolas, skylights
  // face = outward side; wall = outer wall coordinate; pos = coordinate along the face.
  const win = (face, wall, pos, tall, short, lintel = 1, h = [6, 7]) => {
    const [dx, dz] = DIR[face];
    for (let k = 0; k < 3; k++) {
      const x = face === "west" || face === "east" ? wall + dx * k : pos;
      const z = face === "north" || face === "south" ? wall + dz * k : pos;
      const zz = face === "west" || face === "east" ? pos : z;
      const ranges = [];
      if (tall) ranges.push([h[0], h[1] + (k === 0 ? lintel : 0)]);
      if (short) ranges.push([9, 10]);
      for (const [a, b] of ranges) res(x, a, b, zz);
    }
  };
  const wingWins = (m) => {
    const f = (face) => (m ? FLIP[face] : face);
    const Z = (z) => (m ? MZ(z) : z);
    for (let z = 4; z <= 16; z += 2) win(f("west"), 5, Z(z), true, true);
    for (const z of [3, 5, 15, 17]) win("east", 33, Z(z), true, true);
    for (const z of [7, 9, 11, 13]) win("east", 33, Z(z), true, false);
    for (let x = 5; x <= 31; x += 2) win(f("north"), m ? 93 : 2, x, true, true);
    for (const x of [5, 7, 9, 11, 13, 29, 31, 33]) win(f("south"), m ? 77 : 18, x, true, true);
    res(33, 5, 7, Z(10)); // east door
    for (let z = 4; z <= 16; z += 2) for (let x = 2; x <= 4; x++) res(x, G(x, 0), 3, m ? MZ(z) : z); // podium arches
  };
  wingWins(false); wingWins(true);
  for (const [z0, mm] of [[20, false], [71, true]]) for (const dz of [0, 2, 4]) {
    win("west", 15, z0 + dz, true, true); win("east", 27, z0 + dz, true, true);
  }
  for (let z = 28; z <= 40; z += 2) { win("west", 10, z, true, true); win("west", 10, MZ(z), true, true); }
  for (let z = 27; z <= 35; z += 2) { win("east", 29, z, true, true); win("east", 29, MZ(z), true, true); }
  for (const x of [11, 13, 29]) { win("north", 26, x, true, false); win("south", 69, x, true, false); }
  for (const z of [42, 44, 46, 49, 51, 53]) win("west", 10, z, true, false, 1, [6, 8]);
  for (const z of [47, 48]) { res(10, 5, 7, z); res(29, 5, 7, z); }
  for (const z of [38, 57]) for (const x of [30, 31]) res(x, 6, 7, z);
  // West Front arcade arches: x0 recess, x1 pane, x2 shroomlight, y1..3
  for (const z of [42, 44, 46, 47, 48, 49, 51, 53]) for (let x = 0; x <= 2; x++) res(x, 1, 3, z);
  // x0 y5 balustrade, x8 loggia columns
  for (let z = 41; z <= 54; z++) res(0, 5, 5, z);
  for (const z of [41, 43, 45, 47, 48, 50, 52, 54]) res(8, 5, 10, z);
  // pediments, dome, cupolas, skylights
  for (let x = 29; x <= 32; x++) for (let z = 41; z <= 54; z++) res(x, 11, 15, z);
  for (const [z0, z1] of [[6, 14], [81, 89]]) for (let x = 34; x <= 35; x++) for (let z = z0; z <= z1; z++) res(x, 11, 14, z);
  for (const [z0, z1] of [[6, 14], [81, 89]]) for (let x = 13; x <= 25; x++) for (let z = z0; z <= z1; z++) res(x, 11, 13, z);
  for (let x = 11; x <= 28; x++) for (let z = 39; z <= 56; z++) for (let y = 12; y <= 14; y++) res(x, y, y, z);
  for (const z0 of [29, 63]) for (let x = 18; x <= 21; x++) for (let z = z0; z <= z0 + 3; z++) for (let y = 12; y <= 15; y++) res(x, y, y, z);
  // portico columns and floors are P2's: x30..32 / x34..35 y5.. stay free
  for (let x = 30; x <= 32; x++) for (let z = 41; z <= 54; z++) for (let y = 5; y <= 10; y++) res(x, y, y, z);
  for (const [z0, z1] of [[6, 14], [81, 89]]) for (let x = 34; x <= 35; x++) for (let z = z0; z <= z1; z++) for (let y = 5; y <= 10; y++) res(x, y, y, z);
  // west loggias x3..4 and loggia x8..9 are open
  for (const [z0, z1] of [[2, 18], [77, 93]]) for (let x = 3; x <= 4; x++) for (let z = z0; z <= z1; z++) for (let y = 5; y <= 11; y++) res(x, y, y, z);
  for (let x = 8; x <= 9; x++) for (let z = 41; z <= 54; z++) for (let y = 5; y <= 11; y++) res(x, y, y, z);
  // central wall top y11 at x29 z41..54 belongs to the East Portico pediment (already reserved)

  // ---- masses: [x0,x1,z0,z1] wall boxes
  const walls = [[5, 33, 2, 18], [5, 33, 77, 93], [15, 27, 19, 25], [15, 27, 70, 76], [10, 29, 26, 69]];
  const slabTop = B.slab("smooth_quartz", "top");
  const ante = [[30, 31, 37, 40], [30, 31, 55, 58]];
  // 1) walls y5..11 (2 thick; connectors only on their x sides, the ends are inside the neighbours)
  for (const [x0, x1, z0, z1] of walls) {
    const conn = x1 - x0 === 12;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const w = x - x0 < 2 || x1 - x < 2 || (!conn && (z - z0 < 2 || z1 - z < 2));
      if (w) for (let y = 5; y <= 11; y++) put(x, y, z, WALL);
    }
  }
  for (const [x0, x1, z0, z1] of ante) box(x0, x1, 5, 11, z0, z1, WALL);
  // 2) podium bricks G..4 under every mass; slab-top cornice on the open loggia strips
  const pod = (x0, x1, z0, z1, top = 4) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = G(x, z); y <= top; y++) put(x, y, z, RUSTIC);
  };
  for (const [z0, z1] of [[2, 18], [77, 93]]) {
    pod(5, 34, z0, z1); pod(3, 4, z0, z1, 3);
    for (let x = 3; x <= 4; x++) for (let z = z0; z <= z1; z++) put(x, 4, z, slabTop[0], slabTop[1]);
    pod(2, 2, z0 + 2, z1 - 2, 3);
    for (let z = z0 + 2; z <= z1 - 2; z++) put(2, 4, z, slabTop[0], slabTop[1]);
    pod(35, 35, z0 + 4, z1 - 4);
  }
  pod(15, 27, 19, 25); pod(15, 27, 70, 76); pod(10, 29, 26, 69);
  for (const [x0, x1, z0, z1] of ante) pod(x0, x1, z0, z1);
  pod(30, 32, 41, 54);
  pod(0, 9, 41, 54);
  // north / south terrace plinths: two full courses of bricks (g and g+1), so the balustrade at g+2 stands on a full block
  for (const [z0, z1] of [[0, 1], [94, 95]]) for (let x = 10; x <= 25; x++) for (let z = z0; z <= z1; z++) {
    put(x, G(x, z), z, RUSTIC);
    put(x, G(x, z) + 1, z, RUSTIC);
  }
  // West Front upper terrace + loggia floor: bottom slab at y5 on x0..9 (not on the balustrade/column cells)
  for (let x = 0; x <= 9; x++) for (let z = 41; z <= 54; z++) put(x, 5, z, ...B.slab("smooth_stone", "bottom"));
  // 3) decks y12 inside the balustrade lines
  const deck = (x0, x1, z0, z1) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(x, 12, z, ...B.slab("smooth_stone", "bottom")); };
  deck(6, 32, 3, 17); deck(6, 32, 78, 92);
  deck(16, 26, 19, 25); deck(16, 26, 70, 76);
  deck(11, 28, 27, 68);
  // 4) smooth_stone core y G..11 everywhere inside the masses
  for (const [x0, x1, z0, z1] of walls) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
    for (let y = G(x, z); y <= 11; y++) put(x, y, z, CORE);
  // 5) west steps (cut their own flights, outside everything above)
  westSteps(g, { z0: 37, z1: 40, ground: 0 });
  westSteps(g, { z0: 55, z1: 58, ground: 0 });
}
