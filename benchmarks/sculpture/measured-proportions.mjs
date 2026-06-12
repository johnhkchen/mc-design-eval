// MEASURED-PROPORTIONS RUNNER (T-133-01, story S-133, epic E-33) — the named runs behind the
// measurement-to-program seam: committed conditioned sketch (T-123, the measurements) + committed
// recognized program (T-125, the naming — consumed, never re-sampled) → the measured program
// (src/recognition/measured-program.mjs: quantity from geometry, per-parameter sources, conflicts
// resolved sketch-wins) → seeded realization (the same seedWorkshopProgram the chain uses;
// conformance must PASS or the run refuses) → before/after/target silhouette ratios + renders.
//
// RECORDS AT NEW PATHS (benchmarks/sculpture/measured/<runKey>.*): the prior chain's pins
// (recognition/*.program.json byte-compares, workshop/<runKey>/program.json seed compares) stay
// untouched and valid — re-seeded programs are NEW records (AC 4). Chain adoption of measured
// programs is S-136/S-138's, under their own pins.
//
// MODEL-FREE END TO END: every input is a committed record; live mode's only non-determinism is
// GL, and renders are EVIDENCE, never gating (E-24/E-28 — render absence is recorded, not fatal).
// NO JUDGE RUNS (T-138-01 owns verdicts); no workshop spawn; no per-building constants.
//
//   live      derive + write records (pin-guarded, preflighted before any write)
//   --repro   re-derive measured program + artifact + ratios from the committed inputs and
//             byte-compare against the committed records; no GL, no writes, exit-coded
//   --offline alias of --repro (there is no model/ledger layer here — both flags per the AC)
//
// Usage: node benchmarks/sculpture/measured-proportions.mjs --subject <key> | --all
//        [--repro|--offline] [--pack packs/<style>.json] [--ticket <id>] [--rotate-pins]

import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { guardedWriteRecord, preflightPins, loadTrackedSet, isTracked, ROTATE_FLAG } from "../../src/form/pin-guard.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { parseProgramReply } from "../../src/recognition/prompt.mjs";
import {
  MEASURED_PROGRAM_SCHEMA, applyMeasuredProportions, silhouetteRatios, sketchTargetRatios,
} from "../../src/recognition/measured-program.mjs";
import { seedWorkshopProgram, recognitionRels, chainRels, packNs, DEFAULT_PACK_REL } from "../../src/workshop/seed.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

export const MEASURED_RECORD_SCHEMA = "measured-proportions/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const REL_DIR = "benchmarks/sculpture/measured";
const OUT_DIR = join(ROOT, REL_DIR);
const SKETCH_REL = "benchmarks/sculpture/form-sketch";

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";
const readRel = (rel) => readFile(join(ROOT, rel), "utf8");

/** The measured-record paths — packNs-namespaced beside recognitionRels/chainRels. */
export function measuredRels(key, packRel = DEFAULT_PACK_REL) {
  const runKey = `${key}${packNs(packRel)}`;
  const base = `${REL_DIR}/${runKey}`;
  return Object.freeze({
    runKey,
    program: `${base}.program.json`,
    artifact: `${base}.artifact.json`,
    record: `${base}.record.json`,
    md: `${base}.md`,
  });
}

/** Registered buildings with a committed conditioned sketch (the recognize.mjs predicate). */
const subjectDefs = () => Object.values(SUBJECTS).filter((d) => d.glb && d.generated?.scale);

/** E-25 Rule 3 self-grep: no subject keys in this runner's source. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

/**
 * The deterministic derivation both modes share: committed sketch + committed recognition
 * program (re-parsed through the live gates) → measured program record + seeded realization +
 * before/after/target ratios. Pure of GL and of writes.
 */
async function derive(key, pack) {
  const sketchRel = `${SKETCH_REL}/${key}.json`;
  const recogRel = recognitionRels(key, packRel).program;
  const sketchText = await readRel(sketchRel).catch(() => {
    throw new Error(`committed sketch absent: ${sketchRel} (run sketch:${key} under its own ticket)`);
  });
  const programText = await readRel(recogRel).catch(() => {
    throw new Error(`committed recognition program absent: ${recogRel} (T-125's record is this run's input)`);
  });
  const sketch = JSON.parse(sketchText);
  const recognized = parseProgramReply(programText, { pack }); // same gates as the live ask
  const measured = applyMeasuredProportions({ program: recognized, sketch, pack });
  const rels = measuredRels(key, packRel);
  const programRecord = {
    schema: MEASURED_PROGRAM_SCHEMA,
    ticket: ticketId,
    subject: key,
    runKey: rels.runKey,
    pack: pack.style,
    inputs: {
      recognitionProgram: { path: recogRel, sha256: sha256(programText) },
      sketch: { path: sketchRel, sha256: sha256(sketchText) },
    },
    attempt: measured.attempt,
    dimensions: measured.dimensions,
    conflicts: measured.conflicts,
    program: measured.program,
  };
  const seeded = seedWorkshopProgram({ program: measured.program, pack });
  if (!seeded.conformance.passed) {
    const bad = seeded.conformance.checks.filter((c) => !c.passed).map((c) => c.name).join(", ");
    throw new Error(`measured realization fails pack conformance (${bad}) — refusing to record it as a seed`);
  }
  // before = the committed chain seed (the squat baseline), absent for a chain-less subject
  const chainSeedRel = chainRels(key, packRel).seed;
  const before = existsSync(join(ROOT, chainSeedRel))
    ? silhouetteRatios(JSON.parse(await readRel(chainSeedRel)))
    : null;
  const ratios = {
    before,
    beforeSource: before ? chainSeedRel : null,
    after: silhouetteRatios(seeded.workshopProgram),
    target: sketchTargetRatios(sketch),
  };
  return { rels, programRecord, seeded, ratios };
}

