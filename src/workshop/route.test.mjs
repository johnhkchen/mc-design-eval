// Layer B router pure-core pins (T-164-02, story S-164, epic E-39). The serializer is single-sourced and
// deterministic, the membership gate throws on a dead-end dispatch, and the verdict adapter declares the
// loop's terminal decision while carrying the resolved trace in the envelope. No GL, no model.

import { test } from "node:test";
import assert from "node:assert/strict";

import { idiomNames } from "../pack/idiom-registry.mjs";
import { DEPARTMENTS, departmentToIdioms } from "../pack/departments.mjs";
import {
  ROUTE_SCHEMA, critiqueBlock, departmentIdiomsBlock, routeRenderArgs, resolveDispatch, dispatchToVerdict,
} from "./route.mjs";

const CRITIQUE = {
  items: [
    { department: "ROOF", expected: "dark steep gable", present: "pale flat", missing: "the dark field", severity: "major" },
    { department: "WALL", expected: "dressed quoins", present: "flat cobble", missing: "the quoins", severity: "major" },
    { department: "OPENING", expected: "wagon doors", present: "plain holes", missing: "the leaves", severity: "minor" },
  ],
};

const GOOD_DISPATCH = {
  items: [
    { department: "ROOF", idiom: "roof.gable", why: "rebuild the steep dark field" },
    { department: "WALL", idiom: "quoin", why: "add the dressed corner runs" },
    { department: "OPENING", idiom: "opening-dressing", why: "dress the holes into wagon doors" },
  ],
};

test("RT1 routeRenderArgs serializes the critique + the menu, deterministically", () => {
  const a = routeRenderArgs({ critique: CRITIQUE });
  const b = routeRenderArgs({ critique: CRITIQUE });
  assert.deepEqual(a, b, "deterministic in its inputs");
  assert.equal(ROUTE_SCHEMA, "dispatch/v1");
  // critique_block names every item's department + triple
  for (const it of CRITIQUE.items) {
    assert.match(a.critique_block, new RegExp(it.department));
    assert.match(a.critique_block, new RegExp(it.missing.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  // department_idioms_block lists all 5 departments
  for (const d of DEPARTMENTS) assert.match(a.department_idioms_block, new RegExp(`${d}:`));
});

test("RT2 departmentIdiomsBlock is single-sourced from the registry (no hand-list drift)", () => {
  const block = departmentIdiomsBlock();
  // every idiom on every line resolves via departmentToIdioms; the union equals idiomNames()
  const listed = [];
  for (const line of block.split("\n")) {
    const m = line.match(/^\s*([A-Z]+):\s*(.*)$/);
    assert.ok(m, `line is "DEPT: idioms": ${line}`);
    const [, dept, rest] = m;
    const names = rest.split(", ").filter(Boolean);
    assert.deepEqual(names, departmentToIdioms(dept), `${dept} idioms must equal departmentToIdioms`);
    listed.push(...names);
  }
  assert.deepEqual(listed.sort(), [...idiomNames()].sort(), "the menu must cover exactly the registry");
});

test("RT3 resolveDispatch validates membership and throws on a dead-end", () => {
  const ok = resolveDispatch(GOOD_DISPATCH);
  assert.equal(ok.length, 3);
  assert.ok(Object.isFrozen(ok) && Object.isFrozen(ok[0]), "frozen");
  // empty items — the emptied-list-is-malformed classification
  assert.throws(() => resolveDispatch({ items: [] }), /no items/);
  assert.throws(() => resolveDispatch({}), /no items/);
  // an idiom outside its department's set — the "unbuildable idiom" failure
  assert.throws(
    () => resolveDispatch({ items: [{ department: "WALL", idiom: "roof.gable", why: "x" }] }),
    /is not in department WALL/,
  );
  // an unknown department
  assert.throws(
    () => resolveDispatch({ items: [{ department: "ATTIC", idiom: "roof.gable", why: "x" }] }),
    /not a known department/,
  );
  // empty why
  assert.throws(
    () => resolveDispatch({ items: [{ department: "ROOF", idiom: "roof.gable", why: "  " }] }),
    /why must be a non-empty string/,
  );
});

test("RT4 dispatchToVerdict: terminal decision, issues mirror the critique, trace in the envelope", () => {
  const { verdict, dispatch } = dispatchToVerdict({ critique: CRITIQUE, dispatch: GOOD_DISPATCH });
  assert.equal(verdict.decision, "done", "applying a routed idiom is the generator gap — done after logging");
  assert.equal(verdict.action, null, "no loop action (idioms are not wired appliers)");
  assert.equal(verdict.critique.issues.length, 3, "the diagnosis is ledgered as loop issues");
  assert.deepEqual(verdict.critique.issues.map((i) => i.region), ["ROOF", "WALL", "OPENING"]);
  assert.deepEqual(verdict.critique.issues.map((i) => i.severity), ["major", "major", "minor"]);
  assert.match(verdict.rationale, /ROOF→roof\.gable/, "rationale names the worst item's routing");
  // the resolved dispatch rides ALONGSIDE the verdict (the runner logs it; loop.mjs untouched)
  assert.equal(dispatch.length, 3);
  assert.deepEqual(dispatch.map((d) => d.idiom), ["roof.gable", "quoin", "opening-dressing"]);
  // a dead-end dispatch propagates the throw (the verdict can't be built from an unbuildable routing)
  assert.throws(() => dispatchToVerdict({
    critique: CRITIQUE, dispatch: { items: [{ department: "ROOF", idiom: "chimney", why: "x" }] },
  }), /is not in department ROOF/);
});
