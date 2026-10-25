// Designed modules (from the design pipeline) onto a place's massing: the second half of the output contract. A building's
// mass is cleared and a module put in its place, either whole at the footprint's centre, or repeated along a curved
// footprint (a colonnade, a crescent hall). Minecraft only turns blocks by quarter turns, so a straight module is bent onto
// the curve rather than rotated: every block of the curved band looks up the module block at its distance along the arc
// and its distance out from the inner edge (an inverse map, so the band has no holes), and anything with a facing turns to
// the nearest compass direction of the curve there.
//   compose(g, manifest, placements, { ground, I, N }) -> notes
//   placements: [{ building, module: <grid>, plot: [x0, z0, x1, z1] (the module's box in its file), mode: "centre"|"arc"|"at",
//                  at mode: at: [dx, dz] from the footprint box's north-west corner, y?: blocks above the footprint's base,
//                  quarter?: 0-3 quarter turns clockwise seen from above (its north to east, south, west), repeat?: { count,
//                  step: [dx, dz] }, mirror?: true (reflected across its x first), keep?: true (leave everything under it; with trees: false the trees in its box still go), clear?: "all" (the whole footprint first) | "box" (the old default: the box emptied from the footprint's lowest ground up, terrain and all); by default the masses it replaces go (its footprint, covers?: [ids], footprints mostly inside its box) and the rest of the box only above each column's own ground
//                  end?: { module, plot } (the arc's closing piece, at its far end), edge?: "inner"|"outer" (which side of the
//                  footprint the band hugs), front?: "inner"|"outer" (which way the module's north faces), clear?: "all"|"band",
//                  ground?: false (drop the module's own bottom course),
//                  centre mode: angle?: degrees clockwise (the module turned about its centre onto the footprint's centre), shift?: [dx, dz] }]
//                  any mode: turn?: { angle, pivot: [x, z], box: [x0, z0, x1, z1] }: the placements sharing one turn are
//                  composed straight over that box (a long bridge laid out section by section along an axis, so its
//                  sections join before any resampling), then turned as one about pivot onto the site
import { Voxels } from "./voxels.mjs";
const DIRS = ["south", "west", "north", "east"];                    // yaw 0, 90, 180, 270 degrees (Minecraft's)
const turn = (facing, quarter) => (DIRS.includes(facing) ? DIRS[(DIRS.indexOf(facing) + quarter + 4) % 4] : facing);
// a block's state seen in a mirror across x (east and west swap; a stair's corner and a door's hinge change hands)
const MIRROR = { east: "west", west: "east", left: "right", right: "left", inner_left: "inner_right", inner_right: "inner_left", outer_left: "outer_right", outer_right: "outer_left" };
const mirrorState = (st) => st && Object.fromEntries(Object.entries(st).map(([k, v]) => [k, (k === "facing" || k === "hinge" || k === "shape") && MIRROR[v] ? MIRROR[v]
  : (k === "east" || k === "west") ? st[k === "east" ? "west" : "east"] : v]));

