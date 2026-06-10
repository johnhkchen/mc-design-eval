// Unit tests for shell-integrity.mjs (T-091-01, story S-091, epic E-25) — synthetic occupancies only;
// the witnessed-artifact runs live in the runner (benchmarks/sculpture/shell-integrity.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells, artifactOccupancy } from "./occupancy.mjs";
import {
  componentStrip, rebuildArtifact, openingRegions, inRegion, fillVoids, closureCheck, plugClosure,
} from "./shell-integrity.mjs";

/** Solid box of `block` over inclusive ranges. */
function boxCells(x0, x1, y0, y1, z0, z1, block = "stone") {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    cells.push({ pos: [x, y, z], block });
  }
  return cells;
}

/** Hollow box: walls at the x/z extremes + a roof at y1; OPEN bottom (the ground-solid case). */
function hollowBoxCells(x0, x1, y0, y1, z0, z1, block = "stone") {
  return boxCells(x0, x1, y0, y1, z0, z1, block).filter(({ pos: [x, y, z] }) =>
    x === x0 || x === x1 || z === z0 || z === z1 || y === y1);
}

const drop = (cells, ...positions) => {
  const dropSet = new Set(positions.map((p) => p.join(",")));
  return cells.filter((c) => !dropSet.has(c.pos.join(",")));
};

// ---------------------------------------------------------------- componentStrip

test("componentStrip strips a floating cube and declares it", () => {
  const cells = [...boxCells(0, 3, 0, 2, 0, 3), ...boxCells(6, 7, 5, 6, 0, 1, "dirt")];
  const r = componentStrip(occupancyFromCells(cells));
  assert.equal(r.components, 2);
  assert.equal(r.stripped.length, 1);
  assert.equal(r.strippedCells, 8);
  assert.equal(r.stripped[0].minY, 5);
  assert.equal(r.kept.length, 1);
  assert.equal(r.kept[0].largest, true);
  assert.equal(r.occ.size, 48);
  assert.equal(r.occ.has(6, 5, 0), false);
});

test("componentStrip keeps a grounded detached pillar as a declared exception", () => {
  const cells = [...boxCells(0, 3, 0, 2, 0, 3), ...boxCells(8, 8, 0, 4, 0, 0, "oak_log")];
  const r = componentStrip(occupancyFromCells(cells));
  assert.equal(r.components, 2);
  assert.equal(r.stripped.length, 0);
  assert.equal(r.occ.has(8, 0, 0), true);
  const pillar = r.kept.find((k) => !k.largest);
  assert.ok(pillar);
  assert.equal(pillar.grounded, true);
  assert.equal(pillar.size, 5);
});

test("componentStrip keepGrounded:false is the literal keep-only-largest", () => {
  const cells = [...boxCells(0, 3, 0, 2, 0, 3), ...boxCells(8, 8, 0, 4, 0, 0)];
  const r = componentStrip(occupancyFromCells(cells), { keepGrounded: false });
  assert.equal(r.strippedCells, 5);
  assert.equal(r.occ.has(8, 0, 0), false);
});

test("componentStrip single component is a no-op returning the same occupancy", () => {
  const occ = occupancyFromCells(boxCells(0, 2, 0, 2, 0, 2));
  const r = componentStrip(occ);
  assert.equal(r.occ, occ);
  assert.equal(r.components, 1);
  assert.equal(r.strippedCells, 0);
});

// ---------------------------------------------------------------- rebuildArtifact

const TEMPLATE = Object.freeze({
  schema_version: "1.0.0",
  metadata: { trial_id: "t", prompting_method_id: "m" },
  style: { name: "s", rationale: "r" },
  palette: { palette_id: "p16", manifest: ["minecraft:dirt"] },
});

