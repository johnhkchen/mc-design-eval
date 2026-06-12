// HEAD-TO-HEAD COMPOSITION (T-127-01, story S-127, epic E-31) — the pure half of the milestone
// comparison: committed multi-angle gate records in, one honest table out. No thresholds, no
// judgement, no winner declaration beyond arithmetic deltas — verdicts are quoted as judged
// (E-29 honesty: losses are findings with names, never hidden). The impure reader/writer is
// benchmarks/sculpture/pattern-book-compare.mjs.

import { MULTI_ANGLE_GATE_SCHEMA } from "./multi-angle-gate.mjs";

export const HEAD_TO_HEAD_SCHEMA = "pattern-book-head-to-head/v1";

const SAME_OBJECT = "same object";

/** One gate record → one comparison row. Throws on a record that is not the frozen gate's. */
export function gateRow(rec, label) {
  if (rec?.schema !== MULTI_ANGLE_GATE_SCHEMA) {
    throw new Error(`gateRow(${label}): record schema "${rec?.schema}" is not "${MULTI_ANGLE_GATE_SCHEMA}"`);
  }
  const views = (rec.views ?? []).map((v) => ({
    angle: v.angle,
    azimuthDeg: v.azimuthDeg,
    outcome: v.verdict ? v.verdict.verdict
      : v.unparsed ? "unparsed"
      : v.reason === "coverage" ? "coverage-rejected"
      : v.rendered === false ? "not-rendered" : "missing",
    gaps: (v.verdict?.gaps ?? []).map(({ severity, attribute, region }) => ({ severity, attribute, region })),
    coveragePassed: v.coverage ? v.coverage.passed : null,
  }));
  return {
    label,
    subject: rec.subject,
    artifact: { path: rec.artifact.path, sha256: rec.artifact.sha256 },
    decided: rec.aggregate.decided === true,
    passed: rec.aggregate.decided === true ? rec.aggregate.passed : null,
    refusal: rec.aggregate.decided === true ? null : rec.aggregate.refusal,
    gapCount: rec.aggregate.gapCount ?? null,
    gapBudget: rec.aggregate.gapBudget ?? null,
    // T-144-01 dual reporting (null on a pre-v2 committed record): the v2 budget arithmetic beside
    // the legacy ≤2 verdict, so the table can show both as the policy demands.
    policy: rec.aggregate.policy ?? null,
    legacyPassed: rec.aggregate.legacy ? rec.aggregate.legacy.passed : null,
    majorCount: rec.aggregate.majorCount ?? null,
    minorCount: rec.aggregate.minorCount ?? null,
    minorBudget: rec.aggregate.minorBudget ?? null,
    sameObject: { count: views.filter((v) => v.outcome === SAME_OBJECT).length, total: views.length },
    kitPresence: rec.kitPresence
      ? { ran: rec.kitPresence.ran !== false, passed: rec.kitPresence.passed ?? null, gaps: rec.kitPresence.gaps ?? [], reason: rec.kitPresence.reason ?? null }
      : null,
    overall: rec.overall ? { decided: rec.overall.decided, passed: rec.overall.passed ?? null, refusal: rec.overall.refusal ?? null } : null,
    views,
    sheet: rec.sheet ?? null,
  };
}

/**
 * Compose the milestone head-to-head: per subject, the pattern-book row beside the
 * metrology-best row, with arithmetic deltas (negative gapCount delta = fewer gaps than the
 * best; positive sameObject delta = more same-object views). `context` entries are attached
 * verbatim per label (chain receipts, census extracts) — this function never interprets them.
 *
 * @param {{subjects: Array<{key: string,
 *   records: {patternbook: object, generated: object},
 *   context?: {patternbook?: object, generated?: object}}>}} args
 */
export function composeHeadToHead({ subjects }) {
  if (!Array.isArray(subjects) || subjects.length === 0) throw new Error("composeHeadToHead: subjects must be a non-empty array");
  const out = subjects.map(({ key, records, context = {} }) => {
    const patternbook = gateRow(records.patternbook, "patternbook");
    const generated = gateRow(records.generated, "generated");
    for (const row of [patternbook, generated]) {
      if (row.subject !== key) throw new Error(`composeHeadToHead: ${row.label} record subject "${row.subject}" is not "${key}"`);
    }
    const bothCounted = patternbook.gapCount != null && generated.gapCount != null;
    return {
      key,
      rows: [
        { ...patternbook, context: context.patternbook ?? null },
        { ...generated, context: context.generated ?? null },
      ],
      deltas: {
        gapCount: bothCounted ? patternbook.gapCount - generated.gapCount : null,
        sameObject: patternbook.sameObject.count - generated.sameObject.count,
      },
    };
  });
  return { schema: HEAD_TO_HEAD_SCHEMA, subjects: out };
}

/** The one-table markdown (the AC's artifact); sheets referenced beside every verdict. */
export function headToHeadMd(h2h, { title = "Pattern-book vs metrology-path bests (E-31, T-127-01)" } = {}) {
  const lines = [`# ${title}`, "",
    "Verdicts quoted as judged (the frozen gate, one run per subject per label); deltas are",
    "arithmetic. Negative gap delta = fewer judged gaps than the metrology best; positive",
    "same-object delta = more views judged the same object.", ""];
  for (const s of h2h.subjects) {
    lines.push(`## ${s.key}`, "",
      "| path | verdict | gaps (count/budget) | same-object | kit presence | per-view |",
      "| --- | --- | --- | --- | --- | --- |");
    for (const r of s.rows) {
      const verdict = r.decided ? (r.passed ? "PASS" : "FAIL") : `REFUSAL (${r.refusal})`;
      const kp = r.kitPresence ? (r.kitPresence.ran ? (r.kitPresence.passed ? "pass" : "fail") : `not run (${r.kitPresence.reason})`) : "—";
      const perView = r.views.map((v) =>
        `${v.angle} ${v.outcome}${v.gaps.length ? ` (${v.gaps.map((g) => `${g.severity} ${g.attribute}@${g.region}`).join("; ")})` : ""}`,
      ).join("<br>");
      // v2 records show the severity-aware cap with the legacy ≤2 count beside; v1 records (no
      // policy) render exactly as before (legacy count/budget only).
      const gapsCell = r.policy
        ? `${r.minorCount}m+${r.majorCount}M (≤${r.minorBudget}) · legacy ${r.gapCount}/${r.gapBudget}`
        : `${r.gapCount ?? "—"}/${r.gapBudget ?? "—"}`;
      lines.push(`| **${r.label}** | ${verdict} | ${gapsCell} | ${r.sameObject.count}/${r.sameObject.total} | ${kp} | ${perView} |`);
    }
    lines.push("",
      `Deltas (patternbook − generated): gaps ${s.deltas.gapCount ?? "n/a"}, same-object ${s.deltas.sameObject >= 0 ? "+" : ""}${s.deltas.sameObject}.`,
      "");
    const unjudged = s.rows.filter((r) => r.views.some((v) => v.outcome === "coverage-rejected"));
    for (const r of unjudged) {
      lines.push(`> ⚠ ${r.label}: ${r.views.filter((v) => v.outcome === "coverage-rejected").length} view(s) ` +
        `coverage-rejected — the judge was never called there, so this row's gap count under-states the ` +
        `divergence; read the per-view column, not the arithmetic.`, "");
    }
    for (const r of s.rows) {
      if (r.sheet) lines.push(`Sheet (${r.label}): \`${r.sheet}\``);
    }
    lines.push("");
  }
  return lines.join("\n");
}
