// Tests for the silhouette form-fidelity metric (T-043-01, story S-043, epic E-15).
//
// Groups A–G are PURE/SYNTHETIC (hand-built RGBA buffers + tiny masks — no fixtures, no GL, no decode),
// mirroring value-gate.test.mjs's discipline. Group H is the ticket's explicit requirement: the real
// pipeline on the COMMITTED E-13 render/concept pairs.
//   A extractSilhouette   — fg count, both bg presets, empty→null bbox, tight bbox
//   B normalizeSilhouette — G×G dims, aspect letterbox vs stretch fill
//   C iou                 — identity=1, disjoint=0, partial=known, both-empty=1
//   D iou guards          — dimension mismatch throws
//   E regionIoU           — restricts to box; box-around-overlap == whole iou; disjoint corner=0; degenerate=0
//   F formFidelity        — determinism, inputs-not-mutated, iou∈[0,1], region echoed
//   G knobs               — stretch≠aspect on a non-square subject; custom grid
//   H committed E-13 pairs — formFidelityFromPair: iou∈[0,1], both sides segment, coverage sane

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  FORM_FIDELITY_SCHEMA,
  FORM_DEFAULTS,
  RENDER_BG,
  CONCEPT_BG,
  extractSilhouette,
  normalizeSilhouette,
  iou,
  regionIoU,
  formFidelity,
  formFidelityFromPair,
} from "./form-fidelity.mjs";

// --- synthetic image / mask helpers ----------------------------------------

/** Build a {width,height,data} RGBA image from a fill fn (x,y) → [r,g,b,a]. */
const imageOf = (w, h, fn) => {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a = 255] = fn(x, y);
      const i = (y * w + x) << 2;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
    }
  }
  return { width: w, height: h, data };
};

/** Build a mask object {w,h,data} from a 0/1 fill fn. */
const maskOf = (w, h, fn) => {
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data[y * w + x] = fn(x, y) ? 1 : 0;
  return { w, h, data };
};

const BLACK = [0, 0, 0, 255];
const SKY = [173, 216, 230, 255];
const WHITE = [255, 255, 255, 255];

// --- Group A: extractSilhouette --------------------------------------------

test("A1 black-bg preset: a planted bright blob is foreground, black is dropped", () => {
  // 6×6, a 2×2 white square at (2,2); rest black.
  const img = imageOf(6, 6, (x, y) => (x >= 2 && x < 4 && y >= 2 && y < 4 ? WHITE : BLACK));
  const sil = extractSilhouette(img, CONCEPT_BG);
  assert.equal(sil.fgCount, 4);
  assert.deepEqual(sil.bbox, { x0: 2, y0: 2, x1: 4, y1: 4 });
});

test("A2 sky-bg preset: a bright blob is foreground, sky #ADD8E6 is dropped", () => {
  const img = imageOf(6, 6, (x, y) => (x >= 1 && x < 3 && y >= 1 && y < 5 ? WHITE : SKY));
  const sil = extractSilhouette(img, RENDER_BG);
  assert.equal(sil.fgCount, 2 * 4);
  assert.deepEqual(sil.bbox, { x0: 1, y0: 1, x1: 3, y1: 5 });
});

test("A3 empty foreground → bbox null, fgCount 0", () => {
  const img = imageOf(4, 4, () => BLACK);
  const sil = extractSilhouette(img, CONCEPT_BG);
  assert.equal(sil.fgCount, 0);
  assert.equal(sil.bbox, null);
});

test("A4 bbox is tight around an off-center blob", () => {
  const img = imageOf(8, 8, (x, y) => (x === 5 && y === 6 ? WHITE : BLACK));
  const sil = extractSilhouette(img, CONCEPT_BG);
  assert.deepEqual(sil.bbox, { x0: 5, y0: 6, x1: 6, y1: 7 });
});

test("A5 throws on a non-image input", () => {
  assert.throws(() => extractSilhouette({}, CONCEPT_BG), /decoded/);
});

// --- Group B: normalizeSilhouette ------------------------------------------

