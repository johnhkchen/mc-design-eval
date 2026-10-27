// Dalaran's golden houses, one per plan body, composed from the platform_hall set; metadata as the client reads it
// (footprint = what stands on the ground, overhang = the eaves); checked by the shared gate.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { compose, metaOf, dalaranLayout } from "./compose.mjs";
import { EAVE, allModules } from "./modules.mjs";
import { check } from "../../../../tools/check-asset.mjs";
import { courtyardHouse } from "./courtyard.mjs";
const DATA = "bundle/core/src/main/resources/data/enterprise/structure/dalaran/home", PREV = "bundle/assets-src/dalaran/home";
fs.mkdirSync(DATA, { recursive: true });
// the module set: Dalaran's shell and roofs as parts (the shared cores and fit-out are Lordaeron's parts), and its set
// file: Lordaeron's conventions with Dalaran's roof (one hipped piece a body, eaves past the relief) and no stack
const K = "bundle/core/src/main/resources/data/enterprise", PARTS = `${K}/structure/dalaran/part/platform_hall`;
fs.rmSync(PARTS, { recursive: true, force: true }); fs.mkdirSync(PARTS, { recursive: true });
const mods = allModules().filter((m) => m.meta.layer === "shell" || m.meta.layer === "roof"), bad = [];
for (const m of mods) {
  m.grid.save(`${PARTS}/${m.id}.nbt`);
  const meta = { id: `enterprise:dalaran/part/platform_hall/${m.id}`, rev: 1, kingdom: "dalaran", kind: "part", slot: "part", set: "dalaran/platform_hall", ...m.meta, module: m.id };
  fs.writeFileSync(`${PARTS}/${m.id}.json`, JSON.stringify(meta, null, 2) + "\n");
  const c = check(`${PARTS}/${m.id}.nbt`, meta); if (!c.ok) bad.push(`${m.id}: ${c.errors.join("; ")}`);
}
const lset = JSON.parse(fs.readFileSync(`${K}/town_kits/lordaeron/timber_relief.json`, "utf8"));
fs.mkdirSync(`${K}/town_kits/dalaran`, { recursive: true });
fs.writeFileSync(`${K}/town_kits/dalaran/platform_hall.json`, JSON.stringify({
  ...lset, set: "dalaran/platform_hall", rev: 1,
  about: "Dalaran's shell family: the same slots, sizes, ids and placement as lordaeron/timber_relief, so the solver, plan.json and the composer carry over, in Dalaran's construction (red columns on the ground storey on a stepped stone plinth, white plaster in dark timber above, lattice windows, brackets under the eave, a violet tile skirt between storeys) and one concave hipped roof per body with upturned corners. Cores and fit-out are Lordaeron's parts (lordaeron/part/timber_relief).",
  palettes: "none yet: the modules carry Dalaran's materials",
  placement: { ...lset.placement,
    roof: `hip: one module, roof_hip_<W>x<D>, over the body's relief outline and the eave (${EAVE}) all round, its min corner at body (-1 - ${EAVE}, -1 - ${EAVE}) at y = 2 + ${5} * storeys. The template is ${EAVE} wider on every side than a Lordaeron one: shift every other placement by +${EAVE} in x and z.`,
    stack: "none: Dalaran's roof is unbroken (the hearth stays; chimney bays are plaster piers)" },
  metadata: "Houses declare footprint { at, size } (what stands on the ground) and overhang (the eaves past it), as thread 0010 asked.",
  modules: [...mods.map((m) => ({ id: m.id, part: `enterprise:dalaran/part/platform_hall/${m.id}`, ...m.meta })),
    ...lset.modules.filter((m) => m.layer === "plan" || m.layer === "fitout")],
}, null, 2) + "\n");
// the reference code beside Lordaeron's: Dalaran's modules and its compose wrapper (they import lordaeron-ref)
const REF = "bundle/scripts/assets/dalaran-ref"; fs.mkdirSync(REF, { recursive: true });
for (const f of ["modules.mjs", "compose.mjs"]) fs.writeFileSync(`${REF}/${f}`, fs.readFileSync(`src/dalaran/${f}`, "utf8")
  .replace('from "../grid.mjs"', 'from "../lordaeron-ref/grid.mjs"').replace('from "../lordaeron/modules.mjs"', 'from "../lordaeron-ref/modules.mjs"').replace('from "../lordaeron/compose.mjs"', 'from "../lordaeron-ref/compose.mjs"'));
if (bad.length) { console.log("PART FAIL", bad.join("\n")); process.exitCode = 1; }
console.log(`${mods.length} Dalaran parts`);
const HOUSES = [
  ["cottage_7x7", { W: 7, D: 7, storeys: 1 }], ["house_10x7", { W: 10, D: 7, storeys: 2 }],
  ["shophouse_10x7", { W: 10, D: 7, storeys: 2, shop: true, trade: "any" }], ["house_13x7", { W: 13, D: 7, storeys: 2 }],
  ["house_10x10", { W: 10, D: 10, storeys: 2 }],
];
for (const [name, p] of HOUSES) {
  const L = dalaranLayout(p), g = compose(L), m = metaOf(L);
  g.save(`${DATA}/${name}_a.nbt`);
  fs.writeFileSync(`${DATA}/${name}_a.json`, JSON.stringify({
    id: `enterprise:dalaran/home/${name}_a`, rev: 1, kingdom: "dalaran", kind: "home", set: "dalaran/platform_hall",
    footprint: { at: [EAVE, EAVE], size: [g.size[0] - 2 * EAVE, g.size[2] - 2 * EAVE] }, overhang: EAVE, size: g.size, ground: 2,
    entrances: [m.entrance], beds: m.beds, workstations: [], lockers: [], markers: [], entities: [],
    relief_faces: ["south", "north", "east", "west"], assembly: { set: "dalaran/platform_hall", layout: L },
  }, null, 2) + "\n");
  fs.mkdirSync(`${PREV}/${name}_a`, { recursive: true });
  execFileSync("node", ["../../tools/preview.mjs", `${DATA}/${name}_a.nbt`, `${PREV}/${name}_a/front.jpg`], { stdio: "ignore" });
}
// the courtyard house, a double plot
{ const r = courtyardHouse(); r.grid.save(`${DATA}/courtyard_22x16_a.nbt`);
  fs.writeFileSync(`${DATA}/courtyard_22x16_a.json`, JSON.stringify({ id: "enterprise:dalaran/home/courtyard_22x16_a", rev: 1, kingdom: "dalaran", kind: "home", plots: 2, footprint: [22, 16], height: r.grid.size[1], ground: 2,
    front: "south (z 15) to the street; z 14-15 the forecourt", court: "open to the sky, walkable (an outside room)", entrances: r.meta.entrances, beds: r.meta.beds, workstations: [], lockers: [], markers: [], entities: [], relief_faces: ["south"] }, null, 2) + "\n");
  fs.mkdirSync(`${PREV}/courtyard_22x16_a`, { recursive: true });
  execFileSync("node", ["../../tools/preview.mjs", `${DATA}/courtyard_22x16_a.nbt`, `${PREV}/courtyard_22x16_a/front.jpg`], { stdio: "ignore" }); }
try { execFileSync("node", ["../../tools/gate.mjs", DATA], { stdio: "inherit" }); } catch { process.exitCode = 1; }
