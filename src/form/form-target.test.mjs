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
  conceptFormTarget,
  glbFormTarget,
  mapVoxelRegionToMesh,
  glbSilhouetteScore,
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

// A tiny solid-rectangle RGBA image on a sky-blue (RENDER_BG) background — decodes to a known silhouette.
function solidRectImage(w, h, rx0, ry0, rx1, ry1) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const fg = x >= rx0 && x < rx1 && y >= ry0 && y < ry1;
      data[i] = fg ? 20 : 173; // sky bg #ADD8E6
      data[i + 1] = fg ? 20 : 216;
      data[i + 2] = fg ? 20 : 230;
      data[i + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

// An extractSilhouette-shaped mask with a single foreground rectangle.
function rectMask(w, h, rx0, ry0, rx1, ry1) {
  const data = new Uint8Array(w * h);
  for (let y = ry0; y < ry1; y++) for (let x = rx0; x < rx1; x++) data[y * w + x] = 1;
  let fgCount = 0;
  for (let i = 0; i < data.length; i++) if (data[i]) fgCount++;
  return { w, h, data, fgCount, bbox: { x0: rx0, y0: ry0, x1: rx1, y1: ry1 } };
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

test("F. mapVoxelRegionToMesh: identity bounds → region passes through", () => {
  const b = { min: [0, 0, 0], max: [10, 10, 10] };
  const r = { min: [2, 3, 4], max: [6, 7, 8] };
  const out = mapVoxelRegionToMesh(r, b, b);
  assert.deepEqual(out.min, [2, 3, 4]);
  assert.deepEqual(out.max, [6, 7, 8]);
});

test("F. mapVoxelRegionToMesh: front-lower-third voxel box → same relative third of an asymmetric mesh", () => {
  // build AABB [0,30] on x; mesh AABB [-3,3] on x (span 6, origin -3). A voxel region x∈[0,10] (first third)
  // → mesh x ∈ [-3, -1].
  const build = { min: [0, 0, 0], max: [30, 30, 30] };
  const mesh = { min: [-3, -3, -3], max: [3, 3, 3] };
  const out = mapVoxelRegionToMesh({ min: [0, 0, 0], max: [10, 10, 10] }, build, mesh);
  assert.deepEqual(out.min, [-3, -3, -3]);
  assert.deepEqual(out.max, [-1, -1, -1]); // first third of [-3,3] = [-3,-1]
});

test("F. mapVoxelRegionToMesh: degenerate build axis → full mesh span, no NaN", () => {
  const build = { min: [5, 0, 0], max: [5, 10, 10] }; // x span = 0
  const mesh = { min: [-2, -2, -2], max: [2, 2, 2] };
  const out = mapVoxelRegionToMesh({ min: [5, 1, 1], max: [5, 2, 2] }, build, mesh);
  assert.equal(out.min[0], -2, "degenerate axis spans full mesh min");
  assert.equal(out.max[0], 2, "degenerate axis spans full mesh max");
  assert.ok(!Number.isNaN(out.min[0]) && !Number.isNaN(out.max[0]));
});

test("F. glbSilhouetteScore: identical target & render silhouettes → 1.0", () => {
  const renderImg = solidRectImage(16, 16, 4, 4, 12, 12);
  const targetMask = rectMask(16, 16, 4, 4, 12, 12); // same shape
  const s = glbSilhouetteScore({ targetMask, renderImg, grid: 16 });
  assert.equal(s, 1, "same silhouette (after bbox-crop+normalize) → perfect IoU");
});

test("F. glbSilhouetteScore: disjoint after normalization → < 1 (proportion mismatch)", () => {
  // render is a tall thin bar; target is a wide flat bar — different proportion → < 1 under fit:aspect.
  const renderImg = solidRectImage(16, 16, 7, 2, 9, 14); // tall
  const targetMask = rectMask(16, 16, 2, 7, 14, 9); // wide
  const s = glbSilhouetteScore({ targetMask, renderImg, grid: 32 });
  assert.ok(s < 1, "different proportion lowers IoU");
  assert.ok(s >= 0);
});

// --- the GLB adapter, exercised with injected seams (no fs, no GL, no 5 MB asset) ---

function fakeMesh(bounds = { min: [-1, -1, -1], max: [1, 1, 1] }) {
  return { positions: new Float64Array(0), indices: new Uint32Array(0), bounds, triCount: 0 };
}

test("G. glbFormTarget: kind + scoreRender maps R→mesh region and forwards it to the rasterizer", async () => {
  const mesh = fakeMesh({ min: [0, 0, 0], max: [2, 2, 2] });
  const rasterCalls = [];
  const _rasterize = (m, opts) => {
    rasterCalls.push(opts);
    return rectMask(8, 8, 1, 1, 7, 7);
  };
  const _decode = async () => solidRectImage(8, 8, 1, 1, 7, 7);
  const buildBounds = { min: [0, 0, 0], max: [10, 10, 10] };
  const t = glbFormTarget({ glbPath: "/koi.glb", buildBounds, _loadMesh: async () => mesh, _rasterize, _decode, grid: 8 });

  assert.equal(t.kind, "glb");
  assert.equal(t.glbPath, "/koi.glb");
  const R = { subBounds: { min: [0, 0, 0], max: [5, 5, 5] } };
  const score = await t.scoreRender("/render.png", R);
  assert.equal(score, 1, "identical silhouettes → 1");
  assert.equal(rasterCalls.length, 1);
  // R=[0,5] of build [0,10] → first half of mesh [0,2] = [0,1]
  assert.deepEqual(rasterCalls[0].region, mapVoxelRegionToMesh(R.subBounds, buildBounds, mesh.bounds));
  assert.deepEqual(rasterCalls[0].region.max, [1, 1, 1]);
});

test("G. glbFormTarget: wholeObjectScore forwards NO region", async () => {
  const rasterCalls = [];
  const _rasterize = (m, opts) => {
    rasterCalls.push(opts);
    return rectMask(8, 8, 1, 1, 7, 7);
  };
  const t = glbFormTarget({
    glbPath: "/x.glb",
    buildBounds: { min: [0, 0, 0], max: [10, 10, 10] },
    _loadMesh: async () => fakeMesh(),
    _rasterize,
    _decode: async () => solidRectImage(8, 8, 1, 1, 7, 7),
    grid: 8,
  });
  await t.wholeObjectScore("/render.png");
  assert.equal(rasterCalls[0].region, undefined, "whole-object → no region clip");
});

test("G. glbFormTarget: no buildBounds → scoreRender falls back to whole-object (no region)", async () => {
  const rasterCalls = [];
  const _rasterize = (m, opts) => {
    rasterCalls.push(opts);
    return rectMask(8, 8, 1, 1, 7, 7);
  };
  const t = glbFormTarget({
    glbPath: "/x.glb",
    _loadMesh: async () => fakeMesh(),
    _rasterize,
    _decode: async () => solidRectImage(8, 8, 1, 1, 7, 7),
    grid: 8,
  });
  await t.scoreRender("/render.png", { subBounds: { min: [0, 0, 0], max: [1, 1, 1] } });
  assert.equal(rasterCalls[0].region, undefined, "no buildBounds → whole-object fallback");
});

test("G. glbFormTarget: the 5 MB mesh is loaded once and memoized across calls", async () => {
  let loads = 0;
  const t = glbFormTarget({
    glbPath: "/x.glb",
    buildBounds: { min: [0, 0, 0], max: [10, 10, 10] },
    _loadMesh: async () => {
      loads++;
      return fakeMesh();
    },
    _rasterize: () => rectMask(8, 8, 1, 1, 7, 7),
    _decode: async () => solidRectImage(8, 8, 1, 1, 7, 7),
    grid: 8,
  });
  const R = { subBounds: { min: [0, 0, 0], max: [5, 5, 5] } };
  await t.scoreRender("/r1.png", R);
  await t.scoreRender("/r2.png", R);
  await t.wholeObjectScore("/r3.png");
  assert.equal(loads, 1, "mesh parsed exactly once");
});

test("G. glbFormTarget: glbPath is required (unless a mesh loader is injected)", () => {
  assert.throws(() => glbFormTarget({}), /glbPath/);
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

test("D. swap-invariance: a real glbFormTarget flows through resolve + scoreRender unchanged (the seam)", async () => {
  const t = glbFormTarget({
    glbPath: "/koi.glb",
    buildBounds: { min: [0, 0, 0], max: [10, 10, 10] },
    _loadMesh: async () => fakeMesh(),
    _rasterize: () => rectMask(8, 8, 1, 1, 7, 7),
    _decode: async () => solidRectImage(8, 8, 1, 1, 7, 7),
    grid: 8,
  });
  // resolveFormTarget returns the GLB target unchanged — NO loop/observe/diagnose/accept change needed.
  const resolved = resolveFormTarget({ formTarget: t });
  assert.equal(resolved, t);
  assert.equal(resolved.kind, "glb");
  const score = await resolved.scoreRender("/render.png", { subBounds: { min: [0, 0, 0], max: [5, 5, 5] } });
  assert.equal(score, 1);
});

test("E. FORM_TARGET_SCHEMA is the stable v1 tag", () => {
  assert.equal(FORM_TARGET_SCHEMA, "form-target/v1");
});
