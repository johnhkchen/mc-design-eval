// The town grader (thread 0013): plans a town site's landform before any plot is laid, in four passes:
//   1. streets    each street's long profile: the ground along it, smoothed, held under a grade limit, met at its ends
//                 by the forum and by streets already graded; level across its width; over water, a bridge
//   2. frontages  a plot takes its street frontage's level (so its door's half steps work), or 1 off it where that
//                 closes a step over 4; a plot holding a building that is already standing keeps that building's ground
//   3. between    the land inside the town's outer edge that is neither street nor plot (steep land far from both is
//                 left natural, a slope like the edge band): the levels the streets and
//                 plots were given, spread over it as a smooth correction to the natural ground, then cut into terraces
//                 (3 a step) with no riser over 4 and never two risers side by side, so every edge is one earthworks tile
//   4. edge       a blend band past the outer edge, where the correction fades to nothing: the town meets wild land on
//                 a slope, never a cliff
// Pure: grids in, grids out, no world access. Columns are indexed z * X + x in the caller's frame (any origin).
//
//   townGrade({ X, Z, top, water, fixed, streets, plots, forum, outer, blend }) -> { target, role, edges, report }
//     top     Int16Array: natural ground height per column        water  Uint8Array: 1 where the column is water
//     fixed   Int16Array: a standing building's ground height, or NONE where nothing stands (kept as it is)
//     streets [{ kind, width, line: [[x, z], ...] }]     plots [{ x, z, sx, sz, door: north|south|east|west }]
//     forum   { centre: [x, z], reach, level }           outer [x0, z0, x1, z1]      blend: band width (default 16)
//   target   Int16Array: the planned ground height per column (a bridge's deck over water)
//   bridge   Uint8Array: where a street crosses water (1 running along z, 2 along x): a bridge is needed there
//   role     Uint8Array: ROLE.* per column
//   edges    [{ x, z, dir, rise, kind, corner? }]: the high column of each step, the way down (north|south|east|west;
//            a diagonal for an inner corner), the rise, corner: outer|inner where one applies, and the tile family: wall | cut_face | quay | street_step (a half step in a street: a slab) | slope
//            (the blend band, no tile)
//   report   cut and fill volumes, the steepest street, conflicts (steps over 4 that no pass could avoid)
export const NONE = -32768;
export const ROLE = { wild: 0, blend: 1, free: 2, street: 3, plot: 4, fixed: 5, water: 6, forum: 7, natural: 8 };
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const median = (a) => { if (!a.length) return NaN; const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

export function townGrade({ X, Z, top, water, fixed, streets, plots, forum, outer, blend = 16, step = 3, maxRise = 4, grade = 1 / 3, near = 3, keepAway = 4, keepFall = 0.4 }) {
  const N = X * Z, at = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? -1 : z * X + x);
  const role = new Uint8Array(N), target = new Int16Array(N).fill(NONE), owner = new Int32Array(N).fill(-1);
  const bridge = new Uint8Array(N);                                // a street over water: 1 along z, 2 along x
  const plotOf = new Int32Array(N).fill(-1);                       // which plot claimed the column
  const [ox0, oz0, ox1, oz1] = outer;
  const outside = (x, z) => Math.max(ox0 - x, x - ox1, oz0 - z, z - oz1, 0);     // Chebyshev distance past the outer edge
  // ---- roles: water and standing buildings first, then the forum, streets, plots; the rest inside is free land
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const i = z * X + x, d = outside(x, z);
    role[i] = d === 0 ? ROLE.free : d <= blend ? ROLE.blend : ROLE.wild;
    if (water[i]) { role[i] = ROLE.water; target[i] = top[i]; }
    else if (fixed[i] !== NONE) { role[i] = ROLE.fixed; target[i] = fixed[i]; }
  }
  const claim = (i, r) => { if (i >= 0 && (role[i] === ROLE.free || role[i] === ROLE.blend)) { role[i] = r; return true; } return false; };
  const [fx, fz] = forum.centre;
  for (let z = fz - forum.reach; z <= fz + forum.reach; z++) for (let x = fx - forum.reach; x <= fx + forum.reach; x++) { const i = at(x, z); if (claim(i, ROLE.forum)) target[i] = forum.level; }

  // ---- 1. streets: avenues first (they meet the forum), then lanes (they meet the avenues)
  const order = [...streets.keys()].sort((a, b) => (streets[a].kind === "avenue" ? 0 : 1) - (streets[b].kind === "avenue" ? 0 : 1));
  let steepest = { grade: 0 };
  for (const si of order) {
    const s = streets[si], half = (s.width - 1) / 2, samples = [];
    // the centreline at one block a sample
    for (let k = 0; k + 1 < s.line.length; k++) {
      const [ax, az] = s.line[k], [bx, bz] = s.line[k + 1], L = Math.max(Math.abs(bx - ax), Math.abs(bz - az));
      for (let t = 0; t <= L; t++) if (k === 0 || t > 0) samples.push([ax + Math.round((bx - ax) * t / L), az + Math.round((bz - az) * t / L), bz !== az ? 1 : 0]);
    }
    // each sample's cross-section: its cells, the natural median, and any level already fixed there (forum, a street)
    const cells = samples.map(([x, z, alongZ]) => { const c = []; for (let o = -Math.floor(half); o <= Math.ceil(half); o++) c.push(alongZ ? at(x + o, z) : at(x, z + o)); return c.filter((i) => i >= 0); });
    const nat = cells.map((c) => median(c.filter((i) => !water[i]).map((i) => top[i])));
    const pinned = cells.map((c) => { const v = c.filter((i) => role[i] === ROLE.street || role[i] === ROLE.forum).map((i) => target[i]); return v.length ? median(v) : null; });
    // smooth the natural profile (a 9-sample mean), then hold it under the grade from every pinned sample both ways
    const n = samples.length, p = nat.map((_, i) => { let a = 0, w = 0; for (let j = Math.max(0, i - 4); j <= Math.min(n - 1, i + 4); j++) if (!Number.isNaN(nat[j])) { a += nat[j]; w++; } return w ? a / w : NaN; });
    for (let i = 0; i < n; i++) if (Number.isNaN(p[i])) p[i] = i ? p[i - 1] : (pinned.find((v) => v !== null) ?? forum.level);
    const h = p.map((v, i) => (pinned[i] !== null ? pinned[i] : v));
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 1; i < n; i++) if (pinned[i] === null) h[i] = Math.min(h[i - 1] + grade, Math.max(h[i - 1] - grade, h[i]));
      for (let i = n - 2; i >= 0; i--) if (pinned[i] === null) h[i] = Math.min(h[i + 1] + grade, Math.max(h[i + 1] - grade, h[i]));
    }
    // over water the street is a bridge: its deck at least 2 over the water
    const level = h.map((v, k) => { const wet = cells[k].filter((i) => water[i]); return Math.round(wet.length ? Math.max(v, Math.max(...wet.map((i) => top[i])) + 2) : v); });
    // the street's steepest stretch (rise over 6 samples), for the report
    const g = n > 1 ? Math.max(...level.map((v, i) => (i >= 6 ? Math.abs(v - level[i - 6]) / 6 : 0))) : 0;
    if (g > steepest.grade) steepest = { grade: +g.toFixed(2), street: si, kind: s.kind };
    cells.forEach((c, k) => c.forEach((i) => {
      if (role[i] === ROLE.water) { role[i] = ROLE.street; bridge[i] = samples[k][2] ? 1 : 2; }
      if (claim(i, ROLE.street) || (role[i] === ROLE.street && owner[i] === -1)) { target[i] = level[k]; owner[i] = si; }
    }));
  }

  // streets meet streets within a half step: where a later street (a lane) stands 2 or more off an earlier one (an
  // avenue) at a junction, the later street's cells give way, a block at a time back along it, until every step
  // between street cells is 1 (a slab); an avenue never moves for a lane
  for (let it = 0; it < 64; it++) {
    let moved = 0;
    for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
      const i = z * X + x; if (role[i] !== ROLE.street || bridge[i]) continue;
      for (const [ddx, ddz] of DIRS) {
        const j = at(x + ddx, z + ddz); if (j < 0 || (role[j] !== ROLE.street && role[j] !== ROLE.forum)) continue;
        const senior = role[j] === ROLE.forum || order.indexOf(owner[j]) < order.indexOf(owner[i]) || (owner[j] === owner[i]);
        if (senior && Math.abs(target[i] - target[j]) > 1) { target[i] += Math.sign(target[j] - target[i]); moved++; }
      }
    }
    if (!moved) break;
  }

  // ---- 2. frontages: plots holding a standing building first (they keep its ground), then the rest
  const out = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  const plotOrder = [...plots.keys()].sort((a, b) => holds(plots[b]) - holds(plots[a]));
  function holds(p) { let k = 0; for (let z = p.z; z < p.z + p.sz; z++) for (let x = p.x; x < p.x + p.sx; x++) { const i = at(x, z); if (i >= 0 && role[i] === ROLE.fixed) k++; } return k; }
  const plotLevels = [];
  for (const pi of plotOrder) {
    const p = plots[pi], [dx, dz] = out[p.door] || [0, 1];
    const built = []; for (let z = p.z; z < p.z + p.sz; z++) for (let x = p.x; x < p.x + p.sx; x++) { const i = at(x, z); if (i >= 0 && role[i] === ROLE.fixed) built.push(target[i]); }
    let lv = null;
    if (built.length) lv = median(built);
    else {
      // walk out from the door side's middle to the street it fronts
      const mx = p.x + (dx === 0 ? p.sx >> 1 : dx > 0 ? p.sx - 1 : 0), mz = p.z + (dz === 0 ? p.sz >> 1 : dz > 0 ? p.sz - 1 : 0);
      for (let k = 1; k <= 8 && lv === null; k++) { const i = at(mx + dx * k, mz + dz * k); if (i >= 0 && (role[i] === ROLE.street || role[i] === ROLE.forum)) lv = target[i]; }
      if (lv === null) { const v = []; for (let z = p.z; z < p.z + p.sz; z++) for (let x = p.x; x < p.x + p.sx; x++) { const i = at(x, z); if (i >= 0) v.push(top[i]); } lv = Math.round(median(v)); }
    }
    plotLevels.push({ plot: pi, level: lv, frontage: lv, built: built.length > 0 });
    for (let z = p.z; z < p.z + p.sz; z++) for (let x = p.x; x < p.x + p.sx; x++) { const i = at(x, z); if (claim(i, ROLE.plot)) { target[i] = lv; plotOf[i] = pi; } }
  }
  // a plot may sit 1 off its frontage (its door's approach takes the half step) where that closes a step over maxRise
  // against a street, the forum, a building or another plot; what stays over is reported, plot by plot
  const cellsOf = new Map(plotLevels.map((e) => [e.plot, []])); for (let i = 0; i < N; i++) if (plotOf[i] >= 0) cellsOf.get(plotOf[i]).push(i);
  const overOf = (e, lv) => {
    let over = 0;
    for (const i of cellsOf.get(e.plot)) { const x = i % X, z = (i - x) / X; for (const [ddx, ddz] of DIRS) { const j = at(x + ddx, z + ddz); if (j < 0 || plotOf[j] === e.plot) continue; if (role[j] === ROLE.street || role[j] === ROLE.forum || role[j] === ROLE.fixed || role[j] === ROLE.plot) over += Math.max(0, Math.abs(lv - target[j]) - maxRise); } }
    return over;
  };
  for (let round = 0; round < 3; round++) for (const e of plotLevels) {
    if (e.built) continue;
    const best = [e.frontage, e.frontage - 1, e.frontage + 1].map((lv) => [lv, overOf(e, lv)]).sort((a, b) => a[1] - b[1] || Math.abs(a[0] - e.frontage) - Math.abs(b[0] - e.frontage))[0][0];
    if (best !== e.level) { e.level = best; for (const i of cellsOf.get(e.plot)) target[i] = best; }
  }
  for (const e of plotLevels) { e.over = overOf(e, e.level); e.offset = e.level - e.frontage; }

  // ---- 3 and 4. the land between and the blend: the correction (planned minus natural) known on every planned
  // column, spread by relaxation over free and blend columns, held at zero past the band; free land terraced
  const corr = new Float32Array(N), known = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (role[i] === ROLE.wild || role[i] === ROLE.water) { known[i] = 1; corr[i] = 0; }
    else if (role[i] !== ROLE.free && role[i] !== ROLE.blend) { known[i] = 1; corr[i] = target[i] - top[i]; }
  }
  for (let it = 0; it < 600; it++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const i = z * X + x; if (known[i]) continue;
    let a = 0, w = 0; for (const [ddx, ddz] of DIRS) { const j = at(x + ddx, z + ddz); if (j >= 0) { a += corr[j]; w++; } }
    corr[i] += 1.85 * (a / w - corr[i]);                                         // over-relaxed Gauss-Seidel
  }
  // the free land follows the natural ground's lie, not its every bump: a 7 x 7 mean, twice (water left out), so the
  // terraces' risers run as smooth contours rather than a scribble
  let lie = Float32Array.from(top);
  for (let pass = 0; pass < 2; pass++) {
    const nx = new Float32Array(N);
    for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
      let a = 0, w = 0;
      for (let ddz = -3; ddz <= 3; ddz++) for (let ddx = -3; ddx <= 3; ddx++) { const j = at(x + ddx, z + ddz); if (j >= 0 && !water[j]) { a += lie[j]; w++; } }
      nx[z * X + x] = w ? a / w : lie[z * X + x];
    }
    lie = nx;
  }
  // land the town doesn't use keeps its slope: free land more than `keepAway` from any street, plot, the forum or a
  // building, on ground that falls 0.4 or more a column, is left natural (the correction fading out over 8), like the
  // edge band, rather than terraced
  const dUsed = new Int32Array(N).fill(1 << 20), q = [];
  for (let i = 0; i < N; i++) if (role[i] === ROLE.street || role[i] === ROLE.plot || role[i] === ROLE.forum || role[i] === ROLE.fixed) { dUsed[i] = 0; q.push(i); }
  for (let h = 0; h < q.length; h++) { const i = q[h], x = i % X, z = (i - x) / X; for (const [ddx, ddz] of DIRS) { const j = at(x + ddx, z + ddz); if (j >= 0 && dUsed[j] > dUsed[i] + 1) { dUsed[j] = dUsed[i] + 1; q.push(j); } } }
  const fall = (x, z) => { const g = (a, b) => (a >= 0 && b >= 0 ? Math.abs(lie[a] - lie[b]) / 4 : 0); return Math.max(g(at(x - 2, z), at(x + 2, z)), g(at(x, z - 2), at(x, z + 2))); };
  let natural = 0;
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) { const i = z * X + x; if (role[i] === ROLE.free && dUsed[i] > keepAway && fall(x, z) >= keepFall) { role[i] = ROLE.natural; natural++; } }
  const base = forum.level;
  for (let i = 0; i < N; i++) {
    if (role[i] === ROLE.free) target[i] = base + step * Math.round((lie[i] + corr[i] - base) / step);
    else if (role[i] === ROLE.blend) target[i] = Math.round(top[i] + corr[i]);
    else if (role[i] === ROLE.natural) target[i] = Math.round(top[i] + corr[i] * Math.min(1, Math.max(0, 1 - (dUsed[i] - keepAway) / 8)));
    else if (role[i] === ROLE.wild) target[i] = top[i];
  }
  // no riser over maxRise and never two risers side by side: every 3 x 3 window of the town spans at most maxRise;
  // only free columns move (toward the window's middle), planned ones hold
  const inTown = (i) => role[i] !== ROLE.wild && role[i] !== ROLE.blend;             // water counts: a bank comes down to it
  for (let it = 0; it < 200; it++) {
    let moved = 0;
    for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
      const i = z * X + x; if (role[i] !== ROLE.free) continue;
      let lo = -Infinity, hi = Infinity;
      for (let ddz = -1; ddz <= 1; ddz++) for (let ddx = -1; ddx <= 1; ddx++) { const j = at(x + ddx, z + ddz); if (j < 0 || j === i || !inTown(j)) continue; lo = Math.max(lo, target[j] - maxRise); hi = Math.min(hi, target[j] + maxRise); }
      const v = lo > hi ? Math.round((lo + hi) / 2) : Math.min(hi, Math.max(lo, target[i]));
      if (v !== target[i]) { target[i] = v; moved++; }
    }
    if (!moved) break;
  }
  // the blend band and land left natural rise and fall a block a column at most among themselves (natural slopes, no
  // tiles), and meet the town within maxRise
  const loose = (r) => r === ROLE.blend || r === ROLE.natural;
  for (let it = 0; it < 40; it++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const i = z * X + x; if (!loose(role[i])) continue;
    let lo = -Infinity, hi = Infinity;
    for (const [ddx, ddz] of DIRS) { const j = at(x + ddx, z + ddz); if (j < 0 || role[j] === ROLE.water) continue; const tol = loose(role[j]) || role[j] === ROLE.wild ? 1 : maxRise; lo = Math.max(lo, target[j] - tol); hi = Math.min(hi, target[j] + tol); }
    if (lo <= hi) target[i] = Math.min(hi, Math.max(lo, target[i]));
  }

  // ---- edges: the high column of every step, its way down, its rise and its tile family
  const nearPlanned = new Uint8Array(N);                           // within `near` of a street, the forum or a building
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const r = role[z * X + x]; if (r !== ROLE.street && r !== ROLE.forum && r !== ROLE.fixed) continue;
    for (let ddz = -near; ddz <= near; ddz++) for (let ddx = -near; ddx <= near; ddx++) { const j = at(x + ddx, z + ddz); if (j >= 0) nearPlanned[j] = 1; }
  }
  const edges = [], conflicts = [];
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const i = z * X + x; if (role[i] === ROLE.wild || role[i] === ROLE.water || role[i] === ROLE.fixed || bridge[i]) continue;
    for (const [ddx, ddz, dir] of DIRS) {
      const j = at(x + ddx, z + ddz); if (j < 0 || role[j] === ROLE.wild || role[j] === ROLE.fixed || bridge[j]) continue;
      const rise = target[i] - (role[j] === ROLE.water ? top[j] : target[j]); if (rise <= 0) continue;
      const kind = role[j] === ROLE.water ? "quay" : role[i] === ROLE.blend || role[j] === ROLE.blend || (role[i] === ROLE.natural && role[j] === ROLE.natural) ? "slope"
        : (role[i] === ROLE.street || role[i] === ROLE.forum) && (role[j] === ROLE.street || role[j] === ROLE.forum) ? (rise === 1 ? "street_step" : "street_stair")
        : nearPlanned[i] || nearPlanned[j] || role[i] === ROLE.plot || role[j] === ROLE.plot ? "wall" : "cut_face";
      if (kind === "slope" && rise <= 1) continue;
      edges.push({ x, z, dir, rise, kind });
      if (rise > maxRise && kind !== "slope") conflicts.push({ x, z, dir, rise });
    }
  }
  // corners: where two steps meet at a column (an outer corner) the client may lay the corner tile for both; where a
  // column stands high with only its diagonal low (an inner corner, between two walls meeting), it gets a corner edge of
  // its own, or the wall shows a gap there
  const at2 = new Map(); for (const e of edges) { const k = e.z * X + e.x; (at2.get(k) || at2.set(k, []).get(k)).push(e); }
  for (const list of at2.values()) if (list.length > 1 && list.some((a) => list.some((b) => (a.dir === "north" || a.dir === "south") && (b.dir === "east" || b.dir === "west")))) for (const e of list) e.corner = "outer";
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const i = z * X + x; if (at2.has(i) || !inTown(i) || role[i] === ROLE.water || role[i] === ROLE.fixed || role[i] === ROLE.natural || bridge[i]) continue;
    for (const [ddx, ddz, dir] of [[1, 1, "south-east"], [-1, 1, "south-west"], [-1, -1, "north-west"], [1, -1, "north-east"]]) {
      const j = at(x + ddx, z + ddz), a = at(x + ddx, z), b = at(x, z + ddz); if (j < 0 || a < 0 || b < 0) continue;
      const ea = at2.get(a)?.find((e) => e.dir === (ddz > 0 ? "south" : "north")), eb = at2.get(b)?.find((e) => e.dir === (ddx > 0 ? "east" : "west"));
      if (!ea || !eb || target[a] !== target[i] || target[b] !== target[i] || target[j] >= target[i]) continue;
      const kind = ea.kind === "wall" || eb.kind === "wall" ? "wall" : ea.kind;
      if (kind === "slope" || kind === "street_step") continue;
      edges.push({ x, z, dir, rise: target[i] - target[j], kind, corner: "inner" }); break;
    }
  }
  let cut = 0, fill = 0;
  for (let i = 0; i < N; i++) if (role[i] !== ROLE.wild && role[i] !== ROLE.water && role[i] !== ROLE.fixed) { const d = target[i] - top[i]; if (d > 0) fill += d; else cut -= d; }
  const count = (k) => edges.filter((e) => e.kind === k || e.corner === k).length;
  return { target, role, bridge, edges, plotLevels, report: { natural, plots_off_frontage: plotLevels.filter((e) => e.offset).length, plots_over: plotLevels.filter((e) => e.over > 0).map((e) => ({ plot: e.plot, over: e.over })), corners: { outer: edges.filter((e) => e.corner === "outer").length, inner: count("inner") }, bridges: bridge.reduce((a, b) => a + (b ? 1 : 0), 0), cut, fill, steepest, edges: { wall: count("wall"), cut_face: count("cut_face"), quay: count("quay"), street_step: count("street_step"), street_stair: count("street_stair"), slope: count("slope") }, conflicts: conflicts.length, conflict_sample: conflicts.slice(0, 12) } };
}
