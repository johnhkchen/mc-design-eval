// VOCABULARY helpers 2 (plan.md): groundDown, windowCell, ledge, mast, portal, wisdomPanel, flagRow, gardenBed, paving.
// Each takes its own position (and face, where it has one) as arguments and writes only inside the footprint it is given.
// It writes only into air unless { over: true }. Refused cells are returned (placed / refused), never thrown.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const TOP = 244;                       // nothing at or above y 245 (plan: "y ≤ 245")

// A face: { side, line } as in h1. `a` is the coordinate along the face (x for north/south, z for east/west).
// Depth d is 0 on the face line and negative inward (plan: 0, -1, -2); positive is outside the wall.
function cell(face, a, y, d = 0) {
  const { side, line } = face;
  if (side === "north") return [a, y, line - d];
  if (side === "south") return [a, y, line + d];
  if (side === "east") return [line + d, y, a];
  if (side === "west") return [line - d, y, a];
  throw new Error(`face side must be north, south, east or west (got ${side})`);
}

const INWARD = { north: "south", south: "north", east: "west", west: "east" };

// glass_pane connections: panes join along the wall, east-west on north/south faces, north-south on east/west faces.
const pane = (side) => {
  const ew = side === "north" || side === "south";
  return { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew), waterlogged: "false" };
};

// Writes one block (a name, or [name, state, nbt]) at p. Into air only, unless over; refused cells are reported.
function put(g, out, [x, y, z], spec, over = false) {
  if (y > TOP || !g.inBounds(x, y, z)) { out.refused.push([x, y, z]); return; }
  const [id, state, nbt] = typeof spec === "string" ? [spec] : spec;
  if (!over && !g.isAir(x, y, z)) { out.refused.push([x, y, z]); return; }
  g.set(x, y, z, id, state, nbt);
  out.placed++;
}

const empty = () => ({ placed: 0, refused: [] });
const span = (a, b) => [Math.min(a, b), Math.max(a, b)];

// Ground surface per plan SITE: west x0..15 y0-1, x16..79 y1, x80..131 y2, x132..145 y3. The plinth starts one above it.
const groundTop = (x) => (x < 16 ? 0 : x < 80 ? 1 : x < 132 ? 2 : 3);

/** White_terracotta plinth from the ground up to topY under every column of x0..x1, z0..z1 (carried down, no gap). */
export function groundDown(g, x0, z0, x1, z1, topY, { ground = groundTop, over = false } = {}) {
  const out = empty(), [xa, xb] = span(x0, x1), [za, zb] = span(z0, z1);
  for (let x = xa; x <= xb; x++) for (let z = za; z <= zb; z++) {
    const g0 = typeof ground === "function" ? ground(x, z) : ground;
    for (let y = g0 + 1; y <= topY; y++) put(g, out, [x, y, z], "white_terracotta", over);
  }
  return out;
}

/**
 * One window on a face: the d=0 cell (face.line, along a, at y) is the recess and stays air. Glass rows at d=-1
 * (gray pane over black_concrete, or yellow pane over shroomlight when lit), a spandrel row above them.
 * glass: 2 for a tower storey (3 high), 3 for a wing storey (4 high).
 */
export function windowCell(g, face, a, y, lit, { glass = 2, over = false } = {}) {
  const out = empty();
  const glassBlock = lit ? "yellow_stained_glass_pane" : "gray_stained_glass_pane";
  for (let r = 0; r < glass; r++) {
    put(g, out, cell(face, a, y + r, -1), [glassBlock, pane(face.side)], over);
    put(g, out, cell(face, a, y + r, -2), lit ? "shroomlight" : "black_concrete", over);
  }
  put(g, out, cell(face, a, y + glass, -1), "gray_terracotta", over);
  put(g, out, cell(face, a, y + glass, -2), "white_terracotta", over);
  return out;
}

/**
 * A setback deck. box = the lower mass (its y is ignored: the deck is course topY), upper = [x0, z0, x1, z1], the wall
 * rising from it; the deck is the ring of the box beyond that wall. Deck smooth_stone at topY; the outer edge (the side
 * facing outDir) gets smooth_sandstone_stairs facing outDir at topY+1; shroomlight replaces the deck every `step`
 * cells along the upper wall's base. (Outer corners are plain stairs, not outer-corner shapes.)
 */
