// The terraformed land alone, for a schematicannon on "Replace Solid with Empty". The cannon reads every cell the
// schematic leaves out as air, so the file must hold the whole of its box, untouched blocks included. Cropped to the box
// the earthworks touch (no deep stone, no village columns), split into tiles under the server's 256 KB upload cap.
// Every cell dug or cleared is explicit air, and so are the 12 overhanging leaf cells the buildings later stand in, so
// kit-changes.nbt needs no air at all and goes on with "Replace Solid with Solid" (it never clears).
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { writeFileSync, statSync, readdirSync, unlinkSync } from "node:fs";
const here = (p) => new URL(p, import.meta.url).pathname, D = here("../delivery");
const original = load(here("../input/polarton_expansion_001_xl.nbt")), land = load(`${D}/after.nbt`), kit = load(`${D}/kit-changes.nbt`);
for (const c of original.cells.values()) { if (/air$/.test(c.block)) continue; const now = land.get(...c.pos); if (!now || /air$/.test(now.block)) land.set(...c.pos, "air"); }
for (const c of kit.cells.values()) if (/air$/.test(c.block)) land.set(...c.pos, "air");
// the box the earthworks touch
const lo = [1e9, 1e9, 1e9], hi = [-1, -1, -1], sig = (c) => (c ? c.block + JSON.stringify(Object.entries(c.state ?? {}).sort()) : "air");
for (const k of new Set([...original.cells.keys(), ...land.cells.keys()])) { const a = original.cells.get(k), b = land.cells.get(k); const an = a && !/air$/.test(a.block) ? sig(a) : "air", bn = b && !/air$/.test(b.block) ? sig(b) : "air"; if (an === bn) continue; const p = k.split(",").map(Number); p.forEach((v, i) => { lo[i] = Math.min(lo[i], v); hi[i] = Math.max(hi[i], v); }); }
// tiles along z, as few as fit under the cap
const CAP = 250 * 1024;
for (const f of readdirSync(D)) if (/^landscape/.test(f)) unlinkSync(`${D}/${f}`);
const cut = (z0, z1) => { const g = new Grid([hi[0] - lo[0] + 1, hi[1] - lo[1] + 1, z1 - z0 + 1], { dataVersion: land.dataVersion });
  for (const c of land.cells.values()) { const [x, y, z] = c.pos; if (x < lo[0] || x > hi[0] || y < lo[1] || y > hi[1] || z < z0 || z > z1) continue; g.set(x - lo[0], y - lo[1], z - z0, c.block, c.state, c.nbt); }
  return g; };
let tiles = 1, files;
for (;; tiles++) {
  const span = Math.ceil((hi[2] - lo[2] + 1) / tiles); files = [];
  for (let t = 0; t < tiles; t++) { const z0 = lo[2] + t * span, z1 = Math.min(hi[2], z0 + span - 1); const g = cut(z0, z1), f = `landscape-${t + 1}-of-${tiles}.nbt`; g.save(`${D}/${f}`); files.push({ file: f, offset: [lo[0], lo[1], z0], size: g.size, kb: Math.round(statSync(`${D}/${f}`).size / 1024) }); }
  if (files.every((f) => f.kb * 1024 <= CAP)) break;
  for (const f of files) unlinkSync(`${D}/${f.file}`);
}
console.log(JSON.stringify({ box: { from: lo, to: hi }, tiles: files }, null, 1));
writeFileSync(`${D}/landscape-tiles.json`, JSON.stringify({ note: "offset = this tile's lowest north-west corner, from the export's corner (same frame as the export)", box: { from: lo, to: hi }, tiles: files }, null, 1));
// kit-changes without its air (the landscape cleared those cells): a pure placement
const k2 = new Grid(kit.size, { dataVersion: kit.dataVersion }); for (const c of kit.cells.values()) if (!/air$/.test(c.block)) k2.set(...c.pos, c.block, c.state, c.nbt);
k2.save(`${D}/kit-changes.nbt`); console.log("kit-changes.nbt", Math.round(statSync(`${D}/kit-changes.nbt`).size / 1024), "KB, air cells 0");
