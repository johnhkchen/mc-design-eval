// Calls each h2 helper once on a small grid and checks it wrote only inside the footprint it returned, only into air,
// and never below y 1 (lawnPath alone touches its ground surface at y 0). Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h2.mjs";

const g = new Grid([300, 32, 150], { dataVersion: 3955 });            // 1.21.1
for (let x = 0; x < 300; x++) for (let z = 0; z < 150; z++) g.set(x, 0, z, "smooth_stone");

const snapshot = () => new Map([...g.cells.values()].map((c) => [c.pos.join(","), JSON.stringify(c)]));
const inside = ([[x0, y0, z0], [x1, y1, z1]], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

function run(name, fn, { ground = false } = {}) {
  const before = snapshot();
  const r = fn();
  const changed = [...g.cells.values()].filter((c) => before.get(c.pos.join(",")) !== JSON.stringify(c));
  const outside = changed.filter((c) => !inside(r.box, c.pos) || (!ground && c.pos[1] < 1));
  assert.equal(outside.length, 0, `${name} wrote outside its footprint: ${outside.map((c) => c.pos).join(" ")}`);
  assert.equal(changed.length, r.placed, `${name}: placed count disagrees with the cells changed`);
  assert.ok(r.placed > 0, `${name} placed nothing`);
  console.log(`ok  ${name}: ${r.placed} cells, ${r.refused.length} refused`);
  return r;
}

// Ground-floor window run (y 2, 4 high) with one glass cell already solid: that cell must be refused, not overwritten.
g.set(12, 3, 39, "smooth_sandstone");
const win = run("stripWindowRun", () => H.stripWindowRun(g, { face: "south", plane: 40, from: 10, y: 2 }));
assert.equal(win.placed, 29, "6-wide, 4-high glass plus its 6-cell sill, minus the one solid cell");
assert.equal(g.blockAt(12, 3, 39), "minecraft:smooth_sandstone");

const doors = run("doorPair", () => H.doorPair(g, { x: 60, z: 5, face: "north", width: 4, surround: true }));
assert.equal(doors.placed, 20, "8 door halves, 6 red jamb cells, 6 lintel cells");

run("steelTruss", () => H.steelTruss(g, { z: 40 }));
run("vestibuleGlassBox", () => H.vestibuleGlassBox(g, { x0: 5, z0: 145, x1: 25, z1: 146, h: 6 }));
run("galleriaSkylight", () => H.galleriaSkylight(g, { rect: { x0: 110, z0: 122, x1: 150, z1: 127 }, y: 6 }));
run("vaultEndGable", () => H.vaultEndGable(g, { z: 4 }));
run("gallerySlotWindow", () => H.gallerySlotWindow(g, { x: 257, z: 20 }));
run("greenRoofPatch", () => H.greenRoofPatch(g, { x0: 260, z0: 14, x1: 280, z1: 40 }));
run("lawnPath", () => H.lawnPath(g, { points: [[120, 10], [140, 30], [160, 30]], y: 0 }), { ground: true });

console.log("all h2 helpers passed");
