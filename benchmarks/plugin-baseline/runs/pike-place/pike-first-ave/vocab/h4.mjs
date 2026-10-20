// Eight helpers from plan.md VOCABULARY: bayRhythm, doorLantern, deckAndParapet, orielBay, ribbonStorey, bannerSign,
// bulkhead, pavilion. Each one plans its own cells first, then writes only the cells that land in air. A cell that is
// already built is skipped and reported, never overwritten; { over: true } replaces blocks in the helper's own cells
// (the storey's wall, for ribbonStorey) and nothing else. Coordinates are the grid's own (plot-local for a plot).
// Each returns { placed, skipped: [{ pos, why }] }; bannerSign also returns the number of letters it hung.
//
// A tread is { cells: [[x, z], ...] (ring-1 cells of one straight run of wall), face: "north"|"south"|"east"|"west" }.
// The face is the outward direction; ring 0 (the proud plane) is one cell out from each tread cell.
import { B, DIRS, OPPOSITE, bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const K = (x, y, z) => `${x},${y},${z}`;
const WEST_EAST = [[-1, 0, "west"], [1, 0, "east"]];
const NORTH_SOUTH = [[0, -1, "north"], [0, 1, "south"]];
const ALL_FOUR = [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]];

/** Planned cells, placed in one commit so each cell is written once and connection states can see their neighbours. */
class Plan {
  constructor(g) { this.g = g; this.cells = new Map(); }
  put(x, y, z, block, state, nbt) { this.cells.set(K(x, y, z), { pos: [x, y, z], block, state, nbt }); return this; }
  /** A block at this cell, planned or already built (what a pane or bar connects to). */
  has(x, y, z) { return this.cells.has(K(x, y, z)) || (this.g.inBounds(x, y, z) && !this.g.isAir(x, y, z)); }
}

function commit(g, plan, { over = false } = {}) {
  const skipped = [];
  let placed = 0;
  for (const { pos, block, state, nbt } of plan.cells.values()) {
    const [x, y, z] = pos;
    if (!g.inBounds(x, y, z)) skipped.push({ pos, why: "outside" });
    else if (!over && !g.isAir(x, y, z)) skipped.push({ pos, why: "occupied" });
    else { g.set(x, y, z, block, state, nbt); placed++; }
  }
  return { placed, skipped };
}

/** Connection states for panes and bars: true toward each named neighbour that holds a block. */
function linkState(plan, x, y, z, links) {
  const s = { north: false, east: false, south: false, west: false };
  for (const [dx, dz, name] of links) s[name] = plan.has(x + dx, y, z + dz);
  return s;
}

/** Place a row of connected cells (panes, bars): all first, then the states, so each sees its neighbours. */
function linked(plan, cells, block, links) {
  for (const [x, y, z] of cells) plan.put(x, y, z, block, {});
  for (const [x, y, z] of cells) plan.put(x, y, z, block, linkState(plan, x, y, z, links));
}

/** A tread in grid terms: cells sorted along the wall, the outward offset, the facing of stairs that sit into the wall,
 *  and the neighbour offsets along the wall (for connection states). */
function readTread({ cells, face }) {
  const alongX = face === "north" || face === "south";
  return {
    cells: [...cells].sort((a, b) => (alongX ? a[0] - b[0] : a[1] - b[1])),
    out: DIRS[face],
    into: OPPOSITE[face],
    links: alongX ? WEST_EAST : NORTH_SOUTH,
  };
}

/** Ring of every block cell of a footprint (plan.md's rule): 0 = outermost cell of the mask, 1 the next one in, ...
 *  footprint: the brief's rows of '#' and '.', one character per 2 blocks. Returns Map "x,z" -> ring. */
