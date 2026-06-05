// Unit suite for the block → CIE-Lab color table (T-019-01, AC #3).
//
// Offline, deterministic, and INDEPENDENT of the builder: Group A pins the sRGB→Lab math to
// reference values derived from the CIELAB definition; Group B exercises meanOpaqueRgb on
// synthetic pixel buffers; Group C asserts semantic color properties on the COMMITTED table
// (loadBlockTable), with thresholds derived from color theory — not from re-running the builder.
// The builder itself touches build-time-only deps (minecraft-assets/pngjs) and is exercised by
// scripts/build-block-table.mjs, deliberately not here (keeps asset deps off the test path).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  srgbToLab,
  meanOpaqueRgb,
  loadBlockTable,
  classifyBlock,
  isFullCubeParent,
  pickFace,
} from "./block-table.mjs";

// --- Group A: sRGB → Lab reference values ---------------------------------

test("srgbToLab: pure white ≈ L*100, neutral a*/b*", () => {
  const [L, a, b] = srgbToLab([255, 255, 255]);
  assert.ok(L >= 99 && L <= 100.5, `L*=${L}`);
  assert.ok(Math.abs(a) < 1, `a*=${a}`);
  assert.ok(Math.abs(b) < 1, `b*=${b}`);
});

test("srgbToLab: pure black ≈ L*0", () => {
  const [L] = srgbToLab([0, 0, 0]);
  assert.ok(L >= 0 && L <= 1, `L*=${L}`);
});

test("srgbToLab: mid grey is neutral (a*,b* ≈ 0)", () => {
  const [L, a, b] = srgbToLab([128, 128, 128]);
  assert.ok(L > 40 && L < 70, `L*=${L}`);
  assert.ok(Math.abs(a) < 1.5 && Math.abs(b) < 1.5, `a*=${a} b*=${b}`);
});

test("srgbToLab: pure blue has strongly negative b*", () => {
  const [, , b] = srgbToLab([0, 0, 255]);
  assert.ok(b < -50, `b*=${b}`);
});

test("srgbToLab: pure red has strongly positive a*", () => {
  const [, a] = srgbToLab([255, 0, 0]);
  assert.ok(a > 50, `a*=${a}`);
});

// --- Group B: meanOpaqueRgb behavior --------------------------------------

/** Build a pngjs-shaped object from a flat RGBA array. */
function png(width, height, rgba) {
  return { width, height, data: Uint8Array.from(rgba) };
}

test("meanOpaqueRgb: ignores transparent pixels", () => {
  // 2×1: opaque red + fully transparent green → red only
  const p = png(2, 1, [255, 0, 0, 255, 0, 255, 0, 0]);
  assert.deepEqual(meanOpaqueRgb(p), [255, 0, 0]);
});

test("meanOpaqueRgb: fully transparent texture → null", () => {
  const p = png(2, 1, [10, 20, 30, 0, 40, 50, 60, 0]);
  assert.equal(meanOpaqueRgb(p), null);
});

