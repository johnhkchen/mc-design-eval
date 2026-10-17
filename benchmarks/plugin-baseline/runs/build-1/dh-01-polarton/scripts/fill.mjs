import { rampLength, rampProfile } from "./access.mjs";
// second pass: smaller plots in the space left over, typed by what the ground suits
//   small build: 8x10 / 10x8, levelled pad, earth <= 70, gate on a street
//   farm: >= 9x9, ground within 2 (terraced rows), on a street
//   pasture: >= 10x10, ground within 6, follows the ground (fenced, no levelling), on a street
//   park: anything left >= 6x6 touching a street (trees kept)
export function fillPlots(site, streets, plots, { keepOut = [], reach = 6 } = {}) {
  const { X, Z, H, water, hole, built, tree } = site;
  const road = new Map(); for (const st of streets) for (const c of st.cells) road.set(`${c.x},${c.z}`, c);
  const occ = new Uint8Array(X * Z);
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (water[z][x] || hole(x, z) || built[z][x] || road.has(`${x},${z}`) || keepOut.some((k) => x >= k[0] && x <= k[2] && z >= k[1] && z <= k[3])) occ[z * X + x] = 1;
  for (const p of plots) for (let z = p.z0 - 1; z <= p.z1 + 1; z++) for (let x = p.x0 - 1; x <= p.x1 + 1; x++) if (x >= 0 && z >= 0 && x < X && z < Z) occ[z * X + x] = 1;
  const free = (x0, z0, x1, z1) => { if (x0 < 0 || z0 < 0 || x1 >= X || z1 >= Z) return false; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (occ[z * X + x]) return false; return true; };
  // a street within `reach` of any edge cell, straight out
  const street = (x0, z0, x1, z1, reach) => { let best = null;
    const tryRay = (x, z, dx, dz) => { for (let k = 0; k < reach; k++) { const xx = x + dx * k, zz = z + dz * k; const r = road.get(`${xx},${zz}`); if (r) return { r, k }; if (xx < 0 || zz < 0 || xx >= X || zz >= Z || water[zz][xx] || hole(xx, zz) || (k > 0 && occ[zz * X + xx] && !road.has(`${xx},${zz}`) && !trackOk(xx, zz))) return null; } return null; };
    for (let x = x0; x <= x1; x++) for (const [z, dz] of [[z0 - 1, -1], [z1 + 1, 1]]) { const h = tryRay(x, z, 0, dz); if (h && (!best || h.k < best.k)) best = { ...h, gate: [x, z] }; }
    for (let z = z0; z <= z1; z++) for (const [x, dx] of [[x0 - 1, -1], [x1 + 1, 1]]) { const h = tryRay(x, z, dx, 0); if (h && (!best || h.k < best.k)) best = { ...h, gate: [x, z] }; }
    return best; };
  const stats = (x0, z0, x1, z1, pad) => { let lo = 99, hi = -99, earth = 0, trees = 0; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { const h = H[z][x]; lo = Math.min(lo, h); hi = Math.max(hi, h); if (pad != null) earth += Math.abs(h - pad); if (tree[z][x]) trees++; } return { lo, hi, earth, trees }; };
  const take = (x0, z0, x1, z1) => { for (let z = z0 - 1; z <= z1 + 1; z++) for (let x = x0 - 1; x <= x1 + 1; x++) if (x >= 0 && z >= 0 && x < X && z < Z) occ[z * X + x] = 1; };
  const out = [];
  const SZ = (a, b, c, d) => { const o = []; for (let w = a; w <= b; w += 2) for (let h = c; h <= d; h += 2) o.push([w, h]); return o; };
  const trackOk = () => false;
  const pass = (kind, sizes, accept, score, reachK = reach) => { const cands = [];
    for (const [w, d] of sizes) for (let z0 = 0; z0 + d <= Z; z0++) for (let x0 = 0; x0 + w <= X; x0++) { const x1 = x0 + w - 1, z1 = z0 + d - 1; if (!free(x0, z0, x1, z1)) continue; const s = street(x0, z0, x1, z1, reachK); if (!s) continue;
      const own = (() => { const a = []; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) a.push(H[z][x]); a.sort((p, q) => p - q); return a[a.length >> 1]; })();
      const rY = Math.round(s.r.y * 2) / 2;
      const pads = kind === "small build" ? [-3, -2, -1, 0, 1, 2, 3].map((o) => Math.round(rY) + o).filter((p) => rampLength(p - rY) <= s.k) : [own]; let bestPad = null;
      for (const pad of pads) { const st = stats(x0, z0, x1, z1, pad); if (!bestPad || st.earth < bestPad.earth) bestPad = { ...st, pad }; }
      if (!bestPad) continue;
      const c = { kind, x0, z0, x1, z1, w, d, gate: s.gate, track: s.k, ramp: kind === "small build" ? rampProfile(rY, bestPad.pad, s.k) : null, road: Math.round(s.r.y), ...bestPad }; if (kind === "pasture" || kind === "park") c.earth = 0; if (accept(c)) cands.push([score(c), c]); }
    cands.sort((a, b) => a[0] - b[0]);
    for (const [, c] of cands) if (free(c.x0, c.z0, c.x1, c.z1)) { take(c.x0, c.z0, c.x1, c.z1); out.push(c); } };
  pass("small build", [[8, 10], [10, 8]], (c) => c.earth <= 70 && c.hi - c.lo <= 4, (c) => c.earth);
  pass("farm", SZ(8, 24, 8, 24), (c) => c.hi - c.lo <= 3 && c.earth <= c.w * c.d * 0.6, (c) => -c.w * c.d + c.earth + 3 * c.track, 16);
  pass("pasture", SZ(10, 28, 10, 28), (c) => c.hi - c.lo <= 9, (c) => -c.w * c.d + 3 * c.track, 24);
  pass("park", [[16, 12], [12, 16], [12, 10], [10, 12], [10, 8], [8, 10], [8, 8], [6, 8], [8, 6], [6, 6]], (c) => c.hi - c.lo <= 7, (c) => -c.w * c.d - 3 * c.trees);
  return out;
}
