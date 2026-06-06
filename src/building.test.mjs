// Unit tests for the PURE vConcept BUILDING surface (T-067-01 / E-20). No GL, no live calls — these
// guard the properties the AC cares about: the prompts are BUILDING-oriented (whole structure in the
// round, never a facade), `--scale` flows through, the SINGLE-BUILDING / single-view constraint is
// stated, and the run-id namespace is distinct from sculpture so the two never collide by slug.

import { test } from "node:test";
import assert from "node:assert/strict";

import { VCONCEPT_BUILDING_METHOD_ID, PHASE1_MODEL_ID } from "./config.mjs";
import {
  VCONCEPT_BUILDING,
  BUILDING_SCALE_MIN,
  BUILDING_SCALE_MAX,
  BUILDING_DEFAULT_SCALE,
  BUILDING_VIEW_3Q,
  BUILDING_TURNTABLE,
  assertBuildingSpec,
  buildingScaleCaps,
  runIdForBuilding,
  buildingMetadata,
  composeBuildingDesignDocPrompt,
  composeBuildingBuildPrompt,
} from "./building.mjs";

// Facade-ORIENTATION assertions that MUST NOT leak into building prompts. The bare word "facade" is
// allowed — the prompts use it in NEGATION ("NOT a facade"); what we forbid is any prompt positively
// imposing the facade's head-on/relief frame, OR a single-front-face framing (a building is in the round).
const FACADE_TOKENS = [
  /front elevation/i,
  /faces \+z/i,
  /relief recedes/i,
  /relief into/i,
  /model only the front/i,
  /connected plane/i,
];

test("descriptor: id single-sourced from config, version 1", () => {
  assert.equal(VCONCEPT_BUILDING.id, VCONCEPT_BUILDING_METHOD_ID);
  assert.equal(VCONCEPT_BUILDING.id, "vconcept-building.v1");
  assert.equal(VCONCEPT_BUILDING.version, 1);
  assert.ok(Object.isFrozen(VCONCEPT_BUILDING));
});

test("constants: sane bounds and frozen view/turntable config", () => {
  assert.ok(BUILDING_SCALE_MIN < BUILDING_DEFAULT_SCALE && BUILDING_DEFAULT_SCALE < BUILDING_SCALE_MAX);
  assert.ok(Object.isFrozen(BUILDING_VIEW_3Q));
  assert.ok(Object.isFrozen(BUILDING_TURNTABLE));
  // A building needs more extent than a tabletop sculpture (default 32) — but stays inside the
  // single-view degradation ceiling.
  assert.ok(BUILDING_DEFAULT_SCALE >= 32 && BUILDING_SCALE_MAX <= 128);
  // The rock stays in the front hemisphere (never parades the imagined back).
  assert.ok(BUILDING_TURNTABLE.centerDeg + BUILDING_TURNTABLE.amplitudeDeg < 90);
  assert.ok(BUILDING_TURNTABLE.centerDeg - BUILDING_TURNTABLE.amplitudeDeg > -90);
});

test("assertBuildingSpec: accepts a valid pair and trims the subject", () => {
  assert.deepEqual(assertBuildingSpec({ subject: "  stone gatehouse  ", scale: 48 }), { subject: "stone gatehouse", scale: 48 });
  assert.deepEqual(assertBuildingSpec({ subject: "pagoda", scale: BUILDING_SCALE_MIN }), { subject: "pagoda", scale: 16 });
});

test("assertBuildingSpec: rejects bad subject/scale", () => {
  assert.throws(() => assertBuildingSpec({ subject: "", scale: 48 }), /subject/);
  assert.throws(() => assertBuildingSpec({ subject: "   ", scale: 48 }), /subject/);
  assert.throws(() => assertBuildingSpec({ subject: "barn" }), /scale/);
  assert.throws(() => assertBuildingSpec({ subject: "barn", scale: 0 }), /scale/);
  assert.throws(() => assertBuildingSpec({ subject: "barn", scale: BUILDING_SCALE_MIN - 1 }), /scale/);
  assert.throws(() => assertBuildingSpec({ subject: "barn", scale: BUILDING_SCALE_MAX + 1 }), /scale/);
  assert.throws(() => assertBuildingSpec({ subject: "barn", scale: 48.5 }), /scale/);
  // errors are prefixed `building:` (a misconfigured run fails before any metered call).
  assert.throws(() => assertBuildingSpec({ subject: "", scale: 48 }), /^Error: building:/);
});

