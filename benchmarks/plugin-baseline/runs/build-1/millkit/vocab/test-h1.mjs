// Calls every h1 helper once on a fresh grid; each must change blocks only inside the footprint it was given (plan
// coordinates) and must skip nothing. The grid takes plan coordinates from y -3, as build.mjs's SiteGrid does.
// Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

class SiteGrid extends Grid {
  inBounds(x, y, z) { return x >= 0 && x < 40 && y >= -3 && y <= 12 && z >= 0 && z < 24; }
}
// A 40 x 24 site: stone below plan y 0, grass on plan y 0 (ground the helpers may replace where the plan says so).
const fresh = () => {
  const g = new SiteGrid([40, 16, 24]);
  g.fill([0, -3, 0], [39, -1, 23], "stone");
  g.fill([0, 0, 0], [39, 0, 23], "grass_block");
  return { g, p: g };
};
const key = (pos) => pos.join(",");
const snap = (g) => new Map([...g].map((c) => [key(c.pos), JSON.stringify([c.block, c.state ?? null])]));
const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x0 <= x && x <= x1 && y0 <= y && y <= y1 && z0 <= z && z <= z1;

const cases = [
  ["lane_strip", [0, 0, 0, 9, 0, 4], (p) => h1.lane_strip(p, 0, 9)],
  ["gate_pair", [12, 1, 5, 13, 1, 5], (p) => h1.gate_pair(p, 12, 5, "birch")],
  ["house_walls", [3, 3, 9, 8, 8, 17], (p) => h1.house_walls(p, [3, 9, 8, 17], "birch_planks", "stripped_birch_log", [[5, 3, 9, 6, 4, 9]], { gable: "z" })],
  ["door", [5, 2, 8, 5, 4, 9], (p) => h1.door(p, 5, 9, "birch", "north", "left", { step: "oak_stairs" })],
  ["stove", [7, 3, 12, 7, 3, 12], (p) => h1.stove(p, 7, 3, 12, "west")],
  ["scarecrow", [29, 1, 17, 31, 3, 17], (p) => h1.scarecrow(p, 30, 17)],
  ["well", [10, -3, 9, 13, 6, 12], (p) => h1.well(p, 10, 9)],
  ["wash_line", [20, 1, 17, 26, 4, 17], (p) => h1.wash_line(p, 20, 26, 17, [22, 24])],
  ["crate_stack", [33, 1, 17, 33, 2, 17], (p) => h1.crate_stack(p, 33, 17, 2)],
];

let failed = 0;
for (const [name, box, call] of cases) {
  const { g, p } = fresh();
  const before = snap(g);
  const res = call(p);
  const after = snap(g);
  const changed = [...after].filter(([k, v]) => before.get(k) !== v).map(([k]) => k.split(",").map(Number));
  const outside = changed.filter((c) => !inside(box, c));
  const ok = changed.length > 0 && outside.length === 0 && res.skipped.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${res.placed} placed, ${res.skipped.length} skipped, ${outside.length} outside footprint`);
}

// Spot checks: the door's two halves, the lane's ruts, the well's water shaft.
const d = fresh();
h1.door(d.p, 5, 9, "birch", "north", "left");
assert.equal(d.g.blockAt(5, 3, 9), "minecraft:birch_door");
assert.equal(d.g.get(5, 4, 9).state.half, "upper");
const l = fresh();
h1.lane_strip(l.p, 0, 9);
assert.equal(l.g.blockAt(0, 0, 1), "minecraft:dirt_path");
const w = fresh();
h1.well(w.p, 10, 9);
assert.equal([...w.g].filter((c) => c.block === "minecraft:water").length, 16);

if (failed) { console.log(`${failed} helper(s) failed`); process.exitCode = 1; }
else console.log("all h1 helpers placed inside their footprints");
