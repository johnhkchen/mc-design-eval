// Pure unit tests for the E-20 surgical-refine-to-standard analyzer (T-069-01). No GL, no I/O, no model —
// the durable AC#2/#3/#4 contract: the judge-verdict trajectory, the form-IoU trajectory, the per-region
// edit trace (procedural vs LLM, kept/rolled-back), the P14-safety check, and the honest Strong+-vs-
// topping-out outcome.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SURGICAL_STANDARD_SCHEMA,
  STANDARD_BAR,
  CATEGORIES,
  boxesIntersect,
  categoryRank,
  meetsStandard,
  roundCell,
  verdictTrajectory,
  formIoUTrajectory,
  editTraceRows,
  checkP14,
  toppingOutDetail,
  assessOutcome,
  assembleSurgicalStandard,
} from "./surgical-standard.mjs";

test("schema + constants are stable", () => {
  assert.equal(SURGICAL_STANDARD_SCHEMA, "surgical-standard/v1");
  assert.equal(STANDARD_BAR, "strong");
  assert.deepEqual(CATEGORIES, ["weak", "competent", "strong", "exceptional"]);
});

// --- rank / standard -----------------------------------------------------------------------------------

test("categoryRank: ordered; unknown/null → -1", () => {
  assert.equal(categoryRank("weak"), 0);
  assert.equal(categoryRank("competent"), 1);
  assert.equal(categoryRank("strong"), 2);
  assert.equal(categoryRank("Exceptional"), 3); // case-insensitive
  assert.equal(categoryRank("unknown"), -1);
  assert.equal(categoryRank(null), -1);
  assert.equal(categoryRank(undefined), -1);
});

test("meetsStandard: strong+ passes the default bar; below fails", () => {
  assert.equal(meetsStandard("strong"), true);
  assert.equal(meetsStandard("exceptional"), true);
  assert.equal(meetsStandard("competent"), false);
  assert.equal(meetsStandard("weak"), false);
  assert.equal(meetsStandard("unknown"), false);
  assert.equal(meetsStandard(null), false);
  // custom bar
  assert.equal(meetsStandard("competent", "competent"), true);
  assert.equal(meetsStandard("strong", "exceptional"), false);
});

test("boxesIntersect: overlap vs disjoint vs malformed", () => {
  const a = { min: [0, 0, 0], max: [5, 5, 5] };
  assert.equal(boxesIntersect(a, { min: [4, 4, 4], max: [9, 9, 9] }), true);
  assert.equal(boxesIntersect(a, { min: [6, 0, 0], max: [9, 5, 5] }), false);
  assert.equal(boxesIntersect(a, null), false);
  assert.equal(boxesIntersect(a, {}), false);
});

// --- roundCell / trajectory ----------------------------------------------------------------------------

test("roundCell: lowercases categories, guards numbers", () => {
  const c = roundCell({ round: 1, overall: "Strong", detail: "COMPETENT", wholeIoU: 0.9311, perSample: ["Strong", "Weak"], accepted: 2 });
  assert.equal(c.round, 1);
  assert.equal(c.overall, "strong");
  assert.equal(c.detail, "competent");
  assert.equal(c.wholeIoU, 0.931);
  assert.deepEqual(c.perSample, ["strong", "weak"]);
  assert.equal(c.accepted, 2);
  const empty = roundCell({ round: 0 });
  assert.equal(empty.overall, null);
  assert.equal(empty.wholeIoU, null);
});

test("verdictTrajectory: ordered by round; null rounds last", () => {
  const traj = verdictTrajectory([
    { round: 2, overall: "strong", wholeIoU: 0.94 },
    { round: 0, overall: "competent", wholeIoU: 0.929 },
    { round: 1, overall: "competent", wholeIoU: 0.935 },
  ]);
  assert.deepEqual(traj.map((t) => t.round), [0, 1, 2]);
  assert.deepEqual(traj.map((t) => t.overall), ["competent", "competent", "strong"]);
});

test("formIoUTrajectory: per-region delta + net over accepted", () => {
  const { perRegion, net } = formIoUTrajectory([
    { region: "A", scoreBefore: 0.80, scoreAfter: 0.86, accepted: true },
    { region: "B", scoreBefore: 0.70, scoreAfter: 0.68, accepted: false },
    { region: "C", reason: "clean" }, // no scores → skipped
  ]);
  assert.equal(perRegion.length, 2);
  assert.equal(perRegion[0].delta, 0.06);
  assert.equal(perRegion[1].delta, -0.02);
  assert.equal(net, 0.06); // only accepted A contributes
});

