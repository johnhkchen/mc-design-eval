// Vocabulary helpers from plan.md VOCABULARY: plinth, lancet, tower_buttress, spire_ring, spire_cross, gable_roof_x,
// flyer, slab_ramp, quoin. Every helper takes its footprint `box` = [[x0,y0,z0],[x1,y1,z1]] (inclusive, any order)
// and returns the number of blocks it placed. It writes only inside `box` and only into air (quoin: `over` lets it
// replace solid cells). Positions and facings are arguments; nothing is fixed to a spot.
//
// Walls: `face` is the way the outside faces ("west" = the street at -x). `p` = the outer-face plane (x for
// east/west, z for north/south), `c` = the centre along the wall, `d` = depth inward (0 = the outer face).
// Stairs `facing` = the side of the full-height back, as in the toolkit.
import { B, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ALONG = { west: "south", east: "south", north: "east", south: "east" }; // +u along the wall, per face
const WALL = {
  west: (p, c, u, d) => [p + d, c + u],
  east: (p, c, u, d) => [p - d, c + u],
  north: (p, c, u, d) => [c + u, p + d],
  south: (p, c, u, d) => [c + u, p - d],
};
const SIDES = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];

const lo = (a, b) => Math.min(a, b);
const hi = (a, b) => Math.max(a, b);
const inBox = ([a, b], x, y, z) =>
  x >= lo(a[0], b[0]) && x <= hi(a[0], b[0]) && y >= lo(a[1], b[1]) && y <= hi(a[1], b[1]) && z >= lo(a[2], b[2]) && z <= hi(a[2], b[2]);

