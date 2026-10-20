// Space Needle vocabulary, part 3 set (plan.md VOCABULARY): legBox, pairTie, coreBand, ringWall, hexCells, glassRing,
// roofStep, hiddenLamp. Each takes its position as arguments (centre defaults to the axis [32, 32]), writes only its own
// footprint, and only into air, or into the blocks named in opts.over. Cells it may not write are left alone and listed
// in `refused`; cells already holding the block it wants count as `kept`. Returns { placed, kept, refused }.
import { circleCells, inwardFacing, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const CENTRE = [32, 32];
const ns = (id) => (id.includes(":") ? id : `minecraft:${id}`);
const key = (x, z) => `${x},${z}`;

// Leg table (plan.md): pair angle θ in degrees, and the side of the pair centreline (a = minus, b = plus).
const LEG = { Sa: [180, -1], Sb: [180, 1], NEa: [60, -1], NEb: [60, 1], NWa: [300, -1], NWb: [300, 1] };
const PAIRS = ["S", "NE", "NW"];
// Doorways in the core's north wall (plan.md OPENINGS): x 31..33, z 29, these y ranges.
const CORE_DOORWAYS = [[2, 4], [43, 45], [213, 215], [219, 221]];

// Writes [x, y, z, id, state?] items where the cell is air or in opts.over. Everything else is refused, not overwritten.
function paint(g, items, opts = {}) {
  const over = new Set((opts.over ?? []).map(ns));
  const out = { placed: [], kept: 0, refused: [] };
  for (const [x, y, z, id, state] of items) {
    if (!g.inBounds(x, y, z)) { out.refused.push([x, y, z, "out of bounds"]); continue; }
    const cur = g.blockAt(x, y, z);
    if (cur === ns(id)) { out.kept++; continue; }
    if (!g.isAir(x, y, z) && !over.has(cur)) { out.refused.push([x, y, z, cur]); continue; }
    g.set(x, y, z, id, state);
    out.placed.push([x, y, z]);
  }
  return out;
}

// Plan's "ring at r=N": N-0.5 < r <= N+0.5, i.e. circleCells(N) minus circleCells(N-1).
function annulus(r, centre) {
  const inner = new Set(circleCells(r - 1, { center: centre }).map(([x, z]) => key(x, z)));
  return circleCells(r, { center: centre }).filter(([x, z]) => !inner.has(key(x, z)));
}

// Leg radius from the axis (plan.md LEG TABLE).
function legRadius(y) {
  return y <= 120 ? 6.5 + 15.5 * ((120 - y) / 119) ** 1.15 : 6.5 + 7.5 * ((y - 120) / 85) ** 1.4;
}

// Origin (min x, min z) of a leg's 2x2 box at y: centre = (32,32) + R·(sinθ, -cosθ) ± 2.5·(cosθ, sinθ), rounded as the plan says.
function legOrigin(leg, y) {
  const spec = LEG[leg];
  if (!spec) throw new Error(`leg must be one of ${Object.keys(LEG).join(", ")}; got ${leg}`);
  const [deg, side] = spec, th = (deg * Math.PI) / 180, R = legRadius(y);
  const cx = CENTRE[0] + R * Math.sin(th) + side * 2.5 * Math.cos(th);
  const cz = CENTRE[1] - R * Math.cos(th) + side * 2.5 * Math.sin(th);
  return [Math.round(cx - 0.5), Math.round(cz - 0.5)];
}

const box2 = (x0, z0) => [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]];

/**
 * One leg: a 2x2 smooth_quartz column at its origin for level y. leg: "Sa" | "Sb" | "NEa" | "NEb" | "NWa" | "NWb".
 */
export function legBox(g, leg, y, opts = {}) {
  const [x0, z0] = legOrigin(leg, y);
  return paint(g, box2(x0, z0).map(([x, z]) => [x, y, z, "smooth_quartz"]), opts);
}

// Cells of pair p at level y strictly between its two legs: a 4-connected walk from one leg's centre to the other's.
function gapCells(pair, y) {
  const [ax, az] = legOrigin(`${pair}a`, y), [bx, bz] = legOrigin(`${pair}b`, y);
  const legs = new Set([...box2(ax, az), ...box2(bx, bz)].map(([x, z]) => key(x, z)));
  const steps = Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(bz - az)) * 8) + 1;
  const out = new Map();
  let prev = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.floor(ax + 0.5 + (bx - ax) * t), z = Math.floor(az + 0.5 + (bz - az) * t);
    const hops = prev && prev[0] !== x && prev[1] !== z ? [[x, prev[1]], [x, z]] : [[x, z]];
    for (const [hx, hz] of hops) if (!legs.has(key(hx, hz))) out.set(key(hx, hz), [hx, hz]);
    prev = [x, z];
  }
  return [...out.values()];
}

