// Calls each H1 helper once on a small grid and checks that every block it placed sits inside the box it was given.
// A planted block is refused (writes only into air). Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { ringOf, windowLit, cornice, shopfront, julietBalcony, terrace, fireEscape, hvacBox } from "./h1.mjs";

// A 16 x 16 block plot: every cell is in M, so ring k is the square k cells in from the edge.
const plot = { footprint: Array(8).fill("########") };
const g = new Grid([40, 24, 24]);

const north = { face: "north", wall: Array.from({ length: 12 }, (_, i) => [2 + i, 1]) };
const south = { face: "south", wall: Array.from({ length: 12 }, (_, i) => [2 + i, 14]) };
const west = { face: "west", wall: [] };

function check(name, [lo, hi], call, grid = g) {
  const before = new Set(grid.cells.keys());
  const refused = call();
  const added = [...grid.cells].filter(([k]) => !before.has(k)).map(([, c]) => c);
  for (const c of added) {
    assert.ok(c.pos.every((v, i) => v >= lo[i] && v <= hi[i]), `${name}: ${c.block} at ${c.pos} is outside ${lo}..${hi}`);
  }
  console.log(`ok ${name}: ${added.length} cells placed, ${refused.length} refused`);
  return refused;
}

// ringOf: ring 0 is the outer edge, faceDir points out of the footprint.
const rings = ringOf(plot);
assert.deepEqual(rings.get("0,5"), { ring: 0, faceDir: "west" });
assert.equal(rings.get("5,0").faceDir, "north");
assert.equal(rings.get("1,5").ring, 1);
assert.equal(rings.get("7,7").ring, 7);
console.log("ok ringOf: ring and faceDir on a 16 x 16 plot");

// windowLit: window 0 of storey 1 is lit (1 % 3 != 0); window 2 of storey 1 is not.
const win = { face: "north", cells: [[4, 1], [5, 1]], floor: 9, h: 4, n: 0, s: 1 };
check("windowLit", [[4, 11, 2], [4, 13, 3]], () => windowLit(g, win));
assert.deepEqual(windowLit(g, { ...win, n: 2 }), []);

// cornice: a planted block on the course line is refused, not overwritten.
g.set(6, 10, 0, "dirt");
const refusedCornice = check("cornice", [[2, 9, 0], [13, 12, 0]], () =>
  cornice(g, north, { y: 10, course: "cut_sandstone", brackets: "smooth_sandstone", slab: "smooth_sandstone", slabY: 12 }));
assert.ok(refusedCornice.some(([x, y, z]) => x === 6 && y === 10 && z === 0), "cornice must refuse the planted dirt");
assert.equal(g.blockAt(6, 10, 0), "minecraft:dirt");

// shopfront: glass in ring 1, piers and fascia at ring 0.
check("shopfront", [[2, 4, 0], [13, 8, 1]], () =>
  shopfront(g, north, { baseY: 3, h: 4, frame: "polished_andesite", pierEvery: 7, fascia: "smooth_sandstone", fasciaY: 8 }));

// julietBalcony: on the south face, clear of the cornice on the north face.
check("julietBalcony", [[3, 10, 15], [6, 11, 15]], () =>
  julietBalcony(g, { face: "south", cells: [[4, 14], [5, 14]], floor: 9 }));

// terrace: ring 2 walls from y14, deck on rings 3..5 at y19, planters on the deck.
const refusedTerrace = check("terrace", [[0, 14, 0], [15, 21, 15]], () => terrace(g, plot, { ring: 2, next: 6, y0: 14, y1: 18 }));
assert.equal(refusedTerrace.length, 0, "terrace planters must not collide");

// fireEscape: two flights on the west side, the first from floor 8 to floor 15 and then to floor 22, with a ladder.
// Its own empty grid: the column sits inside this test building, so it would otherwise meet the terrace walls.
const fg = new Grid([40, 24, 24]);
check("fireEscape", [[4, 4, 1], [5, 23, 10]], () =>
  fireEscape(fg, west, { x: 5, z0: 2, z1: 9, floors: [8, 15, 22], ladderTo: 4 }), fg);

// hvacBox: a filled box with vents on two faces and a pair of pipes.
check("hvacBox", [[20, 4, 20], [23, 10, 22]], () =>
  hvacBox(g, [20, 4, 20, 23, 8, 22], { pipes: true }));

console.log("all H1 helpers passed");
