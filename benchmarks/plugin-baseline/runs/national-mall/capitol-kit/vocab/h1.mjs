// Vocabulary part 1 (plan.md VOCABULARY): podium, portico, archOpening, bronzeDoor, disc, peristyle, ribs, lanternRow.
// Each helper takes the grid first, then its position as arguments. It writes only inside the footprint it was given,
// only into air (or into the `over` ids a caller names), and returns { placed, refused } instead of throwing.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Palette ids (plan.md PALETTE, checked 1.21.1-valid).
const QUARTZ_BRICKS = "quartz_bricks";
const SMOOTH_QUARTZ = "smooth_quartz";
const SMOOTH_STONE = "smooth_stone";
const QUARTZ_PILLAR = "quartz_pillar";
const CALCITE = "calcite";
const PANE = "gray_stained_glass_pane";
const GLOWSTONE = "glowstone";
const SHROOMLIGHT = "shroomlight";
const POLISHED_DIORITE = "polished_diorite";
const NAMES = ["north", "south", "west", "east"];

const bare = (id) => id.replace(/^minecraft:/, "");

// Writes for one footprint box {x0,x1,y0,y1,z0,z1}. A write is refused (and listed) if it is outside the box, outside
// the grid, or lands on a block that is neither air nor named in `over`.
function writer(g, box, over = []) {
  const res = { placed: 0, refused: [] };
  const refuse = (x, y, z, block, why) => res.refused.push([x, y, z, block, why]);
  const put = (x, y, z, block, state) => {
    if (x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1 || z < box.z0 || z > box.z1) return refuse(x, y, z, block, "outside footprint");
    if (!g.inBounds(x, y, z)) return refuse(x, y, z, block, "outside grid");
    if (!g.isAir(x, y, z) && !over.includes(bare(g.blockAt(x, y, z)))) return refuse(x, y, z, block, `occupied by ${bare(g.blockAt(x, y, z))}`);
    g.set(x, y, z, block, state);
    res.placed++;
  };
  return { res, put, refuse };
}

// A glass pane joins each side whose neighbour is not air (glass meets wall, pane or lamp). Run after the neighbours.
function paneStates(g, cells) {
  for (const [x, y, z] of cells) {
    if (bare(g.blockAt(x, y, z)) !== PANE) continue;
    const side = (dx, dz) => (g.isAir(x + dx, y, z + dz) ? "false" : "true");
    g.set(x, y, z, PANE, { north: side(0, -1), east: side(1, 0), south: side(0, 1), west: side(-1, 0) });
  }
}

// A standing lantern needs a full top face: a block that is not air, a top slab, or top stairs. Never a bottom slab.
function standable(g, x, y, z) {
  if (g.isAir(x, y, z)) return false;
  const c = g.get(x, y, z);
  const id = bare(c.block), s = c.state ?? {};
  if (/_slab$/.test(id)) return s.type !== "bottom";
  if (/_stairs$/.test(id)) return s.half === "top";
  return true;
}

// The plan's round course: cells x cx-d/2..cx+d/2-1 (same in z), kept where the cell centre is within d/2 of the axis.
const kept = (cx, cz, d) => {
  const cells = [];
  for (let x = cx - d / 2; x < cx + d / 2; x++) for (let z = cz - d / 2; z < cz + d / 2; z++) if ((x + 0.5 - cx) ** 2 + (z + 0.5 - cz) ** 2 <= (d / 2) ** 2) cells.push([x, z]);
  return cells;
};
const keySet = (cells) => new Set(cells.map(([x, z]) => `${x},${z}`));

// The outer ring of a round course (kept cells with a non-kept 4-neighbour), in angle order so "every other" runs round it.
function ringOf(cx, cz, d) {
  const inside = keySet(kept(cx, cz, d));
  const ring = kept(cx, cz, d).filter(([x, z]) => NAMES.some((n) => !inside.has(`${x + DIRS[n][0]},${z + DIRS[n][2]}`)));
  return ring.sort(([ax, az], [bx, bz]) => Math.atan2(az + 0.5 - cz, ax + 0.5 - cx) - Math.atan2(bz + 0.5 - cz, bx + 0.5 - cx));
}

