// BUDGET CALIBRATION SWEEP — the glance-true-budget evidence (T-144-01, story S-144, epic E-34).
//
// Pure RE-DERIVATION over committed multi-angle gate records: for every DECIDED record it recomputes
// both arithmetics — budget policy v2 (identity-first, severity-aware; src/form/multi-angle-gate.mjs
// budgetVerdict) and the LEGACY flat ≤2 — straight from the record's committed views[].gaps[]. NO
// judge call, NO render, NO re-judging; the committed gate records are opened READ-ONLY (a committed
// verdict is never re-judged — the budget is arithmetic on its recorded gaps). The sweep asserts the
// binding calibration anchors and writes the evidence record + md.
//
// Anchors (AC2): barn-patternbook & barn-patternbook-saltcrag (every view same-object, 8 minor, 0
// major) must PASS v2; cottage-patternbook (the T-138-02 cottage: 2/4 same-object, 7 minor + 4 major)
// must FAIL v2. Coverage-refused records are NOTED, not re-scored. Non-zero exit on any anchor miss.
//
//   npm run gate:calibrate                  # re-derive + write the evidence record
//   npm run gate:calibrate -- --rotate-pins # re-write the committed evidence (explicit rotation)

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import {
  budgetVerdict, MULTI_ANGLE_GATE_SCHEMA, MULTI_ANGLE_BUDGET_SCHEMA,
} from "../../src/form/multi-angle-gate.mjs";
import { ROTATE_FLAG, guardedWriteRecord } from "../../src/form/pin-guard.mjs";

export const BUDGET_CALIBRATION_SCHEMA = "budget-calibration/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const REC_DIR = join(ROOT, "measurements/multi-angle");
const OUT_REL = "measurements/multi-angle/budget-calibration";

// The binding anchors (AC2): expected v2 verdict per record (legacy is reported, never asserted).
const ANCHORS = {
  "barn-patternbook": { v2: true, why: "every view same-object, 8 minor, 0 major — glance-passing (T-138-01)" },
  "barn-patternbook-saltcrag": { v2: true, why: "every view same-object, 8 minor, 0 major — glance-passing (T-138-01)" },
  "cottage-patternbook": { v2: false, why: "2/4 same-object, 7 minor + 4 major — glance-failing (T-138-02)" },
};

/** Tally + both arithmetics from one DECIDED committed record (read-only). */
function deriveRow(rec) {
  const views = rec.views ?? [];
  const coverageRefused = views.some((v) => v.coverage?.passed === false);
  let same = 0, drift = 0;
  for (const v of views) {
    if (v.verdict?.verdict === "same object") same += 1;
    else if (v.verdict) drift += 1;
  }
  // budgetVerdict consumes the same {angle, coverage, verdict} shape the live aggregate passes.
  const bv = budgetVerdict(
    views.map((v) => ({ angle: v.angle, coverage: v.coverage, verdict: v.verdict })),
    { gapBudget: MULTI_ANGLE_GATE.gapBudget, minorBudget: MULTI_ANGLE_GATE.minorBudget },
  );
  return {
    slug: `${rec.subject}-${rec.label}`,
    sameObject: same, drifted: drift, coverageRefused,
    majorCount: bv.majorCount, minorCount: bv.minorCount,
    v2: { policy: MULTI_ANGLE_BUDGET_SCHEMA, passed: bv.passed, minorBudget: bv.minorBudget,
          failures: bv.failures },
    legacy: { passed: bv.legacyPassed, gapBudget: bv.gapBudget, gapCount: bv.gapCount },
    // what the record COMMITTED at judge time (its own recorded verdict — for the audit trail).
    committed: rec.aggregate?.decided ? { passed: rec.aggregate.passed, gapCount: rec.aggregate.gapCount } : null,
  };
}

