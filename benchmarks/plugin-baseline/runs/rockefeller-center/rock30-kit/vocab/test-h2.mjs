// Calls every h2 helper once on a small grid; each cell it changes must lie inside the footprint it was given.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h2.mjs";

const g = new Grid([160, 40, 80]);
const cells = () => new Map([...g].map((c) => [c.pos.join(","), c.block + JSON.stringify(c.state ?? {})]));
const inside = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const north12 = { side: "north", line: 12 }, east144 = { side: "east", line: 144 };

g.set(3, 2, 3, "stone");                 // solid ground inside groundDown's footprint: must survive (air only)

const cases = [
  ["groundDown", [2, 1, 2, 5, 4, 5], () => H.groundDown(g, 2, 2, 5, 5, 4)],
  ["windowCell", [10, 5, 13, 10, 7, 14], () => H.windowCell(g, north12, 10, 5, true, { glass: 2 })],
  ["ledge", [20, 6, 20, 29, 7, 27], () => H.ledge(g, [20, 0, 20, 29, 0, 27], 6, "north", 2, { upper: [22, 22, 27, 25] })],
  ["mast", [17, 16, 12, 26, 27, 19], () => H.mast(g, 20, 14, 20, { pent: [17, 12, 26, 19] })],
  ["portal", [143, 3, 26, 144, 9, 28], () => H.portal(g, east144, 27, 3, 3, 7)],
  ["wisdomPanel", [144, 17, 20, 145, 27, 35], () => H.wisdomPanel(g, east144, 20, 17)],
  ["flagRow", [68, 6, 11, 76, 6, 11], () => H.flagRow(g, north12, 72, 6)],
  ["gardenBed", [30, 12, 20, 45, 14, 27], () => H.gardenBed(g, [30, 20, 45, 27], 12)],
  ["paving", [50, 1, 2, 60, 1, 6], () => H.paving(g, [50, 2, 60, 6], 1)],
];

let failed = 0;
for (const [name, footprint, call] of cases) {
  const before = cells(), res = call(), after = cells();
  const changed = [...after].filter(([k, v]) => before.get(k) !== v).map(([k]) => k.split(",").map(Number));
  const stray = changed.filter((p) => !inside(p, footprint));
  const ok = changed.length > 0 && stray.length === 0 && res.placed > 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${res.placed}, changed ${changed.length}, refused ${res.refused.length}${stray.length ? `, stray ${stray.slice(0, 3).map((p) => p.join(",")).join(" ")}` : ""}`);
}

if (g.blockAt(3, 2, 3) !== "minecraft:stone") { failed++; console.log("FAIL air-only: groundDown wrote over solid ground"); } else console.log("ok   air-only: groundDown left solid ground alone");

process.exit(failed ? 1 : 0);
