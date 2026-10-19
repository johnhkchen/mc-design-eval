// USGS 3D Elevation Program lidar (public domain, US): the point cloud itself, read from the public Entwine (EPT)
// bucket a tile at a time (each tile a LAZ file; laz-perf decodes it). The San Francisco collection (CA_SanFrancisco_1_B23,
// flown 2023) classifies ground (2), water (9) and noise; buildings and trees are left unclassified, so they're told
// apart later by the building footprints. Sampled onto the place's grid, three rasters (metres):
//   ground    mean ground (class 2) elevation per cell, holes (under buildings) relaxed from their surroundings
//   surface   highest non-ground, non-noise return per cell (roofs, domes, trees, anything standing)
//   count     returns per cell (how sure the surface is)
import { createLazPerf } from "laz-perf";

const COLLECTIONS = [{ id: "CA_SanFrancisco_1_B23", covers: (p) => p.city === "san-francisco" },
  { id: "WA_KingCo_1_2021", covers: (p) => p.city === "seattle" },       // King County west half, QL1, flown 2021
  { id: "NY_NewYorkCity", covers: (p) => p.city === "new-york" },        // the five boroughs, flown 2017 (topobathymetric)
  { id: "USGS_LPC_MD_VA_Sandy_NCR_2014_LAS_2015", covers: (p) => p.city === "washington-dc" }];  // the National Capital Region after Sandy, flown 2014
const BASE = "https://usgs-lidar-public.s3.amazonaws.com";
const NOISE = new Set([7, 18]), GROUND = 2, WATER = 9;

async function json(url) { const r = await fetch(url); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); }

// the EPT tiles (D-X-Y-Z) whose XY box meets ours, down to the finest that has points
async function tiles(base, ept, want) {
  const [x0, y0, , x1] = ept.bounds, size = x1 - x0, out = [];
  const meets = (k) => { const [d, x, y] = k.split("-").map(Number), s = size / 2 ** d, bx = x0 + x * s, by = y0 + y * s;
    return bx < want.east && bx + s > want.west && by < want.north && by + s > want.south; };
  async function walk(file) {
    const h = await json(`${base}/ept-hierarchy/${file}.json`);
    for (const [k, n] of Object.entries(h)) { if (!meets(k)) continue; if (n === -1) await walk(k); else if (n > 0) out.push(k); }
  }
  await walk("0-0-0-0");
  return out;
}

