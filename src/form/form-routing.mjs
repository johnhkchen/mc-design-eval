// Per-subject form-type ROUTING for GLB voxelization (T-065-01, story S-065, epic E-19).
//
// T-059 added thin-feature voxelization (`voxelizeGlbThin`): it ADDS the surface/shell cells the plain
// solid fill (`voxelizeGlb`, E-16) misses, recovering thin members (bow string, koi fins). E-18's combined
// build ran it on ALL 7 subjects and found the documented trade — thin HELPS thin/organic forms but
// OVER-THICKENS already-solid ones (dancing-man form IoU −0.10, moai −0.166, …) and ~doubles their
// occupancy (spurious bulk = a cleanliness cost). The routing rule was NAMED but never WIRED:
//   thin/organic → voxelizeGlbThin ;  solid/bulky → voxelizeGlb.
// This module wires it — NO new algorithm, just a subject-keyed tag + a selector picking the right
// EXISTING voxelizer. The empirical boundary lives in e18-scorecard.mjs `classifyRouting` (the sign of
// E18−R1 form Δ per subject); this is its forward, reviewed form.
//
// PURE — no GL, no I/O — so it runs under the `src/**/*.test.mjs` glob. `selectVoxelizer` returns the
// ACTUAL voxelizer function (not a string) so a caller keeps the `voxelizer(glb, {scale})` shape and a
// test can assert identity (`=== voxelizeGlbThin`).

import { voxelizeGlb } from "./glb-voxelize.mjs";
import { voxelizeGlbThin } from "./glb-thin.mjs";

/**
 * The canonical per-subject form-type tag — ONE source of truth (the runners' duplicated SUBJECTS lists
 * consume this rather than each carrying a column). Keys are the `glb-voxel-breadth.mjs` subject keys.
 *
 * thin = {bow-and-arrow, koi} — clearly helped by the thin pass (form IoU +0.053 / +0.084 at scale 32).
 * solid = the rest. NOTE on **heart**: the spine shows the thin pass marginally HELPED it (+0.018), but
 * it is tagged SOLID deliberately — heart is a bulky organ (only the aortic arch is thin-ish), and routing
 * it solid trades that +0.018 marginal form gain for a 27% occupancy drop (7982→5840 cells) and less
 * spurious bulk (the story's cleanliness goal). The routing report records this as the one deliberate
 * trade, not a "recovery".
 * @type {Readonly<Record<string, "thin"|"solid">>}
 */
export const FORM_TYPE = Object.freeze({
  "bow-and-arrow": "thin",
  "koi": "thin",
  "dancing-man": "solid",
  "moai": "solid",
  "pineapple": "solid",
  "mushroom": "solid",
  "heart": "solid",
});

/** An untagged subject defaults to SOLID — the conservative choice: plain voxelize never over-thickens,
 *  so an unknown subject is treated as bulky rather than silently shelled. */
export const DEFAULT_FORM_TYPE = "solid";

/**
 * The form-type tag for a subject key. PURE. Unknown / non-string → DEFAULT_FORM_TYPE.
 * @param {string} subject
 * @returns {"thin"|"solid"}
 */
export function formTypeOf(subject) {
  const key = typeof subject === "string" ? subject.trim() : "";
  return FORM_TYPE[key] ?? DEFAULT_FORM_TYPE;
}

/**
 * Pick the voxelizer a subject should use. PURE. Returns the ACTUAL function reference:
 * `voxelizeGlbThin` for a thin-tagged subject, `voxelizeGlb` for solid / unknown.
 * @param {string} subject
 * @returns {typeof voxelizeGlbThin | typeof voxelizeGlb}
 */
export function selectVoxelizer(subject) {
  return formTypeOf(subject) === "thin" ? voxelizeGlbThin : voxelizeGlb;
}

/**
 * Convenience: voxelize a GLB through the routed voxelizer for `subject`. Both voxelizers accept
 * `{ scale }` with the same default, so the call site is uniform. PURE (delegates to the chosen voxelizer).
 * @param {Uint8Array|ArrayBuffer|Buffer} glb
 * @param {{ subject: string, scale?: number }} opts
 * @returns {ReturnType<typeof voxelizeGlb>}
 */
export function voxelizeRouted(glb, { subject, scale } = {}) {
  return selectVoxelizer(subject)(glb, scale == null ? {} : { scale });
}

