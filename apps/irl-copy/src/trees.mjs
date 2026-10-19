// TREES FROM A CANOPY HEIGHT MAP: real trees where a raster says there is canopy (e.g. Meta & WRI's 1 m global canopy
// height maps, or a LiDAR CHM), at the heights it says. Treetops are the local maxima of the canopy; every canopy cell
// belongs to its nearest treetop; that set of cells, each with the canopy's top there, is the crown's measured outer
// envelope. A tree is then GROWN into it rather than extruded from it (extruding gave flat-topped leaf prisms on a pole,
// every tree the same): a broadleaf by space colonisation (Runions et al. 2007: attraction points scattered inside the
// envelope pull branch tips toward them until the crown is filled), a conifer as whorls of branches under tiered skirts
// shaped by the envelope at each height, a palm as a bare, leaning trunk under a head of drooping fronds. Each tree is
// seeded from its position, so a rebuild gives the same trees, and nothing that is already there is overwritten.
//
//   canopyTrees(g, { chm, n, ground, open, minHeight, species, scale })
//     chm      Float32Array n*n, canopy height above the ground in blocks (row = z)
//     ground   (x, z) -> y of the ground's top block there
//     open     (x, z) -> may a tree stand / a crown hang here (not a road, a building, water)        (default: all)
//     species  (heightInMetres, { at, height, width, scale }) -> "broadleaf" | "conifer" | "palm" | { form?, log?,
//              leaves? } | null (null: chosen from the crown's shape)                                (default: chosen)
//     scale    blocks per metre (default 1): minHeight is in metres, crown limits scale with it
//   -> { trees: [{ at:[x,z], height, crown, form, log, leaves }], leaves, logs }
//
//   growTree(g, { at:[x,z], base, height, crown, species, seed, fits, scale })   one tree, for plazas, street rows, palms
//     base     y of the ground's top block under the trunk; height: top of the crown above it, in blocks
//     crown    { radius } (a dome, cone or frond spread that wide) or { cells: [[x, z, topY], ...] } (a measured envelope)
//     species  as above (default: broadleaf); seed: any integer (default: from the position); fits(x, z): may it reach
//              here; scale: blocks per metre (default 1.4), for choosing a kit from the size
//   -> { form, log, leaves, logs, leafCount }
const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };
const WOOD = { oak: ["oak_log", "oak_leaves"], dark_oak: ["dark_oak_log", "dark_oak_leaves"], birch: ["birch_log", "birch_leaves"],
  spruce: ["spruce_log", "spruce_leaves"], jungle: ["jungle_log", "jungle_leaves"] };
const kit = (w, form) => ({ form, log: WOOD[w][0], leaves: WOOD[w][1] });

// a small, fast, seedable generator (mulberry32) and an integer hash of a position, so a tree's shape is its own
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (x, z) => { let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(z | 0, 0x165667b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); return (h ^ (h >>> 13)) >>> 0; };

// put a block only where nothing is (a building, the ground, another tree's limb stay). On the compact volume the test
// reads the cell's palette index straight, not through get() (which makes an object per call: millions here)
function writer(g, fits) {
  const fast = g.data instanceof Uint16Array && typeof g.at === "function";
  const free = fast ? (x, y, z) => { const i = g.at(x, y, z); return i >= 0 && g.data[i] === 0; }
    : (x, y, z) => { if (!g.inBounds(x, y, z)) return false; const c = g.get(x, y, z); return !c || /air$/.test(c.block); };
  const w = { logs: 0, leaves: 0, free, fits,
    log(x, y, z, block, axis = "y") { if (!fits(x, z) || !free(x, y, z)) return false; g.set(x, y, z, block, { axis }); w.logs++; return true; },
    leaf(x, y, z, block) { if (!fits(x, z) || !free(x, y, z)) return false; g.set(x, y, z, block, LEAF); w.leaves++; return true; },
    other(x, y, z, block, state) { if (!fits(x, z) || !free(x, y, z)) return false; g.set(x, y, z, block, state); return true; } };
  return w;
}

