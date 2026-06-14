// IMPURE RUNNER — the E-27 terminal record (story S-107, ticket T-107-01): the reconstructed
// chain, end-to-end, with the instrument frozen.
//
// THE EPIC'S CLAIM UNDER TEST: removing decimated-mesh noise AT THE SOURCE (regularized mass,
// parametric roof, generated arches, component-fed skin) moves the E-25/E-26 verdicts honestly.
// One named run per subject executes provision → shell integrity → regularization cage →
// reconstruct (the pinned committed component layer: decompose + rebuild, drift THROWS) → skin →
// grammar → dressing → settle → kit-aware + multi-angle gates — all inside the existing milestone
// runners; this runner is the per-subject orchestrator + the terminal evidence record:
//
//   1. PRE-CAPTURE the committed gate record's contract + judge model (the frozen instrument).
//   2. VERIFY the component layer (componentLayer — shared with the T-106 runner, one source of
//      truth; absences and stale pins are named findings).
//   3. RUN the chain through the milestone runner — styled for kit-bearing subjects, challenge for
//      kit-less ones; the choice is REGISTRY DATA (def.kitRecord), never a subject branch.
//   4. CONFIRM THE INSTRUMENT: deep-diff the fresh gate contract + judge model against the
//      pre-captured one (or src/config.mjs for a first gate record) — AC #2's "no
//      threshold/azimuth/judge-contract diffs", recorded, not asserted by hand.
//   5. METRICS before/after (AC #3): protrusion census + ragged-column rate on the pinned
//      E-26 baseline (e26-baseline/v1, provenance-stamped snapshot from history) vs the fresh
//      final; roof fit deltas; cage outcomes; the coverage-refusal re-measurement when the chain
//      refuses (the honest-finding branch).
//   6. SHEETS (AC #4): 4-azimuth before/after via the shared renderSheet, copied to pr/assets.
//
// HONEST FAILURE (E-25 Rule 6): a milestone pipeline-failed record IS the result — distilled with
// its measured cause, recorded, exit 1. A gate FAIL is a VERDICT. Verdicts are judged ONCE; this
// runner never re-rolls a judge (the flappy-budget anti-pattern, named at E-26).
//
//   npm run reconstructed:<subject>
//   ... -- --repro     # forward the milestone's fresh-process re-proof (judge NOT re-run)
//   ... -- --offline   # re-assert the committed record against the milestone/gate records on disk
//
// GENERALIZATION (E-25 Rule 3): no subject keys, constants, branches, or thresholds in this file —
// subjects are durable-skin registry data; the record embeds a self-grep proving it.

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { SUBJECTS } from "./durable-skin.mjs";
import { componentLayer } from "./component-skin.mjs";
import { ROTATE_FLAG, guardedWriteRecord } from "../../src/form/pin-guard.mjs";
import { renderSheet } from "./placement-grammar.mjs";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { protrusionCensus, raggedColumnRate } from "../../src/view/shell-regularize.mjs";
import { MULTI_ANGLE_GATE, PHASE1_MODEL_ID } from "../../src/config.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "reconstructed");

// T-119-01: committed-record overwrites are explicit (pin-guard); byte-identical rewrites pass.
const ROTATE = process.argv.includes(ROTATE_FLAG);
const writeRec = (abs, content) => guardedWriteRecord({ root: ROOT, rel: abs.replace(ROOT, ""), content, rotate: ROTATE });

const FRAMES_DIR = join(ROOT, "pr/assets/frames");

export const RECORD_SCHEMA = "reconstructed-milestone/v1";
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const readJson = async (rel) => JSON.parse(await readFile(join(HERE, rel), "utf8"));
const has = (rel) => existsSync(join(HERE, rel));
const canon = (v) => JSON.stringify(v ?? null);

/** Census over a full artifact occupancy — the SAME basis as the E-27 motivating numbers
 *  (a stair/slab cell is an occupied cell; the lens never feeds this). */
function census(artifact) {
  const occ = artifactOccupancy(artifact);
  const p = protrusionCensus(occ);
  const r = raggedColumnRate(occ);
  return { spikes: p.spikes, ragged: r.ragged, columns: r.total, raggedRate: Number(r.rate.toFixed(4)) };
}

