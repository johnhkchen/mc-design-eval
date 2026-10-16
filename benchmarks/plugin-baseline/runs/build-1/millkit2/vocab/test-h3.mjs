// Calls every h3 helper once on a grid with a grass ground row, and checks that each places blocks and changes nothing
// outside the footprint it was given. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// [name, setup(g) before the snapshot, call(g), footprint [x0,y0,z0,x1,y1,z1]]
const cases = [
  ["fence_run", () => {}, (g) => h3.fence_run(g, 1, "pale_oak", 17), [12, 1, 5, 23, 1, 18]],
  ["log_crib_wall", () => {}, (g) => h3.log_crib_wall(g, [1, 1, 9, 4, 4, 15], "oak_log"), [1, 1, 9, 4, 4, 15]],
  ["door_pair", () => {}, (g) => h3.door_pair(g, 17, 3, 9, "north", "acacia"), [17, 3, 8, 18, 4, 9]],
  ["stair_run", () => {}, (g) => h3.stair_run(g, [19, 3, 11], "south", 7, "spruce"), [18, 2, 11, 19, 8, 15]],
  ["bed_set", () => {}, (g) => h3.bed_set(g, [3, 3, 14], "north", "red"), [3, 3, 13, 3, 3, 14]],
  ["hanging_sign", (g) => g.set(53, 6, 7, "spruce_stairs"), (g) => h3.hanging_sign(g, "BOARDING", 53, 5, 7), [53, 5, 7, 53, 5, 7]],
  ["kettle", () => {}, (g) => h3.kettle(g, 68, 9), [67, 0, 8, 69, 1, 10]],
  ["picnic_table", () => {}, (g) => h3.picnic_table(g, 77, 11), [76, 1, 11, 79, 1, 13]],
  ["rafter_tails", () => {}, (g) => h3.rafter_tails(g, 46, 8, 14, 6), [46, 6, 8, 46, 6, 14]],
];

const snap = (g) => new Map([...g.cells].map(([k, c]) => [k, c.block]));

let failed = 0;
for (const [name, setup, call, box] of cases) {
  const g = new Grid([96, 12, 20]);
  for (let x = 0; x < 96; x++) for (let z = 0; z < 20; z++) g.set(x, 0, z, "grass_block");
  setup(g);
  const before = snap(g);
  const r = call(g);
  const changed = [...g.cells].filter(([k, c]) => before.get(k) !== c.block).map(([, c]) => c.pos);
  const outside = changed.filter((p) => !inside(box, p));
  const ok = r.placed > 0 && outside.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${r.placed}, skipped ${r.skipped}${outside.length ? `, outside ${JSON.stringify(outside)}` : ""}`);
}

if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("all h3 helpers passed");
