// P3 roofs and stacks (plan.md PARTS 3 and ROOFS): flat parapet roofs on each mass, the deck filled in gray_concrete,
// brick chimney stacks, and vent hutches. Plot-local coordinates; rects are inclusive [x0, z0, x1, z1].
// Parapet courses start at deck + 1 (A deck 17 -> bricks at 18, coping slab at 19), as in plan.md's ROOFS table.
// Laid here, not by runParts' roof.json: the roofs sit at different heights (17, 25, 10, 36).
import { brick_stack, vent_hutch } from "../vocab.mjs";

const DECK = "gray_concrete";

// The deck: gray_concrete at y over every footprint cell that is air and not kept.
function fillDeck(g, rects, y, keep) {
  const kept = (x, z) => keep.some((b) => x >= b.from[0] && x <= b.to[0] && y >= b.from[1] && y <= b.to[1] && z >= b.from[2] && z <= b.to[2]);
  let n = 0;
  for (const [x0, z0, x1, z1] of rects)
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++) {
        if (!g.inBounds(x, y, z) || kept(x, z) || !g.isAir(x, y, z)) continue;
        g.set(x, y, z, DECK);
        n++;
      }
  return n;
}

// One flat-parapet mass: deck at y, brick parapet on the edge ring from deck + 1 for `parapet` courses, coping slab on top.
// Hand-laid, not roof(): the roof tool fills its interior with gray_concrete_slab, which is off the roof palette.
function massRoof(g, { rects, deck, parapet = 1, trim, keep = [] }) {
  fillDeck(g, rects, deck, keep);
  const cells = new Set();
  for (const [x0, z0, x1, z1] of rects) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cells.add(`${x},${z}`);
  const kept = (x, y, z) => keep.some((b) => x >= b.from[0] && x <= b.to[0] && y >= b.from[1] && y <= b.to[1] && z >= b.from[2] && z <= b.to[2]);
  const put = (x, y, z, block, state) => {
    if (g.inBounds(x, y, z) && g.isAir(x, y, z) && !kept(x, y, z)) g.set(x, y, z, block, state);
  };
  for (const k of cells) {
    const [x, z] = k.split(",").map(Number);
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !cells.has(`${x + dx},${z + dz}`));
    if (!edge) continue;
    for (let y = deck + 1; y <= deck + parapet; y++) put(x, y, z, "bricks");
    put(x, deck + parapet + 1, z, trim, { type: "bottom" });
  }
}

// keep box helper: [x0, y0, z0, x1, y1, z1] to { from, to }
const box = (x0, y0, z0, x1, y1, z1) => ({ from: [x0, y0, z0], to: [x1, y1, z1] });

// Chimney footprints, keep from the deck up through the cap, and the stack builds (brick_stack) on each.
function stacks(g, list) {
  const out = [];
  for (const c of list) {
    const top = c.y0 + c.height - 1;
    out.push(box(c.x, c.deck + 1, c.z, c.x + 1, top + 1, c.z + 1));
    brick_stack(g, { x: c.x, z: c.z, y0: c.y0, height: c.height, deck: c.deck });
  }
  return out;
}

export function build(g) {
  // ---- Soames-Dunn A (north street range) and C (south street range): deck 17, parapet 1 -----------------------------
  const A = [[0, 4, 27, 99], [0, 0, 11, 3]];
  const C = [[4, 100, 27, 158]];
  // the street-front cornice and parapet (x0..2 for A, x4..6 for C, y17..21) belong to the facade part
  const keepA = [box(0, 17, 0, 2, 21, 99)];
  const keepC = [box(4, 17, 100, 6, 21, 158)];
  // vent hutches on A's deck at x14, z20, 47, 74
  const hutchesA = [20, 47, 74].map((z) => ({ x: 14, z, y: 18 }));
  for (const h of hutchesA) keepA.push(box(h.x, 18, h.z, h.x + 1, 19, h.z));
  massRoof(g, { rects: A, deck: 17, parapet: 1, trim: "stone_brick_slab", keep: keepA });
  massRoof(g, { rects: C, deck: 17, parapet: 1, trim: "stone_brick_slab", keep: keepC });
  for (const h of hutchesA) vent_hutch(g, h);

  // ---- Soames-Dunn B (north upper range) and E (south-east range): deck 25, parapet 2 ------------------------------
  const B = [[28, 0, 47, 3], [28, 4, 51, 79], [28, 80, 43, 99], [52, 8, 55, 19], [52, 28, 55, 79]];
  const E = [[44, 108, 59, 139], [48, 104, 55, 107], [32, 140, 59, 143], [28, 144, 59, 155], [28, 156, 47, 158]];
  const stacksBE = stacks(g, [
    { x: 40, z: 30, y0: 26, height: 6, deck: 25 },
    { x: 40, z: 64, y0: 26, height: 6, deck: 25 },
    { x: 52, z: 120, y0: 26, height: 6, deck: 25 },
  ]);
  massRoof(g, { rects: [...B, ...E], deck: 25, parapet: 2, trim: "stone_brick_slab", keep: stacksBE });

  // ---- D1 and D2 links: deck 10, parapet 1 -------------------------------------------------------------------------
  massRoof(g, { rects: [[28, 100, 43, 103], [28, 104, 35, 107], [28, 128, 35, 131]], deck: 10, parapet: 1, trim: "stone_brick_slab" });

  // ---- Butterworth: deck 36, parapet 3, the east cornice and pavilion (x114..117, y34..42) are the facade's ------------
  const BW = [[64, 4, 115, 51], [84, 0, 115, 3], [68, 52, 115, 83], [64, 84, 115, 107], [68, 108, 115, 155]];
  const stacksBW = stacks(g, [
    { x: 70, z: 20, y0: 37, height: 7, deck: 36 },
    { x: 70, z: 74, y0: 37, height: 7, deck: 36 },
    { x: 70, z: 124, y0: 37, height: 7, deck: 36 },
    { x: 100, z: 44, y0: 37, height: 7, deck: 36 },
    { x: 100, z: 104, y0: 37, height: 7, deck: 36 },
  ]);
  const hutchesBW = [[90, 30], [90, 90], [90, 130]].map(([x, z]) => ({ x, z, y: 37 }));
  const keepBW = [box(114, 34, 0, 117, 42, 157), ...stacksBW, ...hutchesBW.map((h) => box(h.x, 37, h.z, h.x + 1, 38, h.z))];
  massRoof(g, { rects: BW, deck: 36, parapet: 3, trim: "smooth_sandstone_slab", gable: "bricks", keep: keepBW });
  for (const h of hutchesBW) vent_hutch(g, h);
}