/** AC #2 — the frozen instrument, confirmed by diff, never by assertion. */
function instrumentDiff(preGate, freshGate) {
  if (!freshGate) return { frozen: null, comparedTo: null, diffs: [], judgeModels: [], note: "no gate ran (chain refused before the gate) — nothing to diff; the instrument is untouched by construction" };
  const judgeModels = [...new Set((freshGate.views ?? []).map((v) => v.judge?.model).filter(Boolean))];
  const diffs = [];
  if (preGate) {
    for (const k of new Set([...Object.keys(preGate.contract ?? {}), ...Object.keys(freshGate.contract ?? {})])) {
      if (canon(preGate.contract?.[k]) !== canon(freshGate.contract?.[k])) {
        diffs.push({ field: `contract.${k}`, before: preGate.contract?.[k] ?? null, after: freshGate.contract?.[k] ?? null });
      }
    }
    const preModels = [...new Set((preGate.views ?? []).map((v) => v.judge?.model).filter(Boolean))];
    if (canon(preModels) !== canon(judgeModels)) diffs.push({ field: "judge.model", before: preModels, after: judgeModels });
    return { frozen: diffs.length === 0, comparedTo: "committed pre-run gate record", diffs, judgeModels };
  }
  // first gate record for this subject/label — compare against the single-sourced config
  if (canon(freshGate.contract?.azimuths) !== canon(MULTI_ANGLE_GATE.azimuths)) {
    diffs.push({ field: "contract.azimuths", before: MULTI_ANGLE_GATE.azimuths, after: freshGate.contract?.azimuths ?? null });
  }
  if (freshGate.contract?.gapBudget !== MULTI_ANGLE_GATE.gapBudget) {
    diffs.push({ field: "contract.gapBudget", before: MULTI_ANGLE_GATE.gapBudget, after: freshGate.contract?.gapBudget ?? null });
  }
  if (judgeModels.some((m) => m !== PHASE1_MODEL_ID)) diffs.push({ field: "judge.model", before: [PHASE1_MODEL_ID], after: judgeModels });
  return { frozen: diffs.length === 0, comparedTo: "src/config.mjs (no committed gate record predates this run)", diffs, judgeModels };
}

/** Roof fit out of the committed roof-program record (AC #3 "roof fit errors").
 *  A side where the T-104 attempt-ladder REJECTED the glb pitch (cage-arbitrated, voxel won)
 *  carries the glb/voxel DIVERGENCE — that number is WHY voxel won, not a fit error of the build. */
function roofFitSummary(roofRec) {
  if (!roofRec) return null;
  const sides = (roofRec.fit?.gables ?? []).flatMap((g) => g.sides ?? []);
  const adopted = sides.reduce((acc, s) => ((acc[s.pitchSource ?? "unknown"] = (acc[s.pitchSource ?? "unknown"] ?? 0) + 1), acc), {});
  const rejectedGlb = sides
    .filter((s) => s.pitchSource === "voxel" && s.pitch != null && s.glbPitch != null)
    .map((s) => Number(Math.abs(s.pitch - s.glbPitch).toFixed(4)));
  return {
    status: roofRec.status ?? null,
    gables: roofRec.fit?.gables?.length ?? 0,
    sides: sides.length,
    adoptedPitchBy: adopted,
    glbRejectedDivergence: rejectedGlb.length ? { max: Math.max(...rejectedGlb), count: rejectedGlb.length, note: "glb pitch rejected by the attempt-ladder on these sides — the divergence is the rejection cause, not a build fit error" } : null,
  };
}

/** The coverage-refusal re-measurement out of a pipeline-failed chain error (the honest branch). */
function coverageRefusal(error) {
  if (!error) return null;
  const m = String(error).match(/coverage gate FAILED[^:]*: (\w+) (\w+)=([\d.]+) < ([\d.]+)/);
  if (!m) return null;
  const censusMatch = String(error).match(/\[census: (.*)\]/s);
  return { zone: m[1], block: m[2], fraction: Number(m[3]), threshold: Number(m[4]), census: censusMatch ? censusMatch[1] : null };
}

/** Last completed artifact on disk for the "after" side — named, never guessed. */
function afterArtifact(mile, milestonePrefix) {
  const fromRecord = mile.artifacts?.styled ?? mile.artifacts?.final ?? null;
  const candidates = fromRecord ? [fromRecord] : [
    `${milestonePrefix}/artifact.json`,
    `${milestonePrefix}/reconstructed-artifact.json`,
    `${milestonePrefix}/shell-artifact.json`,
  ];
  for (const rel of candidates) if (has(rel)) return rel;
  return null;
}

