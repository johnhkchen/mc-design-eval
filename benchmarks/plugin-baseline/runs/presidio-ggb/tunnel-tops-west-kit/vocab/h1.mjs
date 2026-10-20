// Part H1 helpers (plan.md VOCABULARY): mapHeight, halfStep, tunnelBore, logPile, lowFence, cliffRail, planter, pine.
// Module coordinates (x 0..119, z 0..145, y 0..30; module y 0 = world y 2), inclusive ranges.
// Each helper takes the grid first, then its position (and facing or axis where it has one), and writes only the
// cells of its own footprint, only into air, unless opts.replace is set. It never writes below its own footprint,
// so the ground and floors under it stay as the earlier part laid them. Returns { cells, refused }: the cells it
// wrote, and the writes it refused (occupied cells, or cells a guarded grid would not take).
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- the ground height map (brief.txt, GROUND HEIGHT MAP): 73 rows (z 0..145) of 60 cells (x 0..119), one base-36 digit each
const HEIGHT_ROWS = [
  "222222222222222222222222222222222222222222222222222222222222",
  "222222222222222222222222222222222222222222222222222222222222",
  "222222222222222222222222222222222222222222222222222222222333",
  "222222222222222222222222222222233333333333333333333333333333",
  "222222222222222222333333333333333333333333333333333333333332",
  "223222233333333333333333333333333333333333332222222222222222",
  "333333333333333333333333333332222222222222222222222222222211",
  "333333333333332222222222222222222222222222222222111122222222",
  "222222222222222222222222222211111111123333333333333333333333",
  "222222222222111122222222223333333333333333333333333333333333",
  "222222233333333333333322333333333333333333333333333333333333",
  "233333333333333333333333333333333333333333333333333333333333",
  "333333333333333333333333333333333333333333333333333333333333",
  "333333333333333333333333333333333333333333333333333333333333",
  "333333333333333333333333333333333333333333333333333344333333",
  "333333333333333333333333333333333333333344333333333444333333",
  "333333333333333333333333333333333333333344333333333444433333",
  "333333333322222333333333333333333333333333333333333344333333",
  "333333333322222333333333333333333333433333433333443333333333",
  "333333333322222333333333333333333333333334443334443333333333",
  "333333333322223333333333333333333333333334433334433333333333",
  "333333333322233333332233333333333333333333333333333333333344",
  "333333333333333333222222333333333333333333333333333333334444",
  "333333333333333222222222333333333344444444444444444444444445",
  "333333333333222222222222233333444444444444444444444444455555",
  "333333333333333332222222233334455555544444444455555555555555",
  "333333333333333222222222233344556665555555555555555555556666",
  "333333333333333222222222334445566666666666555555555566666666",
  "333333333333333222222233334455667777777666666666666666666677",
  "333333333333333332333333344556677777777777777777777777777777",
  "333333333333333333333333345566777777777777777777777777777777",
  "333333333333333333333333345666777777777777777777777777777777",
  "333333333333333333333333345667777777777777777777777777777777",
  "333333333333333333333333344567777777777777777777777777777777",
  "333333333333333333333333334457777777777777777777777777777777",
  "333333333333333333333333333346777777777777777777777777777777",
  "333333333333333333333333333335777777777777777777777777777777",
  "333333333333333333333333333456777777777777777777777777777777",
  "333333333333333333333334455677777777777777777777777777777777",
  "333344444433333333334556777888777777777777777777777777777777",
  "444444444433333333346788888888877777777777777777777777777777",
  "444444444444444444446888888888777788887777777777777777777777",
  "444444444444444444445888888887777788888888777777777777777777",
  "444444444444444444445788888877777888888888877777777777777777",
  "444444444444444444445778877777788888888888887777788877777777",
  "4555555554444444444567777777788888888888???????8888888777777",
  "5554555554444445556777777777888888888888??????????8888888778",
  "5555555554445566777777777778888888888888??????????8877777777",
  "5555555555666666677777777778888888888888??????????8877777777",
  "5555555666666666667777777778888888888888?????????88888888887",
  "555667777677??66666677777788888888888888?????????88888888888",
  "66777778877???7766666777778888888888888888888888888888888888",
  "7777777787????7776666677778888888888888888888888888888888888",
  "7777777778???77777766666788888888888888888888888888888888888",
  "77??8777777?877777776666678888888888888888888888888888888888",
  "8????8877777877777777766678888888888888888888888888888888888",
  "888????77777787776667787677888888888??8888888888888888888888",
  "8888????7777777666666667777788888888???888888888888888888887",
  "8888??????8777766666666677777888888?????88888888888888888887",
  "8888?????88888766667766667777888888????888888888888888888877",
  "888?????88888876667777766777778888?????888888888888888888777",
  "88?????888888876667777777777777788????88888888888???88888777",
  "???????8888887777888888888887777777???88888888888??888887778",
  "??????888888877788888888888888777777?88888888888??8888877778",
  "?????888888877788888888888888888777778888888888???8888877788",
  "9????888888777788888888888888888877777788888888??88888777888",
  "998?88888877778888888888888888888887777777788888888887777888",
  "999998888877788888888888888888888888877777777888888877778888",
  "999999888777888888888888888888888888888777777778888877788888",
  "999999987777888888888888888888888888887777877777888777788888",
  "?99999977778888888888888888888888888877778888777777777888888",
  "999999987788888888888888888888888888877899998877777778888888",
  "999999888899988888888888888888888888778899999988777778888888",
];

