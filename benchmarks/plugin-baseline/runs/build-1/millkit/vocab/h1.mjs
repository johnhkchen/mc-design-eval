// Mill village vocabulary, first set (plan.md VOCABULARY): lane_strip, gate_pair, house_walls, door, stove, scarecrow,
// well, wash_line, crate_stack. Same rules as h2: every helper takes its position as arguments, speaks plan.md
// coordinates (ground surface y 0, standing level y 1), writes only into air inside its own footprint, and returns
// { placed, skipped }: skipped lists the cells it was not allowed to write.
// Two exceptions, named where they apply: lane_strip lays the surface itself and well digs its own shaft, so both may
// replace the GROUND blocks below. Nothing else is ever written over ground, sand or floor.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const GROUND = new Set(["grass_block", "coarse_dirt", "dirt", "podzol", "rooted_dirt", "dirt_path", "gravel", "stone"]);

// One writer per call. put() writes into an air cell inside the grid; ground() also replaces a GROUND cell.
function writer(g) {
  const out = { placed: 0, skipped: [] };
  const write = (ground, x, y, z, ...block) => {
    const here = g.inBounds(x, y, z) ? g.blockAt(x, y, z).replace(/^minecraft:/, "") : null;
    const free = here !== null && (here === "air" || here === "cave_air" || here === "void_air" || (ground && GROUND.has(here)));
    if (free) { g.set(x, y, z, ...block); out.placed++; }
    else out.skipped.push([x, y, z]);
  };
  return { put: (...a) => write(false, ...a), ground: (...a) => write(true, ...a), out };
}

// Fence connections: the sides named in `to` join a neighbour; the rest stay open.
const fence = (...to) => ({ north: String(to.includes("north")), east: String(to.includes("east")), south: String(to.includes("south")), west: String(to.includes("west")), waterlogged: "false" });

// lane_strip(g, x0, x1): the lane surface on y 0 from x0 to x1, z 0..4: coarse_dirt at z 0 and 4, dirt_path ruts at
// z 1 and 3, gravel between. It lays the surface itself, so it may replace the GROUND blocks on y 0.
const LANE = ["coarse_dirt", "dirt_path", "gravel", "dirt_path", "coarse_dirt"];
export function lane_strip(g, x0, x1) {
  const w = writer(g);
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) LANE.forEach((block, z) => w.ground(x, 0, z, block));
  return w.out;
}

// gate_pair(g, x, z, wood): two <wood>_fence_gate at x and x+1 on y 1, facing south, closed. Footprint x..x+1, y 1, z.
export function gate_pair(g, x, z, wood) {
  const w = writer(g);
  for (const gx of [x, x + 1]) w.put(gx, 1, z, `${wood}_fence_gate`, { facing: "south", open: "false", in_wall: "false" });
  return w.out;
}

// house_walls(g, [x0, z0, x1, z1], plank, post, openings, { gable }): the walls of a house footprint, y 3..6: planks on
// the four walls, `post` at the corners (axis y) and as the head plate on y 6 (axis x on the front and back walls, z on
// the ends). openings: [x0, y0, z0, x1, y1, z1] boxes left air. gable "z" or "x": the two walls across that axis carry
// a 45-degree gable triangle above y 6, closing itself at the apex ("z": the z-end walls, ridge along z).
export function house_walls(g, [x0, z0, x1, z1], plank, post, openings = [], { gable } = {}) {
  const w = writer(g);
  const open = (x, y, z) => openings.some(([a, b, c, d, e, f]) => a <= x && x <= d && b <= y && y <= e && c <= z && z <= f);
  for (let y = 3; y <= 6; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    if (!edge || open(x, y, z)) continue;
    if (corner) w.put(x, y, z, post, { axis: "y" });
    else if (y === 6) w.put(x, y, z, post, { axis: z === z0 || z === z1 ? "x" : "z" });
    else w.put(x, y, z, plank);
  }
  if (gable) {
    const ends = gable === "z" ? [z0, z1] : [x0, x1];
    for (let k = 1; ; k++) {
      const lo = (gable === "z" ? x0 : z0) + k, hi = (gable === "z" ? x1 : z1) - k;
      if (lo > hi) break;
      for (const e of ends) for (let a = lo; a <= hi; a++) {
        const [x, z] = gable === "z" ? [a, e] : [e, a];
        if (!open(x, 6 + k, z)) w.put(x, 6 + k, z, plank);
      }
    }
  }
  return w.out;
}

