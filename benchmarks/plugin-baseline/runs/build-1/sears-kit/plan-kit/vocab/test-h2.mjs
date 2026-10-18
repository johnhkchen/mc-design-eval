// Calls each h2 helper once on a small grid and checks that every block it changed sits inside the box it returned,
// that the changed count matches what it reported, and that a second call into the same spot writes nothing.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const g = new Grid([96, 16, 30], { dataVersion: 3955 });
let failures = 0;
const snap = () => new Map([...g].filter((c) => c.block !== "minecraft:air").map((c) => [c.pos.join(), c.block]));

function check(name, setup, fn) {
  setup?.();
  const before = snap();
  const r = fn();
  const after = snap();
  const changed = [...after].filter(([k, b]) => before.get(k) !== b).map(([k]) => k.split(",").map(Number));
  const [x0, y0, z0, x1, y1, z1] = r.box;
  const outside = changed.filter(([x, y, z]) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ok = outside.length === 0 && changed.length === r.placed && r.placed > 0 && !changed.some(([, y]) => y === 0);
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${r.placed}, changed ${changed.length}, refused ${r.refused}${outside.length ? `, outside ${outside.length}` : ""}`);
}

check("hedge", null, () => h2.hedge(g, { x0: 0 }));

check("windowTriple", () => {
  for (let x = 0; x <= 16; x++) for (let y = 1; y <= 4; y++) g.set(x, y, 13, "white_concrete");
  for (let x = 4; x <= 6; x++) for (let y = 2; y <= 3; y++) g.unset(x, y, 13);   // the wall builder leaves the opening air
}, () => h2.windowTriple(g, { x: 4, y: 2, z: 13, face: "north", trim: "smooth_quartz", frame: true }));

check("portico", null, () => h2.portico(g, { x0: 4, x1: 11, z0: 9, z1: 12 }));

check("taperedPier", null, () => h2.taperedPier(g, { x: 35, z: 9, beamTo: 38 }));

check("dormerShed", null, () => h2.dormerShed(g, {
  x0: 53, x1: 59, zFront: 13, y0: 6, y1: 9,
  openings: [{ x: 54, y: 6, w: 2, h: 2 }, { x: 57, y: 6, w: 2, h: 2 }],
}));

check("squarePorch", null, () => h2.squarePorch(g, { x0: 67, x1: 77, z0: 9, z1: 12 }));

check("foundationPlanting", () => {
  for (let x = 67; x <= 77; x++) g.set(x, 0, 8, "grass_block");
}, () => h2.foundationPlanting(g, { x0: 67, x1: 77, z: 8, skip: [[71, 73]] }));

check("parlourSet", null, () => h2.parlourSet(g, { x0: 84, z0: 15 }));

// A second call into the same spot is refused, not overwritten: the air-only rule.
const again = h2.parlourSet(g, { x0: 84, z0: 15 });
if (again.placed !== 0) { failures++; console.log(`FAIL parlourSet second call placed ${again.placed}`); }
else console.log(`ok   parlourSet second call: placed 0, refused ${again.refused}`);

console.log(failures ? `${failures} failing` : "all helpers pass");
process.exit(failures ? 1 : 0);
