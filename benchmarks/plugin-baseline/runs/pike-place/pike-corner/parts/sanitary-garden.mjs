// Part 3: Sanitary and Garden shell and roof. Each mass is a hollow box, two cells thick on its walls, with the
// ground-storey floor, the upper floor band and the deck solid and the rooms between them air, so the shops P6 lights
// stay open. The wall plane is edge+1 (plan.md FOOTPRINT-EDGE RULE); the edge cells stay empty. Openings and the
// entrance are carved as air for P5 to glaze. Writes only into this part's cells and only above the ground.
import { groundAt, onFootprint } from "../vocab/base.mjs";
import { parapetCap, rooftopVent } from "../vocab.mjs";

const SAND = "smooth_sandstone", CUT = "cut_sandstone", QUARTZ = "smooth_quartz", QSLAB = "smooth_quartz_slab";
const BRICK = "bricks", STONE = "stone_bricks", STONE_SLAB = "stone_brick_slab";
const deck = (x, z) => ((x + z) % 2 ? STONE : "polished_andesite");

// Sanitary Market masses (plan.md PLOT 2). x0 is the EDGE (street) cell, the wall plane is x0 + 1 on the west.
// floor = ground-storey floor course; open = west shop-front starts (6 wide, the pier rhythm), none = every 8 from z0+2.
const SAN = [
  { x0: 128, z0: 80, x1: 179, z1: 119, floor: 1, open: [82, 90, 98], entrance: true },
  { x0: 128, z0: 120, x1: 171, z1: 143, floor: 1, open: [120, 128, 136] },
  { x0: 132, z0: 68, x1: 183, z1: 79, floor: 1 },
  { x0: 136, z0: 60, x1: 187, z1: 67, floor: 1 },
  { x0: 144, z0: 52, x1: 191, z1: 59, floor: 1 },
  { x0: 152, z0: 40, x1: 195, z1: 51, floor: 2 },
  { x0: 156, z0: 8, x1: 199, z1: 39, floor: 3 },
];

// Garden Center (plan.md PLOT 3): G1 main block and G2 east wing. Wall plane west x 212 (edge+1), north z 2.
const GARDEN = [
  { x0: 212, z0: 2, x1: 244, z1: 27, floor: 1, main: true },
  { x0: 245, z0: 2, x1: 250, z1: 11, floor: 1 },
];

// one hollow mass: ring walls 2 thick from the ground to the top course; floor fill, band, air, ceiling and deck inside
function hollow(g, m, skip) {
  const { x0, z0, x1, z1, floor, bandLo, bandHi, ceilLo, top, wall, bandMat, rings = [], plinth = 0 } = m;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!onFootprint(x, z)) continue;
    const gr = groundAt(x, z);
    const ring = x - x0 < 2 || x1 - x < 2 || z - z0 < 2 || z1 - z < 2;
    for (let y = gr + 1; y <= top; y++) {
      if (skip.has(`${x},${y},${z}`)) continue;
      let b;
      if (ring) b = y <= plinth ? STONE : rings.includes(y) ? CUT : y === top ? deck(x, z) : wall;
      else if (y <= floor) b = STONE;
      else if (y < bandLo) continue;
      else if (y <= bandHi) b = bandMat;
      else if (y < ceilLo) continue;
      else b = y === top ? deck(x, z) : STONE;
      g.set(x, y, z, b);
    }
  }
}

// west shop-front starts every 8 from z0+2 when the plan gives none
const openStarts = (m) => m.open ?? Array.from({ length: 8 }, (_, k) => m.z0 + 2 + 8 * k).filter((zs) => zs + 5 <= m.z1);

