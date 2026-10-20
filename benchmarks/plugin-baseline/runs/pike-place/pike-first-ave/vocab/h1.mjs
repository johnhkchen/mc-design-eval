// H1 helpers from plan.md VOCABULARY: ringOf, windowLit, cornice, shopfront, julietBalcony, terrace, fireEscape, hvacBox.
//
// Plot-local coordinates throughout (x, z per plot as in plan.md; y as in plan.md). Every helper takes its position
// (and facing, where it has one) as arguments; nothing is fixed to a spot. Writes go only into AIR; an option `over`
// lists block ids a helper may replace. A refused write (occupied or out of the grid) is collected, never thrown, and
// each helper returns the refusals as [x, y, z, block] so the caller can report them. Panes and iron bars get their
// connection states when the helper finishes, so lay the neighbours first. Leaves are persistent=true.
//
// Shapes the helpers share:
//   plot    { footprint: string[] }       FOOTPRINT rows: row z//2, column x//2, "#" = build here
//   tread   { face, wall: [[x,z], ...] }  ring-1 wall cells of one straight run, in order along it. face is the outward
//                                         direction (north/south/east/west); the proud ring-0 cell is cell + face.
//   window  { face, cells: [[x,z], ...], floor, h, n, s, seq? }
//                                         ring-1 glass cells of one opening, in order along the run. n = its index on
//                                         the tread, s = its storey index, seq = its index among all lit windows
//                                         (defaults to n + s).
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const bare = (id) => id.replace(/^minecraft:/, "");
const pair = (block) => (Array.isArray(block) ? block : [block]);
const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };

// Pane and bar sides: a side is open to a neighbour of the same block or to any plain solid block.
const NOT_SOLID = /(stairs|slab|door|trapdoor|fence|wall|pane|lantern|chain|ladder|torch|sign|flower|pot|vine|carpet|bars|candle|leaves|azalea|banner|bed)/;
const SIDES = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
function link(g, x, y, z, block) {
  const state = {};
  for (const [side, [dx, dz]] of Object.entries(SIDES)) {
    const id = bare(g.blockAt(x + dx, y, z + dz));
    state[side] = String(id === block || (id !== "air" && !NOT_SOLID.test(id)));
  }
  g.set(x, y, z, block, state);
}

// One writer per helper call. set() writes only into air (or a block listed in `over`) and records what it refused.
function writer(g, over = []) {
  const placed = [], refused = [];
  const set = (x, y, z, block, state, nbt) => {
    if (!g.inBounds(x, y, z) || (!g.isAir(x, y, z) && !over.includes(bare(g.blockAt(x, y, z))))) {
      refused.push([x, y, z, block]);
      return false;
    }
    g.set(x, y, z, block, state, nbt);
    placed.push([x, y, z, bare(block)]);
    return true;
  };
  const finish = () => {
    for (const [x, y, z, block] of placed) if (block === "glass_pane" || block === "iron_bars") link(g, x, y, z, block);
    return refused;
  };
  return { set, finish };
}

const CELL_KEY = (cell) => cell.split(",").map(Number);

/**
 * Ring of every cell of the footprint M: ring k = cells whose 4-neighbour distance to the nearest cell outside M is
 * k+1 (ring 0 is the outermost). faceDir is the direction toward the outside (for a ring-0 cell, its outside
 * neighbour; at a corner, the first of north, south, east, west). Returns Map "x,z" -> { ring, faceDir }.
 */
export function ringOf(plot) {
  const rows = plot.footprint;
  const W = Math.max(...rows.map((r) => r.length)) * 2, H = rows.length * 2;
  const inM = (x, z) => x >= 0 && z >= 0 && x < W && z < H && rows[z >> 1]?.[x >> 1] === "#";
  const dist = new Map(), queue = [];
  for (let x = -1; x <= W; x++) for (let z = -1; z <= H; z++) if (!inM(x, z)) { dist.set(`${x},${z}`, 0); queue.push([x, z]); }
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i], d = dist.get(`${x},${z}`);
    for (const [dx, dz] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) {
      const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
      if (nx < -1 || nz < -1 || nx > W || nz > H || dist.has(k)) continue;
      dist.set(k, d + 1); queue.push([nx, nz]);
    }
  }
  const DIRS4 = [["north", [0, -1]], ["south", [0, 1]], ["east", [1, 0]], ["west", [-1, 0]]];
  const rings = new Map();
  for (let x = 0; x < W; x++) for (let z = 0; z < H; z++) {
    if (!inM(x, z)) continue;
    const d = dist.get(`${x},${z}`);
    const toward = DIRS4.find(([, [dx, dz]]) => dist.get(`${x + dx},${z + dz}`) === d - 1);
    rings.set(`${x},${z}`, { ring: d - 1, faceDir: toward[0] });
  }
  return rings;
}

