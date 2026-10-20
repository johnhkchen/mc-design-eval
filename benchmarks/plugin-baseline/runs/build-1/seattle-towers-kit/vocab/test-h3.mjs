// Smoke test for vocab/h3.mjs: calls each helper once on a small grid and checks that every block it changed lies
// inside the footprint it was given, that the ground course is untouched, and that air-only writes leave solid cells alone.
// Usage: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { curtainDrum, colonnade, punchedWindow, canopy, balconyBay, pergola, lampPost } from "./h3.mjs";

const g = new Grid([40, 12, 40], { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, 0, 0], [39, 0, 39], "smooth_stone");
const sig = (c) => `${c.block}|${JSON.stringify(c.state ?? {})}`;
const inside = (p, [x0, y0, z0, x1, y1, z1]) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;
let failed = 0;

function run(name, footprint, fn) {
  const before = new Map([...g.cells].map(([k, c]) => [k, sig(c)]));
  const n = fn();
  const changed = [...g.cells.values()].filter((c) => before.get(c.pos.join(",")) !== sig(c));
  const stray = changed.filter((c) => !inside(c.pos, footprint));
  const ok = n > 0 && changed.length === n && stray.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: wrote ${n}, changed ${changed.length}, outside footprint ${stray.length}`);
}

run("curtainDrum", [6, 1, 6, 18, 8, 18], () => curtainDrum(g, { cx: 12, cz: 12, r: 6, y0: 1, y1: 8, rings: [3, 7] }));
run("colonnade", [2, 1, 4, 20, 7, 5], () => colonnade(g, { run: { x0: 2, x1: 20, z: 4 }, every: 8 }));
run("punchedWindow", [30, 7, 20, 31, 10, 20], () => punchedWindow(g, { x: 30, z: 20, face: "north", slab: 7 }));
run("canopy", [22, 6, 20, 25, 6, 23], () => canopy(g, { box: [22, 20, 25, 23], y: 6 }));
run("balconyBay", [4, 6, 2, 8, 8, 4], () => balconyBay(g, { x0: 4, z0: 2, slab: 6, cut: true }));
run("pergola", [30, 8, 20, 35, 10, 25], () => pergola(g, [30, 8, 20, 35, 10, 25]));
run("lampPost", [10, 1, 30, 10, 5, 30], () => lampPost(g, 10, 30, 1));

// Air-only: a solid cell inside a footprint must survive, and the post must come out short by one.
g.set(10, 3, 32, "stone");
const placed = lampPost(g, 10, 32, 1);
const kept = g.blockAt(10, 3, 32) === "minecraft:stone";
if (!kept || placed !== 4) failed++;
console.log(`${kept && placed === 4 ? "PASS" : "FAIL"} lampPost air-only: kept solid cell ${kept}, wrote ${placed} of 5`);

const ground = [...g.cells.values()].filter((c) => c.pos[1] === 0).every((c) => c.block === "minecraft:smooth_stone");
if (!ground) failed++;
console.log(`${ground ? "PASS" : "FAIL"} ground course untouched`);

if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
console.log("all h3 checks passed");
