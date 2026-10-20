// H1 helpers from plan.md VOCABULARY: ribbonBand, crownRing, finRow, sawtoothStep, plantScreen, shopfront, planter, benchRow.
//
// Every helper takes its position (and facing, where it has one) as arguments; nothing is fixed to a spot.
// Each helper writes only inside the footprint it is given, and only into AIR. A cell that already holds a block,
// or lies outside the grid, is left alone and listed in `refused` as [x, y, z, block]. Facade helpers paint onto a
// wall the shell has already laid: pass `over: true` (any block inside the footprint) or `over: [ids]` (only those).
// Pane and bar sides are read from the grid, plus this helper's own cells, when the helper finishes: lay the
// neighbours first. Leaves are persistent=true. Every helper returns { placed, kept, refused }.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const bare = (id) => id.replace(/^minecraft:/, "");
const AIR = /^(cave_air|void_air|structure_void|air)$/;
// Blocks a pane or bar does not join (vanilla joins full blocks only).
const NOT_FULL = /(stairs|slab|trapdoor|door|fence|fence_gate|wall|sign|banner|torch|lantern|chain|end_rod|button|plate|lever|ladder|carpet|bed|leaves|flower|sapling|bell|candle|pot)$/;

// Write one batch: a cell that already holds the same block is kept; air is written; a block is overwritten only when
// `over` allows it. Everything else is refused, never thrown.
function commit(g, cells, over) {
  const out = { placed: 0, kept: 0, refused: [] };
  for (const { x, y, z, block, state } of cells) {
    if (!g.inBounds(x, y, z)) { out.refused.push([x, y, z, "outside grid"]); continue; }
    const cur = bare(g.blockAt(x, y, z));
    if (cur === bare(block)) { out.kept++; continue; }
    const may = over === true || (Array.isArray(over) && over.map(bare).includes(cur));
    if (g.isAir(x, y, z) || may) { g.set(x, y, z, block, state); out.placed++; }
    else out.refused.push([x, y, z, cur]);
  }
  return out;
}

// What a pane or bar at (x, y, z) joins: its own family, or a full block.
function joins(g, plan, x, y, z, family) {
  const id = bare(plan.get(`${x},${y},${z}`) ?? g.blockAt(x, y, z));
  if (family === "pane" ? /_pane$/.test(id) : id === "iron_bars") return true;
  if (/(pane|bars)$/.test(id) || AIR.test(id)) return false;
  return !NOT_FULL.test(id);
}

// Plan first (so a run's own neighbours count), then states, then write.
function finish(g, cells, over) {
  const plan = new Map(cells.map((c) => [`${c.x},${c.y},${c.z}`, c.block]));
  for (const c of cells) {
    if (!c.family) continue;
    const s = (dx, dy, dz) => joins(g, plan, c.x + dx, c.y + dy, c.z + dz, c.family);
    c.state = { north: s(0, 0, -1), east: s(1, 0, 0), south: s(0, 0, 1), west: s(-1, 0, 0), waterlogged: "false" };
  }
  return commit(g, cells, over);
}

// A line or box of columns {x0,x1,z0,z1}; a lone x or z fills in its pair, so {x, z0, z1} is a run along z at column x.
const span = (a) => ({ x0: a.x0 ?? a.x, x1: a.x1 ?? a.x0 ?? a.x, z0: a.z0 ?? a.z, z1: a.z1 ?? a.z0 ?? a.z });

/**
 * One wall run (a line of columns): white at the slab row, glass in the three rows above it, white for the next two
 * rows (the next slab row included). Piers and corners are not this helper's job.
 */
export function ribbonBand(g, a) {
  const { x0, x1, z0, z1 } = span(a);
  if (x0 !== x1 && z0 !== z1) throw new Error("ribbonBand: a run is one column wide (x0..x1 at one z, or z0..z1 at one x)");
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = a.slab; y <= a.slab + 5; y++) {
    const glass = y >= a.slab + 1 && y <= a.slab + 3;
    cells.push(glass ? { x, y, z, block: "gray_stained_glass_pane", family: "pane" } : { x, y, z, block: "white_concrete" });
  }
  return finish(g, cells, a.over);
}

/**
 * Flying-saucer crown: an annulus of top quartz slabs from r-2 out to r at height y (the overhang), iron-bar rail on its
 * outer edge at `rail`, a quartz lid inside it at `lid`. half: keep only the north half (z <= cz).
 */
export function crownRing(g, { cx, cz, r, y = 42, rail = y + 1, lid = y - 1, half = false, over }) {
  const cells = [];
  for (let x = cx - r - 1; x <= cx + r + 1; x++) for (let z = cz - r - 1; z <= cz + r + 1; z++) {
    if (half && z > cz) continue;
    const d = Math.hypot(x - cx, z - cz);
    if (d <= r - 2.5) { cells.push({ x, y: lid, z, block: "smooth_quartz" }); continue; }
    if (d > r + 0.5) continue;
    const [block, state] = B.slab("smooth_quartz", "top");
    cells.push({ x, y, z, block, state });
    if (d > r - 1) cells.push({ x, y: rail, z, block: "iron_bars", family: "bars" });
  }
  return finish(g, cells, over);
}

/** Vertical light-grey fins: one column per x in xs, from y0 to y1 (inclusive), in the plane z. */
export function finRow(g, { xs, z = 3, y0 = 7, y1 = 36, over }) {
  const cells = [];
  for (const x of xs) for (let y = y0; y <= y1; y++) cells.push({ x, y, z, block: "light_gray_concrete" });
  return finish(g, cells, over);
}

