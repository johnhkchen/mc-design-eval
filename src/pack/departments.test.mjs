// Department-taxonomy conformance (T-163-01, story S-163, epic E-39). The single-composition-point
// tripwire: the partition over the LIVE idiom registry must be total and disjoint, every department
// must name ≥1 idiom, and the BAML `enum Department` must mirror DEPARTMENTS exactly. These are the
// drift guards E-39 hard rule 2 demands — the judge and the builder cannot disagree about the
// vocabulary if both are pinned here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { idiomNames } from "./idiom-registry.mjs";
import { DEPARTMENTS, departmentOf, departmentToIdioms, departmentPartition } from "./departments.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// The four SPECIFIC predicates, re-declared here independently of departments.mjs so the test is a
// genuine check, not a tautology against the same array. Disjointness is asserted, not assumed.
const SPECIFIC = {
  ROOF: (n) => n.startsWith("roof.") || n === "dormer" || n === "surface.roof-courses",
  OPENING: (n) => n.startsWith("head.") || n === "arch" || n === "opening-dressing",
  CHIMNEY: (n) => n === "chimney",
  ROOM: (n) => n === "hollow" || n === "floorplan",
};

test("DPT1 the partition over the live registry is total and disjoint", () => {
  const names = idiomNames();
  // total: every idiom maps without throwing
  for (const n of names) assert.doesNotThrow(() => departmentOf(n), `departmentOf("${n}") threw`);
  // disjoint: no idiom matches more than one SPECIFIC predicate (the "serves two departments" trap)
  for (const n of names) {
    const hits = Object.entries(SPECIFIC).filter(([, p]) => p(n)).map(([d]) => d);
    assert.ok(hits.length <= 1, `idiom "${n}" matches ${hits.length} specific departments: ${hits.join(", ")}`);
  }
  // round-trip: the union of departmentToIdioms over DEPARTMENTS reconstructs idiomNames(), no dupes
  const rebuilt = DEPARTMENTS.flatMap((d) => departmentToIdioms(d)).sort();
  assert.deepEqual(rebuilt, [...names].sort(), "partition does not reconstruct idiomNames()");
  assert.equal(new Set(rebuilt).size, rebuilt.length, "an idiom landed in two departments");
});

test("DPT2 every department names at least one idiom", () => {
  for (const d of DEPARTMENTS) {
    assert.ok(departmentToIdioms(d).length > 0, `department "${d}" names no idiom`);
  }
});

test("DPT3 the BAML enum Department mirrors DEPARTMENTS exactly (composition-point drift)", () => {
  const baml = readFileSync(join(ROOT, "baml_src/department.baml"), "utf8");
  const m = baml.match(/enum\s+Department\s*\{([^}]*)\}/);
  assert.ok(m, "no `enum Department { … }` block in baml_src/department.baml");
  const values = m[1]
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, "").trim()) // strip inline comments
    .filter(Boolean);
  assert.deepEqual(new Set(values), new Set(DEPARTMENTS), "the .baml enum drifted from DEPARTMENTS");
});

test("DPT4 departmentToIdioms seam: validates input, sorted output, known memberships", () => {
  assert.throws(() => departmentToIdioms("ATTIC"), /unknown department/, "must reject an unknown department");
  const roof = departmentToIdioms("ROOF");
  assert.deepEqual(roof, [...roof].sort(), "output must be sorted");
  assert.ok(roof.includes("roof.gable") && roof.includes("dormer"), "ROOF must own roof.gable + dormer");
  assert.ok(departmentToIdioms("WALL").includes("plinth"), "WALL must own plinth");
  assert.ok(departmentToIdioms("OPENING").includes("arch"), "OPENING must own arch");
  assert.ok(departmentToIdioms("CHIMNEY").includes("chimney"), "CHIMNEY must own chimney");
  assert.deepEqual(departmentToIdioms("ROOM").sort(), ["floorplan", "hollow"], "ROOM = {hollow, floorplan}");
  // the partition view agrees with the seam
  const part = departmentPartition();
  assert.deepEqual(part.ROOM.sort(), ["floorplan", "hollow"]);
});