// the envelope as a little raster over the crown's box: top y per cell, -1 outside; plus its centre and reach
function envelope(cells) {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const [x, z] of cells) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
  const w = x1 - x0 + 1, d = z1 - z0 + 1, top = new Int16Array(w * d).fill(-1); let cx = 0, cz = 0;
  for (const [x, z, t] of cells) { top[(z - z0) * w + (x - x0)] = Math.max(top[(z - z0) * w + (x - x0)], Math.round(t)); cx += x + 0.5; cz += z + 0.5; }
  cx /= cells.length; cz /= cells.length;
  let R = 1; for (const [x, z] of cells) R = Math.max(R, Math.hypot(x + 0.5 - cx, z + 0.5 - cz));
  const T = (x, z) => (x < x0 || z < z0 || x > x1 || z > z1 ? -1 : top[(z - z0) * w + (x - x0)]);
  return { x0, z0, x1, z1, w, d, top, T, cx, cz, R, list: cells };
}

// a synthetic envelope for a tree placed by hand: a dome (broadleaf), a cone (conifer), a flat spread (palm)
function shapedCrown([x, z], base, height, radius, form) {
  const cells = [], r = Math.max(1, radius), R = Math.ceil(r);
  for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const d = Math.hypot(dx, dz); if (d > r + 0.3) continue;
    const t = form === "conifer" ? height * (1 - 0.8 * d / (r + 1)) : form === "palm" ? height : height - (height * 0.35) * (d / (r + 0.5)) ** 2;
    cells.push([x + dx, z + dz, base + Math.max(1, t)]); }
  return cells;
}

// a run of logs between two block positions, one axis at a time, so a limb is always joined face to face
function run(W, a, b, block, axis) {
  let [x, y, z] = a; W.log(x, y, z, block, axis);
  for (let k = 0; k < 64 && (x !== b[0] || y !== b[1] || z !== b[2]); k++) {
    const dx = b[0] - x, dy = b[1] - y, dz = b[2] - z, m = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
    if (Math.abs(dy) === m) y += Math.sign(dy); else if (Math.abs(dx) === m) x += Math.sign(dx); else z += Math.sign(dz);
    W.log(x, y, z, block, axis); }
}

