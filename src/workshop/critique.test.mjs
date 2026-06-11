// workshop critique contract tests (T-126-01). Groups:
//   E — extractReplyJson (fence discipline)
//   C — parseWorkshopReply accept + rejection matrix
//   B — buildWorkshopPrompt content pins (live actions, budget, image order, contract embedded)

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  WORKSHOP_REPLY_SCHEMA, ISSUE_SEVERITIES, MAX_ISSUES,
  buildWorkshopPrompt, extractReplyJson, parseWorkshopReply, liveActionNames,
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

// --- B: prompt content pins -----------------------------------------------------------------------

test("B1 the prompt names round/budget, image order, live actions, palette, conformance, contract", () => {
  const conformance = {
    checks: [
      { name: "palette-in-pack", passed: false, findings: ["foreign block pink_wool ×6 (e.g. 2,1,3)"] },
      { name: "watertight", passed: true, findings: [] },
    ],
  };
  const prompt = buildWorkshopPrompt({
    program: PROGRAM, pack: PACK, round: 2, budget: 4,
    liveActions: liveActionNames(DEFAULT_APPLIERS),
    azimuths: ["+x+z", "+x-z", "-x-z", "-x+z"],
    conformance,
    lastRound: { action: { action: "adjust-params", elementId: "shell", params: { height: 9 } }, accepted: false, reason: "regressed watertight" },
  });
  assert.match(prompt, /round 2 of 4/);
  assert.match(prompt, /1\. the CONCEPT/);
  assert.match(prompt, /azimuth 315° \(-x\+z\)/);
  assert.match(prompt, /live now: adjust-params, spray-paint\)/); // re-recognize NOT live by default
  assert.match(prompt, /wall\.field: oak_planks/);
  assert.match(prompt, /palette-in-pack: FAIL — foreign block pink_wool/);
  assert.match(prompt, /watertight: PASS/);
  assert.match(prompt, /ROLLED BACK \(regressed watertight\)/);
  assert.match(prompt, /"decision": "revise" \| "done"/);
  assert.match(prompt, new RegExp(`at most ${MAX_ISSUES} issues`));
  assert.match(prompt, /"elements"/); // the program is embedded
});

test("B2 the prompt is deterministic in its inputs", () => {
  const args = {
    program: PROGRAM, pack: PACK, round: 1, budget: 3,
    liveActions: ["adjust-params", "spray-paint"],
    azimuths: ["+x+z", "+x-z", "-x-z", "-x+z"],
    conformance: { checks: [] },
  };
  assert.equal(buildWorkshopPrompt(args), buildWorkshopPrompt(args));
});
