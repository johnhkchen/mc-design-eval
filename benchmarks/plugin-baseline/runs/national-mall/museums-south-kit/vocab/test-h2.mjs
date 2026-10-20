// Calls every h2 helper once on a fresh grid and checks what it placed lies inside the footprint it was given.
// Also checks that an air-only helper refuses a solid cell and leaves it alone. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { slot, entry_steps, spire, glow_floor, ribbon, boulder, birch } from "./h2.mjs";

const SIZE = [140, 30, 30];
let failures = 0;

function check(name, [x0, y0, z0, x1, y1, z1], run) {
  const g = new Grid(SIZE);
  const r = run(g);
  const cells = [...g.cells.values()].filter((c) => c.block !== "minecraft:air");
  const outside = cells.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ok = cells.length > 0 && outside.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${r.placed} placed, ${r.refused.length} refused${outside.length ? `, ${outside.length} outside the footprint` : ""}`);
}

check("slot", [5, 9, 4, 11, 9, 5], (g) => slot(g, 5, 11, 4, 5));
check("entry_steps", [38, 1, 3, 49, 1, 5], (g) => entry_steps(g, 38, 49, 3, 4, 5));
check("spire", [34, 2, 1, 36, 17, 3], (g) => spire(g, 35, 2));
check("glow_floor", [17, 1, 8, 21, 1, 8], (g) => glow_floor(g, [[17, 8], [21, 8]]));
check("ribbon", [95, 6, 1, 127, 6, 19], (g) => ribbon(g, { cx: 111, cz: 10, rx: 16, rz: 9 }, 6, (x, z) => z >= 14 || x <= 101));
check("boulder", [132, 1, 3, 133, 2, 4], (g) => boulder(g, 132, 3, 0));
check("birch", [93, 1, 13, 97, 6, 17], (g) => birch(g, 95, 15, 0));

{
  const g = new Grid(SIZE);
  g.set(5, 9, 4, "stone");
  const r = slot(g, 5, 5, 4, 5);
  const ok = r.refused.length === 1 && g.blockAt(5, 9, 4) === "minecraft:stone" && g.blockAt(5, 9, 5) === "minecraft:tinted_glass";
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} slot refuses a solid outer cell and keeps it`);
}

console.log(failures ? `${failures} failed` : "all h2 helpers passed");
process.exitCode = failures ? 1 : 0;
