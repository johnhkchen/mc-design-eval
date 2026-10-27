// Build the second-generation candidates, check them, write them to out/house2/
import { mkdirSync, writeFileSync } from "node:fs";
import { house2 } from "./house2.mjs";
import { check } from "../../../../tools/check-asset.mjs";
import { paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
import { readFileSync } from "node:fs";
const palettes = JSON.parse(readFileSync(new URL("../../bundle/assets-src/kingdoms/lordaeron/palettes.json", import.meta.url), "utf8"));
const OUT = new URL("../../out/house2/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const C = {
  s3_burgage_7x7: { W: 7, D: 7, storeys: 2, roof: "gable_z", palette: "daub" },
  s4_wide_9x7: { W: 9, D: 7, storeys: 3, roof: "gable_x", shop: true, trade: "any", beds: 3, palette: "brick" },
};
for (const [name, p] of Object.entries(C)) {
  const r = house2(p), f = `${OUT}${name}.nbt`, map = paletteMap(palettes, p.palette || "stone"), g = new Grid(r.size);
  for (const [x, y, z, s] of r.grid.each()) g.set(x, y, z, map(s));
  g.save(f);
  const meta = { footprint: [r.size[0], r.size[2]], ground: 2, entrances: [r.entrance], beds: r.beds, workstations: r.workstations, lockers: [], markers: [], entities: [] };
  writeFileSync(f.replace(".nbt", ".json"), JSON.stringify(meta, null, 2));
  const c = check(f, meta);
  console.log(`${c.ok ? "PASS" : "FAIL"} ${name} ${r.size.join("x")} beds ${c.counts.beds} openSky ${c.counts.openSky}`);
  for (const e of c.errors) console.log("  " + e);
}
