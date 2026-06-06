// Unit suite for the scoped procedural passes + geometric diagnosis (T-045-01, story S-045, epic E-15).
//
// PURE — no GL/model/network, auto-collected by `src/**/*.test.mjs`. Asserts PROPERTIES: the passes
// stay inside R (relief clamps, material never moves), purity (inputs unmutated), determinism, the
// route→editor selector, and the model-free diagnosis classification with routes in the E-11 vocabulary.

import test from "node:test";
import assert from "node:assert/strict";

import {
  TWEAK_SCHEMA,
  TWEAK_DEFAULTS,
  boxesIntersect,
  reliefPass,
  materialPass,
  scopedTweakFor,
  tweakLabel,
  proceduralDiagnose,
} from "./tweak.mjs";
import { selectRegion, applyRegionEdit, subBoundsOf } from "./region.mjs";
import { ROUTE_TARGETS } from "../sculptor/review.mjs";
import { expandPlacement } from "../expand.mjs";

function artifactWith(placements) {
  return {
    schema_version: "1.0.0",
    metadata: { trial_id: "t", prompting_method_id: "p", model_id: "m", seed: 0, server_state_id: "s" },
    style: { name: "x", rationale: "y" },
    palette: { manifest: [...new Set(placements.map((p) => p.block))].sort() },
    placements,
  };
}

// --- TA: box overlap --------------------------------------------------------

test("TA: boxesIntersect — overlap / touching faces / disjoint (inclusive)", () => {
  const a = { min: [0, 0, 0], max: [4, 4, 4] };
  assert.ok(boxesIntersect(a, { min: [2, 2, 2], max: [6, 6, 6] }), "overlap");
  assert.ok(boxesIntersect(a, { min: [4, 4, 4], max: [9, 9, 9] }), "touching corner counts");
  assert.ok(!boxesIntersect(a, { min: [5, 0, 0], max: [9, 4, 4] }), "gap on x");
  assert.ok(!boxesIntersect(a, { min: [0, 0, 5], max: [4, 4, 9] }), "gap on z");
});

// --- TB: reliefPass ---------------------------------------------------------

test("TB: reliefPass shifts Z by delta and clamps to subBounds; voxel + box forms", () => {
  const sub = { min: [0, 0, -2], max: [9, 9, 2] };
  const inR = [
    { op: "voxel", pos: [3, 4, 0], block: "minecraft:stone" },
    { op: "fill", from: [0, 0, -1], to: [2, 2, 1], block: "minecraft:stone" },
  ];
  const out = reliefPass(inR, sub, { delta: 1 });
  assert.deepEqual(out[0].pos, [3, 4, 1]); // 0 -> 1
  assert.deepEqual([out[1].from, out[1].to], [[0, 0, 0], [2, 2, 2]]); // -1->0, 1->2
});

test("TB: reliefPass clamps at the Z face — a voxel at max.z shifted +1 stays put", () => {
  const sub = { min: [0, 0, 0], max: [4, 4, 3] };
  const out = reliefPass([{ op: "voxel", pos: [0, 0, 3], block: "minecraft:stone" }], sub, { delta: 1 });
  assert.deepEqual(out[0].pos, [0, 0, 3]); // clamped — no escape
});

test("TB: reliefPass output is in-region (lock never throws) and PURE", () => {
  const art = artifactWith([
    { op: "fill", from: [0, 0, 0], to: [3, 3, 2], block: "minecraft:stone" },
    { op: "voxel", pos: [20, 0, 0], block: "minecraft:black_concrete" },
  ]);
  const R = selectRegion(art, { bbox: { min: [0, 0, 0], max: [3, 3, 2] } });
  const snap = JSON.stringify(art);
  const edited = applyRegionEdit(art, R, (inR) => reliefPass(inR, subBoundsOf(R), { delta: 5 }));
  // every edited voxel still inside subBounds (clamped)
  for (const p of edited.placements) {
    for (const v of expandPlacement(p)) {
      assert.ok(v.pos[2] <= subBoundsOf(R).max[2], "z within R");
    }
  }
  assert.equal(JSON.stringify(art), snap, "input artifact unmutated");
});

// --- TC: materialPass -------------------------------------------------------

