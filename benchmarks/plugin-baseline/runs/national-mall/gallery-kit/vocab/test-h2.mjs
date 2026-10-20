// Calls each h2 helper once on a fresh grid and checks that every block it changed lies inside the footprint it was
// given, that it placed something, and that it left solid cells alone. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { pilaster, nichePanel, pediment, domeRing, skylightStrip, uplight, lampPost, towerPrism, darkBand } from "./h2.mjs";

const cases = [
  { name: "pilaster", footprint: [10, 4, 8, 10, 10, 8],
    setup: (g) => { g.fill([0, 4, 9], [39, 10, 9], "white_terracotta"); g.set(10, 6, 8, "stone"); },
    run: (g) => pilaster(g, 10, 9, "north"),
    extra: (g) => g.blockAt(10, 6, 8) === "minecraft:stone" },
  { name: "nichePanel", footprint: [15, 4, 1, 21, 10, 2],
    setup: (g) => { g.fill([0, 4, 1], [39, 10, 1], "white_terracotta"); g.fill([15, 4, 1], [21, 10, 1], "minecraft:air"); },
    run: (g) => nichePanel(g, 16, 20, "north", 1),
    extra: (g) => g.isAir(18, 7, 1) && g.blockAt(18, 7, 2) === "minecraft:calcite" },
  { name: "pediment", footprint: [42, 13, 3, 58, 16, 3],
    run: (g) => pediment(g, "north", 42, 58, 3) },
  { name: "domeRing", footprint: [43, 21, 12, 57, 21, 26],
    run: (g) => domeRing(g, 50, 19, 7, 21, "weathered_cut_copper", { edge: true }) },
  { name: "skylightStrip", footprint: [2, 13, 13, 39, 14, 15],
    run: (g) => skylightStrip(g, 2, 39, 13, 15) },
  { name: "uplight", footprint: [44, 3, 3, 44, 3, 3],
    setup: (g) => g.set(44, 3, 3, "smooth_quartz"),
    run: (g) => uplight(g, 44, 3, 3, { replace: true }) },
  { name: "lampPost", footprint: [10, 2, 10, 10, 5, 10],
    run: (g) => lampPost(g, 10, 1, 10) },
  { name: "towerPrism", footprint: [20, 0, 5, 23, 20, 8],
    run: (g) => towerPrism(g, [[5, 20, 23], [6, 20, 23], [7, 20, 23], [8, 20, 23]], { tips: [[23, 8]] }),
    extra: (g) => g.isAir(21, 10, 6) && g.isAir(22, 10, 7) && g.blockAt(23, 10, 8) === "minecraft:white_terracotta" },
  { name: "darkBand", footprint: [30, 9, 30, 36, 9, 30],
    run: (g) => darkBand(g, [[30, 30, 36, 30]], 9) },
];

const inBox = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
let failed = 0;
for (const c of cases) {
  const g = new Grid([64, 24, 40]);
  c.setup?.(g);
  const before = new Map([...g.cells.values()].map((cell) => [cell.pos.join(","), cell.block]));
  const placed = c.run(g);
  const changed = [...g.cells.values()].filter((cell) => before.get(cell.pos.join(",")) !== cell.block);
  const stray = changed.filter((cell) => !inBox(cell.pos, c.footprint));
  const ok = placed > 0 && placed === changed.length && stray.length === 0 && (c.extra?.(g) ?? true);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${c.name}: ${placed} blocks`);
  for (const cell of stray) console.log(`     outside footprint: ${cell.pos.join(",")} ${cell.block}`);
}
if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("all h2 helpers passed");
