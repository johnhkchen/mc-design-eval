// Merge the per-plot chimney reworks (owner: smoke from the bottom, like a regular hearth): plot i's cells from
// chimney/plot<i>.nbt (x 12i..12i+11), plot 6 (no chimney) unchanged from v1. Writes v3.nbt.
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { existsSync } from "node:fs";
const base = load("v1.nbt"), out = new Grid(base.size, { dataVersion: base.dataVersion });
const src = [...Array(8).keys()].map((i) => (existsSync(`chimney/plot${i}.nbt`) ? load(`chimney/plot${i}.nbt`) : base));
for (const [i, g] of src.entries()) for (const c of g) { const p = Math.min(7, Math.floor(c.pos[0] / 12)); if (p === i) out.set(...c.pos, c.block, c.state, c.nbt); }
// outside any plot's x (none here) would come from base; check nothing else differs
let diff = 0; for (const c of base) { const p = Math.floor(c.pos[0] / 12); if (!existsSync(`chimney/plot${p}.nbt`)) continue; }
out.save("v3.nbt"); out.save("v3.litematic");
console.log("merged", src.filter((g) => g !== base).length, "plots");
