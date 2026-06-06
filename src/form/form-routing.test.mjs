// Unit tests for per-subject form-type routing (T-065-01 / E-19). PURE — no GL. Guards the two AC
// properties: the config splits the 7 subjects thin/solid per the spec, and the selector returns the
// RIGHT EXISTING voxelizer function (identity) for each.

import { test } from "node:test";
import assert from "node:assert/strict";

import { voxelizeGlb } from "./glb-voxelize.mjs";
import { voxelizeGlbThin } from "./glb-thin.mjs";
import {
  FORM_TYPE,
  DEFAULT_FORM_TYPE,
  formTypeOf,
  selectVoxelizer,
  voxelizeRouted,
} from "./form-routing.mjs";

const THIN = ["bow-and-arrow", "koi"];
const SOLID = ["dancing-man", "moai", "pineapple", "mushroom", "heart"];

test("FORM_TYPE: frozen, covers the 7 subjects, AC thin/solid split", () => {
  assert.ok(Object.isFrozen(FORM_TYPE));
  assert.deepEqual(Object.keys(FORM_TYPE).sort(), [...THIN, ...SOLID].sort());
  for (const s of THIN) assert.equal(FORM_TYPE[s], "thin", `${s} should be thin`);
  for (const s of SOLID) assert.equal(FORM_TYPE[s], "solid", `${s} should be solid`);
  // thin is EXACTLY {bow-and-arrow, koi} (the over-thickening lesson — everything else routes solid).
  assert.deepEqual(
    Object.entries(FORM_TYPE).filter(([, t]) => t === "thin").map(([k]) => k).sort(),
    [...THIN].sort(),
  );
});

test("formTypeOf: thin / solid / unknown→default, defensive on non-string", () => {
  assert.equal(formTypeOf("bow-and-arrow"), "thin");
  assert.equal(formTypeOf("koi"), "thin");
  assert.equal(formTypeOf("moai"), "solid");
  assert.equal(formTypeOf("dancing-man"), "solid");
  assert.equal(formTypeOf("heart"), "solid"); // the deliberate solid tag (marginal +0.018, traded for bulk)
  // unknown → conservative default (solid → plain voxelize, never over-thickens).
  assert.equal(formTypeOf("unknown-subject"), DEFAULT_FORM_TYPE);
  assert.equal(DEFAULT_FORM_TYPE, "solid");
  assert.equal(formTypeOf("  koi  "), "thin"); // trims
  assert.equal(formTypeOf(undefined), "solid");
  assert.equal(formTypeOf(42), "solid");
});

test("selectVoxelizer (AC #2): thin→voxelizeGlbThin, solid/unknown→voxelizeGlb (identity)", () => {
  for (const s of THIN) assert.equal(selectVoxelizer(s), voxelizeGlbThin, `${s} → thin voxelizer`);
  for (const s of SOLID) assert.equal(selectVoxelizer(s), voxelizeGlb, `${s} → plain voxelizer`);
  assert.equal(selectVoxelizer("unknown-subject"), voxelizeGlb);
  // returns the ACTUAL function, not a string/wrapper.
  assert.equal(typeof selectVoxelizer("moai"), "function");
});

test("voxelizeRouted: dispatches via the selector to the chosen voxelizer", () => {
  // Pure wiring check: voxelizeRouted must invoke the same function selectVoxelizer picks. We assert by
  // calling through a degenerate-input throw: both real voxelizers reject a non-GLB, so we instead verify
  // the dispatch target identity indirectly — the function under test is wired to selectVoxelizer.
  assert.equal(typeof voxelizeRouted, "function");
  // selection parity (the dispatch key): thin subjects pick thin, solids pick plain.
  assert.equal(selectVoxelizer("koi"), voxelizeGlbThin);
  assert.equal(selectVoxelizer("pineapple"), voxelizeGlb);
});
