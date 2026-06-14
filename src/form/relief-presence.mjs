// Relief-presence lens — pure core (T-148-01, story S-148, epic E-35).
//
// THE GATE THAT CAN'T SEE TEXTURE PASSES THE FLAT BOX. The frozen instrument measures proportion +
// block-resemblance + kit-presence and is BLIND to surface grammar and relief: the barn that recorded
// the project's first composite PASS (T-143-01) is a flat mono-fill box beside an articulated concept.
// This module is the lens that sees relief — measured from the build's OWN surface vs the concept's
// RECOGNISED facade grammar (S-145), a GEOMETRY read, never a colour metric.
//
// THE FIXPOINT RULE (kit-presence's idea, generalised to relief — "the demand is the supply"): a
// concept's declared facade rhythm is REALIZED on the build iff RE-RUNNING the pure op that would
// supply it (surfaceRelief, S-146) is a NO-OP on the demanded strips. surfaceRelief emits proud cells
// only in front of EXISTING skin cells on the rhythm, and is idempotent on its own output; so on a
// flat wall it emits one proud cell per demanded strip-cell (the relief RESIDUAL — the build lacks
// that relief), and on an already-articulated wall it emits nothing. `missing===0` ⇒ present. NO
// threshold, NO per-building constant: the period/phase/material come from the recognised grammar, the
// predicate is no-op-ness. The "proud-cell fraction / field-frame contrast" the AC names are RECORDED
// as evidence (surface-grid.reliefProfile), never the decision.
//
// COMPANION, NOT REPLACEMENT (identity-class discipline, [[glance-true-budget-v2]]): the relief check
// runs BESIDE the kit-aware verdict and both are reported; composeReliefAwareVerdict ANDs them under a
// NEW policy tag (relief-aware-gate/v1) while the kit-aware overall (kit-aware-gate/v1) is byte-unmoved
// and valid forever. The lens calls NO judge — the frozen judge contract is untouched (aggregation/
// precondition only, never a re-judge). A build with no recognised grammar yields ran:false → the
// composer is a pure passthrough, so every committed record re-derives unchanged.
//
// PURE — no GL, no network, no I/O, no Date/random. The calibration sweep (anti-anchor flip +
// articulated pass over the real barn build) is benchmarks/sculpture/relief-calibration.mjs; the
// inert live-gate wiring is benchmarks/sculpture/multi-angle-gate.mjs.

import { roleBlock } from "../recognition/compile.mjs";
import { surfaceRelief, RELIEF_DEFAULTS } from "../view/surface-relief.mjs";
import { projectSurface, reliefProfile } from "../view/surface-grid.mjs";

/** Schema tags (downstream version-check). */
export const RELIEF_PRESENCE_SCHEMA = "relief-presence/v1";
export const RELIEF_AWARE_GATE_SCHEMA = "relief-aware-gate/v1";

/**
 * Extract the demanded relief from a recognised building program's facade grammar (S-145). One demand
 * per `faces[]` entry (pilaster/stud column rhythm) and one per `courseLines[]` entry (belt-course row
 * rhythm). Every number traces to the grammar or RELIEF_DEFAULTS; the member block is resolved via the
 * pack palette (roleBlock — the one role→block point), never derived. No facade ⇒ `[]` (the legacy
 * state every committed build is in). PURE.
 * @param {{masses:Array<{id:string, facade?:object}>}} program
 * @param {object} pack
 * @returns {Array<{massId:string, face:string, axis:"column"|"row", every:number, span:number,
 *                  phase:number, material:string, depth:number, role:string, source:string}>}
 */
export function reliefDemand(program, pack) {
  if (!program || !Array.isArray(program.masses)) {
    throw new Error("reliefDemand: a building program with masses[] is required");
  }
  if (!pack || !Array.isArray(pack.palette)) throw new Error("reliefDemand: a pack with a palette is required");
  const demand = [];
  for (const m of program.masses) {
    const fac = m.facade;
    if (!fac || !Array.isArray(fac.faces)) continue;
    for (const f of fac.faces) {
      // column rhythm — period (or count over the wall run, recorded as `every`); the member studs.
      const every = f.rhythm?.period ?? f.rhythm?.count;
      if (!Number.isInteger(every) || every < 1) continue; // schema guarantees one form; defensive
      demand.push({
        massId: m.id, face: f.wall, axis: "column", every,
        span: RELIEF_DEFAULTS.span, phase: f.rhythm?.phase ?? RELIEF_DEFAULTS.phase,
        material: roleBlock(pack, f.memberRole), depth: f.jettyDepth ?? RELIEF_DEFAULTS.depth,
        role: f.memberRole, source: f.evidence?.source ?? "concept",
      });
      // belt courses — one row-rhythm demand per declared course line.
      for (const cl of f.courseLines ?? []) {
        demand.push({
          massId: m.id, face: f.wall, axis: "row", every: 1, span: RELIEF_DEFAULTS.span,
          phase: cl.y, material: roleBlock(pack, cl.role), depth: RELIEF_DEFAULTS.depth,
          role: cl.role, source: f.evidence?.source ?? "concept",
        });
      }
    }
  }
  return demand;
}

