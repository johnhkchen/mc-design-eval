// Smoke test for vocab/h1.mjs: each helper runs once on a site-sized grid, must place something, and every block it
// placed must lie inside the footprint it was given. Also: nothing is written over an existing block unless opts.over
// names it. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h1.mjs";

const SIZE = [112, 71, 64];
const fresh = () => new Grid(SIZE, { dataVersion: 3955 });
let failures = 0;

// Run fn on a fresh grid; every non-air cell must lie inside box = [x0, y0, z0, x1, y1, z1].
function check(name, box, fn) {
  const g = fresh();
  const r = fn(g);
  const cells = g.solids();
  const outside = cells.filter(({ pos: [x, y, z] }) => x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5]);
  const ok = cells.length > 0 && outside.length === 0 && r.placed === cells.length;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${cells.length} placed, ${r.refused} refused, ${outside.length} outside footprint`);
}

check("octRing", [16, 1, 16, 39, 3, 39], (g) => h.octRing(g, [27.5, 27.5], 6, 12, 1, 3, "smooth_sandstone"));
check("archivolt", [14, 1, 14, 41, 29, 41], (g) => h.archivolt(g, [27.5, 27.5], "n", "out", 12));
check("archivolt (inner pilasters)", [14, 1, 14, 41, 29, 41], (g) => h.archivolt(g, [27.5, 27.5], "n", "in", 12));
check("peristyleCol", [39, 1, 3, 42, 20, 6], (g) => h.peristyleCol(g, 40, 4));
check("reliefPanel", [2, 35, 2, 53, 43, 53], (g) => h.reliefPanel(g, [27.5, 27.5], "n"));
check("domeShell", [3, 2, 3, 52, 24, 52], (g) => h.domeShell(g, [27.5, 27.5], { base: 2 }));
check("medallion", [19, 0, 19, 36, 0, 36], (g) => h.medallion(g, [27.5, 27.5]));
check("weepingFigure", [19, 25, 19, 21, 30, 21], (g) => h.weepingFigure(g, 20, 20, "se"));
check("blindArch", [25, 3, 4, 36, 17, 4], (g) => h.blindArch(g, 30.5, 4));
check("lampStandard", [50, 1, 50, 50, 4, 50], (g) => h.lampStandard(g, 50, 50));

// Air rule: a block an earlier part put down is refused, not overwritten.
{
  const g = fresh();
  g.set(27, 2, 16, "bedrock");
  const r = h.octRing(g, [27.5, 27.5], 6, 12, 1, 3, "smooth_sandstone");
  const kept = g.blockAt(27, 2, 16) === "minecraft:bedrock" && r.refused > 0;
  if (!kept) failures++;
  console.log(`${kept ? "ok  " : "FAIL"} air rule: existing block kept, ${r.refused} refused`);
}

// Ground rule: the medallion writes nothing over paving unless opts.over names smooth_stone.
{
  const g = fresh();
  g.fill([19, 0, 19], [36, 0, 36], "smooth_stone");
  const plain = h.medallion(g, [27.5, 27.5]);
  const over = h.medallion(g, [27.5, 27.5], { over: ["smooth_stone"] });
  const ok = plain.placed === 0 && over.placed > 0;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} medallion over paving: plain ${plain.placed}, with over ${over.placed}`);
}

console.log(failures ? `${failures} FAILED` : "all helpers passed");
process.exitCode = failures ? 1 : 0;
