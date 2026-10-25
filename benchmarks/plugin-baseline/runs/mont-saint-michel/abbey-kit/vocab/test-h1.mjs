// Calls every h1 helper once on a fresh grid and checks each placed block sits inside the footprint it returned, that the
// footprint and count match what its arguments imply, and that an occupied footprint is refused. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { footing, lancet, parapet, crocket, flyer, dormer, machicolation, chapel_cap } from "./h1.mjs";

const DATA_VERSION = 3955; // Minecraft 1.21.1 (the server)
const g = new Grid([30, 30, 30], { dataVersion: DATA_VERSION });
g.fill([0, 0, 0], [29, 3, 29], "stone"); // the rock: y 0..3, under every helper
const key = (p) => p.join(",");
const inBox = (p, [x0, y0, z0, x1, y1, z1]) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;
let failed = 0;

// Run one helper call, then check: footprint and placed count as expected, every added block inside the footprint.
function check(name, call, expectBox, expectPlaced) {
  const before = new Set(g.solids().map((c) => key(c.pos)));
  const r = call();
  const added = g.solids().filter((c) => !before.has(key(c.pos))).map((c) => c.pos);
  const outside = added.filter((p) => !inBox(p, r.box));
  const boxOk = key(r.box) === key(expectBox);
  const ok = boxOk && r.placed === expectPlaced && added.length === expectPlaced && outside.length === 0 && r.refused.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${r.placed}, box [${r.box}]${boxOk ? "" : ` (expected [${expectBox}])`}` +
    (outside.length ? `, ${outside.length} outside the footprint` : "") + (r.refused.length ? `, refused ${r.refused.length}` : ""));
}

check("footing", () => footing(g, 5, 5, 8), [5, 4, 5, 5, 7, 5], 4);
check("lancet", () => lancet(g, 10, 6, 10, "north", 5), [10, 6, 10, 10, 10, 10], 5);
check("parapet", () => parapet(g, [12, 10, 10], [18, 10, 10]), [12, 10, 10, 18, 10, 10], 4);
check("crocket", () => crocket(g, 20, 10, 10, "north"), [20, 10, 10, 20, 10, 10], 1);
check("flyer", () => flyer(g, 22, 8, 10, "north", 6), [22, 8, 11, 22, 11, 16], 6);
check("dormer", () => dormer(g, 14, 6, 14, "north"), [13, 6, 14, 15, 9, 15], 24);
check("machicolation", () => machicolation(g, 20, 9, 18, "north", 4), [20, 9, 18, 23, 9, 18], 4);
check("chapel_cap", () => chapel_cap(g, 8, 20, 20, 2, 3), [6, 20, 18, 10, 22, 22], 35);

// Refusal: the lancet's cells are all solid now, so a second call places nothing and reports every cell.
const again = lancet(g, 10, 6, 10, "north", 5);
const refusedOk = again.placed === 0 && again.refused.length === 5;
if (!refusedOk) failed++;
console.log(`${refusedOk ? "ok  " : "FAIL"} lancet refuses an occupied opening: placed ${again.placed}, refused ${again.refused.length}`);

// The rock must be untouched: no helper writes below its footprint.
const rockOk = g.solids().filter((c) => c.pos[1] <= 3).every((c) => c.block === "minecraft:stone") && g.blockAt(5, 3, 5) === "minecraft:stone";
if (!rockOk) failed++;
console.log(`${rockOk ? "ok  " : "FAIL"} rock floor untouched`);

console.log(failed ? `${failed} check(s) failed` : "all h1 checks passed");
process.exit(failed ? 1 : 0);
