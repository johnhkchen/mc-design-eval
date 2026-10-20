// Seattle Center kit, helper set 3 (plan.md VOCABULARY): curtainDrum, colonnade, punchedWindow, canopy, balconyBay,
// pergola, lampPost. Each takes its position (and facing) as arguments and returns the number of blocks it wrote.
// Every write is guarded: only into air, never at the ground course (y 0), never on a skip(x, y, z) cell. Options
// `cut` (punchedWindow, balconyBay) let a window or doorway replace the wall cells of its own footprint. Refused writes
// go to g.refused when the grid is guarded, so the caller can report them.

const GROUND_Y = 0;                                      // plan.md SITE: smooth_stone ground course, never written
const CYAN_GLASS = "cyan_stained_glass";                 // curtain wall (reads teal-green)
const GLASS = "glass";                                   // clear ground storey and glazed openings
const WHITE_CONCRETE = "white_concrete";                 // floor rings on the drum, window sills, balcony walls
const LIGHT_GRAY_CONCRETE = "light_gray_concrete";       // colonnade columns
const GRAY_CONCRETE = "gray_concrete";                   // colonnade band under the lip
const LIGHT_BLUE_PANE = "light_blue_stained_glass_pane"; // punched windows (Hyatt)
const GLASS_PANE = "glass_pane";                         // balcony rails
const DIR = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

const must = (ok, msg) => { if (!ok) throw new Error(`h3: ${msg}`); };
const put = (g, [x, y, z], block, state, { cut = false, skip } = {}) => {
  const ok = y > GROUND_Y && !(skip && skip(x, y, z)) && (cut || g.isAir(x, y, z));
  if (ok) g.set(x, y, z, block, state);
  else g.refused?.push([x, y, z, block]);
  return ok ? 1 : 0;
};
const slab = (mat, type) => [`${mat}_slab`, { type }];

// Pane and fence sides: a side connects to a cell this call writes (own) or to any solid block beside it.
function sides(g, own, x, y, z) {
  const s = {};
  for (const [side, [dx, dz]] of Object.entries(DIR)) {
    const n = [x + dx, y, z + dz];
    s[side] = own.has(n.join(",")) || !g.isAir(...n) ? "true" : "false";
  }
  return s;
}

// Midpoint circle: the 1-thick ring of [x, z] cells at radius r around (cx, cz).
function ringCells(cx, cz, r) {
  const seen = new Map();
  const plot = (a, b) => {
    for (const [u, v] of [[a, b], [-a, b], [a, -b], [-a, -b], [b, a], [-b, a], [b, -a], [-b, -a]])
      seen.set(`${cx + u},${cz + v}`, [cx + u, cz + v]);
  };
  for (let x = 0, y = r, p = 1 - r; x <= y; ) {
    plot(x, y);
    x++;
    if (p < 0) p += 2 * x + 1;
    else { y--; p += 2 * (x - y) + 1; }
  }
  return [...seen.values()];
}
// Clockwise bearing from north (-z) in degrees [0, 360); the arc from..to is taken clockwise.
const bearing = (dx, dz) => (((Math.atan2(dx, -dz) * 180) / Math.PI) + 360) % 360;
const onArc = (th, from, to) => (from <= to ? th >= from && th <= to : th >= from || th <= to);

/**
 * Curtain drum: a 1-thick cylinder of cyan glass, radius r about (cx, cz), y0..y1. White rings at the floor ys; below
 * the first ring the ground storey is clear glass. half: only the arc from..to (default 270..90, the north half).
 */
export function curtainDrum(g, { cx, cz, r, y1, y0 = 1, rings = [7, 12, 17, 22, 27, 32, 37, 41], half = false, from = 270, to = 90, skip } = {}) {
  must(r >= 1 && y1 >= y0, `curtainDrum needs r >= 1 and y1 >= y0`);
  const ground = Math.min(...rings);
  let n = 0;
  for (const [x, z] of ringCells(cx, cz, r)) {
    if (half && !onArc(bearing(x - cx, z - cz), from, to)) continue;
    for (let y = y0; y <= y1; y++) {
      const block = rings.includes(y) ? WHITE_CONCRETE : y < ground ? GLASS : CYAN_GLASS;
      n += put(g, [x, y, z], block, null, { skip });
    }
  }
  return n;
}