/**
 * Dusk glow behind one window: ochre_froglight at ring 3, y floor+2, centred behind the glass, and a hanging lantern at
 * ring 2, y floor+3, under a full smooth_stone block at floor+4 (a lantern needs a block above it; a bottom slab left a
 * half-block gap under any roof deck at floor+5). Lit when (n + s + stagger) % every
 * != 0; every fifth lit window (seq % 5 === 4) takes a shroomlight instead. The centre of an even-length window is its
 * lower cell. Leaves ring 2 air at floor+1..floor+2, so the room stays walkable under the lantern.
 */
export function windowLit(g, window, { every = 3, stagger = 0, over = [] } = {}) {
  const { face, cells, floor: fy, n, s } = window;
  if ((n + s + stagger) % every === 0) return [];
  const w = writer(g, over);
  const [mx, mz] = cells[Math.floor((cells.length - 1) / 2)];
  const [ix, , iz] = DIRS[OPPOSITE[face]];
  const seq = window.seq ?? n + s;
  const glow = seq % 5 === 4 ? ["shroomlight"] : B.pillar("ochre_froglight", "y");
  w.set(mx + 2 * ix, fy + 2, mz + 2 * iz, ...glow);
  const [lx, lz] = [mx + ix, mz + iz];
  const roofed = w.set(lx, fy + 4, lz, "smooth_stone") || !g.isAir(lx, fy + 4, lz);
  if (roofed) w.set(lx, fy + 3, lz, "lantern", { hanging: "true", waterlogged: "false" });
  return w.finish();
}

/**
 * Cornice along one tread, at ring 0 (proud of the wall). `course` is a full block at y (an id, or [id, state]);
 * `brackets` is a stairs family (e.g. "smooth_sandstone") with upside-down stairs at bracketsY (default y-1), every
 * `every` cells, facing into the wall; `slab` is a slab family (e.g. "smooth_sandstone") with a top slab course at slabY.
 */
export function cornice(g, tread, { y, course, brackets, bracketsY = y - 1, slab, slabY, every = 2, over = [] } = {}) {
  const w = writer(g, over), [ox, , oz] = DIRS[tread.face];
  tread.wall.forEach(([x, z], i) => {
    const [px, pz] = [x + ox, z + oz];
    if (course !== undefined) w.set(px, y, pz, ...pair(course));
    if (slab !== undefined && slabY !== undefined) w.set(px, slabY, pz, ...B.slab(slab, "top"));
    if (brackets !== undefined && i % every === 0) w.set(px, bracketsY, pz, ...B.stairs(brackets, OPPOSITE[tread.face], "top"));
  });
  return w.finish();
}

/**
 * Shopfront along one tread: glass_pane in ring 1 at y baseY+1..baseY+h; frame piers (block id `frame`) at ring 0 on
 * every `pierEvery`-th cell and on both risers (the tread's ends) over the same rows; a fascia course of `fascia` at
 * ring 0, y fasciaY (put it above baseY+h).
 */
export function shopfront(g, tread, { baseY, h, frame, pierEvery = 7, fascia, fasciaY, over = [] } = {}) {
  const w = writer(g, over), [ox, , oz] = DIRS[tread.face], top = baseY + h;
  tread.wall.forEach(([x, z], i) => {
    for (let y = baseY + 1; y <= top; y++) w.set(x, y, z, "glass_pane");
    const riser = i === 0 || i === tread.wall.length - 1;
    if (frame !== undefined && (riser || i % pierEvery === 0)) for (let y = baseY + 1; y <= top; y++) w.set(x + ox, y, z + oz, frame);
    if (fascia !== undefined && fasciaY !== undefined) w.set(x + ox, fasciaY, z + oz, fascia);
  });
  return w.finish();
}

/**
 * Juliet balcony under one window: iron_bars across the window's width at ring 0, y floor+1, plus a 2-high iron_bars
 * post just beyond each end of the window (along the wall). window.cells must be in order along the run.
 */
export function julietBalcony(g, window, { over = [] } = {}) {
  const w = writer(g, over), { face, cells, floor: fy } = window, [ox, , oz] = DIRS[face];
  const [ax, az] = face === "north" || face === "south" ? [1, 0] : [0, 1];
  for (const [x, z] of cells) w.set(x + ox, fy + 1, z + oz, "iron_bars");
  const [fx, fz] = cells[0], [lx, lz] = cells[cells.length - 1];
  for (const y of [fy + 1, fy + 2]) {
    w.set(fx + ox - ax, y, fz + oz - az, "iron_bars");
    w.set(lx + ox + ax, y, lz + oz + az, "iron_bars");
  }
  return w.finish();
}

/**
 * One terrace (plan.md PLOT 1 S5). Walls on ring k from y0 to y1 in the 5-tall ribbon (band at y0 and y0+4,
 * bricks at +1, glass_pane at +2..+3). Deck `deck` at y1+1 on the rings between k and `next` (the next terrace's ring;
 * omit for the top). A parapet block on ring k at y1+1 with an iron_bars rail above it. A planter every `planterEvery`
 * cells two rings in from the wall: four spruce trapdoors on the deck around dirt with flowering azalea on top.
 */
