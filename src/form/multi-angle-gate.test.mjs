// Unit suite for the multi-angle same-object gate pure core (T-093-01, S-093, E-25).
// No GL, no network: the v2 per-view verdict parser contract, the aggregate REFUSE/DECIDE rule
// (incl. the AC's refuse-on-missing-view and gap-budget cases), the sheet captions, and the
// N-panel sheet composer (step 2). The metered judge and rendering are the runner's edges.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMultiAngleViewPrompt, parseMultiAngleVerdict, aggregateMultiAngle, viewOutcomeLabel,
  gateInstrumentDiff, MULTI_ANGLE_VERDICT_SCHEMA, MULTI_ANGLE_GATE_SCHEMA, MAX_GAPS_PER_VIEW,
} from "./multi-angle-gate.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";

const AZ = MULTI_ANGLE_GATE.azimuths;

// --- the contract itself ----------------------------------------------------

test("the gate contract: four fixed ground-diagonal azimuths, gap budget 2, frozen", () => {
  assert.deepEqual([...AZ], ["+x+z", "+x-z", "-x-z", "-x+z"]);
  assert.equal(MULTI_ANGLE_GATE.gapBudget, 2);
  assert.ok(Object.isFrozen(MULTI_ANGLE_GATE) && Object.isFrozen(MULTI_ANGLE_GATE.azimuths));
});

test("the per-view prompt names the azimuth and the strict JSON shape", () => {
  const p = buildMultiAngleViewPrompt("-x-z", 225);
  assert.match(p, /azimuth 225°/);
  assert.match(p, /"-x-z"/);
  assert.match(p, /"verdict":"same object\|drifted\|different object"/);
  assert.match(p, /severity/);
});

// --- parser: valid shapes ----------------------------------------------------

const J = (o) => JSON.stringify(o);

test("same object with zero gaps parses", () => {
  const v = parseMultiAngleVerdict(J({ verdict: "same object", gaps: [], rationale: "reads true" }));
  assert.equal(v.schema, MULTI_ANGLE_VERDICT_SCHEMA);
  assert.equal(v.verdict, "same object");
  assert.deepEqual(v.gaps, []);
});

test("same object with minor gaps parses; fenced JSON accepted", () => {
  const text = "```json\n" + J({
    verdict: "same object",
    gaps: [
      { region: "roof ridge", attribute: "palette", severity: "minor" },
      { region: "rear wall", attribute: "material zoning", severity: "minor" },
    ],
    rationale: "small tone drift",
  }) + "\n```";
  const v = parseMultiAngleVerdict(text);
  assert.equal(v.gaps.length, 2);
  assert.equal(v.gaps[0].severity, "minor");
});

test("drifted with a major gap parses", () => {
  const v = parseMultiAngleVerdict(J({
    verdict: "drifted",
    gaps: [{ region: "roof side faces", attribute: "material zoning", severity: "major" }],
    rationale: "grey roof sides",
  }));
  assert.equal(v.verdict, "drifted");
  assert.equal(v.gaps[0].severity, "major");
});

// --- parser: contract violations throw ----------------------------------------

test("same object with a MAJOR gap is a contract violation", () => {
  assert.throws(() => parseMultiAngleVerdict(J({
    verdict: "same object",
    gaps: [{ region: "roof", attribute: "form", severity: "major" }],
    rationale: "",
  })), /cannot carry a major gap/);
});

test("drifted without gaps / without a major gap throws", () => {
  assert.throws(() => parseMultiAngleVerdict(J({ verdict: "drifted", gaps: [], rationale: "" })),
    /requires at least one named gap/);
  assert.throws(() => parseMultiAngleVerdict(J({
    verdict: "drifted",
    gaps: [{ region: "roof", attribute: "form", severity: "minor" }],
    rationale: "",
  })), /at least one MAJOR gap/);
});

