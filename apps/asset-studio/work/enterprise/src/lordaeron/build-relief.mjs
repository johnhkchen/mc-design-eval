#!/usr/bin/env node
// Batch 002: the Lordaeron relief module set (WFC), its set file, the golden houses composed from it (3 palettes
// each), and the reference composer. Everything into bundle/ in the client's repo paths, every structure checked.
import { mkdirSync, writeFileSync, rmSync, readFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { allModules, H, PITCH } from "./modules.mjs";
import { compose, layoutOf, metaOf } from "./compose.mjs";
import { terrace } from "./golden2.mjs";
import { paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url)), WORK = join(HERE, "../.."), BUNDLE = join(WORK, "bundle");
const DATA = join(BUNDLE, "core/src/main/resources/data/enterprise"), SET = "timber_relief";
const PARTS = join(DATA, `structure/lordaeron/part/${SET}`), HOMES = join(DATA, "structure/lordaeron/home");
const write = (f, s) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); };
const palettes = JSON.parse(readFileSync(join(BUNDLE, "assets-src/kingdoms/lordaeron/palettes.json"), "utf8"));
const report = [];

// 1. modules
rmSync(PARTS, { recursive: true, force: true }); mkdirSync(PARTS, { recursive: true });
const mods = allModules();
for (const m of mods) {
  m.grid.save(join(PARTS, `${m.id}.nbt`));
  const meta = { id: `enterprise:lordaeron/part/${SET}/${m.id}`, rev: 1, kingdom: "lordaeron", kind: "part", slot: "part", set: `lordaeron/${SET}`, palette: "stone", ...m.meta, module: m.id };
  write(join(PARTS, `${m.id}.json`), JSON.stringify(meta, null, 2) + "\n");
  const c = check(join(PARTS, `${m.id}.nbt`), meta); report.push({ id: `part/${m.id}`, ok: c.ok, errors: c.errors });
}

// 2. the set file (WFC)
const set = {
  set: `lordaeron/${SET}`, rev: 1,
  about: "The Lordaeron timber-frame module set with relief, for a WFC assembler. Two layers solved in order: the plan (rooms, cores, fit-out) then the shell (posts, bays, corners) chosen by the room behind; then the roof and the stack. The golden houses beside it are composed from exactly these modules by the layouts in their JSON (golden.layouts); scripts/assets/lordaeron-ref/compose.mjs is the reference composer.",
  grid: { post: 1, bay: 2, storey: H, relief: 1, pitch: PITCH, body: "3n + 1 wide and deep (7, 10, 13); the template adds the relief: +2, or +1 per party wall" },
  palettes: "assets-src/kingdoms/lordaeron/palettes.json (modules are in the base palette; apply a palette by role)",
  placement: {
    shell: "Modules are authored for the FRONT face: local x left to right as seen from outside, y 0 = the storey's sill/floor layer, z 0 = the wall on the body line, z 1 = the relief outside it. Positions i along a face count from its outside-left corner. Turns (quarter turns clockwise, seen from above) and the module's min corner, for a module w wide at position i, body W x D with its north-west corner at body (0, 0): front q0 at (i, D-1); back q2 at (W-i-w, -1); east q3 at (W-1, D-i-w); west q1 at (-1, i). One-layer party modules sit on the wall line (west at x 0). Corners (2 x 2) at front:0 q0 (-1, D-1), front:W-1 q3 (W-1, D-1), back:0 q2 (W-1, -1), back:W-1 q1 (-1, -1); corner_party (1 x 2) at front:i q0 (i, D-1), back:i q2 (W-1-i, -1). Corners belong to the front and back faces; sides run i = 1..D-2.",
    storeys: `storey s has its layer 0 at y = 2 + ${H}s (layers 0-1 are the foundation, every cell of body and relief); the roof starts at 2 + ${H} * storeys`,
    plan: "Cores and fit-outs at body (x, z) of their min corner, y = the storey's layer 0 + dy. Cores replace the floor and room air under them (their holes win).",
    roof: "gable_x: slices along x from -1 to W, span D+2, at body z -1: verge outside the body, gable on the end walls (bay on a party wall), bay between. gable_z: slices along z from -1 to D, span W+2 (W+1 with one party wall), turned q1, at template x 0.",
    stack: "chimney_stack (wall + relief) on the chimney post's line, from the roof base to one above the ridge; chimney_stack_party on a party wall.",
  },
  sockets: {
    note: "Faces meet when labels match or a pair allows it. Shell modules alternate post | bay along a face, corners at the ends.",
    post: { left: "bay", right: "bay", down: "floor_line|foundation", up: "floor_line|eave" },
    bay: { left: "post|corner", right: "post|corner", down: "floor_line|foundation", up: "floor_line|eave" },
    corner: { along_front: "bay", along_side: "bay", down: "floor_line|foundation", up: "floor_line|eave" },
  },
  pairs: [["floor_line", "floor_line"], ["eave", "roof"]],
  limits: [{ module: "bay_door_ground", per: "front", exactly: 1 }, { module: "chimney_*", per: "house", at_most: 1, note: "on the west side's middle post (or the party wall); the hearth behind it" }],
  stacks: [["chimney_ground", "chimney_upper", "chimney_stack"], ["core_*_bottom", "core_*_mid", "core_*_top"]],
  rooms: { chamber: { beds: "1 to 3 a floor (bed fit-out, heads north)" }, hall: { hearth: 1 }, work: { workstation: "by trade (a marker: block any)" }, stair: { core: "stair2x5 | stair3x3" }, store: {} },
  behind: "bay_window(_box) over chamber or hall; bay_landing over the stair core and on ground-storey sides; bay_shop over shop/work/hall on the ground front; bay_plain over a store; chimney over the hearth",
  weights: "per module JSON; bay_window 4, bay_window_box 2 (street fronts, raise by tier), bay_landing 3, bay_plain 1",
  modules: mods.map((m) => ({ id: m.id, part: `enterprise:lordaeron/part/${SET}/${m.id}`, ...m.meta })),
};
write(join(DATA, `town_kits/lordaeron/${SET}.json`), JSON.stringify(set, null, 2) + "\n");

