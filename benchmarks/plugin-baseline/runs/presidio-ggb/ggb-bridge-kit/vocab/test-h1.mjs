// Calls each h1 helper on a fresh grid and checks that every cell it placed is inside the footprint it was given,
// that nothing reached y 0, and that the air-only rule holds. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { legStage, bandCourse, xBrace, saddleCap, walkway, cableCell, lanternAt } from "./h1.mjs";

const DV = 3955;   // Minecraft 1.21.1
const SIZE = [48, 118, 24];
let fails = 0;
const fresh = () => new Grid(SIZE, { dataVersion: DV });

function check(name, g, fp, res, { placed = true } = {}) {
  const [x0, y0, z0, x1, y1, z1] = fp;
  const outside = [...g.cells.values()].filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1 || y < 1);
  const ok = outside.length === 0 && (!placed || res.placed > 0);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${res.placed}, refused ${res.refused.length}${outside.length ? `, ${outside.length} outside` : ""}`);
}

{
  const g = fresh();
  check("legStage west S1", g, [14, 6, 8, 18, 54, 15], legStage(g, "west", 6, 54, 14, 18, 8, 15));
  const e = fresh();
  const r = legStage(e, "east", 6, 54, 14, 18, 8, 15);
  check("legStage east mirrors to x 28..32", e, [28, 6, 8, 32, 54, 15], r);
  const a = fresh();
  a.set(15, 10, 10, "minecraft:stone");
  const ra = legStage(a, "west", 6, 12, 14, 18, 8, 15);
  const kept = a.blockAt(15, 10, 10) === "minecraft:stone" && ra.refused.some((c) => c[0] === 15 && c[1] === 10 && c[2] === 10);
  if (!kept) fails++;
  console.log(`${kept ? "ok  " : "FAIL"} legStage leaves an occupied cell alone (refused, not overwritten)`);
}
{
  const g = fresh();
  legStage(g, "west", 6, 54, 14, 18, 8, 15);
  const r = bandCourse(g, 6, [14, 8, 18, 15], { over: true });
  const ok = r.placed === 40 && g.blockAt(14, 6, 8) === "minecraft:orange_concrete";
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} bandCourse y6 replaces the built leg course with { over: true }: placed ${r.placed}`);
  const air = bandCourse(g, 6, [14, 8, 18, 15]);
  if (air.placed !== 0 || air.refused.length !== 40) fails++;
  console.log(`${air.placed === 0 ? "ok  " : "FAIL"} bandCourse default is air-only: placed ${air.placed}, refused ${air.refused.length}`);
}
{
  const g = fresh();
  check("xBrace 4 deep", g, [19, 8, 10, 27, 27, 13], xBrace(g, [19, 8, 10, 27, 27, 13]));
}
{
  const w = fresh();
  check("saddleCap west", w, [15, 112, 10, 18, 116, 13], saddleCap(w, "west", [15, 112, 10, 18, 13]));
  const e = fresh();
  check("saddleCap east mirrors to x 28..31", e, [28, 112, 10, 31, 116, 13], saddleCap(e, "east", [15, 112, 10, 18, 13]));
  if (e.blockAt(30, 112, 11) !== "minecraft:air") { fails++; console.log("FAIL saddleCap east groove (x 30) must stay open at y 112"); }
}
{
  const w = fresh();
  check("walkway west", w, [11, 37, 0, 18, 39, 23], walkway(w, "west"));
  const e = fresh();
  check("walkway east mirrors to x 28..35", e, [28, 37, 0, 35, 39, 23], walkway(e, "east"));
}
{
  const g = fresh();
  const r = cableCell(g, 0, 4, 45.6);
  const slab = g.get(0, 46, 4);
  const ok = r.placed === 2 && g.blockAt(0, 45, 4) === "minecraft:orange_concrete" && slab?.block === "minecraft:smooth_red_sandstone_slab";
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} cableCell band with half-step slab`);
  check("cableCell footprint", g, [0, 45, 4, 0, 46, 4], r);
}
{
  const g = fresh();
  const none = lanternAt(g, 11, 6, 5);
  g.set(11, 5, 5, "minecraft:light_gray_concrete");
  const ok = none.refused.length === 1 && lanternAt(g, 11, 6, 5).placed === 1;
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} lanternAt needs support below`);
}

console.log(fails ? `${fails} FAILED` : "all h1 checks passed");
process.exit(fails ? 1 : 0);
