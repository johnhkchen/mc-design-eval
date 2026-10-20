// Calls each H2 helper once on a small grid (dirt at y 0) and checks: every block it placed lies inside the footprint
// given to it, the ground is untouched, an occupied cell is refused, and the doors, lantern and leaves came out right.
// Writes build-h2.nbt to the OS temp dir so mcd can read it back. Run: node vocab/test-h2.mjs
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { retainingWall, canopyBay, quartzWindow, deckStrip, benchRow, towerShaft, plantedBank } from "./h2.mjs";

const g = new Grid([40, 30, 40], { dataVersion: 3955 });
for (let x = 0; x < 40; x++) for (let z = 0; z < 40; z++) g.set(x, 0, z, "dirt");
const snap = () => new Map([...g].map((c) => [c.pos.join(","), c.block + JSON.stringify(c.state ?? {})]));
let failed = 0;
const check = (name, ok, extra = "") => { if (!ok) failed++; console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? "  " + extra : ""}`); };

// run a helper, then confirm every cell it changed sits inside its footprint [x0,x1,y0,y1,z0,z1]
function run(name, fn, box) {
  const before = snap(), r = fn();
  const after = snap();
  const [x0, x1, y0, y1, z0, z1] = box;
  const changed = [...after].filter(([k, v]) => before.get(k) !== v).map(([k]) => k.split(",").map(Number));
  const outside = changed.filter(([x, y, z]) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ground = changed.some(([, y]) => y === 0);
  check(name, r.placed > 0 && outside.length === 0 && !ground, `placed ${r.placed}, refused ${r.refused}, outside ${outside.length}`);
  return after;
}

const cube = (x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");

// retainingWall: two columns (x 4..5), stone up to top 6, rim at 7, planter at 7..8
run("retainingWall", () => retainingWall(g, { x: 4, z0: 4, z1: 9, top: 6, base: 3 }), [4, 5, 3, 8, 4, 9]);
check("retainingWall rim is an open trapdoor", g.get(4, 7, 4)?.block === "minecraft:spruce_trapdoor" && g.get(4, 7, 4).state.open === "true");

// canopyBay on the west face at x 14, F 2: beam at x 13, lantern hangs from it
run("canopyBay", () => canopyBay(g, { x: 14, z0: 4, z1: 12, F: 2 }), [13, 14, 7, 9, 4, 12]);
const lamp = [...g].find((c) => c.block === "minecraft:lantern" && c.pos[0] === 13);
check("canopyBay lantern hangs from the beam", !!lamp && lamp.state.hanging === "true" && cube(13, lamp.pos[1] + 1, lamp.pos[2]) === "stripped_spruce_wood");

// quartzWindow on the west face, line x 20: 2 wide x 3 high glass set 1 in (x 21), sill y 4, lintel y 8
run("quartzWindow", () => quartzWindow(g, { face: "west", at: 20, pos: 4, y: 5 }), [21, 21, 4, 8, 4, 5]);
check("quartzWindow has 6 panes", [...g].filter((c) => c.block === "minecraft:glass_pane" && c.pos[0] === 21).length === 6);

// deckStrip replaces a smooth_stone deck at y 6 (the strips), and leaves the rest of the deck alone
for (let x = 24; x <= 34; x++) for (let z = 4; z <= 12; z++) g.set(x, 6, z, "smooth_stone");
run("deckStrip", () => deckStrip(g, { x0: 24, x1: 34, z0: 4, z1: 12, y: 6, strips: [24, 30] }), [24, 34, 6, 6, 4, 12]);
check("deckStrip leaves the deck between strips", cube(27, 6, 8) === "smooth_stone" && cube(25, 6, 8) === "spruce_planks");

// benchRow: 8 seats, a gap every 6th cell, nothing above y 2
run("benchRow", () => benchRow(g, { x: 36, z0: 4, len: 8, y: 2 }), [36, 36, 2, 2, 4, 11]);
check("benchRow leaves the 6th cell open", cube(36, 2, 9) === "air" && cube(36, 2, 8) === "spruce_stairs");

// towerShaft: piers and glass, lift cell with soul_sand and bubble column, doorway cells left air
const doors = [[2, 2, 19], [2, 3, 19]];
run("towerShaft", () => towerShaft(g, { x0: 2, x1: 8, z0: 16, z1: 23, base: 1, top: 10, decks: [4, 7], doors }), [2, 8, 1, 11, 16, 23]);
check("towerShaft doorway stays air", doors.every(([x, y, z]) => cube(x, y, z) === "air"));
check("towerShaft lift column bubbles", cube(5, 1, 19) === "soul_sand" && cube(5, 5, 19) === "bubble_column");

// plantedBank: grass with moss, planting at y 2, one oak per 12 cells
run("plantedBank", () => plantedBank(g, { x0: 12, x1: 22, z0: 20, z1: 30, y: 1 }), [12, 22, 1, 5, 20, 30]);
check("plantedBank has a persistent oak leaf", [...g].some((c) => c.block === "minecraft:oak_leaves" && c.state?.persistent === "true"));

// refusal: an occupied cell inside a footprint is left alone and counted
g.set(7, 4, 5, "stone");
const r = retainingWall(g, { x: 6, z0: 4, z1: 6, top: 6, base: 3 });
check("occupied cell is refused, not overwritten", cube(7, 4, 5) === "stone" && r.refused > 0, `refused ${r.refused}`);

// ground layer: nothing below y 1 changed (dirt still there everywhere)
const dirtLeft = [...g].filter((c) => c.pos[1] === 0 && c.block === "minecraft:dirt").length;
check("ground layer untouched", dirtLeft === 40 * 40, `${dirtLeft} dirt cells`);

g.save(join(tmpdir(), "build-h2.nbt"));
console.log(failed ? `${failed} check(s) failed` : "all h2 checks passed");
process.exit(failed ? 1 : 0);