function ringMap(footprint) {
  const W = footprint[0].length * 2, H = footprint.length * 2;
  const inM = (x, z) => x >= 0 && z >= 0 && x < W && z < H && footprint[z >> 1][x >> 1] === "#";
  const dist = new Map(), queue = [];
  for (let x = -1; x <= W; x++) for (let z = -1; z <= H; z++) if (!inM(x, z)) { dist.set(K(x, 0, z), 0); queue.push([x, z]); }
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i], d = dist.get(K(x, 0, z));
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (inM(nx, nz) && !dist.has(K(nx, 0, nz))) { dist.set(K(nx, 0, nz), d + 1); queue.push([nx, nz]); }
    }
  }
  const ring = new Map();
  for (let x = 0; x < W; x++) for (let z = 0; z < H; z++) if (inM(x, z)) ring.set(`${x},${z}`, dist.get(K(x, 0, z)) - 1);
  return ring;
}

/** Window runs along a tread of n ring-1 cells (plan.md's rhythm rule). 8: pier1 win2 pier2 win2 pier1; 6: pier2 win2
 *  pier2; 10-14 (and the rest): 2-wide windows every 3, centred, at least 1 pier at each end; 4 or fewer: solid. */
function windowRuns(n) {
  if (n <= 4) return [];
  if (n === 6) return [[2, 3]];
  if (n === 8) return [[1, 2], [5, 6]];
  const k = Math.floor((n - 1) / 3), span = 3 * k - 1, s = Math.floor((n - span) / 2);
  return Array.from({ length: k }, (_, j) => [s + 3 * j, s + 3 * j + 1]);
}

/** Windows of one storey on a tread: glass_pane in ring 1 (floor+1..floor+h), a slab sill at ring 0 on the floor line,
 *  and an upside-down stair lintel pair at ring 0 above the window. Air only: the shell leaves window cells open. */
export function bayRhythm(g, tread, { floorY, h = 3, sill = "smooth_stone", lintel = "stone_brick", over = false } = {}) {
  const t = readTread(tread), plan = new Plan(g), panes = [];
  for (const run of windowRuns(t.cells.length)) for (const i of run) {
    const [x, z] = t.cells[i], px = x + t.out[0], pz = z + t.out[2];
    for (let y = floorY + 1; y <= floorY + h; y++) panes.push([x, y, z]);
    plan.put(px, floorY, pz, ...B.slab(sill, "top"));
    plan.put(px, floorY + h + 1, pz, ...B.stairs(lintel, t.into, "top"));
  }
  linked(plan, panes, "glass_pane", t.links);
  return commit(g, plan, { over });
}

/** A lantern beside a door, on the ring-0 cells either side of its 2-wide opening (the lane in front stays clear).
 *  door: { x, z, y, face } as doorPair takes it: the first ring-1 door cell (lower coordinate) and the floor y.
 *  mode "post": dark_oak_fence y+1..y+2 with a standing lantern on top; "hang": a hanging lantern at y+2 under a
 *  support block at y+3 (default a full smooth_stone). */
export function doorLantern(g, door, { mode = "post", support = "smooth_stone", over = false } = {}) {
  const { x, z, y, face } = door, out = DIRS[face], plan = new Plan(g);
  const alongX = face === "north" || face === "south";
  const flanks = alongX
    ? [[x - 1, z + out[2]], [x + 2, z + out[2]]]
    : [[x + out[0], z - 1], [x + out[0], z + 2]];
  for (const [fx, fz] of flanks) {
    if (mode === "hang") {
      plan.put(fx, y + 2, fz, ...B.lantern(true));
      plan.put(fx, y + 3, fz, ...B.block(support));
    } else {
      plan.put(fx, y + 1, fz, ...B.fence("dark_oak"));
      plan.put(fx, y + 2, fz, ...B.fence("dark_oak"));
      plan.put(fx, y + 3, fz, ...B.lantern(false));
    }
  }
  return commit(g, plan, { over });
}

/** Flat roof behind a parapet. The deck (a full block) fills every block of the footprint at ring >= `ring` at deckY;
 *  the parapet is `parapet` on ring `ring` for parapetH blocks; the coping is a `coping` slab on the parapet top; an
 *  optional iron_bars rail stands on the coping. The coping is type bottom: a top-type slab on the parapet would hang
 *  half a block in air. plot: { footprint } (rows of '#'/'.'). skip(x, z) leaves a cell alone (a courtyard, a void). */
