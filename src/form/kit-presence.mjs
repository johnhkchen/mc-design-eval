// Kit-presence checker — pure core (T-100-01, story S-100, epic E-26).
//
// THE GATE THAT DOESN'T ENUMERATE CAN'T DEMAND. The resemblance judge is image-shaped: at 512px it
// names "material zoning" gaps, never "missing trapdoor shutters" — so missing kit ingredients hid
// behind passing verdicts for four epics (E-22 aliasing, E-24 coverage, E-25 single-angle, now
// E-26 ingredients). This module enumerates: for each kit entry (T-096), verify presence AT ITS
// GRAMMAR SITES (T-098/T-099) and return NAMED gaps ("missing: spruce_trapdoor shutters @
// openings 3/4").
//
// THE FIXPOINT RULE (the design's one idea): a kit entry is present at its sites iff RE-RUNNING
// the pure op that supplies it is a NO-OP there. Frame/panels/course → placementGrammar would
// paint nothing (painted+adopted = 0; zoneFill places nothing in the band/roof zones); fence/
// shutters/door/light → dressOpenings would place nothing (per-slot `placed` = 0). No thresholds,
// and the tolerated geometry — respected declared secondaries, skipped broken-line isolates,
// no-jamb shutter sides, lintel/sill band rows — is inherited from the ops that DEFINE it, never
// re-encoded here. The demand is the supply.
//
// IMMUTABLE KIT (AC #4, E-26 Rule 2): the kit is input, taken verbatim — this module never
// extracts, re-ranks, merges, or mutates it. Binding semantics are bindKit/treatmentsFromKit
// (called inside placementGrammar / by the caller), so the gate can never bind a friendlier kit
// than the pipeline did.
//
// COMPANION, NOT REPLACEMENT (AC #2): composeKitAwareVerdict ANDs this check with the multi-angle
// aggregate (T-093) — a build missing kit entries cannot pass on four "same object" verdicts, and
// a fully-kitted build cannot pass on presence alone. Both run; both reported. A resemblance
// REFUSAL stays a refusal (presence is still reported). aggregateMultiAngle and the verdict
// vocabularies are untouched (Rule 5).
//
// PURE — no GL, no network, no I/O beyond opening-dressing's committed-vocab idiom, no
// Date/random. The impure proof runner is benchmarks/sculpture/kit-presence.mjs; the gate wiring
// is benchmarks/sculpture/multi-angle-gate.mjs.

import { placementGrammar } from "./placement-grammar.mjs";
import { dressOpenings } from "../view/opening-dressing.mjs";
import { bareBlock } from "../view/occupancy.mjs";
import { ownSetsOf } from "./material-vocabulary.mjs";

/** Schema tags (downstream version-check). */
export const KIT_PRESENCE_SCHEMA = "kit-presence/v1";
export const KIT_AWARE_GATE_SCHEMA = "kit-aware-gate/v1";

/**
 * T-099's acceptance predicate, same semantics: a conflict the GEOMETRY imposes (a shutter side
 * with no jamb to hang from, a lintel/sill band the facade doesn't carry) is a named reduction,
 * not a missing ingredient. Everything else — blocked sides, occupied cells, unresolvable
 * openings — is a real absence/defect and gates.
 */
export const toleratedConflict = (c) =>
  (c.slot.startsWith("shutter") && c.name.startsWith("shutter-no-jamb")) ||
  c.slot === "lintel" || c.slot === "sill";

/** A `no-<slot>-treatment` conflict means the KIT names no treatment — a recorded skip (the kit
 *  defines the demand), never a build absence. */
const isNoTreatment = (c) => /^no-.*-treatment$/.test(c.name);

const fmtIdx = (indices) => indices.join("/");