// 3. golden houses, 3 palettes each
const GOLD = [
  ["burgage_9x9_a", { W: 7, D: 7, storeys: 2, roof: "gable_z", palette: "daub", core: "turned", beds: 2 }, ["village", "town"], "a 7 x 7 burgage house, 2 storeys, steep thatched gable to the street"],
  ["townhouse_12x9_a", { W: 10, D: 7, storeys: 3, roof: "gable_x", palette: "brick", shop: true, trade: "any", beds: 3 }, ["town", "city"], "a 10 x 7 town house, 3 storeys, shop front, slate"],
  ["terrace_21x9_a", { units: 3, storeys: 2, palette: "daub", beds: 2 }, ["town"], "three 7 x 7 party-walled houses, 2 storeys, turned stairs"],
];
const VAR = { daub: ["brick", "stone"], brick: ["daub", "stone"], stone: ["daub", "brick"] };
for (const [name, p, tiers, style] of GOLD) {
  let r;
  if (p.units) r = terrace(p);
  else { const L = layoutOf(p), m = metaOf(L); r = { grid: compose(L), beds: m.beds, workstations: m.workstations, entrances: [m.entrance], layouts: [{ at: [0, 0, 0], layout: L }] }; }
  for (const pal of [p.palette, ...VAR[p.palette]]) {
    const map = paletteMap(palettes, pal), g = new Grid(r.grid.size);
    for (const [x, y, z, s] of r.grid.each()) g.set(x, y, z, map(s));
    const id = pal === p.palette ? name : `${name}__${pal}`, file = join(HOMES, `${id}.nbt`);
    mkdirSync(HOMES, { recursive: true }); g.save(file);
    const full = { id: `enterprise:lordaeron/home/${name}`, rev: 1, kingdom: "lordaeron", kind: "home", slot: p.units ? "home:terrace" : "home:burgage", tiers, style,
      palette: p.palette, variants: VAR[p.palette], footprint: [g.size[0], g.size[2]], height: g.size[1], ground: 2, mirror: true,
      entrances: r.entrances, beds: r.beds, workstations: r.workstations, lockers: [], markers: [], pilings: [], entities: [],
      assembly: { set: `lordaeron/${SET}`, golden: true }, golden: { params: p, layouts: r.layouts }, notes: "Golden: composed from the relief module set by golden.layouts; the solver must be able to reproduce it." };
    write(file.replace(".nbt", ".json"), JSON.stringify(pal === p.palette ? full : { id: `enterprise:lordaeron/home/${id}`, base: full.id, palette: pal, rev: 1 }, null, 2) + "\n");
    const c = check(file, { ...full, id: `enterprise:lordaeron/home/${id}` }); report.push({ id, ok: c.ok, errors: c.errors });
  }
}

// 4. the reference composer, self-contained beside the assembler
const REF = join(BUNDLE, "scripts/assets/lordaeron-ref");
for (const f of ["modules.mjs", "compose.mjs"]) {
  const src = readFileSync(join(HERE, f), "utf8").replace('from "../grid.mjs"', 'from "./grid.mjs"');
  write(join(REF, f), src);
}
write(join(REF, "compose-cli.mjs"), `#!/usr/bin/env node
// The reference composer for town_kits/lordaeron/${SET}.json, from your repo root:
//   node scripts/assets/lordaeron-ref/compose-cli.mjs <golden .json> out.nbt     re-compose a golden house from its layouts (base palette)
//   node scripts/assets/lordaeron-ref/compose-cli.mjs layout.json out.nbt         compose any layout (the format in the set file)
import { readFileSync } from "node:fs";
import { compose } from "./compose.mjs";
import { Grid } from "./grid.mjs";
const [inp, out] = process.argv.slice(2), j = JSON.parse(readFileSync(inp, "utf8"));
const parts = j.golden ? j.golden.layouts : [{ at: [0, 0, 0], layout: j }];
const grids = parts.map((p) => ({ at: p.at, g: compose(p.layout) }));
const size = [Math.max(...grids.map((p) => p.at[0] + p.g.size[0])), Math.max(...grids.map((p) => p.g.size[1])), Math.max(...grids.map((p) => p.g.size[2]))];
const g = new Grid(size);
for (const p of grids) g.paste(p.g, ...p.at);
g.save(out);
console.log(JSON.stringify({ out, size }));
`);

for (const r of report.filter((r) => !r.ok)) console.log(`FAIL ${r.id}: ${r.errors.join(" | ")}`);
console.log(`${mods.length} modules, ${report.filter((r) => r.ok).length}/${report.length} pass`);
process.exit(report.every((r) => r.ok) ? 0 : 1);
