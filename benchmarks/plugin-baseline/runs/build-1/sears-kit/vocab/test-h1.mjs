// Calls each h1 helper once on a fresh grid and checks that every block it changed sits inside the box it returned, that
// the changed count matches what it reported, and that nothing was refused on bare air.
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

let failures = 0;
const fresh = () => new Grid([128, 24, 25], { dataVersion: 3955 });
const snap = (g) => new Map([...g].filter((c) => c.block !== "minecraft:air").map((c) => [c.pos.join(), c.block]));

function check(name, setup, fn) {
  const g = fresh();
  setup?.(g);
  const before = snap(g);
  const r = fn(g);
  const after = snap(g);
  const changed = [...after].filter(([k, b]) => before.get(k) !== b).map(([k]) => k.split(",").map(Number));
  const [x0, y0, z0, x1, y1, z1] = r.box;
  const outside = changed.filter(([x, y, z]) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ok = outside.length === 0 && changed.length === r.placed && r.placed > 0 && r.refused === 0;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${r.placed}, refused ${r.refused}, outside box ${outside.length}`);
}

check("lawn", null, (g) => h1.lawn(g, 0));

check("windowPair", null, (g) => h1.windowPair(g, { x: 3, y: 2, z: 13, face: "north", trim: "smooth_quartz", frame: true }));

check("windowBox", null, (g) => h1.windowBox(g, { x: 3, y: 2, z: 13, w: 2, face: "north" }));

check("arcadeBay", null, (g) => h1.arcadeBay(g, { x0: 19, x1: 22, z: 9, y: 2 }));

check("dormerGable", null, (g) => h1.dormerGable(g, { x0: 38, x1: 42, zFront: 11, y0: 9, y1: 13, trim: "birch" }));

check("gablePorch", null, (g) => h1.gablePorch(g, { x0: 102, x1: 106, z0: 10, z1: 12 }));

check("porchLantern", (g) => g.set(103, 5, 10, "spruce_planks"), (g) => h1.porchLantern(g, { x: 103, y: 4, z: 10 }));

check("diningSet", null, (g) => h1.diningSet(g, { x: 90, y: 1, z: 15, wood: "oak" }));

console.log(failures ? `${failures} failing` : "all helpers pass");
process.exit(failures ? 1 : 0);
