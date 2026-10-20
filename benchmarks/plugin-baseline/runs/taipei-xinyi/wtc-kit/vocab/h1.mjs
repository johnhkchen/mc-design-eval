// Helpers from plan.md VOCABULARY (part 1): plinth_fill, chamfer_corner, lit_lobby_front, aircraft_light, planter_tree,
// slab_ramp, arcade_pier, skylight_strip, hotel_band, grand_stair. Kit-local coordinates; every position, facing and
// span is an argument. Same contract as h2.mjs, which the workers also use:
//   - writes only its own footprint, and only into air; a block id in `opts.over` may also be replaced.
//   - all or nothing: if any footprint cell is blocked (or outside the grid), nothing is written. The result says
//     why: { ok, placed, blocked: [[x, y, z]] }.
// Where plan.md's signature has no plane or span (lit_lobby_front, hotel_band), they are arguments here.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air", "minecraft:structure_void"]);
const id = (b) => (b.includes(":") ? b : `minecraft:${b}`);

/** cells: [[x, y, z, block, state?], ...]. Writes the lot or none of it. */
function place(g, cells, { over = [] } = {}) {
  const replaceable = new Set(over.map(id));
  const want = new Map();
  for (const c of cells) want.set(c.slice(0, 3).join(","), c);
  const blocked = [...want.values()]
    .filter(([x, y, z]) => !g.inBounds(x, y, z) || !(AIR.has(g.blockAt(x, y, z)) || replaceable.has(g.blockAt(x, y, z))))
    .map((c) => c.slice(0, 3));
  if (blocked.length) return { ok: false, placed: 0, blocked };
  for (const [x, y, z, block, state] of want.values()) g.set(x, y, z, block, state);
  return { ok: true, placed: want.size, blocked: [] };
}

const norm = ([ax, ay, az, bx, by, bz]) => ({
  x0: Math.min(ax, bx), y0: Math.min(ay, by), z0: Math.min(az, bz),
  x1: Math.max(ax, bx), y1: Math.max(ay, by), z1: Math.max(az, bz),
});
const inRanges = (ranges, s) => ranges.some(([a, b]) => s >= Math.min(a, b) && s <= Math.max(a, b));

// outward normal of each wall face
const OUT = { north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] };
/** A cell on a wall: s runs along the face, `at` is the outer wall plane, depth 0 = the wall, 1 = one cell inside. */
function wall(face, s, y, at, depth) {
  const out = OUT[face];
  if (!out) throw new Error(`face must be north, south, east or west, got ${face}`);
  return out[2] !== 0 ? [s, y, at - out[2] * depth] : [at - out[0] * depth, y, s];
}
// Deterministic 25% warm backing: the same build lights the same bays on every run.
const warm = ([x, y, z]) => ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0) % 100 < 25;

/**
 * Plinth under a mass. box = [x0, y0, z0, x1, y1, z1] (y1 = the plinth top). `ground` is a flat level, or a function
 * (x, z) => level, with null off the footprint: that is what makes a cell a # cell. Each # cell is filled from its
 * ground up to y1; the rim cells (next to a non-# cell) get a `block` slab on top instead of a full block.
 */
export function plinth_fill(g, box, ground, block, { over = [] } = {}) {
  const { x0, y0, z0, x1, y1, z1 } = norm(box);
  const groundAt = typeof ground === "function" ? ground : () => ground;
  const isFoot = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && groundAt(x, z) != null;
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!isFoot(x, z)) continue;
    const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !isFoot(x + dx, z + dz));
    for (let y = groundAt(x, z); y <= y1; y++) {
      if (rim && y === y1) cells.push([x, y, z, ...B.slab(block, "bottom")]);
      else cells.push([x, y, z, block]);
    }
  }
  return place(g, cells, { over });
}

/**
 * Chamfered corner of a square shaft. (cx, cz) is the outer corner cell, dir = nw | ne | sw | se (the corner), size = the
 * cut (6: the cells with a + b < 6 are dropped, a + b = 6 is the staircase). Steps: brown_terracotta at each spandrel
 * row (y0 must be one: y0, y0+5, ...) and every third step; brown_stained_glass between; brown_concrete corner piers
 * at both ends of the diagonal, full height y0..y1.
 */
export function chamfer_corner(g, cx, cz, dir, size, y0, y1, { over = [] } = {}) {
  if (!/^[ns][ew]$/.test(dir)) throw new Error(`dir must be nw, ne, sw or se, got ${dir}`);
  const sx = dir.includes("e") ? -1 : 1, sz = dir.includes("s") ? -1 : 1;
  const cells = [];
  for (let a = 0; a <= size; a++) {
    const b = size - a;
    const x = cx + sx * a, z = cz + sz * b;
    for (let y = y0; y <= y1; y++) {
      if (a === 0 || a === size) cells.push([x, y, z, "brown_concrete"]);
      else if ((y - y0) % 5 === 0 || a % 3 === 0) cells.push([x, y, z, "brown_terracotta"]);
      else cells.push([x, y, z, "brown_stained_glass"]);
    }
  }
  return place(g, cells, { over });
}

