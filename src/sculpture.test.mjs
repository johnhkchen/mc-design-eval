// Unit tests for the PURE vConcept sculpture surface (T-035-01). No GL, no live calls —
// these guard the two properties the AC cares about: the prompts are OBJECT-oriented (never
// facade-oriented), `--scale` flows through, and the single-view limitation is documented.

import { test } from "node:test";
import assert from "node:assert/strict";

import { VCONCEPT_SCULPTURE_METHOD_ID, PHASE1_MODEL_ID } from "./config.mjs";
import {
  VCONCEPT_SCULPTURE,
  SCALE_MIN,
  SCALE_MAX,
  DEFAULT_SCALE,
  SCULPTURE_VIEW_3Q,
  TURNTABLE,
  assertSculptureSpec,
  sculptureScaleCaps,
  runIdForSubject,
  sculptureMetadata,
  metadataPinLines,
  composeSculptureDesignDocPrompt,
  composeSculptureBuildPrompt,
} from "./sculpture.mjs";

// Facade-ORIENTATION assertions that MUST NOT leak into sculpture prompts (the core "not a
// facade" guard). The bare word "facade" is allowed — both prompts use it in NEGATION ("NOT a
// facade"); what we forbid is any prompt positively imposing the facade's head-on/relief frame.
const FACADE_TOKENS = [
  /front elevation/i,
  /faces \+z/i,
  /relief recedes/i,
  /relief into/i,
  /model only the front/i,
  /connected plane/i,
];

test("descriptor: id single-sourced from config, version 1", () => {
  assert.equal(VCONCEPT_SCULPTURE.id, VCONCEPT_SCULPTURE_METHOD_ID);
  assert.equal(VCONCEPT_SCULPTURE.id, "vconcept-sculpture.v1");
  assert.equal(VCONCEPT_SCULPTURE.version, 1);
  assert.ok(Object.isFrozen(VCONCEPT_SCULPTURE));
});

test("constants: sane bounds and frozen view/turntable config", () => {
  assert.ok(SCALE_MIN < DEFAULT_SCALE && DEFAULT_SCALE < SCALE_MAX);
  assert.ok(Object.isFrozen(SCULPTURE_VIEW_3Q));
  assert.ok(Object.isFrozen(TURNTABLE));
  // The rock stays in the front hemisphere (never parades the imagined back).
  assert.ok(TURNTABLE.centerDeg + TURNTABLE.amplitudeDeg < 90);
  assert.ok(TURNTABLE.centerDeg - TURNTABLE.amplitudeDeg > -90);
});

test("assertSculptureSpec: accepts a valid pair and trims the subject", () => {
  assert.deepEqual(assertSculptureSpec({ subject: "  moai  ", scale: 32 }), { subject: "moai", scale: 32 });
  assert.deepEqual(assertSculptureSpec({ subject: "koi fish", scale: SCALE_MIN }), { subject: "koi fish", scale: 8 });
});

test("assertSculptureSpec: rejects bad subject/scale", () => {
  assert.throws(() => assertSculptureSpec({ subject: "", scale: 32 }), /subject/);
  assert.throws(() => assertSculptureSpec({ subject: "   ", scale: 32 }), /subject/);
  assert.throws(() => assertSculptureSpec({ subject: "moai" }), /scale/);
  assert.throws(() => assertSculptureSpec({ subject: "moai", scale: 0 }), /scale/);
  assert.throws(() => assertSculptureSpec({ subject: "moai", scale: SCALE_MIN - 1 }), /scale/);
  assert.throws(() => assertSculptureSpec({ subject: "moai", scale: SCALE_MAX + 1 }), /scale/);
  assert.throws(() => assertSculptureSpec({ subject: "moai", scale: 32.5 }), /scale/);
});

test("sculptureScaleCaps: positive ints, reflect scale, monotonic", () => {
  const a = sculptureScaleCaps(16);
  assert.deepEqual(a, { maxW: 16, maxH: 16, maxD: 16 });
  for (const v of Object.values(a)) assert.ok(Number.isInteger(v) && v > 0);
  const b = sculptureScaleCaps(48);
  assert.ok(b.maxW > a.maxW && b.maxH > a.maxH && b.maxD > a.maxD);
  assert.throws(() => sculptureScaleCaps(7), /scale/);
  assert.throws(() => sculptureScaleCaps(100), /scale/);
});

