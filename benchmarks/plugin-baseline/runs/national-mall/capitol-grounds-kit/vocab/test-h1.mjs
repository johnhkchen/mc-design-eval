// Calls every h1 helper once on a small grid and checks each wrote only inside the footprint it was given.
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h1.mjs";

const heightAt = (x) => (x >= 14 ? 6 : 5);
const inside = (box, [x, y, z]) => x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
let failed = 0;

function check(name, g, box, res, preset = new Set()) {
  const stray = [...g.cells.values()].filter((c) => !preset.has(c.pos.join(",")) && !inside(box, c.pos));
  const ok = stray.length === 0 && res.placed > 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${res.placed} placed, ${res.refused.length} refused, ${stray.length} outside`);
}

{
  const g = new Grid([40, 20, 40]);
  check("groundColumn", g, [2, 1, 2, 2, 5, 2], h.groundColumn(g, 2, 2, 5));
}
{
  const g = new Grid([40, 20, 40]);
  check("plazaPaving", g, [4, 3, 4, 12, 3, 14], h.plazaPaving(g, 4, 4, 12, 14, 3));
}
{
  const g = new Grid([40, 20, 40]);
  const cw = h.curvedWalk(g, [[2, 15], [10, 17], [20, 17]], heightAt, [2, 12, 30, 19]);
  console.log("curvedWalk refused", JSON.stringify(cw.refused));
  check("curvedWalk", g, [2, 0, 12, 30, 19, 19], cw);
}
{
  const g = new Grid([40, 20, 40]);
  check("marbleTier", g, [19, 0, 4, 26, 9, 12], h.marbleTier(g, heightAt, 20, 4, 12, 26, 9, { gaps: [[7, 8]] }));
}
{
  const g = new Grid([40, 20, 40]);
  check("urnPier", g, [3, 9, 3, 3, 10, 3], h.urnPier(g, 3, 9, 3));
  g.set(4, 9, 4, "stone");
  const res = h.urnPier(g, 4, 9, 4);
  const kept = g.blockAt(4, 9, 4) === "minecraft:stone" && res.placed === 1 && res.refused.length === 1;
  if (!kept) failed++;
  console.log(`${kept ? "ok  " : "FAIL"} urnPier leaves existing stone alone (${res.refused.length} refused)`);
}
{
  const g = new Grid([40, 20, 40]);
  check("grottoNiche", g, [20, 7, 5, 21, 9, 10], h.grottoNiche(g, 20, 6, 9, 7, 8));
}
{
  const g = new Grid([40, 20, 40]);
  check("bronzeHorseman", g, [7, 12, 7, 9, 16, 9], h.bronzeHorseman(g, 8, 12, 8, "west"));
}
{
  const g = new Grid([40, 20, 40]);
  check("artilleryGroup", g, [30, 7, 30, 34, 8, 34], h.artilleryGroup(g, 30, 7, 30));
}
{
  const g = new Grid([40, 20, 40]);
  const leaves = [[9, 5, 10], [11, 5, 10], [10, 6, 10], [10, 5, 9], [10, 5, 11]];
  for (const [x, y, z] of leaves) g.set(x, y, z, "dark_oak_leaves");
  check("floodlight shroomlight", g, [10, 5, 10, 10, 5, 10], h.floodlight(g, 10, 5, 10), new Set(leaves.map((p) => p.join(","))));
}
{
  const g = new Grid([40, 20, 40]);
  g.set(25, 6, 25, "smooth_quartz");
  g.set(25, 7, 25, "smooth_quartz_slab");
  check("floodlight glowstone (buried)", g, [25, 6, 25, 25, 6, 25], h.floodlight(g, 25, 6, 25, "glowstone", { buried: true }), new Set(["25,7,25"]));
}

console.log(failed ? `${failed} check(s) failed` : "all h1 checks passed");
process.exit(failed ? 1 : 0);