/**
 * Colonnade along a wall run: 2x2 light-grey columns every `every` blocks from the run's start, y0..y1; a grey band
 * at y1 between them, and a smooth_quartz_slab lip (top) at y1 + 1. The strip is 2 deep, into the building: `into`
 * defaults to south for an east-west run (the north face) and west for a north-south run (the east face).
 * run: {x0, x1, z0, z1}, or {x, z0, z1} / {x0, x1, z} for a straight line.
 */
export function colonnade(g, { run, every = 8, y0 = 1, y1 = 6, into, skip } = {}) {
  const x0 = run.x0 ?? run.x, x1 = run.x1 ?? run.x, z0 = run.z0 ?? run.z, z1 = run.z1 ?? run.z;
  const alongX = z0 === z1;
  must((alongX ? x1 > x0 : z1 > z0), `colonnade run must be a straight line of length >= 2`);
  const dir = DIR[into ?? (alongX ? "south" : "west")];
  must(dir && (alongX ? dir[0] === 0 : dir[1] === 0), `colonnade into "${into}" must cross the run`);
  const [a0, a1] = alongX ? [x0, x1] : [z0, z1];
  const L = alongX ? z0 : x0;                                // the line the columns stand on
  const at = (a, d) => (alongX ? [a, L + d * dir[1]] : [L + d * dir[0], a]);
  const cols = new Set();
  for (let p = a0; p + 1 <= a1; p += every) for (const a of [p, p + 1]) for (const d of [0, 1]) cols.add(at(a, d).join(","));
  let n = 0;
  for (let a = a0; a <= a1; a++) for (let d = 0; d < 2; d++) {
    const [x, z] = at(a, d);
    if (cols.has(`${x},${z}`)) for (let y = y0; y <= y1; y++) n += put(g, [x, y, z], LIGHT_GRAY_CONCRETE, null, { skip });
    else n += put(g, [x, y1, z], GRAY_CONCRETE, null, { skip });
    n += put(g, [x, y1 + 1, z], ...slab("smooth_quartz", "top"), { skip });
  }
  return n;
}

/**
 * Punched window in a wall: 2 wide x 3 tall light-blue glass panes at rows slab+1..slab+3, with a smooth_sandstone
 * slab sill on row slab. face north/south: the wall runs along x at z, the window spans x..x+1; east/west: the wall
 * runs along z at x, the window spans z..z+1. cut: replace the wall cells of the window (use it for a built wall).
 */
export function punchedWindow(g, { x, z, face = "north", slab: s, cut = false, skip } = {}) {
  must(face in DIR, `punchedWindow face "${face}" is not a compass side`);
  must(Number.isInteger(s), `punchedWindow needs slab (the floor row)`);
  const [ax, az] = face === "north" || face === "south" ? [1, 0] : [0, 1];
  const at = (i, y) => [x + ax * i, y, z + az * i];
  const own = new Set();
  for (let i = 0; i < 2; i++) for (let y = s + 1; y <= s + 3; y++) own.add(at(i, y).join(","));
  let n = 0;
  for (let i = 0; i < 2; i++) {
    for (let y = s + 1; y <= s + 3; y++) {
      const [px, py, pz] = at(i, y);
      n += put(g, [px, py, pz], LIGHT_BLUE_PANE, sides(g, own, px, py, pz), { cut, skip });
    }
    n += put(g, at(i, s), ...slab("smooth_sandstone", "bottom"), { cut, skip });
  }
  return n;
}

/** Canopy: one flat smooth_quartz_slab (top) plate over box = [x0, z0, x1, z1] at height y. */
export function canopy(g, { box, y, skip } = {}) {
  must(Array.isArray(box) && box.length === 4 && Number.isInteger(y), `canopy needs box [x0, z0, x1, z1] and y`);
  const [x0, z0, x1, z1] = box;
  let n = 0;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) n += put(g, [x, y, z], ...slab("smooth_quartz", "top"), { skip });
  return n;
}