// The side of a ring cell that faces out of its disc: the non-kept neighbour best aligned with the radius.
function outwardOf(inside, x, z, cx, cz) {
  const rx = x + 0.5 - cx, rz = z + 0.5 - cz;
  const open = NAMES.filter((n) => !inside.has(`${x + DIRS[n][0]},${z + DIRS[n][2]}`));
  const dot = (n) => DIRS[n][0] * rx + DIRS[n][2] * rz;
  return (open.length ? open : NAMES).reduce((a, b) => (dot(b) > dot(a) ? b : a));
}

const PANE_OFF = { north: "false", east: "false", south: "false", west: "false" };

/**
 * podium(g, {x0,x1,z0,z1}, { ground, top = 4 }): the rusticated podium. Per column, quartz_bricks from the ground course
 * up to `top`; the top course is a top slab where the cell above is free (the cornice), else brick.
 * ground: a course, or (x, z) => course (the plan's GROUND map, supplied by the caller).
 */
export function podium(g, box, { ground, top = 4 } = {}) {
  if (ground === undefined) throw new Error("podium: pass ground (a course, or (x, z) => course)");
  const G = typeof ground === "function" ? ground : () => ground;
  let lo = Infinity;
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) lo = Math.min(lo, G(x, z));
  const w = writer(g, { x0: box.x0, x1: box.x1, y0: lo, y1: top, z0: box.z0, z1: box.z1 });
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    const from = G(x, z);
    if (from > top) continue;
    for (let y = from; y < top; y++) w.put(x, y, z, QUARTZ_BRICKS);
    if (g.isAir(x, top + 1, z)) w.put(x, top, z, ...B.slab(SMOOTH_QUARTZ, "top"));
    else w.put(x, top, z, QUARTZ_BRICKS);
  }
  return w.res;
}

/**
 * portico(g, { columns: [{x, zs}], floorX, span: {z0,z1}, pediment, floor = 5, top = 10, entablature = 11 }): one or
 * more rows of quartz_pillar columns (axis y, floor..top), the portico floor (bottom slab at `floor` on the floorX
 * cells), and the smooth_quartz entablature at `entablature` over the whole footprint. pediment: {x0,x1,z0,z1}, the
 * pediment's footprint, which the entablature runs under; its rising courses belong to the pediment helper.
 */
export function portico(g, { columns, floorX = [], span, pediment = null, floor = 5, top = 10, entablature = 11 }) {
  const xs = [...columns.map((c) => c.x), ...floorX];
  const zs = [span.z0, span.z1];
  if (pediment) xs.push(pediment.x0, pediment.x1), zs.push(pediment.z0, pediment.z1);
  const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: floor, y1: entablature, z0: Math.min(...zs), z1: Math.max(...zs) };
  const w = writer(g, box);
  for (const { x, zs: rowZs } of columns) for (const z of rowZs) for (let y = floor; y <= top; y++) w.put(x, y, z, ...B.pillar(QUARTZ_PILLAR, "y"));
  for (const x of floorX) for (let z = span.z0; z <= span.z1; z++) w.put(x, floor, z, ...B.slab(SMOOTH_STONE, "bottom"));
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) w.put(x, entablature, z, SMOOTH_QUARTZ);
  return w.res;
}

/**
 * archOpening(g, { x, z, y0, y1, face }): a 1-deep arched recess on the wall face `face` (north, south, east or west:
 * the outward side). The outer cell (x, z) must already be air for y0..y1 (the shell leaves it). A glass pane sits one
 * cell in, a shroomlight two in, and an upside-down smooth_quartz_stairs head at y1+1 is backed into the wall, so its
 * lip reads outward. The head cell must be air too.
 */