async function renderEvidence(artifact, runKey) {
  const renders = [];
  let renderError = null;
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const views = await renderViews(artifact, [...MULTI_ANGLE_GATE.azimuths], {
      outDir: OUT_DIR, label: (a) => `${runKey}-${a}`, width: 1024, height: 1024,
    });
    for (const v of views) {
      const buf = await readFile(v.path);
      renders.push({ angle: v.angle, path: relative(ROOT, v.path), bytes: buf.length, sha256: sha256(buf) });
    }
  } catch (err) {
    renderError = err.message;
    console.error(`[measured] render: unavailable (${renderError})`);
  }
  return { renders, renderError };
}

const fmt = (x) => (x === null || x === undefined ? "—" : typeof x === "number" ? String(x) : `\`${x}\``);

function recordMd(rec, programRecord) {
  const ratioRow = (name, r) => `| ${name} | ${r ? `${r.ridgeToEave} | ${r.roofShare} | ${r.aspect}` : "— | — | —"} |`;
  const lines = [
    `# Measured proportions — ${rec.runKey} (${MEASURED_RECORD_SCHEMA}, ${rec.ticket})`,
    "",
    "Identity from language, quantity from geometry (E-33 Rule 1): the committed recognition",
    "program keeps the naming; every dimensional parameter below is sourced from the conditioned",
    "sketch's measurements or recorded as a fallback. Conflicts resolve sketch-wins. No judge",
    `runs (T-138-01 owns verdicts). Replay: \`npm run measured:repro\` byte-identically re-derives`,
    "program, artifact and ratios from the committed inputs (no model, no GL).",
    "",
    `| dimension (mass) | source | measured → used | residual | note |`,
    `| --- | --- | --- | --- | --- |`,
    ...programRecord.dimensions.map((d) =>
      `| ${d.parameter} (${d.mass}) | **${d.source}** | ${fmt(d.measured)} → ${fmt(d.used)} | ${fmt(d.residual)} | ${d.note} |`),
    "",
    "## Conflicts (recognition vs sketch — sketch wins for quantity)",
    "",
    ...(programRecord.conflicts.length
      ? programRecord.conflicts.map((c) =>
        `- \`${c.parameter}\` (${c.mass}): recognition ${JSON.stringify(c.recognition)} vs sketch ${JSON.stringify(c.sketch)} → **${c.resolved}**${c.note ? ` — ${c.note}` : ""}`)
      : ["- none — recognition's numbers already matched the measurements"]),
    "",
    "## Silhouette ratios (standalone diagnostic — S-135 owns the gate metric)",
    "",
    `| | ridge:eave | roof share | aspect |`,
    `| --- | --- | --- | --- |`,
    ratioRow(`before (${rec.ratios.beforeSource ?? "no committed chain seed"})`, rec.ratios.before),
    ratioRow("**after** (measured seed)", rec.ratios.after),
    ratioRow("target (sketch)", rec.ratios.target),
    "",
    rec.evidence.renders.length
      ? ["Renders (evidence, never gating):", ...rec.evidence.renders.map((r) => `- \`${r.path}\` (${r.angle}) sha256 ${r.sha256.slice(0, 16)}…`)].join("\n")
      : `Renders unavailable: ${rec.evidence.renderError}`,
    "",
  ];
  return lines.join("\n");
}