test("B1 output is exactly grid×grid", () => {
  const img = imageOf(6, 6, (x, y) => (x >= 2 && x < 4 && y >= 2 && y < 4 ? WHITE : BLACK));
  const sil = extractSilhouette(img, CONCEPT_BG);
  const norm = normalizeSilhouette(sil, { grid: 16 });
  assert.equal(norm.w, 16);
  assert.equal(norm.h, 16);
  assert.equal(norm.data.length, 256);
  assert.ok(norm.fgCount > 0);
});

test("B2 aspect-fit letterboxes a tall blob (empty edge columns)", () => {
  // a 2-wide, 6-tall solid blob → aspect-fit centers it, leaving empty columns at left/right.
  const img = imageOf(8, 8, (x, y) => (x >= 3 && x < 5 && y >= 1 && y < 7 ? WHITE : BLACK));
  const sil = extractSilhouette(img, CONCEPT_BG);
  const norm = normalizeSilhouette(sil, { grid: 12, fit: "aspect" });
  // leftmost and rightmost columns should be entirely empty (letterbox padding).
  let leftCol = 0, rightCol = 0;
  for (let y = 0; y < 12; y++) {
    leftCol += norm.data[y * 12 + 0];
    rightCol += norm.data[y * 12 + 11];
  }
  assert.equal(leftCol, 0);
  assert.equal(rightCol, 0);
});

test("B3 stretch-fit fills both axes (no empty edge columns) for the same tall blob", () => {
  const img = imageOf(8, 8, (x, y) => (x >= 3 && x < 5 && y >= 1 && y < 7 ? WHITE : BLACK));
  const sil = extractSilhouette(img, CONCEPT_BG);
  const norm = normalizeSilhouette(sil, { grid: 12, fit: "stretch" });
  // stretch makes the blob fill the whole grid → top-left and bottom-right cells set.
  assert.equal(norm.data[0], 1);
  assert.equal(norm.data[12 * 12 - 1], 1);
});

test("B4 empty mask normalizes to an empty grid", () => {
  const sil = { w: 4, h: 4, data: new Uint8Array(16), fgCount: 0, bbox: null };
  const norm = normalizeSilhouette(sil, { grid: 8 });
  assert.equal(norm.fgCount, 0);
});

test("B5 bad grid / fit throw", () => {
  const sil = { w: 4, h: 4, data: new Uint8Array(16), fgCount: 0, bbox: null };
  assert.throws(() => normalizeSilhouette(sil, { grid: 0 }), /positive integer/);
  assert.throws(() => normalizeSilhouette(sil, { fit: "warp" }), /aspect/);
});

test("B6 bbox override crops under the GIVEN window, not the mask's own (T-109-01)", () => {
  // a single fg pixel at (1,1) inside an 8×8 mask; its own bbox would blow it up to fill the
  // grid — under the full-frame override it stays one cell in the top-left quadrant.
  const img = imageOf(8, 8, (x, y) => (x === 1 && y === 1 ? WHITE : BLACK));
  const sil = extractSilhouette(img, CONCEPT_BG);
  const own = normalizeSilhouette(sil, { grid: 8 });
  assert.equal(own.fgCount, 64); // own-bbox crop: the pixel IS the bbox → fills the grid
  const framed = normalizeSilhouette(sil, { grid: 8, bbox: { x0: 0, y0: 0, x1: 8, y1: 8 } });
  assert.equal(framed.fgCount, 1);
  assert.equal(framed.data[1 * 8 + 1], 1); // same relative position as in the source frame
});

test("B7 bbox override identical to the mask's own bbox is byte-identical to no override", () => {
  const img = imageOf(8, 8, (x, y) => (x >= 3 && x < 5 && y >= 1 && y < 7 ? WHITE : BLACK));
  const sil = extractSilhouette(img, CONCEPT_BG);
  const a = normalizeSilhouette(sil, { grid: 12 });
  const b = normalizeSilhouette(sil, { grid: 12, bbox: sil.bbox });
  assert.deepEqual([...a.data], [...b.data]);
});

// --- Group C: iou ----------------------------------------------------------

test("C1 identical masks → 1", () => {
  const m = maskOf(4, 4, (x) => x < 2);
  assert.equal(iou(m, m), 1);
});

test("C2 disjoint non-empty masks → 0", () => {
  const a = maskOf(4, 4, (x) => x < 2);
  const b = maskOf(4, 4, (x) => x >= 2);
  assert.equal(iou(a, b), 0);
});

