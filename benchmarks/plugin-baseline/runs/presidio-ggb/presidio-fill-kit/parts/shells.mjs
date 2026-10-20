// Masonry shells: walls, floors and plinths of plots 0-6 (plan.md FACADES/FLOORS/OPENINGS). Plot 7 is the battery part's.
// Openings are never written (air is not placed, so later parts can fill them); only solid cells are set.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const M = (n) => `minecraft:${n}`;
const rng = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// a hollow ring of wall (perimeter only) from y0..y1, skipping cells in `open`
function ring(g, [x0, z0, x1, z1], y0, y1, block, open) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++) {
        if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue;
        if (open.has(`${x},${y},${z}`)) continue;
        g.set(x, y, z, M(block));
      }
}
// course over the ring at one height (replaces the wall cell unless it is an opening)
const course = (g, box, y, block, open) => ring(g, box, y, y, block, open);
const cells = (set, xs, ys, zs) => { for (const x of xs) for (const y of ys) for (const z of zs) set.add(`${x},${y},${z}`); };
const floor = (g, [x0, z0, x1, z1], y, block, skip = new Set()) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!skip.has(`${x},${y},${z}`)) g.set(x, y, z, M(block));
};
const solid = (g, [x0, y0, z0, x1, y1, z1], block, open = new Set()) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++)
    if (!open.has(`${x},${y},${z}`)) g.set(x, y, z, M(block));
};
const pillar = (g, x, z, y0, y1) => { for (let y = y0; y <= y1; y++) g.set(x, y, z, ...B.pillar("quartz_pillar", "y")); };
const S = () => new Set();

function house0(g) {
  const o = S();
  cells(o, [2, 4], [2, 4], [5, 1]); cells(o, [3], [1, 2], [5]); cells(o, [3], [6], [1, 5]);
  cells(o, [1], [2, 4], [3]); cells(o, [5], [1], [3]); cells(o, [5], [4], [2]);
  ring(g, [1, 1, 5, 5], 1, 5, "white_concrete", o);
  course(g, [1, 1, 5, 5], 3, "smooth_quartz", o);
  for (const [x, z] of [[1, 1], [5, 1], [1, 5], [5, 5]]) pillar(g, x, z, 1, 5);
  for (const z of [1, 5]) { for (const x of [2, 3, 4]) if (!o.has(`${x},6,${z}`)) g.set(x, 6, z, M("white_concrete")); g.set(3, 7, z, M("white_concrete")); }
  floor(g, [2, 2, 4, 4], 0, "spruce_planks"); floor(g, [1, 6, 5, 7], 0, "spruce_planks");
  floor(g, [2, 2, 4, 4], 3, "spruce_planks", new Set(["3,3,2"]));
}

function duplex(g) {
  const o = S();
  cells(o, [10, 15], [1, 2], [8]); cells(o, [10, 15], [4], [8]);
  cells(o, [10, 11, 14, 15], [2, 4], [1]); cells(o, [9, 16], [2, 4], [3, 6]);
  // south wall: only x9..10 and x15..16 at z8; bay front at z9
  for (const x of rng(11, 14)) cells(o, [x], rng(1, 5), [8]);
  ring(g, [9, 1, 16, 8], 1, 5, "smooth_sandstone", o);
  const ob = S(); cells(ob, [11, 14], [2, 4], [9]);
  solid(g, [11, 1, 9, 14, 5, 9], "smooth_sandstone", ob);
  solid(g, [12, 1, 2, 13, 5, 8], "smooth_sandstone"); // party wall
  course(g, [9, 1, 16, 8], 3, "terracotta", o);
  for (const x of rng(11, 14)) if (!ob.has(`${x},3,9`)) g.set(x, 3, 9, M("terracotta"));
  for (const xs of [[10, 11], [14, 15]]) {
    floor(g, [xs[0], 2, xs[1], 8], 0, "spruce_planks");
    const hole = S(); cells(hole, [xs[0] === 10 ? 10 : 15], [3], rng(5, 7));
    floor(g, [xs[0], 2, xs[1], 8], 3, "spruce_planks", hole);
  }
  // the two bay cells at z8 x11,x14 were set at y3 above: remove by not wanting them
}

function garage(g) {
  const o = S();
  cells(o, [20, 21], [1, 2], [4]); cells(o, [19], [2], [2]); cells(o, [22], [1, 2], [2]); cells(o, [21], [2], [1]);
  ring(g, [19, 1, 22, 4], 2, 2, "white_concrete", o);
  ring(g, [19, 1, 22, 4], 1, 1, "polished_andesite", o);
  for (const [x, z] of [[19, 1], [22, 1], [19, 4], [22, 4]]) { g.set(x, 1, z, M("smooth_quartz")); g.set(x, 2, z, M("smooth_quartz")); }
  g.set(20, 4, 4, M("white_concrete")); g.set(21, 4, 4, M("white_concrete"));
}

function shed(g) {
  const o = S(); cells(o, [25], [1, 2], [3]); cells(o, [27, 24], [2], [1]);
  ring(g, [24, 0, 27, 3], 1, 2, "white_concrete", o);
}

