// Tests for the roof-patch detector pure core (T-082-01). Synthetic roofRegion — no GL, no model.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TIER,
  ROOF_PATCH_SCHEMA,
  ISSUES,
  roofCandidates,
  buildRoofPatchPrompt,
  parseRoofPatch,
} from "./roof-patch.mjs";

// 3×3 roof: 8 stone_bricks + 1 stray cobblestone; coverage 0.889 over area 9 ⇒ 1 hole.
const roofRegion = {
  cells: [
    { x: 0, z: 0, y: 5, block: "minecraft:stone_bricks" },
    { x: 1, z: 0, y: 5, block: "minecraft:stone_bricks" },
    { x: 2, z: 0, y: 5, block: "stone_bricks" },
    { x: 0, z: 1, y: 5, block: "stone_bricks" },
    { x: 1, z: 1, y: 5, block: "minecraft:cobblestone" }, // the stray
    { x: 2, z: 1, y: 5, block: "stone_bricks" },
    { x: 0, z: 2, y: 5, block: "stone_bricks" },
    { x: 1, z: 2, y: 5, block: "stone_bricks" },
    { x: 2, z: 2, y: 5, block: "stone_bricks" },
  ],
  coverage: 0.889,
  area: 9,
};

test("TIER is light", () => assert.equal(TIER, "light"));

test("roofCandidates finds the dominant block, the lone stray, and the hole count", () => {
  const c = roofCandidates(roofRegion);
  assert.equal(c.dominant, "stone_bricks");
  assert.equal(c.stray.length, 1);
  assert.deepEqual(c.stray[0], { x: 1, z: 1, block: "cobblestone" }); // minecraft: stripped
  assert.equal(c.holeCount, 1); // round(9 * (1 - 0.889)) = round(0.999) = 1
});

test("roofCandidates is empty-safe", () => {
  const c = roofCandidates({ cells: [], coverage: 0, area: 0 });
  assert.equal(c.dominant, null);
  assert.deepEqual(c.stray, []);
  assert.equal(c.holeCount, 0);
});

test("buildRoofPatchPrompt names the dominant block, the stray, and asks for JSON", () => {
  const p = buildRoofPatchPrompt(roofRegion, roofCandidates(roofRegion));
  assert.match(p, /stone_bricks/);
  assert.match(p, /\(1,1\) is cobblestone/);
  assert.match(p, /JSON/);
  assert.match(p, /"patches"/);
});

test("parseRoofPatch reads a clean object", () => {
  const r = parseRoofPatch('{"patches":[{"x":1,"z":1,"issue":"stray-material","note":"cobble"}]}');
  assert.equal(r.schema, ROOF_PATCH_SCHEMA);
  assert.equal(r.patches.length, 1);
  assert.deepEqual(r.patches[0], { x: 1, z: 1, issue: "stray-material", note: "cobble" });
});

test("parseRoofPatch tolerates code fences and prose around the object", () => {
  const fenced = '```json\n{"patches":[{"x":0,"z":0,"issue":"hole"}]}\n```';
  const r1 = parseRoofPatch(fenced);
  assert.equal(r1.patches.length, 1);
  assert.equal(r1.patches[0].note, ""); // missing note defaults to ""
  const prose = 'Here you go: {"patches":[{"x":2,"z":2,"issue":"wrong-tone","note":"dark"}]} done';
  assert.equal(parseRoofPatch(prose).patches.length, 1);
});

test("parseRoofPatch drops malformed rows (bad issue / non-int coords)", () => {
  const r = parseRoofPatch(
    '{"patches":[{"x":1,"z":1,"issue":"explode"},{"x":"a","z":2,"issue":"hole"},{"x":3,"z":3,"issue":"hole"}]}',
  );
  assert.equal(r.patches.length, 1);
  assert.equal(r.patches[0].x, 3);
});

test("parseRoofPatch yields empty patches for an empty list and throws on non-JSON", () => {
  assert.deepEqual(parseRoofPatch('{"patches":[]}').patches, []);
  assert.throws(() => parseRoofPatch("not json at all"), /not JSON/);
});

test("ISSUES is the closed vocabulary", () => {
  assert.deepEqual([...ISSUES], ["stray-material", "hole", "wrong-tone"]);
});