export function build(g) {
  const skip = new Set();
  const air = (x, y, z) => skip.add(`${x},${y},${z}`);
  const span = (a, b, f) => { for (let v = a; v <= b; v++) f(v); };

  // ---- Sanitary: shop fronts, upper windows, entrance, all carved as air before the walls go up
  for (const m of SAN) {
    const wx = m.x0 + 1;
    for (const zs of openStarts(m)) {
      span(zs, zs + 5, (z) => span(m.floor + 1, 9, (y) => { air(wx, y, z); air(wx + 1, y, z); }));
      for (const a of [zs + 1, zs + 4]) span(a, a + 1, (z) => span(16, 18, (y) => { air(wx, y, z); air(wx + 1, y, z); }));
    }
    if (m.entrance) span(109, 114, (z) => span(2, 9, (y) => { air(129, y, z); air(130, y, z); }));
  }

  // ---- Garden: shopfronts (air x 212..213, glass goes in x 214), upper west windows, north windows and door
  const G1 = GARDEN[0];
  span(4, 13, (z) => span(2, 5, (y) => { air(212, y, z); air(213, y, z); }));
  span(16, 25, (z) => span(2, 5, (y) => { air(212, y, z); air(213, y, z); }));
  for (const a of [6, 13, 20]) span(a, a + 1, (z) => span(9, 12, (y) => { air(212, y, z); air(213, y, z); }));
  for (const x of [214, 215, 219, 220]) span(9, 12, (y) => { air(x, y, 2); air(x, y, 3); });
  span(230, 231, (x) => span(4, 5, (y) => { air(x, y, 2); air(x, y, 3); }));

  // ---- shells
  for (const m of SAN) {
    hollow(g, {
      x0: m.x0 + 1, z0: m.z0, x1: m.x1 - 1, z1: m.z1, floor: m.floor,
      bandLo: 10, bandHi: 13, ceilLo: 22, top: 23, wall: SAND, bandMat: SAND, rings: [10, 13],
    }, skip);
  }
  for (const m of GARDEN) {
    hollow(g, {
      x0: m.x0, z0: m.z0, x1: m.x1, z1: m.z1, floor: m.floor,
      bandLo: 8, bandHi: 8, ceilLo: 15, top: 15, wall: BRICK, bandMat: STONE, plinth: m.main ? 1 : 0,
    }, skip);
  }

  // ---- Sanitary frames (window and entrance surrounds, quartz), flat decks with parapets, vents, S7 sign board
  for (const m of SAN) {
    const wx = m.x0 + 1;
    for (const zs of openStarts(m)) {
      for (const a of [zs + 1, zs + 4]) {
        for (let z = a - 1; z <= a + 2; z++) { g.set(wx, 15, z, QUARTZ); g.set(wx, 19, z, QUARTZ); }
        for (const z of [a - 1, a + 2]) for (let y = 16; y <= 18; y++) g.set(wx, y, z, QUARTZ);
      }
    }
    parapetCap(g, { box: [m.x0 + 1, m.z0, m.x1 - 1, m.z1], y0: 24, y1: 25, coping: QSLAB, wall: SAND });
    // rooftop vents every ~20 along the deck, two cells in from the edge
    if (m.z1 - m.z0 >= 20) {
      const xm = Math.floor((m.x0 + m.x1) / 2);
      for (let zv = m.z0 + 8; zv + 3 <= m.z1 - 2; zv += 20) {
        const cells = [[xm, zv], [xm + 1, zv], [xm, zv + 1], [xm + 1, zv + 1]];
        if (cells.every(([x, z]) => onFootprint(x, z))) rooftopVent(g, { at: [xm, 24, zv] });
      }
    }
  }
  // entrance surround (x 129, z 108..115) and the S7 sign board over it, x 129..130 z 104..119
  for (let y = 2; y <= 9; y++) { g.set(129, y, 108, QUARTZ); g.set(129, y, 115, QUARTZ); }
  for (let z = 108; z <= 115; z++) g.set(129, 10, z, QUARTZ);
  for (let z = 104; z <= 119; z++) for (const x of [129, 130]) {
    for (let y = 24; y <= 29; y++) g.set(x, y, z, SAND);
    g.set(x, 30, z, QSLAB, { type: "bottom" });
  }

  // ---- Garden flat roofs with brick parapets and stone-brick coping
  for (const m of GARDEN) {
    parapetCap(g, { box: [m.x0, m.z0, m.x1, m.z1], y0: 16, y1: 17, coping: STONE_SLAB, wall: BRICK });
  }
}
