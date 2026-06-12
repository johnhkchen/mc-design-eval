// THE PROPORTION MILESTONE (T-138-01, story S-138, epic E-33 terminal) — pure I/O over
// COMMITTED records: the chain re-runs' before/after silhouette ratios, the workshop ledgers'
// lever-use citations, the frozen gate's verdicts beside their pre-rotation baselines, BOTH
// gap-budget arithmetics (the ≤2 recalibration question is FLAGGED to the reviewer, never
// decided here — E-33 Rule 3), and the glance page (concept beside sheet) for pr/assets.
//
// THIS FILE READS GATE RECORDS BY PATH — like pattern-book-compare.mjs it is deliberately
// OUTSIDE the workshop isolation scan: it convenes nothing, judges nothing, writes no verdict
// record; it quotes verdicts as judged. Deterministic over its committed inputs (re-run →
// byte-identical). No model, no GL. Subjects come from the committed chain records themselves
// (no subject key in this source — E-25 Rule 3, self-grep embedded in the record).
//
// MODES
//   --baselines  run BEFORE the re-runs rotate anything: quote the pre-rotation gate
//                aggregates + chain final ratios + record shas into the committed baselines
//                record (the "before" of every movement claim; the retired pins' names).
//   (default)    compose the milestone record + the pr/assets glance page from baselines +
//                the re-run records.
//   --repro      re-derive the default-mode outputs and byte-compare. Exit 0/1.
//
// Usage: node benchmarks/sculpture/proportion-milestone.mjs [--baselines|--repro] [--rotate-pins]