/** A circle through a footprint (Kasa's least squares), its radii and angular extent: the arc a curved building follows. */
export function fitArc(cells) {
  const n = cells.length; let sx = 0, sz = 0; for (const [x, z] of cells) { sx += x; sz += z; } const mx = sx / n, mz = sz / n;
  let Suu = 0, Svv = 0, Suv = 0, Suuu = 0, Svvv = 0, Suvv = 0, Svuu = 0;
  for (const [x, z] of cells) { const u = x - mx, v = z - mz; Suu += u * u; Svv += v * v; Suv += u * v; Suuu += u ** 3; Svvv += v ** 3; Suvv += u * v * v; Svuu += v * u * u; }
  const det = Suu * Svv - Suv * Suv, a = (Suuu + Suvv) / 2, b = (Svvv + Svuu) / 2;
  let cx = (a * Svv - b * Suv) / det + mx, cz = (b * Suu - a * Suv) / det + mz;
  // Kasa's algebraic fit is biased on a thick, partial arc: refine geometrically (Gauss-Newton on each cell's distance
  // from the mean radius)
  for (let it = 0; it < 60; it++) {
    const d = cells.map(([x, z]) => Math.hypot(x + 0.5 - cx, z + 0.5 - cz)), rm = d.reduce((p, q) => p + q, 0) / n;
    let JxJx = 0, JxJz = 0, JzJz = 0, Jxr = 0, Jzr = 0, mjx = 0, mjz = 0;
    cells.forEach(([x, z], i) => { mjx += (cx - x - 0.5) / d[i] / n; mjz += (cz - z - 0.5) / d[i] / n; });
    cells.forEach(([x, z], i) => { const jx = (cx - x - 0.5) / d[i] - mjx, jz = (cz - z - 0.5) / d[i] - mjz, r = d[i] - rm;
      JxJx += jx * jx; JxJz += jx * jz; JzJz += jz * jz; Jxr += jx * r; Jzr += jz * r; });
    const dt = JxJx * JzJz - JxJz * JxJz; if (Math.abs(dt) < 1e-9) break;
    const sx = (JzJz * Jxr - JxJz * Jzr) / dt, sz = (JxJx * Jzr - JxJz * Jxr) / dt; cx -= sx; cz -= sz;
    if (Math.hypot(sx, sz) < 1e-4) break;
  }
  const rs = cells.map(([x, z]) => Math.hypot(x + 0.5 - cx, z + 0.5 - cz)).sort((p, q) => p - q);
  const ang = cells.map(([x, z]) => Math.atan2(z + 0.5 - cz, x + 0.5 - cx));
  // the angular extent, unwrapped around the footprint's mean direction
  const mean = Math.atan2(ang.reduce((s, t) => s + Math.sin(t), 0), ang.reduce((s, t) => s + Math.cos(t), 0));
  const rel = ang.map((t) => Math.atan2(Math.sin(t - mean), Math.cos(t - mean))).sort((p, q) => p - q);
  return { cx, cz, r0: rs[Math.floor(n * 0.02)], r1: rs[Math.floor(n * 0.98)], t0: mean + rel[Math.floor(n * 0.01)], t1: mean + rel[Math.floor(n * 0.99)] };
}

function clear(g, b, ground, I) {
  for (const [x, z] of b.footprint) for (let y = ground(x, z) + 1; y < g.size[1]; y++) g.set(x, y, z, "air");
}
// a module block, its facing turned a number of quarter turns, and recoloured by the placement's swaps
// (swap: [{ from, to, minY?, maxY? }], exact block names, so the design run's files stay as they are)
const copyCell = (c, quarter, swap, y) => {
  if (!c || /air$/.test(c.block)) return null;
  const name = c.block.replace(/^minecraft:/, ""), s = swap?.find((w) => w.from === name && (w.minY == null || y >= w.minY) && (w.maxY == null || y <= w.maxY));
  // a state value a module's script left "undefined" (a door with no facing) or a facing that is no direction ("e") would stop a world reader: drop it
  const st = c.state && Object.fromEntries(Object.entries(c.state).filter(([k, v]) => v != null && v !== "undefined" && (k !== "facing" || /^(north|south|east|west|up|down)$/.test(v))));
  return [s ? s.to : c.block, st ? { ...st, ...(st.facing ? { facing: turn(st.facing, quarter) } : {}) } : undefined];
};

