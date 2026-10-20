// Calls each helper in vocab/h3.mjs once on a small grid. Passes when every placed cell is inside the footprint the
// helper was given, something was placed, and a block seeded inside the footprint is never overwritten (air only).
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { plinth, doorPair, pilaster, stuccoBay, courtyardWall, bladeSign, waterTank, umbrella } from "./h3.mjs";

const STONE = "minecraft:stone";
const cases = [
  ["plinth", (g) => plinth(g, { ring0: [[10, 10, 2], [11, 10, 2], [12, 10, 3]] }, { top: 5, block: "smooth_stone", cap: "polished_andesite" }), [10, 2, 10, 12, 6, 10], [11, 3, 10]],
  ["doorPair", (g) => doorPair(g, { x: 20, z: 12, y: 9, face: "north", ground: 8 }), [20, 8, 9, 21, 10, 12], [20, 10, 12]],
  ["pilaster", (g) => pilaster(g, [[30, 20], [30, 21], [31, 21]], { y0: 4, y1: 9 }), [30, 4, 20, 31, 9, 21], [30, 5, 20]],
  ["stuccoBay", (g) => stuccoBay(g, { cells: Array.from({ length: 8 }, (_, i) => [40 + i, 40]), face: "north" }), [42, 14, 39, 45, 28, 39], [43, 20, 39]],
  ["courtyardWall", (g) => courtyardWall(g, { cells: Array.from({ length: 8 }, (_, i) => [24 + i, 18]), face: "south" }, { floors: [14] }), [24, 14, 17, 31, 17, 19], [26, 15, 19]],
  ["bladeSign", (g) => bladeSign(g, { x0: 53, z: 10, y0: 9, y1: 28, face: "north", word: "PALIHOTEL" }), [53, 9, 10, 55, 28, 10], [54, 20, 10]],
  ["waterTank", (g) => waterTank(g, { cx: 32, cz: 32, r: 2, y0: 37 }), [30, 37, 30, 34, 43, 34], [31, 38, 31]],
  ["umbrella", (g) => umbrella(g, [40, 30, 40]), [39, 30, 39, 41, 32, 41], [40, 32, 40]],
];

let failed = 0;
for (const [name, run, box, seed] of cases) {
  const g = new Grid([60, 44, 60]);
  g.set(...seed, STONE);
  const cells = run(g);
  const [x0, y0, z0, x1, y1, z1] = box;
  const outside = cells.filter(([x, y, z]) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const kept = g.blockAt(...seed) === STONE && !cells.some((c) => c.join() === seed.join());
  const ok = cells.length > 0 && outside.length === 0 && kept;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${cells.length} cells${outside.length ? `, outside ${JSON.stringify(outside.slice(0, 3))}` : ""}${kept ? "" : ", seeded block overwritten"}`);
}
console.log(failed ? `${failed} helper(s) failed` : "all helpers passed");
process.exitCode = failed ? 1 : 0;
