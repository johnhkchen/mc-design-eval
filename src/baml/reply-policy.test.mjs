// Tests for the shared async reply policy (T-131-01) — T-114 semantics with injected seams.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runAsyncReplyPolicy, MAX_REPLY_ATTEMPTS, RAW_REPLY_CLIP } from "./reply-policy.mjs";

const okParse = async (text) => JSON.parse(text);

function askSeq(outcomes) {
  let i = 0;
  const calls = [];
  const ask = async () => {
    const o = outcomes[Math.min(i++, outcomes.length - 1)];
    calls.push(o);
    if (o.throw) throw new Error(o.throw);
    return { text: o.text, raw: o.raw };
  };
  return { ask, calls };
}

test("RP1 a parsed reply is FINAL — one ask, accepted, ledgered as parsed", async () => {
  const { ask, calls } = askSeq([{ text: '{"a":1}', raw: { usage: { in: 5 } } }]);
  const r = await runAsyncReplyPolicy({ ask, parse: okParse });
  assert.equal(r.accepted, true);
  assert.deepEqual(r.expected, { a: 1 });
  assert.equal(r.askCount, 1);
  assert.equal(calls.length, 1, "no re-ask after a parse");
  assert.deepEqual(r.rawTexts, ['{"a":1}']);
  assert.deepEqual(r.replies, [
    { attempt: 1, parsed: true, rawReply: '{"a":1}', usage: { in: 5 }, source: "live" },
  ]);
});

test("RP2 malformed replies re-ask up to the budget, then refuse with the full ledger", async () => {
  const { ask } = askSeq([{ text: "not json" }]);
  const r = await runAsyncReplyPolicy({ ask, parse: okParse });
  assert.equal(r.accepted, false);
  assert.equal(r.expected, null);
  assert.equal(r.askCount, MAX_REPLY_ATTEMPTS);
  assert.equal(r.replies.length, MAX_REPLY_ATTEMPTS);
  assert.equal(r.rawTexts.length, MAX_REPLY_ATTEMPTS, "every live raw kept in full");
  for (const [i, e] of r.replies.entries()) {
    assert.equal(e.attempt, i + 1);
    assert.equal(e.parsed, false);
    assert.ok(e.parseError);
  }
});

test("RP3 malformed-then-parsed accepts on the later attempt", async () => {
  const { ask } = askSeq([{ text: "garbage" }, { text: '{"b":2}' }]);
  const r = await runAsyncReplyPolicy({ ask, parse: okParse });
  assert.equal(r.accepted, true);
  assert.deepEqual(r.expected, { b: 2 });
  assert.equal(r.askCount, 2);
  assert.deepEqual(r.replies.map((e) => e.parsed), [false, true]);
});

test("RP4 a transport throw is flagged, never kills the loop, and carries no raw text", async () => {
  const { ask } = askSeq([{ throw: "ECONNRESET" }, { text: '{"c":3}' }]);
  const r = await runAsyncReplyPolicy({ ask, parse: okParse });
  assert.equal(r.accepted, true);
  assert.equal(r.replies[0].transport, true);
  assert.equal(r.replies[0].rawReply, null);
  assert.match(r.replies[0].parseError, /^transport: ECONNRESET/);
  assert.equal(r.rawTexts.length, 1, "transport attempts contribute no raw text");
});

test("RP5 rawReply is clipped, rawTexts are not", async () => {
  const long = "x".repeat(RAW_REPLY_CLIP + 100);
  const { ask } = askSeq([{ text: long }]);
  const r = await runAsyncReplyPolicy({ ask, parse: okParse, maxAttempts: 1 });
  assert.equal(r.replies[0].rawReply.length, RAW_REPLY_CLIP);
  assert.equal(r.rawTexts[0].length, long.length);
});

test("RP6 maxAttempts is honored when overridden", async () => {
  const { ask, calls } = askSeq([{ text: "nope" }]);
  const r = await runAsyncReplyPolicy({ ask, parse: okParse, maxAttempts: 1 });
  assert.equal(r.accepted, false);
  assert.equal(calls.length, 1);
});
