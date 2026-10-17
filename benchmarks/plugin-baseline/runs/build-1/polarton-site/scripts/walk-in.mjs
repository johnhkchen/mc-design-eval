// From each plot's street, up its driveway, through its gate, to its module's front door, on the placed village.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { approachReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/approach.mjs";
import { readFileSync } from "node:fs";
const here = (p) => new URL(p, import.meta.url).pathname;
const v = load(here("../delivery/village.nbt")), L = JSON.parse(readFileSync(here("../delivery/layout.json"), "utf8"));
const DOORS = [[5, 1, 16], [17, 2, 9], [29, 2, 10], null, [53, 2, 9], [65, 1, 9], [78, 2, 9], [89, 2, 9]];   // module front doors (sample row)
const Q = { north: 0, east: 1, south: 2, west: 3 }, OUTD = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const NAMES = ["gin", "school", "farmhouse", "smithy (open front)", "church", "tobacco barn", "crib", "owner's house"];
L.plots.forEach((p, i) => {
  const q = Q[p.face], { x0, z0, x1, z1 } = p, map = (lx, lz) => q === 0 ? [x0 + lx, z0 + lz] : q === 1 ? [x1 - lz, z0 + lx] : q === 2 ? [x1 - lx, z1 - lz] : [x0 + lz, z1 - lx];
  const [ox, oz] = OUTD[p.face], along = ox ? [0, 1] : [1, 0];
  const s = [p.gate[0] + ox * (p.driveway + 1) + along[0], 0, p.gate[1] + oz * (p.driveway + 1) + along[1]];
  for (let y = v.size[1] - 1; y >= 0; y--) { const b = v.blockAt(s[0], y, s[2]); if (!/air$/.test(b)) { s[1] = y + 1; break; } }
  let to; if (DOORS[i]) { const [dx, dy, dz] = DOORS[i]; const [x, z] = map(dx - 12 * i, dz - 5); to = [x, p.pad + dy, z]; } else { const [x, z] = map(5, 8); to = [x, p.pad + 1, z]; }
  const r = approachReport(v, { from: s, to });
  console.log(`plot ${i + 1} ${NAMES[i].padEnd(20)} street ${s.join(",")} -> ${to.join(",")}: ${r.ok ? `ok, ${r.length} cells, rise ${r.rise}` : r.faults.map((f) => `${f.kind} @${f.at}`).join("; ")}`);
});
