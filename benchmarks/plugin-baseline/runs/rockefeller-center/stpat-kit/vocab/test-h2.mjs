// Calls every h2.mjs helper once on a fresh 1.21.1 grid and checks: every block lands inside the footprint it was given,
// the return count matches the blocks written, air-only holds, and a few block states are right. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h2.mjs";

const fails = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); };
const inside = ([a, b], x, y, z) =>
  x >= Math.min(a[0], b[0]) && x <= Math.max(a[0], b[0]) && y >= Math.min(a[1], b[1]) &&
  y <= Math.max(a[1], b[1]) && z >= Math.min(a[2], b[2]) && z <= Math.max(a[2], b[2]);
const fresh = () => new Grid([48, 100, 48], { dataVersion: 3955 });

/** Runs one helper on a fresh grid; checks its footprint and return count. */
function run(name, box, fn) {
  const g = fresh();
  const n = fn(g);
  let blocks = 0, outside = 0;
  for (const c of g) {
    blocks++;
    if (!inside(box, ...c.pos)) outside++;
  }
  ok(blocks > 0, `${name}: placed nothing`);
  ok(outside === 0, `${name}: ${outside} blocks outside its footprint`);
  ok(n === blocks, `${name}: returned ${n}, wrote ${blocks}`);
  return g;
}

const g0 = run("plinth", [[0, 0, 0], [5, 2, 5]], (g) => H.plinth(g, [[0, 0, 0], [5, 2, 5]]));
ok(g0.blockAt(3, 1, 3) === "minecraft:polished_andesite", "plinth: wrong block");

const gl = run("lancet", [[2, 5, 9], [4, 12, 11]], (g) => H.lancet(g, [[2, 5, 9], [4, 12, 11]], "west", 2, 10, 5, 12, 3));
ok(gl.blockAt(2, 12, 9) === "minecraft:polished_diorite_stairs" && gl.get(2, 12, 9).state.half === "top" && gl.get(2, 12, 9).state.facing === "south", "lancet: head stair wrong");

run("tower_buttress", [[7, 0, 0], [10, 50, 4]], (g) => H.tower_buttress(g, [[7, 0, 0], [10, 50, 4]], { x: 10, z: 3, sx: -1, sz: -1 }, 0, 40, { pinnacle: 4 }));

run("spire_ring", [[5, 40, 5], [15, 60, 15]], (g) => H.spire_ring(g, [[5, 40, 5], [15, 60, 15]], 10, 10, 9, 44));
run("spire_ring lace", [[5, 40, 5], [15, 60, 15]], (g) => H.spire_ring(g, [[5, 40, 5], [15, 60, 15]], 10, 10, 9, 44, { lace: true }));

const gc = run("spire_cross", [[5, 80, 5], [15, 95, 15]], (g) => H.spire_cross(g, [[5, 80, 5], [15, 95, 15]], 10, 88, 10));
ok(gc.blockAt(10, 93, 10) === "minecraft:end_rod", "spire_cross: end_rod missing at the tip");

const roofBox = [[10, 30, 13], [40, 45, 27]];
const gr = run("gable_roof_x", roofBox, (g) => H.gable_roof_x(g, roofBox, 34, 41));
ok(gr.get(20, 34, 13)?.state?.facing === "south", "gable_roof_x: north slope should face the ridge (south)");
ok(gr.get(20, 41, 20)?.block === "minecraft:waxed_oxidized_cut_copper_slab", "gable_roof_x: ridge cap missing");

run("flyer", [[10, 20, 2], [14, 35, 16]], (g) => H.flyer(g, [[10, 20, 2], [14, 35, 16]], 12, 4, 22, 13, 30, "north"));
run("slab_ramp", [[0, 2, 14], [3, 2, 26]], (g) => H.slab_ramp(g, [[0, 2, 14], [3, 2, 26]], { x: 0, z: 14, y: 2, dir: "east", width: 13 }));
run("quoin", [[3, 0, 3], [8, 6, 8]], (g) => H.quoin(g, [[3, 0, 3], [8, 6, 8]], { x: 4, z: 4, sx: 1, sz: 1, y0: 0, y1: 6 }));

// Air only: a block already standing in the footprint is kept.
{
  const g = fresh();
  g.set(1, 0, 1, "stone");
  H.plinth(g, [[0, 0, 0], [2, 0, 2]]);
  ok(g.blockAt(1, 0, 1) === "minecraft:stone", "plinth: overwrote an existing block");
}

if (fails.length) {
  console.log(fails.map((f) => `FAIL ${f}`).join("\n"));
  console.log(`${fails.length} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`h2: ${checks} checks passed`);
