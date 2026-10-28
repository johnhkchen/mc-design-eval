// Farm layout on real terrain: the algorithm alone, no Minecraft and no I/O, so it ports (Rust, Java) or runs as is.
// In: a height grid (blocks, row-major z * X + x, NaN where unknown is fine after filling) and a water mask.
// Out: per cell, its parcel (-1 for lanes and water), the lanes, the farmstead lot, each parcel's land use and crops.
//   parcels   seeds jittered on a ~26-block grid; each cell joins the nearest seed by a distance that counts height
//             three times over, d² = dx² + dz² + 9·dh², so parcels stretch along the contours (bocage fields do)
//   lanes     least-cost paths (Dijkstra, 8-connected) whose step cost is 1 + 40·climb², so lanes wind round the
//             slopes rather than over them, avoid water, and share each other's line where they meet
//   farmstead the flattest 21 x 20 patch near the middle, off the water: its own parcel, a lane to its gate
//   use       by rank of mean slope, so any terrain gets the mix: steepest 8% woodland, next 14% pasture, the next
//             band orchard where it faces south (terraces or pasture where it doesn't), the valley floor (mean
//             distance to water < 10) meadow, the rest arable
//   crops     each arable parcel 2 to 4 crops, chosen per band of 3 blocks of height, so strips follow the contours
//   import { farmLayout } from "./layout.mjs";   const L = farmLayout({ top, water, X, Z, seed: 7 });
export function farmLayout({ top, water, X, Z, seed: SEED = 7 }) {
  const hash = (...n) => { let h = 2166136261 ^ SEED; for (const v of n) { h ^= v + 0x9e3779b9; h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return ((h >>> 0) % 100000) / 100000; };
  const blur = (a, r) => { const b = new Float32Array(X * Z); for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) { let s = 0, n = 0; for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) continue; s += a[zz * X + xx]; n++; } b[z * X + x] = s / n; } return b; };
  const Hs = blur(blur(top, 2), 2);                      // smooth (the stream keeps its own cells)
  const H = (x, z) => Math.round(Hs[z * X + x]);
  const slope = (x, z) => { const a = Hs[z * X + Math.min(X - 1, x + 1)] - Hs[z * X + Math.max(0, x - 1)], b = Hs[Math.min(Z - 1, z + 1) * X + x] - Hs[Math.max(0, z - 1) * X + x]; return Math.hypot(a, b) / 2; };
  const southness = (x, z) => -(Hs[Math.min(Z - 1, z + 1) * X + x] - Hs[Math.max(0, z - 1) * X + x]) / 2;   // > 0: falls to the south (faces the sun)
  // the stream: its cells, widened by one, and each cell's distance to water
  const wet = new Uint8Array(X * Z); for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (water[z * X + x]) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < X && zz < Z) wet[zz * X + xx] = 1; }
  const dWater = new Float32Array(X * Z).fill(1e9); { const q = []; for (let i = 0; i < X * Z; i++) if (wet[i]) { dWater[i] = 0; q.push(i); } for (let h = 0; h < q.length; h++) { const i = q[h], x = i % X, z = (i / X) | 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) continue; const j = zz * X + xx; if (dWater[j] > dWater[i] + 1) { dWater[j] = dWater[i] + 1; q.push(j); } } } }

  // ---- 2. tracks: least-slope paths (Dijkstra on a cost that hates climbing) between points on the edges
  const road = new Uint8Array(X * Z);
  function track(a, b) {
    const dist = new Float64Array(X * Z).fill(Infinity), prev = new Int32Array(X * Z).fill(-1), done = new Uint8Array(X * Z);
    const heap = [[0, a]]; dist[a] = 0;
    const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k && heap[(k - 1) >> 1][0] > heap[k][0]) { [heap[k], heap[(k - 1) >> 1]] = [heap[(k - 1) >> 1], heap[k]]; k = (k - 1) >> 1; } };
    const pop = () => { const t = heap[0], l = heap.pop(); if (heap.length) { heap[0] = l; let k = 0; for (;;) { let m = k; const L = 2 * k + 1, R = L + 1; if (L < heap.length && heap[L][0] < heap[m][0]) m = L; if (R < heap.length && heap[R][0] < heap[m][0]) m = R; if (m === k) break; [heap[k], heap[m]] = [heap[m], heap[k]]; k = m; } } return t; };
    while (heap.length) {
      const [d, i] = pop(); if (done[i]) continue; done[i] = 1; if (i === b) break;
      const x = i % X, z = (i / X) | 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const xx = x + dx, zz = z + dz; if (xx < 1 || zz < 1 || xx >= X - 1 || zz >= Z - 1) continue;
        const j = zz * X + xx, climb = Math.abs(Hs[j] - Hs[i]), step = Math.hypot(dx, dz);
        const c = step * (1 + 40 * climb * climb) + (wet[j] ? 30 : 0) + (road[j] ? -0.5 * step : 0);
        if (d + c < dist[j]) { dist[j] = d + c; prev[j] = i; push(d + c, j); }
      }
    }
    for (let i = b; i !== -1; i = prev[i]) { const x = i % X, z = (i / X) | 0; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < X && zz < Z && !wet[zz * X + xx]) road[zz * X + xx] = 1; } }
  }
  const edge = (t) => { t = ((t % 4) + 4) % 4; const s = Math.floor((t % 1) * (X - 3)) + 1; return t < 1 ? 1 * X + s : t < 2 ? s * X + (X - 2) : t < 3 ? (Z - 2) * X + s : s * X + 1; };
  // the farmstead: the flattest 21 x 20 patch near the middle, off the water
  let farm = null; { let best = Infinity; for (let z = 40; z < Z - 60; z += 3) for (let x = 40; x < X - 60; x += 3) { let s = 0, w = 0; for (let dz = 0; dz < 20; dz += 2) for (let dx = 0; dx < 21; dx += 2) { s += slope(x + dx, z + dz); w += wet[(z + dz) * X + x + dx]; } const score = s + w * 10 + 0.002 * ((x - X / 2) ** 2 + (z - Z / 2) ** 2); if (score < best) { best = score; farm = [x, z]; } } }
  const farmGate = (farm[1] + 20) * X + farm[0] + 10;
  track(edge(0.15), edge(2.85)); track(edge(1.4), edge(3.55)); track(farmGate, edge(2.2));

  // ---- 3. parcels: an elevation-weighted Voronoi of jittered seeds
  const seeds = []; const SP = 26;
  for (let gz = 0; gz < Z; gz += SP) for (let gx = 0; gx < X; gx += SP) { const x = Math.min(X - 1, gx + Math.floor(hash(gx, gz, 1) * SP)), z = Math.min(Z - 1, gz + Math.floor(hash(gx, gz, 2) * SP)); seeds.push([x, z, Hs[z * X + x]]); }
  const parcel = new Int32Array(X * Z).fill(-1);
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const i = z * X + x; if (road[i] || wet[i]) continue;
    let best = Infinity, k = -1; const h = Hs[i];
    for (let s = 0; s < seeds.length; s++) { const [sx, sz, sh] = seeds[s], d = (x - sx) ** 2 + (z - sz) ** 2 + 9 * (h - sh) ** 2; if (d < best) { best = d; k = s; } }
    parcel[i] = k;
  }
  // the farmstead's lot is its own parcel
  const FARM = seeds.length; for (let z = farm[1]; z < farm[1] + 20; z++) for (let x = farm[0]; x < farm[0] + 21; x++) parcel[z * X + x] = FARM;
  // each parcel's terrain, and its use
  const stats = new Map();
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) { const p = parcel[z * X + x]; if (p < 0) continue; const s = stats.get(p) || { n: 0, slope: 0, south: 0, h: 0, dw: 0 }; s.n++; s.slope += slope(x, z); s.south += southness(x, z); s.h += Hs[z * X + x]; s.dw += Math.min(dWater[z * X + x], 60); stats.set(p, s); }
  const hMin = Math.min(...Hs), hMax = Math.max(...Hs);
  // land use by rank, so a gentle land still gets its pastures and woods: the steepest parcels woodland, then pasture;
  // the next band orchard where it faces south, terraces where it doesn't; the valley floor meadow; the rest arable
  const use = new Map(), list = [];
  for (const [p, s] of stats) if (p !== FARM) list.push({ p, sl: s.slope / s.n, so: s.south / s.n, dw: s.dw / s.n, rel: (s.h / s.n - hMin) / (hMax - hMin) });
  use.set(FARM, "farmstead");
  list.sort((a, b) => b.sl - a.sl);
  list.forEach((o, k) => {
    const q = k / list.length; let u;
    if (o.dw < 10 && q > 0.5) u = "meadow";
    else if (q < 0.08) u = "woodland";
    else if (q < 0.22) u = "pasture";
    else if (q < 0.45) u = o.so > 0 ? "orchard" : hash(o.p, 21) < 0.5 ? "terraces" : "pasture";
    else u = o.rel > 0.75 && hash(o.p, 9) < 0.3 ? "pasture" : "arable";
    use.set(o.p, u);
  });
  // each arable parcel's crops: 2 or 3, in contour bands
  // each arable parcel's crops: wheat and one or two others, alternating band by band so the contours show
  const CROPS = [["wheat", 7], ["carrots", 7], ["potatoes", 7], ["beetroots", 3]];
  const cropsOf = (p) => { const o = [CROPS[0], CROPS[1 + Math.floor(hash(p, 4) * 3)]]; if (hash(p, 3) < 0.35) o.push(CROPS[0]), o.push(CROPS[1 + Math.floor(hash(p, 5) * 3)]); return o; };


  return { Hs, H, slope, southness, wet, dWater, road, parcel, FARM, farm, stats, use, cropsOf, hMin, hMax, hash };
}
