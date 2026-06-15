// The construction DEPARTMENT taxonomy (T-163-01, story S-163, epic E-39) — the typed contract's
// vocabulary, DERIVED FROM the idiom registry (src/pack/idiom-registry.mjs, the single door to
// every build technique). E-39 replaces the fused scalar verdict with a two-layer feedback path:
// Layer A (diagnostic judge) names WHAT is wrong as CritiqueItem{department, …}; Layer B (router)
// maps each department to an available idiom. The department enum is the contract so the judge can
// only name departments the builder has tools for — the router never dead-ends.
//
// ONE COMPOSITION POINT (E-39 hard rule 2): DEPARTMENTS here is the authority. The BAML
// `enum Department` (baml_src/department.baml) is a checked MIRROR of it, and the registry
// partition is pinned to it — both by src/pack/departments.test.mjs. Nothing hand-lists the
// department vocabulary twice without a test catching the drift.
//
// GROUPING (the design decision, derived not hand-listed per idiom): four mutually-exclusive
// SPECIFIC predicates (ROOF/OPENING/CHIMNEY/ROOM) over idiom names, with WALL as the explicit
// envelope-and-its-cladding fall-through. An idiom that matched two specific predicates would be
// the "serves two departments" failure — departmentOf THROWS on it, loudly, and the conformance
// test proves disjointness against the live idiomNames().
//
// PROPORTION/MASSING IS A SEPARATE AXIS, NOT A DEPARTMENT (the recorded S-163 decision T-164/166
// depend on): the registry has NO idiom that resizes a mass — proportion is relational, fixed by
// `adjust-params` on a MASS id (the geometry levers in critique.baml), which is not a registry
// brush. A MASSING department would name zero idioms and break the partition; and the
// expected/present/missing triple is an element vocabulary (add/replace/remove), not resize. So
// proportion stays on the mass-params path; if a structured proportion critique is later needed,
// that is a schema-v2 axis (a follow-up), reported here rather than forced into a fake department.
//
// PURE — no GL/IO/Date/random. Keyed on idiom NAMES only; no per-subject (cottage/barn/…) constants.

import { idiomNames } from "./idiom-registry.mjs";

/** The construction departments. Sorted, frozen — the authority the .baml enum mirrors. */
export const DEPARTMENTS = Object.freeze(["CHIMNEY", "OPENING", "ROOF", "ROOM", "WALL"]);

/** The four SPECIFIC predicates (mutually exclusive by construction; WALL is the fall-through).
 *  Order is irrelevant — departmentOf counts matches and rejects ambiguity, never first-wins. */
const SPECIFIC = Object.freeze([
  ["ROOF", (n) => n.startsWith("roof.") || n === "dormer" || n === "surface.roof-courses"],
  ["OPENING", (n) => n.startsWith("head.") || n === "arch" || n === "opening-dressing"],
  ["CHIMNEY", (n) => n === "chimney"],
  ["ROOM", (n) => n === "hollow" || n === "floorplan"],
]);

/**
 * Resolve an idiom NAME to its construction department.
 * @param {string} name an idiom-registry name (e.g. "roof.gable", "plinth")
 * @returns {"ROOF"|"WALL"|"OPENING"|"CHIMNEY"|"ROOM"}
 * @throws if `name` matches more than one specific predicate (it serves two departments — the
 *         grouping is the finding; fix the predicates, do not paper over it).
 */
export function departmentOf(name) {
  const hits = SPECIFIC.filter(([, p]) => p(name)).map(([d]) => d);
  if (hits.length > 1) {
    throw new Error(`departments: idiom "${name}" matches ${hits.length} departments (${hits.join(", ")}) — the partition is ambiguous`);
  }
  return hits[0] ?? "WALL";
}

/** Validate `dept` is a known department or THROW (mirrors getIdiom's fail-on-unknown contract). */
function assertDepartment(dept) {
  if (!DEPARTMENTS.includes(dept)) {
    throw new Error(`departments: unknown department "${dept}" (known: ${DEPARTMENTS.join(", ")})`);
  }
}

/**
 * The seam Layer B (S-164) consumes: candidate idiom names for a department.
 * @param {string} dept a member of DEPARTMENTS
 * @returns {string[]} sorted idiom names whose departmentOf === dept
 */
export function departmentToIdioms(dept) {
  assertDepartment(dept);
  return idiomNames().filter((n) => departmentOf(n) === dept); // idiomNames() is already sorted
}

/** The full partition, { [department]: idiomName[] } — the diagnostic/test view. */
export function departmentPartition() {
  const out = Object.fromEntries(DEPARTMENTS.map((d) => [d, []]));
  for (const n of idiomNames()) out[departmentOf(n)].push(n);
  return out;
}