test("C3 partial overlap → known fraction", () => {
  // a = left half (8 cells), b = columns 1..2 (8 cells); overlap = column 1 (4 cells); union = 12.
  const a = maskOf(4, 4, (x) => x < 2);
  const b = maskOf(4, 4, (x) => x >= 1 && x < 3);
  assert.equal(iou(a, b), 4 / 12);
});

test("C4 both-empty → 1 (vacuously identical, never NaN)", () => {
  const e = maskOf(4, 4, () => 0);
  const v = iou(e, e);
  assert.equal(v, 1);
  assert.ok(Number.isFinite(v));
});

// --- Group D: iou guards ---------------------------------------------------

test("D1 dimension mismatch throws", () => {
  assert.throws(() => iou(maskOf(4, 4, () => 1), maskOf(4, 5, () => 1)), /share dimensions/);
});

// --- Group E: regionIoU ----------------------------------------------------

test("E1 a region containing all the overlap reproduces the whole iou", () => {
  const a = maskOf(4, 4, (x, y) => y < 2);
  const b = maskOf(4, 4, (x, y) => y < 2);
  // full-frame region == whole iou.
  assert.equal(regionIoU(a, b, { x0: 0, y0: 0, x1: 1, y1: 1 }), iou(a, b));
});

test("E2 a region over the top half restricts to it", () => {
  // a = full top row only (y=0); b = full second row only (y=1). disjoint overall.
  const a = maskOf(4, 4, (x, y) => y === 0);
  const b = maskOf(4, 4, (x, y) => y === 1);
  // region = top quarter (y in [0,0.25)) contains only a's row → intersection 0, union = a's row → 0.
  assert.equal(regionIoU(a, b, { x0: 0, y0: 0, x1: 1, y1: 0.25 }), 0);
});

test("E3 a region over a shared block → 1", () => {
  // both fill the top-left 2×2; bottom differs. Region over the top-left quadrant → identical → 1.
  const a = maskOf(4, 4, (x, y) => x < 2 && y < 2);
  const b = maskOf(4, 4, (x, y) => (x < 2 && y < 2) || (x >= 2 && y >= 2));
  assert.equal(regionIoU(a, b, { x0: 0, y0: 0, x1: 0.5, y1: 0.5 }), 1);
});

test("E4 degenerate / inverted region → 0", () => {
  const a = maskOf(4, 4, () => 1);
  assert.equal(regionIoU(a, a, { x0: 0.5, y0: 0.5, x1: 0.5, y1: 0.5 }), 0);
  assert.equal(regionIoU(a, a, { x0: 0.8, y0: 0.8, x1: 0.2, y1: 0.2 }), 0);
});

test("E5 missing region throws", () => {
  const a = maskOf(2, 2, () => 1);
  assert.throws(() => regionIoU(a, a), /region/);
});

// --- Group F: formFidelity -------------------------------------------------

// A render-style image (sky bg, blob) and a concept-style image (black bg, blob) of different sizes.
const renderImg = imageOf(10, 10, (x, y) => (x >= 3 && x < 7 && y >= 2 && y < 8 ? WHITE : SKY));
const conceptImg = imageOf(20, 16, (x, y) => (x >= 8 && x < 12 && y >= 4 && y < 12 ? WHITE : BLACK));

test("F1 schema, grid, fit, iou in range", () => {
  const r = formFidelity(renderImg, conceptImg);
  assert.equal(r.schema, FORM_FIDELITY_SCHEMA);
  assert.equal(r.grid, FORM_DEFAULTS.grid);
  assert.equal(r.fit, FORM_DEFAULTS.fit);
  assert.ok(r.iou >= 0 && r.iou <= 1);
  assert.ok(r.render.fgCount > 0 && r.concept.fgCount > 0);
  assert.ok(r.render.aspect > 0 && r.concept.aspect > 0);
});

test("F2 deterministic: deep-equal on repeat", () => {
  assert.deepEqual(formFidelity(renderImg, conceptImg), formFidelity(renderImg, conceptImg));
});