// door(g, x, z, kind, facing, hinge, { step }): a <kind>_door on the wall cell x,z, both halves (y 3 and 4) with the same
// facing and hinge; kind is the wood word (birch, spruce, oak, jungle, dark_oak). step: an optional block id for the
// cell outside the door, on y 2 so its top is the threshold at y 3 ("oak_stairs" facing in, or a "_slab" top half).
export function door(g, x, z, kind, facing = "north", hinge = "left", { step } = {}) {
  const w = writer(g);
  w.put(x, 3, z, ...B.door(kind, facing, "lower", hinge));
  w.put(x, 4, z, ...B.door(kind, facing, "upper", hinge));
  if (step) {
    const [dx, , dz] = DIRS[facing];
    if (step.endsWith("_slab")) w.put(x + dx, 2, z + dz, step, { type: "top" });
    else w.put(x + dx, 2, z + dz, step, { facing: OPPOSITE[facing], half: "bottom", shape: "straight" });
  }
  return w.out;
}

// stove(g, x, y, z, facing): a lit smoker at x,y,z facing into its room, with the chimney wall behind it.
export function stove(g, x, y, z, facing) {
  const w = writer(g);
  w.put(x, y, z, "smoker", { facing, lit: "true" });
  return w.out;
}

// scarecrow(g, x, z): an oak_fence post on y 1, hay_block on y 2 with fence arms east and west of it, carved_pumpkin on
// y 3 facing north. Footprint x-1..x+1 on y 2, x on y 1..3.
export function scarecrow(g, x, z) {
  const w = writer(g);
  w.put(x, 1, z, "oak_fence", fence());
  w.put(x, 2, z, "hay_block", { axis: "y" });
  w.put(x, 3, z, "carved_pumpkin", { facing: "north" });
  w.put(x - 1, 2, z, "oak_fence", fence("east"));
  w.put(x + 1, 2, z, "oak_fence", fence("west"));
  return w.out;
}

// well(g, x0, z0): the shared well, footprint x0..x0+3, z0..z0+3 (plan: 76, 9). Cobblestone ring on y 1; a water shaft on
// the ring's inside (2x2) from y -3 to y 0, dug through the ground (the only ground it replaces). Oak_log posts at the four
// corners, y 2..4; oak_stairs roof on y 5 at the two ends rising to two oak_log ridge beams along z, with an oak_slab cap
// on y 6; iron_chain on y 4 hanging from the beam over the shaft, and a hanging lantern on y 3 below it.
export function well(g, x0, z0) {
  const w = writer(g);
  const x1 = x0 + 3, z1 = z0 + 3;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const inside = x > x0 && x < x1 && z > z0 && z < z1;
    if (!inside) w.put(x, 1, z, "cobblestone");
    else for (let y = -3; y <= 0; y++) w.ground(x, y, z, "water");
  }
  for (const x of [x0, x1]) for (const z of [z0, z1]) for (let y = 2; y <= 4; y++) w.put(x, y, z, "oak_log", { axis: "y" });
  for (let z = z0; z <= z1; z++) {
    w.put(x0, 5, z, ...B.stairs("oak", "east"));
    w.put(x1, 5, z, ...B.stairs("oak", "west"));
    for (const x of [x0 + 1, x0 + 2]) {
      w.put(x, 5, z, "oak_log", { axis: "z" });
      w.put(x, 6, z, ...B.slab("oak", "bottom"));
    }
  }
  w.put(x0 + 1, 4, z0 + 1, "iron_chain", { axis: "y" });
  w.put(x0 + 1, 3, z0 + 1, ...B.lantern(true));
  return w.out;
}

// wash_line(g, x0, x1, z, sheets, wool): oak_fence posts at x0 and x1 on y 1..4, an oak_fence rail on y 4 between them,
// and wool sheets (default white_wool) hung on y 3 under the rail at each x in `sheets`.
export function wash_line(g, x0, x1, z, sheets = [], wool = "white_wool") {
  const w = writer(g);
  const a = Math.min(x0, x1), b = Math.max(x0, x1);
  for (let y = 1; y <= 4; y++) {
    w.put(a, y, z, "oak_fence", fence(...(y === 4 ? ["east"] : [])));
    w.put(b, y, z, "oak_fence", fence(...(y === 4 ? ["west"] : [])));
  }
  for (let x = a + 1; x < b; x++) w.put(x, 4, z, "oak_fence", fence("east", "west"));
  for (const x of sheets) w.put(x, 3, z, wool);
  return w.out;
}

// crate_stack(g, x, z, n): n crates (1 to 3) stacked on the ground from y 1 up: a barrel facing up at the bottom, a chest,
// then a hay_block. Footprint x, z, y 1..n.
export function crate_stack(g, x, z, n = 2) {
  if (![1, 2, 3].includes(n)) throw new RangeError(`crate_stack: n must be 1, 2 or 3, got ${n}`);
  const w = writer(g);
  const levels = [["barrel", { facing: "up", open: "false" }], ["chest", undefined], ["hay_block", { axis: "y" }]];
  for (let i = 0; i < n; i++) w.put(x, 1 + i, z, levels[i][0], levels[i][1]);
  return w.out;
}
