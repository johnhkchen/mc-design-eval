// Calls every h1 helper once on a small grid and checks each placed cell lies inside the footprint it was given.
// Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h1.mjs";

const g = new Grid([24, 25, 32]);

function inside(name, cells, [x0, y0, z0, x1, y1, z1]) {
  assert.ok(cells.length > 0, `${name} wrote nothing`);
  for (const [x, y, z] of cells)
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `${name} wrote outside its footprint at ${x},${y},${z}`);
}

inside("beamRun", h.beamRun(g, "x", 6, 16, 8, 6), [6, 6, 8, 16, 6, 8]);
inside("mannBrace", h.mannBrace(g, 6, 6, 9, "e"), [6, 6, 9, 6, 6, 9]);
inside("glazedWindow", h.glazedWindow(g, "x", 7, 9, 3, 4, 9), [7, 3, 9, 9, 4, 9]);
inside("doorAt", h.doorAt(g, 11, 2, 9, "n"), [11, 2, 9, 11, 3, 9]);
assert.equal(g.blockAt(11, 3, 9), "minecraft:spruce_door");

g.set(16, 6, 6, "stripped_spruce_wood", { axis: "x" });
inside("hangingLantern", h.hangingLantern(g, 16, 5, 6), [16, 5, 6, 16, 5, 6]);
assert.equal(h.hangingLantern(g, 20, 5, 6).length, 0, "a lantern with nothing to hang from must write nothing");

inside("ovenVault", h.ovenVault(g, 17, 1, 23, "north"), [17, 1, 23, 21, 5, 26]);
assert.equal(g.blockAt(19, 2, 24), "minecraft:campfire");

inside("benchRun", h.benchRun(g, 2, 4, 10, 1, "north"), [2, 1, 10, 4, 1, 10]);
inside("scatterBlend", h.scatterBlend(g, 0, 3, 0, 4, 7, "cobblestone", "mossy_cobblestone", 0.15), [0, 0, 4, 3, 0, 7]);
inside("kneadingTrough", h.kneadingTrough(g, 9, 2, 18, 5), [9, 2, 17, 13, 3, 19]);
inside("tableSet", h.tableSet(g, 9, 7, 11), [8, 7, 11, 10, 8, 11]);
inside("stairHousing", h.stairHousing(g, 7, 2, 18, 5), [7, 2, 14, 9, 7, 18]);

console.log("test-h1: all helpers placed blocks inside their footprints");