export function ledge(g, box, topY, outDir, step, { upper = null, over = false } = {}) {
  const out = empty(), [x0, x1] = span(box[0], box[3]), [z0, z1] = span(box[2], box[5]);
  const inUpper = (x, z) => !!upper && x >= upper[0] && x <= upper[2] && z >= upper[1] && z <= upper[3];
  const nextToUpper = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inUpper(x + dx, z + dz));
  const outer = (x, z) => (outDir === "north" ? z === z0 : outDir === "south" ? z === z1 : outDir === "west" ? x === x0 : x === x1);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (inUpper(x, z)) continue;
    const lit = nextToUpper(x, z) && (x + z) % step === 0;
    put(g, out, [x, topY, z], lit ? "shroomlight" : "smooth_stone", over);
    if (outer(x, z)) put(g, out, [x, topY + 1, z], B.stairs("smooth_sandstone", outDir, "bottom"), over);
  }
  return out;
}

/**
 * The crown mast on the 2x2 footprint whose corner is (x, z): iron_bars y0..y0+6, lightning_rod on top at y0+7.
 * pent = [x0, z0, x1, z1] (optional) is the penthouse under it: white_terracotta walls y0-4..y0-1 with a glass_pane
 * band at y0-3 (corners solid), a smooth_sandstone_slab bottom cap at y0 (not under the mast), and a lantern on each
 * cap corner. Needs the C1 deck under it (the caller's).
 */
export function mast(g, x, z, y0, { pent = null, over = false } = {}) {
  const out = empty();
  const inMast = (a, b) => a >= x && a <= x + 1 && b >= z && b <= z + 1;
  if (pent) {
    const [px0, pz0, px1, pz1] = pent, yb = y0 - 4;
    for (let px = px0; px <= px1; px++) for (let pz = pz0; pz <= pz1; pz++) {
      const edge = px === px0 || px === px1 || pz === pz0 || pz === pz1;
      const corner = (px === px0 || px === px1) && (pz === pz0 || pz === pz1);
      if (edge) for (let y = yb; y < y0; y++) {
        const band = y === yb + 1 && !corner;
        put(g, out, [px, y, pz], band ? ["glass_pane", pane(pz === pz0 || pz === pz1 ? "north" : "east")] : "white_terracotta", over);
      }
      if (!inMast(px, pz)) put(g, out, [px, y0, pz], B.slab("smooth_sandstone", "bottom"), over);
    }
    for (const [lx, lz] of [[px0, pz0], [px1, pz0], [px0, pz1], [px1, pz1]]) put(g, out, [lx, y0 + 1, lz], B.lantern(false), over);
  }
  for (let by = y0; by <= y0 + 6; by++) for (let bx = x; bx <= x + 1; bx++) for (let bz = z; bz <= z + 1; bz++)
    put(g, out, [bx, by, bz], ["iron_bars", { north: String(bz === z + 1), south: String(bz === z), east: String(bx === x), west: String(bx === x + 1), waterlogged: "false" }], over);
  put(g, out, [x, y0 + 7, z], ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }], over);
  return out;
}

/**
 * An opening width x height on a face, centred on along-face coordinate a, bottom row y0 (the plane cells, depth 0).
 * polished_blackstone jambs, an upside-down polished_blackstone_stairs lintel on the top row, glass_pane doors inside,
 * and a shroomlight one cell behind the middle (the lit lobby). Footprint includes that one inner cell.
 */
export function portal(g, face, a, y0, width, height, { over = false } = {}) {
  const out = empty(), lo = a - Math.floor((width - 1) / 2), hi = lo + width - 1;
  for (let u = lo; u <= hi; u++) for (let dy = 0; dy < height; dy++) {
    const y = y0 + dy, p = cell(face, u, y);
    if (u === lo || u === hi) put(g, out, p, "polished_blackstone", over);
    else if (dy === height - 1) put(g, out, p, B.stairs("polished_blackstone", INWARD[face.side], "top"), over);
    else put(g, out, p, ["glass_pane", pane(face.side)], over);
  }
  put(g, out, cell(face, a, y0 + 1, -1), "shroomlight", over);
  return out;
}