function md(record) {
  const lines = [
    `# Budget calibration — glance-true (${BUDGET_CALIBRATION_SCHEMA}, T-144-01, E-34)`,
    "",
    "Pure re-derivation over committed multi-angle gate records — **no judge, no re-judging**; both",
    "arithmetics recomputed from each record's committed `views[].gaps[]`. The deciding policy is **v2**",
    "(identity-first: every view same-object ∧ zero major ∧ minors ≤ minorBudget); the **legacy ≤2** flat",
    "budget is reported beside it for continuity.",
    "",
    `**minorBudget = ${record.minorBudget}** (derivation): the glance-passing observed ceiling is 8 minors`,
    "(the two T-138 barns); the structural ceiling is 4×MAX_GAPS_PER_VIEW = 12; 10 is the midpoint — it",
    "bites only at >2.5 cosmetic papercuts per view averaged while clearing both barn anchors with",
    "headroom. Calibrated, then frozen.",
    "",
    "| record | same/drift | major | minor | **v2** | legacy ≤2 | anchor |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of record.rows) {
    const anchor = record.anchors.find((a) => a.slug === r.slug);
    const tag = anchor ? (anchor.ok ? `✓ ${anchor.expected ? "PASS" : "FAIL"}` : "✗ MISMATCH") : (r.coverageRefused ? "noted (coverage)" : "");
    lines.push(`| ${r.slug} | ${r.sameObject}/${r.drifted} | ${r.majorCount} | ${r.minorCount} | ` +
      `**${r.v2.passed ? "PASS" : "FAIL"}** | ${r.legacy.passed ? "PASS" : "FAIL"} ${r.legacy.gapCount}/${r.legacy.gapBudget} | ${tag} |`);
  }
  lines.push("",
    `Anchors (AC2): ${record.anchors.every((a) => a.ok) ? "**all hold**" : "**FAILED**"} — ` +
    record.anchors.map((a) => `${a.slug} ${a.ok ? "✓" : "✗"} (${a.expected ? "PASS" : "FAIL"})`).join(", ") + ".",
    "",
    "Coverage-refused records are **noted, not re-scored** (their judge was deliberately never called on",
    "the short-circuited view): " +
      (record.rows.filter((r) => r.coverageRefused).map((r) => r.slug).join(", ") || "none") + ".",
    "");
  return lines.join("\n");
}

async function main() {
  const rotate = process.argv.includes(ROTATE_FLAG);
  const files = (await readdir(REC_DIR)).filter((f) => f.endsWith(".json") && f !== "budget-calibration.json");
  const rows = [];
  for (const f of files.sort()) {
    const rec = JSON.parse(await readFile(join(REC_DIR, f), "utf8"));
    if (rec.schema !== MULTI_ANGLE_GATE_SCHEMA) continue;
    if (rec.aggregate?.decided !== true) continue; // refusals have no verdict to re-derive
    rows.push(deriveRow(rec));
  }

  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const anchors = Object.entries(ANCHORS).map(([slug, spec]) => {
    const row = bySlug.get(slug);
    return {
      slug, expected: spec.v2, why: spec.why,
      actual: row ? row.v2.passed : null,
      ok: row != null && row.v2.passed === spec.v2,
    };
  });

  const record = {
    schema: BUDGET_CALIBRATION_SCHEMA,
    ticket: "T-144-01",
    policy: MULTI_ANGLE_BUDGET_SCHEMA,
    minorBudget: MULTI_ANGLE_GATE.minorBudget,
    gapBudget: MULTI_ANGLE_GATE.gapBudget,
    derivation: "glance-passing observed ceiling 8 (two T-138 barns); structural ceiling 4×3=12; " +
      "minorBudget=10 is the midpoint — a real papercut tripwire (bites 11–12) that clears both barn anchors.",
    anchors,
    rows: rows.sort((a, b) => a.slug.localeCompare(b.slug)),
  };

  await guardedWriteRecord({ root: ROOT, rel: `${OUT_REL}.json`, content: JSON.stringify(record, null, 2) + "\n", rotate });
  await guardedWriteRecord({ root: ROOT, rel: `${OUT_REL}.md`, content: md(record), rotate });

  for (const a of anchors) {
    console.error(`[calibrate] anchor ${a.slug}: expect v2 ${a.expected ? "PASS" : "FAIL"}, got ` +
      `${a.actual === null ? "MISSING" : a.actual ? "PASS" : "FAIL"} — ${a.ok ? "OK" : "MISMATCH"}`);
  }
  const allOk = anchors.every((a) => a.ok);
  console.error(`[calibrate] ${rows.length} decided records re-derived; anchors ${allOk ? "ALL HOLD" : "FAILED"}; ` +
    `wrote ${OUT_REL}.{json,md}`);
  process.exitCode = allOk ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(2); });
}