test("TC: materialPass remaps block but every coordinate is byte-identical", () => {
  const inR = [
    { op: "voxel", pos: [1, 2, 3], block: "minecraft:stone" },
    { op: "box", from: [0, 0, 0], to: [5, 5, 5], block: "minecraft:stone" },
  ];
  const out = materialPass(inR, { block: "minecraft:gold_block" });
  assert.deepEqual(out[0].pos, [1, 2, 3]);
  assert.deepEqual([out[1].from, out[1].to], [[0, 0, 0], [5, 5, 5]]);
  assert.ok(out.every((p) => p.block === "minecraft:gold_block"));
});

// --- TD: scopedTweakFor selector -------------------------------------------

test("TD: scopedTweakFor routes relief/material/no-op; attempt steps the parameter", () => {
  const sub = { min: [0, 0, -3], max: [4, 4, 3] };
  const inR = [{ op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" }];
  // relief alternates +1, -1, +2 ...
  assert.deepEqual(scopedTweakFor("relief", 0)(inR, sub)[0].pos, [0, 0, 1]);
  assert.deepEqual(scopedTweakFor("relief", 1)(inR, sub)[0].pos, [0, 0, -1]);
  assert.deepEqual(scopedTweakFor("relief", 2)(inR, sub)[0].pos, [0, 0, 2]);
  // material steps through the default block list
  assert.equal(scopedTweakFor("material", 0)(inR, sub)[0].block, TWEAK_DEFAULTS.materialBlocks[0]);
  assert.equal(scopedTweakFor("material", 1)(inR, sub)[0].block, TWEAK_DEFAULTS.materialBlocks[1]);
  // unknown route -> identity (returns the same set)
  assert.equal(scopedTweakFor("curve", 0)(inR, sub), inR);
  assert.equal(scopedTweakFor("detail", 3)(inR, sub), inR);
});

test("TD: tweakLabel is a stable readable string", () => {
  assert.equal(tweakLabel("relief", 0), "relief+1");
  assert.equal(tweakLabel("relief", 1), "relief-1");
  assert.equal(tweakLabel("material", 2), "material#2");
  assert.equal(tweakLabel("curve", 0), "noop");
});

// --- TE: proceduralDiagnose -------------------------------------------------

test("TE: proceduralDiagnose — flat depth → relief; uniform varied-depth → material; mixed → clean", () => {
  // flat in Z (all z=0), one block -> zero Z-variance wins first -> relief
  const flat = artifactWith([
    { op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" },
    { op: "voxel", pos: [1, 0, 0], block: "minecraft:stone" },
  ]);
  const Rflat = selectRegion(flat, { bbox: { min: [0, 0, 0], max: [1, 0, 0] } });
  assert.deepEqual(proceduralDiagnose(flat, Rflat), [{ defect: "flat", where: JSON.stringify(Rflat.spec), route: "relief" }]);

  // varied depth but a single uniform block -> material
  const uniform = artifactWith([
    { op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" },
    { op: "voxel", pos: [1, 0, 2], block: "minecraft:stone" },
  ]);
  const Runi = selectRegion(uniform, { bbox: { min: [0, 0, 0], max: [1, 0, 2] } });
  assert.equal(proceduralDiagnose(uniform, Runi)[0].route, "material");

  // varied depth AND varied block -> clean (nothing to route)
  const mixed = artifactWith([
    { op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" },
    { op: "voxel", pos: [1, 0, 2], block: "minecraft:gold_block" },
  ]);
  const Rmix = selectRegion(mixed, { bbox: { min: [0, 0, 0], max: [1, 0, 2] } });
  assert.deepEqual(proceduralDiagnose(mixed, Rmix), []);
});

test("TE: every emitted route is a valid E-11 ROUTE_TARGET", () => {
  const flat = artifactWith([{ op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" }]);
  const R = selectRegion(flat, { bbox: { min: [0, 0, 0], max: [0, 0, 0] } });
  for (const d of proceduralDiagnose(flat, R)) assert.ok(ROUTE_TARGETS.includes(d.route));
});

test("TE: TWEAK_SCHEMA is tagged", () => assert.equal(TWEAK_SCHEMA, "revise-tweak/v1"));
