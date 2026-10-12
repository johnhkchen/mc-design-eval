// Calls every h1 helper once on a small grid and checks each placed cell lies inside the footprint it was given.
// Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h1.mjs";

const g = new Grid([30, 22, 30]);

function inside(name, cells, [x0, y0, z0, x1, y1, z1]) {
  assert.ok(cells.length > 0, `${name} wrote nothing`);
  for (const [x, y, z] of cells)
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `${name} wrote outside its footprint at ${x},${y},${z}`);
}

inside("brickCourse", h.brickCourse(g, 2, 8, 1, 2, 0.125), [2, 1, 2, 8, 1, 2]);
assert.match(g.blockAt(2, 1, 2), /stone_bricks$/);

inside("doorPair", h.doorPair(g, 7, 2, 8, "n", "left", "dark_oak"), [7, 1, 7, 7, 3, 8]);
assert.equal(g.blockAt(7, 2, 8), "minecraft:dark_oak_door");
assert.equal(g.blockAt(7, 3, 8), "minecraft:dark_oak_door");
assert.equal(h.doorPair(g, 7, 2, 8, "n").length, 0, "a door over an occupied cell must write nothing");

inside("braceStair", h.braceStair(g, 7, 7, 12, "w"), [6, 7, 12, 7, 9, 12]);
inside("shutterPair", h.shutterPair(g, 17, 8, 8, "e"), [17, 8, 7, 17, 8, 10]);

inside("chimneyStack", h.chimneyStack(g, 18, 11, 18, 16), [18, 1, 11, 19, 19, 12]);
assert.equal(g.blockAt(19, 19, 12), "minecraft:campfire");
assert.equal(g.blockAt(18, 16, 11), "minecraft:deepslate_bricks");

inside("candleRack", h.candleRack(g, 15, 1, 20), [15, 1, 20, 15, 2, 22]);
inside("streetRows", h.streetRows(g, 0, 25, 0), [0, 0, 0, 25, 0, 7]);
inside("candleVat", h.candleVat(g, 22, 2, 14, { water: true }), [22, 2, 14, 23, 2, 14]);

console.log("test-h1: all helpers placed blocks inside their footprints");
