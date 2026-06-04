// Unit suite for the shared style briefs (T-005-01, AC #3/#4).
//
// STYLE_BRIEFS is pure frozen data with no prior direct coverage — it was only
// exercised indirectly via single-shot.test.mjs. This file documents the contract
// directly: each named style is present, the neoclassical brief names its defining
// features, and the map stays frozen. Offline and deterministic — no SDK, no network.

import { test } from "node:test";
import assert from "node:assert/strict";
import { STYLE_BRIEFS } from "./briefs.mjs";

test("STYLE_BRIEFS is a frozen map", () => {
  assert.ok(Object.isFrozen(STYLE_BRIEFS), "STYLE_BRIEFS is frozen");
});

test("industrial style is still present (no regression)", () => {
  assert.ok(STYLE_BRIEFS.industrial, "industrial entry exists");
  assert.equal(STYLE_BRIEFS.industrial.name, "industrial");
  assert.ok(STYLE_BRIEFS.industrial.brief.length > 0);
});

test("neoclassical style brief is present with matching name", () => {
  assert.ok(STYLE_BRIEFS.neoclassical, "neoclassical entry exists");
  assert.equal(STYLE_BRIEFS.neoclassical.name, "neoclassical");
  assert.ok(Object.isFrozen(STYLE_BRIEFS.neoclassical), "entry is frozen");
});

test("neoclassical brief names the defining neoclassical features", () => {
  const brief = STYLE_BRIEFS.neoclassical.brief;
  assert.match(brief, /symmetr/i, "names symmetry");
  assert.match(brief, /column|portico/i, "names columns/portico");
  assert.match(brief, /entablature|cornice/i, "names entablature/cornice");
  assert.match(brief, /pediment/i, "names a pediment");
  assert.match(brief, /stylobate|stepped/i, "names a stepped base/stylobate");
  assert.match(brief, /window/i, "names tall windows");
});

test("neoclassical brief pushes for detail and scale over a plain box", () => {
  const brief = STYLE_BRIEFS.neoclassical.brief;
  assert.match(brief, /detail/i, "asks for detail");
  assert.match(brief, /plain box/i, "discourages a plain box");
});
