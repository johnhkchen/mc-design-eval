// Unit suite for the judge-reply robustness policy (T-114-01, S-114, E-29).
// No network, no I/O: synthetic ask thunks and synthetic malformed replies throughout; one
// realism case runs the real multi-angle parser over the church 225° failure shape (a fenced,
// truncated JSON object — the incident this ticket exists for).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyReply, nextAction, runReplyPolicy, MAX_REPLY_ATTEMPTS, RAW_REPLY_CLIP,
} from "./judge-reply.mjs";
import { parseMultiAngleVerdict } from "./multi-angle-gate.mjs";

const VALID = JSON.stringify({
  verdict: "drifted",
  gaps: [{ region: "roof", attribute: "form", severity: "major" }],
  rationale: "fragmented ridge",
});
// the church 225° shape: fenced JSON cut off mid-string (truncated generation)
const TRUNCATED = '```json\n{"verdict":"different object","gaps":[{"region":"overall massing","attribute';

// a parse for shape-only tests: "ok" parses, anything else throws
const toyParse = (t) => {
  if (t === "ok") return { verdict: "ok" };
  throw new Error(`toy: unparseable ${JSON.stringify(t).slice(0, 30)}`);
};

const bad = () => ({ parsed: false, parseError: "synthetic" });
const good = () => ({ parsed: true });

// --- the declared bound -------------------------------------------------------

test("the bound is declared: 1 initial ask + 2 re-asks", () => {
  assert.equal(MAX_REPLY_ATTEMPTS, 3);
});

// --- classifyReply -------------------------------------------------------------

test("classifyReply: a valid reply is a FINAL verdict; never throws on content", () => {
  const c = classifyReply(VALID, parseMultiAngleVerdict);
  assert.equal(c.parsed, true);
  assert.equal(c.verdict.verdict, "drifted");
});

test("classifyReply: the church truncated reply is MALFORMED, with the parser's evidence", () => {
  const c = classifyReply(TRUNCATED, parseMultiAngleVerdict);
  assert.equal(c.parsed, false);
  assert.match(c.error, /not JSON/);
});

test("classifyReply: prose and empty replies are malformed states, not crashes", () => {
  assert.equal(classifyReply("looks fine to me", parseMultiAngleVerdict).parsed, false);
  assert.equal(classifyReply("   ", parseMultiAngleVerdict).parsed, false);
});

// --- nextAction: the structural no-re-roll proof --------------------------------

test("nextAction: empty ledger asks; all-malformed under the bound asks; at the bound refuses", () => {
  assert.equal(nextAction([]), "ask");
  assert.equal(nextAction([bad()]), "ask");
  assert.equal(nextAction([bad(), bad()]), "ask");
  assert.equal(nextAction([bad(), bad(), bad()]), "refuse");
});

test("NO RE-ROLL BY CONSTRUCTION: a parsed entry anywhere is final for EVERY bound", () => {
  for (const maxAttempts of [1, 2, 3, 10]) {
    assert.equal(nextAction([good()], { maxAttempts }), "final");
    assert.equal(nextAction([bad(), good()], { maxAttempts }), "final");
    assert.equal(nextAction([bad(), good(), bad()], { maxAttempts }), "final"); // even a corrupt tail cannot re-open it
  }
});

test("nextAction: a malformed ledger is a caller bug — throws", () => {
  assert.throws(() => nextAction("nope"), /must be an array/);
  assert.throws(() => nextAction([{ status: "?" }]), /boolean \.parsed/);
  assert.throws(() => nextAction([], { maxAttempts: 0 }), /positive integer/);
});

// --- runReplyPolicy: the AC pair -------------------------------------------------

test("recovers on attempt 2: malformed then valid → verdict final, both replies ledgered", async () => {
  const texts = [TRUNCATED, VALID];
  let calls = 0;
  const ask = async () => ({ text: texts[calls++], usage: { output_tokens: 100 + calls } });
  const r = await runReplyPolicy(ask, { parse: parseMultiAngleVerdict });
  assert.equal(r.askCount, 2);
  assert.equal(r.verdict.verdict, "drifted");
  assert.equal(r.replies.length, 2);
  assert.deepEqual(r.replies.map((x) => x.parsed), [false, true]);
  assert.deepEqual(r.replies.map((x) => x.attempt), [1, 2]);
  assert.match(r.replies[0].parseError, /not JSON/);
  assert.equal(r.replies[0].source, "live");
  assert.deepEqual(r.replies[1].usage, { output_tokens: 102 }); // per-attempt usage rides the ledger
});

test("exhausts to refusal: every attempt malformed → null verdict, full ledger committed", async () => {
  let calls = 0;
  const ask = async () => (calls++, { text: TRUNCATED });
  const r = await runReplyPolicy(ask, { parse: parseMultiAngleVerdict });
  assert.equal(r.verdict, null);
  assert.equal(r.askCount, MAX_REPLY_ATTEMPTS);
  assert.equal(r.replies.length, MAX_REPLY_ATTEMPTS);
  assert.ok(r.replies.every((x) => x.parsed === false && x.parseError));
});