// BROADLEAF by space colonisation. Attraction points fill the crown between the measured top and a rounded underside
// (higher at the rim than at the trunk), denser toward the top surface, where the leaves are; from the trunk top, every
// branch node that is the nearest node of some points within the influence radius grows one block toward their mean
// direction (a little toward the light); points a node reaches are spent. Limbs carrying many tips (pipe model) become
// logs, the trunk two by two on a big tree; twigs stay as leaves, a small noisy clump at each tip, so the crown keeps
// gaps and a ragged edge but still meets the measured top.
function broadleaf(W, env, { at, base, height, kit: K, rnd }) {
  const top = base + height, cb = base + Math.max(2, Math.min(height - 2, Math.round(height * (0.32 + rnd() * 0.12))));
  const { cx, cz, R } = env, di = Math.max(5, Math.min(14, R * 1.1)), dk = 2.5, cells = env.list;
  // attraction points
  let vol = 0; const under = cells.map(([x, z, t]) => { t = Math.round(t); const d = Math.min(1, Math.hypot(x + 0.5 - cx, z + 0.5 - cz) / R);
    const b = Math.min(t - 1, cb + (t - cb) * 0.6 * d * d); vol += t - b + 1; return b; });
  const leafR = Math.min(3.6, 1.4 + Math.max(R, (top - cb) * 0.45) * 0.2);   // the size of a clump of leaves at a tip
  // about one point per clump's volume: the tips spread out into separate clumps with sky between them, not one mass
  const N = Math.max(6, Math.min(300, Math.round(vol / Math.max(8, Math.min(30, 0.55 * leafR ** 3))))), P = new Float32Array(N * 3), alive = new Uint8Array(N).fill(1);
  for (let k = 0; k < N; k++) { const i = Math.floor(rnd() * cells.length), [x, z, t] = cells[i], tt = Math.round(t), b = under[i];
    P[3 * k] = x + rnd(); P[3 * k + 2] = z + rnd(); P[3 * k + 1] = tt + 0.9 - (tt + 0.9 - b) * rnd() ** 1.25; }
  // nodes: position, parent; the trunk first, straight up from the ground to the crown base
  const nx = [], ny = [], nz = [], par = [], seen = new Set();
  const add = (x, y, z, p) => { nx.push(x); ny.push(y); nz.push(z); par.push(p); seen.add(`${Math.round(x * 2)},${Math.round(y * 2)},${Math.round(z * 2)}`); return nx.length - 1; };
  let last = -1; for (let y = base + 1; y <= cb; y++) last = add(at[0] + 0.5, y + 0.5, at[1] + 0.5, last);
  const trunkN = nx.length, near = new Int32Array(N).fill(-1), nd = new Float32Array(N).fill(di * di);
  for (let from = 0, it = 0; it < 3 * (R + height) + 10; it++) {
    for (let j = from; j < nx.length; j++) for (let k = 0; k < N; k++) { if (!alive[k]) continue;
      const ex = P[3 * k] - nx[j], ey = P[3 * k + 1] - ny[j], ez = P[3 * k + 2] - nz[j], d2 = ex * ex + ey * ey + ez * ez;
      if (d2 < dk * dk) alive[k] = 0; else if (d2 < nd[k]) { nd[k] = d2; near[k] = j; } }
    from = nx.length;
    const acc = new Map();
    for (let k = 0; k < N; k++) { if (!alive[k] || near[k] < 0) continue; const j = near[k];
      const ex = P[3 * k] - nx[j], ey = P[3 * k + 1] - ny[j], ez = P[3 * k + 2] - nz[j], l = Math.hypot(ex, ey, ez) || 1;
      const a = acc.get(j) ?? [0, 0, 0]; a[0] += ex / l; a[1] += ey / l; a[2] += ez / l; acc.set(j, a); }
    let grew = 0;
    for (const [j, a] of acc) { a[1] += 0.12 * Math.hypot(...a); const l = Math.hypot(...a); if (l < 1e-3) continue;
      const x = nx[j] + a[0] / l, y = ny[j] + a[1] / l, z = nz[j] + a[2] / l;
      if (y > top + 0.99 || seen.has(`${Math.round(x * 2)},${Math.round(y * 2)},${Math.round(z * 2)}`)) continue;
      add(x, y, z, j); grew++; }
    if (!grew) break;
  }
  // the colonisation found nothing to grow into (a crown too small for it): a leader up through a ball of leaves
  if (nx.length - trunkN < 3) for (let y = cb + 1; y <= top - 1; y++) last = add(at[0] + 0.5, y + 0.5, at[1] + 0.5, last);
  // pipe model: a node carries every tip above it; thick enough limbs are wood
  const M = nx.length, tips = new Int32Array(M), kids = new Int32Array(M);
  for (let j = 0; j < M; j++) if (par[j] >= 0) kids[par[j]]++;
  for (let j = M - 1; j >= 0; j--) { if (!kids[j]) tips[j] = 1; if (par[j] >= 0) tips[par[j]] += tips[j]; }
  const vox = (j) => [Math.floor(nx[j]), Math.floor(ny[j]), Math.floor(nz[j])];
  // limbs stay under the envelope's top where they cross it (only the trunk's own column may run to the treetop)
  const Wc = { ...W, log: (x, y, z, ...r) => (y <= env.T(x, z) + 1 ? W.log(x, y, z, ...r) : false) };
  const thick = height >= 20 || tips[0] >= 90, logAt = Math.max(3, Math.round(tips[0] / 60));
  for (let j = 0; j < M; j++) { if (j >= trunkN && tips[j] < logAt) continue;
    const p = par[j] >= 0 ? par[j] : j, ax = Math.abs(nx[j] - nx[p]), ay = Math.abs(ny[j] - ny[p]), az = Math.abs(nz[j] - nz[p]);
    const axis = ay >= ax && ay >= az ? "y" : ax >= az ? "x" : "z";
    run(j < trunkN ? W : Wc, vox(p), vox(j), K.log, axis);
    // a big tree's trunk (and the first stretch of its main limbs) two by two: a one-block pole under a 20 m crown reads as a lollipop
    if (thick && (j < trunkN || tips[j] >= tips[0] * 0.35) && axis === "y") { const [x, y, z] = vox(j), L = j < trunkN ? W : Wc; L.log(x + 1, y, z, K.log); L.log(x, y, z + 1, K.log); L.log(x + 1, y, z + 1, K.log); }
  }
  // leaves: a noisy, flattened clump at each tip and a leaf on each twig; clipped to the envelope (its cells, under its top)
  for (let j = trunkN; j < M; j++) { if (tips[j] >= logAt) continue;
    if (kids[j]) { const [x, y, z] = vox(j); if (y <= env.T(x, z)) W.leaf(x, y, z, K.leaves); continue; }   // a twig: one leaf on it
    const r = leafR * (0.7 + rnd() * 0.5), ry = r * 0.72, X = nx[j], Y = ny[j], Z = nz[j], Rr = Math.ceil(r);
    for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) for (let dz = -Rr; dz <= Rr; dz++) for (let dx = -Rr; dx <= Rr; dx++) {
      const x = Math.floor(X) + dx, y = Math.floor(Y) + dy, z = Math.floor(Z) + dz;
      const ex = (x + 0.5 - X) / r, ey = (y + 0.5 - Y) / ry, ez = (z + 0.5 - Z) / r, e = ex * ex + ey * ey + ez * ez;
      if (e > 1 || (e > 0.5 && rnd() < 0.4)) continue;
      const t = env.T(x, z); if (t < 0 || y > t) continue;
      W.leaf(x, y, z, K.leaves); } }
  return cb;
}