test("vocabulary stays frozen: bad verdict, attribute, severity, gap count all throw", () => {
  assert.throws(() => parseMultiAngleVerdict(J({ verdict: "close enough", gaps: [], rationale: "" })), /verdict must be one of/);
  assert.throws(() => parseMultiAngleVerdict(J({
    verdict: "drifted", gaps: [{ region: "x", attribute: "vibes", severity: "major" }], rationale: "",
  })), /attribute must be one of/);
  assert.throws(() => parseMultiAngleVerdict(J({
    verdict: "drifted", gaps: [{ region: "x", attribute: "form", severity: "fatal" }], rationale: "",
  })), /severity must be one of/);
  const four = Array.from({ length: MAX_GAPS_PER_VIEW + 1 }, () => ({ region: "x", attribute: "form", severity: "minor" }));
  assert.throws(() => parseMultiAngleVerdict(J({ verdict: "same object", gaps: four, rationale: "" })), /at most/);
});

test("non-JSON and empty replies throw", () => {
  assert.throws(() => parseMultiAngleVerdict("the build looks fine to me"), /not JSON/);
  assert.throws(() => parseMultiAngleVerdict("   "), /empty/);
});

// --- aggregation: helpers ------------------------------------------------------

const ok = (angle, gaps = []) => ({
  angle, rendered: true, coverage: { passed: true },
  verdict: { verdict: "same object", gaps: gaps.map((g) => ({ severity: "minor", ...g })) },
});
const minor = (region, attribute = "palette") => ({ region, attribute });

// --- aggregation: pass/fail ------------------------------------------------------

test("all same-object, zero gaps → PASS", () => {
  const agg = aggregateMultiAngle(AZ.map((a) => ok(a)));
  assert.equal(agg.schema, MULTI_ANGLE_GATE_SCHEMA);
  assert.deepEqual([agg.decided, agg.passed, agg.gapCount], [true, true, 0]);
  assert.deepEqual(agg.failures, []);
});

test("exactly gapBudget minor gaps total → still PASS; budget+1 → FAIL named gap-budget", () => {
  const two = aggregateMultiAngle([ok(AZ[0], [minor("ridge")]), ok(AZ[1], [minor("eave")]), ok(AZ[2]), ok(AZ[3])]);
  assert.deepEqual([two.decided, two.passed, two.gapCount], [true, true, 2]);
  const three = aggregateMultiAngle([ok(AZ[0], [minor("ridge"), minor("eave")]), ok(AZ[1], [minor("door")]), ok(AZ[2]), ok(AZ[3])]);
  assert.deepEqual([three.decided, three.passed, three.gapCount], [true, false, 3]);
  assert.deepEqual(three.failures, [{ angle: "(all)", reason: "gap-budget" }]);
});

test("one drifted view → decided FAIL with the angle named", () => {
  const drifted = {
    angle: AZ[2], rendered: true, coverage: { passed: true },
    verdict: { verdict: "drifted", gaps: [{ region: "roof sides", attribute: "material zoning", severity: "major" }] },
  };
  const agg = aggregateMultiAngle([ok(AZ[0]), ok(AZ[1]), drifted, ok(AZ[3])]);
  assert.deepEqual([agg.decided, agg.passed], [true, false]);
  assert.deepEqual(agg.failures, [{ angle: AZ[2], reason: "drifted" }]);
});

test("a coverage-failed view (judge never called) → decided FAIL, not a refusal", () => {
  const cov = { angle: AZ[1], rendered: true, coverage: { passed: false }, verdict: null };
  const agg = aggregateMultiAngle([ok(AZ[0]), cov, ok(AZ[2]), ok(AZ[3])]);
  assert.deepEqual([agg.decided, agg.passed], [true, false]);
  assert.deepEqual(agg.failures, [{ angle: AZ[1], reason: "coverage" }]);
});

// --- aggregation: refusals (AC: the gate refuses to produce a verdict) ------------

