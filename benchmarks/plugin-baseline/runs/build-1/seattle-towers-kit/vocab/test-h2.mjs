// Calls every H2 helper once on a small grid: each placed block must sit inside the footprint it was given,
// and the key block must be the one asked for. Usage: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { pierRhythm, dish, komoSign, lobbyGlazing, apertureBay, doorPair, tree, ceilingLamp } from "./h2.mjs";

const g = new Grid([60, 50, 60]);
const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const cells = () => new Map([...g].map((c) => [c.pos.join(","), c.block]));
let failed = 0;

// Runs one helper, then checks what it changed against its footprint and the expected block at one cell.
function check(label, footprint, expect, fn) {
  const before = cells(), res = fn();
  const changed = [...g].filter((c) => before.get(c.pos.join(",")) !== c.block);
  const outside = changed.filter((c) => !inside(footprint, c.pos));
  const want = expect ? g.blockAt(...expect[0]) === `minecraft:${expect[1]}` : true;
  const ok = outside.length === 0 && res.placed > 0 && want;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: placed ${res.placed}, outside ${outside.length}${want ? "" : `, wrong block at ${expect[0]}`}`);
  if (outside.length) console.log("     ", outside.slice(0, 5).map((c) => `${c.pos}=${c.block}`).join(" "));
  return res;
}

// pierRhythm: a glass ribbon at slab 7 along x (z 5), piers and white corners over the glass rows.
g.fill([4, 8, 5], [20, 10, 5], "gray_stained_glass_pane");
check("pierRhythm", [4, 8, 5, 20, 10, 5], [[12, 9, 5], "light_gray_concrete"], () => pierRhythm(g, { x0: 4, x1: 20, z: 5, slab: 7 }));

// dish on a deck at y 38 (the deck itself must stay as it is).
g.set(40, 38, 20, "smooth_stone");
check("dish", [36, 39, 19, 44, 47, 24], [[40, 39, 20], "polished_andesite"], () => dish(g, { cx: 40, cz: 20, deckY: 38, d: 9 }));
if (g.blockAt(40, 38, 20) !== "minecraft:smooth_stone") { failed++; console.log("FAIL dish wrote the deck"); }

// komoSign: the letters hang one cell in front of the north wall (z 4, built by the shell part), x 28..38, y 30..34.
g.fill([26, 28, 4], [46, 36, 4], "white_concrete");
check("komoSign", [28, 29, 3, 44, 35, 3], [[40, 30, 3], "blue_concrete"], () => komoSign(g, { at: [38, 30, 4] }));

// lobbyGlazing: glass with a column every 4 along z = 30, band at y 6.
check("lobbyGlazing", [0, 1, 30, 11, 6, 30], [[1, 2, 30], "glass"], () => lobbyGlazing(g, { run: { x0: 0, x1: 11, z: 30 } }));

// apertureBay: dark bay on the north wall at z 2, rows 8..11.
check("apertureBay", [10, 8, 2, 14, 11, 2], [[12, 9, 2], "glass_pane"], () => apertureBay(g, { x: 10, z: 2, face: "north", dark: true, slab: 7 }));

// doorPair: a stone already at the first door's foot, so that cell is refused and kept.
g.set(5, 1, 2, "stone");
const pair = check("doorPair", [5, 1, 2, 6, 2, 2], [[6, 1, 2], "iron_door"], () => doorPair(g, { x: 5, y: 1, z: 2, face: "north" }));
if (!(pair.refused.length === 1 && g.blockAt(5, 1, 2) === "minecraft:stone")) { failed++; console.log("FAIL doorPair did not refuse the stone"); }

// tree: trunk and crown inside 5x5 from the paving up.
check("tree", [18, 1, 18, 22, 7, 22], [[20, 1, 20], "oak_log"], () => tree(g, 20, 20, { y: 1, height: 5 }));

// ceilingLamp: ceiling of diorite at y 6 over the room box; lamps replace it.
g.fill([2, 6, 2], [12, 6, 12], "polished_diorite");
check("ceilingLamp", [5, 6, 5, 11, 6, 11], [[5, 6, 5], "sea_lantern"], () => ceilingLamp(g, [2, 0, 2, 12, 4, 12], 6));

if (failed) { console.log(`${failed} check(s) failed`); process.exitCode = 1; }
else console.log("all H2 checks passed");