import { readFile } from "node:fs/promises";
import { readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { replayLedger } from "../../src/workshop/replay.mjs";
import { silhouetteRatios } from "../../src/recognition/measured-program.mjs";
import { ROTATE_FLAG, preflightPins, guardedWriteRecord, loadTrackedSet, isTracked } from "../../src/form/pin-guard.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

export const PROPORTION_MILESTONE_SCHEMA = "proportion-milestone/v1";
export const PROPORTION_BASELINES_SCHEMA = "proportion-baselines/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CHAIN_REL = "benchmarks/sculpture/pattern-book";
const WORKSHOP_REL = "benchmarks/sculpture/workshop";
const GATE_REL = "benchmarks/sculpture/multi-angle";
const BASELINES_REL = `${CHAIN_REL}/proportion-baselines.json`;
const OUT_RELS = [`${CHAIN_REL}/proportion-milestone.json`, "pr/assets/proportion-milestone.md"];

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";
const readRel = (rel) => readFile(join(ROOT, rel), "utf8");
const readJson = async (rel) => JSON.parse(await readRel(rel));
const r4 = (x) => (x === null || x === undefined ? null : Math.round(x * 1e4) / 1e4);

const argv = process.argv.slice(2);
const baselinesMode = argv.includes("--baselines");
const repro = argv.includes("--repro");
const rotate = argv.includes(ROTATE_FLAG);

/** E-25 Rule 3 self-grep: no subject keys in this runner's source. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

/** The named runs are the COMMITTED CHAIN RECORDS (subject identity stays in data): every
 *  pattern-book/<runKey>.json that is a chain record, sorted by runKey. */
function chainRunKeys() {
  return readdirSync(join(ROOT, CHAIN_REL))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((rk) => Object.keys(SUBJECTS).some((k) => rk === k || rk.startsWith(`${k}--`)))
    .sort();
}

// runKey comes from the FILENAME, not the record — pre-T-132 chain records carry no runKey field
const gateLabelOf = (runKey, rec) => (runKey === rec.subject ? "patternbook" : `patternbook-${rec.pack}`);
const gateSlugOf = (runKey, rec) => `${rec.subject}-${gateLabelOf(runKey, rec)}`;
const packRelOf = (style) => `packs/${style}.json`;

/** Both gap-budget arithmetics, quoted from one gate record — never reconciled (E-33 Rule 3). */
function arithmeticsOf(gate) {
  const verdicts = (gate.views ?? []).map((v) => v.verdict?.verdict ?? null);
  const judged = verdicts.filter((x) => x !== null).length;
  const sameObject = verdicts.filter((x) => x === "same object").length;
  const severities = {};
  for (const v of gate.views ?? []) {
    for (const g of v.verdict?.gaps ?? []) severities[g.severity ?? "unstated"] = (severities[g.severity ?? "unstated"] ?? 0) + 1;
  }
  return {
    identity: { decided: gate.aggregate?.decided ?? false, sameObjectViews: sameObject, judgedViews: judged, severities },
    // T-144-01 dual reporting: v2 (deciding) beside the legacy ≤2 arithmetic. Pre-v2 records carry
    // no policy/legacy → those fields are null and `passed` is the legacy verdict.
    budget: {
      passed: gate.aggregate?.passed ?? null,
      policy: gate.aggregate?.policy ?? null,
      majorCount: gate.aggregate?.majorCount ?? null,
      minorCount: gate.aggregate?.minorCount ?? null,
      minorBudget: gate.aggregate?.minorBudget ?? null,
      gapCount: gate.aggregate?.gapCount ?? null, gapBudget: gate.aggregate?.gapBudget ?? null,
      legacy: gate.aggregate?.legacy ?? null,
    },
    coverageFailures: (gate.aggregate?.failures ?? []).filter((f) => f.reason === "coverage").map((f) => f.angle),
  };
}

/** Per-round silhouette ratios via the prefix replay (the T-135/T-136 instrument). */
function ratioRows(ledger, pack) {
  const rows = [];
  for (let r = 0; r <= ledger.rounds.length; r++) {
    const { program } = replayLedger({ ledger, pack, throughRound: r });
    rows.push({ round: r, ...silhouetteRatios(program) });
  }
  return rows;
}

function leverUse(ledger) {
  return ledger.rounds
    .filter((r) => ["geometry", "recognize"].includes(r.applied?.kind))
    .map((r) => ({
      round: r.round, kind: r.applied.kind,
      action: r.action ?? null,
      accepted: r.conformance?.accepted ?? false,
      reason: r.conformance?.reason ?? null,
    }));
}

const deltaRel = (measured, target) =>
  measured === null || target === null || target === 0 ? null : r4(Math.abs(measured - target) / Math.abs(target));

// ---------------------------------------------------------------- baselines mode

async function runBaselines() {
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [BASELINES_REL].map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate, intent: "proportion-milestone baselines capture (pre-rotation quotes)",
  });
  const subjects = [];
  for (const runKey of chainRunKeys()) {
    const chainText = await readRel(`${CHAIN_REL}/${runKey}.json`);
    const chain = JSON.parse(chainText);
    if (chain.status === "pipeline-failed") continue;
    const slug = gateSlugOf(runKey, chain);
    const gateRel = `${GATE_REL}/${slug}.json`;
    if (!existsSync(join(ROOT, gateRel))) continue;
    const gateText = await readRel(gateRel);
    const gate = JSON.parse(gateText);
    const pack = loadStylePack(join(ROOT, packRelOf(chain.pack)));
    const ledgerText = await readRel(`${WORKSHOP_REL}/${runKey}.json`);
    const ledger = JSON.parse(ledgerText);
    const rows = ratioRows(ledger, pack);
    subjects.push({
      runKey, subject: chain.subject, pack: chain.pack, gateSlug: slug,
      pins: {
        chain: { path: `${CHAIN_REL}/${runKey}.json`, sha256: sha256(chainText) },
        ledger: { path: `${WORKSHOP_REL}/${runKey}.json`, sha256: sha256(ledgerText) },
        gate: { path: gateRel, sha256: sha256(gateText) },
      },
      finalRatios: rows.at(-1),
      arithmetics: arithmeticsOf(gate),
    });
  }
  if (subjects.length === 0) throw new Error("no committed (chain + gate) pair to quote — nothing to baseline");
  const record = {
    schema: PROPORTION_BASELINES_SCHEMA, ticket: "T-138-01",
    note: "pre-rotation quotes — the re-runs retire these pins; the bytes remain in git history at these shas",
    subjects,
    generalization: await generalizationGrep(),
  };
  await guardedWriteRecord({ root: ROOT, rel: BASELINES_REL, content: jsonOf(record), rotate, trackedSet });
  console.error(`✓ baselines: ${subjects.length} subject(s) quoted → ${BASELINES_REL}`);
}

// ---------------------------------------------------------------- compose (default + --repro)