/** Deterministic 0..1 value from integers: the same cell always gets the same material. */
function hash(...n) {
  let h = 2166136261;
  for (const v of n) h = Math.imul(h ^ (v | 0), 16777619);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/** Walls connect "low" to the walls beside them on the same row; `up` is always true. */
function wallState(c, walls) {
  const state = { up: "true" };
  for (const [side, dx, dz] of SIDES) if (walls.has(`${c.x + dx},${c.y},${c.z + dz}`)) state[side] = "low";
  return state;
}

/**
 * Writes a plan ([{x,y,z,block,state}]) into the footprint: a cell is written only if it is inside `box` and is air
 * (or `over` is set). The last plan entry for a cell wins, so a helper can overwrite its own cells.
 */
function commit(g, box, plan, { over = false } = {}) {
  const cells = new Map();
  for (const c of plan) cells.set(`${c.x},${c.y},${c.z}`, c);
  const walls = new Set([...cells].filter(([, c]) => c.block === "diorite_wall").map(([k]) => k));
  let placed = 0;
  for (const c of cells.values()) {
    if (!inBox(box, c.x, c.y, c.z)) continue;
    if (!over && !g.isAir(c.x, c.y, c.z)) continue;
    g.set(c.x, c.y, c.z, c.block, c.block === "diorite_wall" ? wallState(c, walls) : c.state);
    placed++;
  }
  return placed;
}

/** Solid polished_andesite over the box: the plinth course. The ground under it belongs to an earlier part. */
export function plinth(g, box) {
  const [[ax, ay, az], [bx, by, bz]] = box;
  const plan = [];
  for (let x = lo(ax, bx); x <= hi(ax, bx); x++)
    for (let y = lo(ay, by); y <= hi(ay, by); y++)
      for (let z = lo(az, bz); z <= hi(az, bz); z++) plan.push({ x, y, z, block: "polished_andesite", state: {} });
  return commit(g, box, plan);
}

/**
 * A pointed lancet of width w (odd) centred at u = 0 on the wall, from y0 to y1. Outer face (d 0): a pointed head of
 * upside-down polished_diorite stairs meeting at a keystone. Depth 1: a sill, then stained-glass panes (blue 50%,
 * red/purple 35%, yellow 15%) with diorite_wall mullions every 2 columns. Depth 2: ochre_froglight behind each pane.
 * The opening must be air (the shell leaves it).
 */
export function lancet(g, box, face, p, c, y0, y1, w = 3) {
  const h = (w - 1) / 2, along = ALONG[face], plan = [];
  const at = (u, y, d) => { const [x, z] = WALL[face](p, c, u, d); return { x, y, z }; };
  const put = (u, y, d, [block, state = {}]) => plan.push({ ...at(u, y, d), block, state });
  const isMullion = (u) => (u + h) % 2 === 0;
  const isPane = (u) => u >= -h && u <= h && !isMullion(u);
  const pane = (u, y) => {
    const { x, z } = at(u, y, 1);
    const r = hash(x, y, z, 1);
    const colour = r < 0.5 ? "blue" : r < 0.85 ? (hash(x, y, z, 2) < 0.5 ? "red" : "purple") : "yellow";
    const state = { north: "false", east: "false", south: "false", west: "false" };
    if (isPane(u + 1)) state[along] = "true";
    if (isPane(u - 1)) state[OPPOSITE[along]] = "true";
    return [`${colour}_stained_glass_pane`, state];
  };

  for (let u = -h; u <= h; u++) {
    put(u, y0, 0, B.slab("polished_diorite", "bottom"));
    put(u, y0, 1, B.slab("polished_diorite", "bottom"));
  }
  for (let k = 0; k < h; k++)
    for (const s of [-1, 1]) put(s * (h - k), y1 - k, 0, B.stairs("polished_diorite", s < 0 ? along : OPPOSITE[along], "top"));
  put(0, y1, 0, B.block("polished_diorite"));
  for (let y = y0 + 1; y <= y1; y++)
    for (let u = -h; u <= h; u++) {
      if (isMullion(u)) put(u, y, 1, B.block("diorite_wall"));
      else {
        put(u, y, 1, pane(u, y));
        put(u, y, 2, B.block("ochre_froglight"));
      }
    }
  return commit(g, box, plan);
}

/**
 * A corner buttress at the outside corner cell (corner.x, corner.z); (sx, sz) = the outward signs (±1). It sits proud
 * of the corner: a 2x2 of calcite/diorite from y0 to 13, then 1x1 to y1 (set back at y14 and y30). Polished_diorite
 * stairs (upside down) weather each set-back ledge. `pinnacle` > 0 adds a diorite_wall shaft and an end_rod above y1.
 */
export function tower_buttress(g, box, corner, y0, y1, { pinnacle = 0 } = {}) {
  const { x, z, sx, sz } = corner;
  const stageOf = (y) => (y >= 30 ? 2 : y >= 14 ? 1 : 0);
  const foot = (s) => (s === 0 ? [[1, 1], [2, 1], [1, 2], [2, 2]] : [[1, 1]]);
  const cell = (i, j) => [x + sx * i, z + sz * j];
  const inwardX = sx > 0 ? "west" : "east";
  const inwardZ = sz > 0 ? "north" : "south";
  const plan = [];

  for (let y = y0; y <= y1; y++)
    for (const [i, j] of foot(stageOf(y))) {
      const [cx, cz] = cell(i, j);
      const r = hash(cx, y, cz, 7);
      const block = r < (y - y0 < 3 ? 0.7 : 0.4) ? "diorite" : "calcite";
      plan.push({ x: cx, y, z: cz, block, state: {} });
    }

  for (let y = y0 + 1; y <= y1; y++) {
    if (stageOf(y) === stageOf(y - 1)) continue;
    const next = foot(stageOf(y));
    for (const [i, j] of foot(stageOf(y - 1))) {
      if (next.some(([a, b]) => a === i && b === j)) continue;
      const [cx, cz] = cell(i, j);
      const [block, state] = B.stairs("polished_diorite", i > 1 ? inwardX : inwardZ, "top");
      plan.push({ x: cx, y, z: cz, block, state });
    }
  }

  if (pinnacle > 0) {
    const [px, pz] = cell(1, 1);
    for (let y = y1 + 1; y <= y1 + pinnacle; y++) plan.push({ x: px, y, z: pz, block: "diorite_wall", state: {} });
    plan.push({ x: px, y: y1 + pinnacle + 1, z: pz, block: "end_rod", state: { facing: "up" } });
  }
  return commit(g, box, plan);
}

/**
 * An octagonal ring of width (odd: 9, 7, 5, 3 or 1) centred at (cx, cz) on row y: diorite_wall and calcite alternating
 * around the edge with the corners cut. `lace`: only diorite_wall posts beside the cut corners, air between them.
 * `phase` flips the alternation so adjacent rings differ.
 */
export function spire_ring(g, box, cx, cz, width, y, { lace = false, phase = 0 } = {}) {
  if (width % 2 === 0) throw new Error(`spire_ring: width ${width} must be odd`);
  const h = (width - 1) / 2;
  let cells = [[0, 0]];
  if (width > 1) {
    cells = [];
    for (let dx = -h; dx <= h; dx++)
      for (let dz = -h; dz <= h; dz++) {
        const edge = Math.max(Math.abs(dx), Math.abs(dz)) === h;
        const corner = Math.abs(dx) === h && Math.abs(dz) === h;
        if (edge && !corner) cells.push([dx, dz]);
      }
    cells.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
    if (lace) cells = cells.filter(([dx, dz]) => (Math.abs(dx) === h && Math.abs(dz) === h - 1) || (Math.abs(dz) === h && Math.abs(dx) === h - 1));
  }
  const plan = cells.map(([dx, dz], k) => {
    const post = lace || (k + phase) % 2 === 0;
    return { x: cx + dx, y, z: cz + dz, block: post ? "diorite_wall" : "calcite", state: {} };
  });
  return commit(g, box, plan);
}

/**
 * The cross on top of a spire: a diorite_wall shaft of 5 from y, arms at y+3 on z±1, an end_rod at y+5.
 */
export function spire_cross(g, box, x, y, z) {
  const plan = [];
  for (let k = 0; k < 5; k++) plan.push({ x, y: y + k, z, block: "diorite_wall", state: {} });
  plan.push({ x, y: y + 3, z: z - 1, block: "diorite_wall", state: {} }, { x, y: y + 3, z: z + 1, block: "diorite_wall", state: {} });
  plan.push({ x, y: y + 5, z, block: "end_rod", state: { facing: "up" } });
  return commit(g, box, plan);
}

/**
 * A 45-degree gable roof whose ridge runs along x over the box's z range: deepslate_tile_stairs (cobbled_deepslate in
 * 3x3 patches, about 20%) rising to the ridge, with a waxed_oxidized_cut_copper_slab cap. Surface only: the attic or
 * walls under it are the caller's. eaveY and ridgeY must differ by the half-width (45 degrees).
 */
export function gable_roof_x(g, box, eaveY, ridgeY) {
  const [[ax, , az], [bx, , bz]] = box;
  const x0 = lo(ax, bx), x1 = hi(ax, bx), z0 = lo(az, bz), z1 = hi(az, bz);
  const maxD = Math.floor((z1 - z0) / 2);
  if (eaveY + maxD !== ridgeY) throw new Error(`gable_roof_x: a 45-degree roof on z ${z0}..${z1} needs ridgeY = eaveY + ${maxD}`);
  const odd = (z1 - z0) % 2 === 0;
  const plan = [];
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      const d = lo(z - z0, z1 - z), y = eaveY + d;
      if (odd && z - z0 === z1 - z) {
        plan.push({ x, y, z, block: "waxed_oxidized_cut_copper_slab", state: B.slab("waxed_oxidized_cut_copper")[1] });
        continue;
      }
      const cobbled = hash(Math.floor(x / 3), Math.floor(z / 3), 5) < 0.2;
      const [block, state] = B.stairs(cobbled ? "cobbled_deepslate" : "deepslate_tile", z - z0 < z1 - z ? "south" : "north", "bottom");
      plan.push({ x, y, z, block, state });
      if (d === maxD) plan.push({ x, y: y + 1, z, block: "waxed_oxidized_cut_copper_slab", state: B.slab("waxed_oxidized_cut_copper")[1] });
    }
  return commit(g, box, plan);
}

