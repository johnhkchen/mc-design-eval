// Tests for the shared agent-reply parser (T-200-01, story S-200, epic E-49). The first-balanced-brace
// extractor is the leaf both climb runners depend on; it is correct (or not) independent of any metered run,
// so it gates `npm test`. AR1 is the exact crash the naive slice(firstBrace,lastBrace) form threw on
// (two objects in one reply) — the latent crash T-198 found and this module ports.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseFirstJsonObject } from "./agent-reply.mjs";

// AR1 — two objects in one reply (THE crash case): return the FIRST, ignore the rest.
test("AR1: two-object reply returns the first object", () => {
  const r = parseFirstJsonObject('{"tool":"close_shell"}{"tool":"done"}');
  assert.deepEqual(r, { tool: "close_shell" });
});

// AR2 — object followed by trailing prose.
test("AR2: object + trailing prose ignores the prose", () => {
  const r = parseFirstJsonObject('{"tool":"done","reason":"x"}  Note: I picked done.');
  assert.deepEqual(r, { tool: "done", reason: "x" });
});

// AR3 — nested braces: a single inner `}` must not terminate early.
test("AR3: nested braces are tracked by depth", () => {
  const r = parseFirstJsonObject('{"a":{"b":1},"c":2}');
  assert.deepEqual(r, { a: { b: 1 }, c: 2 });
});

// AR4 — a `}` inside a string must not terminate the object.
test("AR4: brace inside a string does not terminate", () => {
  const r = parseFirstJsonObject('{"reason":"close the } gap"}');
  assert.deepEqual(r, { reason: "close the } gap" });
});

// AR5 — an escaped quote inside a string keeps the string open.
test("AR5: escaped quote inside a string is handled", () => {
  const r = parseFirstJsonObject('{"reason":"a \\" b"}');
  assert.deepEqual(r, { reason: 'a " b' });
});

// AR6 — leading prose before the first object.
test("AR6: leading prose then object finds the first brace", () => {
  const r = parseFirstJsonObject('Here you go: {"tool":"done"}');
  assert.deepEqual(r, { tool: "done" });
});

// AR7 — no object at all throws a descriptive error.
test("AR7: no JSON object throws", () => {
  assert.throws(() => parseFirstJsonObject("no json here"), /no JSON object/);
});

// AR8 — an unbalanced object (never closes) throws.
test("AR8: unbalanced object throws", () => {
  assert.throws(() => parseFirstJsonObject('{"tool":"x"'), /unbalanced/);
});