// WISDOM relief in panel cells (a 0..15 along the face, b 0..10 up): the rays meet at (7.5, 5).
function relief(a, b) {
  const du = a - 7.5, dv = b - 5;
  if (a === 0 || a === 15 || b === 10) return "gold_block";                              // crown rim
  if ((a === 7 || a === 8) && (b === 7 || b === 8)) return "smooth_quartz";              // figure: head
  if (a >= 6 && a <= 8 && b >= 1 && b <= 5) return "smooth_quartz";                      // figure: torso
  if (a - 10 === b - 2 && a >= 10 && a <= 14) return "gold_block";                       // dividers, 5 long
  if (b > 5 && (a === 7 || a === 8)) return "gold_block";                                // vertical ray
  if (b >= 6 && b <= 9 && Math.abs(Math.abs(du) - dv) <= 0.5) return "gold_block";       // diagonal rays
  if (b <= 3 && (a <= 3 || a >= 12)) return b === 0 ? "cyan_terracotta" : "light_blue_terracotta"; // clouds
  return null;
}

/**
 * The 16 x 11 WISDOM panel: yellow_terracotta background on the face line (a0..a0+15, y0..y0+10), the gold, quartz
 * and terracotta relief one cell outside it. An approximation of the plan's motif (rays, clouds, figure, dividers, rim).
 */
export function wisdomPanel(g, face, a0, y0, { over = false } = {}) {
  const out = empty();
  for (let a = 0; a <= 15; a++) for (let b = 0; b <= 10; b++) {
    put(g, out, cell(face, a0 + a, y0 + b, 0), "yellow_terracotta", over);
    const r = relief(a, b);
    if (r) put(g, out, cell(face, a0 + a, y0 + b, 1), r, over);
  }
  return out;
}

const FLAGS = ["white", "blue", "red", "yellow", "green"];

/**
 * Five wall banners in colour order, 2 apart along the face, centred on along-face coordinate a, at y. Each hangs
 * on the face line (depth 0) from one cell outside it (depth 1 by default), facing out.
 */
export function flagRow(g, face, a, y, { depth = 1, over = false } = {}) {
  const out = empty();
  FLAGS.forEach((colour, i) => put(g, out, cell(face, a + (i - 2) * 2, y, depth), B.banner(colour, [], { wall: true, facing: face.side }), over));
  return out;
}

/**
 * A roof bed on rect = [x0, z0, x1, z1] with its base at y: grass_block with moss patches; a 1-high oak_leaves hedge
 * (persistent) on the border; a 2-wide smooth_stone path across the middle (open to the hedge at both ends); flowering
 * azalea 1 in 5 inside; a polished_blackstone_wall post beside the path with a lantern on top. The path lane stays
 * clear 2 high. Needs at least 4 cells in z for the path and post.
 */
export function gardenBed(g, rect, y, { over = false } = {}) {
  const out = empty(), [x0, x1] = span(rect[0], rect[2]), [z0, z1] = span(rect[1], rect[3]);
  const zc = z0 + Math.floor((z1 - z0) / 2), postX = x0 + 1, postZ = zc - 1;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (z === zc || z === zc + 1) { put(g, out, [x, y, z], "smooth_stone", over); continue; }
    put(g, out, [x, y, z], !edge && (x + z) % 5 === 0 ? "moss_block" : "grass_block", over);
    if (edge) put(g, out, [x, y + 1, z], ["oak_leaves", { persistent: "true" }], over);
    else if (x === postX && z === postZ) {
      put(g, out, [x, y + 1, z], ["polished_blackstone_wall", { up: "true" }], over);
      put(g, out, [x, y + 2, z], B.lantern(false), over);
    } else if ((3 * (x - x0) + 2 * (z - z0)) % 5 === 0) put(g, out, [x, y + 1, z], "flowering_azalea", over);
  }
  return out;
}

/** Chequer of smooth_stone and polished_andesite on rect = [x0, z0, x1, z1] at level y (the caller's ground line). */
export function paving(g, rect, y, { over = false } = {}) {
  const out = empty(), [x0, x1] = span(rect[0], rect[2]), [z0, z1] = span(rect[1], rect[3]);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
    put(g, out, [x, y, z], (x + z) % 2 === 0 ? "smooth_stone" : "polished_andesite", over);
  return out;
}