/**
 * Balcony bay: width x depth top smooth_stone slabs at the slab row (z0 is the outer, north edge), glass_pane rail at
 * slab+1 on the north edge and both side edges. cut: also glazes the door-height opening (glass, rows slab+1..slab+2,
 * the middle cells) in the wall at z0 + depth, which the shell has built.
 */
export function balconyBay(g, { x0, z0 = 0, slab: s, width = 5, depth = 2, cut = false, skip } = {}) {
  must(Number.isInteger(x0) && Number.isInteger(s) && width >= 3 && depth >= 1, `balconyBay needs x0, slab, width >= 3, depth >= 1`);
  const x1 = x0 + width - 1, z1 = z0 + depth - 1;
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) n += put(g, [x, s, z], ...slab("smooth_stone", "top"), { skip });
  const rail = new Map();                                    // north edge, then both side edges (corners once)
  for (let x = x0; x <= x1; x++) rail.set(`${x},${z0}`, [x, z0]);
  for (let z = z0; z <= z1; z++) { rail.set(`${x0},${z}`, [x0, z]); rail.set(`${x1},${z}`, [x1, z]); }
  const own = new Set([...rail.values()].map(([x, z]) => `${x},${s + 1},${z}`));
  for (const [x, z] of rail.values()) n += put(g, [x, s + 1, z], GLASS_PANE, sides(g, own, x, s + 1, z), { skip });
  if (cut) for (let x = x0 + 1; x <= x1 - 1; x++) for (let y = s + 1; y <= s + 2; y++) n += put(g, [x, y, z1 + 1], GLASS, null, { cut, skip });
  return n;
}

/**
 * Pergola: an open frame in box = [x0, y0, z0, x1, y1, z1]. oak_fence posts on the perimeter every 5 blocks, y0..y1-1;
 * oak_slab (top) rafters at y1 along the edges and across at every post line.
 */
export function pergola(g, [x0, y0, z0, x1, y1, z1], { skip } = {}) {
  must(y1 >= y0 && x1 > x0 && z1 > z0, `pergola box must have x1 > x0, z1 > z0, y1 >= y0`);
  const steps = (a, b) => { const s = []; for (let v = a; v < b; v += 5) s.push(v); s.push(b); return s; };
  const xs = steps(x0, x1), zs = steps(z0, z1);
  const posts = new Map();                                   // "x,z" -> [x, z], perimeter only
  for (const x of xs) { posts.set(`${x},${z0}`, [x, z0]); posts.set(`${x},${z1}`, [x, z1]); }
  for (const z of zs) { posts.set(`${x0},${z}`, [x0, z]); posts.set(`${x1},${z}`, [x1, z]); }
  const own = new Set();
  for (const [x, z] of posts.values()) for (let y = y0; y < y1; y++) own.add(`${x},${y},${z}`);
  let n = 0;
  for (const [x, z] of posts.values()) for (let y = y0; y < y1; y++) n += put(g, [x, y, z], "oak_fence", sides(g, own, x, y, z), { skip });
  const rafters = new Map();
  for (const x of xs) for (let z = z0; z <= z1; z++) rafters.set(`${x},${z}`, [x, z]);
  for (const z of zs) for (let x = x0; x <= x1; x++) rafters.set(`${x},${z}`, [x, z]);
  for (const [x, z] of rafters.values()) n += put(g, [x, y1, z], ...slab("oak", "top"), { skip });
  return n;
}

/** Lamp post: oak_fence 4 high from floor row y (default 1, the walking surface), a standing lantern on top. */
export function lampPost(g, x, z, y = 1, { skip } = {}) {
  const own = new Set([0, 1, 2, 3].map((i) => `${x},${y + i},${z}`));
  let n = 0;
  for (let i = 0; i < 4; i++) n += put(g, [x, y + i, z], "oak_fence", sides(g, own, x, y + i, z), { skip });
  n += put(g, [x, y + 4, z], "lantern", { hanging: "false" }, { skip });
  return n;
}
