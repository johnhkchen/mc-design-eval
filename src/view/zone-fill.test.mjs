import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "./occupancy.mjs";
import { expandArtifact, voxelKey } from "../expand.mjs";
import { applyPaint } from "./face-paint.mjs";
import { zoneFill, surfaceZoneHistogram, FILL_FACES } from "./zone-fill.mjs";

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