test("F3 inputs are not mutated", () => {
  const rCopy = structuredClone({ width: renderImg.width, height: renderImg.height, data: Array.from(renderImg.data) });
  const cCopy = structuredClone({ width: conceptImg.width, height: conceptImg.height, data: Array.from(conceptImg.data) });
  formFidelity(renderImg, conceptImg);
  assert.deepEqual(Array.from(renderImg.data), rCopy.data);
  assert.deepEqual(Array.from(conceptImg.data), cCopy.data);
});

test("F4 region echoed and regionIoU present + in range when region given", () => {
  const region = { x0: 0.25, y0: 0.25, x1: 0.75, y1: 0.75 };
  const r = formFidelity(renderImg, conceptImg, { region });
  assert.deepEqual(r.region, region);
  assert.ok(r.regionIoU >= 0 && r.regionIoU <= 1);
});

test("F5 no region → no regionIoU key", () => {
  const r = formFidelity(renderImg, conceptImg);
  assert.equal("regionIoU" in r, false);
});

// --- Group G: knobs --------------------------------------------------------

test("G1 stretch differs from aspect on a non-square subject", () => {
  // The render blob is 4×6 (tall) and the concept blob is 4×8 (taller): proportion differs, so aspect-fit
  // (which preserves proportion) and stretch-fit (which discards it) should give different IoUs.
  const aspect = formFidelity(renderImg, conceptImg, { fit: "aspect" }).iou;
  const stretch = formFidelity(renderImg, conceptImg, { fit: "stretch" }).iou;
  assert.notEqual(aspect, stretch);
});

test("G2 custom grid is honored", () => {
  const r = formFidelity(renderImg, conceptImg, { grid: 32 });
  assert.equal(r.grid, 32);
});

// --- Group H: committed E-13 pairs -----------------------------------------

const RUNS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "benchmarks", "sculpture", "runs");

/** Discover run dirs that have BOTH a render-3q.png and a concept.png. Sorted, deterministic. */
function discoverPairs() {
  if (!existsSync(RUNS_DIR)) return [];
  const pairs = [];
  for (const name of readdirSync(RUNS_DIR).sort()) {
    const dir = join(RUNS_DIR, name);
    const render = join(dir, "render-3q.png");
    const concept = join(dir, "concept.png");
    if (existsSync(render) && existsSync(concept)) pairs.push({ name, render, concept });
  }
  return pairs;
}

test("H1 representative subjects (moai, koi, heart) score in [0,1] with both sides segmented", async () => {
  const pairs = discoverPairs();
  const wanted = pairs.filter((p) => /moai|koi|heart/.test(p.name)).slice(0, 3);
  assert.ok(wanted.length >= 1, "expected at least one committed moai/koi/heart pair");
  for (const p of wanted) {
    const r = await formFidelityFromPair(p.render, p.concept);
    assert.ok(r.iou >= 0 && r.iou <= 1, `${p.name} iou out of range: ${r.iou}`);
    assert.ok(r.render.fgCount > 0, `${p.name} render did not segment`);
    assert.ok(r.concept.fgCount > 0, `${p.name} concept did not segment`);
    // render is a 512² frame with a single subject — coverage should be a sane minority of the frame.
    assert.ok(r.render.coverage > 0.01 && r.render.coverage < 0.95, `${p.name} render coverage ${r.render.coverage}`);
  }
});

test("H2 every committed pair upholds the invariant (iou∈[0,1], both sides segment)", async () => {
  const pairs = discoverPairs();
  assert.ok(pairs.length > 0, "no committed render/concept pairs found");
  for (const p of pairs) {
    const r = await formFidelityFromPair(p.render, p.concept);
    assert.ok(r.iou >= 0 && r.iou <= 1, `${p.name} iou ${r.iou}`);
    assert.ok(r.render.fgCount > 0 && r.concept.fgCount > 0, `${p.name} a side failed to segment`);
  }
});

test("H3 region IoU on a real pair is in range and restricts (≤ a generous bound)", async () => {
  const pairs = discoverPairs();
  const p = pairs.find((q) => /moai/.test(q.name)) ?? pairs[0];
  const r = await formFidelityFromPair(p.render, p.concept, { region: { x0: 0, y0: 0, x1: 1, y1: 1 } });
  // full-frame region IoU should equal the whole-object IoU.
  const whole = await formFidelityFromPair(p.render, p.concept);
  assert.equal(r.regionIoU, whole.iou);
});
