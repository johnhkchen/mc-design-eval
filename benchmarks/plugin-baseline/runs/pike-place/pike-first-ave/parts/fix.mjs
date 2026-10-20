// Part "The Fix building" (plot 3, x 196..260): a five-storey brick warehouse turned apartments on Western Avenue.
// Brick shell from each column's ground up to y36 (plan.md F1), stone_bricks base and rusticated piers (F2), L1 openings
// (F3), multi-pane windows with sills and terracotta lintels (F4), belt courses at y8 and y29 (F5), fire escapes on the
// two west treads (F6), parapet with stepped crests to y41 (F7), water tank (F8), stair bulkhead (F9), doors (F10).
// Plot-local coordinates as in plan.md; the view below shifts them onto the module grid by the plot offset.
import { readFileSync } from "node:fs";
import { ringOf, groundAt, bayRhythm, fireEscape, steppedCrest, waterTank, bulkhead, doorPair, PLOTS } from "../vocab.mjs";

const PL = PLOTS.fix, OFF = PL.offset;
const site = JSON.parse(readFileSync(new URL("../site.json", import.meta.url), "utf8")).plots.fix;
const plot = { footprint: site.footprint, ground: site.ground.map((row) => row.map((v) => (v === "." ? null : Number(v)))) };
const R = ringOf(plot);
const ring = (x, z) => R.get(`${x},${z}`);
const G = (x, z) => groundAt(plot, x, z);
const TOP = 36;                                  // brick body to the roof deck
const DECK = 36;
const FLOORS = [1, 8, 15, 22, 29];               // storey floor blocks (plan.md FLOORS)
const FIRE_FLOORS = [8, 15, 22, 29];

// The module grid, seen in plot-local coordinates: every helper writes through this view.
function view(g) {
  return {
    inBounds: (x, y, z) => x >= 0 && z >= 0 && x < PL.w && z < PL.d && g.inBounds(x + OFF, y, z),
    isAir: (x, y, z) => g.isAir(x + OFF, y, z),
    blockAt: (x, y, z) => g.blockAt(x + OFF, y, z),
    set: (x, y, z, ...rest) => g.set(x + OFF, y, z, ...rest),
  };
}

// Wall-plane treads of one ring: runs of cells with the same outward face, sorted along the wall.
function treads(k) {
  const groups = new Map();
  for (const [kk, { ring: r, faceDir }] of R) {
    if (r !== k) continue;
    const [x, z] = kk.split(",").map(Number);
    const alongX = faceDir === "north" || faceDir === "south";
    const gk = `${faceDir}:${alongX ? z : x}`;
    if (!groups.has(gk)) groups.set(gk, { face: faceDir, alongX, cells: [] });
    groups.get(gk).cells.push([x, z]);
  }
  const out = [];
  for (const { face, alongX, cells } of groups.values()) {
    cells.sort((a, b) => (alongX ? a[0] - b[0] : a[1] - b[1]));
    let run = [];
    for (const c of cells) {
      const last = run[run.length - 1];
      if (last && (alongX ? c[0] - last[0] : c[1] - last[1]) !== 1) { out.push({ face, cells: run }); run = []; }
      run.push(c);
    }
    if (run.length) out.push({ face, cells: run });
  }
  return out;
}

// The bay rhythm of bayRhythm (vocab/h4.mjs windowRuns): which indices of an n-cell tread carry a window.
function spans(n) {
  if (n <= 4) return [];
  if (n === 6) return [[2, 3]];
  if (n === 8) return [[1, 2], [5, 6]];
  const k = Math.floor((n - 1) / 3), span = 3 * k - 1, s = Math.floor((n - span) / 2);
  return Array.from({ length: k }, (_, j) => [s + 3 * j, s + 3 * j + 1]);
}

