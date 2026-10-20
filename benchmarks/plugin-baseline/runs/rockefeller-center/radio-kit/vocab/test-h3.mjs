// Calls each H3 helper once on an empty grid and checks it wrote only inside the footprint it reports (and the
// expected one). A second call must write nothing: the helpers are air-only. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const SIZE = [100, 120, 60];
const inside = (p, b) => p.every((v, i) => v >= b[i] && v <= b[i + 3]);
const sameBox = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

const cases = [
  ["pier_wall", (g) => h3.pier_wall(g, { face: "west", at: 5, from: 10, to: 20, y0: 1, y1: 9 }), [5, 1, 10, 6, 9, 20]],
  ["crown_lantern", (g) => h3.crown_lantern(g, { x: 13, y: 112, z: 25 }), [13, 112, 25, 16, 118, 28]],
  ["marquee_end", (g) => h3.marquee_end(g, [2, 6, 30]), [2, 6, 30, 2, 10, 30]],
  ["roundel", (g) => h3.roundel(g, { center: [14, 16, 49], face: "south", r: 3 }), [11, 13, 49, 17, 19, 50]],
  ["shopfront_bay", (g) => h3.shopfront_bay(g, { face: "west", at: 3, from: 6 }), [3, 1, 6, 4, 6, 8]],
  ["skylight_strip", (g) => h3.skylight_strip(g, { x0: 50, x1: 74, z0: 22, y: 31 }), [50, 30, 22, 74, 31, 23]],
  ["roof_lights", (g) => h3.roof_lights(g, { x0: 20, x1: 30, z0: 20, z1: 30, y: 33 }, 6), [20, 33, 20, 30, 33, 30]],
  ["lamp_stub", (g) => h3.lamp_stub(g, 35, 35), [35, 1, 35, 35, 3, 35]],
];

let failed = 0;
for (const [name, run, expect] of cases) {
  const g = new Grid(SIZE, { dataVersion: 3955 });
  for (let x = 0; x < SIZE[0]; x++) for (let z = 0; z < SIZE[2]; z++) g.set(x, 0, z, "smooth_stone");   // ground course
  const first = run(g);
  const again = run(g);
  const built = [...g.cells.values()].filter((c) => c.pos[1] > 0);
  const outside = built.filter((c) => !inside(c.pos, expect) || !inside(c.pos, first.box)).length;
  const groundTouched = [...g.cells.values()].filter((c) => c.pos[1] === 0 && c.block !== "minecraft:smooth_stone").length;
  const ok = sameBox(first.box, expect) && built.length > 0 && first.skipped === 0 && outside === 0
    && groundTouched === 0 && again.placed === 0 && again.skipped > 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${built.length} cells, box ${JSON.stringify(first.box)}, outside ${outside}, ground ${groundTouched}, rerun placed ${again.placed} skipped ${again.skipped}`);
}
if (failed) { console.log(`${failed} failed`); process.exitCode = 1; } else console.log("all H3 helpers passed");