export function terrace(g, plot, { ring: k, next = Infinity, y0, y1, parapet = "smooth_sandstone", rail = "iron_bars", deck = "smooth_stone", planterEvery = 5, over = [] } = {}) {
  const w = writer(g, over), rings = ringOf(plot);
  const cellsOf = (pred) => [...rings].filter(([, v]) => pred(v.ring)).map(([c]) => CELL_KEY(c)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const top = y1 + 1;
  for (const [x, z] of cellsOf((r) => r === k)) {
    for (let y = y0; y <= y1; y++) {
      const step = (y - y0) % 5;
      if (step === 0 || step === 4) w.set(x, y, z, "smooth_sandstone");
      else if (step === 1) w.set(x, y, z, "bricks");
      else w.set(x, y, z, "glass_pane");
    }
    w.set(x, top, z, parapet);
    if (rail !== undefined) w.set(x, top + 1, z, rail);
  }
  for (const [x, z] of cellsOf((r) => r > k && r < next)) w.set(x, top, z, deck);
  const planters = [];
  for (const [x, z] of cellsOf((r) => r === k + 2)) {
    if (planters.every(([px, pz]) => Math.max(Math.abs(px - x), Math.abs(pz - z)) >= planterEvery)) planters.push([x, z]);
  }
  planters.forEach(([x, z]) => {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) w.set(x + dx, top + 1, z + dz, ...B.trapdoor("spruce", "north", "bottom", false));
    w.set(x, top + 1, z, "dirt");
    w.set(x, top + 2, z, "flowering_azalea_leaves", LEAF);
  });
  return w.finish();
}

/**
 * Fire escape on one tread (plan.md F6): ring-0 column x, from z0 to z1. Landings are 2 cells long, one per floor in
 * `floors` (iron_trapdoor closed half top at the landing cells). Each flight rises 1 per cell, 6 polished_blackstone_stairs
 * facing the walk-up direction, alternating ends, to the next landing; iron_bars support under each step down to its
 * flight's floor. iron_bars rail on the outer side of each landing and at its back end. ladderTo: an iron_bars drop from
 * the first landing down to that y. Direction of the first flight is +z; the tread face gives the outer side.
 */
export function fireEscape(g, tread, { x, z0, z1, floors = [8, 15, 22, 29], ladderTo, over = [] } = {}) {
  const w = writer(g, over), [ox] = DIRS[tread.face];
  const landing = (i) => (i % 2 === 0 ? [z0, z0 + 1] : [z1 - 1, z1]);
  floors.forEach((fy, i) => {
    const [a, b] = landing(i), back = i % 2 === 0 ? a - 1 : b + 1;
    for (const z of [a, b]) {
      w.set(x, fy, z, ...B.trapdoor("iron", tread.face, "top", false));
      w.set(x + ox, fy + 1, z, "iron_bars");
    }
    w.set(x, fy + 1, back, "iron_bars");
  });
  for (let i = 0; i < floors.length - 1; i++) {
    const fy = floors[i], up = i % 2 === 0, d = up ? 1 : -1, start = up ? z0 + 2 : z1 - 2;
    const facing = up ? "south" : "north";
    for (let k = 0; k < floors[i + 1] - fy - 1; k++) {
      const z = start + d * k, y = fy + 1 + k;
      w.set(x, y, z, ...B.stairs("polished_blackstone", facing, "bottom"));
      for (let yy = fy; yy < y; yy++) w.set(x, yy, z, "iron_bars");
    }
  }
  if (ladderTo !== undefined) for (let y = ladderTo; y < floors[0]; y++) w.set(x, y, landing(0)[0], "iron_bars");
  return w.finish();
}

/**
 * A filled box of `block` (x0,y0,z0 .. x1,y1,z1). Two faces (default north and east) carry an open iron_trapdoor vent at
 * the middle of the face, at mid height. pipes: two iron_bars on the box's north-west top corner.
 */
export function hvacBox(g, box, { block = "light_gray_concrete", vent = "iron_trapdoor", vents = ["north", "east"], pipes = false, over = [] } = {}) {
  const w = writer(g, over);
  const [x0, y0, z0, x1, y1, z1] = box;
  const mx = Math.floor((x0 + x1) / 2), my = Math.floor((y0 + y1) / 2), mz = Math.floor((z0 + z1) / 2);
  const at = { north: [mx, my, z0], south: [mx, my, z1], east: [x1, my, mz], west: [x0, my, mz] };
  const ventAt = new Map(vents.map((f) => [`${at[f]}`, f]));
  const mat = vent.replace(/_trapdoor$/, "");
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    const f = ventAt.get(`${[x, y, z]}`);
    if (f !== undefined) w.set(x, y, z, ...B.trapdoor(mat, f, "bottom", true));
    else w.set(x, y, z, block);
  }
  if (pipes) for (const y of [y1 + 1, y1 + 2]) w.set(x0, y, z0, "iron_bars");
  return w.finish();
}
