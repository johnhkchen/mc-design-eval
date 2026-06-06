// Pure unit tests for montageRow — no pngjs, no files (T-057-01, E-17).

import { test } from "node:test";
import assert from "node:assert/strict";
import { montageRow } from "./montage.mjs";

/** A solid w×h RGBA8 panel of one color. */
function solid(w, h, [r, g, b, a = 255]) {
  const data = Buffer.alloc(4 * w * h);
  for (let p = 0; p < data.length; p += 4) {
    data[p] = r;
    data[p + 1] = g;
    data[p + 2] = b;
    data[p + 3] = a;
  }
  return { width: w, height: h, data };
}

/** RGBA at (x,y) of a montage result. */
function px(img, x, y) {
  const o = (y * img.width + x) * 4;
  return [img.data[o], img.data[o + 1], img.data[o + 2], img.data[o + 3]];
}

const RED = [200, 0, 0];
const BLUE = [0, 0, 200];

test("two panels, gap 0 → side-by-side, no gutter", () => {
  const out = montageRow([solid(2, 2, RED), solid(2, 2, BLUE)], { gap: 0 });
  assert.equal(out.width, 4);
  assert.equal(out.height, 2);
  assert.deepEqual(px(out, 0, 0), [...RED, 255]); // left half = A
  assert.deepEqual(px(out, 1, 1), [...RED, 255]);
  assert.deepEqual(px(out, 2, 0), [...BLUE, 255]); // right half = B
  assert.deepEqual(px(out, 3, 1), [...BLUE, 255]);
});

test("gap 1 → middle column is bg, width grows by the gutter", () => {
  const bg = [10, 20, 30, 255];
  const out = montageRow([solid(2, 2, RED), solid(2, 2, BLUE)], { gap: 1, bg });
  assert.equal(out.width, 5); // 2 + 1 + 2
  assert.deepEqual(px(out, 2, 0), bg); // the gutter column
  assert.deepEqual(px(out, 2, 1), bg);
  assert.deepEqual(px(out, 1, 0), [...RED, 255]);
  assert.deepEqual(px(out, 3, 0), [...BLUE, 255]);
});

test("unequal heights → top-aligned; short panel's bottom padded with bg", () => {
  const bg = [7, 7, 7, 255];
  const out = montageRow([solid(2, 2, RED), solid(2, 1, BLUE)], { gap: 0, bg });
  assert.equal(out.width, 4);
  assert.equal(out.height, 2);
  assert.deepEqual(px(out, 2, 0), [...BLUE, 255]); // short panel top row
  assert.deepEqual(px(out, 2, 1), bg); // its bottom row = bg padding
});

test("throws on empty or malformed input", () => {
  assert.throws(() => montageRow([]), /non-empty/);
  assert.throws(() => montageRow([{ width: 2, height: 2, data: Buffer.alloc(4) }]), /data length/);
});
