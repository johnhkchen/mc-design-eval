import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "./occupancy.mjs";
import { expandArtifact, voxelKey } from "../expand.mjs";
import { applyPaint } from "./face-paint.mjs";
import {
  zoneFill, surfaceZoneHistogram, dominantCoverage, ownCoverage, FILL_FACES,
  surfaceVoxelEntries, exposedVoxelEntries,
} from "./zone-fill.mjs";

// THE SYNTHETIC TWO-STOREY HUT. A solid 5×5 box: stone base (y 0..2) with a 3-cell cobblestone quoin
// column at the (0,*,0) corner; a stone upper band (y 3..5 — the collapsed field the fill must displace)
// with a 3-cell dark_oak_log stud run at (2,*,4) and ONE isolated log speck at (4,4,4); a 5×5
// spruce_planks roof slab (y 6) with one off-policy oak_planks stray at (3,6,4) and a 2-cell bricks
// chimney at (1,7..8,1). zoneOf is a hand-rolled y-threshold — tests must not depend on structuralZones.
function hut() {
  const cells = [];
  const at = (x, y, z) => {
    if (y >= 7) return "minecraft:bricks";
    if (y === 6) return x === 3 && z === 4 ? "minecraft:oak_planks" : "minecraft:spruce_planks";
    if (y >= 3) {
      if ((x === 2 && z === 4) || (x === 4 && y === 4 && z === 4)) return "minecraft:dark_oak_log";
      return "minecraft:stone_bricks";
    }
    return x === 0 && z === 0 ? "minecraft:cobblestone" : "minecraft:stone_bricks";
  };
  for (let x = 0; x < 5; x++) for (let y = 0; y < 7; y++) for (let z = 0; z < 5; z++) {
    cells.push({ pos: [x, y, z], block: at(x, y, z) });
  }
  cells.push({ pos: [1, 7, 1], block: "minecraft:bricks" });
  cells.push({ pos: [1, 8, 1], block: "minecraft:bricks" });
  return cells;
}
const zoneOf = ([, y]) => (y >= 6 ? "roof" : y >= 3 ? "upper" : "base");
const ZONES = {
  base: { dominant: "stone_bricks", preserve: ["cobblestone", "dark_oak_log"] },
  upper: { dominant: "white_terracotta", preserve: ["dark_oak_log"] },
  roof: { dominant: "spruce_planks", preserve: ["bricks"] },
};
const artifactOf = (cells) => ({
  schema: "1.0.0",
  palette: { manifest: [] },
  placements: cells.map((c) => ({ op: "voxel", pos: c.pos, block: c.block })),
});
const blockAt = (placements, pos) =>
  placements.filter((p) => voxelKey(p.pos) === voxelKey(pos)).map((p) => p.block).pop();

// Surface census of the hut (derived in design, asserted here): each 5×5 storey layer exposes its 16-cell
// perimeter (interior buried, top occluded by the slab), so base = 48, upper = 48; the roof exposes
// 24 slab cells (the (1,6,1) cell is occluded by the chimney) + 2 chimney bricks = 26.

test("upper-band stone surface cells are filled with the zone dominant (plaster)", () => {
  const occ = occupancyFromCells(hut());
  const fill = zoneFill(occ, { zoneOf, zones: ZONES });
  // a mid-wall upper stone cell on the front (+z) face
  assert.equal(blockAt(fill.placements, [1, 4, 4]), "minecraft:white_terracotta");
  // the whole collapsed field goes: 48 upper surface − 3 stud cells kept = 45 filled (44 stone + 1 speck)
  assert.equal(fill.byZone.upper.surface, 48);
  assert.equal(fill.byZone.upper.filled, 45);
  assert.equal(fill.byZone.upper.kept, 3);
});

test("a timber stud RUN survives; the isolated log speck is filled", () => {
  const occ = occupancyFromCells(hut());
  const fill = zoneFill(occ, { zoneOf, zones: ZONES });
  for (const y of [3, 4, 5]) assert.equal(blockAt(fill.placements, [2, y, 4]), undefined); // stud kept
  assert.equal(blockAt(fill.placements, [4, 4, 4]), "minecraft:white_terracotta"); // speck filled
});

test("base cells stay stone; the cobblestone quoin run survives", () => {
  const occ = occupancyFromCells(hut());
  const fill = zoneFill(occ, { zoneOf, zones: ZONES });
  assert.equal(fill.byZone.base.surface, 48);
  assert.equal(fill.byZone.base.filled, 0); // dominant already + preserved quoins — nothing to do
  for (const y of [0, 1, 2]) assert.equal(blockAt(fill.placements, [0, y, 0]), undefined);
});

