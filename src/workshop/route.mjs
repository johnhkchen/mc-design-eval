// Layer B — the unified DISPATCH ROUTER's pure core (T-164-02, story S-164, epic E-39). The .mjs half
// of the BAML function RouteCritique(critique_block, department_idioms_block) -> Dispatch: it serializes a
// Layer-A Critique into the routing prompt's string inputs, validates the parsed Dispatch against the
// idiom registry, and adapts the dispatch into the creation loop's verdict shape.
//
// E-39 splits the fused CritiqueWorkshopRound into Layer A (what's wrong — diagnose.mjs) and Layer B (what
// to do — here). The router is STYLE-AGNOSTIC (the S-164 decision): a roof item routes to the ROOF
// department regardless of style; only Layer A is per-style (T-165). The candidate idioms it offers the
// model come from departmentToIdioms (the T-163-01 seam) — the SINGLE composition point — so the model can
// only pick a real, buildable idiom, and resolveDispatch re-checks membership after parse: an idiom outside
// its department's set THROWS (the "names an unbuildable idiom" failure made loud, routed to the bounded
// re-ask). That is the falsifiable-claim guard: every dispatch item resolves to a real idiom-registry
// entry, never a dead-end.
//
// THE VERDICT ADAPTER IS HONEST ABOUT THE GENERATOR GAP. A routed idiom (roof.gable, surface.clinker,
// pilaster…) is NOT one of the loop's wired actions (adjust-params/spray-paint/re-recognize are
// geometry/recolor levers; none constructs a registry idiom). Wiring idiom-construction appliers is a
// separate generator effort — the ticket's own claim names that gap as "a generator-epic finding." So
// dispatchToVerdict records the diagnosis + summarizes the routing and declares the loop's terminal
// decision ("done"); the resolved dispatch rides ALONGSIDE the verdict (the runner logs the trace, loop.mjs
// stays untouched) so S-166's bake-off can score routing correctness. The split path produces a scorable
// dispatch; applying it is the generator epic.
//
// THIS IS THE CREATION-LOOP ROUTER, NOT THE FROZEN JUDGE: no gate vocabulary, no verdict aggregation.
// PURE — no GL, no IO, no Date/random — runs under the `src/**/*.test.mjs` glob.

import { DEPARTMENTS, departmentToIdioms } from "../pack/departments.mjs";

/** The dispatch contract tag (for the runner/ledger trace). */
export const ROUTE_SCHEMA = "dispatch/v1";

const isNonEmptyString = (s) => typeof s === "string" && s.trim().length > 0;

/**
 * Serialize a Layer-A Critique into the router's reading material — one numbered line per item, naming the
 * department and the expected/present/missing triple + severity. This is what the router routes; it is NOT
 * re-parsed, only read (the model picks an idiom per line).
 * @param {{items:Array<{department:string, expected:string, present:string, missing:string, severity:string}>}} critique
 */
export function critiqueBlock({ critique }) {
  const items = critique?.items ?? [];
  if (items.length === 0) return "(no items)";
  return items
    .map((it, i) =>
      `  ${i + 1}. ${it.department} — expected: ${it.expected || "—"} / present: ${it.present || "—"} / `
      + `missing: ${it.missing || "—"} (${it.severity})`)
    .join("\n");
}

/**
 * The candidate menu: every department and its idiom-registry names (departmentToIdioms — the seam). The
 * router must pick the item's idiom from its own department's line. Single-sourced + deterministic
 * (DEPARTMENTS is sorted; departmentToIdioms returns sorted names).
 */
export function departmentIdiomsBlock() {
  return DEPARTMENTS.map((d) => `  ${d}: ${departmentToIdioms(d).join(", ")}`).join("\n");
}

/**
 * The RouteCritique prompt's DATA — the typed string inputs of the BAML function. The prose skeleton lives
 * in baml_src/department.baml; this serializes the live Critique + the registry menu into its params.
 * Deterministic in its inputs; the rendered prompt is byte-pinned to the golden by the fixture test.
 * @param {{critique:object}} args  a Layer-A Critique (diagnose.mjs's output / the typed Critique class)
 * @returns {{critique_block:string, department_idioms_block:string}}
 */
export function routeRenderArgs({ critique }) {
  return {
    critique_block: critiqueBlock({ critique }),
    department_idioms_block: departmentIdiomsBlock(),
  };
}

/**
 * Validate a parsed Dispatch against the idiom registry — the membership gate. THROWS on any violation so
 * the caller's bounded re-ask fires (mirrors the diagnose/critique reply-gate contract). The empty-items
 * throw is the emptied-list-is-malformed classification the T-164-01 review demands: Dispatch is an
 * all-array class, so a SAP-dropped bad item yields {items:[]}, which b.parse accepts but is not a routing.
 * @param {{items:Array<{department:string, idiom:string, why:string}>}} dispatch  a parsed Dispatch
 * @returns {ReadonlyArray<{department:string, idiom:string, why:string}>} the frozen, validated dispatch
 * @throws if items is empty, or any item names an unknown department, an idiom outside that department's
 *         candidate set, or an empty why.
 */
export function resolveDispatch(dispatch) {
  const items = dispatch?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("resolveDispatch: dispatch has no items (an emptied list is malformed, not a routing)");
  }
  const resolved = items.map((it, i) => {
    if (!DEPARTMENTS.includes(it?.department)) {
      throw new Error(`resolveDispatch: item[${i}] department "${it?.department}" is not a known department (${DEPARTMENTS.join(", ")})`);
    }
    const candidates = departmentToIdioms(it.department); // throws on unknown dept (already guarded)
    if (!candidates.includes(it?.idiom)) {
      throw new Error(`resolveDispatch: item[${i}] idiom "${it?.idiom}" is not in department ${it.department} (have: ${candidates.join(", ")})`);
    }
    if (!isNonEmptyString(it?.why)) {
      throw new Error(`resolveDispatch: item[${i}] why must be a non-empty string`);
    }
    return Object.freeze({ department: it.department, idiom: it.idiom, why: it.why.trim() });
  });
  return Object.freeze(resolved);
}

/**
 * Adapt a (Critique, resolved Dispatch) into the creation loop's exchange return. The verdict carries the
 * diagnosis as the loop's {region, issue, severity} issues and declares the loop's terminal decision
 * ("done") — applying a routed idiom is a wired-applier gap (the generator epic; see the module header).
 * The resolved dispatch rides ALONGSIDE the verdict so the runner logs the trace without touching loop.mjs.
 * @param {{critique:object, dispatch:object}} args  a Layer-A Critique and a parsed Dispatch
 * @returns {{verdict:{critique:{issues:object[]}, decision:"done", action:null, rationale:string},
 *            dispatch:ReadonlyArray<{department:string, idiom:string, why:string}>}}
 */
export function dispatchToVerdict({ critique, dispatch }) {
  const resolved = resolveDispatch(dispatch);
  const items = critique?.items ?? [];
  const issues = items.map((it) => Object.freeze({
    region: it.department,
    issue: `expected: ${it.expected || "—"} / present: ${it.present || "—"} / missing: ${it.missing || "—"}`,
    severity: it.severity === "major" ? "major" : "minor",
  }));
  const worst = resolved[0];
  const rationale = `routed ${resolved.length} item(s); worst: ${worst.department}→${worst.idiom} (${worst.why})`;
  return {
    verdict: Object.freeze({
      critique: Object.freeze({ issues: Object.freeze(issues) }),
      decision: "done",
      action: null,
      rationale,
    }),
    dispatch: resolved,
  };
}