// a module at an offset in the footprint's box, turned by quarter turns (a rotation: its blocks' facings turn with it),
// repeated along a step; its box is cleared first unless keep
// (mirror: true reflects it across its own x first, for the far end of a symmetric building whose kit has one end piece)
function placeAt(g, b, p, { H, skip }, ctx) {
  const [x0, z0, x1, z1] = p.plot, W = x1 - x0 + 1, D = z1 - z0 + 1, q = ((p.quarter ?? 0) % 4 + 4) % 4, mir = !!p.mirror;
  const xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]), bx = Math.min(...xs), bz = Math.min(...zs);
  const [w2, d2] = q % 2 ? [D, W] : [W, D], y0 = b.base + (p.y ?? 0), n = p.repeat?.count ?? 1, [sx, sz] = p.repeat?.step ?? [0, 0];
  // module (mx, mz) -> turned (tx, tz) in a w2 x d2 box: one quarter clockwise takes north to east
  const turnXZ = (mx, mz) => (q === 0 ? [mx, mz] : q === 1 ? [D - 1 - mz, mx] : q === 2 ? [W - 1 - mx, D - 1 - mz] : [mz, W - 1 - mx]);
  for (let k = 0; k < n; k++) {
    const ox = bx + p.at[0] + k * sx, oz = bz + p.at[1] + k * sz;
    // keep with trees: false: the land stays (a viaduct over a hillside) but trees inside the module's box go
    if (p.keep && p.trees === false) for (let tz = 0; tz < d2; tz++) for (let tx = 0; tx < w2; tx++) for (let y = y0 + 1; y < g.size[1]; y++) {
      const c = g.get(ox + tx, y, oz + tz); if (c && /leaves$|_log$/.test(c.block)) g.set(ox + tx, y, oz + tz, "air"); }
    // clear: "box" (the old default) empties the whole box from the footprint's lowest ground up: on a slope that cut a
    // rectangular pit to the foundation round the building (the rock round Mont-Saint-Michel's abbey, a hillside's
    // terraces). By default only what stands on the land goes: each column of the box above its own ground (masses,
    // trees, lamps, railings), never the terrain under it, and never a column of another building's footprint
    // (a landscape module, ground: false, rebuilds the whole ground of its box, so it keeps the box clear)
    if (!p.keep && (p.clear === "box" || p.ground === false)) for (let tz = 0; tz < d2; tz++) for (let tx = 0; tx < w2; tx++) for (let y = y0 + skip; y < Math.min(g.size[1], y0 + H); y++) g.set(ox + tx, y, oz + tz, "air");
    else if (!p.keep) for (let tz = 0; tz < d2; tz++) for (let tx = 0; tx < w2; tx++) { const x = ox + tx, z = oz + tz;
      if (x < 0 || z < 0 || x >= g.size[0] || z >= g.size[2] || ctx.other(x, z)) continue;
      for (let y = Math.max(y0 + skip, ctx.ground(x, z) + 1); y < Math.min(g.size[1], y0 + H); y++) g.set(x, y, z, "air"); }
    for (let mz = 0; mz < D; mz++) for (let mx = 0; mx < W; mx++) { const [tx, tz] = turnXZ(mx, mz);
      for (let y = skip; y < H; y++) { const src = p.module.get(x0 + (mir ? W - 1 - mx : mx), y, z0 + mz), cell = mir && src ? { ...src, state: mirrorState(src.state) } : src;
        const c = copyCell(cell, q, p.swap, y); if (c) g.set(ox + tx, y0 + y, oz + tz, ...c); } }
  }
  return `${p.building}: ${W}x${D} module at +${p.at.join(",")}${mir ? ", mirrored" : ""}${q ? `, ${q} quarter turn${q > 1 ? "s" : ""}` : ""}${n > 1 ? `, x${n}` : ""}`;
}