/**
 * THE CHECKER (AC #1). Deterministic over the artifact occupancy + structural read; the kit, the
 * shipped-space policy, and the concept-declared apertures are committed inputs.
 *
 * @param {import("../view/occupancy.mjs").Occupancy} occ  the artifact under test
 * @param {{kit:object[], bandNames:string[],
 *          policy:Record<string,{dominant:string,preserve?:string[]}>,
 *          zoneOf:(voxel:number[])=>string, floorLines:number[], upperTop:number,
 *          roofKeys:Set<string>, sub?:(b:string)=>string, minRun?:number,
 *          apertures?:object[],   // extractApertures(refOcc) — the concept-declared openings
 *          treatments?:{slots:object}}} opts  // treatmentsFromKit(kitRecord)
 * @returns {{schema:string, passed:boolean,
 *            checks:object[], gaps:string[], skips:{feature:string, reason:string}[],
 *            grammar:object, dressing:object|null}}
 */
export function kitPresence(occ, {
  kit, bandNames, policy, zoneOf, floorLines, upperTop, roofKeys,
  sub = (b) => b, minRun = 2, apertures = [], treatments = null, frames = null, definedCells = null,
}) {
  // T-106-01: `definedCells` ((voxel)=>bool) marks DEFINED geometry — the reconstruction's
  // composed edits and the raw base's concept-declared cells (the caller decides the union). A
  // shutter mount blocked ENTIRELY by defined cells (an eave course, the build's own timber stud
  // beside an upper window) is a geometry-imposed reduction like no-jamb — the geometry ate the
  // mount, the kit didn't fail to supply it. Blocked by anything else still gates (junk is a
  // defect). Null (the fallback path) keeps the strict pre-T-106 behavior.
  const definitionBlocked = (c) =>
    definedCells != null && c.slot.startsWith("shutter") && c.name.startsWith("shutter-blocked") &&
    (c.at?.length ?? 0) > 0 && c.at.every((p) => definedCells(p));
  const checks = [];
  const gaps = [];
  const skips = [];

  // --- cube half: the T-098 grammar fixpoint ------------------------------------------------------
  // `frames` (T-106-01): the fixpoint rule demands the checker re-run the SAME op the chain ran —
  // a component-framed build re-checked with occupancy frames would demand cells the definition
  // deliberately never painted.
  const g = placementGrammar(occ, {
    kit, bandNames, policy, zoneOf, floorLines, upperTop, roofKeys, sub, minRun, frames,
  });
  for (const s of g.bindings.skipped) skips.push({ feature: s.feature, reason: s.reason });

  if (g.shipped.frame) {
    const sites = g.frame.counts.cornerPost + g.frame.counts.roofline + g.frame.counts.floorLine;
    const missing = g.frame.painted + g.frame.adopted; // cells the grammar would still supply
    const row = {
      feature: "frame", block: g.bindings.frame, shipped: g.shipped.frame,
      sites, missing, satisfied: g.frame.alreadyFrame,
      tolerated: { respected: g.frame.respected, skippedIsolated: g.frame.skippedIsolated },
      gating: true, passed: missing === 0,
    };
    checks.push(row);
    if (!row.passed) gaps.push(`missing: ${row.shipped} frame @ ${missing}/${sites} frame-line cells`);
  }

  // panel/course absences = cells the fill would still repaint, bucketed by zone — but a MISSING
  // INGREDIENT is a site occupied by a block FOREIGN to the zone's declared vocabulary. A fill
  // placement over the zone's own dominant/preserve block is sub-minRun RESIDUE (a run the
  // dressing broke when it re-opened a pane, an isolated declared-secondary speck): the fill's
  // cleanliness contract, not an absence — tolerated, counted, never silent.
  const ownOf = ownSetsOf(policy); // the authority's own-vocabulary composition (T-113-01)
  const fillByZone = new Map();    // foreign cells — gating
  const residueByZone = new Map(); // own-vocabulary specks — tolerated
  for (const p of g.fill.placements) {
    const z = zoneOf(p.pos);
    const cur = bareBlock(occ.block(...p.pos));
    const bucket = ownOf.get(z)?.has(cur) ? residueByZone : fillByZone;
    bucket.set(z, (bucket.get(z) ?? 0) + 1);
  }
  for (const band of bandNames) {
    const shipped = g.shipped.panels[band];
    if (!shipped) continue; // recorded above via bindings.skipped
    const missing = fillByZone.get(band) ?? 0;
    fillByZone.delete(band);
    const surface = g.fill.byZone?.[band]?.surface ?? null;
    const row = {
      feature: `panel:${band}`, block: g.bindings.panels[band], shipped,
      sites: surface, missing, tolerated: { residue: residueByZone.get(band) ?? 0 },
      gating: true, passed: missing === 0,
    };
    checks.push(row);
    if (!row.passed) gaps.push(`missing: ${shipped} panel @ ${band} (${missing} cells)`);
  }
  if (g.shipped.course) {
    const missing = fillByZone.get("roof") ?? 0;
    fillByZone.delete("roof");
    const row = {
      feature: "course", block: g.bindings.course, shipped: g.shipped.course,
      sites: g.fill.byZone?.roof?.surface ?? null, missing,
      tolerated: { residue: residueByZone.get("roof") ?? 0 },
      gating: true, passed: missing === 0,
    };
    checks.push(row);
    if (!row.passed) gaps.push(`missing: ${row.shipped} course @ roof (${missing} cells)`);
  }
  // zones outside the band/roof vocabulary (none under zonesFromBands) — visible, non-gating
  for (const [zone, n] of fillByZone) {
    checks.push({ feature: `fill:${zone}`, missing: n, gating: false, passed: null });
  }

  // --- fixture half: the T-099 dressing fixpoint --------------------------------------------------
  let dressing = null;
  if (!apertures.length) {
    skips.push({ feature: "openings", reason: "no concept-declared apertures supplied" });
  } else if (!treatments?.slots) {
    skips.push({ feature: "openings", reason: "no kit treatments supplied" });
  } else {
    dressing = dressOpenings(occ, apertures, treatments);
    // one row per slot family, indices 1-based in aperture order (deterministic)
    const families = [
      { feature: "infill", block: treatments.slots.infill?.block, slots: ["infill"], kinds: ["window"] },
      { feature: "shutters", block: treatments.slots.shutter?.block, slots: ["shutterLeft", "shutterRight"], kinds: ["window"] },
      { feature: "door", block: treatments.slots.door?.block, slots: ["door"], kinds: ["door"] },
      { feature: "light", block: treatments.slots.light?.block, slots: ["light"], kinds: ["door"] },
    ];
    const seenNoTreatment = new Set();
    for (const fam of families) {
      const missingAt = [];
      const toleratedAt = [];
      let sites = 0;
      dressing.perOpening.forEach((rep, i) => {
        if (!fam.kinds.includes(rep.kind)) return;
        sites++;
        const idx = i + 1;
        const famConflicts = rep.conflicts.filter((c) => fam.slots.includes(c.slot));
        if (famConflicts.some(isNoTreatment)) { seenNoTreatment.add(fam.feature); return; }
        const placed = fam.slots.reduce((n, s) => n + (rep.placed?.[s] ?? 0), 0);
        const bad = famConflicts.some((c) => !toleratedConflict(c) && !isNoTreatment(c) && !definitionBlocked(c));
        if (placed > 0 || bad) missingAt.push(idx);
        else if (famConflicts.length) toleratedAt.push(idx);
      });
      if (sites === 0) {
        if (fam.block) {
          skips.push({
            feature: `openings:${fam.feature}`,
            reason: `no ${fam.kinds.join("/")}-kind aperture declared by the concept (T-099 D7 — detector gap, not absence)`,
          });
        }
        continue;
      }
      if (!fam.block || seenNoTreatment.has(fam.feature)) {
        // the kit defines the demand — an unfulfilled slot is a recorded skip, not a build absence
        skips.push({ feature: `openings:${fam.feature}`, reason: "kit names no treatment for this slot" });
        continue;
      }
      const row = {
        feature: `openings:${fam.feature}`, block: fam.block, sites,
        missingAt, toleratedAt, gating: true, passed: missingAt.length === 0,
      };
      checks.push(row);
      if (!row.passed) {
        gaps.push(`missing: ${fam.block} ${fam.feature} @ openings ${fmtIdx(missingAt)}`);
      }
    }
    // unresolvable openings (no wall plane / duplicate positions) — real defects, gating
    const broken = [];
    dressing.perOpening.forEach((rep, i) => {
      if (rep.conflicts.some((c) => c.slot === "opening" && c.name === "no-wall-plane")) broken.push(i + 1);
    });
    if (broken.length) {
      checks.push({ feature: "openings:resolvable", missingAt: broken, gating: true, passed: false });
      gaps.push(`missing: wall plane @ openings ${fmtIdx(broken)} (opening unresolvable on the target)`);
    }
    // lintel/sill: frame-at-opening evidence — informational (the frame-line check is the gate)
    const lintelSill = dressing.perOpening.reduce(
      (n, rep) => n + (rep.placed?.lintel ?? 0) + (rep.placed?.sill ?? 0), 0);
    checks.push({ feature: "openings:lintel-sill", placed: lintelSill, gating: false, passed: null });
  }

  return {
    schema: KIT_PRESENCE_SCHEMA,
    passed: gaps.length === 0,
    checks,
    gaps,
    skips,
    grammar: {
      bindings: g.bindings,
      shipped: g.shipped,
      frame: {
        counts: g.frame.counts, painted: g.frame.painted, adopted: g.frame.adopted,
        respected: g.frame.respected, skippedIsolated: g.frame.skippedIsolated,
        alreadyFrame: g.frame.alreadyFrame,
      },
      fill: { placements: g.fill.placements.length, byZone: g.fill.byZone },
    },
    dressing: dressing && {
      stats: dressing.stats,
      perOpening: dressing.perOpening.map((rep) => ({
        dir: rep.dir, kind: rep.kind, bbox: rep.bbox,
        applied: rep.applied, placed: rep.placed, conflicts: rep.conflicts,
      })),
    },
  };
}

