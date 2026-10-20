// Calls every h3 helper once on a small grid; each must place blocks only inside the footprint it was given,
// and must refuse (not overwrite) a solid block already in its footprint. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

// [name, call(g), footprint [x0, y0, z0, x1, y1, z1]]
const cases = [
  ["roadStrip", (g) => h3.roadStrip(g, 2, 6, 1, 8, 5), [2, 5, 1, 6, 5, 8]],
  ["lampPost", (g) => h3.lampPost(g, 3, 4, 0), [3, 1, 4, 3, 5, 4]],
  ["gardenSteps", (g) => h3.gardenSteps(g, 4, 9, 4, 12), [4, 0, 3, 9, 3, 13]],
  ["froglightBay", (g) => h3.froglightBay(g, 10, 8, "north"), [10, 1, 6, 10, 3, 7]],
  ["promenadeField", (g) => h3.promenadeField(g, 0, 11, 0, 11, 4), [0, 4, 0, 11, 4, 11]],
  ["inscriptionBand", (g) => h3.inscriptionBand(g, 7, 2, 9, 9), [7, 9, 2, 7, 9, 9]],
  ["goldMount", (g) => h3.goldMount(g, 12, 14, 4, 7, 1), [12, 1, 4, 14, 4, 7]],
  ["flagPole", (g) => h3.flagPole(g, 16, 10, "north", ["red", "white"]), [16, 5, 8, 16, 11, 10]],
  ["plantBed", (g) => h3.plantBed(g, 9, 16, 4, 5, 0, { open: ["south"] }), [9, 1, 4, 16, 3, 5]],
];

let failures = 0;
for (const [name, call, [x0, y0, z0, x1, y1, z1]] of cases) {
  const g = new Grid([20, 14, 20]);
  const res = call(g);
  const outside = [...g.solids()].filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ok = res.placed > 0 && outside.length === 0 && res.refused.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: placed ${res.placed}, outside footprint ${outside.length}, refused ${res.refused.length}`);
}

// Air only: a solid block already in the footprint is refused and left as it was.
{
  const g = new Grid([20, 14, 20]);
  g.set(3, 2, 4, "stone");
  const res = h3.lampPost(g, 3, 4, 0);
  const kept = g.blockAt(3, 2, 4) === "minecraft:stone" && res.refused.some(([x, y, z]) => x === 3 && y === 2 && z === 4);
  if (!kept) failures++;
  console.log(`${kept ? "PASS" : "FAIL"} lampPost leaves a solid cell alone (refused ${res.refused.length})`);
}

if (failures) { console.log(`${failures} failing`); process.exit(1); }
console.log("all h3 helpers pass");
