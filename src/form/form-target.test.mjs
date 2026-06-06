// Tests for the per-region form-target seam (T-047-01, story S-047, epic E-15).
//
// PURE — no GL, no model, no PNG decode: the concept target's metric is injected via `_fidelity`, so the
// whole interface (delegation, region selection, the GLB adapter point, resolve defaulting, swap-invariance)
// is exercised without touching the render or form stacks. This is the AC #1 proof that swapping the form
// target needs no change to the loop's observe/diagnose/accept seams.
//   A concept target      — kind, whole-iou vs region-iou selection, opts pass-through to the metric
//   B GLB adapter point    — throws FormTargetNotImplementedError with the documented note
//   C resolveFormTarget    — pass-through, concept default, throw-when-neither
//   D swap-invariance      — a custom duck-typed target flows through resolve + scoreRender unchanged
//   E schema tag           — stable version string

import test from "node:test";
import assert from "node:assert/strict";

import {
  FORM_TARGET_SCHEMA,
  FormTargetNotImplementedError,
  conceptFormTarget,
  glbFormTarget,
  resolveFormTarget,
} from "./form-target.mjs";

// A fake metric: records the call and returns fixed whole + region IoUs.
function fakeFidelity(returns = { iou: 0.5, regionIoU: 0.7 }) {
  const calls = [];
  const fn = async (renderPath, conceptPath, opts) => {
    calls.push({ renderPath, conceptPath, opts });
    return { schema: "form-fidelity/v1", ...returns };
  };
  fn.calls = calls;
  return fn;
}

test("A. conceptFormTarget: kind + whole-object IoU by default", async () => {
  const _fidelity = fakeFidelity();
  const t = conceptFormTarget({ conceptPath: "/x/concept.png", _fidelity });
  assert.equal(t.kind, "concept");
  assert.equal(t.conceptPath, "/x/concept.png");
  const score = await t.scoreRender("/x/render.png", { subBounds: { min: [0, 0, 0], max: [1, 1, 1] } });
  assert.equal(score, 0.5, "no region → whole-object iou");
  assert.equal(_fidelity.calls.length, 1);
  assert.equal(_fidelity.calls[0].renderPath, "/x/render.png");
  assert.equal(_fidelity.calls[0].conceptPath, "/x/concept.png");
});

test("A. conceptFormTarget: region → regionIoU, and grid/fit/region forwarded", async () => {
  const _fidelity = fakeFidelity();
  const region = { x0: 0.1, y0: 0.1, x1: 0.9, y1: 0.9 };
  const t = conceptFormTarget({ conceptPath: "/c.png", grid: 64, fit: "stretch", region, _fidelity });
  const score = await t.scoreRender("/r.png", {});
  assert.equal(score, 0.7, "region given → regionIoU");
  const opts = _fidelity.calls[0].opts;
  assert.equal(opts.grid, 64);
  assert.equal(opts.fit, "stretch");
  assert.deepEqual(opts.region, region);
});

test("A. conceptFormTarget: conceptPath is required", () => {
  assert.throws(() => conceptFormTarget({}), /conceptPath/);
  assert.throws(() => conceptFormTarget(), /conceptPath/);
});

test("B. glbFormTarget: the documented adapter point throws (seam only this phase)", () => {
  assert.throws(
    () => glbFormTarget({ glbPath: "/mesh.glb" }),
    (err) => {
      assert.ok(err instanceof FormTargetNotImplementedError, "is FormTargetNotImplementedError");
      assert.match(err.message, /GLB/, "names GLB");
      assert.match(err.message, /defer/i, "states it is deferred");
      assert.match(err.message, /observe\/diagnose\/accept/, "states the seams are unchanged");
      return true;
    },
  );
});

test("C. resolveFormTarget: returns an injected formTarget unchanged", () => {
  const custom = { kind: "fake", scoreRender: async () => 0.42 };
  assert.equal(resolveFormTarget({ formTarget: custom }), custom);
});

test("C. resolveFormTarget: builds a concept target from conceptPath", () => {
  const t = resolveFormTarget({ conceptPath: "/c.png" });
  assert.equal(t.kind, "concept");
  assert.equal(t.conceptPath, "/c.png");
});

test("C. resolveFormTarget: throws when neither formTarget nor conceptPath is given", () => {
  assert.throws(() => resolveFormTarget({}), /no form target/);
  assert.throws(() => resolveFormTarget(), /no form target/);
});

test("D. swap-invariance: a non-concept target flows through resolve + scoreRender with no other change", async () => {
  let seen = null;
  const fake = {
    kind: "fake",
    scoreRender: async (renderPath, R) => {
      seen = { renderPath, R };
      return 0.9;
    },
  };
  const target = resolveFormTarget({ formTarget: fake });
  const score = await target.scoreRender("/r.png", { tag: "R" });
  assert.equal(score, 0.9);
  assert.deepEqual(seen, { renderPath: "/r.png", R: { tag: "R" } });
});

test("E. FORM_TARGET_SCHEMA is the stable v1 tag", () => {
  assert.equal(FORM_TARGET_SCHEMA, "form-target/v1");
});