// --- AC #3: before(universal-thin)/after(routed) report, assembled from the E-18 spine -----------------
//
// No new GL run: the e18-remeasure/v1 spine already carries, per subject, the plain-voxelize form IoU
// (`r1.formIoU`) and thin-voxelize form IoU (`e18.formIoU`), plus plain/thin occupancy
// (`thin.occBase`/`thin.occThin`). Routing is a per-subject PICK between those measured values:
//   before (universal thin): formIoU = e18.formIoU,            occ = occThin            (for all 7)
//   after  (routed):         formIoU = thin ? e18.formIoU : r1.formIoU,
//                            occ     = thin ? occThin      : occBase
// So this assembler is a pure, deterministic read — it cannot drift from the consolidated E-18 record.

/** Schema tag stamped on the report json (downstream version-check). */
export const ROUTING_SCHEMA = "form-routing/v1";

/** Form-IoU strict-improvement margin (matches e18-scorecard EPS.formIoU). */
const FORM_EPS = 1e-3;
const round3 = (n) => Math.round(n * 1000) / 1000;
const isNum = (x) => typeof x === "number" && Number.isFinite(x);

/**
 * Resolve one spine subject row to its before/after routed pick. PURE.
 * @param {{subject:string, r1?:{formIoU?:number}, e18?:{formIoU?:number},
 *          thin?:{occBase?:number, occThin?:number}}} row
 */
export function pickRouted(row) {
  const formType = formTypeOf(row.subject);
  const thin = formType === "thin";
  const r1IoU = row.r1 && isNum(row.r1.formIoU) ? row.r1.formIoU : null;
  const e18IoU = row.e18 && isNum(row.e18.formIoU) ? row.e18.formIoU : null;
  const occBase = row.thin && isNum(row.thin.occBase) ? row.thin.occBase : null;
  const occThin = row.thin && isNum(row.thin.occThin) ? row.thin.occThin : null;

  const before = { formIoU: e18IoU, occ: occThin };           // universal thin
  const after = thin ? { formIoU: e18IoU, occ: occThin }      // thin subject: unchanged
                     : { formIoU: r1IoU, occ: occBase };       // solid subject: plain voxelize
  const dFormIoU = isNum(after.formIoU) && isNum(before.formIoU) ? round3(after.formIoU - before.formIoU) : null;
  const dOcc = isNum(after.occ) && isNum(before.occ) ? after.occ - before.occ : null;

  let verdict;
  if (thin) verdict = "kept"; // still runs thin → no change by construction
  else if (dFormIoU == null) verdict = "flat";
  else if (dFormIoU > FORM_EPS) verdict = "recovered"; // plain beat thin on this solid
  else if (dFormIoU < -FORM_EPS) verdict = "traded"; // thin marginally helped; routed solid for the bulk win
  else verdict = "flat";

  return { subject: row.subject, formType, before, after, dFormIoU, dOcc, verdict };
}

/**
 * Assemble the routing before/after report from an `e18-remeasure/v1` spine. PURE; tolerant of missing
 * cells (emits null/`—`, never throws on a gap).
 * @param {{schema?:string, scale?:number, subjects:object[]}} spine
 * @param {{ generatedFrom?:string }} [opts]
 * @returns {{ md:string, json:object }}
 */
