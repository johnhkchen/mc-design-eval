// Part "grounds and light": door steps, lawns, a path, hedges, trees, lamp posts and the lanterns of every mass.
// Runs last: lawns and trees only go where no building stands (the open-sky test), and the lanterns go on the
// floors and under the decks the earlier parts built (plan.md FLOORS and VOCABULARY).
import { lawn, hedge, smallTree, lampPost, floorLantern, eaveLantern, doorStep, DIRT_PATH } from "../vocab.mjs";

// the plot rects, row coordinates inclusive (plan.md SITE)
const PLOT = {
  0: [0, 0, 28, 38], 1: [29, 0, 56, 22], 2: [57, 0, 83, 19], 3: [84, 0, 97, 35], 4: [98, 0, 107, 10],
  5: [108, 0, 118, 8], 6: [119, 0, 131, 11], 7: [132, 0, 139, 7], 8: [140, 0, 148, 8], 9: [149, 0, 155, 7],
};

// single-storey masses (floor at y1, headroom to the roof): the warehouse halls, the lean-to with a room in it,
// the storehouse sections, the shop and the garage. Rects are the mass outlines; the interior is inset by 1.
const SINGLE = [
  [8, 2, 17, 11], [8, 12, 21, 17], [2, 18, 23, 25], [16, 26, 25, 35], [4, 4, 7, 7],
  [86, 0, 93, 7], [86, 8, 95, 25], [88, 26, 97, 35], [108, 1, 117, 7], [142, 0, 145, 5],
];

// two-storey masses (deck at y3): their lights hang from the deck, at y2
const DOUBLE = [
  [31, 4, 54, 17], [47, 0, 52, 3], [33, 18, 42, 21], [57, 2, 82, 15], [98, 0, 107, 9],
  [121, 4, 130, 9], [125, 0, 128, 3], [134, 0, 137, 7], [132, 2, 139, 5],
];

// true when no block stands in the column above a ground cell (y1..10): grass and trees never go under a building
function openSky(g, x, z) {
  for (let y = 1; y <= 10; y++) {
    const c = g.get(x, y, z);
    if (c && !/(^|_)air$/.test(c.block)) return false;
  }
  return true;
}

// grass on every open ground cell of a rect; the ground under a building stays smooth stone
function lawnOpen(g, [x0, z0, x1, z1]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (openSky(g, x, z)) lawn(g, [x, z, x, z]);
}

// lantern positions across an interior run [a, b]: no more than one every 6 cells, spread evenly over the run
function spread(a, b) {
  const len = b - a + 1, n = Math.max(1, Math.ceil(len / 6));
  return Array.from({ length: n }, (_, i) => a + Math.floor(((i + 0.5) * len) / n));
}

export function build(g) {
  // ---- paths first, so the lawns leave them alone (lawn() only turns smooth_stone into grass)
  g.set(126, 0, 0, DIRT_PATH); // plot 6: the coast guard door on the plot edge
  g.set(127, 0, 0, DIRT_PATH);
  g.set(102, 0, 10, DIRT_PATH); // plot 4: the office's path from the south row
  g.set(103, 0, 10, DIRT_PATH);

  // ---- lawns on the open ground of plots 0, 1, 2, 4, 6, 7, 8, 9 (plan.md SITE)
  lawnOpen(g, [0, 0, 3, 15]);
  lawnOpen(g, [0, 28, 13, 38]);
  lawnOpen(g, [29, 0, 46, 3]);
  lawnOpen(g, [49, 18, 56, 22]);
  lawnOpen(g, [57, 0, 66, 1]);
  lawnOpen(g, [69, 18, 83, 19]);
  lawnOpen(g, [98, 10, 107, 10]);
  lawnOpen(g, [119, 0, 131, 11]);
  lawnOpen(g, [132, 0, 139, 7]);
  lawnOpen(g, [140, 0, 148, 8]);
  lawnOpen(g, [149, 0, 150, 1]);

  // ---- door steps: one half step (bottom slab) in front of each walk-in door that is not on a plot edge
  doorStep(g, 74, 2, "north", 2, { inside: PLOT[2] }); // plot 2 front door, under the porch
  doorStep(g, 112, 1, "north", 2, { inside: PLOT[5] }); // plot 5 shop door
  doorStep(g, 124, 2, "north", 1, { inside: PLOT[6] }); // plot 6 entry porch door
  doorStep(g, 147, 4, "east", 1, { inside: PLOT[8] }); // plot 8 shop door, east face

  // ---- trees: a 4-high trunk and a persistent crown, on the plot 0 lawns
  smallTree(g, 2, 11, { inside: PLOT[0], cap: 10 });
  smallTree(g, 4, 34, { inside: PLOT[0], cap: 10 });
  smallTree(g, 10, 35, { inside: PLOT[0], cap: 10 });

  // ---- hedges along the plot 1 front lawn
  hedge(g, [34, 0, 37, 1]);
  hedge(g, [41, 0, 43, 1]);

  // ---- lamp posts on the lawns of plots 0, 1, 2, 6, and a lantern on a post each side of the main doors
  lampPost(g, 1, 6); // plot 0 west lawn
  lampPost(g, 6, 31); // plot 0 south-west lawn
  lampPost(g, 11, 0); // plot 0 apron, west of the vestibule
  lampPost(g, 16, 0); // plot 0 apron, east of the vestibule
  lampPost(g, 33, 1); // plot 1 front lawn
  lampPost(g, 46, 0); // plot 1 front lawn, west of the entrance
  lampPost(g, 53, 0); // plot 1 east of the entrance
  lampPost(g, 52, 20); // plot 1 rear lawn
  lampPost(g, 72, 19); // plot 2 rear lawn
  lampPost(g, 124, 0); // plot 6 flanking the entry
  lampPost(g, 129, 0); // plot 6 flanking the entry

  // ---- eave lanterns under the roofs by the main doors (a block above each)
  eaveLantern(g, 73, 2, 1); // plot 2 porch, left of the front door
  eaveLantern(g, 76, 2, 1); // plot 2 porch, right of the front door
  eaveLantern(g, 112, 2, 0); // plot 5 shop, under the awning, over the door

  // ---- interior light: a standing lantern on the floor of every single-storey mass, one every 6 cells
  const lit = new Set();
  const place = (x, y, z, put) => {
    const k = `${x},${y},${z}`;
    if (!lit.has(k)) {
      lit.add(k);
      put(x, y, z);
    }
  };
  for (const [x0, z0, x1, z1] of SINGLE) {
    for (const x of spread(x0 + 1, x1 - 1)) for (const z of spread(z0 + 1, z1 - 1)) place(x, 1, z, (a, y, b) => floorLantern(g, a, y, b));
  }
  // two-storey masses: lanterns hang from the deck at y3, at y2
  for (const [x0, z0, x1, z1] of DOUBLE) {
    for (const x of spread(x0 + 1, x1 - 1)) for (const z of spread(z0 + 1, z1 - 1)) place(x, 2, z, (a, y, b) => eaveLantern(g, a, y, b));
  }
}