/**
 * Lit lobby behind a glass front. The wall plane is `at` (the outer face of the piers); the glass is set back one
 * cell behind it. Piers of brown_terracotta every 4 cells along the span (x0..x1), y0..y1. Glass y0..y1-1 with an
 * ochre_froglight row at y1 (the lit ceiling). `doors` = [[a, b], ...] spans left open to doorHeight (default 5).
 */
export function lit_lobby_front(g, face, x0, x1, y0, y1, at, { doors = [], doorHeight = 5, over = [] } = {}) {
  const s0 = Math.min(x0, x1), s1 = Math.max(x0, x1);
  const cells = [];
  for (let s = s0; s <= s1; s++) {
    const door = inRanges(doors, s);
    for (let y = y0; y <= y1; y++) {
      if (door && y < y0 + doorHeight) continue;
      if (!door && (s - s0) % 4 === 0) cells.push([...wall(face, s, y, at, 0), "brown_terracotta"]);
      cells.push([...wall(face, s, y, at, 1), ...(y === y1 ? ["ochre_froglight"] : ["glass"])]);
    }
  }
  return place(g, cells, { over });
}

/** Aircraft warning light: a polished_andesite post at (x, y, z) with a redstone_torch on top. */
export function aircraft_light(g, x, y, z, { over = [] } = {}) {
  return place(g, [[x, y, z, "polished_andesite"], [x, y + 1, z, "redstone_torch"]], { over });
}

/**
 * Planter box with a tree, centred on (x, z), bed level y. A 5 x 5 box 1 high: polished_andesite rim, grass_block soil
 * inside. Oak trunk 5 high on the soil; persistent oak_leaves crown from y+3 to y+6.
 */
export function planter_tree(g, x, y, z, { over = [] } = {}) {
  const cells = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const rim = Math.abs(dx) === 2 || Math.abs(dz) === 2;
    cells.push([x + dx, y, z + dz, rim ? "polished_andesite" : "grass_block"]);
  }
  for (let dy = 1; dy <= 5; dy++) cells.push([x, y + dy, z, ...B.log("oak", "y")]);
  for (let dy = 3; dy <= 6; dy++) {
    const r = dy === 6 ? 1 : 2;
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;   // clipped corners
      if (dx === 0 && dz === 0 && dy <= 5) continue;                       // the trunk
      cells.push([x + dx, y + dy, z + dz, "oak_leaves", { persistent: "true" }]);
    }
  }
  return place(g, cells, { over });
}

// The ramp cells: each cell is a half-block level (1 = half a block up). Flights of 3 steps, each flight ends on a
// 2-long landing (the owner's standard). A level that is odd gets a bottom slab on top of the full blocks below it.
function rampCells([x, y, z], dir, width, rise, maxLen = Infinity) {
  const d = DIRS[dir];
  if (!d) throw new Error(`dir must be north, south, east or west, got ${dir}`);
  const perp = d[0] !== 0 ? [0, 0, 1] : [1, 0, 0];
  const target = Math.round(rise * 2), levels = [];
  let top = 0;
  while (top < target) {
    for (let i = 0; i < 3 && top < target; i++) levels.push(++top);
    levels.push(top, top);
  }
  if (levels.length > maxLen) throw new Error(`slab_ramp: climbing ${rise} needs ${levels.length} cells, the run has ${maxLen}`);
  const cells = [];
  levels.forEach((h2, k) => {
    for (let w = 0; w < width; w++) {
      const cx = x + d[0] * k + perp[0] * w, cz = z + d[2] * k + perp[2] * w;
      const full = Math.floor(h2 / 2);
      for (let dy = 0; dy < full; dy++) cells.push([cx, y + dy, cz, "smooth_stone"]);
      if (h2 % 2) cells.push([cx, y + full, cz, ...B.slab("smooth_stone", "bottom")]);
    }
  });
  return cells;
}

/**
 * Slab ramp climbing in direction dir (north | south | east | west) from the low corner `from` = [x, y, z] (y = the
 * first air level above the ground). `width` cells across (toward +x for north/south, +z for east/west). `rise` in
 * blocks, default 1.5 (one flight: 3 smooth_stone_slab steps and a 2-long landing). `maxLen` = cells the run has: the
 * ramp throws instead of climbing past its footprint.
 */
