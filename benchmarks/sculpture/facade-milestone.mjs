// THE FACADE MILESTONE (T-149-01, story S-149, epic E-35 terminal) — pure I/O over COMMITTED
// records: the texture question's verdicts beside their pre-rotation baselines, with BOTH
// arithmetics quoted on every row — the prior kit-aware verdict (kit-aware-gate/v1) + the budget
// arithmetic (v2 deciding, legacy ≤2 beside) AND the T-148 relief-aware verdict (relief-aware-gate/
// v1) once a build carries relief and the subject opts into the relief lens. Until the operator runs
// the live relieved chain + judge, the relief lens is unarmed on every committed gate record
// (`reliefAware` absent), so the milestone honestly reports `armed:false` beside the flat-build
// verdict — that is the pre-rotation texture baseline this epic was built from.
//
// THIS FILE READS GATE RECORDS BY PATH — like proportion-milestone.mjs / pattern-book-compare.mjs it
// is OUTSIDE the workshop isolation scan: it convenes nothing, judges nothing, writes no verdict; it
// QUOTES verdicts as judged. Deterministic over committed inputs (re-run → byte-identical). No model,
// no GL. Subjects come from the committed chain records themselves (E-25 Rule 3 — no subject key in
// this source; the self-grep proves it). Baselines are NEVER re-banked: --baselines snapshots the
// pre-rotation shas; the operator's --rotate-pins judge run retires them and git history holds them.
//
// MODES
//   --baselines  snapshot the CURRENT committed gate verdicts (the pre-rotation, flat-build texture
//                baseline) + their shas into facade-baselines.json. Run BEFORE the live judge rotates.
//   (default)    compose facade-milestone.json + pr/assets/facade-milestone.md from the baselines
//                (pre) beside the current gate records (post). Both arithmetics on every row.
//   --repro      re-derive the default-mode outputs and byte-compare. Exit 0/1. No model, no GL.
//
// Usage: node benchmarks/sculpture/facade-milestone.mjs [--baselines|--repro] [--rotate-pins]

