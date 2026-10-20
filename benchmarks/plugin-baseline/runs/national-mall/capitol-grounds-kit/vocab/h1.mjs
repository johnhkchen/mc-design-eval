// Helpers from plan.md VOCABULARY (group h1). Each takes its position as arguments and writes only inside the
// footprint it is given (inclusive box [x0, y0, z0, x1, y1, z1] or a region). Writes are refused, never thrown:
//   - default: only into air (a worker's write never lands on ground, sand, floor or another part's block);
//   - top: air or the ground surface block (grass, dirt, stone...) at the cell's own height H, to lay a walk,
//     paving or wall surface over the grass the ground part put there;
//   - own: anything inside the footprint, for the ground-owning helper (groundColumn) and the buried glowstone.
// Every helper returns { placed, refused }, refused being the [x, y, z] cells it did not write, so the caller
// can report them.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SURFACE = new Set(["grass_block", "dirt", "stone", "podzol", "rooted_dirt", "moss_block", "smooth_stone", "dirt_path"]);
const bare = (id) => id.replace(/^minecraft:/, "");
const FOLIAGE = (id) => /leaves$/.test(bare(id)) || bare(id) === "moss_block";

function writer(g, box) {
  const w = { placed: 0, refused: [] };
  const put = (x, y, z, ok, block, state) => {
    const inBox = x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
    if (!(inBox && g.inBounds(x, y, z) && ok(x, y, z))) { w.refused.push([x, y, z]); return false; }
    g.set(x, y, z, block, state);
    w.placed++;
    return true;
  };
  w.air = (x, y, z, block, state) => put(x, y, z, (a, b, c) => g.isAir(a, b, c), block, state);
  w.top = (x, y, z, block, state) => put(x, y, z, (a, b, c) => g.isAir(a, b, c) || SURFACE.has(bare(g.blockAt(a, b, c))), block, state);
  w.own = (x, y, z, block, state) => put(x, y, z, () => true, block, state);
  w.result = () => ({ placed: w.placed, refused: w.refused });
  return w;
}

/** Ground column: stone y1..H-4, three dirt courses, the surface block at H. Writes the whole column, never above H. */
export function groundColumn(g, x, z, H, surface = "grass_block") {
  const w = writer(g, [x, 1, z, x, H, z]);
  for (let y = 1; y <= H; y++) {
    if (y === H) w.own(x, y, z, surface);
    else w.own(x, y, z, y >= H - 3 ? "dirt" : "stone");
  }
  return w.result();
}

/** Union Square paving at y over the box x0..x1, z0..z1: smooth_stone, with polished_andesite bands every 6 cells. */
export function plazaPaving(g, x0, z0, x1, z1, y = 3) {
  const w = writer(g, [x0, y, z0, x1, y, z1]);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const band = (x - x0) % 6 === 0 || (z - z0) % 6 === 0;
    w.top(x, y, z, band ? "polished_andesite" : "smooth_stone");
  }
  return w.result();
}

// Catmull-Rom through the plan points, sampled about every half cell.
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return [0, 1].map((i) => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3));
}
function samples(pts) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    const n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 0.5));
    for (let k = 0; k < n; k++) out.push(catmull(p0, p1, p2, p3, k / n));
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Walk along a curve. points: [[x, z], ...]; heightAt(x, z) = the mapped ground H; region = [x0, z0, x1, z1] bounds the
 * walk. width 3 stamps a 3x3 square at every sample. Surface smooth_sandstone at H; a cell that is one block higher than
 * the cell before it along the run gets a bottom smooth_sandstone_slab at H on a column filled to H-1 (slabStep).
 */
