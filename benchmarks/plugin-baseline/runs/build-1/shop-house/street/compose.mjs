// a street of shop houses: the copies on plots side by side along the street (x), in order
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const files = process.argv.slice(3), out = process.argv[2];
const plots = files.map((f) => load(f)), [w, h, d] = plots[0].size;
const g = new Grid([w * plots.length, h, d], { dataVersion: plots[0].dataVersion });
plots.forEach((p, i) => { for (const c of p) g.set(c.pos[0] + i * w, c.pos[1], c.pos[2], c.block, c.state, c.nbt); });
g.save(out);
console.log(`${out}: ${plots.length} plots of ${w} x ${d}, ${g.size.join("x")}`);
