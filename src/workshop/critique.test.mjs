// workshop critique contract tests (T-126-01; prompt layer migrated to BAML by T-129-01). Groups:
//   E — extractReplyJson (fence discipline)
//   C — parseWorkshopReply accept + rejection matrix
//   B — critiqueRenderArgs content pins (the BAML function's typed inputs; the full rendered
//       prompt is byte-pinned to the captured golden by src/baml/fixtures.test.mjs)

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  WORKSHOP_REPLY_SCHEMA, ISSUE_SEVERITIES, MAX_ISSUES,
  critiqueRenderArgs, extractReplyJson, parseWorkshopReply, liveActionNames,
} from "./critique.mjs";
import { DEFAULT_APPLIERS } from "./actions.mjs";
import { assertWorkshopProgram, WORKSHOP_PROGRAM_SCHEMA } from "./program.mjs";

void WORKSHOP_REPLY_SCHEMA;

const PACK = {
  palette: [{ role: "wall.field", block: "oak_planks" }, { role: "roof.field", block: "spruce_planks" }],
  decoration: [{ item: "lantern", block: "lantern" }],
};
const PROGRAM = assertWorkshopProgram({
  schema: WORKSHOP_PROGRAM_SCHEMA, subject: "synthetic", pack: "rustic",
  budget: { rounds: 3 }, declarations: {},
  elements: [{ id: "shell", kind: "shell", spec: { footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 0, height: 3, wallBlock: "oak_planks" } }],
});
const ctx = { program: PROGRAM, pack: PACK };

const reply = (over = {}) => JSON.stringify({
  critique: { issues: [{ region: "north wall", issue: "pink band off the pack palette", severity: "major" }] },
  decision: "revise",
  action: { action: "spray-paint", dir: "+z", toBlock: "oak_planks", fromBlock: "pink_wool" },
  rationale: "Repaint the foreign band into the pack's wall block.",
  ...over,
});
const fenced = (s) => "Here is my read of the build.\n```json\n" + s + "\n```\n";

// --- E: fence discipline --------------------------------------------------------------------------

test("E1 one fenced block parses; bare JSON parses; two fences or prose-only throw", () => {
  assert.equal(extractReplyJson(fenced(reply())).decision, "revise");
  assert.equal(extractReplyJson(reply()).decision, "revise");
  assert.throws(() => extractReplyJson(fenced(reply()) + fenced("{}")), /ONE fenced json block/);
  assert.throws(() => extractReplyJson("I think the roof is too flat."), /not valid JSON/);
  assert.throws(() => extractReplyJson("   "), /empty reply/);
});

// --- C: the reply contract ------------------------------------------------------------------------

test("C1 the canonical revise reply parses, frozen, action grounded via parseAction", () => {
  const v = parseWorkshopReply(fenced(reply()), ctx);
  assert.equal(v.decision, "revise");
  assert.equal(v.action.toBlock, "oak_planks");
  assert.equal(v.critique.issues[0].severity, "major");
  assert.ok(Object.isFrozen(v) && Object.isFrozen(v.critique.issues[0]));
});

test("C2 done reply: no action allowed; issues may be empty", () => {
  const v = parseWorkshopReply(reply({ decision: "done", action: undefined, critique: { issues: [] } }), ctx);
  assert.equal(v.decision, "done");
  assert.equal(v.action, undefined);
});

test("C3 rejection matrix", () => {
  const cases = [
    [reply({ decision: "maybe" }), /decision must be/],
    [reply({ decision: "revise", action: undefined }), /requires an action/],
    [reply({ decision: "done" }), /forbids an action/],
    [reply({ critique: { issues: [] } }), /at least one named issue/],
    [reply({ critique: null }), /issues must be an array/],
    [reply({ critique: { issues: Array.from({ length: MAX_ISSUES + 1 }, () => ({ region: "r", issue: "i", severity: "minor" })) } }), /exceeds the cap/],
    [reply({ critique: { issues: [{ region: "", issue: "x", severity: "minor" }] } }), /region/],
    [reply({ critique: { issues: [{ region: "r", issue: "x", severity: "fatal" }] } }), new RegExp(ISSUE_SEVERITIES.join("\\|"))],
    [reply({ rationale: "" }), /rationale/],
    [reply({ action: { action: "spray-paint", dir: "+z", toBlock: "pink_wool" } }), /not in the pack vocabulary/],
    [reply({ action: { action: "demolish" } }), /must be one of/],
    ["[1,2,3]", /must be a JSON object/],
  ];
  for (const [text, rx] of cases) {
    assert.throws(() => parseWorkshopReply(text, ctx), rx, `expected ${rx} for ${String(text).slice(0, 60)}`);
  }
});

// --- B: render-args content pins (the BAML function's typed inputs) -------------------------------

test("B1 the render args carry round/budget, image order, live actions, palette, conformance, last round", () => {
  const conformance = {
    checks: [
      { name: "palette-in-pack", passed: false, findings: ["foreign block pink_wool ×6 (e.g. 2,1,3)"] },
      { name: "watertight", passed: true, findings: [] },
    ],
  };
  const a = critiqueRenderArgs({
    program: PROGRAM, pack: PACK, round: 2, budget: 4,
    liveActions: liveActionNames(DEFAULT_APPLIERS),
    azimuths: ["+x+z", "+x-z", "-x-z", "-x+z"],
    conformance,
    lastRound: { action: { action: "adjust-params", elementId: "shell", params: { height: 9 } }, accepted: false, reason: "regressed watertight" },
  });
  assert.equal(a.round_num, 2);
  assert.equal(a.budget, 4);
  assert.match(a.image_list, /1\. the CONCEPT/);
  assert.match(a.image_list, /azimuth 315° \(-x\+z\)/);
  assert.equal(a.live_actions, "adjust-params, spray-paint"); // re-recognize NOT live by default
  assert.match(a.palette_block, /wall\.field: oak_planks/);
  assert.match(a.palette_block, /decoration:\n {2}- lantern: lantern/);
  assert.match(a.conformance_block, /palette-in-pack: FAIL — foreign block pink_wool/);
  assert.match(a.conformance_block, /watertight: PASS/);
  assert.match(a.last_round_note, /ROLLED BACK \(regressed watertight\)/);
  assert.equal(a.max_issues, MAX_ISSUES);
  assert.match(a.program_json, /"elements"/); // the program is embedded
});

test("B2 the render args are deterministic in their inputs; no last round → empty note", () => {
  const args = {
    program: PROGRAM, pack: PACK, round: 1, budget: 3,
    liveActions: ["adjust-params", "spray-paint"],
    azimuths: ["+x+z", "+x-z", "-x-z", "-x+z"],
    conformance: { checks: [] },
  };
  assert.deepEqual(critiqueRenderArgs(args), critiqueRenderArgs(args));
  assert.equal(critiqueRenderArgs(args).last_round_note, "");
});
