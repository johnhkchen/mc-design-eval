// roof.thatch unit tests (T-132-01) — the promoted saltcrag draft's test plan, verbatim:
// mass thickness, rounded overshooting eave, steep-minimum gate, ridge roll/override,
// hollow underside, byte-stable determinism.

import { test } from "node:test";
import assert from "node:assert/strict";

import { roofThatchConstruct, THATCH_MIN_PITCH } from "./roof-thatch.mjs";

const SPEC = Object.freeze({
  footprint: { x0: 0, x1: 8, z0: 0, z1: 5 },
  ridgeAxis: "z",
  eaveY: 6,
  pitch: 1,
  block: "hay_block",
  thickness: 2,
  ridgeRoll: true,
  ridgeBlock: null,
  eaveOvershoot: 1,
});

const colsOf = (cells) => {
  const cols = new Map();
  for (const c of cells) {
    const k = `${c.pos[0]},${c.pos[2]}`;
    if (!cols.has(k)) cols.set(k, []);
    cols.get(k).push(c);
  }
  return cols;
};

test("TH1 mass is ≥ thickness normal to the pitch at every interior slope column", () => {
  const { cells, depth } = roofThatchConstruct(SPEC);
  // vertical depth d guarantees normal thickness t when d ≥ t·√(1+p²)
  assert.ok(depth >= SPEC.thickness * Math.sqrt(1 + SPEC.pitch ** 2));
  const cols = colsOf(cells.filter((c) => c.block === "hay_block"));
  for (let x = 0; x <= 8; x++) {
    const col = cols.get(`${x},2`);
    assert.ok(col.length >= depth, `column x=${x} carries the full mass (${col.length} ≥ ${depth})`);
  }
});

test("TH2 the eave overshoots the wall plane and rounds (tip column is thinner than the field)", () => {
  const { cells, depth } = roofThatchConstruct(SPEC);
  const cols = colsOf(cells);
  const tip = cols.get("-1,2"); // x0 - eaveOvershoot
  const farTip = cols.get("9,2"); // x1 + eaveOvershoot
  assert.ok(tip && farTip, "overshoot columns exist beyond both wall planes");
  assert.ok(tip.length < depth && tip.length === Math.ceil(depth / 2), "tip keeps only the upper half — no hard 90° soffit");
  assert.equal(Math.max(...tip.map((c) => c.pos[1])), SPEC.eaveY - SPEC.pitch, "the overshoot continues the slope downward");
});

test("TH3 pitch below the steep minimum is rejected", () => {
  assert.throws(() => roofThatchConstruct({ ...SPEC, pitch: 0.5 }), /pitch must be ≥ 1/);
  assert.equal(THATCH_MIN_PITCH, 1);
});

test("TH4 ridgeRoll caps the apex with a raised course; ridgeBlock overrides its material", () => {
  const rolled = roofThatchConstruct(SPEC);
  const rollCells = rolled.cells.filter((c) => c.pos[1] === rolled.ridgeY);
  assert.ok(rollCells.length > 0 && rolled.counts.ridge === rollCells.length, "a raised apex course exists");
  assert.ok(rollCells.every((c) => c.block === "hay_block"), "default roll is the field material");

  const bought = roofThatchConstruct({ ...SPEC, ridgeBlock: "bricks" });
  assert.ok(bought.cells.filter((c) => c.pos[1] === bought.ridgeY).every((c) => c.block === "bricks"));

  const flat = roofThatchConstruct({ ...SPEC, ridgeRoll: false });
  assert.equal(flat.counts.ridge, 0);
  assert.equal(flat.ridgeY, rolled.ridgeY - 1);
});

test("TH5 the underside is hollow — no fill below the pitch underside (the loft stays open)", () => {
  const { cells, depth } = roofThatchConstruct({ ...SPEC, ridgeRoll: false });
  const center = colsOf(cells).get("4,2");
  const minY = Math.min(...center.map((c) => c.pos[1]));
  const surfY = Math.max(...center.map((c) => c.pos[1]));
  assert.equal(center.length, depth, "the center column is exactly the slab, nothing beneath");
  assert.ok(minY > SPEC.eaveY, `interior below the slab is empty (minY ${minY} > eave ${SPEC.eaveY})`);
  assert.equal(surfY - minY + 1, depth);
});

test("TH6 byte-stable: two runs of one spec emit the identical cell list", () => {
  const a = JSON.stringify(roofThatchConstruct(SPEC));
  const b = JSON.stringify(roofThatchConstruct(SPEC));
  assert.equal(a, b);
});

test("TH7 fail-loud spec gates (thickness, block, overshoot, footprint)", () => {
  assert.throws(() => roofThatchConstruct({ ...SPEC, thickness: 1 }), /thickness/);
  assert.throws(() => roofThatchConstruct({ ...SPEC, block: "" }), /block/);
  assert.throws(() => roofThatchConstruct({ ...SPEC, eaveOvershoot: 0 }), /eaveOvershoot/);
  assert.throws(() => roofThatchConstruct({ ...SPEC, footprint: { x0: 3, x1: 1, z0: 0, z1: 2 } }), /footprint/);
});
