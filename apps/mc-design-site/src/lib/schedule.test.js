import { test } from "node:test";
import assert from "node:assert/strict";
import { schedule, criticalPath } from "./schedule.js";

const pool = { cannons: 2, secPerBlock: 3600, setupMin: 0 };
const job = (id, work, deps = [], status = "queued") => ({ id, kind: "cannon", project: "p", seq: 0, work, deps, status });

test("independent jobs spread over cannons; a dependent job waits", () => {
  const s = schedule([job("a", 2), job("b", 1), job("c", 1, ["a"])], pool);
  const at = Object.fromEntries(s.bars.map((b) => [b.t.id, b]));
  assert.equal(at.a.c !== at.b.c, true);
  assert.equal(at.c.s, 2);
  assert.equal(s.end, 3);
});

test("dropped prerequisites don't block, and critical path follows the longest chain", () => {
  const tasks = [job("a", 5, [], "dropped"), job("b", 1), job("c", 2, ["a", "b"])];
  assert.equal(schedule(tasks, pool).end, 3);
  assert.equal(criticalPath(tasks, pool), 3);
});