// --- edit trace rows -----------------------------------------------------------------------------------

test("editTraceRows: relief/material → procedural; other → llm; unscored → none", () => {
  const rows = editTraceRows([
    { region: "roof", route: "relief", tweak: "relief+1", scoreBefore: 0.8, scoreAfter: 0.82, accepted: true, reason: "accepted" },
    { region: "wall", route: "material", tweak: "material#0", scoreBefore: 0.7, scoreAfter: 0.7, accepted: false, reason: "rolled-back" },
    { region: "arch", route: "detail", tweak: "llm-edit", scoreBefore: 0.6, scoreAfter: 0.65, accepted: true, reason: "accepted" },
    { region: "side", reason: "clean" },
  ]);
  assert.equal(rows[0].kind, "procedural");
  assert.equal(rows[1].kind, "procedural");
  assert.equal(rows[2].kind, "llm");
  assert.equal(rows[3].kind, "none");
  assert.equal(rows[2].accepted, true);
  assert.equal(rows[1].accepted, false);
});

// --- P14 safety ----------------------------------------------------------------------------------------

test("checkP14: clean disjoint accepted trace is safe", () => {
  const res = checkP14([
    { region: "A", accepted: true, scoreBefore: 0.8, scoreAfter: 0.86, subBounds: { min: [0, 0, 0], max: [2, 2, 2] } },
    { region: "B", accepted: true, scoreBefore: 0.7, scoreAfter: 0.75, subBounds: { min: [5, 5, 5], max: [7, 7, 7] } },
    { region: "C", accepted: false, scoreBefore: 0.6, scoreAfter: 0.59 },
  ]);
  assert.equal(res.safe, true);
  assert.equal(res.acceptedCount, 2);
  assert.equal(res.violations.length, 0);
});

test("checkP14: a kept non-improving edit is flagged", () => {
  const res = checkP14([{ region: "A", accepted: true, scoreBefore: 0.8, scoreAfter: 0.8, subBounds: { min: [0, 0, 0], max: [1, 1, 1] } }]);
  assert.equal(res.safe, false);
  assert.ok(res.violations.some((v) => v.type === "kept-non-improving"));
});

test("checkP14: two overlapping accepted regions flagged (overlap + altered-after-lock)", () => {
  const res = checkP14([
    { region: "A", accepted: true, scoreBefore: 0.8, scoreAfter: 0.86, subBounds: { min: [0, 0, 0], max: [5, 5, 5] } },
    { region: "B", accepted: true, scoreBefore: 0.7, scoreAfter: 0.78, subBounds: { min: [4, 4, 4], max: [9, 9, 9] } },
  ]);
  assert.equal(res.safe, false);
  assert.ok(res.violations.some((v) => v.type === "accepted-overlap"));
  assert.ok(res.violations.some((v) => v.type === "altered-after-lock"));
});

// --- topping-out detail --------------------------------------------------------------------------------

test("toppingOutDetail: lowest-IoU rolled-back region; null when all accepted", () => {
  const detail = toppingOutDetail([
    { region: "roof", scoreBefore: 0.9, scoreAfter: 0.88, accepted: false },
    { region: "side-windows", scoreBefore: 0.5, scoreAfter: 0.41, accepted: false },
    { region: "arch", scoreBefore: 0.7, scoreAfter: 0.76, accepted: true },
  ]);
  assert.equal(detail.region, "side-windows");
  assert.equal(detail.finalIoU, 0.41);
  assert.equal(detail.kept, false);

  const allAccepted = toppingOutDetail([{ region: "A", scoreBefore: 0.8, scoreAfter: 0.9, accepted: true }]);
  assert.equal(allAccepted, null);
});

// --- assessOutcome -------------------------------------------------------------------------------------

test("assessOutcome: reaches strong mid-trajectory", () => {
  const trajectory = verdictTrajectory([
    { round: 0, overall: "competent", wholeIoU: 0.929 },
    { round: 1, overall: "competent", wholeIoU: 0.933 },
    { round: 2, overall: "strong", wholeIoU: 0.941 },
  ]);
  const o = assessOutcome({ trajectory, trace: [] });
  assert.equal(o.reachedStandard, true);
  assert.equal(o.atRound, 2);
  assert.equal(o.bestVerdict, "strong");
  assert.equal(o.toppingOut, null);
});

