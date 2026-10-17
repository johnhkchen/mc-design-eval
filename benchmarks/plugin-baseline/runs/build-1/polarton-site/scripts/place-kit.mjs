// Set the Polarton kit's modules on their pads: module i (plot i of the sample row, x 12i..12i+11, z 5..18, facing north)
// onto site plot i+1, turned to face that plot's street, its y 0 (the yard surface) on the pad's top. Writes, in the
// export's frame (taller if a steeple needs it): village.nbt (everything), village-changes.nbt (against the original
// export: one paste does streets, pads and buildings) and kit-changes.nbt (against the site alone).
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { rotateState } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/sockets.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const here = (p) => new URL(p, import.meta.url).pathname;
const KIT = process.argv[2] ?? here("../../polarton-kit/v2.nbt"), OUT = process.argv[3] ?? here("../delivery");
const layout = JSON.parse(readFileSync(here("../delivery/layout.json"), "utf8"));
const original = load(here("../input/polarton_expansion_001_xl.nbt")), site = load(here("../delivery/after.nbt")), kit = load(KIT);
const Q = { north: 0, east: 1, south: 2, west: 3 };
// the server is 1.21.1 (the export's DataVersion 3955); the kit was built for a newer game: its newer blocks as their
// 1.21.1 equivalents (pale oak reads pale: birch; the 1.21.9 iron_chain is chain)
const FOR_1_21_1 = [[/^minecraft:pale_oak_log$/, "minecraft:stripped_birch_log"], [/^minecraft:pale_oak_/, "minecraft:birch_"], [/^minecraft:iron_chain$/, "minecraft:chain"]];
const older = (b) => { for (const [re, to] of FOR_1_21_1) if (re.test(b)) return b.replace(re, to); return b; };
const W = 12, D = 14, Z0 = 5;
// how tall the frame must be
let need = site.size[1];
layout.plots.forEach((p, i) => { for (const c of kit.cells.values()) if (c.pos[0] >= 12 * i && c.pos[0] < 12 * i + W && c.pos[2] >= Z0) need = Math.max(need, p.pad + c.pos[1] + 1); });
const grow = (g) => { if (g.size[1] >= need) return g; const o = new Grid([g.size[0], need, g.size[2]], { dataVersion: g.dataVersion, entities: g.entities }); for (const c of g.cells.values()) o.set(...c.pos, c.block, c.state, c.nbt); return o; };
const village = grow(site);
const placed = [];
layout.plots.forEach((p, i) => {
  const q = Q[p.face], { x0, z0, x1, z1 } = p, py = p.pad;
  const map = (lx, lz) => q === 0 ? [x0 + lx, z0 + lz] : q === 1 ? [x1 - lz, z0 + lx] : q === 2 ? [x1 - lx, z1 - lz] : [x0 + lz, z1 - lx];
  // clear the plot above the pad (overhanging leaves, the pad's own fence: the module brings the same one back)
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) for (let y = py + 1; y < need; y++) if (village.get(x, y, z)) village.set(x, y, z, "air");
  let n = 0;
  for (const c of kit.cells.values()) {
    const [kx, ky, kz] = c.pos; if (kx < 12 * i || kx >= 12 * i + W || kz < Z0 || kz >= Z0 + D) continue;
    if (/air$/.test(c.block)) continue;
    const [x, z] = map(kx - 12 * i, kz - Z0), y = py + ky;
    village.set(x, y, z, older(c.block), rotateState(c.state, q), c.nbt); n++;
  }
  placed.push({ module: i, plot: i + 1, face: p.face, turns: q, pad: py, blocks: n });
});
// a module's eave detail that leaned on its neighbour in the sample row floats once the modules stand apart: remove
// what the placement leaves floating (the site's own floating cells stay as the export had them)
const looseOf = (grid) => { const solids = [...grid.cells.values()].filter((c) => !/air$|water|lava/.test(c.block)); const at = new Set(solids.map((c) => c.pos.join(",")));
  const seen = new Set(), q = []; for (const c of solids) if (c.pos[1] === 0) { seen.add(c.pos.join(",")); q.push(c.pos); }
  while (q.length) { const [x, y, z] = q.pop(); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 2) continue; const nk = `${x + dx},${y + dy},${z + dz}`; if (at.has(nk) && !seen.has(nk)) { seen.add(nk); q.push([x + dx, y + dy, z + dz]); } } }
  return new Set(solids.filter((c) => !seen.has(c.pos.join(","))).map((c) => c.pos.join(","))); };
const siteLoose = looseOf(site), floaters = [];
for (const k of looseOf(village)) if (!siteLoose.has(k)) { const [x, y, z] = k.split(",").map(Number); floaters.push(`${String(village.blockAt(x, y, z)).replace("minecraft:", "")}@${k}`); village.set(x, y, z, "air"); }
// changes against a base, explicit air where something was removed
function changes(base, after) {
  const out = new Grid(after.size, { dataVersion: after.dataVersion }); let put = 0, dug = 0;
  const strip = (b) => String(b).replace(/^minecraft:/, ""), sig = (c) => (c ? strip(c.block) + JSON.stringify(c.state ?? {}) : "air{}");
  for (const k of new Set([...base.cells.keys(), ...after.cells.keys()])) { const a = base.cells.get(k), b = after.cells.get(k); if (sig(a) === sig(b) || (!a && /air$/.test(b?.block)) || (!b && /air$/.test(a?.block))) continue;
    const [x, y, z] = k.split(",").map(Number); if (!b || /air$/.test(b.block)) { out.set(x, y, z, "air"); dug++; } else { out.set(x, y, z, b.block, b.state, b.nbt); put++; } }
  return { out, put, dug };
}
village.save(`${OUT}/village.nbt`);
const all = changes(grow(original), village), kitOnly = changes(grow(site), village);
all.out.save(`${OUT}/village-changes.nbt`); kitOnly.out.save(`${OUT}/kit-changes.nbt`);
const report = { frame: village.size, placed, floatersRemoved: floaters, villageChanges: { placed: all.put, dug: all.dug }, kitChanges: { placed: kitOnly.put, dug: kitOnly.dug } };
writeFileSync(`${OUT}/village-report.json`, JSON.stringify(report, null, 1)); console.log(JSON.stringify(report, null, 1));
