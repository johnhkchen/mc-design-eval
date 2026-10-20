// Vocabulary helpers from plan.md (VOCABULARY): pathRibbon, moundLawn, portalFace, stationRoof, boulder, pine,
// picnicTable, wallLantern. Each takes the grid first, then its position and size, and returns { placed, refused }.
// Writes stay in the helper's own footprint and follow one rule:
//   - air is free;
//   - a ground-surface block (grass, dirt, paving, gravel...) is replaced only at the helper's own surface y
//     (surfaceAt), or anywhere inside a volume the helper owns when it passes { over: true };
//   - nothing is written below the helper's surface, so the stone and dirt the ground part laid stay put.
// Refused writes are listed as [x, y, z, block, why], never thrown.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { writeFileSync } from "node:fs";

const GROUND = new Set(["grass_block", "dirt", "coarse_dirt", "rooted_dirt", "podzol", "gravel", "clay", "stone", "smooth_sandstone", "moss_block"]);
const bare = (id) => id.replace(/^minecraft:/, "");
const LEAF = (block) => [block, { persistent: "true", distance: "1", waterlogged: "false" }];
const ring = (r) => Math.ceil(r) + 1;

/** One write. pair = [block, state] from B.* or B.block(name). o = { surfaceAt, over, out }. */
function put(g, o, x, y, z, pair) {
  const [block, state] = pair;
  if (!g.inBounds(x, y, z)) return refuse(o, x, y, z, block, "out of bounds");
  const onSurface = o.surfaceAt?.(x, z) === y && GROUND.has(bare(g.blockAt(x, y, z)));
  if (!g.isAir(x, y, z) && !onSurface && !o.over) return refuse(o, x, y, z, block, `not air (${bare(g.blockAt(x, y, z))})`);
  g.set(x, y, z, block, state);
  o.out.placed++;
  return true;
}
function refuse(o, x, y, z, block, why) { o.out.refused.push([x, y, z, block, why]); return false; }
const result = () => ({ placed: 0, refused: [] });

/** Uniform Catmull-Rom through the waypoints [[x, z], ...], one sample every `step` blocks. */
function spline(points, step) {
  const P = [points[0], ...points, points[points.length - 1]], out = [];
  const at = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      out.push([0, 1].map((j) => at(p0[j], p1[j], p2[j], p3[j], t)));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * A pale decomposed-granite path: Catmull-Rom through `points`, `width` wide, smooth_sandstone on the surface at
 * heightAt(x, z). Where the surface rises by 1 to the next cell along the path, the lower cell gets a bottom
 * smooth_sandstone_slab on top (a half step). The 3-step / 2-long-landing rule is the height map's job; `steep`
 * counts rises bigger than 1, which the caller should fix in the map.
 */
export function pathRibbon(g, points, width, step = 0.5, { heightAt } = {}) {
  const out = { ...result(), steep: 0 }, o = { surfaceAt: heightAt, out };
  const cells = new Map();                       // "x,z" -> { x, z, i }: the first path sample that covers the cell
  spline(points, step).forEach(([sx, sz], i) => {
    for (let x = Math.floor(sx - width / 2) - 1; x <= Math.ceil(sx + width / 2); x++)
      for (let z = Math.floor(sz - width / 2) - 1; z <= Math.ceil(sz + width / 2); z++)
        if (Math.hypot(x + 0.5 - sx, z + 0.5 - sz) <= width / 2 && !cells.has(`${x},${z}`)) cells.set(`${x},${z}`, { x, z, i });
  });
  const halfStep = new Set();
  for (const c of cells.values()) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const d = cells.get(`${c.x + dx},${c.z + dz}`);
    if (!d || d.i <= c.i) continue;             // only a rise ahead of the walker
    const rise = heightAt(d.x, d.z) - heightAt(c.x, c.z);
    if (rise === 1) halfStep.add(`${c.x},${c.z}`);
    else if (rise > 1) out.steep++;
  }
  for (const c of cells.values()) put(g, o, c.x, heightAt(c.x, c.z), c.z, B.block("smooth_sandstone"));
  for (const k of halfStep) { const c = cells.get(k), h = heightAt(c.x, c.z); put(g, o, c.x, h + 1, c.z, B.slab("smooth_sandstone", "bottom")); }
  return out;
}

