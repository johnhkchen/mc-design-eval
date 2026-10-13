// Vocabulary helpers from plan.md VOCABULARY (second half): galleryFloor, tallWindow, grandStair, liveOak,
// forecourtOval, parterreBed, carriageHouse, porchLantern. Palette ids are literals; nothing is imported from vocab.mjs
// or the other vocab/ files. Every helper takes the grid first, then its position (and facing, where it has one), then
// an optional opts object, and returns { placed, skipped, box }: box is the footprint [x0, y0, z0, x1, y1, z1] it may
// write, and skipped counts cells it left alone because they were not air (opts.replace: true overwrites them, still
// inside the footprint). Writes outside the footprint throw, so nothing is ever placed under it: ground, sand and
// floors an earlier part owns stay as they are. Surface helpers (forecourtOval, parterreBed) write only their own y0
// layer, into air unless replace; pass replace when the lawn is already laid.
import { B, hipRoof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Leaves never decay (persistent) and keep the distance state the toolkit writes (tools/src/terrain.mjs).
const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };

// The writer: the only way a helper writes. Air only unless replace; a write outside the box throws; a cell outside
// the grid itself is clipped (counted), since the plan's own edges can run past the site.
// `grid` is a view of g for shape tools (hipRoof) that call g.set themselves, so they obey the same rules.
function writer(g, box, { replace = false } = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const w = { placed: 0, skipped: 0, clipped: 0, box };
  w.set = (x, y, z, block, state, nbt) => {
    if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) throw new Error(`write outside footprint ${box}: ${x},${y},${z} ${block}`);
    if (!g.inBounds(x, y, z)) { w.clipped++; return w; }
    if (!replace && !g.isAir(x, y, z)) { w.skipped++; return w; }
    g.set(x, y, z, block, state, nbt);
    w.placed++;
    return w;
  };
  w.grid = new Proxy(g, { get(t, p) { if (p === "set") return w.set; const v = Reflect.get(t, p); return typeof v === "function" ? v.bind(t) : v; } });
  return w;
}

// Visit every cell of the box; fn(x, y, z) returns [block, state, nbt] to place, or null to leave the cell alone.
function paintInto(w, [x0, y0, z0, x1, y1, z1], fn) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    const want = fn(x, y, z);
    if (want) w.set(x, y, z, ...want);
  }
}

const result = (w) => ({ placed: w.placed, skipped: w.skipped, clipped: w.clipped, box: w.box });

function paint(g, box, fn, opts) {
  const w = writer(g, box, opts);
  paintInto(w, box, fn);
  return result(w);
}

// Deterministic pseudo-random int from a cell, so the same call always gives the same tree (no Math.random).
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

/**
 * Gallery floor of a colonnaded porch: y3 floor, y10 deck, y17 ceiling, over x0..x1 x z0..z1. The deck's z0 row is a
 * smooth_quartz edge, the rest spruce_planks. opts.skip: [x, z] anchors of 2x2 colossal columns, left open at the deck
 * (their shafts run through it); the floor and ceiling run over them.
 */
export function galleryFloor(g, x0, z0, x1, z1, { skip = [], replace = false } = {}) {
  const gone = (x, z) => skip.some(([sx, sz]) => x >= sx && x <= sx + 1 && z >= sz && z <= sz + 1);
  return paint(g, [x0, 3, z0, x1, 17, z1], (x, y, z) => {
    if (y === 3 || y === 17) return ["smooth_quartz"];
    if (y !== 10 || gone(x, z)) return null;
    return z === z0 ? ["smooth_quartz"] : ["spruce_planks"];
  }, { replace });
}

/**
 * A 2-wide, h-tall glass window in a wall. (x, z) is the opening's first cell on the wall plane: for a north or south
 * wall the opening runs x..x+1 with the wall at z; for an east or west wall it runs z..z+1 with the wall at x.
 * y0 is the glass's bottom row. A smooth_quartz_slab sill (top) sits at y0-1 and a smooth_quartz lintel at y0+h.
 * Pass sill: false where the sill row is already a floor (ground-floor windows: the floor is the sill). The
 * lintel and sill are wall cells the shell wrote, so they need replace: true.
 */
export function tallWindow(g, x, z, face, y0, h, { replace = false, sill = true } = {}) {
  const along = face === "north" || face === "south";
  const box = along ? [x, sill ? y0 - 1 : y0, z, x + 1, y0 + h, z] : [x, sill ? y0 - 1 : y0, z, x, y0 + h, z + 1];
  const pane = along ? { east: "true", west: "true" } : { north: "true", south: "true" };
  return paint(g, box, (px, py, pz) => {
    if (py === y0 + h) return ["smooth_quartz"];
    if (py === y0 - 1) return B.slab("smooth_quartz", "top");
    return ["glass_pane", pane];
  }, { replace });
}

