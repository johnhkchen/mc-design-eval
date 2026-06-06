// Tests for the hollowable-mass detector pure core (T-082-01). Synthetic occupancy — no GL, no model.

import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "./occupancy.mjs";
import {
  TIER,
  HOLLOWABLE_SCHEMA,
  SEAL_BEFORE_HOLLOW,
  hollowableCore,
  buildHollowablePrompt,
  parseHollowable,
} from "./hollowable-mass.mjs";
import { footprint, storeyBands } from "./structural-read.mjs";

const cube = () => {
  const cells = [];
  for (let x = 0; x < 3; x++)
    for (let y = 0; y < 3; y++)
      for (let z = 0; z < 3; z++) cells.push({ pos: [x, y, z], block: "stone" });
  return occupancyFromCells(cells); // 27 voxels, exactly one enclosed (the centre)
};

// A flat 3×3 wall in the x-y plane (z=0) with the centre cell removed → an enclosed-air HOLE on the ±z faces.
const holedWall = () => {
  const cells = [];
  for (let x = 0; x < 3; x++)
    for (let y = 0; y < 3; y++) {
      if (x === 1 && y === 1) continue;
      cells.push({ pos: [x, y, 0], block: "stone" });
    }
  return occupancyFromCells(cells);
};

test("TIER is light and the seal-before-hollow invariant is recorded", () => {
  assert.equal(TIER, "light");
  assert.match(SEAL_BEFORE_HOLLOW, /seal-before-hollow/);
});

test("hollowableCore counts the single enclosed voxel of a solid cube, no skin holes", () => {
  const core = hollowableCore(cube());
  assert.equal(core.enclosed, 1);
  assert.equal(core.skinHoles, 0);
  // grouped into the cube's single band, with the enclosed voxel attributed to it
  assert.equal(core.perBand.reduce((n, b) => n + b.enclosed, 0), 1);
});

test("hollowableCore flags a skin hole as a blocker source", () => {
  const core = hollowableCore(holedWall());
  assert.equal(core.enclosed, 0); // a flat plane has no fully-enclosed voxel
  assert.ok(core.skinHoles >= 1, `expected a skin hole, got ${core.skinHoles}`);
});

test("hollowableCore is empty-safe", () => {
  const core = hollowableCore(occupancyFromCells([]));
  assert.deepEqual(core, { enclosed: 0, perBand: [], skinHoles: 0 });
});

test("buildHollowablePrompt names the footprint, blockers, and asks for JSON", () => {
  const occ = cube();
  const read = { footprint: footprint(occ), storeyBands: storeyBands(occ) };
  const p = buildHollowablePrompt(read, hollowableCore(occ));
  assert.match(p, /Footprint: 3×3/);
  assert.match(p, /blockers/);
  assert.match(p, /JSON/);
  assert.match(p, /watertight/i);
});

test("parseHollowable reads a clean object", () => {
  const r = parseHollowable(
    '{"hollowable":true,"regions":[{"yStart":1,"yEnd":3,"inset":1,"note":"core"}],"blockers":[]}',
  );
  assert.equal(r.schema, HOLLOWABLE_SCHEMA);
  assert.equal(r.hollowable, true);
  assert.equal(r.regions.length, 1);
  assert.deepEqual(r.regions[0], { yStart: 1, yEnd: 3, inset: 1, note: "core" });
  assert.deepEqual(r.blockers, []);
});

test("parseHollowable defaults inset/blockers and coerces hollowable", () => {
  const r = parseHollowable('{"regions":[{"yStart":0,"yEnd":2}]}');
  assert.equal(r.hollowable, false);
  assert.equal(r.regions[0].inset, 1);
  assert.deepEqual(r.blockers, []);
});

test("parseHollowable keeps non-empty blocker strings and drops malformed regions", () => {
  const r = parseHollowable(
    '```json\n{"hollowable":false,"regions":[{"yStart":"a","yEnd":2}],"blockers":["skin hole on +z",""]}\n```',
  );
  assert.equal(r.regions.length, 0);
  assert.deepEqual(r.blockers, ["skin hole on +z"]);
});

test("parseHollowable throws on non-JSON", () => {
  assert.throws(() => parseHollowable("nope"), /not JSON/);
});
