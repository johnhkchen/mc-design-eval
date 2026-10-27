// Farmsteads for the client's 19 x 18 lot, in three palettes, checked by the shared gate.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { farmstead } from "./farmstead.mjs";
import { paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
const DATA = "bundle/core/src/main/resources/data/enterprise/structure/lordaeron/farmstead", PREV = "bundle/assets-src/lordaeron/farmstead";
const palettes = JSON.parse(fs.readFileSync("bundle/assets-src/kingdoms/lordaeron/palettes.json", "utf8"));
fs.mkdirSync(DATA, { recursive: true });
const VARIANTS = [["a", { W: 7, storeys: 1 }, "daub"], ["b", { W: 10, storeys: 2 }, "stone"], ["c", { W: 7, storeys: 1, mirror: true }, "brick"]];
for (const [v, p, pal] of VARIANTS) {
  const r = farmstead(p), map = paletteMap(palettes, pal), g = new Grid(r.grid.size);
  for (const [x, y, z, s] of r.grid.each()) g.set(x, y, z, map(s));
  const name = `farmstead_19x18_${v}`;
  g.save(`${DATA}/${name}.nbt`);
  fs.writeFileSync(`${DATA}/${name}.json`, JSON.stringify({ id: `enterprise:lordaeron/farmstead/${name}`, rev: 1, kingdom: "lordaeron", kind: "farmstead", slot: "farmstead", palette: pal,
    footprint: [g.size[0], g.size[2]], height: g.size[1], ground: 2, front: "south (z 17) toward the track; rows z 16-17 kept clear but for the paths",
    entrances: r.meta.entrances, beds: r.meta.beds, workstations: [], lockers: [], markers: [], entities: [], relief_faces: [] }, null, 2) + "\n");
  fs.mkdirSync(`${PREV}/${name}`, { recursive: true });
  execFileSync("node", ["../../tools/preview.mjs", `${DATA}/${name}.nbt`, `${PREV}/${name}/front.jpg`, "--closeups"], { stdio: "ignore" });
}
try { execFileSync("node", ["../../tools/gate.mjs", DATA], { stdio: "inherit" }); } catch { process.exitCode = 1; }