import { readFile } from "node:fs/promises";
import { readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { ROTATE_FLAG, preflightPins, guardedWriteRecord, loadTrackedSet, isTracked } from "../../src/form/pin-guard.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

export const FACADE_MILESTONE_SCHEMA = "facade-milestone/v1";
export const FACADE_BASELINES_SCHEMA = "facade-baselines/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CHAIN_REL = "benchmarks/sculpture/pattern-book";
const GATE_REL = "benchmarks/sculpture/multi-angle";
const BASELINES_REL = `${CHAIN_REL}/facade-baselines.json`;
const MILESTONE_JSON_REL = `${CHAIN_REL}/facade-milestone.json`;
const MILESTONE_MD_REL = "pr/assets/facade-milestone.md";

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";
const readRel = (rel) => readFile(join(ROOT, rel), "utf8");

const argv = process.argv.slice(2);
const baselinesMode = argv.includes("--baselines");
const repro = argv.includes("--repro");
const rotate = argv.includes(ROTATE_FLAG);

/** E-25 Rule 3 self-grep: no subject keys baked into this runner's source. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

/** The named runs are the COMMITTED CHAIN RECORDS (subject identity stays in data). */
function chainRunKeys() {
  return readdirSync(join(ROOT, CHAIN_REL))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((rk) => Object.keys(SUBJECTS).some((k) => rk === k || rk.startsWith(`${k}--`)))
    .sort();
}

const gateLabelOf = (runKey, rec) => (runKey === rec.subject ? "patternbook" : `patternbook-${rec.pack}`);
const gateSlugOf = (runKey, rec) => `${rec.subject}-${gateLabelOf(runKey, rec)}`;

/**
 * BOTH arithmetics, quoted from one gate record — never reconciled. The prior (kit-aware +
 * budget v2/legacy) BESIDE the relief-aware verdict. A committed record without the relief lens
 * (the flat-build baseline) reports `reliefAware.armed:false` — honest, not a fabricated pass.
 */
function arithmeticsOf(gate) {
  return {
    kitAware: {
      schema: gate.overall?.schema ?? null,
      passed: gate.overall?.passed ?? null,
      decided: gate.overall?.decided ?? null,
    },
    budget: {
      policy: gate.aggregate?.policy ?? null,
      passed: gate.aggregate?.passed ?? null,
      majorCount: gate.aggregate?.majorCount ?? null,
      minorCount: gate.aggregate?.minorCount ?? null,
      minorBudget: gate.aggregate?.minorBudget ?? null,
      gapCount: gate.aggregate?.gapCount ?? null,
      gapBudget: gate.aggregate?.gapBudget ?? null,
      legacy: gate.aggregate?.legacy ?? null,
    },
    // T-148 relief-aware-gate/v1 — present only when the subject opted into the relief lens AND the
    // build carried relief. Absent ⇒ the flat anti-anchor baseline (the lens would FAIL it; that flip
    // is proven by relief-calibration.mjs, never by mutating a committed verdict here).
    reliefAware: gate.reliefAware
      ? {
          schema: gate.reliefAware.schema ?? "relief-aware-gate/v1",
          passed: gate.reliefAware.passed ?? null,
          armed: true,
          missing: gate.relief?.missing ?? gate.relief?.presence?.missing ?? null,
        }
      : { armed: false, note: "relief lens unarmed on this committed record (flat-build texture baseline)" },
  };
}

/** Read each committed (chain, gate) pair; return the quotable rows. */
async function rows() {
  const out = [];
  for (const runKey of chainRunKeys()) {
    const chainText = await readRel(`${CHAIN_REL}/${runKey}.json`);
    const chain = JSON.parse(chainText);
    if (chain.status === "pipeline-failed") continue;
    const slug = gateSlugOf(runKey, chain);
    const gateRel = `${GATE_REL}/${slug}.json`;
    if (!existsSync(join(ROOT, gateRel))) continue;
    const gateText = await readRel(gateRel);
    const gate = JSON.parse(gateText);
    out.push({
      runKey, subject: chain.subject, pack: chain.pack, gateSlug: slug,
      gatePin: { path: gateRel, sha256: sha256(gateText) },
      arithmetics: arithmeticsOf(gate),
    });
  }
  return out;
}

// ---------------------------------------------------------------- baselines mode

async function runBaselines() {
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [{ rel: BASELINES_REL, tracked: isTracked(trackedSet, BASELINES_REL) }],
    rotate, intent: "facade-milestone baselines capture (pre-rotation texture quotes)",
  });
  const subjects = await rows();
  if (subjects.length === 0) throw new Error("no committed (chain + gate) pair to quote — nothing to baseline");
  const record = {
    schema: FACADE_BASELINES_SCHEMA, ticket: "T-149-01",
    note: "pre-rotation texture quotes — the live relieved judge run retires these pins; the bytes remain in git history at these shas. Baselines are NEVER re-banked.",
    subjects,
    generalization: await generalizationGrep(),
  };
  await guardedWriteRecord({ root: ROOT, rel: BASELINES_REL, content: jsonOf(record), rotate, trackedSet });
  console.error(`✓ baselines: ${subjects.length} subject(s) quoted → ${BASELINES_REL}`);
}

// ---------------------------------------------------------------- compose (default + --repro)

