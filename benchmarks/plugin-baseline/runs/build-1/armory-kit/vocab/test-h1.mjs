// Smoke test for vocab/h1.mjs: every helper once on an empty grid. Each must place blocks, refuse nothing, and keep
// every new block inside the footprint it was given. Then one check that an earlier part's block is never overwritten.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const g = new Grid([80, 40, 80], { dataVersion: 3955 }); // 1.21.1
let failures = 0;
const key = (p) => p.join(",");
const inside = (p, [x0, y0, z0, x1, y1, z1]) =>
  p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;

function run(name, box, call) {
  const before = new Set([...g.cells.values()].map((c) => key(c.pos)));
  const { placed, refused } = call();
  const stray = [...g.cells.values()].filter((c) => !before.has(key(c.pos)) && !inside(c.pos, box));
  const ok = placed > 0 && refused.length === 0 && stray.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${placed}, refused ${refused.length}, outside ${stray.length}`);
}

run("bandedStorey", [2, 1, 2, 20, 31, 3], () => h1.bandedStorey(g, { x0: 2, z0: 2, x1: 20, z1: 10, face: "north" }));
run("curtainWallBay", [30, 1, 40, 36, 26, 41], () => h1.curtainWallBay(g, { x: 30, z: 40 }));
run("roofMonitor", [44, 29, 2, 55, 36, 20], () => h1.roofMonitor(g, { x0: 44, x1: 55, z0: 2, z1: 20 }));
run("porchCanopy", [60, 1, 2, 63, 6, 5], () => h1.porchCanopy(g, { x0: 60, z0: 2 }));
run("redCanopy", [60, 1, 10, 67, 5, 12], () => h1.redCanopy(g, { x0: 60, x1: 67, z0: 10, z1: 12 }));
run("vaultRib", [65, 1, 30, 79, 21, 30], () => h1.vaultRib(g, { z: 30, cx: 72, rod: true }));
run("galleryFace", [2, 1, 59, 24, 14, 60], () => h1.galleryFace(g, { x0: 2, z0: 50, x1: 24, z1: 60, face: "south" }));
run("signBand", [28, 8, 59, 70, 11, 60], () => h1.signBand(g, { x0: 28, x1: 70, z: 60, y0: 8, y1: 11, text: "CHIHULY" }));
run("planeTree", [74, 1, 34, 78, 5, 38], () => h1.planeTree(g, { x: 76, z: 36 }));

// Air-only: a block an earlier part already put down survives, and the helper reports the refusal.
g.set(5, 2, 2, "stone");
const kept = h1.bandedStorey(g, { x0: 2, z0: 2, x1: 20, z1: 10, face: "north" });
const stone = g.blockAt(5, 2, 2) === "minecraft:stone";
const refusedThere = kept.refused.some(([x, y, z]) => x === 5 && y === 2 && z === 2);
if (!stone || !refusedThere) failures++;
console.log(`${stone && refusedThere ? "ok  " : "FAIL"} air-only: earlier stone kept, refusal reported`);

// Ground stays untouched: nothing at y0.
const ground = [...g.cells.values()].filter((c) => c.pos[1] === 0);
if (ground.length) failures++;
console.log(`${ground.length ? "FAIL" : "ok  "} ground: ${ground.length} blocks at y0`);

console.log(failures ? `${failures} check(s) failed` : "all helper checks passed");
process.exitCode = failures ? 1 : 0;
