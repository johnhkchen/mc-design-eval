// Calls each h1 helper once on one small grid and checks that every cell it placed lies inside the footprint it
// was given (the footprint is recomputed here from the arguments, not taken from the helper). Exit 1 on failure.
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h1.mjs";

const g = new Grid([250, 30, 160], { dataVersion: 3955 });            // 1.21.1
let fail = 0;
const check = (name, { cells, refused }, inside) => {
  const bad = cells.filter((c) => !inside(c));
  const ok = cells.length > 0 && bad.length === 0;
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${cells.length} placed, ${refused.length} refused${bad.length ? `, outside ${JSON.stringify(bad.slice(0, 3))}` : ""}`);
};

// air only: a stone block in the deck's way is refused and kept
g.set(10, 3, 10, "stone");
const deck = h.deckFill(g, [10, 10, 12, 11], 3);
const kept = g.blockAt(10, 3, 10) === "minecraft:stone" && deck.refused.some((r) => r[4] === "not air");
if (!kept) fail++;
console.log(`${kept ? "ok  " : "FAIL"} deckFill air-only: stone kept, refused ${JSON.stringify(deck.refused[0] ?? null)}`);
check("deckFill", deck, ([x, y, z]) => x >= 10 && x <= 12 && z >= 10 && z <= 11 && y >= 0 && y <= 3);

check("shedBay west 104", h.shedBay(g, "west", 104), ([x, y, z]) => {
  const s = x + z, d = x - z;
  return s >= 104 && s <= 111 && d >= -40 && d <= -36 && y >= 4 && y <= 16;
});
check("shedBay east 200", h.shedBay(g, "east", 200), ([x, y, z]) => {
  const s = x + z, d = x - z;
  return s >= 200 && s <= 207 && d >= -18 && d <= -14 && y >= 4 && y <= 16;
});
check("skylight +1 at 112", h.skylight(g, 112, 1), ([x, y, z]) => {
  const s = x + z, e = Math.abs(x - z + 27);
  return s >= 112 && s <= 114 && e >= 6 && e <= 8 && y >= 20 && y <= 22;
});
check("curtainWall x=117", h.curtainWall(g, 117, 131, 151, 5, 11), ([x, y, z]) => x === 117 && z >= 131 && z <= 151 && y >= 5 && y <= 11);
check("canopy east 117", h.canopy(g, "east", { plane: 117, from: 137, to: 140 }, 12),
  ([x, y, z]) => x >= 118 && x <= 119 && z >= 137 && z <= 140 && y >= 11 && y <= 12);
check("planterTree 4,8", h.planterTree(g, 4, 8), ([x, y, z]) => x >= 3 && x <= 7 && z >= 7 && z <= 11 && y >= 4 && y <= 9);
check("glassDome", h.glassDome(g, [146, 10, 80], 8), ([x, y, z]) => y >= 10 && Math.hypot(x - 146, y - 10, z - 80) <= 8.3);
check("cornerBay 239", h.cornerBay(g, 239, 13, 17, { top: 26, wrap: "north" }), ([x, y, z]) => {
  const plane = x === 239 && z >= 13 && z <= 17;
  const wrap = z === 12 && x >= 237 && x <= 239;
  return (plane || wrap) && y >= 6 && y <= 25;
});
check("awning east 239", h.awning(g, "east", { plane: 239, from: 14, to: 17 }),
  ([x, y, z]) => x === 240 && z >= 14 && z <= 17 && y >= 4 && y <= 5);

console.log(fail ? `${fail} check(s) FAILED` : "all h1 helpers passed");
process.exitCode = fail ? 1 : 0;
