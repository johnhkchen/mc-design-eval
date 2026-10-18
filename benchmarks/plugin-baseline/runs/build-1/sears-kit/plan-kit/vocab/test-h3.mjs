// Smoke test for vocab/h3.mjs: each helper once on a fresh grid, every cell it wrote inside the footprint it was given.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// [helper call, footprint given (inclusive box), cells the test sets up first]
const cases = {
  accessRamp: [(g) => h3.accessRamp(g, { x: 6, w: 4, z0: 5, deckZ0: 9, deckZ1: 12, deck: "smooth_quartz" }), [6, 0, 5, 9, 1, 12]],
  doorSet: [(g) => h3.doorSet(g, { x: 7, y: 2, z: 13, face: "north", wood: "dark_oak", double: true }), [7, 2, 13, 8, 3, 13]],
  balcony: [(g) => h3.balcony(g, { x0: 6, x1: 9, z0: 10, z1: 12, y: 5 }), [6, 5, 10, 9, 6, 12]],
  kneeBrace: [(g) => h3.kneeBrace(g, { x: 36, y: 5, z: 14, dir: "north" }), [36, 5, 14, 36, 5, 14]],
  dormerHip: [(g) => h3.dormerHip(g, { x0: 70, x1: 74, zFront: 14, y0: 11, y1: 14, trim: "smooth_quartz", body: "cyan_terracotta", roof: "deepslate_tiles", roofStairs: "deepslate_tile_stairs" }), [70, 11, 14, 74, 14, 16]],
  doorHood: [(g) => h3.doorHood(g, { x0: 87, x1: 89, z: 13, y: 5 }), [87, 5, 13, 89, 6, 13]],
  bedSet: [(g) => h3.bedSet(g, [88, 2, 16], "north", "red"), [88, 2, 15, 88, 2, 16], (g) => g.set(88, 2, 14, "stone")],
  dresser: [(g) => h3.dresser(g, { x: 56, y: 2, z: 15, facing: "north", length: 2 }), [56, 2, 15, 57, 2, 15]],
};

let failures = 0;
for (const [name, [run, box, setup]] of Object.entries(cases)) {
  const g = new Grid([96, 16, 24]);
  setup?.(g);
  const before = new Set([...g.cells.values()].map((c) => c.pos.join()));
  const result = run(g);
  const written = [...g.cells.values()].filter((c) => c.block !== "minecraft:air" && !before.has(c.pos.join()));
  const outside = written.filter((c) => !inside(box, c.pos));
  const ok = result.refused === 0 && result.placed > 0 && outside.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${written.length} cells, refused ${result.refused}, outside ${outside.length}`);
}

// negative: a blocked footprint writes nothing (all or nothing)
const g = new Grid([96, 16, 24]);
g.set(6, 0, 5, "stone");
const blocked = h3.accessRamp(g, { x: 6, w: 4, z0: 5, deckZ0: 9, deckZ1: 12, deck: "smooth_quartz" });
const wroteAny = [...g.cells.values()].some((c) => c.block === "minecraft:smooth_quartz" || c.block === "minecraft:smooth_stone_slab");
const negOk = blocked.placed === 0 && blocked.refused > 0 && !wroteAny;
if (!negOk) failures++;
console.log(`${negOk ? "ok  " : "FAIL"} accessRamp refuses a blocked footprint whole (refused ${blocked.refused}, wrote anything: ${wroteAny})`);

if (failures) {
  console.log(`${failures} failing`);
  process.exitCode = 1;
} else {
  console.log("all h3 helpers pass");
}
