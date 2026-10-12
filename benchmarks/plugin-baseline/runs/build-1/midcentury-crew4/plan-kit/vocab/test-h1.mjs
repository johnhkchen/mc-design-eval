// Calls every h1 helper once on a small grid and checks that each one changed only cells inside the footprint it was
// given, and placed something. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const g = new Grid([34, 9, 34]);
let failed = 0;

// run fn on g; every cell it changed must lie in box [x0,y0,z0,x1,y1,z1]
function check(name, box, fn) {
  const before = new Map(g.cells);
  const out = fn();
  const changed = [...g.cells].filter(([k, c]) => before.get(k) !== c).map(([, c]) => c);
  const outside = changed.filter(({ pos: [x, y, z] }) =>
    x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5]);
  const ok = out.placed > 0 && outside.length === 0 && (out.reason === undefined);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${out.placed}, skipped ${out.skipped.length}` +
    (outside.length ? `, outside footprint: ${outside.map((c) => c.pos).join(" ")}` : "") + (out.reason ? `, ${out.reason}` : ""));
  return out;
}

check("stucco_wall", [10, 2, 9, 13, 4, 9], () => h1.stucco_wall(g, 10, 9, 13, 9));
check("slider_gap", [14, 2, 25, 15, 4, 25], () => h1.slider_gap(g, 14, 25));
check("roof_band", [9, 6, 6, 32, 6, 10], () => h1.roof_band(g, 6, 10, 6, "bottom", { fascia: true }));
check("breeze_screen", [1, 1, 21, 9, 4, 21], () => h1.breeze_screen(g, 1, 9, 21));
check("palm", [10, 1, 1, 14, 7, 5], () => h1.palm(g, 12, 3));

// the pool's deck (paving) at y=0 on the rows beside it, so the coping has something to replace
for (let x = 11; x <= 24; x++) { g.set(x, 0, 28, "smooth_stone"); g.set(x, 0, 33, "smooth_stone"); }
const pool = check("kidney_pool", [11, 0, 28, 24, 0, 33], () => h1.kidney_pool(g, 13, 29));
if (pool.coping === 0) { failed++; console.log("FAIL kidney_pool: no coping on the deck"); }

g.set(19, 5, 9, "dark_oak_planks"); // the beam or ceiling the lantern hangs from
check("hung_lantern", [19, 4, 9, 19, 4, 9], () => h1.hung_lantern(g, 19, 9));
check("egg_chair", [14, 2, 20, 15, 3, 22], () => h1.egg_chair(g, 15, 21, "east"));
check("fireplace_stack", [20, 1, 21, 21, 8, 22], () => h1.fireplace_stack(g, 20, 21));
check("wardrobe", [26, 2, 18, 30, 3, 19], () => h1.wardrobe(g, 26, 18, 5, "x"));

// the helpers never overwrite: a second stucco_wall over the same box places nothing
const again = h1.stucco_wall(g, 10, 9, 13, 9);
if (again.placed !== 0) { failed++; console.log("FAIL stucco_wall: wrote over existing blocks"); }

console.log(failed ? `${failed} check(s) failed` : "all h1 checks passed");
process.exit(failed ? 1 : 0);
