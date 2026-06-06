// Pure unit suite for the same-angle reference quantize plumbing. We test the bits this module OWNS —
// `n` (face-width) enforcement, the bare-manifest whitelist, n-derivation from a SurfaceGrid — by
// driving image-grid's PURE `gridFromPixels` with the opts our builder produces. Decode (gridFromImage)
// is image-grid's own already-tested seam and is not exercised here (no binary fixture, no GL).

import { test } from "node:test";
import assert from "node:assert/strict";
import { gridFromPixels } from "../color/image-grid.mjs";
import { loadBlockTable } from "../color/block-table.mjs";
import { quantizeOpts, bareList } from "./reference-quantize.mjs";
import { quantizeToFace } from "./reference-quantize.mjs";

const TABLE = loadBlockTable();
const rgbOf = (name) => TABLE.blocks.find((b) => b.block === name).rgb;

function solidImage(W, H, color) {
  const data = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const p = i << 2;
    data[p] = color[0]; data[p + 1] = color[1]; data[p + 2] = color[2]; data[p + 3] = 255;
  }
  return { width: W, height: H, data };
}

test("bareList strips the minecraft: namespace", () => {
  assert.deepEqual(bareList(["minecraft:stone", "oak_planks"]), ["stone", "oak_planks"]);
  assert.deepEqual(bareList(undefined), []);
});

test("quantizeOpts: requires a positive-integer face width n", () => {
  assert.throws(() => quantizeOpts({}), /positive integer/);
  assert.throws(() => quantizeOpts({ n: 0 }), /positive integer/);
  assert.throws(() => quantizeOpts({ n: 2.5 }), /positive integer/);
  assert.deepEqual(quantizeOpts({ n: 12 }), { n: 12 });
});

test("quantizeOpts: manifest becomes a bare whitelist (validate mode → 0 out-of-palette)", () => {
  const manifest = ["minecraft:stone", "minecraft:gold_block"];
  const opts = quantizeOpts({ n: 8, manifest });
  assert.deepEqual(opts.whitelist, ["stone", "gold_block"]);
  // Drive the pure quantizer: a solid gold image snapped within the manifest must stay in-palette.
  const img = solidImage(32, 32, rgbOf("gold_block"));
  const r = gridFromPixels(img, opts);
  assert.equal(r.n, 8);
  assert.equal(r.paletteMode, "validate");
  assert.equal(r.outOfPalette, 0);
  assert.ok(r.usedBlocks.includes("gold_block"));
});

test("quantizeToFace derives n from a SurfaceGrid", async () => {
  // quantizeToFace reads only grid.n; a bad grid throws before any decode.
  await assert.rejects(() => quantizeToFace("nope.png", { n: 0 }), /positive integer/);
  // n-derivation is the contract; verify the opts builder it relies on honors that n.
  const grid = { n: 24 };
  assert.equal(quantizeOpts({ n: grid.n }).n, 24);
});
