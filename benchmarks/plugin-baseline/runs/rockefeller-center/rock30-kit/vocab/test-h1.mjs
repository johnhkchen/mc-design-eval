// Calls every h1 helper once on a small grid; each cell it changes must lie inside the footprint it was given.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h1.mjs";

const g = new Grid([48, 32, 24]);
const cells = () => new Map([...g].map((c) => [c.pos.join(","), c.block + JSON.stringify(c.state ?? {})]));
const inside = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const north = { side: "north", line: 4 }, south = { side: "south", line: 12 };

const cases = [
  ["box", [2, 1, 14, 12, 8, 22], () => H.box(g, [2, 1, 14, 12, 8, 22], "white_terracotta", { hollow: true })],
  ["flute", [0, 1, 4, 15, 10, 6], () => H.flute(g, north, [0, 15], 1, 10, 3, 1, { over: true })],
  ["shopBay", [4, 1, 10, 7, 8, 12], () => H.shopBay(g, south, 4, 1, 8, { door: true, over: true })],
  ["deckParapet", [30, 6, 2, 40, 8, 12], () => H.deckParapet(g, [30, 2, 40, 12], 6)],
  ["geSign", [4, 18, 10, 31, 30, 11], () => H.geSign(g, { side: "north", line: 10 }, 4, 31, 18, 30)],
  ["glassScreen", [43, 4, 4, 44, 7, 19], () => H.glassScreen(g, 44, 4, 19, 4, 7)],
  ["marquee", [30, 12, 0, 41, 15, 3], () => H.marquee(g, [30, 12, 0, 41, 15, 3], "north")],
  ["parapet", [18, 4, 14, 26, 6, 20], () => H.parapet(g, [18, 14, 26, 20], 4)],
  ["lampPost", [40, 1, 21, 40, 3, 21], () => H.lampPost(g, 40, 1, 21)],
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

// air only: a box without { over } leaves solid cells alone (fresh region, clear of the cases above)
H.box(g, [20, 1, 2, 28, 3, 6], "stone");
const again = H.box(g, [20, 1, 2, 28, 3, 6], "glass");
if (again.placed !== 0 || g.blockAt(20, 1, 2) !== "minecraft:stone") { failed++; console.log("FAIL air-only: box wrote over solid cells"); } else console.log("ok   air-only: box without over left solid cells alone");

process.exit(failed ? 1 : 0);
