// Smoke test for vocab/h1.mjs: every helper once on its own region of a 1.21.1 grid. Each block a helper adds must lie
// inside the footprint it was given: [x0, y0, z0, x1, y1, z1]. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { notchRing, stepCourse, litBand, ruyi, hallGlazing, shopBay, mallSign, planter, aircraftLight } from "./h1.mjs";

const g = new Grid([100, 60, 100], { dataVersion: 3955 });
let failures = 0;
const report = (ok, line) => { console.log(`${ok ? "ok   " : "FAIL "}${line}`); if (!ok) failures++; };
const key = (c) => c.pos.join(",");
const inside = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

function check(name, footprint, run) {
  const before = new Set([...g.cells.values()].map(key));
  const r = run();
  const added = [...g.cells.values()].filter((c) => !before.has(key(c)));
  const stray = added.filter((c) => !inside(c.pos, footprint));
  report(added.length > 0 && stray.length === 0, `${name}: ${added.length} blocks${stray.length ? `, ${stray.length} outside the footprint` : ""}`);
  return r;
}

// notchRing: noses at (4,0), (2,2), (0,4) from a corner; the notched cells (3,0), (1,1) are out; the middle is out
const ring = notchRing(0, 0, 9, 9);
const has = (x, z) => ring.some(([a, b]) => a === x && b === z);
report(has(4, 0) && has(0, 4) && has(2, 2) && !has(3, 0) && !has(1, 1) && !has(5, 5), "notchRing: noses present, notched cells out");

check("stepCourse flare", [0, 6, 0, 30, 6, 30], () => stepCourse(g, { box: [0, 0, 30, 30], insetNew: 6, y: 6 }));
check("stepCourse taper (sill)", [0, 26, 36, 30, 26, 66], () => stepCourse(g, { box: [0, 36, 30, 66], insetNew: 1, y: 26, taper: true }));
check("litBand", [40, 44, 0, 70, 44, 30], () => litBand(g, { y: 44, ring: [40, 0, 70, 30] }));
check("ruyi (south)", [56, 0, 80, 63, 8, 81], () => ruyi(g, "south", 60, 80));
const again = ruyi(g, "south", 60, 80);
report(again.placed === 0 && again.refused.length > 0, "ruyi: refuses to write over its own cells");
check("hallGlazing (north)", [50, 3, 40, 60, 10, 41], () => hallGlazing(g, "north", [50, 60], 3, 10, { box: [40, 40, 80, 80] }));
check("shopBay (north)", [62, 3, 40, 70, 12, 41], () => shopBay(g, { face: "north", range: [62, 70], plane: 40 }));
check("mallSign (north)", [4, 26, 10, 70, 34, 10], () => mallSign(g, { face: "north", range: [4, 70], y0: 26, y1: 34, plane: 10 }));
check("planter", [80, 0, 0, 84, 1, 4], () => planter(g, [80, 0, 84, 4], 0));
check("aircraftLight 2x2", [89, 30, 49, 92, 30, 52], () => aircraftLight(g, [90, 30, 50], "2x2"));
check("aircraftLight 1x1", [89, 40, 55, 91, 40, 57], () => aircraftLight(g, [90, 40, 56], "1x1"));

console.log(failures ? `${failures} check(s) failed` : "all checks passed");
process.exit(failures ? 1 : 0);
