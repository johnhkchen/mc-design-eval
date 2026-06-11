// Brush preview tests (T-128-01, story S-128, epic E-32): substrate semantics, then EVERY
// registered pass preview realizes — non-empty, deterministic, with a non-empty effect.

import { test } from "node:test";
import assert from "node:assert/strict";

import { BRUSH_REGISTRY, brushNames } from "./idiom-registry.mjs";
import { PREVIEW_SUBSTRATE_KINDS, previewSubstrate, realizePassPreview } from "./brush-preview.mjs";

const SPEC = { footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 0, height: 3 };

test("solid substrate fills the whole box", () => {
  const cells = previewSubstrate({ kind: "solid", spec: { ...SPEC, block: "stone" } });
  assert.equal(cells.length, 5 * 4 * 3);
  assert.ok(cells.every((c) => c.block === "stone"));
});

test("box substrate is sealed (perimeter + floor + cap) with an empty interior", () => {
  const cells = previewSubstrate({ kind: "box", spec: { ...SPEC, block: "stone" } });
  const keys = new Set(cells.map((c) => c.pos.join(",")));
  assert.ok(!keys.has("2,1,1"), "interior cell is empty");
  assert.ok(keys.has("2,0,1") && keys.has("2,2,1"), "floor and cap are sealed");
  assert.ok(keys.has("0,1,1") && keys.has("4,1,1"), "walls present");
});

test("shell substrate delegates to boxShell (hollow, floorless, true holes)", () => {
  const cells = previewSubstrate({
    kind: "shell",
    spec: { footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 0, height: 3, wallBlock: "stone", openings: [{ wall: "-z", at: [2, 1], w: 1, h: 1 }] },
  });
  const keys = new Set(cells.map((c) => c.pos.join(",")));
  assert.ok(!keys.has("2,1,1"), "hollow interior");
  assert.ok(!keys.has("2,0,1"), "floorless");
  assert.ok(!keys.has("2,1,0"), "the opening is a TRUE hole");
  assert.ok(keys.has("1,1,0"), "wall beside the hole");
});

test("unknown substrate kind and malformed specs throw", () => {
  assert.throws(() => previewSubstrate({ kind: "cloud", spec: {} }), /kind must be one of/);
  assert.throws(() => previewSubstrate({ kind: "solid", spec: { ...SPEC, block: "" } }), /block/);
  assert.throws(() => previewSubstrate({ kind: "box", spec: { footprint: { x0: 3, x1: 0, z0: 0, z1: 1 }, y0: 0, height: 2, block: "stone" } }), /footprint/);
  assert.equal(PREVIEW_SUBSTRATE_KINDS.length, 3);
});

test("EVERY registered pass preview realizes: non-empty cells, non-empty effect, well-formed", () => {
  const passes = brushNames().filter((n) => BRUSH_REGISTRY[n].kind === "pass");
  assert.ok(passes.length >= 8, `expected the full pass inventory, got ${passes.length}`);
  for (const name of passes) {
    const { cells, effect } = realizePassPreview(name, BRUSH_REGISTRY[name]);
    assert.ok(cells.length > 0, `${name}: empty preview`);
    assert.ok(effect > 0, `${name}: the pass had no visible effect on its substrate`);
    for (const c of cells) {
      assert.ok(Array.isArray(c.pos) && c.pos.length === 3 && c.pos.every(Number.isInteger), `${name}: bad pos`);
      assert.ok(typeof c.block === "string" && c.block.length > 0, `${name}: bad block`);
    }
  }
});

test("pass previews are deterministic", () => {
  for (const name of brushNames()) {
    const entry = BRUSH_REGISTRY[name];
    if (entry.kind !== "pass") continue;
    assert.deepEqual(realizePassPreview(name, entry), realizePassPreview(name, entry), name);
  }
});

test("the preview effects are the ops' signatures, not noise", () => {
  // surface.fill: the timber course survives, the cobble field recolors
  const fill = realizePassPreview("surface.fill", BRUSH_REGISTRY["surface.fill"]);
  assert.ok(fill.cells.some((c) => c.block === "dark_oak_log"), "preserve-run kept");
  assert.ok(fill.cells.some((c) => c.block === "white_terracotta"), "field recolored");
  // surface.strip-salt: no salt survives
  const salt = realizePassPreview("surface.strip-salt", BRUSH_REGISTRY["surface.strip-salt"]);
  assert.ok(salt.cells.every((c) => c.block !== "andesite"), "specks stripped");
  assert.equal(salt.effect, 3);
  // hollow: the cutaway exposes the cavity (fewer cells than the solid substrate half)
  const hollow = realizePassPreview("hollow", BRUSH_REGISTRY["hollow"]);
  assert.ok(hollow.cells.every((c) => c.pos[0] <= 3), "cutaway applied");
  // floorplan: divider wall cells appear in the interior
  const plan = realizePassPreview("floorplan", BRUSH_REGISTRY["floorplan"]);
  assert.ok(plan.cells.some((c) => c.block === "oak_planks"), "divider placed");
});