test("rebuildArtifact round-trips the occupancy and recomputes a sorted manifest", () => {
  const cells = [
    { pos: [1, 0, 0], block: "minecraft:stone" },
    { pos: [0, 0, 0], block: "minecraft:oak_planks" },
    { pos: [0, 1, 0], block: "minecraft:stone" },
  ];
  const occ = occupancyFromCells(cells);
  const art = rebuildArtifact(occ, TEMPLATE);
  assert.deepEqual(art.palette, { palette_id: "p16", manifest: ["minecraft:oak_planks", "minecraft:stone"] });
  assert.equal(art.schema_version, "1.0.0");
  assert.deepEqual(art.metadata, TEMPLATE.metadata);
  assert.equal(art.placements.length, 3);
  // canonical (y,z,x) order
  assert.deepEqual(art.placements.map((p) => p.pos), [[0, 0, 0], [1, 0, 0], [0, 1, 0]]);
  const back = artifactOccupancy(art);
  assert.equal(back.size, occ.size);
  for (const [k, b] of occ.cells) assert.equal(back.cells.get(k), b);
});

test("rebuildArtifact is deterministic regardless of cell insertion order", () => {
  const cells = boxCells(0, 2, 0, 1, 0, 2, "minecraft:stone");
  const a = rebuildArtifact(occupancyFromCells(cells), TEMPLATE);
  const b = rebuildArtifact(occupancyFromCells([...cells].reverse()), TEMPLATE);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("rebuildArtifact throws on an empty occupancy", () => {
  assert.throws(() => rebuildArtifact(occupancyFromCells([]), TEMPLATE), /≥1 placement/);
});

// ---------------------------------------------------------------- openingRegions / inRegion

test("openingRegions back-projects a through-window to a world AABB spanning the depth axis", () => {
  // hollow box with matching 1×1 holes in BOTH z walls (openings() sees through-silhouette air only)
  const cells = drop(hollowBoxCells(0, 6, 0, 5, 0, 6), [3, 2, 0], [3, 2, 6]);
  const occ = occupancyFromCells(cells);
  const regions = openingRegions(occ, ["+z"]);
  assert.equal(regions.length, 1);
  assert.equal(regions[0].kind, "window");
  assert.deepEqual(regions[0].min, [3, 2, 0]);
  assert.deepEqual(regions[0].max, [3, 2, 6]);
  assert.equal(inRegion([3, 2, 3], regions), true);
  assert.equal(inRegion([4, 2, 3], regions), false);
});

// ---------------------------------------------------------------- fillVoids

const WALL_POLICY = { zoneOf: () => "wall", zones: { wall: { dominant: "stone_bricks" } } };

test("fillVoids fills a 3-deep pocket flush to its rim in the zone dominant", () => {
  // solid box; carve a 1×1×3 pocket into the +z face at (3,2)
  const cells = drop(boxCells(0, 6, 0, 4, 0, 6), [3, 2, 6], [3, 2, 5], [3, 2, 4]);
  const r = fillVoids(occupancyFromCells(cells), { ...WALL_POLICY, dirs: ["+z"] });
  assert.equal(r.filled, 3);
  assert.deepEqual(
    r.placements.map((p) => p.pos).sort((a, b) => a[2] - b[2]),
    [[3, 2, 4], [3, 2, 5], [3, 2, 6]]);
  assert.ok(r.placements.every((p) => p.block === "minecraft:stone_bricks"));
  assert.equal(r.byDir["+z"].basinCells, 1);
});

test("fillVoids keeps 1-deep facade relief at the default minDepth", () => {
  const cells = drop(boxCells(0, 6, 0, 4, 0, 6), [3, 2, 6]);
  const r = fillVoids(occupancyFromCells(cells), { ...WALL_POLICY, dirs: ["+z"] });
  assert.equal(r.filled, 0);
  assert.equal(r.byDir["+z"].basinCells, 0);
});

test("fillVoids skips a pocket inside an allow region", () => {
  const cells = drop(boxCells(0, 6, 0, 4, 0, 6), [3, 2, 6], [3, 2, 5], [3, 2, 4]);
  const regions = [{ kind: "window", dir: "+z", min: [3, 2, 0], max: [3, 2, 6] }];
  const r = fillVoids(occupancyFromCells(cells), { ...WALL_POLICY, dirs: ["+z"], regions });
  assert.equal(r.filled, 0);
  assert.equal(r.byDir["+z"].skippedAllowed, 1);
});

test("fillVoids skips cells whose zone has no policy entry", () => {
  const cells = drop(boxCells(0, 6, 0, 4, 0, 6), [3, 2, 6], [3, 2, 5], [3, 2, 4]);
  const r = fillVoids(occupancyFromCells(cells), {
    zoneOf: () => "roof", zones: { wall: { dominant: "stone_bricks" } }, dirs: ["+z"],
  });
  assert.equal(r.filled, 0);
  assert.equal(r.byDir["+z"].skippedNoZone, 3);
});

// ---------------------------------------------------------------- closureCheck

test("closureCheck: a bottomless hollow box is closed (ground-solid semantics)", () => {
  const c = closureCheck(occupancyFromCells(hollowBoxCells(0, 6, 0, 5, 0, 6)));
  assert.equal(c.closed, true);
  assert.ok(c.interiorCells > 0);
  assert.deepEqual(Object.values(c.byDirection), [0, 0, 0, 0, 0, 0]);
});

test("closureCheck: a roof hole breaches through +y with a sorted mouth list", () => {
  const cells = drop(hollowBoxCells(0, 6, 0, 5, 0, 6), [3, 5, 3]);
  const c = closureCheck(occupancyFromCells(cells));
  assert.equal(c.closed, false);
  assert.ok(c.reached > 0);
  assert.ok(c.byDirection["+y"] > 0);
  assert.deepEqual(c.mouths, [...c.mouths].sort());
});

test("closureCheck: the same hole declared as an allow region is honorary skin", () => {
  const cells = drop(hollowBoxCells(0, 6, 0, 5, 0, 6), [3, 5, 3]);
  const c = closureCheck(occupancyFromCells(cells), {
    regions: [{ kind: "window", dir: "+y", min: [3, 5, 3], max: [3, 5, 3] }],
  });
  assert.equal(c.closed, true);
});

test("closureCheck: an arch through-passage is benign (passage air is not ray-contained)", () => {
  // solid box with a 1-wide, 2-high tunnel through the full z extent at ground level
  const cells = boxCells(0, 6, 0, 4, 0, 6).filter(({ pos: [x, y] }) => !(x === 3 && y <= 1));
  const c = closureCheck(occupancyFromCells(cells));
  assert.equal(c.closed, true);
  assert.equal(c.interiorCells, 0);
});

test("closureCheck: a through-window breaches sideways; its openingRegions allow-list closes it", () => {
  const cells = drop(hollowBoxCells(0, 6, 0, 5, 0, 6), [3, 2, 0], [3, 2, 6]);
  const occ = occupancyFromCells(cells);
  const open = closureCheck(occ);
  assert.equal(open.closed, false);
  assert.ok(open.byDirection["+z"] + open.byDirection["-z"] > 0);
  const allowed = closureCheck(occ, { regions: openingRegions(occ, ["+z"]) });
  assert.equal(allowed.closed, true);
});

// ---------------------------------------------------------------- plugClosure

test("plugClosure converges on a roof-holed box, plugging in the zone dominant", () => {
  const cells = drop(hollowBoxCells(0, 6, 0, 5, 0, 6, "spruce_planks"), [3, 5, 3]);
  const r = plugClosure(occupancyFromCells(cells), {
    zoneOf: () => "roof", zones: { roof: { dominant: "spruce_planks" } },
  });
  assert.equal(r.closed, true);
  assert.ok(r.placements.length >= 1);
  assert.ok(r.iterations >= 1);
  assert.ok(r.placements.every((p) => p.block === "minecraft:spruce_planks"));
  assert.equal(closureCheck(r.occ).closed, true);
});

test("plugClosure throws at the iteration cap instead of returning unclosed", () => {
  const cells = drop(hollowBoxCells(0, 6, 0, 5, 0, 6), [3, 5, 3]);
  assert.throws(
    () => plugClosure(occupancyFromCells(cells), { ...WALL_POLICY, maxIterations: 0 }),
    /not closed after 0 iterations/);
});
