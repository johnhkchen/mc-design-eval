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
//                  step: [dx, dz] }, keep?: true (leave the mass under it: by default the module's box is cleared first)
//                  end?: { module, plot } (the arc's closing piece, at its far end), edge?: "inner"|"outer" (which side of the
//                  footprint the band hugs), front?: "inner"|"outer" (which way the module's north faces), clear?: "all"|"band",
//                  ground?: false (drop the module's own bottom course) }]
const DIRS = ["south", "west", "north", "east"];                    // yaw 0, 90, 180, 270 degrees (Minecraft's)
const turn = (facing, quarter) => (DIRS.includes(facing) ? DIRS[(DIRS.indexOf(facing) + quarter + 4) % 4] : facing);

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
  return [s ? s.to : c.block, c.state ? { ...c.state, ...(c.state.facing ? { facing: turn(c.state.facing, quarter) } : {}) } : undefined];
};

// a module at an offset in the footprint's box, turned by quarter turns (a rotation: its blocks' facings turn with it),
// repeated along a step; its box is cleared first unless keep
function placeAt(g, b, p, { H, skip }) {
  const [x0, z0, x1, z1] = p.plot, W = x1 - x0 + 1, D = z1 - z0 + 1, q = ((p.quarter ?? 0) % 4 + 4) % 4;
  const xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]), bx = Math.min(...xs), bz = Math.min(...zs);
  const [w2, d2] = q % 2 ? [D, W] : [W, D], y0 = b.base + (p.y ?? 0), n = p.repeat?.count ?? 1, [sx, sz] = p.repeat?.step ?? [0, 0];
  // module (mx, mz) -> turned (tx, tz) in a w2 x d2 box: one quarter clockwise takes north to east
  const turnXZ = (mx, mz) => (q === 0 ? [mx, mz] : q === 1 ? [D - 1 - mz, mx] : q === 2 ? [W - 1 - mx, D - 1 - mz] : [mz, W - 1 - mx]);
  for (let k = 0; k < n; k++) {
    const ox = bx + p.at[0] + k * sx, oz = bz + p.at[1] + k * sz;
    if (!p.keep) for (let tz = 0; tz < d2; tz++) for (let tx = 0; tx < w2; tx++) for (let y = y0 + skip; y < Math.min(g.size[1], y0 + H); y++) g.set(ox + tx, y, oz + tz, "air");
    for (let mz = 0; mz < D; mz++) for (let mx = 0; mx < W; mx++) { const [tx, tz] = turnXZ(mx, mz);
      for (let y = skip; y < H; y++) { const c = copyCell(p.module.get(x0 + mx, y, z0 + mz), q, p.swap, y); if (c) g.set(ox + tx, y0 + y, oz + tz, ...c); } }
  }
  return `${p.building}: ${W}x${D} module at +${p.at.join(",")}${q ? `, ${q} quarter turn${q > 1 ? "s" : ""}` : ""}${n > 1 ? `, x${n}` : ""}`;
}

export function compose(g, manifest, placements, { ground, I }) {
  const notes = [], byId = new Map(manifest.buildings.map((b) => [b.id, b]));
  for (const p of placements) {
    const b = byId.get(p.building); if (!b) { notes.push(`${p.building}: not in the manifest`); continue; }
    const [x0, z0, x1, z1] = p.plot, W = x1 - x0 + 1, D = z1 - z0 + 1, H = Math.min(p.module.size[1], g.size[1]);
    const skip = p.ground === false ? 1 : 0;        // leave out the module's own paving course (its y 0 sits on the ground block)
    if (p.mode === "at") { notes.push(placeAt(g, b, p, { H, skip })); continue; }
    if (p.mode === "centre" || p.clear !== "band") clear(g, b, ground, I);
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
