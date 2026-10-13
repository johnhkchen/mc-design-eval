// Calls every h3 helper once on an air grid (ground row y0 pre-filled with grass). Each must place blocks, keep every
// placed cell inside the footprint box it was given, and leave the ground row alone. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

// [name, call, footprint [x0,y0,z0,x1,y1,z1]]
const cases = [
  ["balustrade", (g) => h3.balustrade(g, 25, 30, 35, 11), [25, 11, 35, 30, 12, 35]],
  ["shutterPair", (g) => h3.shutterPair(g, 26, 27, 4, 3, "north", 42), [25, 4, 41, 28, 6, 41]],
  ["vaultCove", (g) => h3.vaultCove(g, 38, 47, 62, 74, 15), [38, 15, 62, 47, 17, 74]],
  ["cherryTree", (g) => h3.cherryTree(g, 10, 8, 1), [7, 1, 5, 13, 7, 11]],
  ["urn", (g) => h3.urn(g, 47, 27, 1), [46, 1, 26, 49, 2, 29]],
  ["fountain", (g) => h3.fountain(g, 10, 45, 1), [10, 1, 45, 16, 3, 51]],
  ["cottage north", (g) => h3.cottage(g, 76, 64, "north", 1), [74, 1, 59, 89, 15, 76]],
  ["cottage east", (g) => h3.cottage(g, 10, 10, "east", 1), [9, 1, 9, 26, 15, 22]],
  ["frontSteps", (g) => h3.frontSteps(g, 45, 32, "south", 6, 1), [44, 1, 32, 51, 5, 34]],
];

let failed = 0;
for (const [name, call, [x0, y0, z0, x1, y1, z1]] of cases) {
  const g = new Grid([96, 24, 96]);
  for (let x = 0; x < 96; x++) for (let z = 0; z < 96; z++) g.set(x, 0, z, "grass_block");
  const r = call(g);
  let placed = 0, outside = [];
  for (const c of g) {
    const [x, y, z] = c.pos;
    if (y === 0 && c.block === "minecraft:grass_block") continue;
    placed++;
    if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) outside.push(`${x},${y},${z} ${c.block}`);
  }
  const groundOk = [...g].filter((c) => c.pos[1] === 0).every((c) => c.block === "minecraft:grass_block");
  const ok = placed > 0 && outside.length === 0 && groundOk;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${placed}, skipped ${r.skipped}${outside.length ? `, outside: ${outside.slice(0, 3).join(" | ")}` : ""}${groundOk ? "" : ", ground row changed"}`);
}
if (failed) { console.log(`${failed} helper(s) failed`); process.exit(1); }
console.log("all h3 helpers passed");
