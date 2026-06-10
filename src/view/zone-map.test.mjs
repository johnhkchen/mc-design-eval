// Unit suite for the occupancy-side zone map (T-092-01, S-092, E-25): layer counts, bands →
// {zoneOf, zones}, and the derived-vs-prior diff. Synthetic occupancy only (the zone-fill hut
// pattern); structuralZones is NOT a dependency here — roofKeys/upperTop are hand-rolled so the
// tests pin the composition contract, not the geometry extractor.

import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "./occupancy.mjs";
import { zoneFill } from "./zone-fill.mjs";
import { layerCounts, zonesFromBands, diffZoneMaps } from "./zone-map.mjs";

/** A 3×3 solid tower, y 0..5, with a 1-cell chimney at y 6..7. */
function tower() {
  const cells = [];
  for (let x = 0; x < 3; x++) for (let y = 0; y < 6; y++) for (let z = 0; z < 3; z++) {
    cells.push({ pos: [x, y, z], block: "minecraft:stone_bricks" });
  }
  cells.push({ pos: [1, 6, 1], block: "minecraft:cobblestone" });
  cells.push({ pos: [1, 7, 1], block: "minecraft:cobblestone" });
  return cells;
}

/** The cottage-shaped band fixture: stone plinth y 0..2, plaster y 3..7, roof above y ≥ 8. */
const BANDS = [
  { name: "band0", yRange: [0, 2], dominantBlock: "stone_bricks", secondaries: [{ block: "cobblestone" }] },
  { name: "band1", yRange: [3, 7], dominantBlock: "white_terracotta", secondaries: [{ block: "dark_oak_log" }, { block: "cobblestone" }] },
];
const ROOF = { dominantBlock: "spruce_planks", secondaries: [{ block: "dark_oak_planks" }, { block: "spruce_planks" }] };

test("layerCounts: occupied cells per y, chimney layers narrow", () => {
  const lc = layerCounts(occupancyFromCells(tower()));
  assert.equal(lc.yMin, 0);
  assert.deepEqual(lc.counts, [9, 9, 9, 9, 9, 9, 1, 1]);
});

test("layerCounts: empty occupancy", () => {
  assert.deepEqual(layerCounts(occupancyFromCells([])), { yMin: 0, counts: [] });
});

test("zonesFromBands: roof by membership OR eave threshold, walls by containing band", () => {
  const roofKeys = new Set(["0,5,0"]); // a top-exposed cell BELOW the eave (a low porch roof)
  const { zoneOf } = zonesFromBands({ bands: BANDS, roof: ROOF, roofKeys, upperTop: 8 });
  assert.equal(zoneOf([1, 1, 1]), "band0");
  assert.equal(zoneOf([1, 5, 1]), "band1");
  assert.equal(zoneOf([0, 5, 0]), "roof"); // membership wins below the eave
  assert.equal(zoneOf([2, 9, 2]), "roof"); // at/above the eave
});

test("zonesFromBands: zoneOf is total — out-of-band y clamps to the nearest end band", () => {
  const { zoneOf } = zonesFromBands({ bands: BANDS, roof: ROOF, roofKeys: new Set(), upperTop: 12 });
  assert.equal(zoneOf([0, -3, 0]), "band0"); // below band0
  assert.equal(zoneOf([0, 10, 0]), "band1"); // wall gap between bands' top and the eave
});

test("zonesFromBands: named-space policies — preserve = secondaries, splat = preserve − dominant", () => {
  const { zones } = zonesFromBands({ bands: BANDS, roof: ROOF, roofKeys: new Set(), upperTop: 8 });
  assert.deepEqual(zones.band0, { dominant: "stone_bricks", preserve: ["cobblestone"], splat: ["cobblestone"] });
  assert.deepEqual(zones.band1.preserve, ["dark_oak_log", "cobblestone"]);
  // the roof's self-referencing secondary (spruce_planks) is dropped from preserve/splat
  assert.deepEqual(zones.roof, { dominant: "spruce_planks", preserve: ["dark_oak_planks"], splat: ["dark_oak_planks"] });
});

test("zonesFromBands output drives zoneFill directly (the consumability proof)", () => {
  const occ = occupancyFromCells(tower());
  const { zoneOf, zones } = zonesFromBands({ bands: BANDS, roof: ROOF, roofKeys: new Set(), upperTop: 6 });
  const fill = zoneFill(occ, { zoneOf, zones, skin: "exposure" });
  // a plaster-band wall cell currently stone → recolored to the band dominant
  const hit = fill.placements.find((p) => p.pos[0] === 0 && p.pos[1] === 4 && p.pos[2] === 0);
  assert.equal(hit?.block, "minecraft:white_terracotta");
  // the 2-cell cobble chimney (y ≥ upperTop → roof zone) is a preserve… NOT in roof preserve here,
  // so it recolors to the roof dominant — proving the policy really is what zonesFromBands said
  const chim = fill.placements.find((p) => p.pos[1] === 7);
  assert.equal(chim?.block, "minecraft:spruce_planks");
  // plinth cells keep their stone dominant
  assert.equal(fill.byZone.band0.filled, 0);
});

test("diffZoneMaps: the ground-storey flip is recorded as a maximal differing run", () => {
  const prior = {
    zones: { base: { dominant: "stone_bricks" }, upper: { dominant: "white_terracotta" }, roof: { dominant: "spruce_planks" } },
    storeyDivide: 7, // the prior put the WHOLE ground storey in stone
    upperTop: 8,
  };
  const diff = diffZoneMaps({ prior, derived: { bands: BANDS, roof: ROOF }, yMin: 0 });
  // derived says plaster from y3; prior says stone until y6 → one differing run y 3..6
  assert.deepEqual(diff.wallDiffs, [
    { yRange: [3, 6], prior: "stone_bricks", derived: "white_terracotta" },
  ]);
  assert.deepEqual(diff.roofDominant, { prior: "spruce_planks", derived: "spruce_planks", changed: false });
});

test("diffZoneMaps: identical maps diff empty; roof change flagged", () => {
  const prior = {
    zones: { base: { dominant: "stone_bricks" }, upper: { dominant: "white_terracotta" }, roof: { dominant: "deepslate_tiles" } },
    storeyDivide: 3,
    upperTop: 8,
  };
  const diff = diffZoneMaps({ prior, derived: { bands: BANDS, roof: ROOF }, yMin: 0 });
  assert.deepEqual(diff.wallDiffs, []);
  assert.equal(diff.roofDominant.changed, true);
});