export function assembleRoutingReport(spine, opts = {}) {
  if (!spine || !Array.isArray(spine.subjects)) throw new Error("assembleRoutingReport: spine.subjects must be an array");
  const subjects = spine.subjects.map(pickRouted);

  const meanIoU = (sel) => {
    let sum = 0, n = 0;
    for (const s of subjects) { const v = sel(s); if (isNum(v)) { sum += v; n += 1; } }
    return n === 0 ? null : round3(sum / n);
  };
  const beforeAvg = meanIoU((s) => s.before.formIoU);
  const afterAvg = meanIoU((s) => s.after.formIoU);

  const sumOcc = (sel) => {
    let sum = 0, any = false;
    for (const s of subjects) { const v = sel(s); if (isNum(v)) { sum += v; any = true; } }
    return any ? sum : null;
  };
  const beforeOcc = sumOcc((s) => s.before.occ);
  const afterOcc = sumOcc((s) => s.after.occ);
  const solidsDropped = subjects
    .filter((s) => s.formType === "solid" && isNum(s.dOcc))
    .reduce((a, s) => a + Math.abs(s.dOcc), 0);

  const json = {
    schema: ROUTING_SCHEMA,
    scale: spine.scale ?? null,
    generatedFrom: opts.generatedFrom ?? "routed pick over e18-remeasure/v1 (r1=plain, e18=thin; occBase/occThin)",
    note:
      "Per subject: before = universal thin (the E-18 combined build's voxelizer on all 7); after = routed " +
      "(thin subjects keep voxelizeGlbThin; solid subjects use plain voxelizeGlb). Form IoU higher is better; " +
      "occupancy lower is better (less spurious bulk). `traded` = a solid the thin pass marginally helped " +
      "(heart, +0.018) but routed solid for the large occupancy/cleanliness win.",
    averages: { formIoU: { before: beforeAvg, after: afterAvg, delta: isNum(beforeAvg) && isNum(afterAvg) ? round3(afterAvg - beforeAvg) : null } },
    occupancy: {
      before: beforeOcc,
      after: afterOcc,
      delta: isNum(beforeOcc) && isNum(afterOcc) ? afterOcc - beforeOcc : null,
      solidsDropped,
    },
    recovered: subjects.filter((s) => s.verdict === "recovered").map((s) => s.subject),
    traded: subjects.filter((s) => s.verdict === "traded").map((s) => s.subject),
    kept: subjects.filter((s) => s.verdict === "kept").map((s) => s.subject),
    subjects,
  };
  return { md: renderRoutingMd(json), json };
}

const fmtNum = (v, d = 3) => (isNum(v) ? String(Math.round(v * 10 ** d) / 10 ** d) : "—");
const fmtSigned = (v) => (isNum(v) ? (v > 0 ? `+${fmtNum(v)}` : fmtNum(v)) : "—");
const fmtInt = (v) => (isNum(v) ? String(v) : "—");
const fmtSignedInt = (v) => (isNum(v) ? (v > 0 ? `+${v}` : String(v)) : "—");

/** Render the routing report markdown from the assembled json. PURE. */
function renderRoutingMd(json) {
  const lines = [
    "# Per-subject thin routing — before (universal thin) / after (routed) (T-065-01)",
    "",
    "Thin-feature voxelization (`voxelizeGlbThin`) HELPS thin/organic subjects but OVER-THICKENS solid ones.",
    "E-18 ran it on all 7 (`before`); routing runs thin only on the thin-tagged subjects and plain",
    "`voxelizeGlb` on the solids (`after`). Form IoU higher is better; occupancy (cells) lower is better.",
    "",
    `Scale ${json.scale ?? "—"}. Subjects: ${json.subjects.length}. Schema \`${json.schema}\`.`,
    "",
    "| subject | form | form IoU before→after (Δ) | occupancy before→after (Δ) | verdict |",
    "| ------- | ---- | ------------------------- | -------------------------- | ------- |",
    ...json.subjects.map(
      (s) =>
        `| ${s.subject} | ${s.formType} | ${fmtNum(s.before.formIoU)}→${fmtNum(s.after.formIoU)} ` +
        `(${fmtSigned(s.dFormIoU)}) | ${fmtInt(s.before.occ)}→${fmtInt(s.after.occ)} (${fmtSignedInt(s.dOcc)}) | ` +
        `${s.verdict} |`,
    ),
    `| **AVERAGE / TOTAL** | — | ${fmtNum(json.averages.formIoU.before)}→${fmtNum(json.averages.formIoU.after)} ` +
      `(${fmtSigned(json.averages.formIoU.delta)}) | ${fmtInt(json.occupancy.before)}→${fmtInt(json.occupancy.after)} ` +
      `(${fmtSignedInt(json.occupancy.delta)}) | — |`,
    "",
    `**Solids recovered:** ${json.recovered.length ? json.recovered.join(", ") : "none"}. ` +
      `**Kept (thin):** ${json.kept.length ? json.kept.join(", ") : "none"}. ` +
      `**Traded:** ${json.traded.length ? json.traded.join(", ") : "none"}.`,
    `Occupancy dropped on solids by **${fmtInt(json.occupancy.solidsDropped)} cells** ` +
      `(total ${fmtInt(json.occupancy.before)}→${fmtInt(json.occupancy.after)}).`,
    "",
    `> _Note:_ ${json.note}`,
    "",
  ];
  return lines.join("\n");
}
