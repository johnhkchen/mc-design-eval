// the Seattle Center place's buildings no kit covers yet: box, base, height, centre lon/lat, record, a footprint map
import { readFileSync, writeFileSync } from "node:fs";
import { frameFor } from "../../src/frame.mjs";
const place = JSON.parse(readFileSync("places/seattle/space-needle.json", "utf8"));
const m = JSON.parse(readFileSync("out/seattle/space-needle/manifest.json", "utf8"));
const c = JSON.parse(readFileSync("places/seattle/space-needle.compose.json", "utf8"));
const f = frameFor(place), placed = new Set(c.placements.map((p) => p.building)), out = [];
for (const b of m.buildings) { if (placed.has(b.id)) continue;
  const xs = b.footprint.map((p) => p[0]), zs = b.footprint.map((p) => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), x1 = Math.max(...xs), z1 = Math.max(...zs);
  const set = new Set(b.footprint.map(([x, z]) => `${x},${z}`)), k = Math.max(1, Math.ceil(Math.max(x1 - x0, z1 - z0) / 40)); const rows = [];
  for (let z = z0; z <= z1; z += k) { let s = ""; for (let x = x0; x <= x1; x += k) s += set.has(`${x},${z}`) ? "#" : "."; rows.push(s); }
  const [lon, lat] = f.lonLat((x0 + x1) / 2, (z0 + z1) / 2);
  out.push({ id: b.id, box: [x0, z0, x1, z1], size: [x1 - x0 + 1, z1 - z0 + 1], base: b.base, heightBlocks: b.top - b.base, centre: [+lat.toFixed(6), +lon.toFixed(6)],
    parcel: b.parcel, name: b.name, record: b.record ?? null, mapScale: `1 char = ${k}x${k} blocks`, map: rows.join("\n") }); }
writeFileSync("work/seattle-fill/leftovers.json", JSON.stringify(out, null, 1));
console.log(out.map((o) => `${o.id} ${o.size.join("x")} h${o.heightBlocks} ${o.centre.join(",")} ${o.name ?? ""}`).join("\n"));
