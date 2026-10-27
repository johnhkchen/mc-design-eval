// The golden houses on the 1 + 2 grid: build, apply palettes, check, write to out/golden/
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { house3, terrace3 } from "./house3.mjs";
import { paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";
const OUT = new URL("../../out/golden/", import.meta.url).pathname;
const palettes = JSON.parse(readFileSync(new URL("../../bundle/assets-src/kingdoms/lordaeron/palettes.json", import.meta.url), "utf8"));
mkdirSync(OUT, { recursive: true });
export const GOLDEN = {
  ga_burgage_7x7: { f: house3, p: { W: 7, D: 7, storeys: 2, roof: "gable_z", palette: "daub", core: "turned", beds: 2 } },
  gb_townhouse_10x7: { f: house3, p: { W: 10, D: 7, storeys: 3, roof: "gable_x", palette: "brick", shop: true, trade: "any", beds: 3 } },
  gc_terrace_3x7: { f: terrace3, p: { units: 3, storeys: 3, palette: "daub", beds: 2 } },
};
const only = process.argv[2];
for (const [name, { f, p }] of Object.entries(GOLDEN)) {
  if (only && name !== only) continue;
  const r = f(p), map = paletteMap(palettes, p.palette), g = new Grid(r.size);
  for (const [x, y, z, s] of r.grid.each()) g.set(x, y, z, map(s));
  const file = `${OUT}${name}.nbt`; g.save(file);
  const meta = { footprint: [r.size[0], r.size[2]], ground: 2, entrances: r.entrances || [r.entrance], beds: r.beds, workstations: r.workstations, lockers: [], markers: [], entities: [] };
  writeFileSync(file.replace(".nbt", ".json"), JSON.stringify({ ...meta, golden: { params: p, body: r.body, relief: r.relief, core: r.core, plan: r.rooms || null } }, null, 2));
  const c = check(file, meta);
  console.log(`${c.ok ? "PASS" : "FAIL"} ${name} ${r.size.join("x")} beds ${c.counts.beds} openSky ${c.counts.openSky}`);
  for (const e of c.errors) console.log("  " + e);
}