// CONIFER: a leader to the top; from the crown base up, skirts in tiers (each tier widest at its foot, a block narrower
// per course above), every course filling the envelope's cells that reach that high, less the tier's step in from its
// edge; a whorl of four to six branches under each tier's foot, out to just short of its rim. Narrow envelopes come out
// columnar (cypress, poplar) and broad ones as a wide cone, the same rule.
function conifer(W, env, { at, base, height, kit: K, rnd }) {
  const top = base + height, cb = base + Math.max(1, Math.round(height * (0.12 + rnd() * 0.1))), s = height >= 24 ? 3 : 2;
  const thick = height >= 28, { x0, z0, w, d } = env;
  for (let y = base + 1; y <= top - 1; y++) { W.log(at[0], y, at[1], K.log);
    if (thick && y < top - height / 3) { W.log(at[0] + 1, y, at[1], K.log); W.log(at[0], y, at[1] + 1, K.log); W.log(at[0] + 1, y, at[1] + 1, K.log); } }
  // a course's cells and how far each is in from the course's edge (a chamfer distance over the crown's little raster)
  const dist = new Float32Array(w * d), INF = 1e9;
  // and no course wider than a cone from the crown's full spread at its base to the tip allows: lidar often reads a
  // conifer's flanks as near-vertical (crowns run together, returns off the side), which grew flat-sided columns
  let Rt = 1; for (const [x, z] of env.list) Rt = Math.max(Rt, Math.hypot(x - at[0], z - at[1]));
  const cone = new Float32Array(w * d); for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) cone[z * w + x] = Math.hypot(x0 + x - at[0], z0 + z - at[1]);
  const course = (y) => { const lim = 1 + (Rt + 0.5) * Math.min(1, (top - y) / Math.max(1, (top - cb) * 0.9));
    for (let i = 0; i < w * d; i++) dist[i] = env.top[i] >= y && cone[i] <= lim ? INF : 0;
    for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) { const i = z * w + x; if (!dist[i]) continue;
      const a = x ? dist[i - 1] : 0, b = z ? dist[i - w] : 0; dist[i] = Math.min(dist[i], a + 1, b + 1, x && z ? dist[i - w - 1] + 1.4 : 1.4, x < w - 1 && z ? dist[i - w + 1] + 1.4 : 1.4); }
    for (let z = d - 1; z >= 0; z--) for (let x = w - 1; x >= 0; x--) { const i = z * w + x; if (!dist[i]) continue;
      const a = x < w - 1 ? dist[i + 1] : 0, b = z < d - 1 ? dist[i + w] : 0; dist[i] = Math.min(dist[i], a + 1, b + 1, x < w - 1 && z < d - 1 ? dist[i + w + 1] + 1.4 : 1.4, x && z < d - 1 ? dist[i + w - 1] + 1.4 : 1.4); } };
  for (let y = cb; y <= top; y++) {
    const step = (y - cb) % s; course(y);
    if (step === 0 && y < top - 2) { const k = 4 + Math.floor(rnd() * 3), a0 = rnd() * Math.PI * 2;
      for (let b = 0; b < k; b++) { const a = a0 + (b * Math.PI * 2) / k + (rnd() - 0.5) * 0.6, ux = Math.cos(a), uz = Math.sin(a);
        for (let r = 1; r < 30; r++) { const x = Math.floor(at[0] + 0.5 + ux * r), z = Math.floor(at[1] + 0.5 + uz * r), i = (z - z0) * w + (x - x0);
          if (x < x0 || z < z0 || x >= x0 + w || z >= z0 + d || dist[i] < 2.5) break;
          W.log(x, y, z, K.log, Math.abs(ux) > Math.abs(uz) ? "x" : "z"); } } }
    for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) { const e = dist[z * w + x]; if (e <= step) continue;
      // the outermost ring of each course a little ragged, so the cone isn't turned on a lathe
      if (e <= step + 1.5 && rnd() < 0.18) continue;
      W.leaf(x0 + x, y, z0 + z, K.leaves); }
  }
  // the spire: a leaf on the leader's tip and a collar under it, so the top isn't a bare pole between thin courses
  W.leaf(at[0], top, at[1], K.leaves);
  for (let y = Math.max(cb, top - Math.max(3, Math.round(height * 0.3))); y < top; y++) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (y <= env.T(at[0] + dx, at[1] + dz) + 1) W.leaf(at[0] + dx, y, at[1] + dz, K.leaves);
  return cb;
}