test("assessOutcome: tops out below strong → toppingOut with the unfixed detail", () => {
  const trajectory = verdictTrajectory([
    { round: 0, overall: "competent", wholeIoU: 0.929 },
    { round: 1, overall: "competent", wholeIoU: 0.930 },
  ]);
  const trace = [
    { region: "roof", scoreBefore: 0.9, scoreAfter: 0.89, accepted: false },
    { region: "side-windows", scoreBefore: 0.5, scoreAfter: 0.41, accepted: false },
  ];
  const o = assessOutcome({ trajectory, trace });
  assert.equal(o.reachedStandard, false);
  assert.equal(o.bestVerdict, "competent");
  assert.equal(o.toppingOut.verdict, "competent");
  assert.equal(o.toppingOut.detail.region, "side-windows");
  assert.equal(o.toppingOut.detail.finalIoU, 0.41);
});

test("assessOutcome: all-rolled-back tops out at baseline (cage held)", () => {
  const trajectory = verdictTrajectory([{ round: 0, overall: "competent", wholeIoU: 0.929 }]);
  const o = assessOutcome({ trajectory, trace: [{ region: "A", scoreBefore: 0.8, scoreAfter: 0.79, accepted: false }] });
  assert.equal(o.reachedStandard, false);
  assert.equal(o.bestVerdict, "competent");
  assert.equal(o.bestAtRound, 0);
});

// --- assemble ------------------------------------------------------------------------------------------

test("assembleSurgicalStandard: shape, tables, honest outcome (reached)", () => {
  const { md, json } = assembleSurgicalStandard({
    rounds: [
      { round: 0, overall: "competent", wholeIoU: 0.929 },
      { round: 1, overall: "strong", wholeIoU: 0.94, accepted: 1 },
    ],
    trace: [{ region: "arch", route: "detail", tweak: "llm-edit", scoreBefore: 0.6, scoreAfter: 0.66, accepted: true, subBounds: { min: [0, 0, 0], max: [2, 2, 2] } }],
    brief: "a stone gatehouse",
  });
  assert.equal(json.schema, "surgical-standard/v1");
  assert.equal(json.outcome.reachedStandard, true);
  assert.equal(json.outcome.atRound, 1);
  assert.equal(json.p14.safe, true);
  assert.match(md, /Reached strong\+/);
  assert.match(md, /Judge-verdict trajectory/);
  assert.match(md, /Per-region edit trace/);
  assert.match(md, /P14-safety/);
  assert.match(md, /SAFE/);
});

test("assembleSurgicalStandard: honest topping-out paragraph", () => {
  const { md, json } = assembleSurgicalStandard({
    rounds: [{ round: 0, overall: "competent", wholeIoU: 0.929 }],
    trace: [{ region: { where: "left" }, route: "detail", scoreBefore: 0.5, scoreAfter: 0.41, accepted: false }],
  });
  assert.equal(json.outcome.reachedStandard, false);
  assert.match(md, /Topped out at `competent`/);
  assert.match(md, /could not fix/);
});

test("assembleSurgicalStandard: empty rounds → placeholder, no throw; non-array throws", () => {
  const { md, json } = assembleSurgicalStandard({ rounds: [], trace: [] });
  assert.equal(json.trajectory.length, 0);
  assert.match(md, /no rounds ran/);
  assert.throws(() => assembleSurgicalStandard({ rounds: "nope" }), /rounds must be an array/);
  assert.throws(() => assembleSurgicalStandard({ rounds: [], trace: "nope" }), /trace must be an array/);
  assert.throws(() => assembleSurgicalStandard({ rounds: [], trace: [], findings: "nope" }), /findings must be an array/);
});

test("assembleSurgicalStandard: findings render a 'where/why tops out' section", () => {
  const { md, json } = assembleSurgicalStandard({
    rounds: [{ round: 0, overall: "weak", wholeIoU: 0.929 }],
    trace: [],
    findings: ["the LLM-edit route failed: prompt too long on a high-res region"],
  });
  assert.deepEqual(json.findings, ["the LLM-edit route failed: prompt too long on a high-res region"]);
  assert.match(md, /Findings \(where\/why quality tops out\)/);
  assert.match(md, /prompt too long/);
});