function barracks(g) {
  const o = S(), B4 = [30, 1, 41, 9];
  for (const x of [31, 33, 38, 40]) cells(o, [x], [2, 4], [1, 9]);
  cells(o, [35, 36], [1, 2], [1, 9]); cells(o, [35, 36], [4, 5], [9]); cells(o, [35, 36], [4], [1]);
  for (const x of [30, 41]) { cells(o, [x], [2, 4], [3, 5]); cells(o, [x], [1], [7]); }
  ring(g, B4, 2, 5, "bricks", o);
  const po = new Set([...o]);
  ring(g, B4, 1, 1, "polished_andesite", o);
  course(g, B4, 3, "smooth_quartz", o);
  // cornice on the long faces
  for (let x = 30; x <= 41; x++) for (const z of [1, 9]) g.set(x, 5, z, M("smooth_quartz"));
  for (const [x, z] of [[30, 1], [41, 1], [30, 9], [41, 9]]) [2, 4].forEach((y) => g.set(x, y, z, M("smooth_quartz")));
  floor(g, [31, 2, 40, 8], 0, "spruce_planks"); floor(g, [30, 10, 41, 12], 0, "spruce_planks");
  const hole = S(); cells(hole, [37, 38], [3], rng(5, 8));
  floor(g, [31, 2, 40, 8], 3, "spruce_planks", hole);
  floor(g, [30, 10, 41, 12], 3, "spruce_planks");
}

function hall(g) {
  const SS = "smooth_sandstone", o = S();
  // south facade z16
  cells(o, [53, 54], [1, 2, 3], [16]); cells(o, [48, 59], [2, 3], [16]); cells(o, [53, 54], [6, 7], [16]);
  cells(o, [50, 57], [2, 3], [1]); cells(o, [53, 54], [1, 2], [1]);
  for (const x of [47, 60]) { cells(o, [x], [1, 2], [5, 6, 8, 9, 11, 12]); cells(o, [x], [5], [5, 8, 11]); }
  ring(g, [47, 1, 60, 16], 1, 5, SS, o);
  // aisles: end walls + outer wall, y1..2, openings for windows
  for (const [xo, xi] of [[45, 46], [62, 61]]) {
    const oa = S(); cells(oa, [xo], [1, 2], [5, 8, 11]);
    const [a, b] = xo < xi ? [xo, xi] : [xi, xo];
    ring(g, [a, 3, b, 14], 1, 2, SS, oa);
    floor(g, [xi, 4, xi, 13], 0, "polished_granite");
  }
  // inner nave wall at x47/x60 y1..2 is inside the aisle ring's edge: arches stay open there
  for (const x of [47, 60]) for (const z of [5, 6, 8, 9, 11, 12]) for (const y of [1, 2]) {} // (kept air)
  floor(g, [48, 2, 59, 15], 0, "polished_granite");
  // facade parapet above the roof line (belfry x52..55 y8..10 and the rose window are left to fittings)
  const op = S(); cells(op, [53, 54], [6, 7], [16]);
  solid(g, [47, 6, 16, 60, 6, 16], SS, op); solid(g, [48, 7, 16, 59, 7, 16], SS, op);
  solid(g, [50, 8, 16, 51, 8, 16], SS); solid(g, [56, 8, 16, 57, 8, 16], SS);
  // terracotta door surround
  for (const x of [52, 55]) for (const y of [1, 2, 3]) g.set(x, y, 16, M("terracotta"));
  for (const x of [53, 54]) g.set(x, 4, 16, M("terracotta"));
  // arcade z17..18: piers, closed ends, arch fill at y3 on z17 (heads at z18 are fittings')
  for (const x of [49, 52, 55, 58]) solid(g, [x, 1, 17, x, 3, 18], SS);
  solid(g, [49, 3, 17, 58, 3, 17], SS);
}

function officers(g) {
  const o = S();
  for (const x of [67, 72]) cells(o, [x], [2, 4], [1, 7]);
  cells(o, [69, 70], [1, 2], [7]); cells(o, [69, 70], [4], [7]); cells(o, [70], [1, 2], [1]);
  for (const x of [66, 73]) { cells(o, [x], [2, 4], [2, 6]); cells(o, [x], [1], [4]); }
  ring(g, [66, 1, 73, 7], 1, 5, "white_concrete", o);
  course(g, [66, 1, 73, 7], 3, "smooth_quartz", o);
  for (const [x, z] of [[66, 1], [73, 1], [66, 7], [73, 7]]) pillar(g, x, z, 1, 5);
  floor(g, [67, 2, 72, 6], 0, "dark_oak_planks"); floor(g, [66, 8, 73, 10], 0, "spruce_planks");
  const hole = S(); cells(hole, [69], [3], [3, 4, 5]);
  floor(g, [67, 2, 72, 6], 3, "dark_oak_planks", hole);
}

export function build(g) {
  house0(g); duplex(g); garage(g); shed(g); barracks(g); hall(g); officers(g);
}
