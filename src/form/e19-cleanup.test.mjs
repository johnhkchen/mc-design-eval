// Unit tests for the E-19 cleanup consolidation assembler (T-066-01 / E-19). PURE — no GL, no I/O.
// Guards: delta = E-19 − busy per axis; direction-aware axis classification (improved/held/regressed);
// null tolerance (a skipped subject never crashes the report); the headline verdict logic; and the markdown
// shape (header + one row per subject + a totals row + `—` for null cells).

import { test } from "node:test";
import assert from "node:assert/strict";

import { E19_CLEANUP_SCHEMA, AXES, cleanupRow, assembleCleanup } from "./e19-cleanup.mjs";

const cell = (o) => ({ formIoU: 0, speckle: 0, largestFraction: 1, strayCount: 0, distinct: 5, offPalette: 0, valueDeltaE: 0, ...o });

test("AXES: the seven metric axes with improvement direction", () => {
  assert.deepEqual(Object.keys(AXES).sort(), ["distinct", "formIoU", "largestFraction", "offPalette", "speckle", "strayCount", "valueDeltaE"]);
  assert.equal(AXES.formIoU, "up");
  assert.equal(AXES.largestFraction, "up");
  assert.equal(AXES.speckle, "down");
  assert.equal(AXES.offPalette, "down");
});

test("cleanupRow: delta = e19 − busy per axis", () => {
  const r = cleanupRow({
    subject: "moai",
    busy: cell({ speckle: 0.2, strayCount: 2023, offPalette: 4096, formIoU: 0.565 }),
    intermediate: cell({ speckle: 0.05, strayCount: 0, offPalette: 0, formIoU: 0.4 }),
    e19: cell({ speckle: 0.01, strayCount: 0, offPalette: 0, formIoU: 0.42 }),
  });
  assert.equal(r.subject, "moai");
  assert.equal(r.delta.speckle, -0.19);
  assert.equal(r.delta.strayCount, -2023);
  assert.equal(r.delta.offPalette, -4096);
  assert.equal(r.delta.formIoU, -0.145);
});

test("cleanupRow: a null operand → null delta; missing column tolerated", () => {
  const r = cleanupRow({ subject: "x", busy: { valueDeltaE: 4 }, e19: { speckle: 0.01 } });
  assert.equal(r.delta.valueDeltaE, null); // e19.valueDeltaE absent → null
  assert.equal(r.delta.speckle, null); // busy.speckle absent → null
});

test("cleanupRow: present-on-both axis computes, absent-on-one is null", () => {
  const r = cleanupRow({ subject: "x", busy: { speckle: 0.2, distinct: 7 }, e19: { speckle: 0.02 } });
  assert.equal(r.delta.speckle, -0.18);
  assert.equal(r.delta.distinct, null); // e19.distinct absent
  assert.equal(r.delta.formIoU, null); // absent on both
});

test("assembleCleanup: schema, scale, subject count, averages", () => {
  const { json } = assembleCleanup({
    scale: 32,
    rows: [
      { subject: "a", busy: cell({ speckle: 0.2 }), intermediate: cell({ speckle: 0.05 }), e19: cell({ speckle: 0.01 }) },
      { subject: "b", busy: cell({ speckle: 0.3 }), intermediate: cell({ speckle: 0.04 }), e19: cell({ speckle: 0.03 }) },
    ],
  });
  assert.equal(json.schema, E19_CLEANUP_SCHEMA);
  assert.equal(json.scale, 32);
  assert.equal(json.subjects.length, 2);
  assert.equal(json.averages.busy.speckle, 0.25);
  assert.equal(json.averages.e19.speckle, 0.02);
});

