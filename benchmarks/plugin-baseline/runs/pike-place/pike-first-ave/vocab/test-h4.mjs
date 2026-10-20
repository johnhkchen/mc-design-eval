// Calls each helper in vocab/h4.mjs once on a small grid. Passes when every placed cell is inside the footprint the
// helper was given, something was placed, and a block seeded on a planned cell is never overwritten (air only).
// Run: node vocab/test-h4.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bayRhythm, doorLantern, deckAndParapet, orielBay, ribbonStorey, bannerSign, bulkhead, pavilion } from "./h4.mjs";

const STONE = "minecraft:stone";
const north = (z, x0, x1) => ({ cells: Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, z]), face: "north" });
const south = (z, x0, x1) => ({ cells: Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, z]), face: "south" });
const square = Array(4).fill("####");

const cases = [
  ["bayRhythm", (g) => bayRhythm(g, north(10, 2, 9), { floorY: 4 }), [2, 4, 9, 9, 8, 10], [3, 4, 9]],
  ["doorLantern", (g) => doorLantern(g, { x: 20, z: 10, y: 4, face: "north" }), [19, 5, 9, 22, 7, 9], [19, 6, 9]],
  ["deckAndParapet", (g) => deckAndParapet(g, { footprint: square }, { deckY: 10, parapetH: 1, rail: true }), [0, 10, 0, 7, 13, 7], [3, 10, 3]],
  ["orielBay", (g) => orielBay(g, north(10, 2, 9), { from: 10, to: 12, corbelY: 9, capY: 13 }), [4, 9, 9, 7, 13, 10], [5, 11, 9]],
  ["ribbonStorey", (g) => ribbonStorey(g, north(20, 2, 9), { floorY: 9, project: true }), [2, 9, 19, 9, 13, 20], [2, 10, 20]],
  ["bannerSign", (g) => bannerSign(g, south(24, 4, 11), { text: "PIKE", y0: 10, y1: 13 }), [4, 9, 25, 11, 13, 26], [7, 11, 25]],
  ["bulkhead", (g) => bulkhead(g, [4, 6, 4, 8, 11, 8]), [4, 6, 4, 8, 12, 8], [4, 6, 4]],
  ["pavilion", (g) => pavilion(g, [12, 6, 4, 23, 10, 15]), [11, 6, 3, 24, 11, 16], [14, 6, 4]],
];

let failed = 0;
for (const [name, call, [x0, y0, z0, x1, y1, z1], [px, py, pz]] of cases) {
  const g = new Grid([40, 16, 40], { dataVersion: 3955 });
  g.set(px, py, pz, STONE);                     // a built cell on the helper's plan
  const res = call(g);
  const outside = [...g.cells.values()].filter(({ pos: [x, y, z], block }) =>
    block !== STONE && (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1));
  const kept = g.get(px, py, pz)?.block === STONE && res.skipped.some((s) => s.pos.join() === [px, py, pz].join());
  const ok = res.placed > 0 && outside.length === 0 && kept;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: placed ${res.placed}, outside ${outside.length}, seeded kept ${kept}`);
}

// States that workers rely on: connected panes, a lantern that stands, the lane in front of a door kept clear.
const a = new Grid([40, 16, 40], { dataVersion: 3955 });
bayRhythm(a, north(10, 2, 9), { floorY: 4 });
doorLantern(a, { x: 20, z: 10, y: 4, face: "north" });
const checks = [
  ["pane joins its neighbour", a.get(3, 6, 10)?.state?.east === "true"],
  ["standing lantern on its post", a.get(19, 7, 9)?.block === "minecraft:lantern" && a.get(19, 7, 9).state.hanging === "false"],
  ["door lane clear", !a.get(20, 5, 9) && !a.get(21, 6, 9)],
];
for (const [label, ok] of checks) { if (!ok) failed++; console.log(`${ok ? "PASS" : "FAIL"} ${label}`); }

console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