export function archOpening(g, { x, z, y0, y1, face }) {
  if (!DIRS[face]) throw new Error(`archOpening: face ${face}`);
  const [ix, , iz] = DIRS[OPPOSITE[face]];
  const xs = [x, x + 2 * ix], zs = [z, z + 2 * iz];
  const w = writer(g, { x0: Math.min(...xs), x1: Math.max(...xs), y0, y1: y1 + 1, z0: Math.min(...zs), z1: Math.max(...zs) });
  const panes = [];
  for (let y = y0; y <= y1; y++) {
    if (!g.isAir(x, y, z)) w.refuse(x, y, z, null, "recess cell not air");
    w.put(x + ix, y, z + iz, PANE, PANE_OFF); panes.push([x + ix, y, z + iz]);
    w.put(x + 2 * ix, y, z + 2 * iz, SHROOMLIGHT);
  }
  if (!g.isAir(x, y1 + 1, z)) w.refuse(x, y1 + 1, z, null, "arch head cell not air");
  w.put(x, y1 + 1, z, ...B.stairs(SMOOTH_QUARTZ, OPPOSITE[face], "top"));
  paneStates(g, panes);
  return w.res;
}

/**
 * bronzeDoor(g, { x, z, face, w = 1, y0 = 5, wood = "dark_oak" }): a door on the wall face `face`, facing out, both
 * halves written, with a glass transom above each leaf at y0+2. w = 2 is a double door: the second leaf is the next
 * cell along the wall, hinges mirrored.
 */
export function bronzeDoor(g, { x, z, face, w = 1, y0 = 5, wood = "dark_oak" }) {
  if (!DIRS[face]) throw new Error(`bronzeDoor: face ${face}`);
  const along = face === "west" || face === "east" ? [0, 0, 1] : [1, 0, 0];
  const cells = Array.from({ length: w }, (_, i) => [x + i * along[0], z + i * along[2]]);
  const xs = cells.map(([cx]) => cx), zs = cells.map(([, cz]) => cz);
  const wr = writer(g, { x0: Math.min(...xs), x1: Math.max(...xs), y0, y1: y0 + 2, z0: Math.min(...zs), z1: Math.max(...zs) });
  const panes = [];
  cells.forEach(([cx, cz], i) => {
    const hinge = i === 0 ? "left" : "right";
    wr.put(cx, y0, cz, ...B.door(wood, face, "lower", hinge));
    wr.put(cx, y0 + 1, cz, ...B.door(wood, face, "upper", hinge));
    wr.put(cx, y0 + 2, cz, PANE, PANE_OFF); panes.push([cx, y0 + 2, cz]);
  });
  paneStates(g, panes);
  return wr.res;
}

/** disc(g, { cx, cz, d, y, block, state }): fills the kept cells of the d disc at course y with `block`. */
export function disc(g, { cx, cz, d, y, block, state }) {
  const w = writer(g, { x0: cx - d / 2, x1: cx + d / 2 - 1, y0: y, y1: y, z0: cz - d / 2, z1: cz + d / 2 - 1 });
  for (const [x, z] of kept(cx, cz, d)) w.put(x, y, z, block, state);
  return w.res;
}

/**
 * peristyle(g, { cx, cz, colD = 16, drumD = 12, y0 = 15, y1 = 20, winY0 = 16, winY1 = 19 }): the dome's peristyle, built
 * on the base's top course (the cells at y0-1 must be standable). A calcite drum wall on the drumD ring (y0..y1); on
 * every second ring cell a glass pane window at winY0..winY1 with glowstone one cell inside it. quartz_pillar columns
 * on every other cell of the colD ring. A standing lantern on the floor ring one cell inside every 4th column.
 */