test("buildingScaleCaps: positive ints, reflect scale, monotonic", () => {
  const a = buildingScaleCaps(32);
  assert.deepEqual(a, { maxW: 32, maxH: 32, maxD: 32 });
  for (const v of Object.values(a)) assert.ok(Number.isInteger(v) && v > 0);
  const b = buildingScaleCaps(64);
  assert.ok(b.maxW > a.maxW && b.maxH > a.maxH && b.maxD > a.maxD);
  assert.throws(() => buildingScaleCaps(BUILDING_SCALE_MIN - 1), /scale/);
  assert.throws(() => buildingScaleCaps(BUILDING_SCALE_MAX + 1), /scale/);
});

test("runIdForBuilding: zero-padded seq + slug, DISTINCT from sculpture infix", () => {
  assert.equal(runIdForBuilding(3, "Stone Gatehouse"), "003-vBuilding-stone-gatehouse");
  assert.equal(runIdForBuilding(12, "Pagoda & Garden"), "012-vBuilding-pagoda-garden");
  assert.equal(runIdForBuilding(1, "  windmill!  "), "001-vBuilding-windmill");
  // distinct namespace so building runs never collide by slug with sculpture (`vConcept`) runs.
  assert.match(runIdForBuilding(1, "x"), /vBuilding/);
  assert.doesNotMatch(runIdForBuilding(1, "x"), /vConcept/);
});

test("buildingMetadata: pins archetype identity; NEVER sets the target enum", () => {
  const m = buildingMetadata({ runId: "003-vBuilding-stone-gatehouse" });
  assert.equal(m.prompting_method_id, VCONCEPT_BUILDING_METHOD_ID);
  assert.equal(m.model_id, PHASE1_MODEL_ID);
  assert.equal(m.trial_id, "003-vBuilding-stone-gatehouse");
  assert.equal(Number.isInteger(m.seed), true);
  // target is a schema enum (house|path|landscape) — a vConcept build must NOT set it.
  assert.equal("target" in m, false);
  // model override flows through.
  const m2 = buildingMetadata({ runId: "x", model: "claude-test" });
  assert.equal(m2.model_id, "claude-test");
});

test("design-doc prompt: subject + scale present, building-oriented, no facade-only framing", () => {
  const p = composeBuildingDesignDocPrompt({ subject: "stone gatehouse", scale: 48 });
  assert.match(p, /stone gatehouse/);
  assert.match(p, /48/);
  assert.match(p, /building/i);
  assert.match(p, /in the round/i);
  assert.match(p, /roof/i);
  assert.match(p, /four elevations/i);
  assert.match(p, /footprint/i);
  // explicitly ONE building, not a campus/cluster.
  assert.match(p, /not a campus|cluster of buildings/i);
  for (const t of FACADE_TOKENS) assert.doesNotMatch(p, t, `facade token leaked: ${t}`);
  // validates input (so a bad spec can't reach a metered call via the doc stage).
  assert.throws(() => composeBuildingDesignDocPrompt({ subject: "", scale: 48 }), /subject/);
});

test("build prompt: subject/scale/caps + metadata pins + single-view + single-building, no facade framing", () => {
  const designDoc = "## Read\nA squat stone gatehouse with a hipped roof.\n## Palette\nstone bricks dominant.";
  const p = composeBuildingBuildPrompt({ subject: "stone gatehouse", scale: 48, designDoc, runId: "003-vBuilding-stone-gatehouse" });
  // subject + scale + the caps numbers all present.
  assert.match(p, /stone gatehouse/);
  assert.match(p, /48/);
  const { maxW } = buildingScaleCaps(48);
  assert.match(p, new RegExp(`${maxW}`));
  // the finalized doc is embedded.
  assert.match(p, /hipped roof/);
  // metadata pins (attribution) — but NOT target (it is a house|path|landscape enum).
  assert.match(p, /metadata\.prompting_method_id = "vconcept-building\.v1"/);
  assert.match(p, /metadata\.trial_id = "003-vBuilding-stone-gatehouse"/);
  assert.doesNotMatch(p, /metadata\.target/);
  // BUILDING / in-the-round orientation present.
  assert.match(p, /x\/y\/z/);
  assert.match(p, /in the round/i);
  assert.match(p, /three-dimensional|3-?d/i);
  assert.match(p, /roof/i);
  assert.match(p, /four (walls|elevations)/i);
  // single-view limitation documented (AC: honest about the imagined back/sides).
  assert.match(p, /single[- ]view/i);
  assert.match(p, /back.{0,40}(side|far)/i);
  // single-building hard constraint (the moai contact-sheet lesson, AC single-subject check).
  assert.match(p, /one building/i);
  assert.match(p, /not a campus|cluster of structures/i);
  // NO facade framing.
  for (const t of FACADE_TOKENS) assert.doesNotMatch(p, t, `facade token leaked: ${t}`);
  // model override flows into the pinned metadata.
  const p2 = composeBuildingBuildPrompt({ subject: "windmill", scale: 32, designDoc, runId: "r", model: "claude-x" });
  assert.match(p2, /metadata\.model_id = "claude-x"/);
});
