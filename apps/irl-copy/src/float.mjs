// Floating structures in a composed place: every block reached from the ground through touching blocks (faces, edges or
// corners: a voxel arch or a bridge cable steps diagonally, and a tree's leaves on a roof or a piling in the bay count) stands; anything else hangs in the air. A module set on the wrong
// base, a kit whose own bottom course is missing, a mass left over a cleared footprint: each shows as a component here.
//   floating(g, { ground, min, faces }) -> [{ cells, size, box: [x0, y0, z0, x1, y1, z1], gap }]   (largest first)
//   settle(g, comp) drops one component by its gap (the air under its lowest blocks) onto what is below.
export function floating(g, { ground, min = 8, faces = true }) {
  // faces: joined only through faces (a block one course clear of the roof is loose); faces: false, any touch (a dome's
  // rings stepping in diagonally hold together)
  const [X, Y, Z] = g.size, d = g.data, seen = new Uint8Array(d.length), stack = new Int32Array(1 << 24);
  const at = (x, y, z) => (z * Y + y) * X + x;
  let top = 0;
  const flood = (start, out) => {
    // grows its own stack when a component outruns the fixed one
    let s = stack, n = 0; s[n++] = start; seen[start] = 1;
    while (n) { const i = s[--n]; if (out) out.push(i);
      const x = i % X, r = (i / X) | 0, y = r % Y, z = (r / Y) | 0;
      for (let dz = -1; dz <= 1; dz++) { const zz = z + dz; if (zz < 0 || zz >= Z) continue;
        for (let dy = -1; dy <= 1; dy++) { const yy = y + dy; if (yy < 0 || yy >= Y) continue;
          for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx < 0 || xx >= X) continue;
            if (faces && Math.abs(dx) + Math.abs(dy) + Math.abs(dz) !== 1) continue;
            const j = (zz * Y + yy) * X + xx; if (seen[j] || !d[j]) continue; seen[j] = 1;
            if (n >= s.length) { const t = new Int32Array(s.length * 2); t.set(s); s = t; } s[n++] = j; } } } }
  };
  // the ground: each column's surface block and everything under it
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const gy = Math.min(Y - 1, ground(x, z));
    for (let y = 0; y <= gy; y++) { const i = at(x, y, z); if (d[i] && !seen[i]) flood(i, null); } }
  const out = [];
  for (let i = 0; i < d.length; i++) {
    if (!d[i] || seen[i]) continue;
    const cells = []; flood(i, cells); if (cells.length < min) continue;
    let x0 = X, y0 = Y, z0 = Z, x1 = 0, y1 = 0, z1 = 0; const inC = new Set(cells);
    let gap = Infinity;
    for (const c of cells) { const x = c % X, r = (c / X) | 0, y = r % Y, z = (r / Y) | 0;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
      if (inC.has(c - X)) continue;           // only the component's undersides
      let k = 0; while (y - k - 1 >= 0 && !d[c - (k + 1) * X]) k++; gap = Math.min(gap, k); }
    out.push({ cells, size: cells.length, box: [x0, y0, z0, x1, y1, z1], gap });
    top = Math.max(top, cells.length);
  }
  return out.sort((a, b) => b.size - a.size);
}

/** Prop a floating component up where it nearly touches: under each of its lowest blocks that is at most `reach` above
 *  something, the gap is filled with that block if it is a full cube, else with the piece's commonest full cube (a tower
 *  set one block over its podium, a skylight over its roof, a chimney short of the roof). Taller gaps (an arch's crown,
 *  a cable's sag) are left alone. Returns the blocks added. */
export function underpin(g, comp, { reach = 6 } = {}) {
  const [X] = g.size, d = g.data, inC = new Set(comp.cells), PART = /stairs|slab|pane|bars|fence|wall|door|trapdoor|lantern|torch|sign|banner|carpet|button|lever|chain|rod|candle|flower|leaves|button|plate|rail|ladder|vine|head|skull|pot/;
  const full = (v) => v && !PART.test(g.palette[v].block);
  const tally = new Map(); for (const c of comp.cells) if (full(d[c])) tally.set(d[c], (tally.get(d[c]) ?? 0) + 1);
  const common = [...tally].sort((a, b) => b[1] - a[1])[0]?.[0]; let n = 0;
  for (const c of comp.cells) { if (inC.has(c - X)) continue;
    const y = ((c / X) | 0) % g.size[1]; let k = 0; while (y - k - 1 >= 0 && !d[c - (k + 1) * X]) k++;
    // only down onto something else: a floor over the piece's own storey below is an interior, not a gap
    if (!k || k > reach || y - k - 1 < 0 || inC.has(c - (k + 1) * X)) continue;
    const v = full(d[c]) ? d[c] : common ?? (full(d[c - (k + 1) * X]) ? d[c - (k + 1) * X] : 0); if (!v) continue;
    for (let j = 1; j <= k; j++) { d[c - j * X] = v; n++; } }
  return n;
}

/** Drop a floating component straight down by its gap, onto whatever is under its lowest blocks. */
export function settle(g, comp) {
  const [X] = g.size, d = g.data, k = comp.gap; if (!k || !Number.isFinite(k)) return 0;
  const sorted = [...comp.cells].sort((a, b) => a - b);      // low y first within a column (y is the middle index)
  const v = sorted.map((c) => d[c]); for (const c of sorted) d[c] = 0;
  sorted.forEach((c, n) => { d[c - k * X] = v[n]; });
  return k;
}