export function deckAndParapet(g, plot, { deckY, deck = "gray_concrete", parapet = "smooth_sandstone", parapetH = 1, coping = "smooth_sandstone", rail = false, ring = 1, skip = () => false, over = false } = {}) {
  const plan = new Plan(g), rails = [];
  for (const [key, k] of ringMap(plot.footprint)) {
    const [x, z] = key.split(",").map(Number);
    if (k < ring || skip(x, z)) continue;
    plan.put(x, deckY, z, deck);
    if (k !== ring) continue;
    for (let y = deckY + 1; y <= deckY + parapetH; y++) plan.put(x, y, z, parapet);
    plan.put(x, deckY + parapetH + 1, z, `${coping}_slab`, { type: "bottom", waterlogged: "false" });
    if (rail) rails.push([x, deckY + parapetH + 2, z]);
  }
  linked(plan, rails, "iron_bars", ALL_FOUR);
  return commit(g, plan, { over });
}

/** Stacked bay on ring 0 of a tread: the middle 4 tread cells project as a bay, y from..to. Bricks at the 2 corners, glass
 *  on the 2 middle faces (and in the ring-1 cells behind them), brick_stairs corbel (upside down) at corbelY, and a
 *  polished_andesite cap at capY. */
export function orielBay(g, tread, { from = 10, to = 27, corbelY = 9, capY = 28, over = false } = {}) {
  const t = readTread(tread), plan = new Plan(g), n = t.cells.length, s = Math.floor((n - 4) / 2), glass = [];
  for (let i = s; i < s + 4; i++) {
    const [x, z] = t.cells[i], px = x + t.out[0], pz = z + t.out[2];
    const corner = i === s || i === s + 3;
    for (let y = from; y <= to; y++) {
      if (corner) plan.put(px, y, pz, "bricks");
      else glass.push([px, y, pz]);
      if (!corner && i !== s) glass.push([x, y, z]);
    }
    plan.put(px, corbelY, pz, ...B.stairs("brick", t.into, "top"));
    plan.put(px, capY, pz, "polished_andesite");
  }
  linked(plan, glass, "glass_pane", t.links);
  return commit(g, plan, { over });
}

/** One storey of ribbon windows on a tread: smooth_sandstone band at floorY, bricks spandrel at floorY+1, a continuous
 *  glass run at floorY+2..+3 broken by bricks piers at both ends and every 7 cells, smooth_sandstone band at floorY+4.
 *  project: a smooth_sandstone_slab (type top) at ring 0 under the band, the shadow line. */
export function ribbonStorey(g, tread, { floorY, project = false, over = false } = {}) {
  const t = readTread(tread), plan = new Plan(g), n = t.cells.length, glass = [];
  const pier = (i) => i === 0 || i === n - 1 || i % 7 === 0;
  t.cells.forEach(([x, z], i) => {
    plan.put(x, floorY, z, "smooth_sandstone");
    plan.put(x, floorY + 1, z, "bricks");
    for (const y of [floorY + 2, floorY + 3]) {
      if (pier(i)) plan.put(x, y, z, "bricks");
      else glass.push([x, y, z]);
    }
    plan.put(x, floorY + 4, z, "smooth_sandstone");
    if (project) plan.put(x + t.out[0], floorY, z + t.out[2], ...B.slab("smooth_sandstone", "top"));
  });
  linked(plan, glass, "glass_pane", t.links);
  return commit(g, plan, { over });
}

/** A sign on ring 0 of a tread: a board of `board` over rows y0..y1 with one cell margin at each end, lanterns hanging
 *  under the two end cells, and the words in white wall banners hung in front of the board's middle (bannerWord reads
 *  left to right from the street). base is the banner's base dye: default the board's own colour. */
