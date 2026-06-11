// Unit tests for ask.mjs (T-130-01) — the shared bounded same-prompt re-ask. Spawn-free and
// spend-free: transport and parse are injected scripts; the bridge and the shim never run.
import { test } from "node:test";
import assert from "node:assert/strict";

import { askParsed, RAW_REPLY_CLIP } from "./ask.mjs";
import { MAX_REPLY_ATTEMPTS } from "../form/judge-reply.mjs";

/** Scripted transport: each call shifts the next {text} | Error off the queue. */
const transportOf = (queue, log = []) => async ({ prompt, model }) => {
  log.push({ prompt, model });
  const next = queue.shift();
  if (next instanceof Error) throw next;
  return { text: next.text, raw: { usage: next.usage ?? { out: 1 } } };
};

/** Parse = JSON.parse via the injected seam (throws on non-JSON, like a SAP hard failure). */
const jsonParse = async ({ text }) => JSON.parse(text);

test("accepts on the first parsed reply; ledger and raws complete", async () => {
  const log = [];
  const r = await askParsed({
    fn: "F", prompt: "P", model: "m",
    transport: transportOf([{ text: '{"a":1}', usage: { tok: 7 } }], log),
    parse: jsonParse,
  });
  assert.deepEqual(r.expected, { a: 1 });
  assert.equal(r.askCount, 1);
  assert.deepEqual(r.rawTexts, ['{"a":1}']);
  assert.deepEqual(r.replies, [{ attempt: 1, parsed: true, rawReply: '{"a":1}', usage: { tok: 7 }, source: "live" }]);
  assert.deepEqual(log, [{ prompt: "P", model: "m" }]);
});

test("a parse failure re-asks the SAME prompt; the second reply is final", async () => {
  const log = [];
  const r = await askParsed({
    fn: "F", prompt: "P", model: "m",
    transport: transportOf([{ text: "not json" }, { text: '{"ok":true}' }], log),
    parse: jsonParse,
  });
  assert.deepEqual(r.expected, { ok: true });
  assert.equal(r.askCount, 2);
  assert.equal(r.replies[0].parsed, false);
  assert.ok(r.replies[0].parseError);
  assert.equal(r.replies[1].parsed, true);
  assert.deepEqual(r.rawTexts, ["not json", '{"ok":true}']);
  assert.ok(log.every((c) => c.prompt === "P"), "the prompt is never mutated between attempts");
});

test("a gate failure is MALFORMED (re-ask), recorded as gateError, never a throw", async () => {
  const r = await askParsed({
    fn: "F", prompt: "P", model: "m",
    transport: transportOf([{ text: '{"roles":[]}' }, { text: '{"roles":[1]}' }]),
    parse: jsonParse,
    classify: (p) => (p.roles.length ? { ok: true } : { ok: false, reason: "empty union (FX-D1)" }),
  });
  assert.deepEqual(r.expected, { roles: [1] });
  assert.equal(r.replies[0].parsed, false);
  assert.equal(r.replies[0].gateError, "empty union (FX-D1)");
  assert.equal(r.replies[1].parsed, true);
});

test("budget exhaustion returns expected null with the full honest ledger", async () => {
  const r = await askParsed({
    fn: "F", prompt: "P", model: "m",
    transport: transportOf(Array.from({ length: MAX_REPLY_ATTEMPTS }, (_, i) => ({ text: `junk${i}` }))),
    parse: jsonParse,
  });
  assert.equal(r.expected, null);
  assert.equal(r.askCount, MAX_REPLY_ATTEMPTS);
  assert.equal(r.replies.length, MAX_REPLY_ATTEMPTS);
  assert.ok(r.replies.every((e) => e.parsed === false && e.parseError));
});

test("a transport throw is flagged, costs an attempt, and the loop continues", async () => {
  const r = await askParsed({
    fn: "F", prompt: "P", model: "m",
    transport: transportOf([new Error("shim down"), { text: '{"b":2}' }]),
    parse: jsonParse,
  });
  assert.deepEqual(r.expected, { b: 2 });
  assert.equal(r.replies[0].transport, true);
  assert.match(r.replies[0].parseError, /transport: shim down/);
  assert.equal(r.replies[0].rawReply, null);
  assert.equal(r.rawTexts.length, 1, "a transport failure produces no raw text");
});

test("ledger rawReply is clipped; rawTexts carry the full reply", async () => {
  const long = '{"pad":"' + "x".repeat(2 * RAW_REPLY_CLIP) + '"}';
  const r = await askParsed({
    fn: "F", prompt: "P", model: "m",
    transport: transportOf([{ text: long }]),
    parse: jsonParse,
  });
  assert.equal(r.replies[0].rawReply.length, RAW_REPLY_CLIP);
  assert.equal(r.rawTexts[0], long);
});