export function curvedWalk(g, points, heightAt, region, width = 3) {
  const [x0, z0, x1, z1] = region;
  const w = writer(g, [x0, 0, z0, x1, g.size[1] - 1, z1]);
  const r = Math.floor(width / 2), reach = r * r + r;
  const done = new Set();
  let prevH = null;
  for (const [sx, sz] of samples(points)) {
    const cx = Math.round(sx), cz = Math.round(sz);
    const H0 = Math.round(heightAt(cx, cz));
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (dx * dx + dz * dz > reach) continue;
      const x = cx + dx, z = cz + dz, key = `${x},${z}`;
      if (done.has(key)) continue;
      done.add(key);
      const H = Math.round(heightAt(x, z));
      if (H < 1) continue;
      const rise = prevH !== null && H - prevH === 1;
      if (rise) {
        if (g.isAir(x, H - 1, z)) w.air(x, H - 1, z, "smooth_sandstone");
        w.top(x, H, z, ...B.slab("smooth_sandstone", "bottom"));
      } else {
        w.top(x, H, z, "smooth_sandstone");
      }
    }
    prevH = H0;
  }
  return w.result();
}

/**
 * Marble terrace face. faceX: the wall line (the proud column is faceX-1); the body runs east to x1 and fills from the
 * mapped H up to topY-1, with a smooth_quartz paving at topY. Plinth: polished_diorite at H on the proud column;
 * cornice: smooth_quartz_slab top at topY on it. gaps: [[z0, z1], ...] rows where the terrace body and the face stop
 * (stair flights): only the paving stays. holes: [[z0, z1, y0, y1], ...] face cells left open (a niche) at faceX.
 */
export function marbleTier(g, heightAt, faceX, z0, z1, x1, topY, { gaps = [], holes = [] } = {}) {
  const w = writer(g, [faceX - 1, 0, z0, x1, topY, z1]);
  for (let z = z0; z <= z1; z++) {
    const gap = gaps.some(([a, b]) => z >= a && z <= b);
    for (let x = faceX - 1; x <= x1; x++) {
      const H = Math.round(heightAt(x, z));
      if (x === faceX - 1) {
        if (gap) continue;
        if (H < topY) w.top(x, H, z, "polished_diorite");
        w.air(x, topY, z, ...B.slab("smooth_quartz", "top"));
        continue;
      }
      if (gap) { w.top(x, topY, z, "smooth_quartz"); continue; }
      for (let y = H; y < topY; y++) {
        if (holes.some(([a, b, y0, y1]) => z >= a && z <= b && x === faceX && y >= y0 && y <= y1)) continue;
        if (y === H) w.top(x, y, z, "smooth_quartz");
        else w.air(x, y, z, "smooth_quartz");
      }
      w.top(x, topY, z, "smooth_quartz");
    }
  }
  return w.result();
}

/** Urn on a pier: quartz_pillar at y, decorated_pot at y+1. */
export function urnPier(g, x, y, z) {
  const w = writer(g, [x, y, z, x, y + 1, z]);
  w.air(x, y, z, "quartz_pillar", { axis: "y" });
  w.air(x, y + 1, z, "decorated_pot");
  return w.result();
}

/**
 * Grotto niche in the terrace face: the front cells at x = faceX, z zA..zB, y yLo..yHi are left as air (recess by
 * exclusion); quartz pillars on both sides, a smooth_quartz_stairs lintel (top, facing west) at yHi+1, and a
 * smooth_quartz back wall at faceX+1.
 */
export function grottoNiche(g, faceX, zA, zB, yLo, yHi) {
  const w = writer(g, [faceX, yLo, zA - 1, faceX + 1, yHi + 1, zB + 1]);
  for (let y = yLo; y <= yHi; y++) {
    w.air(faceX, y, zA - 1, "quartz_pillar", { axis: "y" });
    w.air(faceX, y, zB + 1, "quartz_pillar", { axis: "y" });
    for (let z = zA; z <= zB; z++) w.air(faceX + 1, y, z, "smooth_quartz");
  }
  for (let z = zA; z <= zB; z++) w.air(faceX, yHi + 1, z, ...B.stairs("smooth_quartz", "west", "top"));
  return w.result();
}

/**
 * Bronze horseman on a pedestal top at baseY. Centre (cx, cz); facing "west" puts the head at x = cx-1 and the tail at
 * x = cx+1 (east). Legs: polished_blackstone_wall at the four corners; body: polished_blackstone row with bottom slabs
 * on the sides; head: stairs facing `facing` at y+2; rider at y+2 with a wall head at y+3 and a slab hat at y+4.
 */
