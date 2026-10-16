// Calls each h3 helper once on an air grid: every block it places must sit inside its footprint. Then calls each again
// on a solid grid: it must place nothing (writes only into air). Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const inBox = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const changed = (g, before) => [...g.cells.entries()].filter(([k, v]) => before.get(k) !== v).map(([, v]) => v.pos);

// [name, setup (optional), call, footprint box [x0,y0,z0,x1,y1,z1]]
const cases = [
  ["fence_run", null, (g) => h3.fence_run(g, 0, "spruce_fence", 5), [0, 1, 5, 11, 1, 18]],
  ["fishscale", null, (g) => h3.fishscale(g, [2, 3, 3, 4, 6, 4], "birch_planks", "birch_slab"), [2, 3, 3, 4, 6, 4]],
  ["shutter", null, (g) => h3.shutter(g, [3, 3, 4], "north", "spruce", { height: 2 }), [3, 3, 4, 3, 4, 4]],
  ["front_steps", null, (g) => h3.front_steps(g, 5, 6, 6), [5, 1, 6, 6, 1, 6]],
  ["hearth_face", null, (g) => h3.hearth_face(g, 4, 3, 16, "north"), [3, 3, 15, 5, 4, 16]],
  ["chair", null, (g) => h3.chair(g, 2, 3, 12, "south"), [2, 3, 12, 2, 3, 12]],
  ["hanging_lantern", (g) => g.set(3, 8, 5, "spruce_planks"), (g) => h3.hanging_lantern(g, 3, 6, 5), [3, 6, 5, 3, 7, 5]],
  ["wagon", null, (g) => h3.wagon(g, 3, 9, "north"), [3, 1, 8, 4, 2, 12]],
  ["picnic_table", null, (g) => h3.picnic_table(g, 2, 5, 9), [2, 1, 8, 5, 2, 10]],
  ["cornice", null, (g) => h3.cornice(g, 2, 9, 9, 10), [2, 10, 9, 9, 10, 9]],
];

let failed = 0;
const report = (ok, msg) => { if (!ok) failed++; console.log(`${ok ? "ok  " : "FAIL"} ${msg}`); };

for (const [name, setup, call, box] of cases) {
  // 1. air grid: placed blocks are inside the footprint, and something was placed
  const g = new Grid([20, 12, 20]);
  setup?.(g);
  const before = new Map(g.cells);
  const count = call(g);
  const cells = changed(g, before);
  const outside = cells.filter((p) => !inBox(box, p));
  report(count > 0 && cells.length === count && outside.length === 0,
    `${name}: placed ${count}, all inside footprint${outside.length ? ` (outside: ${outside.map((p) => p.join(",")).join(" ")})` : ""}`);

  // 2. solid grid: nothing is written
  const s = new Grid([20, 12, 20]);
  s.fill([0, 0, 0], [19, 11, 19], "stone");
  setup?.(s);
  const sBefore = new Map(s.cells);
  const sCount = call(s);
  report(sCount === 0 && changed(s, sBefore).length === 0, `${name}: writes nothing into solid blocks`);
}

if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
console.log("all h3 checks passed");