async function composeSubject(base) {
  const runKey = base.runKey;
  const chain = await readJson(`${CHAIN_REL}/${runKey}.json`);
  const pack = loadStylePack(join(ROOT, packRelOf(chain.pack)));
  const ledger = await readJson(`${WORKSHOP_REL}/${runKey}.json`);
  const seed = await readJson(`${WORKSHOP_REL}/${runKey}/program.json`);
  const gate = await readJson(`${GATE_REL}/${base.gateSlug}.json`);
  const targets = seed.declarations?.proportions?.targets ?? null;
  const rows = ratioRows(ledger, pack);
  const seedRow = rows[0];
  const finalRow = rows.at(-1);
  const ratioNames = ["ridgeToEave", "roofShare", "aspect"];
  const deltas = Object.fromEntries(ratioNames.map((n) => [n, {
    baseline: base.finalRatios?.[n] ?? null,
    seed: seedRow[n], final: finalRow[n], target: targets?.[n] ?? null,
    deltaRelBaseline: deltaRel(base.finalRatios?.[n] ?? null, targets?.[n] ?? null),
    deltaRelFinal: deltaRel(finalRow[n], targets?.[n] ?? null),
  }]));
  const after = arithmeticsOf(gate);
  return {
    runKey, subject: chain.subject, pack: chain.pack, gateSlug: base.gateSlug,
    proportionsDeclared: seed.declarations?.proportions ?? null,
    ratios: { targets, rows, deltas },
    workshop: {
      outcome: chain.stages?.workshop?.outcome ?? null,
      rounds: chain.stages?.workshop?.rounds ?? null,
      leverUse: leverUse(ledger),
      finalConformance: chain.stages?.workshop?.conformance?.final ?? null,
      finalConformancePassed: chain.stages?.workshop?.conformance?.finalPassed ?? null,
    },
    verdict: {
      baseline: base.arithmetics,
      after,
      movement: {
        gapCount: { before: base.arithmetics.budget.gapCount, after: after.budget.gapCount },
        coverageRefusedViews: { before: base.arithmetics.coverageFailures.length, after: after.coverageFailures.length },
        severities: { before: base.arithmetics.identity.severities, after: after.identity.severities },
      },
    },
    sheet: gate.sheet ?? null,
    concept: SUBJECTS[chain.subject]?.concept ? `benchmarks/sculpture/${SUBJECTS[chain.subject].concept}` : null,
    budgetFlag: "REVIEWER: both arithmetics above are reported, not reconciled — whether the ≤2 gap budget " +
      "should pass a decided all-minor verdict is E-33's open recalibration question (Rule 3), not decided here.",
  };
}

function milestoneMd(record) {
  const lines = [
    `# The proportion milestone — E-33 terminal (T-138-01)`,
    "",
    `The question the epic asked back: **does the form read right now?** Per subject: the`,
    `re-seeded measured program, the workshop under the armed proportion check with live geometry`,
    `levers, the frozen gate's verdict beside its pre-rotation baseline, and the glance — concept`,
    `beside sheet. Baselines: \`${BASELINES_REL}\` (retired pins named there with their shas).`,
    "",
  ];
  for (const s of record.subjects) {
    const t = s.ratios.targets ?? {};
    const d = s.ratios.deltas;
    const lever = s.workshop.leverUse;
    lines.push(
      `## ${s.runKey} (pack \`${s.pack}\`)`,
      "",
      s.concept && s.sheet ? `| concept | gate sheet |\n| --- | --- |\n| ![concept](../../${s.concept}) | ![sheet](${String(s.sheet).replace(/^\/?pr\/assets\//, "")}) |` : "*(render evidence paths in the JSON record)*",
      "",
      `**Ratios (silhouette, prefix-replayed)** — targets ridge:eave ${t.ridgeToEave ?? "—"} / roofShare ${t.roofShare ?? "—"} / aspect ${t.aspect ?? "—"}:`,
      "",
      `| | ridge:eave | roofShare | aspect |`,
      `| --- | --- | --- | --- |`,
      `| baseline final | ${d.ridgeToEave.baseline ?? "—"} | ${d.roofShare.baseline ?? "—"} | ${d.aspect.baseline ?? "—"} |`,
      `| re-run seed | ${d.ridgeToEave.seed} | ${d.roofShare.seed} | ${d.aspect.seed} |`,
      `| re-run final | ${d.ridgeToEave.final} | ${d.roofShare.final} | ${d.aspect.final} |`,
      `| Δrel vs target (baseline → final) | ${d.ridgeToEave.deltaRelBaseline ?? "—"} → ${d.ridgeToEave.deltaRelFinal ?? "—"} | ${d.roofShare.deltaRelBaseline ?? "—"} → ${d.roofShare.deltaRelFinal ?? "—"} | ${d.aspect.deltaRelBaseline ?? "—"} → ${d.aspect.deltaRelFinal ?? "—"} |`,
      "",
      `**The hands** (ledger \`${WORKSHOP_REL}/${s.runKey}.json\`): outcome **${s.workshop.outcome}**, ` +
      (lever.length
        ? `geometry-bearing rounds: ${lever.map((l) => `round ${l.round} ${l.kind}${l.action?.params ? ` ${JSON.stringify(l.action.params)}` : ""} — ${l.accepted ? "ACCEPTED" : `rolled back (${l.reason})`}`).join("; ")}.`
        : `the levers existed and were NOT aimed — the recorded capability finding.`),
      "",
      `**Verdict vs baseline** (gate \`${GATE_REL}/${s.gateSlug}.json\`):`,
      `- identity arithmetic: ${s.verdict.after.identity.sameObjectViews}/${s.verdict.after.identity.judgedViews} same-object` +
      ` (baseline ${s.verdict.baseline.identity.sameObjectViews}/${s.verdict.baseline.identity.judgedViews}` +
      `${s.verdict.baseline.coverageFailures.length ? `, ${s.verdict.baseline.coverageFailures.length} views coverage-refused` : ""});` +
      ` severities ${JSON.stringify(s.verdict.after.identity.severities)} (baseline ${JSON.stringify(s.verdict.baseline.identity.severities)})`,
      `- budget arithmetic: ${s.verdict.after.budget.gapCount}/${s.verdict.after.budget.gapBudget} gaps → ${s.verdict.after.budget.passed ? "PASS" : "FAIL"}` +
      ` (baseline ${s.verdict.baseline.budget.gapCount ?? "—"}/${s.verdict.baseline.budget.gapBudget ?? "—"} → ${s.verdict.baseline.budget.passed === null ? "—" : s.verdict.baseline.budget.passed ? "PASS" : "FAIL"})`,
      `- ${s.budgetFlag}`,
      "",
    );
  }
  lines.push(
    `---`,
    "",
    `Replay: \`npm run milestone:proportion:repro\` (byte-identical, no model, no GL). The chain`,
    `records carry the measured-program sources/conflicts; the gate records carry both coverage`,
    `arithmetics per view (T-137). E-12 handoff: this page + the JSON record beside it.`,
    "",
  );
  return lines.join("\n");
}

