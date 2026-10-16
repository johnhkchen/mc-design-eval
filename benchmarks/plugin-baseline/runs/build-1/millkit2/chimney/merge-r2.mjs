// Round 2 (owner: flue solid through the roof, not interrupted by roof tiles; chimneys set into the wall): plot i from
// chimney/plot<i>-r2.nbt where it exists, else from v3.nbt (plot 3 passed both rules; plot 6 has no chimney). Writes v4.nbt.
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { existsSync } from "node:fs";
const base = load("v3.nbt"), out = new Grid(base.size, { dataVersion: base.dataVersion });
const src = [...Array(8).keys()].map((i) => (existsSync(`chimney/plot${i}-r2.nbt`) ? load(`chimney/plot${i}-r2.nbt`) : base));
let outside = 0;
for (const [i, g] of src.entries()) for (const c of g) {
  const p = Math.min(7, Math.floor(c.pos[0] / 12));
  if (p === i) out.set(...c.pos, c.block, c.state, c.nbt);
  else if (g !== base) { const b = base.get(...c.pos); if ((b?.block ?? "minecraft:air") !== c.block || JSON.stringify(b?.state ?? {}) !== JSON.stringify(c.state ?? {})) outside++; }
}
out.save("v4.nbt"); out.save("v4.litematic");
console.log(JSON.stringify({ merged: src.filter((g) => g !== base).length, cellsChangedOutsideTheirPlot: outside }));