export function bronzeHorseman(g, cx, baseY, cz, facing = "west") {
  const d = facing === "east" ? 1 : -1;
  const headX = cx + d, tailX = cx - d;
  const w = writer(g, [cx - 1, baseY, cz - 1, cx + 1, baseY + 4, cz + 1]);
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) w.air(cx + dx, baseY, cz + dz, "polished_blackstone_wall", { up: "true" });
  for (let x = cx - 1; x <= cx + 1; x++) {
    if (x === tailX) w.air(x, baseY + 1, cz, "polished_blackstone_wall", { up: "true" });
    else w.air(x, baseY + 1, cz, "polished_blackstone");
    for (const dz of [-1, 1]) w.air(x, baseY + 1, cz + dz, ...B.slab("polished_blackstone", "bottom"));
  }
  w.air(headX, baseY + 2, cz, ...B.stairs("polished_blackstone", facing, "bottom"));
  w.air(cx, baseY + 2, cz, "polished_blackstone");
  w.air(cx, baseY + 3, cz, "polished_blackstone_wall", { up: "true" });
  w.air(cx, baseY + 4, cz, ...B.slab("polished_blackstone", "bottom"));
  return w.result();
}

/**
 * Artillery group on a white base at baseY, footprint x0..x0+4, z0..z0+4: a two-horse team (stair heads facing west) on
 * the two north rows, a limber with wall wheels on the third, and a gun barrel (walls lying along x) on the fourth row
 * with a stair breech at its west end.
 */
export function artilleryGroup(g, x0, baseY, z0) {
  const w = writer(g, [x0, baseY, z0, x0 + 4, baseY + 1, z0 + 4]);
  for (let dx = 0; dx <= 4; dx++) for (let dz = 0; dz <= 4; dz++) w.air(x0 + dx, baseY, z0 + dz, "smooth_quartz");
  for (const dz of [0, 1]) {
    w.air(x0, baseY + 1, z0 + dz, ...B.stairs("polished_blackstone", "west", "bottom"));
    for (let dx = 1; dx <= 3; dx++) w.air(x0 + dx, baseY + 1, z0 + dz, "polished_blackstone");
  }
  w.air(x0 + 2, baseY + 1, z0 + 2, "polished_blackstone");
  w.air(x0 + 1, baseY + 1, z0 + 2, "polished_blackstone_wall", { up: "true" });
  w.air(x0 + 3, baseY + 1, z0 + 2, "polished_blackstone_wall", { up: "true" });
  for (let dx = 1; dx <= 3; dx++) w.air(x0 + dx, baseY + 1, z0 + 3, "polished_blackstone_wall", { up: "true", east: "low", west: "low" });
  w.air(x0, baseY + 1, z0 + 3, ...B.stairs("polished_blackstone", "east", "bottom"));
  return w.result();
}

/**
 * Hidden light. "shroomlight": at (x, y, z), into air or a leaf, only where at least 4 of its 6 neighbours are foliage
 * (inside a crown or a hedge). "glowstone": under a slab or block, so the cell above must be solid; it may replace
 * a solid cell only with buried: true (the platform's rim lights).
 */
export function floodlight(g, x, y, z, kind = "shroomlight", { buried = false } = {}) {
  const w = writer(g, [x, y, z, x, y, z]);
  if (kind === "glowstone") {
    if (g.isAir(x, y + 1, z)) { w.refused.push([x, y, z]); return w.result(); }
    if (buried) w.own(x, y, z, "glowstone");
    else w.air(x, y, z, "glowstone");
    return w.result();
  }
  const around = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const cover = around.filter(([dx, dy, dz]) => FOLIAGE(g.blockAt(x + dx, y + dy, z + dz))).length;
  if (cover < 4) { w.refused.push([x, y, z]); return w.result(); }
  const free = g.isAir(x, y, z) || /leaves$/.test(bare(g.blockAt(x, y, z)));
  if (free) w.own(x, y, z, "shroomlight");
  else w.refused.push([x, y, z]);
  return w.result();
}