/**
 * The grand stair: a 2-wide flight that climbs north from (x..x+1, y0, zFoot) to a top step at zFoot - rise, with a
 * landing one north of the top (y = y0 + rise, z = zFoot - rise - 1). Step i is smooth_quartz_stairs (facing north,
 * half bottom) at y0+i, on a bricks core under it. The open side x+2 carries a birch_fence rail with a smooth_quartz
 * slab cap one row above, along the flight; the hole's south edge (z = top + 3) gets the same rail at the upper floor.
 */
export function grandStair(g, x, zFoot, { rise = 6, y0 = 4, replace = false } = {}) {
  const top = zFoot - rise, landing = top - 1, holeEdge = top + 3;
  const box = [x, y0, landing, x + 2, y0 + rise + 2, zFoot];
  return paint(g, box, (px, py, pz) => {
    if (px === x + 2) {
      const i = zFoot - pz;
      if (i < 0 || i > rise) return null;
      if (py === y0 + 1 + i) return ["birch_fence", { north: "true", south: "true" }];
      if (py === y0 + 2 + i) return B.slab("smooth_quartz", "top");
      return null;
    }
    if (pz === landing) return py === y0 + rise ? ["smooth_quartz"] : null;
    if (pz === holeEdge) {
      if (py === y0 + rise + 1) return ["birch_fence", { east: "true", west: "true" }];
      if (py === y0 + rise + 2) return B.slab("smooth_quartz", "top");
    }
    const i = zFoot - pz;
    if (i < 0 || i > rise) return null;
    if (py === y0 + i) return B.stairs("smooth_quartz", "north", "bottom");
    if (py < y0 + i && py >= y0) return ["bricks"];
    return null;
  }, { replace });
}

/**
 * A live oak at trunk (x..x+1, z..z+1): dark_oak_log trunk y1..6, a flattened crown of persistent dark_oak_leaves
 * radius 5 over y6..8, 4 over y9..11, 3 at y12, with an irregular edge. Vines hang 2-3 long down the outside of the
 * crown's edge, each one held by a leaf beside it. The root patch is not written: it would replace the ground (the
 * grounds part lays it).
 */
export function liveOak(g, x, z, opts = {}) {
  const cx = x + 1, cz = z + 1;                              // trunk centre, in cell-corner coordinates
  const trunk = (px, pz) => px >= x && px <= x + 1 && pz >= z && pz <= z + 1;
  const radius = (py) => (py <= 8 ? 5 : py <= 11 ? 4 : 3);
  const leafAt = (px, py, pz) => {
    if (py < 6 || py > 12) return false;
    const r = radius(py), ax = px + 0.5 - cx, az = pz + 0.5 - cz, d2 = ax * ax + az * az, lim = (r + 0.5) ** 2 + 1;
    if (d2 > lim) return false;
    return !(d2 > lim - 3 && hash(px, py, pz) % 3 === 0);     // irregular edge
  };
  // Vines: from each leaf on the y8 rim, one outward neighbour may hang a vine 2-3 long, held by the leaves beside it.
  const vines = new Map();
  const add = (px, py, pz, key) => {
    const k = `${px},${py},${pz}`;
    const s = vines.get(k) ?? { north: "false", east: "false", south: "false", west: "false", up: "false" };
    vines.set(k, { ...s, [key]: "true" });
  };
  for (let px = x - 6; px <= x + 7; px++) for (let pz = z - 6; pz <= z + 7; pz++) {
    if (!leafAt(px, 8, pz) || trunk(px, pz)) continue;
    for (const [dx, dz, key] of [[1, 0, "west"], [-1, 0, "east"], [0, 1, "north"], [0, -1, "south"]]) {
      const nx = px + dx, nz = pz + dz;
      if (leafAt(nx, 8, nz) || trunk(nx, nz) || hash(nx, 8, nz) % 4 !== 0) continue;
      const len = 2 + (hash(nx, 8, nz) % 2);
      for (let k = 0; k < len && leafAt(px, 8 - k, pz); k++) add(nx, 8 - k, nz, key);
    }
  }
  const box = [x - 6, 1, z - 6, x + 7, 12, z + 7];
  return paint(g, box, (px, py, pz) => {
    if (trunk(px, pz) && py <= 6) return B.log("dark_oak", "y");
    const v = vines.get(`${px},${py},${pz}`);
    if (v) return ["vine", v];
    if (leafAt(px, py, pz)) return ["dark_oak_leaves", LEAF];
    return null;
  }, opts);
}

