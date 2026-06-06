// Tests for the robust detector-reply JSON extractor (T-082-01).

import { test } from "node:test";
import assert from "node:assert/strict";
import { firstBalancedObject, parseJsonReply } from "./json-reply.mjs";

test("firstBalancedObject slices the first balanced object, ignoring trailing junk", () => {
  assert.equal(firstBalancedObject('{"a":1} and then prose'), '{"a":1}');
  assert.equal(firstBalancedObject("noise {\"a\":{\"b\":2}} tail"), '{"a":{"b":2}}');
  assert.equal(firstBalancedObject("no braces here"), null);
});

test("firstBalancedObject is string-aware (braces inside strings don't miscount)", () => {
  assert.equal(firstBalancedObject('{"note":"a } b"} rest'), '{"note":"a } b"}');
  assert.equal(firstBalancedObject('{"note":"esc \\" } still"} x'), '{"note":"esc \\" } still"}');
});

test("parseJsonReply handles clean JSON, fences, and FENCE-THEN-PROSE (the live failure)", () => {
  assert.deepEqual(parseJsonReply('{"patches":[]}'), { patches: [] });
  assert.deepEqual(parseJsonReply('```json\n{"patches":[]}\n```'), { patches: [] });
  // the exact shape the live light tier returned: fenced object, then commentary
  const live = '```json\n{ "patches": [] }\n```\n\nLooking at the top-down render, the roof…';
  assert.deepEqual(parseJsonReply(live), { patches: [] });
});

test("parseJsonReply throws (message includes 'not JSON') when nothing parses", () => {
  assert.throws(() => parseJsonReply("absolutely not json"), /not JSON/);
});