test("roof: planks kept, chimney bricks run kept, off-policy stray filled with planks", () => {
  const occ = occupancyFromCells(hut());
  const fill = zoneFill(occ, { zoneOf, zones: ZONES });
  assert.equal(fill.byZone.roof.surface, 26);
  assert.equal(fill.byZone.roof.filled, 1);
  assert.equal(blockAt(fill.placements, [3, 6, 4]), "minecraft:spruce_planks"); // oak stray → field
  assert.equal(blockAt(fill.placements, [1, 7, 1]), undefined); // chimney kept
  assert.equal(blockAt(fill.placements, [1, 8, 1]), undefined);
});

test("fill is geometry-safe: recolors land on existing voxels only, expand pos-set identical", () => {
  const cells = hut();
  const occ = occupancyFromCells(cells);
  const art = artifactOf(cells);
  const fill = zoneFill(occ, { zoneOf, zones: ZONES });
  for (const p of fill.placements) assert.ok(occ.has(...p.pos));
  const posSet = (vs) => new Set(vs.map((v) => voxelKey(v.pos)));
  assert.deepEqual(posSet(expandArtifact(applyPaint(art, fill.placements))), posSet(expandArtifact(art)));
});

test("interior cells are never filled", () => {
  const occ = occupancyFromCells(hut());
  const fill = zoneFill(occ, { zoneOf, zones: ZONES });
  // (2,4,2) is a buried upper-band stone voxel (all six neighbours occupied)
  assert.equal(blockAt(fill.placements, [2, 4, 2]), undefined);
  // and no placement anywhere targets a non-surface voxel: total = per-zone fills
  assert.equal(fill.placements.length, fill.filled);
  assert.equal(fill.filled, 45 + 0 + 1);
});

test("a zone without a policy entry is untouched", () => {
  const occ = occupancyFromCells(hut());
  const fill = zoneFill(occ, { zoneOf, zones: { upper: ZONES.upper } });
  assert.equal(fill.byZone.base, undefined);
  assert.equal(fill.byZone.roof, undefined);
  assert.ok(fill.placements.every((p) => zoneOf(p.pos) === "upper"));
});

test("minRun is respected: at minRun 3 the 2-cell chimney is filled, the 3-cell stud survives", () => {
  const occ = occupancyFromCells(hut());
  const fill = zoneFill(occ, { zoneOf, zones: ZONES, minRun: 3 });
  assert.equal(blockAt(fill.placements, [1, 7, 1]), "minecraft:spruce_planks");
  assert.equal(blockAt(fill.placements, [1, 8, 1]), "minecraft:spruce_planks");
  for (const y of [3, 4, 5]) assert.equal(blockAt(fill.placements, [2, y, 4]), undefined);
});

test("surfaceZoneHistogram: hand counts before, dominant+studs only after the fill", () => {
  const cells = hut();
  const occ = occupancyFromCells(cells);
  const before = surfaceZoneHistogram(occ, zoneOf);
  assert.deepEqual(before.upper, { total: 48, byBlock: { stone_bricks: 44, dark_oak_log: 4 } });
  assert.deepEqual(before.roof, { total: 26, byBlock: { spruce_planks: 23, oak_planks: 1, bricks: 2 } });
  assert.deepEqual(before.base, { total: 48, byBlock: { stone_bricks: 45, cobblestone: 3 } });
  for (const z of Object.values(before)) {
    assert.equal(Object.values(z.byBlock).reduce((a, b) => a + b, 0), z.total);
  }
  const fill = zoneFill(occ, { zoneOf, zones: ZONES });
  const after = surfaceZoneHistogram(
    occupancyFromCells(expandArtifact(applyPaint(artifactOf(cells), fill.placements))), zoneOf);
  assert.deepEqual(after.upper, { total: 48, byBlock: { white_terracotta: 45, dark_oak_log: 3 } });
  assert.deepEqual(after.roof, { total: 26, byBlock: { spruce_planks: 24, bricks: 2 } });
  assert.equal(FILL_FACES.length, 5); // the census faces are the five visible ones (no -y underside)
});

test("dominantCoverage: per-zone fraction of the intended dominant, permille-rounded", () => {
  const hist = {
    upper: { total: 638, byBlock: { white_terracotta: 454, dark_oak_log: 184 } },
    base: { total: 598, byBlock: { stone_bricks: 370, dark_oak_log: 159, cobblestone: 69 } },
  };
  const cov = dominantCoverage(hist, {
    upper: { dominant: "minecraft:white_terracotta" }, // namespaced policy id normalizes
    base: { dominant: "stone_bricks", preserve: ["cobblestone"], splat: [] }, // extra keys ignored
  });
  assert.deepEqual(cov.upper, { ...hist.upper, dominant: "white_terracotta", dominantFraction: 0.712 });
  assert.deepEqual(cov.base, { ...hist.base, dominant: "stone_bricks", dominantFraction: 0.619 });
});