/**
 * The oval forecourt on the surface y0 over the box x0..x1 x z0..z1: a superellipse of gravel, a grass_block island
 * centred in it (8 x 4 for a 22 x 8 box), a flowering_azalea ring round the island at y1, and a stone urn at its centre:
 * smooth_quartz pedestal y1 and chiseled_quartz_block urn y2, 2x2. Corners of the oval stay grass.
 */
export function forecourtOval(g, x0, z0, x1, z1, { replace = false } = {}) {
  const cx = (x0 + x1 + 1) / 2, cz = (z0 + z1 + 1) / 2, rx = (x1 - x0 + 1) / 2, rz = (z1 - z0 + 1) / 2;
  const inOval = (x, z) => (Math.abs(x + 0.5 - cx) / rx) ** 4 + (Math.abs(z + 0.5 - cz) / rz) ** 4 <= 1;
  const ix0 = Math.floor(cx) - 4, ix1 = ix0 + 7, iz0 = Math.floor(cz) - 2, iz1 = iz0 + 3;
  const ux = ix0 + 3, uz = iz0 + 1;                          // urn: 2x2 at (ux..ux+1, uz..uz+1)
  const island = (x, z) => x >= ix0 && x <= ix1 && z >= iz0 && z <= iz1;
  const urn = (x, z) => x >= ux && x <= ux + 1 && z >= uz && z <= uz + 1;
  return paint(g, [x0, 0, z0, x1, 2, z1], (x, y, z) => {
    if (y === 0) return island(x, z) ? ["grass_block"] : inOval(x, z) ? ["gravel"] : null;
    if (y === 1 && urn(x, z)) return ["smooth_quartz"];
    if (y === 2 && urn(x, z)) return ["chiseled_quartz_block"];
    if (y === 1 && island(x, z) && (x === ix0 || x === ix1 || z === iz0 || z === iz1)) return ["flowering_azalea"];
    return null;
  }, { replace });
}

/**
 * One bed of the formal parterre over x0..x1 x z0..z1: a 1-wide spruce_leaves hedge ring at y1 (persistent), grass_block
 * inside on y0, flowers (allium, lily_of_the_valley, peony and rose_bush, the two tall ones over two rows) inside at y1,
 * and a 3-high topiary cone of spruce_leaves at the hedge corner opts.corner (ne, nw, se, sw; default se).
 */
export function parterreBed(g, x0, z0, x1, z1, { corner = "se", replace = false } = {}) {
  const cone = { ne: [x1, z0], nw: [x0, z0], se: [x1, z1], sw: [x0, z1] }[corner];
  const hedge = (x, z) => x === x0 || x === x1 || z === z0 || z === z1;
  const FLOWERS = [["allium"], ["lily_of_the_valley"], ["peony", { half: "lower" }], ["rose_bush", { half: "lower" }]];
  return paint(g, [x0, 0, z0, x1, 3, z1], (x, y, z) => {
    if (cone[0] === x && cone[1] === z) return y >= 1 ? ["spruce_leaves", LEAF] : null;
    if (y === 0) return hedge(x, z) ? null : ["grass_block"];
    if (y === 1 && hedge(x, z)) return ["spruce_leaves", LEAF];
    if (hedge(x, z)) return null;
    if (y === 1 || y === 2) {
      const [name, state] = FLOWERS[hash(x, 0, z) % FLOWERS.length];
      if (name === "peony" || name === "rose_bush") return y === 1 ? [name, state] : [name, { half: "upper" }];
      return y === 1 ? [name] : null;
    }
    return null;
  }, { replace });
}

/**
 * The carriage house on a 16 x 14 plan from (x0, z0), with its front on the north side only (facing "north"; other
 * facings throw). Body: stone_bricks plinth y0..1, bricks y2..9 with smooth_quartz quoins and a string course at y6,
 * smooth_quartz plate and loft-bay ceiling at y10, a smooth_stone floor at y0 and a spruce_planks loft floor at y6
 * with a ladder at (x0+14, z0+12). Three open carriage bays on the north wall (y1..4; a smooth_quartz lintel at y5 with
 * upside-down quartz_stairs at the corners), loft windows over them, side windows, and a dark_oak_door on the east
 * wall. Hip slate roof, 1 overhang, from y11, and a 3x3 smooth_quartz cupola with a lantern and lightning_rod at the ridge.
 */
