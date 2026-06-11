// Per-component roof grouping — T-110-01 (E-28, story S-110).
//
// The church names the gap: a building can carry STRUCTURALLY DISTINCT roofs (tower cap + nave
// pitch, both in its T-103 component record), and one whole-mass invocation of the roof program is
// all-or-nothing across them. This module is the PURE grouping seam: it maps the fitted gables
// (src/form/roof-fit.mjs gablesFromRecord — pairing is unchanged) onto the component record's
// masses via their planes' massId, so the runner can invoke the EXISTING swap ladder once per
// component, each under its own tolerance-or-named-fallback contract, threading the occupancy
// through accepted swaps. Nothing here re-fits, generates, or judges — roof-fit/roof-generate/
// roof-swap are untouched (they are T-108-01's working set).
//
// Group order is deterministic and documented: the PRIMARY mass first (it establishes the
// silhouette the cage judges everything else against), then ascending massId. Generic over any
// component-record/v1 — no subject constants.
//
// PURE — no I/O, no GL, no Date/random.

/**
 * Group fitted gables by the component mass their planes belong to.
 *
 * Every gable resolves through its sides' planeId → record.roofPlanes[].massId. A gable whose two
 * sides sit on different masses is a NAMED finding (`gable-spans-masses`) and groups under its
 * first side's mass — the pairing itself is roof-fit's verdict, never re-litigated here. A mass
 * that owns pitched roof planes but contributes no gable at all is a NAMED finding
 * (`component-roof-unfitted`) so the per-component fallback is visible in the record even when
 * roof-fit produced nothing to reject. Insane gables stay IN their group: the runner reports them
 * as that component's fallback cause.
 *
 * @param {{record:object, gables:object[]}} args
 *   `record` a component-record/v1 (masses + roofPlanes), `gables` from gablesFromRecord.
 * @returns {{groups:{massId:string, role:string|null, gableIds:string[], gables:object[]}[],
 *            findings:{code:string, where?:string, detail:string}[]}}
 */
export function componentGableGroups({ record, gables }) {
  if (!record || !Array.isArray(record.roofPlanes)) {
    throw new Error("componentGableGroups: record with roofPlanes required");
  }
  if (!Array.isArray(gables)) throw new Error("componentGableGroups: gables array required");

  const massOfPlane = new Map(record.roofPlanes.map((p) => [p.id, p.massId ?? null]));
  const roleOfMass = new Map((record.masses ?? []).map((m) => [m.id, m.role ?? null]));
  const findings = [];
  const byMass = new Map();

  for (const g of gables) {
    const sideMasses = (g.sides ?? []).map((s) => massOfPlane.get(s.planeId) ?? null);
    const massId = sideMasses.find((m) => m != null) ?? null;
    if (massId == null) {
      findings.push({
        code: "gable-mass-unresolved",
        where: g.id,
        detail: `no side plane resolves to a recorded mass (planes ${
          (g.sides ?? []).map((s) => s.planeId).join(", ")}) — grouped alone, judged as its own component`,
      });
    }
    const distinct = [...new Set(sideMasses.filter((m) => m != null))];
    if (distinct.length > 1) {
      findings.push({
        code: "gable-spans-masses",
        where: g.id,
        detail: `sides sit on ${distinct.join(" + ")} — grouped under ${distinct[0]} (the pairing is ` +
          `roof-fit's verdict, consumed as-is)`,
      });
    }
    const key = massId ?? `unresolved:${g.id}`;
    if (!byMass.has(key)) byMass.set(key, { massId: key, role: roleOfMass.get(key) ?? null, gableIds: [], gables: [] });
    const grp = byMass.get(key);
    grp.gableIds.push(g.id);
    grp.gables.push(g);
  }

  // masses with pitched planes but no gable at all — the named per-component fallback
  const massesWithPitched = new Set(
    record.roofPlanes.filter((p) => p.kind === "pitched").map((p) => p.massId).filter((m) => m != null));
  for (const massId of massesWithPitched) {
    if (!byMass.has(massId)) {
      findings.push({
        code: "component-roof-unfitted",
        where: massId,
        detail: "mass owns pitched roof planes but no fitted gable — regularized mass stays (Rule 1)",
      });
    }
  }

  const rank = (g) => (g.role === "primary" ? 0 : 1);
  const groups = [...byMass.values()].sort((a, b) =>
    rank(a) - rank(b) || String(a.massId).localeCompare(String(b.massId)));
  return { groups, findings };
}