test("assembleCleanup: direction-aware axis classification", () => {
  const { json } = assembleCleanup({
    rows: [
      // speckle (down=better): improves
      { subject: "improve", busy: cell({ speckle: 0.3, formIoU: 0.5 }), e19: cell({ speckle: 0.02, formIoU: 0.7 }) },
      // formIoU (up=better) regresses; speckle held
      { subject: "regress", busy: cell({ speckle: 0.05, formIoU: 0.9 }), e19: cell({ speckle: 0.05, formIoU: 0.6 }) },
    ],
  });
  // speckle: one improved, one held
  assert.deepEqual(json.axes.speckle.improved, ["improve"]);
  assert.deepEqual(json.axes.speckle.held, ["regress"]);
  assert.equal(json.axes.speckle.regressed.length, 0);
  // formIoU: one improved (improve +0.2), one regressed (regress -0.3)
  assert.deepEqual(json.axes.formIoU.improved, ["improve"]);
  assert.deepEqual(json.axes.formIoU.regressed, ["regress"]);
});

test("assembleCleanup: headline — clean when off-palette 0 and speckle ≤ 0.05", () => {
  const clean = assembleCleanup({
    rows: [
      { subject: "a", busy: cell({ speckle: 0.2, offPalette: 4096 }), e19: cell({ speckle: 0.02, offPalette: 0 }) },
      { subject: "b", busy: cell({ speckle: 0.3, offPalette: 1000 }), e19: cell({ speckle: 0.03, offPalette: 0 }) },
    ],
  }).json;
  assert.equal(clean.headline.cleanAsTextJson, true);
  assert.equal(clean.headline.offPaletteMax, 0);

  const dirty = assembleCleanup({
    rows: [{ subject: "a", busy: cell({}), e19: cell({ speckle: 0.02, offPalette: 3 }) }],
  }).json;
  assert.equal(dirty.headline.cleanAsTextJson, false); // off-palette > 0
  assert.equal(dirty.headline.offPaletteMax, 3);

  const speckled = assembleCleanup({
    rows: [{ subject: "a", busy: cell({}), e19: cell({ speckle: 0.12, offPalette: 0 }) }],
  }).json;
  assert.equal(speckled.headline.cleanAsTextJson, false); // speckle > 0.05
});

test("assembleCleanup: marginals passed through into json and md", () => {
  const { json, md } = assembleCleanup({
    rows: [{ subject: "a", busy: cell({}), e19: cell({}) }],
    marginals: { prune: "moai 2023→0 stray", materials: "off-pal →0", routing: "form +0.05" },
  });
  assert.equal(json.marginals.prune, "moai 2023→0 stray");
  assert.ok(md.includes("Stray pruning (T-063)"));
  assert.ok(md.includes("Clean materials (T-064)"));
  assert.ok(md.includes("Thin routing (T-065)"));
});

test("assembleCleanup: markdown shape — header, per-subject rows, totals, `—` for null", () => {
  const { md } = assembleCleanup({
    scale: 32,
    rows: [
      { subject: "a", busy: cell({ speckle: 0.2 }), intermediate: cell({ speckle: 0.05 }), e19: cell({ speckle: 0.01 }) },
      { subject: "nulls", busy: { speckle: 0.2 }, e19: { speckle: 0.02 } }, // most axes null
    ],
  });
  assert.ok(md.includes("# E-19 voxel cleanup"));
  assert.ok(md.includes("| subject | form IoU | speckle |"));
  assert.ok(md.includes("| a |"));
  assert.ok(md.includes("| nulls |"));
  assert.ok(md.includes("**AVERAGE**"));
  assert.ok(md.includes("—")); // a null cell rendered
  assert.ok(md.includes("Headline"));
});

test("assembleCleanup: empty rows → valid empty report, never throws", () => {
  const { json, md } = assembleCleanup({ rows: [] });
  assert.equal(json.subjects.length, 0);
  assert.equal(json.averages.e19.speckle, null);
  assert.equal(json.headline.cleanAsTextJson, false); // no speckle avg
  assert.ok(md.includes("# E-19 voxel cleanup"));
});

test("assembleCleanup: non-array rows throws", () => {
  assert.throws(() => assembleCleanup({ rows: "nope" }), /rows must be an array/);
});