async function compose() {
  const baselines = await readJson(BASELINES_REL).catch(() => {
    throw new Error(`baselines record absent (${BASELINES_REL}) — run --baselines BEFORE the re-runs rotate the pins`);
  });
  const subjects = [];
  for (const base of baselines.subjects) subjects.push(await composeSubject(base));
  const record = {
    schema: PROPORTION_MILESTONE_SCHEMA, ticket: "T-138-01",
    baselines: { path: BASELINES_REL, note: baselines.note },
    subjects,
    generalization: await generalizationGrep(),
  };
  return { record, md: milestoneMd(record) };
}

async function runCompose() {
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: OUT_RELS.map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate, intent: "proportion-milestone composition",
  });
  const { record, md } = await compose();
  await guardedWriteRecord({ root: ROOT, rel: OUT_RELS[0], content: jsonOf(record), rotate, trackedSet });
  await guardedWriteRecord({ root: ROOT, rel: OUT_RELS[1], content: md, rotate, trackedSet });
  console.error(`✓ milestone: ${record.subjects.length} subject(s) → ${OUT_RELS.join(", ")}`);
}

async function runRepro() {
  const { record, md } = await compose();
  const problems = [];
  const committed = await readRel(OUT_RELS[0]).catch(() => null);
  if (committed === null) problems.push(`committed record absent (${OUT_RELS[0]})`);
  else if (committed !== jsonOf(record)) problems.push("re-derived milestone record DIVERGES from the committed one");
  const committedMd = await readRel(OUT_RELS[1]).catch(() => null);
  if (committedMd === null) problems.push(`committed md absent (${OUT_RELS[1]})`);
  else if (committedMd !== md) problems.push("re-derived milestone md DIVERGES from the committed one");
  for (const p of problems) console.error(`[milestone --repro] ${p}`);
  console.log(problems.length === 0
    ? "[milestone --repro] REPRODUCES byte-identically (baselines + committed records → milestone)"
    : `[milestone --repro] ${problems.length} problem(s)`);
  process.exit(problems.length === 0 ? 0 : 1);
}

if (baselinesMode && repro) {
  console.error("proportion-milestone: --baselines and --repro are separate modes; pick one");
  process.exit(2);
} else if (baselinesMode) {
  await runBaselines();
} else if (repro) {
  await runRepro();
} else {
  await runCompose();
}
