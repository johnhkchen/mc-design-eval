// Smoke test for vocab/h3.mjs: every helper once, in its own region of a small grid. Each block it changes must lie
// inside the footprint it was given, and it must place something. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const g = new Grid([64, 80, 64], { dataVersion: 3955 });   // 1.21.1, the server version
let failures = 0;
const report = (ok, name, detail = "") => { console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`); if (!ok) failures++; };
const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

/** Run one helper call and check that every changed cell is inside its footprint. */
function run(name, footprint, call, want = null) {
  const before = new Map(g.cells);
  const placed = call();
  const changed = [...g.cells.entries()].filter(([k, c]) => before.get(k) !== c).map(([, c]) => c.pos);
  const outside = changed.filter((p) => !inside(footprint, p));
  const countOk = want === null || placed === want;
  report(placed > 0 && outside.length === 0 && countOk && changed.length === placed, name,
    `${placed} placed${want !== null ? ` (want ${want})` : ""}${outside.length ? `, outside footprint e.g. ${outside[0]}` : ""}`);
}

run("litWindow", [2, 9, 2, 2, 9, 2], () => { g.set(2, 9, 2, "black_concrete"); return h3.litWindow(g, [2, 9, 2], "shroomlight"); }, 1);
report(g.blockAt(2, 9, 2) === "minecraft:shroomlight", "litWindow swapped the backing");

run("towerFace", [6, 2, 6, 8, 30, 26], () => h3.towerFace(g, "west", [6, 2, 6, 24, 30, 26]));

run("penthouse", [30, 20, 6, 40, 26, 16], () => h3.penthouse(g, [30, 20, 6, 40, 26, 16]));

g.fill([44, 10, 6], [54, 15, 16], "smooth_quartz");   // the crown walls already built; the band swaps their perimeter
run("crownBand", [44, 10, 6, 54, 15, 16], () => h3.crownBand(g, [44, 10, 6, 54, 15, 16], { over: true }), 80);

run("column", [58, 2, 6, 59, 12, 7], () => h3.column(g, 58, 6), 44);
report(h3.column(g, 58, 6) === 0, "column writes only into air (second call places nothing)");

run("doubleDoor", [6, 2, 40, 6, 3, 41], () => h3.doubleDoor(g, [6, 2, 40], "east"), 4);
report(g.blockAt(6, 2, 40) === "minecraft:iron_door" && g.blockAt(6, 3, 41) === "minecraft:iron_door", "doubleDoor: both leaves, both halves");

run("emblemDisc", [20, 16, 36, 21, 24, 44], () => h3.emblemDisc(g, [20, 20, 40], "west"));
report(g.blockAt(21, 20, 40) === "minecraft:shroomlight" && g.blockAt(20, 20, 40) === "minecraft:yellow_concrete", "emblemDisc: core and backing");

run("tree", [38, 3, 38, 42, 8, 42], () => h3.tree(g, 40, 2, 40));
report(g.get(41, 6, 40)?.state?.persistent === "true", "tree: leaves persistent");

run("litEntry", [49, 2, 39, 51, 6, 46], () => h3.litEntry(g, [50, 2, 40, 50, 5, 45], "east", { canopy: true }));
report(g.blockAt(50, 2, 40) === "minecraft:light_blue_stained_glass" && g.blockAt(49, 2, 40) === "minecraft:sea_lantern", "litEntry: glass and backing");

console.log(failures ? `${failures} helper check(s) failed` : "all h3 helper checks passed");
process.exitCode = failures ? 1 : 0;