// --- runReplyPolicy: no re-roll, driver side ---------------------------------------

test("a parsed verdict short-circuits: first ask valid → exactly one ask, ever", async () => {
  let calls = 0;
  const ask = async () => (calls++, { text: "ok" });
  const r = await runReplyPolicy(ask, { parse: toyParse, maxAttempts: 3 });
  assert.equal(calls, 1);
  assert.equal(r.askCount, 1);
  assert.deepEqual(r.verdict, { verdict: "ok" });
});

test("the policy cannot be invoked on a parsed reply: seeded parsed ⇒ ZERO asks", async () => {
  let calls = 0;
  const ask = async () => (calls++, { text: "ok" });
  const r = await runReplyPolicy(ask, { parse: toyParse, seed: [{ parsed: true }] });
  assert.equal(calls, 0);
  assert.equal(r.askCount, 0);
  assert.equal(r.replies.length, 1);
  assert.equal(r.replies[0].source, "committed");
});

// --- runReplyPolicy: seeding (the re-judge mode's path) -----------------------------

test("a seeded malformed attempt counts toward the bound: 1 seed + all-malformed → 2 live asks", async () => {
  let calls = 0;
  const ask = async () => (calls++, { text: "nope" });
  const seed = [{ parsed: false, parseError: "committed truncation", rawReply: TRUNCATED, usage: { output_tokens: 226 } }];
  const r = await runReplyPolicy(ask, { parse: toyParse, seed });
  assert.equal(calls, 2);
  assert.equal(r.replies.length, 3);
  assert.equal(r.replies[0].source, "committed");
  assert.equal(r.replies[0].parseError, "committed truncation");
  assert.deepEqual(r.replies[0].usage, { output_tokens: 226 });
  assert.deepEqual(r.replies.map((x) => x.attempt), [1, 2, 3]);
  assert.ok(r.replies.slice(1).every((x) => x.source === "live"));
});

test("seeded malformed then live recovery: the church re-judge happy path", async () => {
  const ask = async () => ({ text: VALID, usage: { output_tokens: 500 } });
  const seed = [{ parsed: false, parseError: "not JSON", rawReply: TRUNCATED }];
  const r = await runReplyPolicy(ask, { parse: parseMultiAngleVerdict, seed });
  assert.equal(r.askCount, 1);
  assert.equal(r.verdict.verdict, "drifted");
  assert.deepEqual(r.replies.map((x) => [x.attempt, x.parsed, x.source]),
    [[1, false, "committed"], [2, true, "live"]]);
});

test("a malformed seed entry is a caller bug — throws before any ask", async () => {
  await assert.rejects(
    runReplyPolicy(async () => ({ text: "ok" }), { parse: toyParse, seed: [{ note: "no parsed flag" }] }),
    /seed\[0\] must carry a boolean \.parsed/);
});

// --- runReplyPolicy: transport throws are malformed attempts, not crashes -------------

test("a thrown ask is ledgered {transport:true} and the next attempt can recover", async () => {
  let calls = 0;
  const ask = async () => {
    calls++;
    if (calls === 1) throw new Error("claude -p produced no result (exit 1)");
    return { text: "ok" };
  };
  const r = await runReplyPolicy(ask, { parse: toyParse });
  assert.equal(r.askCount, 2);
  assert.deepEqual(r.verdict, { verdict: "ok" });
  assert.equal(r.replies[0].parsed, false);
  assert.equal(r.replies[0].transport, true);
  assert.match(r.replies[0].parseError, /^transport: claude -p produced no result/);
  assert.equal(r.replies[0].rawReply, null);
});

test("all-transport-failure exhausts to refusal like any malformed run", async () => {
  const ask = async () => { throw new Error("spawn ENOENT"); };
  const r = await runReplyPolicy(ask, { parse: toyParse });
  assert.equal(r.verdict, null);
  assert.equal(r.replies.length, MAX_REPLY_ATTEMPTS);
  assert.ok(r.replies.every((x) => x.transport === true));
});

// --- ledger hygiene ---------------------------------------------------------------------

test("rawReply is clipped to RAW_REPLY_CLIP on both seed and live entries", async () => {
  const long = "x".repeat(RAW_REPLY_CLIP * 3);
  let first = true;
  const ask = async () => { const t = first ? long : "ok"; first = false; return { text: t }; };
  const r = await runReplyPolicy(ask, {
    parse: toyParse, seed: [{ parsed: false, rawReply: long, parseError: "seeded" }],
  });
  assert.equal(r.replies[0].rawReply.length, RAW_REPLY_CLIP);
  assert.equal(r.replies[1].rawReply.length, RAW_REPLY_CLIP);
  assert.deepEqual(r.verdict, { verdict: "ok" });
});

test("the driver validates its inputs", async () => {
  await assert.rejects(runReplyPolicy("not a fn", { parse: toyParse }), /ask must be a function/);
  await assert.rejects(runReplyPolicy(async () => ({ text: "ok" }), {}), /parse must be a function/);
  await assert.rejects(runReplyPolicy(async () => ({ text: "ok" }), { parse: toyParse, seed: "x" }), /seed must be an array/);
});