test("dominantCoverage: absent dominant counts as 0; un-intended or empty zones report null", () => {
  const hist = {
    upper: { total: 10, byBlock: { stone_bricks: 10 } }, // intended dominant nowhere on the skin
    attic: { total: 4, byBlock: { spruce_planks: 4 } },  // no policy entry
    void: { total: 0, byBlock: {} },                     // empty census
  };
  const cov = dominantCoverage(hist, { upper: { dominant: "white_terracotta" }, void: { dominant: "stone_bricks" } });
  assert.equal(cov.upper.dominantFraction, 0);
  assert.deepEqual([cov.attic.dominant, cov.attic.dominantFraction], [null, null]);
  assert.deepEqual([cov.void.dominant, cov.void.dominantFraction], ["stone_bricks", null]);
});

test("dominantCoverage: composes with surfaceZoneHistogram on the hut census", () => {
  const cov = dominantCoverage(surfaceZoneHistogram(occupancyFromCells(hut()), zoneOf), ZONES);
  assert.equal(cov.base.dominantFraction, Math.round((45 / 48) * 1000) / 1000);
  assert.equal(cov.upper.dominant, "white_terracotta");
  assert.throws(() => dominantCoverage(null), /hist/);
});

// ---------------------------------------------------------------------------------------------------
// T-090-01: the FULL-SHELL exposure skin. The synthetic below reproduces the geometry class that
// defeats the projection skin on the cottage (615/615 grey roof-band cells sit on faces NO ortho ray
// reaches): a cell exposed into a COVERED STEP GAP. Two 3-tall spruce ridges (x=0 and x=2) flank a
// 1-wide valley; the valley FLOOR (y=0) is stone_bricks (the grey course side cells) and a spruce CAP
// (y=2) bridges the gap. The mid-valley floor cell (1,0,1) has its +y face open into the covered slot,
// but every ortho ray passes over it: +y stops at the cap, ±x at the ridges, ±z at the slot mouths.
// Ridge A's (0,*,0) column is a 3-cell dark_oak_log stud run. 24 cells, all air-adjacent.
function steppedRoof() {
  const cells = [];
  for (const x of [0, 2]) for (let y = 0; y <= 2; y++) for (let z = 0; z <= 2; z++) {
    cells.push({ pos: [x, y, z], block: x === 0 && z === 0 ? "minecraft:dark_oak_log" : "minecraft:spruce_planks" });
  }
  for (let z = 0; z <= 2; z++) {
    cells.push({ pos: [1, 0, z], block: "minecraft:stone_bricks" }); // the grey valley course
    cells.push({ pos: [1, 2, z], block: "minecraft:spruce_planks" }); // the cap bridging the slot
  }
  return cells;
}
const roofOnly = () => "roof";
const ROOF_ZONES = { roof: { dominant: "spruce_planks", preserve: ["dark_oak_log"] } };

test("exposedVoxelEntries is a strict superset of the projection skin (hut)", () => {
  const occ = occupancyFromCells(hut());
  const proj = new Set([...surfaceVoxelEntries(occ)].map((e) => e.key));
  const expo = new Set([...exposedVoxelEntries(occ)].map((e) => e.key));
  for (const k of proj) assert.ok(expo.has(k), `projected ${k} must be exposure-skin too`);
  assert.ok(!proj.has("2,4,2") && !expo.has("2,4,2")); // buried: in neither skin
  // an underside-only cell (interior y=0 column, only its -y face is air) is exposure-only
  assert.ok(!proj.has("2,0,2") && expo.has("2,0,2"));
  assert.ok(expo.size > proj.size);
});

test("covered valley: the occluded grey cell is missed by projection, found by exposure", () => {
  const occ = occupancyFromCells(steppedRoof());
  const proj = new Set([...surfaceVoxelEntries(occ)].map((e) => e.key));
  const expo = new Set([...exposedVoxelEntries(occ)].map((e) => e.key));
  assert.ok(!proj.has("1,0,1"), "no ortho ray reaches the mid-valley floor cell");
  assert.ok(expo.has("1,0,1"), "its +y face into the covered slot is air-exposed");
  assert.equal(expo.size, 24); // every cell of the synthetic is air-adjacent
});