export function build(g) {
  const V = view(g);
  const put = (x, y, z, ...spec) => { if (V.isAir(x, y, z)) V.set(x, y, z, ...spec); };
  const WALL = treads(1);

  // Openings in the wall plane: window cells (per storey) and door cells. The shell leaves them as air.
  const open = new Set(), lintel = new Set(), winCell = new Set();
  const key3 = (x, y, z) => `${x},${y},${z}`;
  const storeys = [{ floor: 1, h: 5 }, ...FIRE_FLOORS.map((f) => ({ floor: f, h: 4 }))];
  for (const t of WALL) for (const { floor, h } of storeys) {
    for (const run of spans(t.cells.length)) for (const i of run) {
      const [x, z] = t.cells[i];
      winCell.add(`${x},${z}`);
      for (let y = floor + 1; y <= floor + h; y++) open.add(key3(x, y, z));
      if (floor > 1) lintel.add(key3(x, floor + h + 1, z));       // terracotta lintel row, ring 1 (F4)
    }
  }
  // Doors (F10): entrance on x=3 z38..39, shop doors on x=9 at z18..19 and z22..23.
  const doors = [
    { x: 3, z: 38, face: "west", y: Math.max(1, G(3, 38)) },
    { x: 9, z: 18, face: "west", y: Math.max(1, G(9, 18)) },
    { x: 9, z: 22, face: "west", y: Math.max(1, G(9, 22)) },
  ];
  for (const d of doors) for (let dz = 0; dz < 2; dz++) for (let y = d.y; y <= d.y + 1; y++) open.add(key3(d.x, y, d.z + dz));

  // Fire escape columns (ring 0, F6) and the wall cells behind them; these ring-0 cells stay reserved.
  const fire = [
    { x: 8, z0: 16, z1: 23 },
    { x: 2, z0: 36, z1: 43 },
  ];
  const reserved = new Set();
  for (const f of fire) for (let z = f.z0; z <= f.z1; z++) reserved.add(`${f.x},${z}`);

  // 1. Brick shell (F1): each wall column from its ground up to the roof deck.
  for (const [kk, { ring: r }] of R) {
    if (r !== 1) continue;
    const [x, z] = kk.split(",").map(Number);
    for (let y = G(x, z); y <= TOP; y++) {
      if (open.has(key3(x, y, z))) continue;
      put(x, y, z, lintel.has(key3(x, y, z)) ? "terracotta" : "bricks");
    }
  }

  // 2. Fire escapes (F6) on the ring-0 columns; their wall cells are the ring-1 cells behind them.
  const crest = [];
  for (const f of fire) {
    const cells = [];
    for (let z = f.z0; z <= f.z1; z++) if (ring(f.x + 1, z)?.ring === 1) cells.push([f.x + 1, z]);
    const tread = { face: "west", cells, wall: cells };
    fireEscape(V, tread, { x: f.x, z0: f.z0, z1: f.z1, floors: FIRE_FLOORS, ladderTo: 4 });
    crest.push(tread);
  }

  // 3. Doors (F10): doorPair writes the leaves and the slab approach.
  for (const d of doors) doorPair(V, { x: d.x, z: d.z, y: d.y, face: d.face, ground: Math.min(G(d.x - 1, d.z), d.y) });

  // 4. Windows (F3, F4): glass in the openings, sills at ring 0 on each floor line.
  for (const t of WALL) for (const { floor, h } of storeys) bayRhythm(V, t, { floorY: floor, h, sill: "smooth_stone" });

  // 5. Base (F2): stone_bricks on ring 0 from ground to y1; west treads rusticated with piers to y8.
  for (const [kk, { ring: r, faceDir }] of R) {
    if (r !== 0) continue;
    const [x, z] = kk.split(",").map(Number);
    if (reserved.has(kk)) continue;
    for (let y = G(x, z); y <= 1; y++) put(x, y, z, "stone_bricks");
    if (faceDir === "west" && !winCell.has(`${x + 1},${z}`)) {
      for (let y = Math.max(2, G(x, z)); y <= 8; y++) put(x, y, z, "stone_bricks");
    }
  }

  // 6. Belt courses (F5): stone_brick_slab on ring 0 at y8 and y29, where no window sill took the cell.
  for (const y of [8, 29]) for (const [kk, { ring: r }] of R) {
    if (r !== 0 || reserved.has(kk)) continue;
    const [x, z] = kk.split(",").map(Number);
    put(x, y, z, "stone_brick_slab", { type: "bottom" });
  }

  // 7. Floors (interior, ring >= 2) and the roof deck at y36 (F1).
  for (const [kk, { ring: r }] of R) {
    if (r < 2) continue;
    const [x, z] = kk.split(",").map(Number);
    for (const f of FLOORS) if (f >= G(x, z)) put(x, f, z, "spruce_planks");
    put(x, DECK, z, "gray_concrete");
  }

  // 8. Parapet (F7): bricks at ring 1 to y38; coping at y39; the crests step up over the fire-escape treads.
  const crestCells = new Set(crest.flatMap((t) => t.cells.map(([x, z]) => `${x},${z}`)));
  for (const [kk, { ring: r }] of R) {
    if (r !== 1) continue;
    const [x, z] = kk.split(",").map(Number);
    put(x, 37, z, "bricks");
    put(x, 38, z, "bricks");
    if (!crestCells.has(kk)) put(x, 39, z, "stone_brick_slab", { type: "bottom" });
  }
  for (const t of crest) steppedCrest(V, t, { y0: 39, y1: 41 });

  // 9. Water tank (F8) and stair bulkhead (F9) on the roof.
  waterTank(V, { cx: 32, cz: 32, r: 2, y0: 37 });
  bulkhead(V, [40, 37, 36, 44, 41, 40], { door: "south" });
}