export default [{
  id: "usgs-lidar", layers: ["lidar"], name: "USGS 3DEP lidar point cloud", licence: "Public domain (US Government work)",
  attribution: "U.S. Geological Survey, 3D Elevation Program", url: "https://registry.opendata.aws/usgs-lidar/",
  covers: (p) => COLLECTIONS.some((c) => c.covers(p)),
  async fetch(place, frame) {
    const col = COLLECTIONS.find((c) => c.covers(place));
    const { N, box, merc, toBlock } = frame;
    const [w, s] = merc(box.west, box.south), [e, n] = merc(box.east, box.north);
    const L = await createLazPerf();
    // Web Mercator back to lon/lat, then to the block grid
    const R = 6378137, lonLat = (X, Y) => [(X / R) * (180 / Math.PI), (2 * Math.atan(Math.exp(Y / R)) - Math.PI / 2) * (180 / Math.PI)];
    let points = 0, bytes = 0;
    // one collection's returns over the box, binned on the grid
    async function collect(id) {
      const base = `${BASE}/${id}`, ept = await json(`${base}/ept.json`), keys = await tiles(base, ept, { west: w, south: s, east: e, north: n });
      const gSum = new Float64Array(N * N), gN = new Uint32Array(N * N), top = new Float32Array(N * N).fill(-Infinity), cnt = new Uint32Array(N * N), wN = new Uint32Array(N * N);
      let done = 0;
      async function one(key) {
        const r = await fetch(`${base}/ept-data/${key}.laz`); if (!r.ok) throw new Error(`${key}: ${r.status}`);
        const buf = new Uint8Array(await r.arrayBuffer()); bytes += buf.length;
        const dv = new DataView(buf.buffer), fmt = dv.getUint8(104) & 0x3f;
        const sc = [131, 139, 147].map((o) => dv.getFloat64(o, true)), of = [155, 163, 171].map((o) => dv.getFloat64(o, true));
        const fp = L._malloc(buf.length); L.HEAPU8.set(buf, fp); const z = new L.LASZip(); z.open(fp, buf.length);
        const count = z.getCount(), pl = z.getPointLength(), pp = L._malloc(pl);
        for (let i = 0; i < count; i++) {
          z.getPoint(pp); const v = new DataView(L.HEAPU8.buffer, pp, pl);
          const X = v.getInt32(0, true) * sc[0] + of[0], Y = v.getInt32(4, true) * sc[1] + of[1];
          if (X < w || X >= e || Y < s || Y >= n) continue;
          const c = fmt >= 6 ? v.getUint8(16) : v.getUint8(15) & 31; if (NOISE.has(c)) continue;
          const [bx, bz] = toBlock(...lonLat(X, Y)), x = Math.floor(bx), zz = Math.floor(bz); if (x < 0 || zz < 0 || x >= N || zz >= N) continue;
          const Z = v.getInt32(8, true) * sc[2] + of[2], k = zz * N + x; points++; cnt[k]++;
          if (c === GROUND || c === WATER) { gSum[k] += Z; gN[k]++; if (c === WATER) wN[k]++; } else if (Z > top[k]) top[k] = Z;
        }
        z.delete(); L._free(fp); L._free(pp); done++;
        if (done % 25 === 0) process.stderr.write(`  lidar ${id} ${done}/${keys.length} tiles, ${(bytes / 1e6).toFixed(0)} MB\n`);
      }
      for (let i = 0; i < keys.length; i += 8) await Promise.all(keys.slice(i, i + 8).map(one));
      return { gSum, gN, top, cnt, wN, tiles: keys.length };
    }
    const A = await collect(col.id), { gSum, gN, top, cnt } = A;
    // place.lidarFill: older collections that reach where the main one stops (the SF flight ends at the Golden Gate; Marin
    // is in the 2010 Golden Gate survey). They only fill cells the main collection has no returns in, levelled to it by the
    // median difference of the ground where both have it (a different vertical datum, or a decade of change)
    for (const id of place.lidarFill ?? []) {
      const B = await collect(id), d = [];
      for (let i = 0; i < N * N; i++) if (gN[i] && B.gN[i]) d.push(gSum[i] / gN[i] - B.gSum[i] / B.gN[i]);
      d.sort((p, q) => p - q); const off = d.length ? d[d.length >> 1] : 0; let filled = 0;
      // a cell the older survey saw mostly water in is sea, whatever the tide was that day (its water and wave returns read
      // a metre or two up and would stand as reefs); where the main collection saw something (a bridge deck) but no ground, the
      // older survey's ground goes under it (else the ground there is relaxed flat from far away)
      for (let i = 0; i < N * N; i++) {
        if (!B.cnt[i]) continue; const sea = B.wN[i] && B.wN[i] * 2 >= B.gN[i];
        const filledNow = !cnt[i];
        if (filledNow) { cnt[i] = B.cnt[i]; top[i] = Number.isFinite(B.top[i]) ? B.top[i] + off : -Infinity; filled++; }
        else if (gN[i]) continue;
        if (sea) { gN[i] = 1; gSum[i] = -0.5; if (filledNow) top[i] = -Infinity; } else if (B.gN[i]) { gN[i] = B.gN[i]; gSum[i] = B.gSum[i] + off * B.gN[i]; } }
      process.stderr.write(`  lidar ${id}: ${filled.toLocaleString()} cells filled, levelled by ${off.toFixed(2)} m (${d.length.toLocaleString()} cells in common)\n`);
    }
    const keys = { length: A.tiles };
    // ground: the cells with ground returns fixed, the rest (under roofs and canopy) relaxed between them
    const ground = new Float32Array(N * N), fixed = new Uint8Array(N * N); let mean = 0, nf = 0;
    for (let i = 0; i < N * N; i++) if (gN[i]) { ground[i] = gSum[i] / gN[i]; fixed[i] = 1; mean += ground[i]; nf++; }
    mean /= nf || 1; for (let i = 0; i < N * N; i++) if (!fixed[i]) ground[i] = mean;
    for (let it = 0; it < 1500; it++) for (let zz = 0; zz < N; zz++) for (let x = 0; x < N; x++) { const i = zz * N + x; if (fixed[i]) continue;
      let sum = 0, m = 0; if (x > 0) { sum += ground[i - 1]; m++; } if (x < N - 1) { sum += ground[i + 1]; m++; } if (zz > 0) { sum += ground[i - N]; m++; } if (zz < N - 1) { sum += ground[i + N]; m++; }
      ground[i] += 1.85 * (sum / m - ground[i]); }
    for (let i = 0; i < N * N; i++) if (!Number.isFinite(top[i])) top[i] = ground[i];
    process.stderr.write(`  lidar: ${keys.length} tiles, ${(bytes / 1e6).toFixed(0)} MB, ${points.toLocaleString()} points in the box\n`);
    return { lidar: { kind: "rasters", n: N, rasters: { ground, surface: top, count: new Float32Array(cnt) }, collection: col.id, points } };
  },
}];
