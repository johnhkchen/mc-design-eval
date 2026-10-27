#!/usr/bin/env node
// Batch 001 (wiring) homes: retired 2026-10-27 to structure/lordaeron/_retired/ (thread 0008). Not part of build-all.
// Build batch 001 for Enterprise: the Lordaeron timber part set, and homes assembled from it by the reference
// assembler, each with its metadata, checked by the shared validator.
//   node src/lordaeron/build.mjs            (from work/enterprise)
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { allParts } from "./parts.mjs";
import { loadKit, assembleHome, assembleTerrace, paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";

const WORK = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BUNDLE = join(WORK, "bundle"), DATA = join(BUNDLE, "core/src/main/resources/data/enterprise");
const PARTS = join(DATA, "structure/lordaeron/part/timber"), HOMES = join(DATA, "structure/lordaeron/home");
const write = (f, s) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); };

// 1. parts
rmSync(PARTS, { recursive: true, force: true });
for (const p of allParts()) {
  p.grid.save((mkdirSync(PARTS, { recursive: true }), join(PARTS, `${p.name}.nbt`)));
  write(join(PARTS, `${p.name}.json`), JSON.stringify({ id: `enterprise:lordaeron/part/timber/${p.name}`, rev: 1, kingdom: "lordaeron",
    set: "lordaeron/timber", palette: "stone", size: p.grid.size, mirror: true, ...p.json, part: p.json.kind, kind: "part", slot: "part" }, null, 2) + "\n");
}
console.log(`${allParts().length} parts`);

// 2. homes: [name, params, tiers, style, notes]
const kit = loadKit(BUNDLE);
const HOMES_LIST = [
  ["cottage_5x5_a", { width: 5, depth: 5, storeys: 1, roof: "gable_z", palette: "daub", front: "plain" }, ["hamlet", "village"],
    "single-storey cottage, gable to the lane, thatch", "Two beds against the back wall, the hearth under the chimney, a chest; one hanging lantern."],
  ["cottage_5x5_b", { width: 5, depth: 5, storeys: 2, roof: "gable_x", palette: "daub", front: "plain" }, ["village", "town"],
    "storey-and-a-half cottage, ridge along the lane", "Beds and hearth on the ground storey; a ladder to a lit loft with a chest and shelves."],
  ["shop_5x5_a", { width: 5, depth: 5, storeys: 2, roof: "gable_z", palette: "brick", front: "shop", trade: "any" }, ["village", "town"],
    "two-storey shop, wide glazing either side of the door, gable to the lane", "The occupant's workstation by the hearth wall (a marker the placer fills by trade); beds behind; loft above."],
  ["townhouse_7x7_a", { width: 7, depth: 7, storeys: 2, roof: "gable_x", palette: "stone", front: "jettied" }, ["town"],
    "jettied two-storey town house, stone ground storey", "Needs C3 (7 x 7 slots). Upper storey jettied over a lit doorstep strip on brackets."],
  ["cottage_7x7_a", { width: 7, depth: 7, storeys: 1, roof: "gable_z", palette: "daub", front: "plain" }, ["hamlet", "village"],
    "single-storey cottage, 7 x 7, gable to the lane", "Needs C3. Same parts as the 5 x 5 cottage, wider and deeper."],
];
const TERRACES = [
  ["terrace_14x5_a", { units: [5, 5, 6].map(() => 5).concat([]), depth: 5, storeys: 2, palette: "brick", front: "plain" }, ["town"],
    "a row of three two-storey houses sharing party walls", "Needs C3 (terraces). Three homes, each with its own door, beds, hearth and chimney on its party wall."],
];
const VARIANTS = { daub: ["brick", "stone"], brick: ["daub", "stone"], stone: ["daub", "brick"] };

rmSync(HOMES, { recursive: true, force: true });
const report = [];
function emit(name, r, params, tiers, style, notes, kind = "home") {
  const base = params.palette, size = r.grid.size;
  for (const pal of [base, ...VARIANTS[base]]) {
    const map = paletteMap(kit.palettes, pal), g = new Grid(size);
    for (const [x, y, z, s] of r.grid.each()) g.set(x, y, z, map(s));
    const id = pal === base ? name : `${name}__${pal}`, file = join(HOMES, `${id}.nbt`);
    g.save((mkdirSync(HOMES, { recursive: true }), file));
    const meta = pal === base
      ? { id: `enterprise:lordaeron/home/${name}`, rev: 1, kingdom: "lordaeron", kind, slot: params.units ? "terrace" : "home", tiers, style,
          palette: base, variants: VARIANTS[base], footprint: [size[0], size[2]], height: r.height, ground: 2, mirror: true,
          entrances: r.entrances || [r.entrance], beds: r.beds, workstations: r.workstations, lockers: [], markers: [], pilings: [], entities: [],
          assembly: { set: "lordaeron/timber", params }, notes }
      : { id: `enterprise:lordaeron/home/${id}`, base: `enterprise:lordaeron/home/${name}`, palette: pal, rev: 1 };
    write(join(HOMES, `${id}.json`), JSON.stringify(meta, null, 2) + "\n");
    const full = pal === base ? meta : { ...JSON.parse(JSON.stringify(meta)), ...{ footprint: [size[0], size[2]], ground: 2, entrances: r.entrances || [r.entrance], beds: r.beds, workstations: r.workstations, lockers: [], markers: [], entities: [] } };
    const c = check(file, full);
    report.push({ id, ok: c.ok, errors: c.errors, warnings: c.warnings, counts: c.counts });
  }
}
for (const [name, p, tiers, style, notes] of HOMES_LIST) emit(name, assembleHome(kit, p), p, tiers, style, notes);
for (const [name, p, tiers, style, notes] of TERRACES) emit(name, assembleTerrace(kit, p), p, tiers, style, notes);

for (const r of report) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id}  beds ${r.counts.beds}, job sites ${r.counts.jobSites}, open-sky ${r.counts.openSky}`);
  for (const e of r.errors) console.log(`  error: ${e}`);
}
write(join(WORK, "out/check-001.json"), JSON.stringify(report, null, 2));
process.exit(report.every((r) => r.ok) ? 0 : 1);
