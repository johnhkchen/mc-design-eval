// P4 Soames-Dunn west front and shopfronts (plan.md PARTS 4): piers, awnings, cornice, parapet, window boxes, the
// Starbucks and Bavarian boards, and the round logo.
// Planes: A's wall face is x2 (piers x1, awning x0..1), C's is x6 (piers x5, awning x4..5). Every write is air-only:
// the masonry shell's solid cells are locked, so a cell it already filled is skipped and counted, never replaced.
// The shell carves the shopfront panels, the upper windows and the B west windows as air (openings, glazier's cells),
// and runParts locks air the shell placed too. So the shopfront frames, the paired-window sills and lintels, and the
// B west glass cannot be written from this part: they wait for the shell to leave those cells solid.
import { groundAt, onFootprint } from "../vocab/base.mjs";
import { awning_run, cornice_run, window_box, round_logo, shop_board, awning_lantern } from "../vocab.mjs";

const AIR = /(^|:)(cave_)?air$/;
const FACE = "west";

// Air-only writer for this part: off-footprint, out-of-bounds and solid cells are skipped and counted.
function writer(g) {
  const out = { placed: 0, skipped: 0 };
  const w = (x, y, z, block, state) => {
    if (!onFootprint(x, z) || !g.inBounds(x, y, z) || !AIR.test(g.blockAt(x, y, z))) { out.skipped++; return; }
    g.set(x, y, z, block, state);
    out.placed++;
  };
  return { w, out };
}

// One storey-and-a-half of the front: plane x, shop floor, the z range, bays, piers and the upper floor.
function front(g, w, { x, floor, z0, z1, bays, skipUpper = [] }) {
  const pierX = x - 1;
  // Plinth under the piers, down to the ground (air-only: the shell's footings are locked).
  for (let z = z0; z <= z1; z++) {
    if (!((z - z0) % 9 <= 1)) continue;
    const gy = groundAt(pierX, z) ?? 0;
    for (let y = gy + 1; y <= floor - 1; y++) w(pierX, y, z, "stone_bricks");
  }
  // Piers, full height from the shop floor to y16; two cells wide, one proud of the wall.
  for (let z = z0; z <= z1; z++) {
    if (!((z - z0) % 9 <= 1)) continue;
    for (let y = floor + 1; y <= 16; y++) w(pierX, y, z, "bricks");
  }
  // Pier heads (before the coping, so the coping stops at them).
  for (let z = z0; z <= z1; z++) {
    if (!((z - z0) % 9 <= 1)) continue;
    w(pierX, 20, z, "bricks");
    w(pierX, 21, z, "stone_brick_slab", { type: "bottom" });
  }
  // Parapet and coping along the whole front.
  for (let z = z0; z <= z1; z++) {
    w(pierX, 18, z, "bricks");
    w(pierX, 19, z, "bricks");
    w(pierX, 20, z, "stone_brick_slab", { type: "bottom" });
  }
  // Cornice: frieze at the pier plane, nose 2 proud at x-2 (A x0, C x4).
  cornice_run(g, { x: pierX, y: 17, z0, z1, face: FACE, corona: false, cap: false });
  // Awning over the run, brackets on each pier, a lantern in each bay under the canopy.
  // Dark-green canopy (full blocks) over x-2..x-1, dark oak brackets under it at each pier.
  for (let z = z0; z <= z1; z++) for (const ax of [x - 2, pierX]) w(ax, 9, z, "green_concrete");
  awning_run(g, { x0: x - 2, x1: pierX, y: 9, z0, z1, into: "east" });
  for (const k of bays) {
    const zb = k.z0;
    if (!k.logo) {
      for (const zw of [zb + 3, zb + 6]) {
        if (skipUpper.includes(zw)) continue;
        window_box(g, { x: pierX, z: zw, y: 11, width: 2, flower: ["potted_poppy", "potted_dandelion", "potted_azure_bluet"] });
      }
    }
    awning_lantern(g, { x: x - 2, y: 8, z: zb + 5 });
  }
}

export function build(g) {
  const { w, out } = writer(g);
  // A: Soames street range, shop floor y2, wall plane x2, bays k=0..10 at z 9k.
  const aBays = [];
  for (let k = 0; k <= 10; k++) aBays.push({ z0: 9 * k, logo: k === 5 });
  front(g, w, { x: 2, floor: 2, z0: 0, z1: 99, bays: aBays });

  // Boards: Starbucks over bays 4-5, Bavarian Meats over bays 6-7 (over: the board may replace its own pier bricks).
  shop_board(g, { x: 1, y0: 10, y1: 11, z0: 38, z1: 53, mat: "brown_concrete", text: "STARBUCKS", letter: "white", base: "brown", face: FACE, over: true });
  shop_board(g, { x: 1, y0: 10, y1: 11, z0: 56, z1: 71, mat: "blue_concrete", text: "BAVARIAN MEATS", letter: "white", base: "black", face: FACE, over: true });

  // Starbucks round logo over its door, in bay 5's upper panel (disc x1 y12..16 z49..53; the door is z51..52).
  round_logo(g, { x: 1, zc: 51, yc: 14 });

  // C: the south street range, shop floor y3, wall plane x6, bays j=0..5 at z 100+9j.
  const cBays = [];
  for (let j = 0; j <= 5; j++) cBays.push({ z0: 100 + 9 * j });
  front(g, w, { x: 6, floor: 3, z0: 100, z1: 158, bays: cBays });

  console.log(`soames-front: ${out.placed} placed, ${out.skipped} skipped (solid shell or off-footprint)`);
}