test("a missing azimuth → REFUSAL, no pass/fail", () => {
  const agg = aggregateMultiAngle([ok(AZ[0]), ok(AZ[1]), ok(AZ[2])]);
  assert.equal(agg.decided, false);
  assert.equal(agg.refusal, `missing-view:${AZ[3]}`);
  assert.equal(agg.passed, undefined);
});

test("an unrendered view → REFUSAL", () => {
  const agg = aggregateMultiAngle([{ angle: AZ[0], rendered: false, coverage: null, verdict: null },
    ok(AZ[1]), ok(AZ[2]), ok(AZ[3])]);
  assert.deepEqual([agg.decided, agg.refusal], [false, `missing-view:${AZ[0]}`]);
});

test("an unparsed judge reply → REFUSAL (never a guessed verdict)", () => {
  const agg = aggregateMultiAngle([ok(AZ[0]), ok(AZ[1]), ok(AZ[2]),
    { angle: AZ[3], rendered: true, coverage: { passed: true }, verdict: null, unparsed: true }]);
  assert.deepEqual([agg.decided, agg.refusal], [false, `unparsed:${AZ[3]}`]);
});

test("a rendered, covered view with no verdict at all → REFUSAL missing-verdict", () => {
  const agg = aggregateMultiAngle([ok(AZ[0]), ok(AZ[1]), ok(AZ[2]),
    { angle: AZ[3], rendered: true, coverage: { passed: true }, verdict: null }]);
  assert.deepEqual([agg.decided, agg.refusal], [false, `missing-verdict:${AZ[3]}`]);
});

// --- aggregation: the exact-set contract --------------------------------------------

test("an unexpected or duplicate angle is a caller bug — throws", () => {
  assert.throws(() => aggregateMultiAngle([...AZ.map((a) => ok(a)), ok(AZ[0])]), /duplicate/);
  assert.throws(() => aggregateMultiAngle([ok("front")]), /unexpected angle/);
});

// --- sheet captions ------------------------------------------------------------------

test("viewOutcomeLabel covers every state", () => {
  assert.equal(viewOutcomeLabel(undefined), "missing");
  assert.equal(viewOutcomeLabel({ rendered: false }), "missing");
  assert.equal(viewOutcomeLabel({ rendered: true, coverage: { passed: false } }), "coverage");
  assert.equal(viewOutcomeLabel({ rendered: true, coverage: { passed: true }, unparsed: true }), "unparsed");
  assert.equal(viewOutcomeLabel(ok(AZ[0])), "same object");
  assert.equal(viewOutcomeLabel(ok(AZ[0], [minor("ridge")])), "same object (1 minor)");
  assert.equal(viewOutcomeLabel({
    rendered: true, coverage: { passed: true },
    verdict: { verdict: "drifted", gaps: [{ region: "r", attribute: "form", severity: "major" }] },
  }), "drifted: form");
});

// --- gateInstrumentDiff (T-114-01: the re-judge's untouchable set) ---------------------

const recFixture = () => ({
  schema: MULTI_ANGLE_GATE_SCHEMA,
  subject: "church", label: "challenge",
  artifact: { path: "p.json", sha256: "abc" },
  contract: { azimuths: [...AZ], gapBudget: 2 },
  zones: { source: "concept", policy: { roof: { dominant: "dark_oak_planks" } } },
  kitPresence: { ran: true, passed: false, gaps: ["missing: x"] },
  views: [
    { ...ok(AZ[0]), azimuthDeg: 45, judge: { model: "m", usage: { output_tokens: 1 } } },
    { ...ok(AZ[1]), azimuthDeg: 135, judge: { model: "m", usage: { output_tokens: 2 } } },
    { angle: AZ[2], azimuthDeg: 225, rendered: true, coverage: { passed: true },
      verdict: null, unparsed: true, parseError: "not JSON", rawReply: "```json{trunc" },
    { ...ok(AZ[3]), azimuthDeg: 315, judge: { model: "m", usage: { output_tokens: 3 } } },
  ],
  aggregate: { decided: false, refusal: `unparsed:${AZ[2]}` },
});