export function carriageHouse(g, x0, z0, facing = "north", { replace = false } = {}) {
  if (facing !== "north") throw new Error(`carriageHouse faces north only (got ${facing})`);
  const x1 = x0 + 15, z1 = z0 + 13;
  const w = writer(g, [x0 - 1, 0, z0 - 1, x1 + 1, 30, z1 + 1], { replace });
  const ring = (x, z) => x === x0 || x === x1 || z === z0 || z === z1;
  const corner = (x, z) => (x === x0 || x === x1) && (z === z0 || z === z1);
  const bayCol = (x) => (x >= x0 + 1 && x <= x0 + 3) || (x >= x0 + 6 && x <= x0 + 9) || (x >= x0 + 12 && x <= x0 + 14);
  const bayEdge = (x) => [x0 + 1, x0 + 3, x0 + 6, x0 + 9, x0 + 12, x0 + 14].includes(x);
  const loftWin = (x) => [x0 + 2, x0 + 7, x0 + 8, x0 + 13].includes(x);
  const sideWin = (z) => (z >= z0 + 3 && z <= z0 + 4) || (z >= z0 + 9 && z <= z0 + 10);
  const doorZ = z0 + 6, ladderX = x1 - 1, ladderZ = z1 - 1;

  paintInto(w, [x0, 0, z0, x1, 10, z1], (x, y, z) => {
    if (x === ladderX && z === ladderZ && y >= 1 && y <= 9) return ["ladder", { facing: "north" }];
    if (!ring(x, z)) {                                                       // interior
      if (y === 0) return ["smooth_stone"];
      if (y === 6) return ["spruce_planks"];
      if (y === 10) return ["smooth_quartz"];
      return null;
    }
    const front = z === z0;
    if (front && bayCol(x) && y >= 1 && y <= 4) return null;                // open carriage bays
    if (front && bayCol(x) && y === 5) return bayEdge(x) ? B.stairs("quartz", "south", "top") : ["smooth_quartz"];
    if (front && loftWin(x) && (y === 7 || y === 8)) return ["glass_pane", { east: "true", west: "true" }];
    if (!front && x === x1 && z === doorZ && (y === 1 || y === 2)) return B.door("dark_oak", "east", y === 1 ? "lower" : "upper", "left");
    if ((x === x0 || x === x1) && !corner(x, z) && sideWin(z) && y >= 2 && y <= 4) return ["glass_pane", { north: "true", south: "true" }];
    if (y <= 1) return ["stone_bricks"];
    if (corner(x, z)) return ["smooth_quartz"];
    if (y === 6 || y === 10) return ["smooth_quartz"];
    return ["bricks"];
  });

  // Hip roof from y11 over the body, one cell of eave overhang; a 3x3 cupola on the ridge at (x0+7, z0+6).
  hipRoof(w.grid, { footprint: [[x0, z0, x1, z1]], y: 11, material: "slate", pitch: 1, overhang: 1 });
  const cx0 = x0 + 7, cz0 = z0 + 6;
  let base = 0;
  const topOf = (x, z) => { for (let y = 29; y >= 0; y--) if (!g.isAir(x, y, z)) return y; return -1; };
  for (let x = cx0; x <= cx0 + 2; x++) for (let z = cz0; z <= cz0 + 2; z++) base = Math.max(base, topOf(x, z) + 1);
  for (let x = cx0; x <= cx0 + 2; x++) for (let z = cz0; z <= cz0 + 2; z++) {
    for (let y = topOf(x, z) + 1; y < base; y++) w.set(x, y, z, "smooth_quartz");   // underpin the cupola walls
    const rim = x === cx0 || x === cx0 + 2 || z === cz0 || z === cz0 + 2;
    if (rim) for (let y = base; y <= base + 2; y++) w.set(x, y, z, "smooth_quartz");
    w.set(x, base + 3, z, "smooth_quartz");
  }
  w.set(cx0 + 1, base + 4, cz0 + 1, ...B.lantern(false));
  w.set(cx0 + 1, base + 5, cz0 + 1, "lightning_rod", { facing: "up", powered: "false" });
  return result(w);
}

/**
 * A lantern hung from a ceiling: an iron_chain (axis y) at (x, y, z) right under the ceiling, and a hanging lantern
 * one cell below it, on the chain. The lantern hangs in the clear lane under the gallery ceiling (y16 for the upper
 * gallery).
 */
export function porchLantern(g, x, y, z, { replace = false } = {}) {
  return paint(g, [x, y - 1, z, x, y, z], (px, py) => (py === y ? B.chain("y") : B.lantern(true)), { replace });
}