/**
 * THE LENS (AC #1). Deterministic over the build's occupancy + the recognised demand. For each demand,
 * the relief fixpoint: surfaceRelief's would-be placements ARE the missing relief cells (the residual);
 * `missing===0` ⇒ that rhythm is realized. Tolerated geometry (cells already carrying the member block,
 * a proud ray stopping at occupied geometry) is inherited from surfaceRelief, never re-encoded here.
 * No demand ⇒ vacuously satisfied (`ran:false`) — the legacy state. PURE.
 * @param {import("../view/occupancy.mjs").Occupancy} occ  the build under test
 * @param {{demand:object[], zoneOf?:(pos:number[])=>string|null}} opts
 * @returns {{schema:string, ran:boolean, passed:boolean, checks:object[], residual:string[],
 *            evidence:{face:string, proud:number, flush:number, recessed:number, plane:number}[]}}
 */
export function reliefPresence(occ, { demand = [], zoneOf = null } = {}) {
  if (!occ || typeof occ.has !== "function") throw new Error("reliefPresence: an occupancy is required");
  if (!Array.isArray(demand)) throw new Error("reliefPresence: opts.demand must be an array");
  if (demand.length === 0) {
    return { schema: RELIEF_PRESENCE_SCHEMA, ran: false, passed: true, checks: [], residual: [], evidence: [] };
  }
  const checks = [];
  const residual = [];
  const faces = new Set();
  for (const d of demand) {
    faces.add(d.face);
    const opts = {
      material: d.material, faces: [d.face],
      rhythm: { axis: d.axis, every: d.every, span: d.span, phase: d.phase },
      depth: d.depth,
    };
    if (zoneOf) opts.zoneOf = zoneOf;
    const { placements, report } = surfaceRelief(occ, opts);
    const missing = placements.length;
    const row = {
      massId: d.massId, face: d.face, axis: d.axis, every: d.every, material: d.material,
      demandedStrips: report.strips, missingCells: missing, fieldCells: report.fieldCells,
      passed: missing === 0,
    };
    checks.push(row);
    if (!row.passed) {
      residual.push(`missing relief: ${d.material} on ${d.face} @ ${d.axis} every ${d.every} (${missing} cells)`);
    }
  }
  // evidence: the build's own surface read at each demanded face — proud-cell fraction + field/frame
  // contrast (reliefProfile), RECORDED, never gated (the AC's named measurements; not a colour metric).
  const evidence = [...faces].sort().map((f) => {
    const p = reliefProfile(projectSurface(occ, f));
    return { face: f, proud: p.proud, flush: p.flush, recessed: p.recessed, plane: p.plane };
  });
  return {
    schema: RELIEF_PRESENCE_SCHEMA,
    ran: true,
    passed: checks.every((c) => c.passed),
    checks, residual, evidence,
  };
}

/**
 * The relief-aware verdict (AC #3): the kit-aware composite AND the relief presence — companion
 * precondition in the kit-presence spirit (BOTH run, BOTH reported; the relief check cannot replace
 * the judgement, and a resemblance REFUSAL stays a refusal). `presence` may be a reliefPresence result,
 * `{ran:false}` for a subject with no recognised grammar, or null (treated as not-run → passthrough).
 * NEW policy tag relief-aware-gate/v1; the kit-aware verdict (kit-aware-gate/v1) is reported byte-unmoved
 * as a component. PURE, total.
 * @param {{schema?:string, decided:boolean, passed?:boolean, refusal?:string}} kitAware
 * @param {{schema?:string, ran?:boolean, passed?:boolean, residual?:string[]}|null} presence
 * @returns {{schema:string, decided:boolean, refusal?:string, passed?:boolean, components:object}}
 */
export function composeReliefAwareVerdict(kitAware, presence) {
  if (!kitAware || typeof kitAware.decided !== "boolean") {
    throw new Error("composeReliefAwareVerdict: a kit-aware verdict ({decided, ...}) is required");
  }
  const ran = presence?.schema === RELIEF_PRESENCE_SCHEMA && presence.ran === true;
  const reliefRow = ran
    ? { ran: true, passed: presence.passed === true, residual: [...(presence.residual ?? [])] }
    : { ran: false };
  const kitRow = kitAware.decided
    ? { decided: true, passed: kitAware.passed === true }
    : { decided: false, refusal: kitAware.refusal };
  const components = { kitAware: kitRow, relief: reliefRow };
  if (!kitAware.decided) {
    return { schema: RELIEF_AWARE_GATE_SCHEMA, decided: false, refusal: kitAware.refusal, components };
  }
  const passed = kitRow.passed && (reliefRow.ran ? reliefRow.passed : true);
  return { schema: RELIEF_AWARE_GATE_SCHEMA, decided: true, passed, components };
}