test("meanOpaqueRgb: animated strip uses only the first frame", () => {
  // width=1, height=3 (3 frames). Frame 0 = red; frames 1,2 = green/blue must be ignored.
  const p = png(1, 3, [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);
  assert.deepEqual(meanOpaqueRgb(p), [255, 0, 0]);
});

test("meanOpaqueRgb: averages multiple opaque pixels", () => {
  const p = png(2, 1, [0, 0, 0, 255, 100, 100, 100, 255]);
  assert.deepEqual(meanOpaqueRgb(p), [50, 50, 50]);
});

// --- Group B2: classification helpers -------------------------------------

test("isFullCubeParent recognizes cube templates, rejects others", () => {
  assert.equal(isFullCubeParent("minecraft:block/cube_all"), true);
  assert.equal(isFullCubeParent("minecraft:block/cube_column"), true);
  assert.equal(isFullCubeParent("minecraft:block/stairs"), false);
  assert.equal(isFullCubeParent("block/leaves"), false);
  assert.equal(isFullCubeParent(undefined), false);
});

test("classifyBlock excludes tinted and non-cube; includes plain cube_all", () => {
  assert.equal(
    classifyBlock("stone", { parent: "minecraft:block/cube_all", textures: { all: "x" } }).include,
    true,
  );
  assert.equal(
    classifyBlock("oak_stairs", { parent: "minecraft:block/stairs" }).include,
    false,
  );
  // A cube-parent block carrying tintindex is dropped on the tint branch (the cube filter
  // catches grass_block's real block/block parent earlier; this isolates the tint rule).
  assert.match(
    classifyBlock("tinted_cube", {
      parent: "minecraft:block/cube_all",
      textures: { all: "x" },
      elements: [{ faces: { up: { tintindex: 0 } } }],
    }).reason,
    /tint/,
  );
  assert.match(classifyBlock("spawner", { parent: "minecraft:block/cube_all" }).reason, /denylist/);
});

test("pickFace prefers side for columns, all for cube_all", () => {
  assert.equal(
    pickFace({ textures: { side: "minecraft:block/oak_log", end: "x" } }),
    "oak_log",
  );
  assert.equal(pickFace({ textures: { all: "minecraft:block/stone" } }), "stone");
  assert.equal(pickFace({ textures: { top: "x", bottom: "y" } }), null);
});

// --- Group C: committed table sanity --------------------------------------

const TABLE = loadBlockTable();
const byName = new Map(TABLE.blocks.map((b) => [b.block, b]));
const get = (name) => {
  const e = byName.get(name);
  assert.ok(e, `expected "${name}" in the table`);
  return e;
};

test("table provenance: effective 1.20.2 from requested 1.20.1", () => {
  assert.equal(TABLE.version, "1.20.2");
  assert.equal(TABLE.requestedVersion, "1.20.1");
  assert.ok(TABLE.blocks.length > 250, `only ${TABLE.blocks.length} blocks`);
});

test("gold_block reads warm/yellow (high b*, mid-bright L*)", () => {
  const [L, , b] = get("gold_block").lab;
  assert.ok(b > 20, `b*=${b}`);
  assert.ok(L > 55 && L < 90, `L*=${L}`);
});

test("coal_block and blackstone read near-black (low L*)", () => {
  assert.ok(get("coal_block").lab[0] < 30, `coal L*=${get("coal_block").lab[0]}`);
  assert.ok(get("blackstone").lab[0] < 30, `blackstone L*=${get("blackstone").lab[0]}`);
});

test("quartz_block reads near-white (high L*)", () => {
  assert.ok(get("quartz_block").lab[0] > 80, `L*=${get("quartz_block").lab[0]}`);
});

test("lapis_block reads blue (negative b*)", () => {
  assert.ok(get("lapis_block").lab[2] < -10, `b*=${get("lapis_block").lab[2]}`);
});

test("redstone_block reads red (positive a*)", () => {
  assert.ok(get("redstone_block").lab[1] > 20, `a*=${get("redstone_block").lab[1]}`);
});

test("every entry is structurally sound (rgb 0..255, 3-number lab)", () => {
  for (const e of TABLE.blocks) {
    assert.equal(typeof e.block, "string");
    assert.equal(typeof e.texture, "string");
    assert.equal(e.rgb.length, 3);
    for (const c of e.rgb) assert.ok(Number.isInteger(c) && c >= 0 && c <= 255, `rgb ${c}`);
    assert.equal(e.lab.length, 3);
    for (const v of e.lab) assert.equal(typeof v, "number");
  }
});

test("biome-tinted and non-full-cube blocks are excluded", () => {
  for (const absent of ["oak_leaves", "grass_block", "oak_stairs", "oak_slab", "oak_fence"]) {
    assert.equal(byName.has(absent), false, `${absent} must not be in the table`);
  }
  assert.ok(TABLE.excluded.length > 0, "excluded[] documents the drops");
  assert.ok(
    TABLE.excluded.some((e) => e.block === "oak_leaves" && /tint|cube/.test(e.reason)),
    "oak_leaves exclusion is documented",
  );
});
