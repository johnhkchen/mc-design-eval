// Calls each H3 helper once on a fresh grid and checks it placed blocks only inside the footprint it was given,
// that it reported what it placed, and that it left a pre-existing block (an earlier part's) alone.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h3.mjs";

// north face frame (plan rule 1): u = x, d = depth in from z0 = 20
const F = { at: (u, d) => [u, 20 + d] };
const inside = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

let failed = 0;
function check(name, box, setup, call) {
  const g = new Grid([48, 128, 48]);
  setup(g);
  const before = new Map(g.solids().map((c) => [c.pos.join(), c.block]));
  const n = call(g);
  const placed = g.solids().filter((c) => !before.has(c.pos.join()));
  const outside = placed.filter((c) => !inside(c.pos, box));
  const overwritten = [...before].filter(([k, b]) => g.get(...k.split(",").map(Number))?.block !== b);
  const ok = placed.length > 0 && placed.length === n && outside.length === 0 && overwritten.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: ${placed.length} placed (returned ${n})${outside.length ? `, ${outside.length} outside footprint` : ""}${overwritten.length ? `, ${overwritten.length} overwritten` : ""}`);
}
const none = () => {};
const floor = (x, y, z) => (g) => g.set(x, y, z, "minecraft:stone");

check("ground", [0, 0, 0, 9, 0, 9], none, (g) => h.ground(g, 0, 0, 9, 9));
check("terraceAndFloor", [10, 9, 22, 20, 9, 25], floor(10, 9, 23), (g) => h.terraceAndFloor(g, F, 10, 20, 2, 5, 9));
check("attic", [22, 34, 32, 34, 38, 33], none, (g) => h.attic(g, F, 22, 34, 12, 34, 38, { windows: [[26, 27]], wy: [36, 37] }));
check("doricColumn", [36, 10, 30, 37, 12, 31], none, (g) => h.doricColumn(g, 36, 30, 10, 12));
check("cornice", [10, 36, 21, 20, 36, 21], none, (g) => h.cornice(g, F, 10, 20, 1, 36));
check("upperSills", [10, 10, 25, 11, 22, 25], none, (g) => h.upperSills(g, F, 10, 6, 10, 22));
check("archedDoorway", [40, 1, 20, 43, 8, 23], none, (g) => h.archedDoorway(g, F, 40, 1));
check("drumWindow", [2, 43, 2, 45, 60, 45], none, (g) => h.drumWindow(g, 23.5, 23.5, 0, 4, 44));
check("lanternTemple", [17, 101, 17, 30, 125, 30], none, (g) => h.lanternTemple(g, 23.5, 23.5, 101));
check("lampStandard", [12, 2, 12, 12, 5, 12], floor(12, 1, 12), (g) => h.lampStandard(g, 12, 2, 12));

console.log(failed ? `${failed} helper(s) FAILED` : "all H3 helpers passed");
process.exitCode = failed ? 1 : 0;
