// global plot packing: every axis-aligned 12x14 plot whose gate (middle of the front) reaches a street within `reach`
// blocks straight out, pad level chosen within -2..+3 of the street, greedy by earth moved + setback
import { rampLength, rampProfile } from "./access.mjs";
export function packPlots(site, streets, { wide = 12, deep = 14, reach = 10, keepOut = [], blocked = () => false, maxCut = 7, maxFill = 5, gap = 1, wSet = 12, wOff = 15, runs = 400 } = {}) {
  const { X, Z, H, water, hole, built } = site;
  const road = new Map(); for (const st of streets) for (const c of st.cells) road.set(`${c.x},${c.z}`, c);
  const blk = (x, z) => x < 0 || z < 0 || x >= X || z >= Z || water[z][x] || hole(x, z) || built[z][x] || road.has(`${x},${z}`) || blocked(x, z) || keepOut.some((k) => x >= k[0] && x <= k[2] && z >= k[1] && z <= k[3]);
  const B = []; for (let z = 0; z < Z; z++) { B.push(new Uint8Array(X)); for (let x = 0; x < X; x++) B[z][x] = blk(x, z) ? 1 : 0; }
  // prefix sums of blocked cells for O(1) rectangle tests
  const S = Array.from({ length: Z + 1 }, () => new Int32Array(X + 1));
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) S[z + 1][x + 1] = B[z][x] + S[z][x + 1] + S[z + 1][x] - S[z][x];
  const blockedIn = (x0, z0, x1, z1) => x0 < 0 || z0 < 0 || x1 >= X || z1 >= Z || S[z1 + 1][x1 + 1] - S[z0][x1 + 1] - S[z1 + 1][x0] + S[z0][x0] > 0;
  const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
  const cands = [];
  for (const face of Object.keys(OUT)) { const [w, d] = face === "north" || face === "south" ? [wide, deep] : [deep, wide], [ox, oz] = OUT[face];
    for (let z0 = 0; z0 + d <= Z; z0++) for (let x0 = 0; x0 + w <= X; x0++) { const x1 = x0 + w - 1, z1 = z0 + d - 1;
      if (blockedIn(x0, z0, x1, z1)) continue;
      // two gate cells in the middle of the front; walk straight out to the street
      const m = (wide >> 1) - 1; /* the gate: the two cells in the middle of the front */
      const g = face === "north" ? [[x0 + m, z0 - 1], [x0 + m + 1, z0 - 1]] : face === "south" ? [[x0 + m, z1 + 1], [x0 + m + 1, z1 + 1]] : face === "west" ? [[x0 - 1, z0 + m], [x0 - 1, z0 + m + 1]] : [[x1 + 1, z0 + m], [x1 + 1, z0 + m + 1]];
      let hit = null, k = 0;
      for (; k < reach; k++) { const a = road.get(`${g[0][0] + ox * k},${g[0][1] + oz * k}`), b = road.get(`${g[1][0] + ox * k},${g[1][1] + oz * k}`); if (a || b) { hit = a ?? b; break; } const [ax, az] = [g[0][0] + ox * k, g[0][1] + oz * k]; if (ax < 0 || az < 0 || ax >= X || az >= Z || water[az][ax] || hole(ax, az)) break; }
      if (!hit) continue;
      const rY = Math.round(hit.y * 2) / 2; let pick = null;
      for (let off = -3; off <= 3; off += 1) { const pad = Math.round(rY) + off, dy = pad - rY;
        if (rampLength(dy) > k) continue;                                // the driveway's ramp must fit between street and gate
        let cut = 0, fill = 0, dc = 0, df = 0;
        for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { const h = H[z][x]; if (h > pad) { cut += h - pad; dc = Math.max(dc, h - pad); } else { fill += pad - h; df = Math.max(df, pad - h); } }
        if (dc > maxCut || df > maxFill) continue; const cost = cut + fill + wOff * Math.abs(dy) + wSet * k; if (!pick || cost < pick.cost) pick = { pad, dy, cut, fill, dc, df, cost }; }
      if (!pick) continue;
      cands.push({ x0, z0, x1, z1, face, road: rY, setback: k, gate: g[0], ...pick, ramp: rampProfile(rY, pick.pad, k) }); } }
  // maximise the number of plots, then minimise earth: randomised greedy restarts (cost order perturbed)
  const OUTv = OUT; let best = null, seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let run = 0; run < runs; run++) {
    const order = cands.map((c) => [c.cost * (run === 0 ? 1 : 0.4 + 1.2 * rnd()), c]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
    const occ = new Uint8Array(X * Z), chosen = [];
    for (const c of order) { let free = true;
      for (let z = Math.max(0, c.z0 - gap); z <= Math.min(Z - 1, c.z1 + gap) && free; z++) for (let x = Math.max(0, c.x0 - gap); x <= Math.min(X - 1, c.x1 + gap); x++) if (occ[z * X + x] === 1 || (occ[z * X + x] === 2 && x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1)) { free = false; break; }
      const [ox, oz] = OUTv[c.face];
      if (free) for (let k = 0; k < c.setback; k++) if (occ[(c.gate[1] + oz * k) * X + c.gate[0] + ox * k] === 1) free = false;
      if (!free) continue;
      for (let z = c.z0; z <= c.z1; z++) for (let x = c.x0; x <= c.x1; x++) occ[z * X + x] = 1;
      for (let k = 0; k < c.setback; k++) for (const d of [-1, 0, 1, 2]) { const x = c.gate[0] + ox * k + (oz ? d : 0), z = c.gate[1] + oz * k + (ox ? d : 0); if (x >= 0 && z >= 0 && x < X && z < Z && !occ[z * X + x]) occ[z * X + x] = 2; }
      chosen.push(c); }
    const earth = chosen.reduce((a, c) => a + c.cost, 0);
    if (!best || chosen.length > best.chosen.length || (chosen.length === best.chosen.length && earth < best.earth)) best = { chosen, earth };
  }
  const chosen = best.chosen.map((c) => { let wall = 0;
    for (let x = c.x0; x <= c.x1; x++) for (const z of [c.z0, c.z1]) { const e = Math.abs(H[z][x] - c.pad); if (e >= 2) wall += e; }
    for (let z = c.z0 + 1; z < c.z1; z++) for (const x of [c.x0, c.x1]) { const e = Math.abs(H[z][x] - c.pad); if (e >= 2) wall += e; }
    return { ...c, wall }; });
  return chosen;
}
