// Calls every h1 helper once on a grid and checks that each placed cell lies inside the footprint it was given,
// that the returned count matches the cells placed, and that existing blocks are left alone.
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { lattice_bay, tall_fork, arch_leg, arch_ties, leg_plinth, promenade, porch, glaze_bay } from "./h1.mjs";

const g = new Grid([150, 60, 180]);
let failures = 0;

const keyOf = (p) => p.join(",");
const inside = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// Run one helper, then compare the new cells with the footprint `box` and with the helper's own count.
function check(name, box, run) {
  const before = new Set([...g.cells.values()].map((c) => keyOf(c.pos)));
  const count = run();
  const placed = [...g.cells.values()].filter((c) => !before.has(keyOf(c.pos)));
  const outside = placed.filter((c) => !inside(c.pos, box));
  const ok = placed.length > 0 && outside.length === 0 && count === placed.length;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: ${placed.length} cells, ${outside.length} outside [${box}], returned ${count}`);
}

// Existing blocks are never overwritten: arch_leg and leg_plinth must leave these stones alone.
g.set(60, 5, 100, "stone");
g.set(12, 1, 96, "stone");

check("lattice_bay", [10, 1, 39, 13, 8, 41], () => lattice_bay(g, "north", [10, 1, 40], 8));
check("tall_fork", [28, 22, 39, 32, 25, 40], () => tall_fork(g, "north", [30, 22, 40]));
check("arch_leg", [60, 2, 100, 61, 30, 101], () => arch_leg(g, 60, 100, 30));
check("arch_ties", [24, 31, 100, 38, 47, 108], () => arch_ties(g, { x0: 24, x1: 38, z0: 100, z1: 108, spring: 31, crown: 47 }));
check("leg_plinth", [12, 1, 96, 15, 1, 99], () => leg_plinth(g, 12, 96));
check("promenade", [57, 1, 76, 59, 11, 156], () => promenade(g, [57, 76, 59, 156], [[59, 80], [59, 88]]));
check("porch", [17, 1, 54, 22, 5, 56], () => porch(g, [17, 54, 22, 56]));
check("glaze_bay", [100, 1, 60, 100, 4, 62], () => glaze_bay(g, "east", [100, 1, 60], { w: 3, h: 4 }));

if (g.blockAt(60, 5, 100) !== "minecraft:stone") { failures++; console.log("FAIL arch_leg overwrote existing stone"); }
if (g.blockAt(12, 1, 96) !== "minecraft:stone") { failures++; console.log("FAIL leg_plinth overwrote existing stone"); }

console.log(failures ? `${failures} failure(s)` : "all h1 helpers passed");
process.exit(failures ? 1 : 0);
