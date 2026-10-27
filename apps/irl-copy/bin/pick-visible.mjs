#!/usr/bin/env node
// The buildings a camera sees, for a fill run: footprints whose centre lies in the view's horizontal wedge (the field of
// view plus a margin) between two distances, the most prominent first (height x the square root of the footprint area,
// nearer counting more), leaving out those a compose placement already covers.
//   node bin/pick-visible.mjs <place> --eye x,z --look x,z --hfov 30 [--near 30] [--far 5000] [--max 400] [--min-cells 20]
//     -> the ids, comma-separated, on stdout (for fill.mjs --only)
// With a 3-D eye and look (x,y,z), it casts the camera's rays instead: one per cell of a --rays grid (default 400x250)
// over the vertical --fov, through the world's top heights (heights.bin: buildings, trees and ground), and keeps only the
// buildings at least --min-hits rays meet first, so what hides behind a hill, a wood or a nearer block is left out.
//   node bin/pick-visible.mjs <place> --eye x,y,z --look x,y,z --fov 18 [--rays 400x250] [--min-hits 2] [--max 5000]
import { readFileSync, existsSync } from "node:fs";
const argv = process.argv.slice(2), opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d), P = argv[0];
const m = JSON.parse(readFileSync(`out/${P}/manifest.json`, "utf8")), cf = `places/${P}.compose.json`;
const covered = new Set((existsSync(cf) ? JSON.parse(readFileSync(cf, "utf8")).placements : []).flatMap((p) => [p.building, ...(p.covers ?? [])]));
const [ex, ez] = opt("--eye").split(",").map(Number), [lx, lz] = opt("--look").split(",").map(Number), half = (+opt("--hfov", 30) / 2 + 3) * Math.PI / 180;
const near = +opt("--near", 30), far = +opt("--far", 5000), max = +opt("--max", 400), minCells = +opt("--min-cells", 20), dir = Math.atan2(lz - ez, lx - ex);
const out = [];
const e3 = opt("--eye").split(",").map(Number), l3 = opt("--look").split(",").map(Number);
if (e3.length === 3 && l3.length === 3) {
  const hb = readFileSync(`out/${P}/heights.bin`), W = hb.readUInt32LE(0), D = hb.readUInt32LE(4), H = new Uint16Array(hb.buffer.slice(hb.byteOffset + 8, hb.byteOffset + 8 + W * D * 2));
  const idx = new Int32Array(W * D).fill(-1), B = m.buildings;
  B.forEach((b, k) => { if (!covered.has(b.id) && b.footprint.length >= minCells) for (const [x, z] of b.footprint) if (x >= 0 && z >= 0 && x < W && z < D) idx[z * W + x] = k; });
  const [RW, RH] = opt("--rays", "400x250").split("x").map(Number), t = Math.tan(+opt("--fov", 18) / 2 * Math.PI / 180), asp = RW / RH;
  const nrm = (v) => { const l = Math.hypot(...v); return v.map((c) => c / l); }, cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const f = nrm(l3.map((c, j) => c - e3[j])), r = nrm(cross(f, [0, 1, 0])), u = cross(r, f), hits = new Map();
  for (let py = 0; py < RH; py++) for (let px = 0; px < RW; px++) {
    const sx = ((px + 0.5) / RW * 2 - 1) * t * asp, sy = (1 - (py + 0.5) / RH * 2) * t, d = nrm([0, 1, 2].map((j) => f[j] + sx * r[j] + sy * u[j]));
    // 2-D DDA over the columns; the ray meets a column when it is at or under its top somewhere inside it
    let x = Math.floor(e3[0]), z = Math.floor(e3[2]); const stx = Math.sign(d[0]), stz = Math.sign(d[2]);
    const tdx = Math.abs(1 / d[0]), tdz = Math.abs(1 / d[2]);
    let tmx = d[0] ? ((stx > 0 ? x + 1 : x) - e3[0]) / d[0] : Infinity, tmz = d[2] ? ((stz > 0 ? z + 1 : z) - e3[2]) / d[2] : Infinity, t0 = 0;
    while (x >= 0 && z >= 0 && x < W && z < D) {
      const t1 = Math.min(tmx, tmz), i = z * W + x, y = e3[1] + d[1] * (d[1] < 0 ? t1 : t0);
      if (y <= H[i] + 1) { const k = idx[i]; if (k >= 0) hits.set(k, (hits.get(k) ?? 0) + 1); break; }
      if (d[1] > 0 && y > 600) break;
      t0 = t1; if (tmx < tmz) { x += stx; tmx += tdx; } else { z += stz; tmz += tdz; }
    }
  }
  const minHits = +opt("--min-hits", 2);
  for (const [k, n] of hits) if (n >= minHits) out.push([B[k].id, n]);
  out.sort((p, q) => q[1] - p[1]);
  process.stderr.write(`${P}: ${hits.size} unfilled buildings hit by a ray, ${out.length} by ${minHits}+, taking ${Math.min(max, out.length)}\n`);
  console.log(out.slice(0, max).map((o) => o[0]).join(","));
  process.exit(0);
}
for (const b of m.buildings) {
  if (covered.has(b.id) || b.footprint.length < minCells) continue;
  const cx = b.footprint.reduce((s, c) => s + c[0], 0) / b.footprint.length, cz = b.footprint.reduce((s, c) => s + c[1], 0) / b.footprint.length;
  const d = Math.hypot(cx - ex, cz - ez); if (d < near || d > far) continue;
  let a = Math.atan2(cz - ez, cx - ex) - dir; a = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(a) > half) continue;
  out.push([b.id, (b.height * Math.sqrt(b.footprint.length)) / Math.sqrt(d)]);
}
out.sort((p, q) => q[1] - p[1]);
process.stderr.write(`${P}: ${out.length} in view, taking ${Math.min(max, out.length)}\n`);
console.log(out.slice(0, max).map((o) => o[0]).join(","));