function renderMd(r) {
  const f = (x) => (x == null ? "—" : x);
  const pct = (x) => (x == null ? "—" : (x * 100).toFixed(1) + "%");
  const lines = [
    `# Reconstructed milestone — ${r.subject} (T-107-01, E-27 terminal)`,
    "",
    `Chain: \`${r.chain.runner}\` → ${r.chain.status}${r.chain.stage ? ` @ ${r.chain.stage}` : ""}; ` +
      `gate: **${f(r.chain.gate?.outcome)}**${r.verdicts?.kitPresence ? `; kit presence: **${r.verdicts.kitPresence.passed ? "PASS" : "FAIL"}**` : ""}`,
    "",
    `Instrument: **${r.instrument.frozen === false ? "DIFFS — see record" : r.instrument.frozen === true ? "frozen (zero diffs)" : "untouched (no gate ran)"}** ` +
      `vs ${f(r.instrument.comparedTo)}; judge ${r.instrument.judgeModels.join(", ") || "—"}`,
    "",
    "## Verdicts per azimuth",
    "",
  ];
  if (r.verdicts?.views?.length) {
    lines.push("| azimuth | verdict | gaps (region/attribute, severity) |", "|---|---|---|");
    for (const v of r.verdicts.views) {
      const gaps = (v.gaps ?? []).map((g) => `${g.region}/${g.attribute} (${g.severity})`).join("; ") || "—";
      lines.push(`| ${v.angle} ${v.azimuthDeg}° | ${f(v.verdict)}${v.reason ? ` (${v.reason})` : ""} | ${gaps} |`);
    }
  } else {
    lines.push(`No per-view verdicts — ${f(r.chain.error)}`);
  }
  lines.push(
    "",
    "## Metrics before/after",
    "",
    "| metric | E-26 baseline | reconstructed | source |",
    "|---|---|---|---|",
    `| protrusions (≥4/6 faces) | ${f(r.metrics.census.before?.spikes)} | ${f(r.metrics.census.after?.spikes)} | ${f(r.metrics.census.before?.source)} → ${f(r.metrics.census.after?.source)} |`,
    `| ragged columns | ${f(r.metrics.census.before?.ragged)}/${f(r.metrics.census.before?.columns)} (${pct(r.metrics.census.before?.raggedRate)}) | ${f(r.metrics.census.after?.ragged)}/${f(r.metrics.census.after?.columns)} (${pct(r.metrics.census.after?.raggedRate)}) | same |`,
  );
  if (r.metrics.roofFit) {
    lines.push(`| roof fit | — | ${r.metrics.roofFit.status}: ${r.metrics.roofFit.gables} gables, pitch by ${JSON.stringify(r.metrics.roofFit.adoptedPitchBy)}${r.metrics.roofFit.glbRejectedDivergence ? `, glb rejected on ${r.metrics.roofFit.glbRejectedDivergence.count} (divergence ≤ ${r.metrics.roofFit.glbRejectedDivergence.max})` : ""} | roof record |`);
  }
  if (r.metrics.cage) {
    lines.push(`| cage steps | — | ${r.metrics.cage.accepted} accepted / ${r.metrics.cage.rejected} rolled back | ${f(r.metrics.cage.source)} |`);
  }
  if (r.metrics.coverageRefusal) {
    lines.push("", `Coverage refusal (re-measured): \`${r.metrics.coverageRefusal.zone} ${r.metrics.coverageRefusal.block}=${r.metrics.coverageRefusal.fraction} < ${r.metrics.coverageRefusal.threshold}\``);
  }
  if (r.findings?.length) lines.push("", "## Named findings", "", ...r.findings.map((x) => `- \`${x.code}\` — ${x.detail}`));
  lines.push("", `Sheets: before \`${f(r.sheets.before)}\`, after \`${f(r.sheets.after)}\`, gate \`${f(r.sheets.gate)}\``,
    "", `Milestone record: \`${r.chain.record}\`; shas \`${JSON.stringify(r.reproducible.milestoneSha256 ?? {})}\``, "");
  return lines.join("\n");
}

/** Self-grep: prove the runner has no subject keys (the registry is the only subject source). */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

