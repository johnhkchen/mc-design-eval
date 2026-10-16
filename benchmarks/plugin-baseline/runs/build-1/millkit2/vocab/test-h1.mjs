// vocab/test-h1.mjs: calls each helper in h1.mjs once on its own small grid. Each call must place blocks, keep every
// block it writes inside the footprint it was given, and refuse (not overwrite) an occupied cell. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const fresh = () => new Grid([40, 20, 24], { dataVersion: 5023 });     // 26.3, the version `mcd states` reads
let failures = 0;
const check = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
};

function run(name, box, call) {
  const g = fresh();
  const r = call(g);
  const [x0, y0, z0, x1, y1, z1] = box;
  const cells = [...g.cells.values()];
  const solid = cells.filter((c) => c.block !== "minecraft:air");
  const outside = solid.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  check(solid.length > 0 && outside.length === 0 && r.skipped.length === 0,
    `${name}: ${solid.length} blocks in footprint [${box}]${outside.length ? `, ${outside.length} OUTSIDE` : ""}${r.skipped.length ? `, ${r.skipped.length} refused` : ""}`);
}

run("lane_strip", [0, 0, 0, 11, 0, 4], (g) => h1.lane_strip(g, 0, 11));
run("pier_line", [1, 1, 9, 10, 1, 16], (g) => h1.pier_line(g, 1, 9, 10, 16, "bricks", { skirt: "spruce_fence" }));
run("window", [16, 4, 8, 17, 5, 9], (g) => h1.window(g, 16, 4, 9, "north", 2, 2, { sill: "smooth_quartz" }));
run("porch_run", [1, 2, 7, 10, 7, 8], (g) => h1.porch_run(g, 1, 10, 7, [1, 5, 6, 10], "oak_fence", "spruce_planks", 1,
  { roof: "exposed_cut_copper", gap: [5, 6] }));
run("chimney_stack", [1, 1, 15, 3, 15, 17], (g) => h1.chimney_stack(g, [2, 1, 16], 13, 1, "bricks", "deepslate_bricks"));
run("table_set", [2, 1, 11, 3, 2, 11], (g) => h1.table_set(g, 2, 1, 11, 2));
run("ham_rack", [10, 3, 5, 12, 4, 7], (g) => h1.ham_rack(g, [10, 12], [5, 6, 7], 4));
run("pecan_tree", [18, 1, 6, 23, 10, 10], (g) => h1.pecan_tree(g, [20, 1, 8], 6, [18, 5, 6, 23, 10, 10]));
run("beehive_row", [4, 1, 17, 7, 1, 17], (g) => h1.beehive_row(g, 4, 7, 17));

{
  const g = fresh();
  g.set(2, 1, 11, "stone");
  const r = h1.table_set(g, 2, 1, 11, 2);
  check(g.blockAt(2, 1, 11) === "minecraft:stone" && r.skipped.some(([x, y, z]) => x === 2 && y === 1 && z === 11),
    "table_set: an occupied cell is refused and reported, not overwritten");
}

console.log(failures ? `${failures} FAILED` : "all helper checks passed");
process.exitCode = failures ? 1 : 0;