const SLABS = [7, 12, 17, 22, 27, 32];
/**
 * Hyatt's sawtooth west face. rects: the wedge bays in order from the north tip southward, each {x0,x1,y0,y1,z0,z1}.
 * Per bay: a 2-wide, 3-tall window in its west face at each guest storey, and its north return (the part of its north
 * edge that the bay to its north doesn't cover) in solid beige. Pass over: true, the wedge is already walled.
 */
export function sawtoothStep(g, rects, { over, slabs = SLABS } = {}) {
  const cells = [];
  rects.forEach((r, i) => {
    const prev = rects[i - 1];
    const ret = !prev ? [r.x0, r.x1] : r.x0 < prev.x0 ? [r.x0, Math.min(r.x1, prev.x0 - 1)] : null;
    if (ret) for (let x = ret[0]; x <= ret[1]; x++) for (let y = Math.max(1, r.y0); y <= r.y1; y++) cells.push({ x, y, z: r.z0, block: "smooth_sandstone" });
    for (const s of slabs) for (let y = s + 1; y <= s + 3; y++) {
      if (y < Math.max(1, r.y0) || y > r.y1) continue;
      for (const z of [r.z0 + 1, r.z0 + 2]) cells.push({ x: r.x0, y, z, block: "light_blue_stained_glass_pane", family: "pane" });
    }
  });
  return finish(g, cells, over);
}

/**
 * Rooftop screen around a plant box [x0, y0, z0, x1, y1, z1] (inclusive): light-grey kerb ring at y0, iron-bar walls
 * from y0+1 to y1-1 on the ring, a flat slab lid over the whole box at y1. Needs y1 >= y0 + 2.
 */
export function plantScreen(g, [x0, y0, z0, x1, y1, z1], { over } = {}) {
  if (y1 < y0 + 2) throw new Error("plantScreen: y1 must be at least y0 + 2 (kerb, bars, lid)");
  const [lid, lidState] = B.slab("smooth_stone", "bottom");
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x === x0 || x === x1 || z === z0 || z === z1) {
      cells.push({ x, y: y0, z, block: "light_gray_concrete" });
      for (let y = y0 + 1; y < y1; y++) cells.push({ x, y, z, block: "iron_bars", family: "bars" });
    }
    cells.push({ x, y: y1, z, block: lid, state: lidState });
  }
  return finish(g, cells, over);
}

/**
 * A shopfront on the wall plane z, x0..x1: glass in y1..5 between 1-wide polished_deepslate piers every `bay`+1
 * (the last pier on x1), black_concrete fascia at y6. open: [[xa, xb], ...] doorways, left alone at y1..2 (the doors
 * are doorPair's job).
 */
export function shopfront(g, { x0, x1, z, bay = 9, open = [], over }) {
  const piers = new Set([x1]);
  for (let x = x0; x <= x1; x += bay + 1) piers.add(x);
  const doorway = (x) => open.some(([a, b]) => x >= a && x <= b);
  const cells = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = 1; y <= 5; y++) {
      if (y <= 2 && doorway(x)) continue;
      cells.push({ x, y, z, block: piers.has(x) ? "polished_deepslate" : "glass" });
    }
    cells.push({ x, y: 6, z, block: "black_concrete" });
  }
  return finish(g, cells, over);
}

/**
 * A planter bed on the box [x0, y0, z0, x1, y1, z1] (inclusive, y1 > y0): polished_andesite kerb ring from y0 to y1-1,
 * moss_block soil inside at y0, persistent azalea_leaves on alternate interior cells at y1.
 */
export function planter(g, [x0, y0, z0, x1, y1, z1], { over } = {}) {
  if (y1 <= y0) throw new Error("planter: y1 must be above y0 (the kerb sits under the plants)");
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x === x0 || x === x1 || z === z0 || z === z1) {
      for (let y = y0; y < y1; y++) cells.push({ x, y, z, block: "polished_andesite" });
      continue;
    }
    cells.push({ x, y: y0, z, block: "moss_block" });
    if ((x + z) % 2 === 0) cells.push({ x, y: y1, z, block: "azalea_leaves", state: { persistent: "true" } });
  }
  return finish(g, cells, over);
}

/**
 * A curved bench row on a circle of radius r about centre [cx, cz], from angle a0 to a1 in degrees (0 = east, 90 = south).
 * Each bench is a smooth_quartz stair at height y with its full-height back to the outside, so the seat faces the centre.
 * Only the one bench cell per step is written: the lane above it stays clear.
 */
export function benchRow(g, [cx, cz], r, [a0, a1], { y = 1, over } = {}) {
  const n = Math.max(1, Math.ceil((Math.abs(a1 - a0) * Math.PI / 180) * r));
  const seen = new Set();
  const cells = [];
  for (let k = 0; k <= n; k++) {
    const t = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180;
    const ux = Math.cos(t), uz = Math.sin(t);
    const x = Math.round(cx + r * ux), z = Math.round(cz + r * uz);
    if (seen.has(`${x},${z}`)) continue;
    seen.add(`${x},${z}`);
    const facing = Math.abs(ux) >= Math.abs(uz) ? (ux > 0 ? "east" : "west") : (uz > 0 ? "south" : "north");
    const [block, state] = B.stairs("smooth_quartz", facing, "bottom");
    cells.push({ x, y, z, block, state });
  }
  return finish(g, cells, over);
}
