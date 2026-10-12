// Calls every h3 helper once on a small grid and checks that each placed block lies inside the footprint it was given
// (inclusive box [x0, y0, z0, x1, y1, z1]). Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const cases = [
  ["post", (g) => h3.post(g, 5, 5), [5, 2, 5, 5, 4, 5]],
  ["orange_entry", (g) => h3.orange_entry(g, 19, 9), [18, 2, 9, 20, 4, 9]],
  ["beam_line", (g) => h3.beam_line(g, 13), [13, 5, 5, 13, 5, 28]],
  ["stepping_pad", (g) => h3.stepping_pad(g, 18, 1), [18, 0, 1, 20, 0, 1]],
  ["barrel_cactus", (g) => h3.barrel_cactus(g, 26, 3), [26, 1, 3, 26, 2, 3]],
  ["patio_table", (g) => h3.patio_table(g, 20, 27), [19, 1, 27, 21, 2, 27]],
  ["panel_wall", (g) => h3.panel_wall(g, 12, 9, 2, 4, "north"), [12, 2, 9, 12, 4, 9]],
  ["coffee_table", (g) => h3.coffee_table(g, 15, 21), [15, 2, 21, 15, 2, 21]],
  ["galley_kitchen", (g) => h3.galley_kitchen(g, 11, 9), [11, 2, 9, 15, 4, 13]],
];

let failed = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) failed++;
};

for (const [name, call, [x0, y0, z0, x1, y1, z1]] of cases) {
  const g = new Grid([34, 9, 34]);
  const r = call(g);
  const inside = [...g.cells.values()].every(({ pos: [x, y, z] }) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);
  check(r.placed > 0 && r.placed === g.cells.size && r.skipped.length === 0 && inside, `${name}: ${r.placed} placed inside its footprint`);
}

// air only: a block already in place is kept and its cell reported, and a door is not written half-way
const g = new Grid([34, 9, 34]);
g.set(19, 2, 9, "stone");
const r = h3.orange_entry(g, 19, 9);
check(g.blockAt(19, 2, 9) === "minecraft:stone" && g.blockAt(19, 3, 9) === "minecraft:air" && r.skipped.length === 2, "orange_entry: keeps an occupied door cell and writes no half door");

process.exitCode = failed ? 1 : 0;
console.log(failed ? `${failed} check(s) failed` : "all h3 checks passed");
