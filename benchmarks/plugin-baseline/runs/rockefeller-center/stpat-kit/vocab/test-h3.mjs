// Calls each h3 helper once on a small 1.21.1 grid over a stone floor. For each call: every cell it changed lies inside
// the footprint it was given and was air before, the changed cells match the count it returns, and nothing it
// returns zero for. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import * as h3 from "./h3.mjs";

const g = new Grid([70, 60, 50], { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, 0, 0], [69, 0, 49], "stone");       // the floor: no helper may write into it
g.fill([40, 10, 30], [52, 10, 40], "stone");   // a deck for roof_light
g.set(10, 6, 5, "stone");                      // an existing block the string course must leave alone

const key = (p) => p.join(",");
const state = (c) => JSON.stringify([c.block, c.state ?? null]);
const inBox = (p, [lo, hi]) => p.every((v, i) => v >= lo[i] && v <= hi[i]);
const wasAir = (s) => s === undefined || JSON.parse(s)[0] === "minecraft:air";

let failed = 0;
function run(name, box, call) {
  const before = new Map([...g.cells.values()].map((c) => [key(c.pos), state(c)]));
  const n = call();
  const changed = [...g.cells.values()].filter((c) => before.get(key(c.pos)) !== state(c));
  const outside = changed.filter((c) => !inBox(c.pos, box) || !wasAir(before.get(key(c.pos))));
  if (outside.length || changed.length !== n || n === 0) {
    failed++;
    console.log(`FAIL ${name}: returned ${n}, changed ${changed.length}, outside or not air: ${outside.map((c) => key(c.pos)).join(" ")}`);
  } else console.log(`ok   ${name}: ${n} blocks`);
}

run("string_course", [[10, 6, 2], [10, 6, 12]], () => h3.string_course(g, 10, 2, 10, 12, 6, "west"));
run("portal_arch", [[30, 3, 7], [32, 14, 13]], () => h3.portal_arch(g, [30, 3, 10], "west", 2, 5, 8));
run("pinnacle", [[49, 3, 4], [51, 9, 6]], () => h3.pinnacle(g, 50, 3, 5, 6));
run("crocket", [[52, 4, 5], [52, 4, 5]], () => h3.crocket(g, 52, 4, 5, "east"));
run("rose_window", [[5, 22, 16], [6, 30, 24]], () => h3.rose_window(g, [5, 26, 20], "west"));
run("gable_roof_z", [[20, 28, 2], [33, 36, 12]], () => h3.gable_roof_z(g, [20, 2, 33, 12], 28, 35));
run("fleche", [[55, 30, 19], [57, 46, 21]], () => h3.fleche(g, [56, 30, 20]));
run("roof_light", [[40, 11, 30], [52, 11, 40]], () => h3.roof_light(g, [40, 10, 30], [52, 10, 40]));
run("tree", [[43, 1, 43], [47, 6, 47]], () => h3.tree(g, 45, 0, 45));

console.log(failed ? `${failed} helper(s) failed` : "all h3 helpers passed");
process.exitCode = failed ? 1 : 0;