async function runLive(def, { rotate }) {
  const key = def.key;
  const rels = measuredRels(key, packRel);
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [rels.program, rels.artifact, rels.record, rels.md]
      .map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate,
    intent: `measured proportions (${rels.runKey})`,
  });
  const pack = loadStylePack(join(ROOT, packRel));
  await mkdir(OUT_DIR, { recursive: true });
  const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate });

  const track = { stage: "derive" };
  try {
    const { programRecord, seeded, ratios } = await derive(key, pack);
    track.stage = "render";
    const evidence = await renderEvidence(seeded.artifact, rels.runKey);
    track.stage = "record";
    const grep = await generalizationGrep();
    const record = {
      schema: MEASURED_RECORD_SCHEMA,
      ticket: ticketId,
      subject: key,
      runKey: rels.runKey,
      pack: pack.style,
      inputs: programRecord.inputs,
      program: { path: rels.program, attempt: programRecord.attempt,
                 sources: programRecord.dimensions.reduce((acc, d) => {
                   acc[d.source] = (acc[d.source] ?? 0) + 1; return acc;
                 }, {}) },
      seed: { sha256: sha256(seeded.serialized), cells: seeded.cells.length, conformance: { passed: true } },
      ratios,
      evidence,
      generalization: grep,
      replay: {
        npmRun: packRel === DEFAULT_PACK_REL ? "measured:repro / measured:offline" : `measured:repro (--pack ${packRel})`,
        asserts: "committed sketch + recognition program → byte-identical measured program, artifact, ratios",
      },
    };
    await write(rels.program, jsonOf(programRecord));
    await write(rels.artifact, jsonOf(seeded.artifact));
    await write(rels.record, jsonOf(record));
    await write(rels.md, recordMd(record, programRecord));
    console.error(`[measured] ${rels.runKey}: ${seeded.cells.length} cells; conformance PASS; ` +
      `ratios before ${JSON.stringify(ratios.before)} → after ${JSON.stringify(ratios.after)} ` +
      `(target ${JSON.stringify(ratios.target)}); grep ${grep.clean ? "clean" : `HITS ${grep.subjectKeysInRunner}`}`);
    return grep.clean;
  } catch (e) {
    const failed = {
      schema: MEASURED_RECORD_SCHEMA, ticket: ticketId, subject: key, runKey: rels.runKey,
      status: "pipeline-failed", stage: track.stage, error: e.message,
      generalization: await generalizationGrep(),
    };
    await write(rels.record, jsonOf(failed));
    console.error(`[measured] ${rels.runKey}: PIPELINE FAILED at stage "${track.stage}" — ${e.message}`);
    return false;
  }
}

async function runRepro(def) {
  const key = def.key;
  const rels = measuredRels(key, packRel);
  if (!existsSync(join(ROOT, rels.program))) {
    console.error(`[measured --repro] ${rels.runKey}: no committed measured records — skipped`);
    return null;
  }
  const pack = loadStylePack(join(ROOT, packRel));
  const problems = [];
  try {
    const { programRecord, seeded, ratios } = await derive(key, pack);
    if (sha256(jsonOf(programRecord)) !== sha256(await readRel(rels.program))) {
      problems.push("measured program DIVERGES from the committed record");
    }
    if (sha256(jsonOf(seeded.artifact)) !== sha256(await readRel(rels.artifact))) {
      problems.push("measured seed artifact DIVERGES from the committed one");
    }
    const committed = JSON.parse(await readRel(rels.record));
    if (committed.status === "pipeline-failed") {
      problems.push(`committed record is pipeline-failed at stage "${committed.stage}"`);
    } else if (JSON.stringify(ratios) !== JSON.stringify(committed.ratios)) {
      problems.push("re-derived silhouette ratios diverge from the committed record's");
    }
  } catch (e) {
    problems.push(e.message);
  }
  for (const p of problems) console.error(`[measured --repro] ${rels.runKey}: ${p}`);
  console.error(`[measured --repro] ${rels.runKey}: ${problems.length === 0
    ? "REPRODUCES byte-identically (sketch + program → measured program → seed → ratios)"
    : `${problems.length} problem(s)`}`);
  return problems.length === 0;
}

// --- CLI ------------------------------------------------------------------------------------------

const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const onlySubject = argOf("--subject");
const all = argv.includes("--all");
const repro = argv.includes("--repro") || argv.includes("--offline");
const rotate = argv.includes(ROTATE_FLAG);
const packRel = argOf("--pack") ?? DEFAULT_PACK_REL;
const ticketId = argOf("--ticket") ?? "T-133-01"; // the run's authority, named in the records

const defs = subjectDefs();
if (!all && !onlySubject) throw new Error(`pass --subject <${defs.map((d) => d.key).join("|")}> or --all`);
if (onlySubject && !defs.some((d) => d.key === onlySubject)) {
  throw new Error(`--subject must be one of: ${defs.map((d) => d.key).join(", ")}`);
}
const selected = defs.filter((d) => !onlySubject || d.key === onlySubject);

if (repro) {
  const results = [];
  for (const def of selected) results.push(await runRepro(def));
  const ran = results.filter((r) => r !== null);
  if (ran.length === 0) throw new Error("--repro: no committed measured records found for the selection");
  if (ran.some((ok) => !ok)) process.exit(1);
} else {
  for (const def of selected) {
    const ok = await runLive(def, { rotate });
    if (!ok) process.exit(1);
  }
}