// a module turned by any angle (degrees, clockwise seen from above) about its own centre, set on the centre of the
// footprint's cells: a building at an angle to the grid (the Presidio's Main Post runs 54 degrees off the bridge's axis).
// Each cell of the turned box looks up the module cell it came from (an inverse map, so no holes); facings turn by the
// nearest quarter; trees in the turned box go. The footprint's mass was cleared by the caller.
function placeTurned(g, b, p, { H, skip }) {
  const [x0, z0, x1, z1] = p.plot, W = x1 - x0 + 1, D = z1 - z0 + 1, t = (p.angle * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  const q = ((Math.round(p.angle / 90) % 4) + 4) % 4, n = b.footprint.length;
  const cx = b.footprint.reduce((a, f) => a + f[0], 0) / n + 0.5 + (p.shift?.[0] ?? 0), cz = b.footprint.reduce((a, f) => a + f[1], 0) / n + 0.5 + (p.shift?.[1] ?? 0);
  const R = Math.ceil(Math.hypot(W, D) / 2) + 1, y0 = b.base + (p.y ?? 0); let placed = 0;
  for (let z = Math.floor(cz - R); z <= cz + R; z++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    const dx = x + 0.5 - cx, dz = z + 0.5 - cz, mx = Math.floor(W / 2 + dx * c + dz * s), mz = Math.floor(D / 2 - dx * s + dz * c);
    if (mx < 0 || mz < 0 || mx >= W || mz >= D) continue;
    for (let y = y0 + 1; y < g.size[1]; y++) { const old = g.get(x, y, z); if (old && /leaves$|_log$/.test(old.block)) g.set(x, y, z, "air"); }
    for (let y = skip; y < H; y++) { const cell = copyCell(p.module.get(x0 + mx, y, z0 + mz), q, p.swap, y); if (cell) { g.set(x, y0 + y, z, ...cell); placed++; } }
  }
  return `${p.building}: ${W}x${D} module turned ${p.angle} degrees on the footprint's centre ${cx.toFixed(1)},${cz.toFixed(1)}: ${placed} blocks`;
}

/** Voxels turned by any angle about a pivot (x, z), nearest block: each target cell looks up the source cell it came from
 *  (an inverse map, so there are no holes), facings turn by the nearest quarter. Cells the source cleared are cleared. */
export function rotateInto(g, src, cleared, { angle, pivot: [px, pz], box: [x0, z0, x1, z1] }) {
  const wasCleared = typeof cleared === "function" ? cleared : (x, y, z) => cleared[(z * g.size[1] + y) * g.size[0] + x];
  const t = (angle * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), q = ((Math.round(angle / 90) % 4) + 4) % 4, [X, Y, Z] = g.size;
  // the turned box's corners bound the cells to visit
  const corners = [[x0, z0], [x1 + 1, z0], [x0, z1 + 1], [x1 + 1, z1 + 1]].map(([x, z]) => [px + (x - px) * c - (z - pz) * s, pz + (x - px) * s + (z - pz) * c]);
  const xa = Math.max(0, Math.floor(Math.min(...corners.map((p) => p[0])))), xb = Math.min(X - 1, Math.ceil(Math.max(...corners.map((p) => p[0]))));
  const za = Math.max(0, Math.floor(Math.min(...corners.map((p) => p[1])))), zb = Math.min(Z - 1, Math.ceil(Math.max(...corners.map((p) => p[1]))));
  let n = 0;
  for (let z = za; z <= zb; z++) for (let x = xa; x <= xb; x++) {
    const dx = x + 0.5 - px, dz = z + 0.5 - pz, sx = Math.floor(px + dx * c + dz * s), sz = Math.floor(pz - dx * s + dz * c);
    if (sx < x0 || sx > x1 || sz < z0 || sz > z1) continue;
    for (let y = 0; y < Y; y++) { const b = src.get(sx, y, sz);
      if (b) { g.set(x, y, z, b.block, b.state?.facing ? { ...b.state, facing: turn(b.state.facing, q) } : b.state); n++; }
      else if (wasCleared(sx, y, sz)) g.set(x, y, z, "air"); }
  }
  return n;
}

// a group of placements composed straight on a scratch volume over turn.box (absolute block coordinates), then turned
function composeTurned(g, manifest, ps, { ground, I }, { angle, pivot, box: [bx0, bz0, bx1, bz1] }) {
  const X = bx1 - bx0 + 1, Y = g.size[1], Z = bz1 - bz0 + 1, src = new Voxels([X, Y, Z]), cleared = new Uint8Array(X * Y * Z);
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  const scratch = { size: g.size, get: (x, y, z) => src.get(x - bx0, y, z - bz0), set(x, y, z, block, state) {
    const lx = x - bx0, lz = z - bz0; if (!src.inBounds(lx, y, lz)) return this;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
    if (/air$/.test(block)) cleared[(lz * Y + y) * X + lx] = 1; src.set(lx, y, lz, block, state); return this; } };
  const notes = compose(scratch, manifest, ps, { ground, I });
  if (x0 > x1) return [...notes, `turn about ${pivot.join(",")}: nothing placed`];
  const view = { get: (x, y, z) => src.get(x - bx0, y, z - bz0) };
  const n = rotateInto(g, view, (x, y, z) => cleared[((z - bz0) * Y + y) * X + (x - bx0)], { angle, pivot, box: [x0, z0, x1, z1] });
  return [...notes, `turned ${angle} degrees about ${pivot.join(",")}: ${n} blocks`];
}

export function compose(g, manifest, placements, { ground, I, angle = 0 }) {
  if (!angle && placements.some((p) => p.turn)) {
    const groups = new Map();
    for (const p of placements.filter((q) => q.turn)) { const k = JSON.stringify(p.turn); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
    const notes = compose(g, manifest, placements.filter((q) => !q.turn), { ground, I });
    for (const ps of groups.values()) notes.push(...composeTurned(g, manifest, ps.map(({ turn, ...q }) => q), { ground, I }, ps[0].turn));
    return notes;
  }
  if (angle) {
    // a building set at an angle to the grid: composed square on a scratch volume, then turned onto the site about the
    // centre of its footprint's box (Minecraft has no rotated blocks, so the turn resamples to the nearest block)
    const [X, Y] = g.size, src = new Voxels(g.size), cleared = new Uint8Array(src.data.length); let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    const scratch = { size: g.size, get: (x, y, z) => src.get(x, y, z), set(x, y, z, block, state) { if (!src.inBounds(x, y, z)) return this;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
      if (/air$/.test(block)) cleared[(z * Y + y) * X + x] = 1; src.set(x, y, z, block, state); return this; } };
    const notes = compose(scratch, manifest, placements, { ground, I });
    const b = manifest.buildings.find((m) => m.id === placements[0].building), xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]);
    const pivot = [(Math.min(...xs) + Math.max(...xs) + 1) / 2, (Math.min(...zs) + Math.max(...zs) + 1) / 2];
    const n = rotateInto(g, src, cleared, { angle, pivot, box: [x0, z0, x1, z1] });
    return [...notes, `turned ${angle} degrees about ${pivot.map((v) => v.toFixed(1)).join(",")}: ${n} blocks`];
  }
  const notes = [], cleared = new Set(), byId = new Map(manifest.buildings.map((b) => [b.id, b]));
  const ownPlaced = new Set(placements.map((p) => p.building));       // buildings with a module of their own (a fill)
  // room overhead: a module may stand taller than the lidar massing (a spire the lidar's median softens)
  const need = Math.max(0, ...placements.map((p) => { const b = byId.get(p.building); return b ? b.base + (p.y ?? 0) + p.module.size[1] + 2 : 0; }));
  if (need > g.size[1] && g.growTo) g.growTo(need);
  for (const p of placements) {
    const b = byId.get(p.building); if (!b) { notes.push(`${p.building}: not in the manifest`); continue; }
    const [x0, z0, x1, z1] = p.plot, W = x1 - x0 + 1, D = z1 - z0 + 1, H = Math.min(p.module.size[1], g.size[1]);
    const skip = p.ground === false ? 1 : 0;        // leave out the module's own paving course (its y 0 sits on the ground block)
    // clear: "all" on an "at" placement clears the whole footprint's mass first (once per building), for a kit that covers
    // the building, so no sliver of the placeholder mass is left standing against a front
    if (p.mode === "at") { if (p.clear === "all" && !cleared.has(b.id)) { clear(g, b, ground, I); cleared.add(b.id); }
      // the masses this placement replaces: its building, the ones it lists (covers), and any footprint mostly (60%+)
      // inside its box that has no module of its own; every other footprint's columns are left alone
      const q = ((p.quarter ?? 0) % 4 + 4) % 4, [w2, d2] = q % 2 ? [D, W] : [W, D], bx = Math.min(...b.footprint.map((c) => c[0])), bz = Math.min(...b.footprint.map((c) => c[1]));
      const n = p.repeat?.count ?? 1, [sx, sz] = p.repeat?.step ?? [0, 0], bxs = [];
      for (let k = 0; k < n; k++) bxs.push([bx + p.at[0] + k * sx, bz + p.at[1] + k * sz]);
      const inBox = (x, z) => bxs.some(([ox, oz]) => x >= ox && z >= oz && x < ox + w2 && z < oz + d2);
      const mine = new Set([b.id, ...(p.covers ?? [])]);
      for (const o of manifest.buildings) if (!mine.has(o.id) && !ownPlaced.has(o.id) && o.footprint.filter(([x, z]) => inBox(x, z)).length >= 0.6 * o.footprint.length) mine.add(o.id);
      const other = new Set(); for (const o of manifest.buildings) if (!mine.has(o.id)) for (const [x, z] of o.footprint) if (inBox(x, z)) other.add(I(x, z));
      if (!p.keep && p.clear !== "box" && p.ground !== false) for (const id of mine) if (!cleared.has(id)) { clear(g, byId.get(id), ground, I); cleared.add(id); }
      notes.push(placeAt(g, b, p, { H, skip }, { ground, other: (x, z) => other.has(I(x, z)) })); continue; }
    if (p.mode === "centre" || p.clear !== "band") clear(g, b, ground, I);
    if (p.mode === "centre" && p.angle) { notes.push(placeTurned(g, b, p, { H, skip })); continue; }
    if (p.mode === "centre") {
      const xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]);
      const cx = Math.round((Math.min(...xs) + Math.max(...xs) + 1) / 2 - W / 2), cz = Math.round((Math.min(...zs) + Math.max(...zs) + 1) / 2 - D / 2);
      // the module's whole box, not just the footprint: trees under its arches and between its columns go
      for (let dz = 0; dz < D; dz++) for (let dx = 0; dx < W; dx++) for (let y = b.base + 1; y < g.size[1]; y++) {
        const c = g.get(cx + dx, y, cz + dz); if (c && /leaves$|_log$/.test(c.block)) g.set(cx + dx, y, cz + dz, "air"); }
      for (let dz = 0; dz < D; dz++) for (let dx = 0; dx < W; dx++) for (let y = skip; y < H; y++) {
        const c = copyCell(p.module.get(x0 + dx, y, z0 + dz), 0, p.swap, y); if (c) g.set(cx + dx, b.base + y, cz + dz, ...c); }
      notes.push(`${p.building}: ${W}x${D} module centred at ${cx},${cz}`);
      continue;
    }
    // along the arc: u = distance along the arc at the inner radius (module x, repeating), v = out from the edge (module z)
    const arc = fitArc(b.footprint), outer = p.edge === "outer", r0 = outer ? arc.r1 - D : arc.r0;
    const span = (arc.t1 - arc.t0) * (r0 + D / 2), endW = p.end ? p.end.plot[2] - p.end.plot[0] + 1 : 0;
    let placed = 0;
    for (let z = 0; z < g.size[2]; z++) for (let x = 0; x < g.size[0]; x++) {
      const r = Math.hypot(x + 0.5 - arc.cx, z + 0.5 - arc.cz), v = Math.floor(outer ? r0 + D - r : r - r0); if (v < 0 || v >= D) continue;
      let t = Math.atan2(z + 0.5 - arc.cz, x + 0.5 - arc.cx) - arc.t0; t = Math.atan2(Math.sin(t), Math.cos(t)); if (t < 0) t += 2 * Math.PI;
      const u = t * (r0 + D / 2); if (u >= span) continue;
      // a rotation, never a mirror: with the front outward the module's x runs with the angle and its z inward; with the
      // front inward both flip (a half turn). Facings turn with the local tangent.
      const tangent = Math.atan2(z + 0.5 - arc.cz, x + 0.5 - arc.cx) + Math.PI / 2, frontIn = p.front === "inner";
      const quarter = (Math.round(tangent / (Math.PI / 2)) + (frontIn ? 2 : 0)) & 3;
      const inEnd = p.end && u >= span - endW, src = inEnd ? p.end : p, [sx0, sz0] = src.plot, w = src.plot[2] - src.plot[0] + 1;
      const along = inEnd ? Math.floor(u - (span - endW)) : Math.floor(u) % W, mu = frontIn ? w - 1 - along : along;
      const out = outer ? D - 1 - v : v, mv = frontIn ? out : D - 1 - out;               // out = 0 at the inner edge
      const base = ground(Math.min(g.size[0] - 1, x), Math.min(g.size[2] - 1, z));
      if (p.clear === "band") for (let y = base + 1; y < g.size[1]; y++) g.set(x, y, z, "air");
      for (let y = skip; y < H; y++) { const c = copyCell(src.module.get(sx0 + mu, y, sz0 + mv), quarter, src.swap, y); if (c) { g.set(x, base + y, z, ...c); placed++; } }
    }
    notes.push(`${p.building}: bent along an arc r ${arc.r0.toFixed(0)}..${arc.r1.toFixed(0)} about ${arc.cx.toFixed(0)},${arc.cz.toFixed(0)}, ${span.toFixed(0)} blocks long, ${placed} blocks`);
  }
  return notes;
}