test("zoneFill skin:'exposure' recolors the grey valley course; skin:'projection' cannot", () => {
  const occ = occupancyFromCells(steppedRoof());
  const full = zoneFill(occ, { zoneOf: roofOnly, zones: ROOF_ZONES, skin: "exposure" });
  assert.equal(blockAt(full.placements, [1, 0, 1]), "minecraft:spruce_planks");
  assert.equal(full.byZone.roof.surface, 24);
  assert.equal(full.filled, 3); // the whole stone course; everything else is dominant or the stud run
  const proj = zoneFill(occ, { zoneOf: roofOnly, zones: ROOF_ZONES });
  assert.equal(blockAt(proj.placements, [1, 0, 1]), undefined); // the old fill leaves the grey cell
  assert.equal(proj.filled, 2); // only the slot-mouth cells are on the projection skin
});

test("a stud run survives the exposure fill", () => {
  const occ = occupancyFromCells(steppedRoof());
  const full = zoneFill(occ, { zoneOf: roofOnly, zones: ROOF_ZONES, skin: "exposure" });
  for (const y of [0, 1, 2]) assert.equal(blockAt(full.placements, [0, y, 0]), undefined);
});

test("a declared sub-region keeps its material unconditionally", () => {
  const occ = occupancyFromCells(hut());
  // preservation disabled both ways: empty preserve set AND an unreachable minRun — only the declared
  // region can save the chimney; the oak stray (outside the region) is still filled.
  const zones = { ...ZONES, roof: { dominant: "spruce_planks", preserve: [] } };
  const regions = [{ name: "chimney", contains: ([x, y, z]) => x === 1 && z === 1 && y >= 7 }];
  const fill = zoneFill(occ, { zoneOf, zones, regions, minRun: 99, skin: "exposure" });
  assert.equal(blockAt(fill.placements, [1, 7, 1]), undefined);
  assert.equal(blockAt(fill.placements, [1, 8, 1]), undefined);
  assert.equal(fill.byRegion.chimney, 2);
  assert.equal(blockAt(fill.placements, [3, 6, 4]), "minecraft:spruce_planks");
});

test("exposure fill is recolor-only: placements land on existing voxels, geometry unchanged", () => {
  const cells = steppedRoof();
  const occ = occupancyFromCells(cells);
  const art = artifactOf(cells);
  const fill = zoneFill(occ, { zoneOf: roofOnly, zones: ROOF_ZONES, skin: "exposure" });
  for (const p of fill.placements) assert.ok(occ.has(...p.pos));
  const posSet = (vs) => new Set(vs.map((v) => voxelKey(v.pos)));
  assert.deepEqual(posSet(expandArtifact(applyPaint(art, fill.placements))), posSet(expandArtifact(art)));
});

test("surfaceZoneHistogram skin:'exposure' matches hand counts on the covered valley", () => {
  const hist = surfaceZoneHistogram(occupancyFromCells(steppedRoof()), roofOnly, { skin: "exposure" });
  assert.deepEqual(hist.roof, { total: 24, byBlock: { spruce_planks: 18, stone_bricks: 3, dark_oak_log: 3 } });
});

test("unknown skin and malformed regions throw", () => {
  const occ = occupancyFromCells(hut());
  assert.throws(() => zoneFill(occ, { zoneOf, zones: ZONES, skin: "oblique" }), /skin "oblique"/);
  assert.throws(() => surfaceZoneHistogram(occ, zoneOf, { skin: "glb" }), /skin "glb"/);
  assert.throws(() => zoneFill(occ, { zoneOf, zones: ZONES, regions: [{ name: "x" }] }), /region/);
});

test("ownCoverage: dominant + declared preserve fraction (T-090's own set); monotone vs dominant-only", () => {
  const hist = {
    band1: { total: 396, byBlock: { smooth_sandstone: 92, spruce_planks: 128, dark_oak_log: 134, cobblestone: 27, tuff: 13, spruce_fence: 2 } },
    attic: { total: 4, byBlock: { spruce_planks: 4 } }, // no policy entry → null
  };
  const cov = ownCoverage(hist, {
    band1: { dominant: "minecraft:smooth_sandstone", preserve: ["spruce_planks", "dark_oak_log", "cobblestone"] },
  });
  assert.equal(cov.band1.dominantFraction, 0.232); // the dominant-only count survives unchanged
  assert.deepEqual(cov.band1.own, ["smooth_sandstone", "spruce_planks", "dark_oak_log", "cobblestone"]);
  assert.equal(cov.band1.ownFraction, 0.962);       // foreign tuff + fence still count against
  assert.ok(cov.band1.ownFraction >= cov.band1.dominantFraction, "own ⊇ dominant — monotone");
  assert.deepEqual([cov.attic.own, cov.attic.ownFraction], [null, null]);
});
