// Golden houses composed from the module set by their reference layouts; checked; written to out/golden2/
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { compose, layoutOf, metaOf } from "./compose.mjs";
import { paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";
const OUT = new URL("../../out/golden2/", import.meta.url).pathname;
const palettes = JSON.parse(readFileSync(new URL("../../bundle/assets-src/kingdoms/lordaeron/palettes.json", import.meta.url), "utf8"));
mkdirSync(OUT, { recursive: true });

export function terrace(p) {
  const units = [];
  for (let u = 0; u < p.units; u++) units.push(layoutOf({ ...p, W: 7, D: 7, core: "turned", roof: "gable_x", party: [u > 0, u < p.units - 1], door: u % 2 ? "left" : "right" }));
  const grids = units.map(compose), H = Math.max(...grids.map((g) => g.size[1]));
  const g = new Grid([6 * p.units + 3, H, 9]), beds = [], entrances = [], layouts = [];
  units.forEach((L, u) => {
    const shift = u === 0 ? 0 : 1 + 6 * u, m = metaOf(L);
    g.paste(grids[u], shift, 0, 0);
    beds.push(...m.beds.map((b) => ({ head: [b.head[0] + shift, b.head[1], b.head[2]], foot: [b.foot[0] + shift, b.foot[1], b.foot[2]] })));
    entrances.push({ ...m.entrance, at: [m.entrance.at[0] + shift, m.entrance.at[1], m.entrance.at[2]] });
    layouts.push({ at: [shift, 0, 0], layout: L });
  });
  return { grid: g, beds, workstations: [], entrances, layouts };
}

export const GOLDEN = {
  ga_burgage_7x7: { p: { W: 7, D: 7, storeys: 2, roof: "gable_z", palette: "daub", core: "turned", beds: 2 } },
  gb_townhouse_10x7: { p: { W: 10, D: 7, storeys: 3, roof: "gable_x", palette: "brick", shop: true, trade: "any", beds: 3 } },
  gc_terrace_3x7: { p: { units: 3, storeys: 3, palette: "daub", beds: 2 }, terrace: true },
};
const only = process.argv[2];
for (const [name, { p, terrace: t }] of Object.entries(GOLDEN)) {
  if (only && name !== only) continue;
  let r;
  if (t) r = terrace(p);
  else { const L = layoutOf(p), m = metaOf(L); r = { grid: compose(L), beds: m.beds, workstations: m.workstations, entrances: [m.entrance], layouts: [{ at: [0, 0, 0], layout: L }] }; }
  const map = paletteMap(palettes, p.palette), g = new Grid(r.grid.size);
  for (const [x, y, z, s] of r.grid.each()) g.set(x, y, z, map(s));
  const file = `${OUT}${name}.nbt`; g.save(file);
  const meta = { footprint: [g.size[0], g.size[2]], ground: 2, entrances: r.entrances, beds: r.beds, workstations: r.workstations, lockers: [], markers: [], entities: [] };
  writeFileSync(file.replace(".nbt", ".json"), JSON.stringify({ ...meta, golden: { params: p, palette: p.palette, layouts: r.layouts } }, null, 2));
  const c = check(file, meta);
  console.log(`${c.ok ? "PASS" : "FAIL"} ${name} ${g.size.join("x")} beds ${c.counts.beds} openSky ${c.counts.openSky}`);
  for (const e of c.errors) console.log("  " + e);
}
