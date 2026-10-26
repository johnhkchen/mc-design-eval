#!/usr/bin/env node
// The buildings a camera sees, for a fill run: footprints whose centre lies in the view's horizontal wedge (the field of
// view plus a margin) between two distances, the most prominent first (height x the square root of the footprint area,
// nearer counting more), leaving out those a compose placement already covers.
//   node bin/pick-visible.mjs <place> --eye x,z --look x,z --hfov 30 [--near 30] [--far 5000] [--max 400] [--min-cells 20]
//     -> the ids, comma-separated, on stdout (for fill.mjs --only)
import { readFileSync, existsSync } from "node:fs";
const argv = process.argv.slice(2), opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d), P = argv[0];
const m = JSON.parse(readFileSync(`out/${P}/manifest.json`, "utf8")), cf = `places/${P}.compose.json`;
const covered = new Set((existsSync(cf) ? JSON.parse(readFileSync(cf, "utf8")).placements : []).flatMap((p) => [p.building, ...(p.covers ?? [])]));
const [ex, ez] = opt("--eye").split(",").map(Number), [lx, lz] = opt("--look").split(",").map(Number), half = (+opt("--hfov", 30) / 2 + 3) * Math.PI / 180;
const near = +opt("--near", 30), far = +opt("--far", 5000), max = +opt("--max", 400), minCells = +opt("--min-cells", 20), dir = Math.atan2(lz - ez, lx - ex);
const out = [];
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
