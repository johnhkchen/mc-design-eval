// Calls every h2 helper once on a small grid and checks each placed cell lies in the footprint given to it.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const cases = [
  ["shop_name", [25, "BOOKS", "blue"], [26, 6, 6, 32, 7, 6]],
  ["hanging_shop_sign", [33, "BOOKS"], [33, 5, 5, 33, 6, 5]],
  ["cornice_run", [18, 25, 37, { dentils: true }], [25, 17, 6, 37, 18, 6]],
  ["juliet_balcony", [25], [29, 9, 6, 33, 10, 6]],
  ["stair_flight", [35, 36, 12, 17, 2, "south"], [35, 2, 12, 36, 7, 17]],
  ["stair_flight", [34, 34, 19, 15, 9, "north", { rail: "west" }], [33, 9, 15, 34, 14, 19]],
  ["chimney_stack", [30], [29, 1, 24, 33, 28, 27]],
  ["lamp_post", [25], [25, 2, 5, 25, 5, 5]],
];

const g = new Grid([38, 30, 33]);
// the fascia board the banners hang on (z 7, y 5..7, x a+1..a+7), as the fascia part lays it
for (let x = 26; x <= 32; x++) for (let y = 5; y <= 7; y++) g.set(x, y, 7, "dark_oak_planks");
// an occupied cell inside a footprint must survive the write (air-only rule)
g.set(25, 3, 5, "stone");

let failures = 0;
for (const [name, args, [x0, y0, z0, x1, y1, z1]] of cases) {
  const before = new Set([...g].filter((c) => c.block !== "minecraft:air").map((c) => c.pos.join(",")));
  const r = h2[name](g, ...args);
  const cells = [...g].filter((c) => c.block !== "minecraft:air" && !before.has(c.pos.join(",")));
  const outside = cells.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ok = outside.length === 0 && cells.length > 0;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${cells.length} cells, ${r.skipped.length} skipped${outside.length ? `, outside: ${outside.map((c) => c.pos).join(" ")}` : ""}`);
}

const kept = g.get(25, 3, 5).block === "minecraft:stone";
if (!kept) failures++;
console.log(`${kept ? "ok  " : "FAIL"} occupied cell (25,3,5) kept as stone`);

if (failures) { console.log(`${failures} failing check(s)`); process.exit(1); }
console.log("all h2 helpers placed inside their footprints");