// `?` cells: the plan's stated heights for the zones it names; every other `?` takes its nearest digit neighbours
const ZONE_HEIGHTS = [
  { x0: 80, x1: 99, z0: 90, z1: 103, y: 8 },
  { x0: 66, x1: 79, z0: 122, z1: 133, y: 8 },
  { x0: 0, x1: 17, z0: 108, z1: 140, y: 9 },
];

/** Surface y of the ground at module (x, z): the map digit for the 2x2 cell that holds it. */
export function mapHeight(x, z) {
  if (x < 0 || x > 119 || z < 0 || z > 145) throw new RangeError(`mapHeight outside the module: ${x},${z}`);
  const c = Math.floor(x / 2), r = Math.floor(z / 2);
  const ch = HEIGHT_ROWS[r][c];
  if (ch !== "?") return parseInt(ch, 36);
  const zone = ZONE_HEIGHTS.find((q) => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1);
  return zone ? zone.y : nearestDigit(c, r);
}

// The most common digit in the nearest ring of known cells (ties go to the higher height).
function nearestDigit(c, r) {
  for (let d = 1; d < 80; d++) {
    const counts = new Map();
    for (let rr = r - d; rr <= r + d; rr++) for (let cc = c - d; cc <= c + d; cc++) {
      if (Math.max(Math.abs(rr - r), Math.abs(cc - c)) !== d) continue;
      const ch = HEIGHT_ROWS[rr]?.[cc];
      if (ch && ch !== "?") counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
    if (counts.size) {
      const [best] = [...counts].sort((a, b) => b[1] - a[1] || parseInt(b[0], 36) - parseInt(a[0], 36));
      return parseInt(best[0], 36);
    }
  }
  throw new Error(`no digit neighbour for map cell ${c},${r}`);
}

// Writes into air only (or over occupied cells with opts.replace); records what it wrote and what it refused.
function writer(g, opts = {}) {
  const cells = [], refused = [];
  const put = (x, y, z, [block, state]) => {
    const air = g.inBounds(x, y, z) && g.isAir(x, y, z);
    if (!g.inBounds(x, y, z) || (!opts.replace && !air)) { refused.push([x, y, z, block]); return false; }
    g.set(x, y, z, block, state);
    const id = block.includes(":") ? block : `minecraft:${block}`;
    if (g.blockAt(x, y, z) !== id) { refused.push([x, y, z, block]); return false; }
    cells.push([x, y, z]);
    return true;
  };
  return { put, done: () => ({ cells, refused }) };
}

/** A paved walk cell at (x, y, z): a bottom slab (flat), or with opts.bank a stair facing up-slope (dir). */
export function halfStep(g, x, y, z, dir = "north", opts = {}) {
  if (!DIRS[dir]) throw new RangeError(`halfStep dir must be north, south, east or west: ${dir}`);
  const { put, done } = writer(g, opts);
  const material = opts.material ?? "smooth_sandstone";
  put(x, y, z, opts.bank ? B.stairs(material, dir, "bottom") : B.slab(material, "bottom"));
  return done();
}

/**
 * One tunnel bore: air x0..x0+6, y0..y0+3, z0..z0+4 (plan: x 43..49, y 5..8, z 80..84 or 87..91). Writes its side walls
 * (z0-1, z0+5), the black back wall (x0+7), the smooth_stone ceiling at y0+4 (a full block, so the grass on the lid has solid ground under it) and sea_lantern strip at y0+3 on the
 * centre line (x0, x0+3, x0+6). The floor (y0-1) is the parkway road laid by the terrain part, so it is not written.
 */
export function tunnelBore(g, x0, y0, z0, opts = {}) {
  const { put, done } = writer(g, opts);
  const xBack = x0 + 7, yTop = y0 + 3, yCeil = y0 + 4;
  for (let x = x0; x <= xBack; x++) for (let y = y0; y <= yTop; y++) {
    put(x, y, z0 - 1, B.block("smooth_stone"));
    put(x, y, z0 + 5, B.block("smooth_stone"));
  }
  for (let y = y0; y <= yTop; y++) for (let z = z0; z <= z0 + 4; z++) put(xBack, y, z, B.block("black_concrete"));
  for (let x = x0; x <= xBack; x++) for (let z = z0 - 1; z <= z0 + 5; z++) put(x, yCeil, z, B.block("smooth_stone"));
  for (const x of [x0, x0 + 3, x0 + 6]) put(x, yTop, z0 + 2, B.block("sea_lantern"));
  return done();
}

/**
 * A stepped log pile on the square x0..x0+size-1, z0..z0+size-1 (default 8), layers y0..y0+layers-1 (default 5).
 * Each layer is inset 1 more from every side (to 3, then held) so it can be climbed. Even layers are stripped_oak_log
 * along x, odd layers spruce_log along z, with a gap every third log to climb through. mangrove_roots at the two
 * bottom corners (x0,z0) and (x1,z1).
 */
export function logPile(g, x0, y0, z0, opts = {}) {
  const { put, done } = writer(g, opts);
  const size = opts.size ?? 8, layers = opts.layers ?? 5;
  const x1 = x0 + size - 1, z1 = z0 + size - 1;
  const roots = [[x0, z0], [x1, z1]];
  const isRoot = (x, z, y) => y === y0 && roots.some(([rx, rz]) => rx === x && rz === z);
  const maxInset = Math.floor((size - 2) / 2);
  for (let k = 0; k < layers; k++) {
    const inset = Math.min(k, maxInset), y = y0 + k;
    const xa = x0 + inset, xb = x1 - inset, za = z0 + inset, zb = z1 - inset;
    if (k % 2 === 0) {
      for (let z = za; z <= zb; z++) {
        if ((z - z0) % 3 === 2) continue;
        for (let x = xa; x <= xb; x++) if (!isRoot(x, z, y)) put(x, y, z, B.log("stripped_oak", "x"));
      }
    } else {
      for (let x = xa; x <= xb; x++) {
        if ((x - x0) % 3 === 2) continue;
        for (let z = za; z <= zb; z++) if (!isRoot(x, z, y)) put(x, y, z, B.log("spruce", "z"));
      }
    }
  }
  for (const [x, z] of roots) put(x, y0, z, B.block("mangrove_roots"));
  return done();
}

/**
 * A straight low spruce fence from (x0, z0) to (x1, z1) at y (plan: y 4). stripped_spruce_log posts at the ends and
 * every 6th cell. opts.gates: [x, z] cells that become spruce_fence_gate instead (the gate lies across the line).
 * Fence cells carry their connections to the neighbouring cells of the line.
 */
export function lowFence(g, x0, z0, x1, z1, y, opts = {}) {
  if (x0 !== x1 && z0 !== z1) throw new RangeError("lowFence: the line must run straight along x or z");
  const { put, done } = writer(g, opts);
  const alongX = z0 === z1;
  const len = Math.abs(x1 - x0) + Math.abs(z1 - z0) + 1;
  const sx = Math.sign(x1 - x0), sz = Math.sign(z1 - z0);
  const gates = new Set((opts.gates ?? []).map(([gx, gz]) => `${gx},${gz}`));
  const conn = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
  for (let t = 0; t < len; t++) {
    const x = x0 + sx * t, z = z0 + sz * t;
    if (gates.has(`${x},${z}`)) put(x, y, z, ["spruce_fence_gate", { facing: alongX ? "north" : "east", in_wall: "false", open: "false", powered: "false" }]);
    else if (t % 6 === 0 || t === len - 1) put(x, y, z, B.log("stripped_spruce", "y"));
    else put(x, y, z, ["spruce_fence", conn]);
  }
  return done();
}

/**
 * A timber rail along z at y (plan: y 8) from x0 to x1: stripped_spruce_log posts every 4 cells and at x1, spruce_fence
 * between. opts.gaps: [a, b] inclusive x ranges with no rail (the overlook openings). Nothing is written in a gap.
 */
export function cliffRail(g, x0, x1, z, y, opts = {}) {
  const { put, done } = writer(g, opts);
  const gaps = opts.gaps ?? [];
  const open = (x) => gaps.some(([a, b]) => x >= a && x <= b);
  const rail = (x) => x >= x0 && x <= x1 && !open(x);
  for (let x = x0; x <= x1; x++) {
    if (open(x)) continue;
    if ((x - x0) % 4 === 0 || x === x1) put(x, y, z, B.log("stripped_spruce", "y"));
    else put(x, y, z, ["spruce_fence", { east: String(rail(x + 1)), west: String(rail(x - 1)), north: "false", south: "false", waterlogged: "false" }]);
  }
  return done();
}

/**
 * A square planter box with its corner at (x, y, z) (y = the surface it stands on): a calcite ring 1 high at y+1, dirt
 * inside at y+1, and plants at y+2 (tall_grass takes y+3 too). opts.size (default 3), opts.plants cycled over the
 * interior (default tall_grass, short_grass, fern).
 */
export function planter(g, x, y, z, opts = {}) {
  const { put, done } = writer(g, opts);
  const size = opts.size ?? 3, plants = opts.plants ?? ["tall_grass", "short_grass", "fern"];
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) {
    const px = x + i, pz = z + j;
    if (i === 0 || j === 0 || i === size - 1 || j === size - 1) { put(px, y + 1, pz, B.block("calcite")); continue; }
    put(px, y + 1, pz, B.block("dirt"));
    const plant = plants[(i + j) % plants.length];
    if (plant === "tall_grass") {
      put(px, y + 2, pz, ["tall_grass", { half: "lower" }]);
      put(px, y + 3, pz, ["tall_grass", { half: "upper" }]);
    } else put(px, y + 2, pz, B.block(plant));
  }
  return done();
}

/**
 * A pine on the ground surface y at (x, z): spruce_log trunk y+1..y+height (5-7), and an umbrella of spruce_leaves
 * (persistent) with two layers at the top: radius floor(width/2) one below the top, radius one less at the top.
 * Width 5 to 7 (rounds down to odd). The trunk is never overwritten.
 */
export function pine(g, x, y, z, opts = {}) {
  const h = opts.height ?? 6, w = opts.width ?? 5;
  if (h < 5 || h > 7 || w < 5 || w > 7) throw new RangeError(`pine: height 5-7 and width 5-7, got ${h} and ${w}`);
  const { put, done } = writer(g, opts);
  const R = Math.floor(w / 2);
  const leaves = ["spruce_leaves", { persistent: "true", distance: "1", waterlogged: "false" }];
  for (let k = 1; k <= h; k++) put(x, y + k, z, B.log("spruce", "y"));
  for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
    if (dx === 0 && dz === 0) continue;
    const d2 = dx * dx + dz * dz;
    if (d2 <= R * R + 1) put(x + dx, y + h - 1, z + dz, leaves);
    if (d2 <= (R - 1) * (R - 1) + 1) put(x + dx, y + h, z + dz, leaves);
  }
  return done();
}