// PALM: a bare trunk curving gently off the vertical, a knot of wood at its head with a few date clusters (cocoa) under
// it, and a spray of fronds: eight long ones rising a block, running out and drooping at the end, four short ones up
function palm(W, env, { at, base, height, kit: K, rnd }) {
  const th = Math.max(3, height - 3), a = rnd() * Math.PI * 2, lean = Math.min(2.5, th * 0.09) * rnd();
  let px = at[0], pz = at[1];
  for (let y = base + 1; y <= base + th; y++) { const f = ((y - base) / th) ** 2, x = Math.round(at[0] + Math.cos(a) * lean * f), z = Math.round(at[1] + Math.sin(a) * lean * f);
    if (x !== px || z !== pz) { W.log(x, y - 1, z, K.log); px = x; pz = z; }
    W.log(x, y, z, K.log); }
  const hy = base + th, wood = K.log.replace(/_log$/, "_wood");
  if (W.other(px, hy + 1, pz, wood, { axis: "y" })) W.logs++;
  const Rf = Math.max(3, Math.min(8, Math.round(env.R)));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (rnd() < 0.5) W.other(px + dx, hy, pz + dz, "cocoa", { age: "2", facing: dx > 0 ? "west" : dx < 0 ? "east" : dz > 0 ? "north" : "south" });
  // fronds: arcs out from the head, rising a little and then hanging (the outer ones droop a third of their length);
  // a few shorter ones stand up in the middle of the head, no higher than the tree's measured top
  const n = 11 + Math.floor(rnd() * 4), spin = rnd() * Math.PI * 2, top = base + height;
  for (let f = 0; f < n; f++) { const a = spin + (f * Math.PI * 2) / n + (rnd() - 0.5) * 0.4, ux = Math.cos(a), uz = Math.sin(a);
    const L = Rf * (0.9 + rnd() * 0.35), up = 0.3 + rnd() * 0.25, fall = 0.6 + rnd() * 0.35;
    for (let s = 0.5; s <= L; s += 0.5) { const t = s / L, y = Math.floor(hy + 1.5 + L * (up * t - fall * t * t));
      W.leaf(Math.floor(px + 0.5 + ux * s), Math.min(top, y), Math.floor(pz + 0.5 + uz * s), K.leaves); } }
  for (let f = 0; f < 5; f++) { const a = spin + f * 1.26 + 0.3, ux = Math.cos(a), uz = Math.sin(a);
    for (let s = 0.5; s <= Rf * 0.45; s += 0.5) W.leaf(Math.floor(px + 0.5 + ux * s), Math.min(top, Math.floor(hy + 1.5 + s * 0.9)), Math.floor(pz + 0.5 + uz * s), K.leaves); }
  W.leaf(px, hy + 2, pz, K.leaves);
  return hy;
}
const GROW = { broadleaf, conifer, palm };

// the kit for a tree: what the caller says (a form name, or blocks with or without a form), else from the crown's shape:
// tall and narrow is a conifer (between narrow and broad, every other big one: a park is a mix; a street tree stays
// round); the rest broadleaf, dark oak when big and spreading, now and then birch when small and slight
function chooseKit(say, { hm, wm, seed }) {
  const auto = hm >= 10 && (wm / hm < 0.4 || (hm >= 15 && wm / hm < 0.55 && seed % 2)) ? kit("spruce", "conifer")
    : hm >= 13 && wm >= 9 ? kit("dark_oak", "broadleaf") : hm < 9 && wm / hm < 0.9 && seed % 5 === 0 ? kit("birch", "broadleaf") : kit("oak", "broadleaf");
  if (!say) return auto;
  if (typeof say === "string") return say === "palm" ? kit("jungle", "palm") : say === "conifer" ? kit("spruce", "conifer") : say === "broadleaf" ? (auto.form === "broadleaf" ? auto : kit("oak", "broadleaf")) : auto;
  const form = say.form ?? (/spruce/.test(say.log ?? say.leaves ?? "") ? "conifer" : auto.form);
  const base = form === auto.form ? auto : form === "palm" ? kit("jungle", "palm") : form === "conifer" ? kit("spruce", "conifer") : kit("oak", "broadleaf");
  return { form, log: say.log ?? base.log, leaves: say.leaves ?? base.leaves };
}