/** The 1-high bottom smooth_quartz_slab tie across each pair's gap at level y (all three pairs). */
export function pairTie(g, y, opts = {}) {
  const items = [];
  for (const p of PAIRS) for (const [x, z] of gapCells(p, y)) items.push([x, y, z, ...B.slab("smooth_quartz", "bottom")]);
  return paint(g, items, opts);
}

/** White concrete ring on the core's outer faces (x 29..35, z 29..35) at y, skipping the north doorways. */
export function coreBand(g, y, opts = {}) {
  const doorway = (x, z) => z === 29 && x >= 31 && x <= 33 && CORE_DOORWAYS.some(([a, b]) => y >= a && y <= b);
  const items = [];
  for (let x = 29; x <= 35; x++) for (let z = 29; z <= 35; z++) {
    const edge = x === 29 || x === 35 || z === 29 || z === 35;
    if (edge && !doorway(x, z)) items.push([x, y, z, "white_concrete"]);
  }
  return paint(g, items, { over: ["iron_bars"], ...opts });
}

/** A ring wall at radius r for y0..y1 (plan's ring convention), all one block. opts.centre, opts.state, opts.over. */
export function ringWall(g, r, y0, y1, block, opts = {}) {
  const { centre = CENTRE, state, ...rest } = opts;
  const items = [];
  for (let y = y0; y <= y1; y++) for (const [x, z] of annulus(r, centre)) items.push([x, y, z, block, state]);
  return paint(g, items, rest);
}

/**
 * A ring of glazing at radius r for y0..y1. Glass panes get their north/east/south/west connections from the ring
 * itself, so the ring reads continuous; other glazing (glass, stained glass) needs no state.
 */
export function glassRing(g, r, y0, y1, block, opts = {}) {
  const { centre = CENTRE, ...rest } = opts;
  const ring = annulus(r, centre), inRing = new Set(ring.map(([x, z]) => key(x, z)));
  const pane = block.endsWith("_pane");
  const items = [];
  for (let y = y0; y <= y1; y++) for (const [x, z] of ring) {
    const state = pane ? {
      north: String(inRing.has(key(x, z - 1))), east: String(inRing.has(key(x + 1, z))),
      south: String(inRing.has(key(x, z + 1))), west: String(inRing.has(key(x - 1, z))), waterlogged: "false",
    } : undefined;
    items.push([x, y, z, block, state]);
  }
  return paint(g, items, rest);
}

/**
 * The hexagon of apothem a at y (plan's SkyLine convention): filled, or only its outline when opts.outline is true
 * (the glass wall). opts.centre, opts.state, opts.over.
 */
export function hexCells(g, a, y, block, opts = {}) {
  const { centre = CENTRE, outline = false, state, ...rest } = opts;
  const [cx, cz] = centre;
  const inHex = (x, z) => {
    const dx = x - cx, dz = z - cz;
    return Math.abs(dz) <= a && Math.abs(0.866 * dx - 0.5 * dz) <= a && Math.abs(0.866 * dx + 0.5 * dz) <= a;
  };
  const reach = Math.ceil(a / 0.866) + 2, items = [];
  for (let x = cx - reach; x <= cx + reach; x++) for (let z = cz - reach; z <= cz + reach; z++) {
    if (!inHex(x, z)) continue;
    const edge = !inHex(x + 1, z) || !inHex(x - 1, z) || !inHex(x, z + 1) || !inHex(x, z - 1);
    if (!outline || edge) items.push([x, y, z, block, state]);
  }
  return paint(g, items, rest);
}

/**
 * A stepped roof disc at y: smooth_quartz out to radius r-1, with the outer ring of smooth_quartz_stairs facing the
 * centre (rising toward it, as the library's dome edges do). opts.centre, opts.over.
 */
export function roofStep(g, y, r, opts = {}) {
  const { centre = CENTRE, ...rest } = opts;
  const inner = new Set(circleCells(r - 1, { center: centre }).map(([x, z]) => key(x, z)));
  const items = [];
  for (const [x, z] of circleCells(r, { center: centre })) {
    if (inner.has(key(x, z))) items.push([x, y, z, "smooth_quartz"]);
    else items.push([x, y, z, ...B.stairs("smooth_quartz", inwardFacing(x - centre[0], z - centre[1]))]);
  }
  return paint(g, items, rest);
}

/**
 * A sea lantern in the floor or soffit cell at (x, y, z). Refuses air: a lamp is hidden in a block. Replaces only the
 * materials in opts.over (default: the plan's floor and soffit materials).
 */
export function hiddenLamp(g, x, y, z, opts = {}) {
  if (g.isAir(x, y, z)) return { placed: [], kept: 0, refused: [[x, y, z, "air"]] };
  return paint(g, [[x, y, z, "sea_lantern"]], { over: ["smooth_quartz", "light_gray_concrete", "white_concrete"], ...opts });
}
