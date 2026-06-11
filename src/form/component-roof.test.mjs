// componentGableGroups — pure tests (T-110-01). Synthetic two-mass record + the COMMITTED church
// component record (the multi-roof subject that motivated the seam: nave mass-0 / tower mass-1).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { componentGableGroups } from "./component-roof.mjs";
import { gablesFromRecord } from "./roof-fit.mjs";

const gable = (id, planeIds) => ({ id, sides: planeIds.map((planeId) => ({ planeId })) });

const RECORD = {
  schema: "component-record/v1",
  masses: [
    { id: "mass-0", role: "primary" },
    { id: "mass-1", role: "attached" },
    { id: "mass-2", role: "attached" },
  ],
  roofPlanes: [
    { id: "roof-0", massId: "mass-0", kind: "pitched" },
    { id: "roof-1", massId: "mass-0", kind: "pitched" },
    { id: "roof-2", massId: "mass-1", kind: "pitched" },
    { id: "roof-3", massId: "mass-1", kind: "pitched" },
    { id: "roof-4", massId: "mass-2", kind: "pitched" }, // pitched but never paired
    { id: "roof-5", massId: "mass-2", kind: "flat" },
  ],
};

test("componentGableGroups: groups by mass, primary first, insane gables stay in their group", () => {
  const g0 = gable("gable-roof-2-roof-3", ["roof-2", "roof-3"]); // attached mass listed FIRST on purpose
  const g1 = { ...gable("gable-roof-0-roof-1", ["roof-0", "roof-1"]), sane: false };
  const { groups, findings } = componentGableGroups({ record: RECORD, gables: [g0, g1] });
  assert.deepEqual(groups.map((g) => g.massId), ["mass-0", "mass-1"]); // primary-first, then id order
  assert.equal(groups[0].role, "primary");
  assert.deepEqual(groups[0].gableIds, ["gable-roof-0-roof-1"]); // the insane gable is still grouped
  assert.deepEqual(groups[1].gableIds, ["gable-roof-2-roof-3"]);
  // mass-2 owns a pitched plane but no gable — named, not silent
  assert.ok(findings.some((f) => f.code === "component-roof-unfitted" && f.where === "mass-2"));
});

test("componentGableGroups: a gable spanning masses is named and grouped under its first side's mass", () => {
  const g = gable("gable-roof-1-roof-2", ["roof-1", "roof-2"]); // mass-0 + mass-1
  const { groups, findings } = componentGableGroups({ record: RECORD, gables: [g] });
  const f = findings.find((x) => x.code === "gable-spans-masses");
  assert.ok(f && f.where === "gable-roof-1-roof-2");
  assert.equal(groups.find((x) => x.gableIds.includes(g.id)).massId, "mass-0");
});

test("componentGableGroups: unresolved planes group alone with a named finding", () => {
  const g = gable("gable-x-y", ["nope-1", "nope-2"]);
  const { groups, findings } = componentGableGroups({ record: RECORD, gables: [g] });
  assert.ok(findings.some((f) => f.code === "gable-mass-unresolved" && f.where === "gable-x-y"));
  assert.equal(groups.find((x) => x.gableIds.includes("gable-x-y")).massId, "unresolved:gable-x-y");
});

test("componentGableGroups: the committed church record splits nave (mass-0) from tower (mass-1)", (t) => {
  const path = fileURLToPath(new URL("../../benchmarks/sculpture/components/church.json", import.meta.url));
  if (!existsSync(path)) return t.skip("no committed components/church.json");
  const record = JSON.parse(readFileSync(path, "utf8"));
  const fit = gablesFromRecord(record);
  const { groups } = componentGableGroups({ record, gables: fit.gables });
  const byMass = Object.fromEntries(groups.map((g) => [g.massId, g.gableIds]));
  assert.deepEqual(byMass["mass-0"].sort(), ["gable-roof-1-roof-5", "gable-roof-3-roof-7"]); // the nave
  assert.deepEqual(byMass["mass-1"], ["gable-roof-14-roof-15"]); // the tower
  assert.equal(groups[0].massId, "mass-0"); // primary first
  // the nave's sane gable rides in the primary group — the per-component swap has material to judge
  assert.ok(groups[0].gables.some((g) => g.sane));
});
