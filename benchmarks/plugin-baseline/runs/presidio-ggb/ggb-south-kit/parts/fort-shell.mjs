// Plot 0 fort shell: casemate ring, parapet, gun ports, loopholes, sally port, parade arcades (plan.md FACADES, as
// revised on the owner's v2 comment: a solid, level, intact fort). The shell is laid cell by cell from the footprint
// map, so every face is a plain vertical brick wall and the openings sit on one regular grid:
// - water fronts (faces looking north or west): three rows of 1-wide dark openings (recessed 1, black_concrete back) on
//   every other cell (odd x on north faces, odd z on west faces) at y 1, 3, 5, each row on a stone sill course (the
//   ground course under tier 1, y 2 and y 4 above); y 6..7 brick, the y 8 coping;
// - landward fronts (south, east): a stone base course at y 1 and one row of narrow slits (y 3..4, recessed 1) every 4;
// - parade faces: 2-wide arches (pier, open, open), stacked on the three tiers, upside-down brick stairs as arch heads;
// - parapet y 7 bricks with a y 8 stone coping on every outer cell (8-neighbour, so the stepped corners close);
//   the parade rail y 7 brick_wall.
// "Granite" in the comment is the real fort's grey granite: stone_bricks here, since polished_granite is the bricks' tone.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BRICKS, BRICK_SLAB, BRICK_WALL, BLACK_CONCRETE, STONE_BRICKS, CHISELED_STONE_BRICKS } from "../vocab.mjs";

const MASK = [
  "............###....#..",
  "..........###########.",
  ".........#############",
  ".......#####..#######.",
  "###..#####....######..",
  "########.......####...",
  "#######.........###...",
  ".######.........###...",
  "..#####.......#####...",
  "..###.......#######...",
  "..###.....########....",
  "..##.....########.....",
  "..###..########.......",
  "..###########.........",
  "..#########...........",
  "..#######.............",
  "..#####...............",
  "..####................",
  "...#..................",
];
const W = 43, D = 37;
const TRIM = STONE_BRICKS;
const isFort = (x, z) => x >= 0 && z >= 0 && x < W && z < D && MASK[z >> 1][x >> 1] === "#";

// open cells reachable from outside the plot = outside; the enclosed rest = parade
const outside = new Set();
{
  const q = [];
  const push = (x, z) => { const k = `${x},${z}`; if (x < -1 || z < -1 || x > W || z > D || isFort(x, z) || outside.has(k)) return; outside.add(k); q.push([x, z]); };
  push(-1, -1);
  while (q.length) { const [x, z] = q.pop(); push(x + 1, z); push(x - 1, z); push(x, z + 1); push(x, z - 1); }
}
const isOut = (x, z) => outside.has(`${x},${z}`) || x < 0 || z < 0 || x >= W || z >= D;
const isParade = (x, z) => !isFort(x, z) && !isOut(x, z);