test("gateInstrumentDiff: identical records → []", () => {
  assert.deepEqual(gateInstrumentDiff(recFixture(), recFixture()), []);
});

test("gateInstrumentDiff: the unparsed view gaining verdict + replies is the ALLOWED change", () => {
  const after = recFixture();
  const v = after.views[2];
  delete v.unparsed; delete v.parseError; delete v.rawReply;
  v.verdict = { verdict: "drifted", gaps: [{ region: "roof", attribute: "form", severity: "major" }] };
  v.replies = [{ attempt: 1, parsed: false, source: "committed" }, { attempt: 2, parsed: true, source: "live" }];
  v.judge = { model: "m", usage: { output_tokens: 9 } };
  after.aggregate = { decided: true, passed: false }; // downstream — not compared
  after.rejudge = { angles: [AZ[2]], instrumentDiff: [] };
  assert.deepEqual(gateInstrumentDiff(recFixture(), after), []);
});

test("gateInstrumentDiff: touching a PARSED view's verdict — or anything else on it — is flagged", () => {
  const after = recFixture();
  after.views[0].verdict.verdict = "drifted"; // a verdict re-roll
  assert.deepEqual(gateInstrumentDiff(recFixture(), after), [`views[${AZ[0]}]`]);
  const after2 = recFixture();
  after2.views[3].judge.usage.output_tokens = 99; // even usage on a parsed view is untouchable
  assert.deepEqual(gateInstrumentDiff(recFixture(), after2), [`views[${AZ[3]}]`]);
});

test("gateInstrumentDiff: instrument fields are each flagged by name", () => {
  for (const [mutate, path] of [
    [(r) => { r.contract.gapBudget = 3; }, "contract"],
    [(r) => { r.zones.policy.roof.dominant = "stone"; }, "zones"],
    [(r) => { r.kitPresence.passed = true; }, "kitPresence"],
    [(r) => { r.artifact.sha256 = "zzz"; }, "artifact"],
    [(r) => { r.views[2].coverage.passed = false; }, `views[${AZ[2]}].coverage`],
  ]) {
    const after = recFixture();
    mutate(after);
    assert.deepEqual(gateInstrumentDiff(recFixture(), after), [path]);
  }
});

test("gateInstrumentDiff: a dropped view is flagged", () => {
  const after = recFixture();
  after.views.pop();
  assert.deepEqual(gateInstrumentDiff(recFixture(), after), [`views[${AZ[3]}]`, "views.length"]);
});

// --- the contact-sheet composer (step 2: composeSheet generalization) -----------------

test("composeSheet: N-panel width math and triptych delegation", async () => {
  const { composeSheet, composeTriptych, RESEMBLANCE_DEFAULTS } = await import("./resemblance.mjs");
  const P = 4, G = RESEMBLANCE_DEFAULTS.gutter;
  const panel = (v) => ({ w: P, h: P, data: new Uint8Array(P * P * 4).fill(v) });
  const five = composeSheet([1, 2, 3, 4, 5].map(panel));
  assert.equal(five.w, P * 5 + G * 4);
  assert.equal(five.h, P);
  // triptych contract preserved: exactly 3 panels, byte-identical to the sheet path
  assert.throws(() => composeTriptych([panel(1), panel(2)]), /exactly 3 panels/);
  const t = composeTriptych([1, 2, 3].map(panel));
  const s = composeSheet([1, 2, 3].map(panel));
  assert.deepEqual([t.w, t.h], [s.w, s.h]);
  assert.deepEqual(Buffer.from(t.data), Buffer.from(s.data));
});

test("composeSheet rejects empty and mismatched panels", async () => {
  const { composeSheet } = await import("./resemblance.mjs");
  assert.throws(() => composeSheet([]), /at least 1 panel/);
  assert.throws(() => composeSheet([{ w: 2, h: 2, data: new Uint8Array(16) }, { w: 3, h: 2, data: new Uint8Array(24) }]),
    /share dimensions/);
});
