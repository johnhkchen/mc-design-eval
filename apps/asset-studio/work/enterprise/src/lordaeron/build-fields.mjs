// Field plots: 9 x 9 field tiles and 9 x 1 edges, the set file, and a demo (six fields in a 3 x 2 block with edges
// between and a gated headland along the front). All checked as parts.
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { allFields } from "./fields.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";
const HERE = dirname(fileURLToPath(import.meta.url)), DATA = join(HERE, "../../bundle/core/src/main/resources/data/enterprise");
const F = join(DATA, "structure/lordaeron/field");
const write = (f, s) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); };
rmSync(F, { recursive: true, force: true }); mkdirSync(F, { recursive: true });
const tiles = allFields(), report = [];
for (const t of tiles) {
  const f = join(F, `${t.id}.nbt`); t.grid.save(f);
  const meta = { id: `enterprise:lordaeron/field/${t.id}`, rev: 1, kingdom: "lordaeron", kind: "part", slot: t.meta.kind_of === "edge" ? "field:edge" : "field", palette: "fixed", size: t.grid.size, mirror: true, ground: 2, ...t.meta };
  write(f.replace(".nbt", ".json"), JSON.stringify(meta, null, 2) + "\n");
  const c = check(f, meta); report.push([t.id, c.ok, c.errors]);
}
write(join(DATA, "town_kits/lordaeron/fields.json"), JSON.stringify({
  set: "lordaeron/fields", rev: 1,
  about: "Field plots: 9 x 9 tiles with one water source at (4, 2, 4), which hydrates every cell (the game's reach is 4), and 9 x 1 edges laid between fields or along a headland. Layers 0-1 ground, 2 the surface, 3+ crops and features. Crops are mixed in growth stage so a field never reads as one flat colour.",
  tiling: "Lay fields on a 10-pitch grid (9 + an edge). Edges between fields: hedgerow, drystone or rail, one kind per holding so a farm reads as one; edge_gate where a headland path enters. Mix tile kinds by hash: crop fields mostly, a fallow or meadow every few, an orchard by the farmstead.",
  rules: ["no point-of-interest blocks (decorative twins only)", "no beds", "the water source stays where it is: every farmland cell is within 4 of it"],
  tiles: tiles.map((t) => ({ id: t.id, part: `enterprise:lordaeron/field/${t.id}`, ...t.meta })),
}, null, 2) + "\n");
// the demo: 3 x 2 fields, edges between, a gated headland along the front
const by = Object.fromEntries(tiles.map((t) => [t.id, t.grid]));
const order = [["field_strips_3_a", "field_pumpkins_a", "field_orchard_a"], ["field_sunflowers_b", "field_fallow_a", "field_garden_a"]];
const demo = new Grid([3 * 10 - 1, 10, 2 * 10]);
order.forEach((row, r) => row.forEach((id, c) => demo.paste(by[id], c * 10, 0, r * 10)));
for (let c = 0; c < 3; c++) { demo.paste(by.edge_hedgerow, c * 10, 0, 9); demo.paste(by[c === 1 ? "edge_gate" : "edge_rail"], c * 10, 0, 19); }
for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) demo.paste(by.edge_drystone, c * 10 + 9, 0, r * 10, { q: 1 });
for (const [x, y, z] of demo.each()) if (z >= demo.size[2] || x >= demo.size[0]) demo.set(x, y, z, null);
mkdirSync(join(HERE, "../../out/fields"), { recursive: true }); demo.save(join(HERE, "../../out/fields/demo_fields.nbt"));
for (const [id, ok, e] of report) if (!ok) console.log("FAIL", id, e.join(" | "));
console.log(`${tiles.length} tiles, ${report.filter((r) => r[1]).length}/${report.length} pass`);