const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const TOWERS = [[24, 0, 27, 3], [38, 2, 41, 5], [4, 32, 7, 35]];
const BUTTRESS = [38, 0, 39, 1];
const SALLY = [25, 25, 28, 25]; // the sally port's framed face cells
const inBox = (x, z, [x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const inTower = (x, z) => TOWERS.some((b) => inBox(x, z, b));

// the faces of a fort cell: the directions whose neighbour is outside / the parade
const facesOf = (x, z, pred) => Object.keys(DIR).filter((f) => pred(x + DIR[f][0], z + DIR[f][1]));

// straight runs of face cells: isFace(f)(x, z) says whether (x, z) is a face cell looking f; runs go along +x or +z
function faceRuns(dirs, isFace, minLen) {
  const runs = [];
  for (const f of dirs) {
    const along = f === "north" || f === "south" ? "x" : "z";
    const test = isFace(f), seen = new Set();
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      if (!test(x, z) || seen.has(`${x},${z}`)) continue;
      const run = [];
      let [a, b] = [x, z];
      while (test(a, b)) { run.push([a, b]); seen.add(`${a},${b}`); if (along === "x") a++; else b++; }
      if (run.length >= minLen) runs.push({ f, run });
    }
  }
  return runs;
}
// the first cell of each bay of `step` along a run of L, the bays centred (a pier at both ends)
function bays(L, step) {
  const n = Math.floor((L - 1) / step), off = Math.floor((L - (step * n + 1)) / 2);
  return Array.from({ length: n }, (_, k) => off + step * k + 1);
}

export function build(g) {
  const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
  const cell = new Map(); // "x,y,z" -> [block, state], the shell's own plan before it is written
  const plan = (x, y, z, block, state) => cell.set(`${x},${y},${z}`, [block, state]);

  // 1. the solid ring: base course y 1 (stone), bricks y 2..6
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!isFort(x, z)) continue;
    plan(x, 1, z, TRIM);
    for (let y = 2; y <= 6; y++) plan(x, y, z, BRICKS);
  }

  // 2. water fronts: sill courses and the three rows of gun ports
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!isFort(x, z) || inBox(x, z, BUTTRESS)) continue;
    const out = facesOf(x, z, isOut);
    const water = out.filter((f) => f === "north" || f === "west");
    if (!water.length) continue;
    plan(x, 1, z, BRICKS); // tier 1 sits on the ground course, its sill
    for (const y of [2, 4]) plan(x, y, z, TRIM);
    if (out.length > 1) continue; // convex corners stay solid piers
    const f = water[0];
    if ((f === "north" ? x : z) % 2 !== 1) continue;
    const [dx, dz] = DIR[f];
    const bx = x - dx, bz = z - dz; // the cell behind, one deeper
    if (!isFort(bx, bz) || facesOf(bx, bz, isOut).length || facesOf(bx, bz, isParade).length) continue;
    for (const y of [1, 3, 5]) { plan(x, y, z, "air"); plan(bx, y, bz, BLACK_CONCRETE); }
  }

  // 3. landward fronts: one row of narrow slits, y 3..4, on every straight run of 3+ (centred, every 3 on long runs);
  //    the 2-wide risers of the stepped diagonals stay plain (they read as buttresses)
  const isLand = (f) => (a, b) => isFort(a, b) && !inBox(a, b, SALLY) && !(a >= 24 && a <= 29 && b === 25) && facesOf(a, b, isOut).join() === f;
  for (const { f, run } of faceRuns(["south", "east"], isLand, 3)) {
    const [dx, dz] = DIR[f];
    for (const i of run.length <= 5 ? [(run.length - 1) >> 1] : bays(run.length, 3)) {
      const [x, z] = run[i], bx = x - dx, bz = z - dz;
      if (!isFort(bx, bz) || facesOf(bx, bz, isOut).length || facesOf(bx, bz, isParade).length) continue;
      for (const y of [3, 4]) { plan(x, y, z, "air"); plan(bx, y, bz, BLACK_CONCRETE); }
    }
  }

  // 4. parade arcades: on each straight run of parade face (4+ long), 2-wide arches (pier, open, open), three tiers
  const isArcade = (f) => (a, b) => isFort(a, b) && facesOf(a, b, isParade).includes(f) && !facesOf(a, b, isOut).length;
  const runs = faceRuns(Object.keys(DIR), isArcade, 4);
  for (const { f, run } of runs) {
    const [dx, dz] = DIR[f];
    // the two halves of each arch: the stair's foot faces its own pier
    const lowSide = f === "north" || f === "south" ? "west" : "north";
    const highSide = f === "north" || f === "south" ? "east" : "south";
    for (const s0 of bays(run.length, 3)) for (const [i, side] of [[s0, lowSide], [s0 + 1, highSide]]) {
      const [x, z] = run[i];
      const bx = x - dx, bz = z - dz;
      if (!isFort(bx, bz)) continue;
      for (const [lo, hi] of [[1, 2], [3, 4], [5, 6]]) {
        plan(x, lo, z, lo === 1 ? "air" : BRICK_SLAB, lo === 1 ? undefined : { type: "bottom" });
        plan(x, hi, z, ...B.stairs("brick", side, "top"));
        plan(bx, lo, bz, BLACK_CONCRETE);
        if (hi < 6) plan(bx, hi, bz, BLACK_CONCRETE); // y 6 is the deck top: it stays brick
      }
    }
  }

  // 5. sally port on z 25: passage x 26..27, y 1..3, z 18..25; stone jambs, arch head, lintel and keystones
  for (let z = 18; z <= 25; z++) for (let y = 1; y <= 3; y++) for (const x of [26, 27]) plan(x, y, z, "air");
  for (let y = 1; y <= 3; y++) { plan(25, y, 25, TRIM); plan(28, y, 25, TRIM); }
  plan(26, 3, 25, ...B.stairs("stone_brick", "west", "top"));
  plan(27, 3, 25, ...B.stairs("stone_brick", "east", "top"));
  for (const x of [25, 28]) plan(x, 4, 25, TRIM);
  plan(26, 4, 25, CHISELED_STONE_BRICKS);
  plan(27, 4, 25, CHISELED_STONE_BRICKS);

  // 6. parapet (outer, 8-neighbour so stepped corners close) and parade rail; towers build their own tops
  const rail = new Set();
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!isFort(x, z) || inTower(x, z)) continue;
    const nb = N8.map(([dx, dz]) => [x + dx, z + dz]);
    if (nb.some(([a, b]) => isOut(a, b))) { plan(x, 7, z, BRICKS); plan(x, 8, z, TRIM); }
    else if (nb.some(([a, b]) => isParade(a, b))) rail.add(`${x},${z}`);
  }
  for (const k of rail) {
    const [x, z] = k.split(",").map(Number);
    const state = { up: "true" };
    for (const [f, [dx, dz]] of Object.entries(DIR)) if (rail.has(`${x + dx},${z + dz}`)) state[f] = "low";
    plan(x, 7, z, BRICK_WALL, state);
  }

  for (const [k, [block, state]] of cell) {
    const [x, y, z] = k.split(",").map(Number);
    put(x, y, z, block, state);
  }
  return g;
}