/**
 * Grass mound on a lawn: grass_block disc of radius rLawn at surface y, a crown of grass one block higher inside
 * rCrown, and a mossy_cobblestone_slab ring on the lawn cells just outside the crown (the edging).
 */
export function moundLawn(g, cx, cz, rLawn, rCrown, y) {
  const out = result(), o = { surfaceAt: () => y, out };
  for (let x = cx - ring(rLawn); x <= cx + ring(rLawn); x++)
    for (let z = cz - ring(rLawn); z <= cz + ring(rLawn); z++) {
      const d = Math.hypot(x - cx, z - cz);
      if (d >= rLawn) continue;
      put(g, o, x, y, z, B.block("grass_block"));
      if (d < rCrown) put(g, o, x, y + 1, z, B.block("grass_block"));
      else if (d < rCrown + 1) put(g, o, x, y + 1, z, B.slab("mossy_cobblestone", "bottom"));
    }
  return out;
}

/**
 * The tunnel portal face: a light_gray_concrete wall at x..x+depth-1 (z0..z1, yLo..yHi), two mouths carved
 * through it (mouthY, each [za, zb]), a 1-proud smooth_stone surround on the outer face with jambs and a lintel,
 * a smooth_stone coping on the top course, and an iron_bars rail one block above (rail: [zA, zB]).
 * The face is its own volume, so it may replace the ground inside it; it writes nothing below yLo.
 */
export function portalFace(g, { x, depth = 2, z0, z1, yLo, yHi, mouthY, mouths, rail, facing = "east" }) {
  const out = result(), own = { over: true, out }, air = { out };
  const xs = Array.from({ length: depth }, (_, i) => x + i);
  const inMouth = (z, y) => y >= mouthY[0] && y <= mouthY[1] && mouths.some(([a, b]) => z >= a && z <= b);
  for (let y = yLo; y <= yHi; y++) for (let z = z0; z <= z1; z++) for (const xx of xs)
    if (!inMouth(z, y)) put(g, own, xx, y, z, B.block("light_gray_concrete"));
  for (const [a, b] of mouths) for (let y = mouthY[0]; y <= mouthY[1]; y++) for (let z = a; z <= b; z++) for (const xx of xs)
    put(g, own, xx, y, z, B.block("air"));
  for (let z = z0; z <= z1; z++) for (const xx of xs) put(g, own, xx, yHi, z, B.block("smooth_stone"));
  const sx = facing === "east" ? x + depth : x - 1;
  const surround = new Map();                    // jambs of neighbouring mouths can share a column: write each cell once
  for (const [a, b] of mouths) {
    for (const z of [a - 1, b + 1]) for (let y = mouthY[0]; y <= mouthY[1]; y++) surround.set(`${sx},${y},${z}`, [sx, y, z]);
    for (let z = a - 1; z <= b + 1; z++) surround.set(`${sx},${mouthY[1] + 1},${z}`, [sx, mouthY[1] + 1, z]);
  }
  for (const [cx, cy, cz] of surround.values()) put(g, air, cx, cy, cz, B.block("smooth_stone"));
  if (rail) {
    const rx = facing === "east" ? x + depth - 1 : x;
    for (let z = rail[0]; z <= rail[1]; z++)
      put(g, air, rx, yHi + 1, z, ["iron_bars", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }]);
  }
  return out;
}

/**
 * The Field Station roof as a spec file: runParts lays it right after the shell (build.mjs, roof: "roof.json").
 * It places no blocks itself. footprint [x0, z0, x1, z1] is the wall footprint; overhang {north, south, east, west}.
 */
