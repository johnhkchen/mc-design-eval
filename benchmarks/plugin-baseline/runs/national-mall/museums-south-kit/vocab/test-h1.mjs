// Smoke test for vocab/h1.mjs: each helper once on a fresh grid. Every placed block must sit inside the footprint
// the helper was given, the returned count must match the blocks written, and nothing may be refused.
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const fails = [];
const check = (name, ok, why = "") => {
  if (ok) console.log(`ok    ${name}`);
  else { fails.push(name); console.log(`FAIL  ${name}${why ? ` (${why})` : ""}`); }
};
const fresh = () => new Grid([24, 16, 24], { dataVersion: 3955 });

// box = [[x0, y0, z0], [x1, y1, z1]] (inclusive), the footprint the helper was given.
function verify(name, g, box, placed) {  // placed: blocks the helper wrote (plus any test setup in the box)
  const [a, b] = box;
  const out = g.solids().filter(({ pos: [x, y, z] }) => x < a[0] || x > b[0] || y < a[1] || y > b[1] || z < a[2] || z > b[2]);
  check(`${name}: inside footprint`, out.length === 0, `${out.length} outside`);
  check(`${name}: count matches`, g.solids().length === placed && placed > 0, `placed ${placed}, solids ${g.solids().length}`);
  check(`${name}: nothing refused`, !(g.refused?.length), `${g.refused?.length} refused`);
}

{ const g = fresh(); const n = h1.marble_cube(g, 2, 8, 2, 8); verify("marble_cube", g, [[2, 1, 2], [8, 11, 8]], n); }

{
  const g = fresh(); const n = h1.door_pair(g, 10, 2, 4, "north", "iron");
  verify("door_pair", g, [[10, 2, 4], [11, 3, 4]], n);
  check("door_pair: upper halves, mirrored hinges", g.get(10, 3, 4)?.state?.half === "upper" && g.get(10, 2, 4)?.state?.hinge === "left" && g.get(11, 2, 4)?.state?.hinge === "right");
  const r = fresh(); r.set(10, 2, 4, "stone"); check("door_pair: refuses a solid cell, writes nothing", h1.door_pair(r, 10, 2, 4, "north", "iron") === 0 && r.solids().length === 1);
}

{ const g = fresh(); const n = h1.rocket(g, 14, 4); verify("rocket", g, [[13, 2, 3], [16, 8, 6]], n); }

{ const g = fresh(); const n = h1.planter(g, [3, 14, 7, 16], 1); verify("planter", g, [[2, 1, 13], [8, 2, 17]], n); }

{ const g = fresh(); const n = h1.tier_ring(g, [6, 6, 5, 4], [6, 6, 4, 3], 9, "smooth_sandstone"); verify("tier_ring", g, [[1, 9, 2], [11, 9, 10]], n); }

{
  // the block above is the test's own support, so the footprint covers it and the count leaves it out
  const g = fresh(); g.set(5, 4, 5, "smooth_sandstone"); const n = h1.hang_lantern(g, 5, 3, 5);
  verify("hang_lantern", g, [[5, 3, 5], [5, 4, 5]], n + 1);
  const u = fresh(); check("hang_lantern: no block above, places nothing", h1.hang_lantern(u, 9, 3, 9) === 0 && u.solids().length === 0);
}

{
  const g = fresh(); const cells = [[3, 1, 3, "grass_block"], [3, 1, 4, "tall_grass"], [5, 1, 5, "azure_bluet"], [6, 1, 6, "large_fern"]];
  const n = h1.meadow(g, cells); verify("meadow", g, [[3, 1, 3], [6, 2, 6]], n);
}

{ const g = fresh(); const n = h1.plaza(g, 12, 12, 5, 5, 1); verify("plaza", g, [[7, 1, 7], [17, 1, 17]], n); }

console.log(fails.length ? `\n${fails.length} failing` : "\nall passed");
process.exit(fails.length ? 1 : 0);