function spawnMilestone(script, key, extra = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(HERE, script), "--subject", key, ...extra], { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("close", (code) => resolve(code));
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const key = argv[argv.indexOf("--subject") + 1];
  const def = SUBJECTS[key];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  const repro = argv.includes("--repro");
  // --distill-only: rebuild THIS record from the committed milestone/gate outputs without
  // re-running the chain or the judge (verdicts are judged ONCE — the no-re-roll rule). The
  // instrument diff is carried from the live-run record (it captured the real pre/post compare).
  const distillOnly = argv.includes("--distill-only");
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(join(OUT_DIR, key), { recursive: true });
  await mkdir(FRAMES_DIR, { recursive: true });
  const recPath = join(OUT_DIR, `${key}.json`);

  const styled = Boolean(def.kitRecord && has(def.kitRecord));
  const runner = styled ? "styled-milestone.mjs" : "challenge-milestone.mjs";
  const milestoneRecRel = styled ? `styled/${key}.json` : `challenge/${key}.json`;
  const milestonePrefix = styled ? `styled/${key}` : `challenge/${key}`;
  const gateRecRel = `multi-angle/${key}-${styled ? "styled" : "challenge"}.json`;
  const baselineRel = `reconstructed/${key}/e26-baseline.json`;

  if (offline) {
    if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run reconstructed:${key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const mile = has(milestoneRecRel) ? await readJson(milestoneRecRel) : null;
    // E-36 (T-153-01): the milestone-lineage sha ties this record to a chain DRAFT; drafts rewrite
    // freely, so a regenerated (improved) milestone is drift, not a failure. --offline gates the
    // MEASUREMENT (the frozen instrument verdict + the pinned baseline + sheets), not the lineage.
    const sameShas = mile && canon(mile.reproducible?.sha256) === canon(rec.reproducible?.milestoneSha256);
    const baselineOk = has(baselineRel) && sha256(await readFile(join(HERE, baselineRel), "utf8")) === rec.metrics?.census?.before?.baselineSha256;
    const sheetsOk = [rec.sheets?.before, rec.sheets?.after].every((p) => !p || existsSync(join(ROOT, p)));
    const ok = Boolean(baselineOk && sheetsOk && rec.instrument?.frozen !== false);
    console.error(`[offline] ${key}: milestone lineage ${sameShas == null ? "n/a" : sameShas ? "matches" : "DRIFTED"} (informational; drafts are free under E-36); baseline ${baselineOk ? "pinned" : "DIVERGED"}; sheets ${sheetsOk ? "present" : "MISSING"}; instrument ${rec.instrument?.frozen === false ? "DIFFS" : "frozen/untouched"}`);
    if (!ok) process.exitCode = 1;
    return;
  }

  // --- 1. pre-capture the frozen instrument -------------------------------------------------------
  const preGate = has(gateRecRel) ? await readJson(gateRecRel) : null;

  // --- 2. component layer (shared verification) ---------------------------------------------------
  const layer = await componentLayer(key, def);
  console.error(`[${key}] component layer: ` + ["component", "roof", "shaped"].map((n) => `${n} ${layer.pins[n] ? "pinned" : "ABSENT"}`).join(", "));

  // --- 3. the chain --------------------------------------------------------------------------------
  const prevRec = existsSync(recPath) ? JSON.parse(await readFile(recPath, "utf8")) : null;
  let code;
  if (distillOnly) {
    if (!prevRec) throw new Error(`--distill-only needs a committed record — run npm run reconstructed:${key} first`);
    code = prevRec.chain?.exitCode ?? 0;
    console.error(`[${key}] --distill-only: re-distilling committed outputs (chain + judge NOT re-run)`);
  } else {
    console.error(`[${key}] running ${runner}${repro ? " --repro (fresh-process re-proof; judge not re-run)" : " (full reconstructed chain)"}…`);
    code = await spawnMilestone(runner, key, [...(repro ? ["--repro"] : []), ...(ROTATE ? [ROTATE_FLAG] : [])]);
  }
  if (repro) {
    console.error(`[repro] ${key}: milestone re-proof exit ${code}`);
    process.exitCode = code;
    return;
  }
  if (!has(milestoneRecRel)) throw new Error(`${runner} produced no record at ${milestoneRecRel}`);
  const mile = await readJson(milestoneRecRel);
  const failed = mile.status === "pipeline-failed";

  // --- 4. instrument confirmation ------------------------------------------------------------------
  const freshGate = has(gateRecRel) ? await readJson(gateRecRel) : null;
  const gateIsFresh = freshGate && !failed; // a refused chain never reached the gate; an old record may linger
  const instrument = distillOnly && prevRec?.instrument
    ? { ...prevRec.instrument, note: "carried from the live-run record (--distill-only; the live run captured the real pre/post contract compare)" }
    : instrumentDiff(preGate, gateIsFresh ? freshGate : null);

  // --- 5. metrics ----------------------------------------------------------------------------------
  if (!has(baselineRel)) throw new Error(`${baselineRel} absent — the pinned E-26 baseline is a committed input (see structure.md step 3)`);
  const baselineRaw = await readFile(join(HERE, baselineRel), "utf8");
  const baseline = JSON.parse(baselineRaw);
  const afterRel = afterArtifact(mile, milestonePrefix);
  const afterArt = afterRel ? JSON.parse(await readFile(join(HERE, afterRel), "utf8")) : null;
  const roofRec = has(`roof/${key}.json`) ? await readJson(`roof/${key}.json`) : null;
  const regRec = has(`regularize/${key}.json`) ? await readJson(`regularize/${key}.json`) : null;
  const metrics = {
    census: {
      before: { ...census(baseline.artifact), source: `${baseline.sourcePath}@${String(baseline.sourceCommit).slice(0, 7)}`, baselineSha256: sha256(baselineRaw) },
      after: afterArt ? { ...census(afterArt), source: afterRel } : null,
    },
    roofFit: roofFitSummary(roofRec),
    cage: regRec ? {
      accepted: regRec.cage?.accepted ?? null, rejected: regRec.cage?.rejected ?? null,
      source: `regularize record${def.regularizedShell ? " (standalone — STALE for this subject; the chain re-cuts its shell, T-106 review #4)" : ""}`,
    } : null,
    coverageRefusal: failed ? coverageRefusal(mile.error) : null,
  };

  // --- 6. sheets ------------------------------------------------------------------------------------
  const subjDir = join(OUT_DIR, key);
  const beforeSheet = await renderSheet(baseline.artifact, "e26-before", subjDir);
  const afterSheet = afterArt ? await renderSheet(afterArt, "reconstructed-after", subjDir) : null;
  const frames = { before: `pr/assets/frames/reconstructed-${key}-before.png`, after: afterSheet ? `pr/assets/frames/reconstructed-${key}-after.png` : null };
  await copyFile(beforeSheet.sheetPath, join(ROOT, frames.before));
  if (afterSheet) await copyFile(afterSheet.sheetPath, join(ROOT, frames.after));

  // --- record ----------------------------------------------------------------------------------------
  const findings = [...layer.findings];
  if (failed) findings.push({ code: "chain-refused", detail: `${mile.stage}: ${String(mile.error).slice(0, 200)}` });
  if (!afterRel) findings.push({ code: "no-after-artifact", detail: "no chain artifact on disk — after-census and after-sheet omitted" });
  else if (failed) findings.push({ code: "after-is-last-completed-stage", detail: `after side measured on ${afterRel} (the chain refused downstream of it)` });
  const record = {
    schema: RECORD_SCHEMA,
    subject: key,
    chain: {
      runner, record: `benchmarks/sculpture/${milestoneRecRel}`, exitCode: code,
      status: mile.status, stage: failed ? mile.stage : null, error: failed ? mile.error : null,
      gate: mile.gate ?? null,
    },
    componentLayer: layer,
    instrument,
    verdicts: gateIsFresh ? {
      views: (freshGate.views ?? []).map((v) => ({ angle: v.angle, azimuthDeg: v.azimuthDeg, verdict: v.verdict?.verdict ?? null, gaps: v.verdict?.gaps ?? [], reason: v.reason ?? null })),
      aggregate: freshGate.aggregate ?? null,
      kitPresence: freshGate.kitPresence ?? null,
      overall: freshGate.overall ?? null,
      record: `benchmarks/sculpture/${gateRecRel}`,
    } : null,
    metrics,
    sheets: { before: frames.before, after: frames.after, gate: gateIsFresh ? freshGate.sheet ?? null : null },
    findings,
    generalization: await generalizationGrep(),
    reproducible: {
      milestoneSha256: mile.reproducible?.sha256 ?? null,
      determinism: "the milestone runner double-runs the deterministic chain and owns the byte-identity proof (--repro re-proves it fresh-process); this record distills committed outputs — same inputs, same record",
    },
  };

  await writeRec(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeRec(join(OUT_DIR, `${key}.md`), renderMd(record));
  console.error(`\n[${key}] reconstructed-milestone: chain ${record.chain.status}, gate ${record.chain.gate?.outcome ?? "—"}, instrument ${instrument.frozen === false ? "DIFFS" : "frozen/untouched"}`);
  console.error(`✓ wrote ${recPath.replace(ROOT, "")}`);
  process.exitCode = failed ? 1 : code;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.stack || String(e)); process.exit(1); });
}