export function growTree(g, { at, base, height, crown = {}, species = "broadleaf", seed, fits = () => true, scale = 1.4, _W } = {}) {
  height = Math.max(3, Math.round(height)); seed = (seed ?? hash(at[0], at[1])) >>> 0;
  const rnd = rng(seed), form0 = typeof species === "string" ? species : species?.form ?? "broadleaf";
  const radius = crown.radius ?? Math.max(2, Math.round(height * (form0 === "conifer" ? 0.25 : form0 === "palm" ? 0.4 : 0.45)));
  const cells = crown.cells?.length ? crown.cells : shapedCrown(at, base, height, radius, form0), env = envelope(cells);
  const hm = height / scale, wm = 2 * Math.sqrt(cells.length / Math.PI) / scale, K = chooseKit(species, { hm, wm, seed });
  const W = _W ?? writer(g, fits), l0 = W.logs, f0 = W.leaves;
  GROW[K.form](W, env, { at, base, height, kit: K, rnd });
  return { form: K.form, log: K.log, leaves: K.leaves, logs: W.logs - l0, leafCount: W.leaves - f0 };
}

export function canopyTrees(g, { chm, n, ground, open = () => true, minHeight = 3, species = () => null, scale = 1 } = {}) {
  const H = (x, z) => (x < 0 || z < 0 || x >= n || z >= n ? 0 : chm[z * n + x]), minH = minHeight * scale;
  const b = (m) => Math.max(1, Math.round(m * scale));   // metres -> whole blocks (scale may be fractional)
  const canopy = (x, z) => H(x, z) >= minH && open(x, z);
  // treetops: the highest cell within a radius that grows with the tree (ties go to the first in scan order)
  const tops = [];
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const h = H(x, z); if (h < minH + b(1) || !canopy(x, z)) continue;
    const r = Math.max(b(2), Math.min(b(5), Math.round(h * 0.15))); let peak = true;
    for (let dz = -r; dz <= r && peak; dz++) for (let dx = -r; dx <= r; dx++) {
      if ((dx || dz) && dx * dx + dz * dz <= r * r) { const o = H(x + dx, z + dz); if (o > h || (o === h && (dz < 0 || (dz === 0 && dx < 0)))) { peak = false; break; } } }
    if (peak) tops.push({ at: [x, z], height: Math.round(h), crown: 0 });
  }
  // every canopy cell to its nearest treetop within reach (a crown no wider than the tree is tall)
  const owner = new Int32Array(n * n).fill(-1), best = new Float32Array(n * n).fill(Infinity), cells = tops.map(() => []);
  tops.forEach((t, k) => { const reach = Math.max(b(3), Math.min(b(9), Math.round(t.height * 0.45)));
    for (let dz = -reach; dz <= reach; dz++) for (let dx = -reach; dx <= reach; dx++) {
      const x = t.at[0] + dx, z = t.at[1] + dz, d = dx * dx + dz * dz; if (d > reach * reach || !canopy(x, z)) continue;
      if (d < best[z * n + x]) { best[z * n + x] = d; owner[z * n + x] = k; } } });
  // the envelope of each crown: its cells, each with the canopy's top there (on that cell's own ground: slopes)
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) { const k = owner[z * n + x]; if (k >= 0) cells[k].push([x, z, ground(x, z) + Math.min(Math.round(H(x, z)), tops[k].height)]); }
  // a crown hangs only over its own cells (and the open ground: no leaves inside a building's hollow mass)
  let mine = null; const W = writer(g, (x, z) => mine(x, z));
  tops.forEach((t, k) => {
    t.crown = cells[k].length; const [x, z] = t.at, base = ground(x, z);
    const hm = t.height / scale, wm = 2 * Math.sqrt(t.crown / Math.PI) / scale;
    const say = species(hm, { at: t.at, height: hm, width: wm, scale });
    mine = (xx, zz) => xx >= 0 && zz >= 0 && xx < n && zz < n && owner[zz * n + xx] === k;
    const r = growTree(g, { at: t.at, base, height: t.height, crown: { cells: cells[k] }, species: say ?? null, seed: hash(x, z), scale, _W: W });
    Object.assign(t, { form: r.form, log: r.log, leaves: r.leaves });
  });
  return { trees: tops, leaves: W.leaves, logs: W.logs };
}
