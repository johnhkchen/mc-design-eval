// Build the 13 trade workshops into out/workshops (palettes rotate stone, brick, daub), with full metadata.
import fs from "node:fs";
import { workshop, TRADES } from "./workshops.mjs";
import { WS } from "./stalls.mjs";
import { paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
const palettes = JSON.parse(fs.readFileSync("bundle/assets-src/kingdoms/lordaeron/palettes.json", "utf8"));
const PAL = ["stone", "brick", "daub"];
fs.mkdirSync("out/workshops", { recursive: true });
TRADES.forEach((t, i) => {
  const r = workshop(t), pal = PAL[i % 3], map = paletteMap(palettes, pal), g = new Grid(r.grid.size);
  for (const [x, y, z, s] of r.grid.each()) g.set(x, y, z, map(s));
  const name = `workshop_${t}_12x9_a`; g.save(`out/workshops/${name}.nbt`);
  fs.writeFileSync(`out/workshops/${name}.json`, JSON.stringify({ id: `enterprise:lordaeron/workshop/${name}`, rev: 1, kingdom: "lordaeron", kind: "workshop", slot: `workshop:${t}`,
    tiers: ["village", "town"], style: `the ${t}'s house and workshop: a shop front showing its goods, the workstation in the hall, a chamber above`, palette: pal,
    footprint: [g.size[0], g.size[2]], height: g.size[1], ground: 2, mirror: true, entrances: [r.meta.entrance], beds: r.meta.beds,
    workstations: r.meta.workstations.map((w) => ({ ...w, block: `minecraft:${WS[t].replace(/\[.*$/, "")}` })), lockers: [], markers: [], pilings: [], entities: [],
    assembly: { set: "lordaeron/timber_relief", layout: r.layout } }, null, 2) + "\n");
});
console.log(TRADES.length, "workshops");