/** Compose the milestone record: baselines (pre) beside current gate verdicts (post). Pure read. */
export async function composeMilestone() {
  const post = await rows();
  const baselines = existsSync(join(ROOT, BASELINES_REL)) ? JSON.parse(await readRel(BASELINES_REL)) : null;
  const preBySlug = new Map((baselines?.subjects ?? []).map((s) => [s.gateSlug, s]));
  const subjects = post.map((p) => {
    const pre = preBySlug.get(p.gateSlug) ?? null;
    return {
      subject: p.subject, runKey: p.runKey, pack: p.pack, gateSlug: p.gateSlug,
      pre: pre ? { gatePin: pre.gatePin, arithmetics: pre.arithmetics } : null,
      post: { gatePin: p.gatePin, arithmetics: p.arithmetics },
      // the honest texture finding, surfaced per subject (not decided here — quoted):
      reliefArmed: p.arithmetics.reliefAware.armed,
    };
  });
  const anyArmed = subjects.some((s) => s.reliefArmed);
  return {
    schema: FACADE_MILESTONE_SCHEMA, ticket: "T-149-01",
    note: anyArmed
      ? "the texture question, decided live: the relief-aware verdict beside the prior kit-aware + budget arithmetics."
      : "PRE-OPERATOR STATE: no committed build carries relief yet — the relief lens is unarmed on every gate record (the flat-build texture baseline). Run the live relieved chain + judge (see T-149-01 review.md runbook), then re-compose to arm the relief-aware column.",
    baselinesQuoted: baselines != null,
    subjects,
    generalization: await generalizationGrep(),
  };
}

function milestoneMd(record) {
  const lines = [
    `# Facade milestone — texture finish (E-35, ${record.schema})`,
    "",
    record.note,
    "",
    "| run | kit-aware (prior) | budget v2 / legacy | relief-aware (T-148) |",
    "| --- | --- | --- | --- |",
  ];
  for (const s of record.subjects) {
    const a = s.post.arithmetics;
    const kit = `${a.kitAware.schema ?? "—"}: ${a.kitAware.passed === null ? "—" : a.kitAware.passed ? "PASS" : "FAIL"}`;
    const v2 = a.budget.policy ?? "—";
    const v2pass = a.budget.passed === null ? "—" : a.budget.passed ? "PASS" : "FAIL";
    const legacy = a.budget.gapBudget == null ? "—" : `legacy ≤${a.budget.gapBudget}: ${a.budget.gapCount} gap → ${a.budget.gapCount <= a.budget.gapBudget ? "PASS" : "FAIL"}`;
    const relief = a.reliefAware.armed
      ? `relief-aware-gate/v1: ${a.reliefAware.passed ? "PASS" : "FAIL"} (missing ${a.reliefAware.missing ?? "?"})`
      : "unarmed (flat baseline)";
    lines.push(`| ${s.runKey} | ${kit} | ${v2} ${v2pass} / ${legacy} | ${relief} |`);
  }
  lines.push("", "_Quoted from committed gate records; baselines never re-banked. No model, no GL._", "");
  return lines.join("\n");
}

async function runCompose() {
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [MILESTONE_JSON_REL, MILESTONE_MD_REL].map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate, intent: "facade-milestone compose",
  });
  const record = await composeMilestone();
  await guardedWriteRecord({ root: ROOT, rel: MILESTONE_JSON_REL, content: jsonOf(record), rotate, trackedSet });
  await guardedWriteRecord({ root: ROOT, rel: MILESTONE_MD_REL, content: milestoneMd(record), rotate, trackedSet });
  console.error(`✓ facade-milestone: ${record.subjects.length} subject(s) → ${MILESTONE_JSON_REL} (relief armed: ${record.subjects.some((s) => s.reliefArmed)})`);
}

async function runRepro() {
  const record = await composeMilestone();
  const problems = [];
  for (const [rel, want] of [[MILESTONE_JSON_REL, jsonOf(record)], [MILESTONE_MD_REL, milestoneMd(record)]]) {
    if (!existsSync(join(ROOT, rel))) { problems.push(`${rel}: not committed (run default mode first)`); continue; }
    const have = await readRel(rel);
    if (have !== want) problems.push(`${rel}: re-derivation differs from the committed bytes`);
  }
  for (const p of problems) console.error(`[facade-milestone --repro] ${p}`);
  console.error(`[facade-milestone --repro] ${problems.length === 0 ? "BYTE-IDENTICAL — re-derives from committed records" : `${problems.length} problem(s)`}`);
  if (problems.length) process.exit(1);
}

// ---------------------------------------------------------------- CLI

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (baselinesMode) await runBaselines();
  else if (repro) await runRepro();
  else await runCompose();
}