export function stationRoof(outPath, { footprint, y, material, overhang, fascia, preset = "cafe" }) {
  const spec = { preset, material, footprint, y, overhang, fascia };
  writeFileSync(outPath, `${JSON.stringify(spec, null, 2)}\n`);
  return spec;
}

/**
 * A boulder: andesite and tuff blob (radius r; two courses when r >= 1.5) sitting on the ground at surface y, with
 * moss_carpet on the top course. The mix is set by position, so the same call always gives the same blob.
 */
export function boulder(g, x, y, z, r) {
  const out = result(), o = { out };
  const courses = r >= 1.5 ? 2 : 1;
  for (let k = 0; k < courses; k++) {
    const rr = r - k * 0.5;
    for (let dx = -ring(r); dx <= ring(r); dx++) for (let dz = -ring(r); dz <= ring(r); dz++) {
      if (Math.hypot(dx, dz) > rr + 0.01) continue;
      const mat = (Math.abs(x + dx + z + dz + k) % 3 === 0) ? "tuff" : "andesite";
      put(g, o, x + dx, y + 1 + k, z + dz, B.block(mat));
    }
  }
  const top = r - (courses - 1) * 0.5;
  for (let dx = -ring(r); dx <= ring(r); dx++) for (let dz = -ring(r); dz <= ring(r); dz++)
    if (Math.hypot(dx, dz) <= top + 0.01) put(g, o, x + dx, y + courses + 1, z + dz, B.block("moss_carpet"));
  return out;
}

/**
 * A Monterey pine on the ground at surface y: spruce_log trunk (height 6-8) and a two-course umbrella of
 * persistent spruce_leaves, 9 wide under and 5 wide on top, round the trunk.
 */
export function pine(g, x, y, z, height = 7) {
  if (height < 6 || height > 8) throw new Error(`pine: trunk ${height} is outside 6-8`);
  const out = result(), o = { out };
  for (let k = 1; k <= height; k++) put(g, o, x, y + k, z, ["spruce_log", { axis: "y" }]);
  for (const [dy, r] of [[height - 1, 4.2], [height, 2.5]])
    for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) {
      if ((dx === 0 && dz === 0) || Math.hypot(dx, dz) > r) continue;
      put(g, o, x + dx, y + dy, z + dz, LEAF("spruce_leaves"));
    }
  return out;
}

/**
 * A picnic table on the ground at surface y: two birch_fence legs and a birch_slab top (type top) over the
 * 2 x 1 table along x, with a birch_stairs bench on each side (z - 1 facing north, z + 1 facing south), so the
 * seats open onto the table. Only its own 2 x 3 footprint is written; the cells past it stay clear.
 */
export function picnicTable(g, x, y, z) {
  const out = result(), o = { out };
  for (const dx of [0, 1]) {
    put(g, o, x + dx, y + 1, z, B.fence("birch"));
    put(g, o, x + dx, y + 2, z, B.slab("birch", "top"));
    put(g, o, x + dx, y + 1, z - 1, B.stairs("birch", "north"));
    put(g, o, x + dx, y + 1, z + 1, B.stairs("birch", "south"));
  }
  return out;
}

/**
 * A wall lantern at (x, y, z). hanging: it hangs from the block above (a seat cap), so place it after that cap;
 * otherwise it stands on the block below (a wall top). Refused, and reported, when that block is missing.
 */
export function wallLantern(g, x, y, z, { hanging = false } = {}) {
  const out = result(), o = { out };
  const [sx, sy, sz] = hanging ? [x, y + 1, z] : [x, y - 1, z];
  if (g.isAir(sx, sy, sz)) {
    out.refused.push([x, y, z, "lantern", hanging ? "no block above to hang from" : "no block below to stand on"]);
    return out;
  }
  put(g, o, x, y, z, B.lantern(hanging));
  return out;
}
