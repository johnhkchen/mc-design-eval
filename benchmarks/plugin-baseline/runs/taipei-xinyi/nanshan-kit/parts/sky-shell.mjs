// Plot 1 Taipei Sky Tower shell (plan.md Plot 1, plot-local coordinates): the podium S-P (z0..50, y0..41), the glass
// waist link S-W, the rounded shaft S-T (x1..55, z66..121, y0..343) with white ribs over cyan glass, the taper steps
// at y316/330/344 with smooth_quartz_slab caps, and the lit lobby glass base. Writes only onto the footprint (#) cells,
// only into air (the vocabulary helpers and placer() both refuse to overwrite), and never above y 343 (the crown and
// observatory are parts 4 and 5).
import {
  onFootprint, podiumFace, FIN, FIN_SLAB, GLASS_CLEAR, GLASS_CYAN, GLASS_LIGHT_GRAY, CONCRETE_WHITE,
  STONE, PANE_CLEAR, IRON, SEA_LANTERN,
} from "../vocab.mjs";

// The shaft's rounded plan: x1..55, z66..121, corner arcs of radius 9 about the centres (10,75), (46,75), (10,112), (46,112).
const SHAFT = { x0: 1, x1: 55, z0: 66, z1: 121, r: 9 };
const LOBBY_TOP = 14;
const SHAFT_TOP = 343;
const FLOOR_STEP = 7;
const FLOOR_BASE = 15;

// Writes go to footprint cells only (plan: build only on #). Every other method passes straight through to the grid.
function onFp(g) {
  const self = new Proxy(g, {
    get(t, p) {
      if (p === "set") return (x, y, z, ...rest) => {
        if (onFootprint(1, x, z)) t.set(x, y, z, ...rest);
        return self;
      };
      const v = Reflect.get(t, p);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
  return self;
}

// The taper: the outline steps in 1 cell on every side at y316, 330 and 344 (plan's taper rows).
const inset = (y) => (y >= 344 ? 3 : y >= 330 ? 2 : y >= 316 ? 1 : 0);

// Set of "x,z" cells inside the shaft outline at a given inset (rounded corners, radius r).
function outline(k) {
  const { r } = SHAFT;
  const x0 = SHAFT.x0 + k, x1 = SHAFT.x1 - k, z0 = SHAFT.z0 + k, z1 = SHAFT.z1 - k;
  const cxL = x0 + r, cxR = x1 - r, czN = z0 + r, czS = z1 - r;
  const cells = new Set();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const dx = x - Math.min(Math.max(x, cxL), cxR);
    const dz = z - Math.min(Math.max(z, czN), czS);
    if (dx * dx + dz * dz <= r * r) cells.add(`${x},${z}`);
  }
  return { cells, cxL, cxR, czN, czS };
}

// Outer ring: inside cells with a neighbour outside. Second ring: inside cells touching the outer ring.
function rings(cells) {
  const near = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => `${x + a},${z + b}`);
  const outer = [], inner = [];
  for (const key of cells) {
    const [x, z] = key.split(",").map(Number);
    if (near(x, z).some((k) => !cells.has(k))) outer.push([x, z]);
  }
  const outerSet = new Set(outer.map(([x, z]) => `${x},${z}`));
  for (const key of cells) {
    if (outerSet.has(key)) continue;
    const [x, z] = key.split(",").map(Number);
    if (near(x, z).some((k) => outerSet.has(k))) inner.push([x, z]);
  }
  return { outer, inner };
}

// Podium S-P: z0..50 footprint, y0..41. Facades on the four planes, floors and roof slab inside the walls.
function podium(g) {
  const box = [0, 0, 0, 56, 41, 50];
  for (const face of ["north", "south", "west", "east"]) podiumFace(g, box, face, { pierEvery: 6, bandEvery: 5 });
  // Floor plates at the storey lines and the roof slab (smooth_stone, full rows inside the facade planes).
  for (const y of [10, 15, 20, 25, 30, 35, 40]) {
    for (let x = 2; x <= 54; x++) for (let z = 2; z <= 48; z++) g.set(x, y, z, STONE);
  }
}

// Waist link S-W: glass box x9..47, z51..65, y1..29, roof terrace slab at y30, rail y31.
function waist(g) {
  const edge = (x, z) => x === 9 || x === 47 || z === 51 || z === 65;
  const corner = (x, z) => (x === 9 || x === 47) && (z === 51 || z === 65);
  for (let y = 1; y <= 29; y++) {
    for (let x = 9; x <= 47; x++) for (let z = 51; z <= 65; z++) {
      if (!edge(x, z)) continue;
      g.set(x, y, z, corner(x, z) ? IRON : GLASS_LIGHT_GRAY);
    }
  }
  for (let x = 9; x <= 47; x++) for (let z = 51; z <= 65; z++) {
    g.set(x, 30, z, STONE);
    if (edge(x, z)) g.set(x, 31, z, PANE_CLEAR);
  }
}

// Lobby base of the tower y1..14: clear glass in the outer ring, quartz piers every 3 cells, lit ceiling inside.
function lobby(g, { cells }) {
  const { outer, inner } = rings(cells);
  for (let y = 1; y <= LOBBY_TOP; y++) {
    for (const [x, z] of outer) g.set(x, y, z, (x + z) % 3 === 0 ? FIN : GLASS_CLEAR);
    if (y === LOBBY_TOP) for (const [x, z] of inner) if ((x + z) % 6 === 0) g.set(x, y, z, SEA_LANTERN);
  }
}

// Shaft S-T: rib ring on the outer plane (white concrete every second cell, every cell on the arcs), cyan glass one
// cell back, light gray floor lines every 7 rows from y15. Taper caps: smooth_quartz_slab on the ledge the step leaves.
function shaft(g) {
  let prev = outline(0);
  for (let y = FLOOR_BASE; y <= SHAFT_TOP; y++) {
    const cur = outline(inset(y));
    const { outer, inner } = rings(cur.cells);
    const floorLine = (y - FLOOR_BASE) % FLOOR_STEP === 0;
    for (const [x, z] of outer) {
      const corner = (x < cur.cxL || x > cur.cxR) && (z < cur.czN || z > cur.czS);
      if (corner || (x + z) % 2 === 0) g.set(x, y, z, CONCRETE_WHITE, {});
    }
    for (const [x, z] of inner) g.set(x, y, z, floorLine ? GLASS_LIGHT_GRAY : GLASS_CYAN, {});
    if (cur.cells.size !== prev.cells.size) {
      // The step: old outer-ring cells that the new outline leaves uncovered get a cap slab on the new ledge row.
      // Only where the ledge touches the new shell on two sides, so no cap sticks out on one face alone.
      const { outer: oldOuter } = rings(prev.cells);
      for (const [x, z] of oldOuter) {
        if (cur.cells.has(`${x},${z}`)) continue;
        const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => cur.cells.has(`${x + a},${z + b}`)).length;
        if (sides >= 2) g.set(x, y, z, FIN_SLAB, { type: "bottom" });
      }
    }
    prev = cur;
  }
}

export function build(g) {
  const f = onFp(g);
  podium(f);
  waist(f);
  lobby(f, outline(0));
  shaft(f);
}