export function slab_ramp(g, from, dir, width = 3, { rise = 1.5, maxLen = Infinity, over = [] } = {}) {
  return place(g, rampCells(from, dir, width, rise, maxLen), { over });
}

/** One arcade column: 2 x 2 quartz_pillar (axis y) at (x, z), min corner, from y0 to y1 (plan: 3..21). */
export function arcade_pier(g, x, z, { y0 = 3, y1 = 21, over = [] } = {}) {
  const cells = [];
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) for (let y = y0; y <= y1; y++) cells.push([x + dx, y, z + dz, ...B.pillar("quartz_pillar", "y")]);
  return place(g, cells, { over });
}

/**
 * Skylight strip: light_gray_stained_glass 3 wide (z0..z0+2) from x0 to x1 in the deck at deckY (default 40), with a
 * row of pearlescent_froglight under its middle at deckY-1. The deck is solid, so pass over: [its block id].
 */
export function skylight_strip(g, x0, x1, z0, { deckY = 40, over = [] } = {}) {
  const cells = [];
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let dz = 0; dz < 3; dz++) {
    cells.push([x, deckY, z0 + dz, "light_gray_stained_glass"]);
    if (dz === 1) cells.push([x, deckY - 1, z0 + dz, "pearlescent_froglight"]);
  }
  return place(g, cells, { over });
}

/**
 * One storey (5 high, y0..y0+4) of a hotel tower face. The span is from..to along the face, the outer plane `at`.
 * +0..1 smooth_sandstone; +2..4 gray_stained_glass with a cut_sandstone mullion every 4 cells; behind each glass bay
 * one cell in a black_concrete backing, 25% ochre_froglight (deterministic per cell, not clustered).
 */
export function hotel_band(g, face, y0, from, to, at, { over = [] } = {}) {
  const s0 = Math.min(from, to), s1 = Math.max(from, to);
  const cells = [];
  for (let s = s0; s <= s1; s++) {
    for (let y = y0; y <= y0 + 1; y++) cells.push([...wall(face, s, y, at, 0), "smooth_sandstone"]);
    for (let y = y0 + 2; y <= y0 + 4; y++) {
      if ((s - s0) % 4 === 0) { cells.push([...wall(face, s, y, at, 0), "cut_sandstone"]); continue; }
      cells.push([...wall(face, s, y, at, 0), "gray_stained_glass"]);
      const b = wall(face, s, y, at, 1);
      cells.push([...b, warm(b) ? "ochre_froglight" : "black_concrete"]);
    }
  }
  return place(g, cells, { over });
}

/**
 * Grand stair in the box [x0, yLow, z0, x1, yHigh, z1]. It climbs in direction `facing` (the high side): one
 * polished_granite_stairs step per cell from the low end until the terrace level yHigh, then flat granite. The `ramp`
 * cells at each end of the width are slab ramps (the owner's standard). Throws if a ramp does not fit the box.
 */
export function grand_stair(g, facing, box, { ramp = 3, over = [] } = {}) {
  const d = DIRS[facing];
  if (!d) throw new Error(`facing must be north, south, east or west, got ${facing}`);
  const { x0, y0: yLow, z0, x1, y1: yHigh, z1 } = norm(box);
  const along = d[0] !== 0 ? 0 : 2;                                  // index of the climb axis in [x, y, z]
  const aLo = along === 0 ? x0 : z0, aHi = along === 0 ? x1 : z1;
  const pLo = along === 0 ? z0 : x0, pHi = along === 0 ? z1 : x1;   // across the width
  const cell = (a, p, y) => (along === 0 ? [a, y, p] : [p, y, a]);
  const cells = [];
  for (let a = aLo; a <= aHi; a++) {
    const climbed = d[along] > 0 ? a - aLo : aHi - a;
    const top = Math.min(yHigh, yLow + 1 + climbed);                 // one rise per step, then the terrace
    for (let p = pLo + ramp; p <= pHi - ramp; p++) {
      if (top < yHigh) {
        for (let y = yLow; y < top - 1; y++) cells.push([...cell(a, p, y), "polished_granite"]);
        cells.push([...cell(a, p, top - 1), ...B.stairs("polished_granite", facing, "bottom")]);
      } else {
        for (let y = yLow; y < yHigh; y++) cells.push([...cell(a, p, y), "polished_granite"]);
      }
    }
  }
  const lowA = d[along] > 0 ? aLo : aHi;
  for (const pStart of [pLo, pHi - ramp + 1]) cells.push(...rampCells(cell(lowA, pStart, yLow), facing, ramp, yHigh - yLow, aHi - aLo + 1));
  return place(g, cells, { over });
}