test("runIdForSubject: zero-padded seq + slug", () => {
  assert.equal(runIdForSubject(3, "Moai"), "003-vConcept-moai");
  assert.equal(runIdForSubject(12, "Bow & Arrow"), "012-vConcept-bow-arrow");
  assert.equal(runIdForSubject(1, "koi  fish!"), "001-vConcept-koi-fish");
});

test("sculptureMetadata: pins the archetype identity; target optional", () => {
  const m = sculptureMetadata({ runId: "003-vConcept-moai", scale: 32, target: "moai" });
  assert.equal(m.prompting_method_id, VCONCEPT_SCULPTURE_METHOD_ID);
  assert.equal(m.model_id, PHASE1_MODEL_ID);
  assert.equal(m.trial_id, "003-vConcept-moai");
  assert.equal(m.target, "moai");
  assert.equal(Number.isInteger(m.seed), true);
  // model override + no target.
  const m2 = sculptureMetadata({ runId: "x", scale: 16, model: "claude-test" });
  assert.equal(m2.model_id, "claude-test");
  assert.equal("target" in m2, false);
});

test("metadataPinLines: emits the EXACTLY-set fields", () => {
  const lines = metadataPinLines(sculptureMetadata({ runId: "r1", scale: 32, target: "moai" }));
  const joined = lines.join("\n");
  assert.match(joined, /metadata\.trial_id = "r1"/);
  assert.match(joined, /metadata\.prompting_method_id = "vconcept-sculpture\.v1"/);
  assert.match(joined, /metadata\.target = "moai"/);
});

test("design-doc prompt: subject + scale present, object-oriented, no facade tokens", () => {
  const p = composeSculptureDesignDocPrompt({ subject: "moai", scale: 32 });
  assert.match(p, /moai/);
  assert.match(p, /32/);
  assert.match(p, /freestanding/i);
  assert.match(p, /in the round/i);
  assert.match(p, /turntable/i);
  for (const t of FACADE_TOKENS) assert.doesNotMatch(p, t, `facade token leaked: ${t}`);
  // validates input (so a bad spec can't reach a metered call via the doc stage).
  assert.throws(() => composeSculptureDesignDocPrompt({ subject: "", scale: 32 }), /subject/);
});

test("build prompt: subject/scale/caps + metadata pins + single-view limit, no facade tokens", () => {
  const designDoc = "## Read\nA stoic basalt head.\n## Palette\nblackstone dominant.";
  const p = composeSculptureBuildPrompt({ subject: "moai", scale: 32, designDoc, runId: "003-vConcept-moai" });
  // subject + scale + the caps numbers all present.
  assert.match(p, /moai/);
  assert.match(p, /32/);
  const { maxW } = sculptureScaleCaps(32);
  assert.match(p, new RegExp(`${maxW}`));
  // the finalized doc is embedded.
  assert.match(p, /stoic basalt head/);
  // metadata pins (attribution).
  assert.match(p, /metadata\.prompting_method_id = "vconcept-sculpture\.v1"/);
  assert.match(p, /metadata\.trial_id = "003-vConcept-moai"/);
  assert.match(p, /metadata\.target = "moai"/);
  // OBJECT orientation present.
  assert.match(p, /x\/y\/z/);
  assert.match(p, /in the round/i);
  assert.match(p, /three-dimensional|3-?d/i);
  // single-view limitation documented (AC #3).
  assert.match(p, /single[- ]view/i);
  assert.match(p, /back.{0,40}(side|far)/i);
  // NO facade assumptions.
  for (const t of FACADE_TOKENS) assert.doesNotMatch(p, t, `facade token leaked: ${t}`);
  // model override flows into the pinned metadata.
  const p2 = composeSculptureBuildPrompt({ subject: "sword", scale: 24, designDoc, runId: "r", model: "claude-x" });
  assert.match(p2, /metadata\.model_id = "claude-x"/);
});
