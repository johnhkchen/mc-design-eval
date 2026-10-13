// Calls each h2 helper once on a small grid; every cell it changes must lie in the footprint it was given, with no refusals.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { quoins, pilaster, fascia, shopfront, oriel, flight, yardWall, streetSurface } from "./h2.mjs";

const g = new Grid([24, 24, 24]);
g.fill([0, 0, 6], [19, 23, 6], "bricks");                // street wall on z 6
g.fill([5, 10, 6], [11, 12, 6], "air");                   // the shell leaves the fascia cells empty
g.fill([14, 10, 6], [18, 12, 6], "air");
g.fill([0, 5, 18], [19, 5, 23], "dirt");                  // ground at the street's surface level

const state = (c) => c.block + JSON.stringify(c.state ?? {});
const snap = () => new Map([...g.cells.values()].map((c) => [c.pos.join(","), state(c)]));

let failed = 0;
function check(name, [lo, hi], run, extra = () => true) {
  const before = snap(), r = run();
  const changed = [...g.cells.values()].filter((c) => before.get(c.pos.join(",")) !== state(c));
  const outside = changed.filter((c) => c.pos.some((v, i) => v < lo[i] || v > hi[i]));
  const ok = changed.length > 0 && outside.length === 0 && r.refused === 0 && r.placed > 0 && extra(r);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${r.placed} placed, ${r.refused} refused, ${outside.length} outside footprint`);
}

check("quoins", [[3, 13, 6], [3, 22, 6]], () => quoins(g, 3, [6]));
check("pilaster", [[1, 6, 6], [1, 12, 7]], () => pilaster(g, 1, 6));
check("fascia", [[14, 10, 6], [18, 12, 7]], () => fascia(g, 14, 18, 6, "TENANT"));
check("shopfront", [[4, 10, 6], [12, 12, 7]], () => shopfront(g, 4, 12, 6, "SHOP"));
check("oriel", [[6, 14, 7], [10, 23, 7]], () => oriel(g, 6, 10, 6));
check("flight", [[14, 7, 15], [16, 13, 20]], () => flight(g, 14, 7, 12, 20, "north", { rail: "+" }), (r) => r.lanesBlocked === 0);
check("yardWall", [[0, 7, 16], [19, 9, 16]], () => yardWall(g, 0, 16, 19, 16, { gates: [[7, 16]] }));
check("streetSurface", [[0, 5, 18], [19, 6, 23]], () => streetSurface(g, 0, 19, { pavement: [18, 19], kerb: 20, road: [21, 23] }));

console.log(failed ? `${failed} helper(s) FAILED` : "all helpers passed");
process.exit(failed ? 1 : 0);
