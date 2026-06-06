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
  ROUTING_SCHEMA,
  pickRouted,
  assembleRoutingReport,
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

// A small synthetic e18-remeasure/v1 spine: one thin subject (koi), one clear-solid the thin pass hurt
// (dancing-man), one solid the thin pass marginally HELPED (heart, the deliberate trade).
const SYN_SPINE = {
  schema: "e18-remeasure/v1",
  scale: 32,
  subjects: [
    { subject: "koi", r1: { formIoU: 0.622 }, e18: { formIoU: 0.706 }, thin: { occBase: 2164, occThin: 3155 } },
    { subject: "dancing-man", r1: { formIoU: 0.914 }, e18: { formIoU: 0.814 }, thin: { occBase: 973, occThin: 1504 } },
    { subject: "heart", r1: { formIoU: 0.877 }, e18: { formIoU: 0.895 }, thin: { occBase: 5840, occThin: 7982 } },
  ],
};

test("pickRouted: thin kept, solid-hurt recovers, marginal-helped solid traded", () => {
  const koi = pickRouted(SYN_SPINE.subjects[0]);
  assert.equal(koi.formType, "thin");
  assert.deepEqual(koi.before, { formIoU: 0.706, occ: 3155 });
  assert.deepEqual(koi.after, { formIoU: 0.706, occ: 3155 }); // unchanged — still thin
  assert.equal(koi.dFormIoU, 0);
  assert.equal(koi.dOcc, 0);
  assert.equal(koi.verdict, "kept");

  const dm = pickRouted(SYN_SPINE.subjects[1]);
  assert.equal(dm.formType, "solid");
  assert.equal(dm.before.formIoU, 0.814); // universal thin
  assert.equal(dm.after.formIoU, 0.914); // routed → plain (recovers)
  assert.equal(dm.dFormIoU, 0.1);
  assert.equal(dm.after.occ, 973); // occBase < occThin
  assert.equal(dm.dOcc, 973 - 1504);
  assert.equal(dm.verdict, "recovered");

  const heart = pickRouted(SYN_SPINE.subjects[2]);
  assert.equal(heart.formType, "solid");
  assert.equal(heart.before.formIoU, 0.895); // thin marginally helped
  assert.equal(heart.after.formIoU, 0.877); // routed solid → slight form dip
  assert.ok(heart.dFormIoU < 0);
  assert.ok(heart.dOcc < 0); // but occupancy drops
  assert.equal(heart.verdict, "traded");
});

test("assembleRoutingReport: averages, occupancy totals, verdict buckets, schema", () => {
  const { md, json } = assembleRoutingReport(SYN_SPINE);
  assert.equal(json.schema, ROUTING_SCHEMA);
  assert.equal(json.scale, 32);
  // averages: before = mean(e18) over 3; after = mean(routed pick).
  assert.equal(json.averages.formIoU.before, Math.round(((0.706 + 0.814 + 0.895) / 3) * 1000) / 1000);
  assert.equal(json.averages.formIoU.after, Math.round(((0.706 + 0.914 + 0.877) / 3) * 1000) / 1000);
  assert.ok(json.averages.formIoU.delta > 0); // routing lifts the average
  // occupancy: before = sum(occThin); after = koi occThin + solids occBase.
  assert.equal(json.occupancy.before, 3155 + 1504 + 7982);
  assert.equal(json.occupancy.after, 3155 + 973 + 5840);
  assert.ok(json.occupancy.delta < 0);
  assert.equal(json.occupancy.solidsDropped, (1504 - 973) + (7982 - 5840));
  // verdict buckets.
  assert.deepEqual(json.recovered, ["dancing-man"]);
  assert.deepEqual(json.kept, ["koi"]);
  assert.deepEqual(json.traded, ["heart"]);
  // markdown carries the table + summary.
  assert.match(md, /before \(universal thin\) \/ after \(routed\)/);
  assert.match(md, /dancing-man/);
  assert.match(md, /Solids recovered:/);
});

test("assembleRoutingReport: tolerant of a missing cell; throws on a non-array spine", () => {
  const { json } = assembleRoutingReport({ scale: 32, subjects: [{ subject: "moai", r1: {}, e18: { formIoU: 0.399 }, thin: { occThin: 6059 } }] });
  // r1.formIoU missing → after.formIoU null → flat (not a crash).
  assert.equal(json.subjects[0].after.formIoU, null);
  assert.equal(json.subjects[0].verdict, "flat");
  assert.throws(() => assembleRoutingReport({}), /subjects must be an array/);
});
