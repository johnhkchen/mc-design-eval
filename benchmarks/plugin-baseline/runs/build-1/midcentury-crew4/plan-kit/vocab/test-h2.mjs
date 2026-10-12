// Checks the h2 helpers: each call places the expected blocks, every block it wrote lies inside the footprint it was
// given, and it never writes over a block that is already there. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
};
const fresh = () => new Grid([34, 9, 34]);

// every cell the call wrote must sit in the box [x0,y0,z0,x1,y1,z1]; cells already there before the call are not counted
function strays(g, box, before) {
  const [x0, y0, z0, x1, y1, z1] = box;
  return [...g.cells.values()].filter(({ pos: [x, y, z] }) => !before.has(`${x},${y},${z}`) &&
    (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1)).length;
}
const keys = (g) => new Set(g.cells.keys());

function run(name, box, expected, setup, call) {
  const g = fresh();
  setup?.(g);
  const before = keys(g);
  const out = call(g);
  check(name, out.placed === expected && strays(g, box, before) === 0,
    `placed ${out.placed}, want ${expected}, stray ${strays(g, box, before)}`);
}

run("header_course skips beam lines", [10, 5, 8, 31, 5, 8], 14, null,
  (g) => h2.header_course(g, 10, 8, 31, 8));

run("clerestory: glass and mullions", [22, 4, 8, 30, 4, 8], 9, null,
  (g) => h2.clerestory(g, 22, 8, 4));

run("fascia_ring swaps the roof rim and hole rim", [9, 6, 6, 32, 6, 27], 114,
  (g) => g.fill([9, 6, 6], [32, 6, 27], "smooth_stone_slab", { type: "bottom" }),
  (g) => h2.fascia_ring(g, [9, 6, 32, 27], { hole: [17, 12, 21, 17] }));

run("joint_row cuts into the driveway", [1, 0, 4, 8, 0, 4], 8,
  (g) => g.fill([1, 0, 4], [8, 0, 4], "smooth_stone"),
  (g) => h2.joint_row(g, 4, 1, 8));

run("saguaro with arm", [25, 1, 3, 26, 3, 3], 5, null,
  (g) => h2.saguaro(g, 26, 3, 3));

run("lounger on the patio", [12, 1, 27, 13, 1, 27], 2, null,
  (g) => h2.lounger(g, 12, 27, "x", 1));

run("terrazzo floor", [11, 1, 9, 15, 1, 13], 25, null,
  (g) => h2.terrazzo_floor(g, 11, 9, 15, 13));

run("sideboard along the west wall", [11, 2, 14, 11, 4, 16], 7, null,
  (g) => h2.sideboard(g, 11, 14, 3, "z", "east"));

run("dining set with a lantern under a beam", [12, 2, 15, 15, 4, 17], 17,
  (g) => g.set(13, 5, 16, "dark_oak_log", { axis: "z" }),
  (g) => h2.dining_set(g, 13, 15));

run("bath fit in a 2x3 bath", [26, 2, 14, 27, 3, 16], 5, null,
  (g) => h2.bath_fit(g, 26, 14));

// writes stay in air: a block already placed is left alone
{
  const g = fresh();
  g.set(26, 2, 14, "stone");
  const out = h2.bath_fit(g, 26, 14);
  check("bath_fit keeps an existing block", g.blockAt(26, 2, 14) === "minecraft:stone" && out.skipped.length === 1,
    `skipped ${out.skipped.length}`);
}

console.log(failed ? `${failed} h2 check(s) failed` : "all h2 checks passed");
process.exit(failed ? 1 : 0);
