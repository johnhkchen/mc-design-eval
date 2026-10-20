// Calls each helper in vocab/h3.mjs once on an empty grid and checks that every block lands inside the footprint it was
// given, that nothing is refused on empty air, and that a second call (into cells already built) changes nothing.
// Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { glass_bay, aircraft, lamp_post, tier, potomac_dome, pond, floodlight } from "./h3.mjs";

const fresh = () => new Grid([40, 14, 40], { dataVersion: 3955 });    // 1.21.1
const snapshot = (g) => [...g.cells.values()].map((c) => `${c.pos}:${c.block}:${JSON.stringify(c.state ?? {})}`).sort().join("|");

// [name, call, footprint box [x0, y0, z0, x1, y1, z1]]
const cases = [
  ["glass_bay", (g) => glass_bay(g, 2, 11, 3, 13), [2, 1, 3, 11, 9, 13]],
  ["aircraft", (g) => aircraft(g, { x: 4, y: 5, z: 4, span: 6, len: 6, hang: 9 }), [2, 5, 4, 7, 8, 9]],
  ["lamp_post", (g) => lamp_post(g, 10, 1, 2), [10, 1, 2, 10, 3, 2]],
  ["tier", (g) => tier(g, 22, 10, 8, 6, 1, 4), [14, 1, 4, 30, 4, 16]],
  ["potomac_dome", (g) => potomac_dome(g, [30, 3, 10], 5), [24, 3, 4, 36, 6, 16]],
  ["pond", (g) => pond(g, { cx: 10, cz: 30, rx: 4, rz: 2, y: 3, lanterns: [[9, 30]], lilies: [[10, 30]], reeds: [[15, 3, 30]] }), [6, 2, 28, 15, 4, 32]],
  ["floodlight", (g) => floodlight(g, 5, 1, 5), [5, 1, 5, 5, 1, 5]],
];

let failures = 0;
for (const [name, call, [x0, y0, z0, x1, y1, z1]] of cases) {
  const g = fresh();
  const first = call(g);
  const outside = [...g.cells.values()].filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const before = snapshot(g);
  const second = call(g);
  const changed = snapshot(g) !== before;
  const ok = first.placed > 0 && first.refused.length === 0 && outside.length === 0 && !changed && second.refused.length > 0;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: placed ${first.placed}, outside box ${outside.length}, refused on empty air ${first.refused.length}, re-run placed nothing new ${!changed}, re-run refused ${second.refused.length}`);
}

// the air rule on a ground cell: a floodlight into a solid cell is refused, and replace: true writes it
const g = fresh();
g.set(5, 1, 5, "stone");
const refused = floodlight(g, 5, 1, 5).refused.length;
const replaced = floodlight(g, 5, 1, 5, { replace: true }).placed;
if (refused !== 1 || replaced !== 1 || g.blockAt(5, 1, 5) !== "minecraft:ochre_froglight") { failures++; console.log("FAIL floodlight on ground: refused", refused, "replaced", replaced); }
else console.log("PASS floodlight on ground: refused without replace, written with replace");

if (failures) { console.log(`${failures} failing`); process.exit(1); }
console.log("all helper checks passed");
