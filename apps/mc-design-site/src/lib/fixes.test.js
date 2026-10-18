import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRows, reconcile, issueId, handleFixes } from "./fixes.js";

const row = (b, kind, at) => checkRows(b, "v1", [{ kind, at, what: kind }])[0];

test("a check issue keeps its id across re-checks, so a waived one stays waived", () => {
  assert.equal(row("a", "floating shutter", [1, 2, 3]).id, row("a", "floating shutter", [1, 2, 3]).id);
  assert.notEqual(row("a", "floating shutter", [1, 2, 3]).id, row("a", "floating shutter", [1, 2, 4]).id);
  const waived = { ...row("a", "no front door", null), status: "waived" };
  const { inserts, updates } = reconcile([waived], [row("a", "no front door", null)]);
  assert.equal(inserts.length, 0); assert.ok(!updates.some((u) => u.status));
});

test("an open issue the check no longer finds is fixed; a fixed one found again is open", () => {
  const a = row("a", "way in", [4, 2, 0]), b = { ...row("a", "dark room", [1, 1, 1]), status: "fixed" };
  const { inserts, updates } = reconcile([a, b], [row("a", "dark room", [1, 1, 1])]);
  assert.deepEqual(inserts, []);
  assert.deepEqual(updates.find((u) => u.id === a.id).status, "fixed");
  assert.deepEqual(updates.find((u) => u.id === b.id).status, "open");
});

test("jobs and reports need a sign-in; viewing doesn't", async () => {
  const store = { listIssues: async () => [], listJobs: async () => [] };
  assert.equal((await handleFixes({ method: "GET", path: "/api/issues", canWrite: false }, store)).status, 200);
  assert.equal((await handleFixes({ method: "POST", path: "/api/fix-jobs", body: { kind: "x", buildings: ["a"] }, canWrite: false }, store)).status, 401);
  assert.equal(issueId({ source: "person", building: "a", kind: "k", at: null, what: "w" }).startsWith("p-"), true);
});