/**
 * A flying-buttress rib, 1 wide in the plane x = pierX, from the pier top (z0, y0) to the clerestory (z1, y1). It rises
 * as a quarter-sine. Upside-down polished_diorite stairs form the curve, with a polished_diorite_slab coping on top.
 * `side` ("north" | "south" | "east" | "west") is the stairs' back, the side of the aisle roof the rib spans.
 */
export function flyer(g, box, pierX, z0, y0, z1, y1, side) {
  if (!["north", "south", "east", "west"].includes(side)) throw new Error(`flyer: side must be a compass direction, got ${side}`);
  const n = Math.abs(z1 - z0), dir = Math.sign(z1 - z0) || 1;
  const [stair, stairState] = B.stairs("polished_diorite", side, "top");
  const [coping, copingState] = B.slab("polished_diorite", "bottom");
  const plan = [];
  let prev = y0;
  for (let t = 0; t <= n; t++) {
    const y = Math.round(y0 + (y1 - y0) * Math.sin((Math.PI / 2) * (n ? t / n : 1)));
    const z = z0 + dir * t;
    for (let yy = lo(prev, y); yy <= hi(prev, y); yy++) plan.push({ x: pierX, y: yy, z, block: stair, state: stairState });
    plan.push({ x: pierX, y: y + 1, z, block: coping, state: copingState });
    prev = y;
  }
  return commit(g, box, plan);
}

/**
 * A ramp from the street: a bottom polished_andesite_slab at the start cell (x, z), then `run` full polished_andesite
 * blocks, all at level y, `width` cells across. `dir` is the way the ramp climbs. Never stairs.
 */
export function slab_ramp(g, box, { x, z, y, dir, width, run = 3 }) {
  const step = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] }[dir];
  if (!step) throw new Error(`slab_ramp: dir must be east, west, north or south, got ${dir}`);
  const plan = [];
  for (let k = 0; k < width; k++)
    for (let s = 0; s <= run; s++) {
      const px = step[0] ? x + step[0] * s : x + k;
      const pz = step[0] ? z + k : z + step[1] * s;
      if (s === 0) plan.push({ x: px, y, z: pz, block: "polished_andesite_slab", state: B.slab("polished_andesite")[1] });
      else plan.push({ x: px, y, z: pz, block: "polished_andesite", state: {} });
    }
  return commit(g, box, plan);
}

/**
 * Quoins on a building corner (corner.x, corner.z), outward signs (sx, sz): each course is the corner stone plus two
 * long stones on one face and one short stone on the other, the long face alternating by course. polished_diorite
 * throughout. Air only unless `over` (quoins dress a wall that is already built).
 */
export function quoin(g, box, { x, z, sx, sz, y0, y1 }, { over = false } = {}) {
  const plan = [];
  for (let y = y0; y <= y1; y++) {
    const cells = (y - y0) % 2 === 0
      ? [[x, z], [x + sx, z], [x + 2 * sx, z], [x, z + sz]]
      : [[x, z], [x + sx, z], [x, z + sz], [x, z + 2 * sz]];
    for (const [cx, cz] of cells) plan.push({ x: cx, y, z: cz, block: "polished_diorite", state: {} });
  }
  return commit(g, box, plan, { over });
}