/**
 * The kit-aware verdict (AC #2): the multi-angle aggregate AND the presence check — companion
 * precondition in the E-24 coverage spirit, except BOTH RUN (no judge short-circuit) and both are
 * reported. The kit check cannot be passed around and cannot replace the judgement; a resemblance
 * REFUSAL stays a refusal. `presence` may be a kitPresence result, `{ran:false, reason}` for a
 * subject with no kit inputs, or null (treated as not-run). PURE, total.
 * @param {{decided:boolean, passed?:boolean, refusal?:string}} aggregate  multi-angle-gate/v1
 * @param {{schema?:string, passed?:boolean, gaps?:string[], ran?:boolean, reason?:string}|null} presence
 * @returns {{schema:string, decided:boolean, refusal?:string, passed?:boolean, components:object}}
 */
export function composeKitAwareVerdict(aggregate, presence) {
  if (!aggregate || typeof aggregate.decided !== "boolean") {
    throw new Error("composeKitAwareVerdict: a multi-angle aggregate ({decided, ...}) is required");
  }
  const ran = presence?.schema === KIT_PRESENCE_SCHEMA;
  const kitPresenceRow = ran
    ? { ran: true, passed: presence.passed === true, gaps: [...(presence.gaps ?? [])] }
    : { ran: false, reason: presence?.reason ?? "kit-presence-not-run" };
  const resemblance = aggregate.decided
    ? { decided: true, passed: aggregate.passed === true }
    : { decided: false, refusal: aggregate.refusal };
  const components = { resemblance, kitPresence: kitPresenceRow };
  if (!aggregate.decided) {
    // a partial resemblance sheet is not a verdict — presence is reported, never substituted
    return { schema: KIT_AWARE_GATE_SCHEMA, decided: false, refusal: aggregate.refusal, components };
  }
  const passed = resemblance.passed && (kitPresenceRow.ran ? kitPresenceRow.passed : true);
  return { schema: KIT_AWARE_GATE_SCHEMA, decided: true, passed, components };
}