export function bannerSign(g, tread, { text, y0, y1, board = "red_concrete", letter = "white", base = board.replace(/_(concrete|terracotta|wool)$/, ""), lantern = true, over = false } = {}) {
  const t = readTread(tread), plan = new Plan(g), n = t.cells.length;
  for (const [x, z] of t.cells.slice(1, n - 1)) {
    for (let y = y0; y <= y1; y++) plan.put(x + t.out[0], y, z + t.out[2], board);
  }
  if (lantern) for (const i of [1, n - 2]) {
    const [x, z] = t.cells[i];
    plan.put(x + t.out[0], y0 - 1, z + t.out[2], ...B.lantern(true));
  }
  const res = commit(g, plan, { over });
  const [mx, mz] = t.cells[Math.round((n - 1) / 2)];
  const center = [mx + t.out[0], Math.floor((y0 + y1) / 2), mz + t.out[2]];
  const letters = bannerWord(g, text, { center, face: tread.face, letter, base });
  return { ...res, letters };
}

/** A stair bulkhead on a flat roof: a hollow brick box (box = [x0, y0, z0, x1, y1, z1]) with a solid top, a slab cap on
 *  top, and one dark_oak_door on the `door` face in the middle, standing on the box's floor layer. */
export function bulkhead(g, box, { door = "south", block = "bricks", cap = "smooth_stone", over = false } = {}) {
  const [x0, y0, z0, x1, y1, z1] = box, plan = new Plan(g);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (y === y0 || y === y1 || x === x0 || x === x1 || z === z0 || z === z1) plan.put(x, y, z, block);
  }
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) plan.put(x, y1 + 1, z, ...B.slab(cap, "bottom"));
  const dx = door === "west" ? x0 : door === "east" ? x1 : Math.floor((x0 + x1) / 2);
  const dz = door === "north" ? z0 : door === "south" ? z1 : Math.floor((z0 + z1) / 2);
  plan.put(dx, y0 + 1, dz, ...B.door("dark_oak", door, "lower", "left"));
  plan.put(dx, y0 + 2, dz, ...B.door("dark_oak", door, "upper", "left"));
  return commit(g, plan, { over });
}

/** A glazed rooftop pavilion over box = [x0, y0, z0, x1, y1, z1]: spruce_planks floor at y0, glass_pane walls on y0+1..y1
 *  with smooth_quartz corner posts, a 2-wide doorway in the south wall near the west corner (y0+1..y0+2), a smooth_quartz
 *  roof at y1+1, a 1-proud smooth_quartz_slab eave on the four sides, and one hanging lantern under the roof. */
export function pavilion(g, box, { floor = "spruce_planks", eave = true, over = false } = {}) {
  const [x0, y0, z0, x1, y1, z1] = box, plan = new Plan(g), panes = [];
  const doorway = (x, y, z) => z === z1 && (x === x0 + 1 || x === x0 + 2) && y <= y0 + 2;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    plan.put(x, y0, z, floor);
    plan.put(x, y1 + 1, z, "smooth_quartz");
    if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue;
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    for (let y = y0 + 1; y <= y1; y++) {
      if (doorway(x, y, z)) continue;
      if (corner) plan.put(x, y, z, "smooth_quartz");
      else panes.push([x, y, z]);
    }
  }
  if (eave) {
    for (let z = z0; z <= z1; z++) { plan.put(x0 - 1, y1 + 1, z, ...B.slab("smooth_quartz", "bottom")); plan.put(x1 + 1, y1 + 1, z, ...B.slab("smooth_quartz", "bottom")); }
    for (let x = x0; x <= x1; x++) { plan.put(x, y1 + 1, z0 - 1, ...B.slab("smooth_quartz", "bottom")); plan.put(x, y1 + 1, z1 + 1, ...B.slab("smooth_quartz", "bottom")); }
  }
  plan.put(Math.floor((x0 + x1) / 2), y1, Math.floor((z0 + z1) / 2), ...B.lantern(true));
  linked(plan, panes, "glass_pane", ALL_FOUR);
  return commit(g, plan, { over });
}
