// Calls each h2 helper once on a fresh grid: every cell it returns must lie in the box it was given, and a second
// identical call must write nothing (air only). Then a few states and the air-only rule. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h2.mjs";

const fresh = () => new Grid([28, 26, 34]);
const inside = (cells, [x0, y0, z0, x1, y1, z1]) => cells.every(([x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);

const cases = [
  ["quoin", (g) => H.quoin(g, 5, 8, 1, 5, "east"), [5, 1, 8, 6, 5, 8]],
  ["jettyBracket", (g) => H.jettyBracket(g, 5, 5, 7), [5, 5, 7, 5, 5, 7]],
  ["gableFrame", (g) => H.gableFrame(g, 5, 7, 17, 11, 15), [5, 11, 7, 5, 15, 17]],
  ["wallSign", (g) => { g.set(11, 5, 7, "dark_oak_planks"); return H.wallSign(g, 11, 5, 6, "CHANDLER"); }, [11, 5, 6, 11, 5, 6]],
  ["firebox", (g) => H.firebox(g, 17, 2, 11, "x"), [17, 2, 11, 18, 4, 12]],
  ["hiveStand", (g) => H.hiveStand(g, 15, 1, 31), [15, 1, 31, 16, 1, 31]],
  ["appleTree", (g) => H.appleTree(g, 3, 1, 22), [1, 1, 20, 5, 7, 24]],
  ["dippingWheel", (g) => H.dippingWheel(g, 9, 2, 22), [7, 2, 22, 11, 4, 22]],
];

let failed = 0;
for (const [name, call, box] of cases) {
  const g = fresh();
  const cells = call(g);
  const again = call(g);
  const ok = cells.length > 0 && inside(cells, box) && again.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${cells.length} cells${again.length ? `, second call wrote ${again.length}` : ""}${inside(cells, box) ? "" : ", outside box"}`);
}

// specifics: the parity of the quoin, the bracket's half and facing, the gable's king post and window, the sign's
// backing, the firebox's lit back row and lintel, the hive's facing, the wheel's candles, the air-only rule
const g1 = fresh();
H.quoin(g1, 5, 8, 1, 5, "east");
const quoinOk = g1.blockAt(6, 2, 8) === "minecraft:stone_bricks" && g1.isAir(6, 3, 8) && g1.blockAt(5, 3, 8) === "minecraft:stone_bricks";
const g2 = fresh();
H.jettyBracket(g2, 5, 5, 7);
const bracketOk = g2.blockAt(5, 5, 7) === "minecraft:dark_oak_stairs" && g2.get(5, 5, 7).state.half === "top" && g2.get(5, 5, 7).state.facing === "south";
const g3 = fresh();
H.gableFrame(g3, 5, 7, 17, 11, 15);
const gableOk = [11, 12, 13, 14, 15].every((y) => g3.blockAt(5, y, 12) === "minecraft:stripped_dark_oak_log") &&
  g3.blockAt(5, 12, 14) === "minecraft:glass_pane" && g3.blockAt(5, 11, 8) === "minecraft:calcite" && g3.blockAt(5, 13, 9) === "minecraft:stripped_dark_oak_wood";
const g4 = fresh();
const noBack = H.wallSign(g4, 11, 5, 6, "CHANDLER").length === 0 && g4.isAir(11, 5, 6);
const g5 = fresh();
H.firebox(g5, 17, 2, 11, "x");
const fireOk = g5.blockAt(18, 2, 11) === "minecraft:campfire" && g5.get(18, 2, 11).state.lit === "true" &&
  g5.blockAt(18, 2, 12) === "minecraft:campfire" && g5.get(17, 4, 11).state.axis === "z" && g5.isAir(17, 2, 11) && g5.isAir(18, 3, 12);
const g6 = fresh();
H.hiveStand(g6, 15, 1, 31);
const hiveOk = g6.get(15, 1, 31).state.facing === "north" && g6.blockAt(16, 1, 31) === "minecraft:oxeye_daisy";
const g7 = fresh();
H.appleTree(g7, 3, 1, 22);
const treeOk = g7.blockAt(3, 4, 22) === "minecraft:oak_log" && g7.get(3, 6, 22)?.block === "minecraft:oak_leaves" &&
  g7.get(3, 6, 22).state.persistent === "true" && g7.isAir(3, 0, 22) && g7.isAir(3, 8, 22);
const g8 = fresh();
H.dippingWheel(g8, 9, 2, 22);
const wheelOk = g8.blockAt(9, 2, 22) === "minecraft:dark_oak_fence" && g8.blockAt(7, 4, 22) === "minecraft:candle" &&
  g8.blockAt(9, 4, 22) === "minecraft:candle" && g8.isAir(9, 2, 21) && g8.isAir(9, 2, 23);
const g9 = fresh();
g9.set(17, 4, 11, "stone");
H.firebox(g9, 17, 2, 11, "x");
const airOnlyOk = g9.blockAt(17, 4, 11) === "minecraft:stone" && g9.blockAt(17, 4, 12) === "minecraft:stripped_dark_oak_wood";

const specifics = [
  ["quoin parity: long at even y, short at odd", quoinOk],
  ["jetty bracket: top half, facing into the wall", bracketOk],
  ["gable: king post, collar, window, calcite", gableOk],
  ["wall sign: nothing without a backing block", noBack],
  ["firebox: lit back row, lintel, mouth left air", fireOk],
  ["hive stand: facing north, daisy beside", hiveOk],
  ["apple tree: trunk, persistent crown, ground untouched", treeOk],
  ["dipping wheel: post, bar, candles over the bar", wheelOk],
  ["air only: an existing block is kept", airOnlyOk],
];
for (const [name, ok] of specifics) {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
}

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log(`all ${cases.length} helpers passed`);
