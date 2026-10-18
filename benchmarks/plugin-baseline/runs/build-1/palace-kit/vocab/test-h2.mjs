// Smoke test for vocab/h2.mjs: each helper runs once on a site-sized grid, and every cell it changes must lie inside
// the footprint it was given. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h2.mjs";

const g = new Grid([112, 71, 64]);
let failures = 0;

// Run fn; list the cells it changed (new or different block) and check each one is inside box.
function check(name, box, fn, expectChanges = true) {
  const before = new Map([...g].map((c) => [c.pos.join(), c.block]));
  const result = fn();
  const changed = [...g].filter((c) => before.get(c.pos.join()) !== c.block);
  const outside = changed.filter(({ pos: [x, y, z] }) => x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5]);
  const ok = outside.length === 0 && (!expectChanges || changed.length > 0);
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${changed.length} cells changed, ${outside.length} outside footprint`);
  return result;
}

// archCut: the N face of the rotunda, carved over a solid ring band
g.fill([5, 1, 5], [58, 25, 10], "smooth_sandstone");
check("archCut", [5, 1, 5, 58, 25, 10], () => h.archCut(g, [5, 1, 5, 58, 25, 10], "N", { carve: true }));

check("corinthianCol", [38, 1, 38, 41, 29, 41], () => h.corinthianCol(g, 39.5, 39.5, "granite"));
if (h.corinthianCol(g, 39.5, 39.5, "granite") !== 0) { failures++; console.log("FAIL corinthianCol wrote into occupied cells"); }

check("cornice", [8, 33, 8, 23, 34, 23], () => h.cornice(g, [8, 33, 8, 23, 34, 23], { ledge: true }));
check("statuePier", [19, 34, 4, 21, 45, 6], () => h.statuePier(g, { x: 20, z: 5, ox: -1, oz: -1 }));
check("coffers", [8, 46, 8, 55, 68, 55], () => h.coffers(g, [31.5, 46, 31.5]));
check("planterBox", [66, 25, 3, 77, 32, 14], () => h.planterBox(g, 67, 76, 4, 13));
check("niche", [91, 3, 2, 93, 12, 3], () => h.niche(g, "north", [91, 3, 2, 93, 12, 3]));
check("shedRoof", [96, 16, 7, 111, 24, 23], () => h.shedRoof(g, [96, 7, 111, 23], 24));

// planterBox leaves are persistent (decay-proof)
const leaf = [...g].find((c) => /leaves$/.test(c.block));
if (!leaf || leaf.state?.persistent !== "true") { failures++; console.log("FAIL planterBox leaves not persistent"); }

console.log(failures ? `${failures} failure(s)` : "all helpers passed");
process.exit(failures ? 1 : 0);
