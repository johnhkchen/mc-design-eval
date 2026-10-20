// Part "arches": the five white lace arches A1..A5 (plan.md ARCHES, SITE), slender: each arch is two parallel frames
// (one at each z-end, on the outer row of its legs), every frame a 1-thick pointed (two-centred) arch: a quartz_pillar
// leg at each outer corner from the plinth to the spring, then two smooth_quartz arcs that meet in a point at the
// crown. Between the arcs, in the upper part of the rise, an open diamond net of smooth_quartz diagonals (the lace);
// a smooth_quartz ridge ties the two crowns, end_rod ties join the frames at the spring, and two globe lamps hang on
// long chains from the ridge. Built after the courtyard, so the plinths (y1) are there; legs start at y2.
import { ARCHES } from "../vocab/base.mjs";

// The two-centred arc: for row y over the spring, the x of the left arc (outer edge at x0, apex at mid).
function arcX(x0, x1, spring, crown, y) {
  const h = (x1 - x0) / 2, H = crown - spring, R = (h * h + H * H) / (2 * h);
  const dy = y - spring;
  return x0 + R - Math.sqrt(Math.max(0, R * R - dy * dy));
}

function put(g, x, y, z, ...b) {
  if (g.inBounds(x, y, z) && g.isAir(x, y, z)) g.set(x, y, z, ...b);
}

function frame(g, x0, x1, z, spring, crown) {
  const mid = (x0 + x1) / 2;
  // Legs, 1x1, banded every 6.
  for (const x of [x0, x1]) for (let y = 2; y <= spring; y++) {
    put(g, x, y, z, ...(y % 6 === 1 ? ["smooth_quartz", {}] : ["quartz_pillar", { axis: "y" }]));
  }
  // Arcs: one cell per row, filling the gap to the previous row's cell so the curve is edge-joined.
  const left = new Map();
  let prev = x0;
  for (let y = spring + 1; y <= crown; y++) {
    const xl = Math.min(Math.floor(mid), Math.round(arcX(x0, x1, spring, crown, y)));
    for (let x = prev; x <= xl; x++) {
      put(g, x, y, z, "smooth_quartz", {});
      put(g, x0 + x1 - x, y, z, "smooth_quartz", {});
    }
    left.set(y, xl);
    prev = Math.max(prev, xl);
  }
  // Lace: a diamond net of diagonals (stepped, two cells per row so each one is joined face to face) inside the arch over the upper half of the rise. Cells that would touch the frame
  // or the net on one face only (the dangling tips at the net's lower edge) are pruned until none is left.
  const yNet = Math.round(crown - 0.5 * (crown - spring));
  const net = new Set();
  for (let y = yNet; y < crown; y++) {
    const xl = left.get(y), xr = x0 + x1 - xl;
    for (let x = xl + 1; x < xr; x++) {
      const a = x - x0, c = x1 - x;
      if ((((a + y) % 5) < 2 || ((c + y) % 5) < 2) && g.isAir(x, y, z)) net.add(`${x},${y}`);
    }
  }
  const solid = (x, y) => net.has(`${x},${y}`) || !g.isAir(x, y, z);
  for (let pruned = true; pruned; ) {
    pruned = false;
    for (const k of [...net]) {
      const [x, y] = k.split(",").map(Number);
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => solid(x + dx, y + dy)).length;
      if (n <= 1) { net.delete(k); pruned = true; }
    }
  }
  for (const k of net) { const [x, y] = k.split(",").map(Number); put(g, x, y, z, "smooth_quartz", {}); }
  return { mid, yNet };
}

export function build(g) {
  for (const key of Object.keys(ARCHES)) {
    const a = ARCHES[key];
    const [x0, , zA, x1, , zB] = a.box;
    const { springY: spring, crownY: crown } = a;
    let mid;
    for (const z of [zA, zB]) ({ mid } = frame(g, x0, x1, z, spring, crown));

    // Ridge along z joining the two crowns, and end_rod ties at the spring between the legs' tops.
    const crownXs = Number.isInteger(mid) ? [mid] : [Math.floor(mid), Math.ceil(mid)];
    for (const x of crownXs) for (let z = zA + 1; z < zB; z++) put(g, x, crown, z, "smooth_quartz", {});
    for (const x of [x0, x1]) for (let z = zA + 1; z < zB; z++) put(g, x, spring, z, "end_rod", { facing: "south" });

    // Two globe lamps on 8-long chains from the ridge.
    const lx = crownXs[0];
    for (const z of [zA + 2, zB - 2]) {
      for (let y = crown - 8; y < crown; y++) put(g, lx, y, z, "chain", { axis: "y", waterlogged: "false" });
      put(g, lx, crown - 9, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}