export function peristyle(g, { cx, cz, colD = 16, drumD = 12, y0 = 15, y1 = 20, winY0 = 16, winY1 = 19 }) {
  const half = colD / 2;
  const w = writer(g, { x0: cx - half, x1: cx + half - 1, y0, y1, z0: cz - half, z1: cz + half - 1 });
  const drumIn = keySet(kept(cx, cz, drumD));
  const panes = [];
  ringOf(cx, cz, drumD).forEach(([x, z], i) => {
    const [dx, , dz] = DIRS[OPPOSITE[outwardOf(drumIn, x, z, cx, cz)]];
    for (let y = y0; y <= y1; y++) {
      if (i % 2 === 0 && y >= winY0 && y <= winY1) {
        w.put(x, y, z, PANE, PANE_OFF); panes.push([x, y, z]);
        w.put(x + dx, y, z + dz, GLOWSTONE);
      } else w.put(x, y, z, CALCITE);
    }
  });
  const cols = ringOf(cx, cz, colD).filter((_, i) => i % 2 === 0);
  for (const [x, z] of cols) for (let y = y0; y <= y1; y++) w.put(x, y, z, ...B.pillar(QUARTZ_PILLAR, "y"));
  const colIn = keySet(kept(cx, cz, colD));
  cols.filter((_, i) => i % 4 === 0).forEach(([x, z]) => {
    const [dx, , dz] = DIRS[OPPOSITE[outwardOf(colIn, x, z, cx, cz)]];
    const lx = x + dx, lz = z + dz;
    if (!standable(g, lx, y0 - 1, lz)) return w.refuse(lx, y0, lz, null, "nothing to stand on");
    w.put(lx, y0, lz, ...B.lantern(false));
  });
  paneStates(g, panes);
  return w.res;
}

/**
 * ribs(g, { cx, cz, courses, over = [] }): the eight dome ribs. courses: [{y, d}] bottom to top, each the d disc at
 * course y. A rib cell is on the lines |x+.5-cx| = .5, |z+.5-cz| = .5 or the diagonals |dx| = |dz|. A rib cell that the
 * next course steps in from is upright polished_diorite_stairs facing out; the rest are polished_diorite.
 * The rib cells are the shell's own cells, so the caller passes the shell's blocks in `over` (or runs ribs first).
 */
export function ribs(g, { cx, cz, courses, over = [] }) {
  const maxD = Math.max(...courses.map((c) => c.d));
  const w = writer(g, {
    x0: cx - maxD / 2, x1: cx + maxD / 2 - 1, y0: courses[0].y, y1: courses[courses.length - 1].y,
    z0: cz - maxD / 2, z1: cz + maxD / 2 - 1,
  }, over);
  courses.forEach((c, i) => {
    const next = courses[i + 1];
    const inside = keySet(kept(cx, cz, c.d));
    const nextInside = next ? keySet(kept(cx, cz, next.d)) : new Set();
    for (const [x, z] of kept(cx, cz, c.d)) {
      const rx = Math.abs(x + 0.5 - cx), rz = Math.abs(z + 0.5 - cz);
      if (rx !== 0.5 && rz !== 0.5 && rx !== rz) continue;
      if (next && !nextInside.has(`${x},${z}`)) w.put(x, c.y, z, ...B.stairs(POLISHED_DIORITE, outwardOf(inside, x, z, cx, cz), "bottom"));
      else w.put(x, c.y, z, POLISHED_DIORITE);
    }
  });
  return w.res;
}

/**
 * lanternRow(g, { line: {x0,x1,z0,z1}, y, every = 1, hanging = true }): lanterns along a one-cell-wide line at course y,
 * every `every`-th cell from its start. Hanging ones need a block above them; standing ones need a full top face
 * below (never a bottom slab).
 */
export function lanternRow(g, { line, y, every = 1, hanging = true }) {
  const alongX = line.x1 > line.x0;
  const n = alongX ? line.x1 - line.x0 + 1 : line.z1 - line.z0 + 1;
  const w = writer(g, { x0: line.x0, x1: line.x1, y0: y, y1: y, z0: line.z0, z1: line.z1 });
  for (let i = 0; i < n; i += every) {
    const x = alongX ? line.x0 + i : line.x0, z = alongX ? line.z0 : line.z0 + i;
    if (hanging && g.isAir(x, y + 1, z)) { w.refuse(x, y, z, null, "nothing above to hang from"); continue; }
    if (!hanging && !standable(g, x, y - 1, z)) { w.refuse(x, y, z, null, "no full top face below"); continue; }
    w.put(x, y, z, ...B.lantern(hanging));
  }
  return w.res;
}
