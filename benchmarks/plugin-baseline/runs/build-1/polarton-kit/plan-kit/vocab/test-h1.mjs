// Calls each h1 helper once on a small grid. Every cell it adds must sit inside the footprint it was given,
// and the count of added cells must match what it reports as placed.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h1.mjs";

const g = new Grid([40, 24, 24]);
const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const keys = () => new Set([...g].map((c) => c.pos.join(",")));

// the wall past the bed head, for bedAt (solid, so the head has a wall to lie against)
g.set(20, 2, 10, "stone");

const calls = [
  ["laneRow", [0, 0, 0, 5, 0, 4], () => H.laneRow(g, 0, 5)],
  ["pierRow", [8, 1, 2, 14, 1, 2], () => H.pierRow(g, 8, 14, 2, 1)],
  ["shaftFrame", [16, 0, 2, 20, 3, 4], () => H.shaftFrame(g, 16, 0, 2, { port: true })],
  ["lancet", [24, 2, 5, 24, 7, 7], () => H.lancet(g, 24, 6, 2, 6)],
  ["bellCupola", [26, 11, 2, 29, 19, 5], () => H.bellCupola(g, 26, 11, 2)],
  ["balcony", [2, 1, 14, 5, 7, 15], () => H.balcony(g, 2, 6, 14)],
  ["wheelStand", [8, 4, 12, 10, 6, 14], () => H.wheelStand(g, 8, 4, 12)],
  ["sackStack", [14, 2, 12, 15, 3, 13], () => H.sackStack(g, 14, 2, 12)],
  ["bedAt", [20, 2, 11, 20, 2, 12], () => H.bedAt(g, [20, 2, 12], "north")],
];

let failed = 0;
for (const [name, box, run] of calls) {
  const before = keys();
  const r = run();
  const added = [...g].map((c) => c.pos).filter((p) => !before.has(p.join(",")));
  const outside = added.filter((p) => !inside(box, p));
  const ok = added.length > 0 && outside.length === 0 && added.length === r.placed;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${added.length} cells, placed ${r.placed}, refused ${r.refused.length}` +
    (outside.length ? `, outside footprint: ${outside.map((p) => p.join(",")).join(" ")}` : ""));
}

if (failed) { console.error(`${failed} helper(s) failed`); process.exit(1); }
console.log("all h1 helpers placed inside their footprints");
