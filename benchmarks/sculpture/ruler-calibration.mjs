// RULER CALIBRATION RUNNER (T-140-01, story S-140, epic E-34) — the straight-ruler record. Three
// instrument fixes the E-33 milestone measured (T-138-02 review finding 4 + concerns 1/2/6), banked
// as ONE new committed record over COMMITTED inputs only (committed witness records + concept PNGs +
// sketches + packs). No model, no GL beyond the witness's own deterministic PNG decode, NO JUDGE.
//
//   lensDivergence       — every committed proportion-witness record's PROGRAM-lens target (sketch
//                          parameters) beside its OCCUPANCY-lens measured ratio, each NAMED; the
//                          plinth subject's ~3× gap reads as two instruments, not a contradiction.
//   toleranceCalibration — the cross-subject excess/verdict evidence (TOLERANCE_CALIBRATION) that
//                          0.15 SURVIVES (tightest value passing the post-loop ~0.03 and flagging
//                          the in-tolerance seed 0.164 the loop chased) — a frozen op parameter, never
//                          per-building.
//   pitchPrecedence      — for every (subject, pack) with a committed chain: the declared pitch
//                          target with its source cited (concept wins when segmentable; both E-33
//                          gabled concepts are NOT → sketch-fallback), and whether the T-134 steep
//                          door would now be demanded (the headline number for S-141/S-143).
//
// Records at a NEW path; committed witness/measured/milestone records stay byte-for-byte (pin
// policy — rotation belongs to T-142/T-143). Subjects/packs come from SUBJECTS + the committed
// record/chain files themselves (E-25 Rule 3: no subject keys in this source).
//
//   live      derive + write the record (pin-guarded, preflighted)
//   --repro   re-derive from the committed inputs and byte-compare; exit-coded
//
// Usage: node benchmarks/sculpture/ruler-calibration.mjs [--repro] [--rotate-pins] [--ticket <id>]

import { readFile, mkdir } from "node:fs/promises";
import { readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { guardedWriteRecord, preflightPins, loadTrackedSet, isTracked, ROTATE_FLAG } from "../../src/form/pin-guard.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { extractSilhouette, CONCEPT_BG } from "../../src/form/form-fidelity.mjs";
import {
  RATIO_NAMES, PROPORTION_LENS, tagLens, TOLERANCE_CALIBRATION, derivePitchTarget, maskCoverage,
} from "../../src/form/silhouette-proportion.mjs";
import { chainRels, packNs, DEFAULT_PACK_REL } from "../../src/workshop/seed.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

export const RULER_CALIBRATION_SCHEMA = "ruler-calibration/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const REL_DIR = "benchmarks/sculpture/proportion";
const SKETCH_REL = "benchmarks/sculpture/form-sketch";
const PACKS_DIR = "packs";
const OUT_REL = `${REL_DIR}/ruler-calibration.json`;
const MD_REL = "pr/assets/ruler-calibration.md";

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";
const readRel = (rel) => readFile(join(ROOT, rel), "utf8");
const readJson = async (rel) => JSON.parse(await readRel(rel));
const r4 = (x) => (x === null || x === undefined ? null : Math.round(x * 1e4) / 1e4);

/** E-25 Rule 3 self-grep: no subject keys in this runner's source. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

/** Registered subjects with a committed conditioned sketch (the witness predicate). */
const subjectDefs = () => Object.values(SUBJECTS).filter((d) => d.glb && d.generated?.scale);

/** Every committed proportion-witness record (filename → runKey), excluding this runner's output. */
function committedWitnessRecords() {
  return readdirSync(join(ROOT, REL_DIR))
    .filter((f) => f.endsWith(".json") && f !== "ruler-calibration.json")
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

/** Pack files available (rel paths), default first so its runKey carries no namespace suffix. */
function packRels() {
  const rels = readdirSync(join(ROOT, PACKS_DIR)).filter((f) => f.endsWith(".json")).map((f) => `${PACKS_DIR}/${f}`);
  return [DEFAULT_PACK_REL, ...rels.filter((r) => r !== DEFAULT_PACK_REL)];
}

// --- section 1: lens divergence ----------------------------------------------

/**
 * Each committed witness record's PROGRAM-lens target (its declared `targets`, sketch parameters
 * for the E-33 subjects) beside its OCCUPANCY-lens measured ratio (the final round's realized-voxel
 * read), every number NAMED. The per-ratio `factor` = occupancy / program — large only where the
 * realization diverges from its parameters (the realized plinth), ~1 otherwise (the skirt-free subject).
 */
async function lensDivergence() {
  const out = [];
  for (const runKey of committedWitnessRecords()) {
    const rec = await readJson(`${REL_DIR}/${runKey}.json`);
    if (rec.schema !== "proportion-witness/v1") continue;
    const program = tagLens({ ...rec.declarations.targets }, PROPORTION_LENS.PROGRAM);
    const finalRound = rec.rounds[rec.rounds.length - 1];
    const occupancy = tagLens({ ...finalRound.ratios }, PROPORTION_LENS.OCCUPANCY);
    const ratios = RATIO_NAMES.map((name) => {
      const p = program[name] ?? null;
      const o = occupancy[name] ?? null;
      return {
        ratio: name,
        program: p,
        programSource: rec.declarations.sources?.[name] ?? null,
        occupancy: o,
        factor: p && o ? r4(o / p) : null,
      };
    });
    const headline = ratios.reduce((a, b) => ((b.factor ?? 0) > (a.factor ?? 0) ? b : a), ratios[0]);
    out.push({
      runKey,
      lenses: { program: PROPORTION_LENS.PROGRAM, occupancy: PROPORTION_LENS.OCCUPANCY },
      programLens: program,
      occupancyLens: occupancy,
      ratios,
      maxDivergence: { ratio: headline.ratio, factor: headline.factor },
    });
  }
  return out;
}

// --- section 2: tolerance calibration ----------------------------------------

/**
 * The frozen 0.15 explained against the committed cross-subject excess/verdict evidence. Pulls each
 * witness record's whole-object rows (excess + withinTolerance) so the bimodal split
 * TOLERANCE_CALIBRATION rests on is reproduced from data, not asserted.
 */
async function toleranceCalibration() {
  const observed = [];
  for (const runKey of committedWitnessRecords()) {
    const rec = await readJson(`${REL_DIR}/${runKey}.json`);
    if (rec.schema !== "proportion-witness/v1") continue;
    const finalRound = rec.rounds[rec.rounds.length - 1];
    for (const row of finalRound.rows) {
      if (row.mass || !Number.isFinite(row.excess)) continue; // whole-object, comparable rows only
      observed.push({ runKey, ratio: row.ratio, excess: row.excess, basis: row.basis, within: row.withinTolerance });
    }
  }
  const inCluster = observed.filter((o) => o.within).map((o) => o.excess);
  const outCluster = observed.filter((o) => o.within === false).map((o) => o.excess);
  return {
    tolerance: TOLERANCE_CALIBRATION.value,
    derivedFrom: TOLERANCE_CALIBRATION.derivedFrom,
    priorEvidence: TOLERANCE_CALIBRATION.evidence,
    observedFinalRows: observed,
    split: {
      inClusterMax: inCluster.length ? Math.max(...inCluster) : null,
      outClusterMin: outCluster.length ? Math.min(...outCluster) : null,
      separates: inCluster.length && outCluster.length
        ? Math.max(...inCluster) <= TOLERANCE_CALIBRATION.value && Math.min(...outCluster) > TOLERANCE_CALIBRATION.value
        : null,
    },
    conclusion: TOLERANCE_CALIBRATION.conclusion,
  };
}

// --- section 3: pitch precedence ---------------------------------------------

/**
 * For every (subject, pack) with a committed chain: the declared pitch target with its source cited.
 * The concept wins when its silhouette is segmentable; both E-33 gabled concepts are full illustrated
 * scenes (coverage > the guard) so they fall back to the TRELLIS-flattened sketch — and `steepDoor`
 * records whether the snapped class would open the T-134 steep gable (the headline for S-141/S-143).
 */
async function pitchPrecedence() {
  const out = [];
  const packs = packRels();
  for (const def of subjectDefs()) {
    const conceptRel = `benchmarks/sculpture/${def.concept}`;
    const sketchRel = `${SKETCH_REL}/${def.key}.json`;
    if (!def.concept || !existsSync(join(ROOT, conceptRel)) || !existsSync(join(ROOT, sketchRel))) continue;
    const conceptBuf = await readFile(join(ROOT, conceptRel));
    const conceptMask = extractSilhouette(await decodeImage(join(ROOT, conceptRel)), CONCEPT_BG);
    const coverage = r4(maskCoverage(conceptMask));
    const sketch = await readJson(sketchRel);
    for (const packRel of packs) {
      if (!existsSync(join(ROOT, chainRels(def.key, packRel).ledger))) continue; // chain-backed pairs only
      const pack = await readJson(packRel);
      if (!pack.proportions?.pitchClasses) continue;
      const pitch = derivePitchTarget({ conceptMask, sketch, pack });
      out.push({
        runKey: `${def.key}${packNs(packRel)}`,
        pack: packRel,
        concept: { path: conceptRel, sha256: sha256(conceptBuf), coverage, segmentable: pitch.conceptSegmentable },
        pitchClasses: pack.proportions.pitchClasses,
        pitchTarget: pitch,
        steepDoorDemanded: pitch.steepDoor,
        why: pitch.conceptSegmentable
          ? "concept silhouette measurable — its pitch is the declared target"
          : pack.proportions.pitchClasses.some((c) => c > 1)
            ? "concept unsegmentable (full scene) → sketch-fallback; the pack OFFERS a steep class but the TRELLIS-flattened sketch never reaches it"
            : "concept unsegmentable (full scene) → sketch-fallback; the pack has NO steep class to demand",
      });
    }
  }
  return out;
}

// --- compose -----------------------------------------------------------------

async function compose() {
  const [lens, tolerance, pitch, generalization] = await Promise.all([
    lensDivergence(), toleranceCalibration(), pitchPrecedence(), generalizationGrep(),
  ]);
  return {
    schema: RULER_CALIBRATION_SCHEMA,
    ticket: ticketId,
    note: "the straight ruler (E-34/S-140): name the lens, calibrate the tolerance, give pitch its source. Workshop-side; the frozen judge is untouched.",
    lensDivergence: lens,
    toleranceCalibration: tolerance,
    pitchPrecedence: pitch,
    generalization,
    replay: {
      npmRun: "ruler:repro",
      asserts: "committed witness records + concept PNGs + sketches + packs → byte-identical record (no model, no GL beyond PNG decode, no judge)",
    },
  };
}

function recordMd(record) {
  const ld = record.lensDivergence.map((s) => {
    const h = s.maxDivergence;
    return `| ${s.runKey} | ${s.ratios.map((r) => `${r.ratio} ${r.program ?? "—"}→${r.occupancy ?? "—"} (${r.factor ?? "—"}×)`).join("<br>")} | ${h.factor ?? "—"}× on ${h.ratio} |`;
  });
  const pp = record.pitchPrecedence.map((p) =>
    `| ${p.runKey} | ${p.pitchTarget.source} | concept ${p.pitchTarget.conceptDeg ?? "—"}° / sketch ${p.pitchTarget.sketchDeg ?? "—"}° | class ${p.pitchTarget.snapped.pitchClass} of [${p.pitchClasses.join(", ")}] | ${p.steepDoorDemanded ? "**YES**" : "no"} |`);
  const tc = record.toleranceCalibration;
  return [
    `# Ruler calibration — ${RULER_CALIBRATION_SCHEMA} (${record.ticket})`,
    "",
    "The straight ruler (E-34/S-140): name the lens, calibrate the tolerance, give pitch its source.",
    "Deterministic over committed records — no model, no GL beyond PNG decode, no judge. Reproduce:",
    "`npm run ruler:repro`.",
    "",
    "## 1. The lens, named — program (parameters) vs occupancy (realized voxels)",
    "",
    "| subject | per-ratio program→occupancy (×) | max divergence |",
    "| --- | --- | --- |",
    ...ld,
    "",
    "Two instruments, not a contradiction: the gap is large only where the build diverges from its",
    "parameters (the realized plinth, T-139-01), ~1× otherwise.",
    "",
    `## 2. Tolerance ${tc.tolerance} — calibrated, survives`,
    "",
    `In-cluster max ${tc.split.inClusterMax} ≤ ${tc.tolerance} < out-cluster min ${tc.split.outClusterMin} ` +
    `(separates: ${tc.split.separates}). ${tc.conclusion}`,
    "",
    "## 3. Pitch precedence — concept wins when segmentable; the steep door",
    "",
    "| subject | source | concept° / sketch° | snapped pitch | steep door demanded? |",
    "| --- | --- | --- | --- | --- |",
    ...pp,
    "",
    "Both E-33 gabled concepts are full illustrated scenes (unsegmentable) → sketch-fallback; the",
    "TRELLIS-flattened sketch never reaches a steep class even where saltcrag offers one. The lever",
    "is concept segmentation + sketch flattening, not the pack vocabulary (S-141/S-143).",
    "",
  ].join("\n");
}

// --- modes -------------------------------------------------------------------

async function runLive({ rotate }) {
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [OUT_REL, MD_REL].map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate,
    intent: "ruler calibration (T-140-01)",
    domain: "workshop",
  });
  await mkdir(join(ROOT, REL_DIR), { recursive: true });
  await mkdir(join(ROOT, "pr/assets"), { recursive: true });
  const record = await compose();
  const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate, domain: "workshop" });
  await write(OUT_REL, jsonOf(record));
  await write(MD_REL, recordMd(record));
  const steep = record.pitchPrecedence.filter((p) => p.steepDoorDemanded).map((p) => p.runKey);
  console.error(`[ruler] ${record.lensDivergence.length} lens rows, ${record.pitchPrecedence.length} pitch rows; ` +
    `tolerance ${record.toleranceCalibration.tolerance} ${record.toleranceCalibration.split.separates ? "separates" : "does NOT separate"}; ` +
    `steep door demanded: ${steep.length ? steep.join(", ") : "none"}; ` +
    `grep ${record.generalization.clean ? "clean" : `HITS ${record.generalization.subjectKeysInRunner}`}`);
  return record.generalization.clean;
}

async function runRepro() {
  if (!existsSync(join(ROOT, OUT_REL))) {
    console.error("[ruler --repro] no committed ruler-calibration record — skipped");
    return null;
  }
  const problems = [];
  try {
    const record = await compose();
    if (sha256(jsonOf(record)) !== sha256(await readRel(OUT_REL))) problems.push("re-derived record DIVERGES from the committed one");
    if (existsSync(join(ROOT, MD_REL)) && recordMd(record) !== (await readRel(MD_REL))) problems.push("re-derived digest DIVERGES from the committed one");
  } catch (e) {
    problems.push(e.message);
  }
  for (const p of problems) console.error(`[ruler --repro] ${p}`);
  console.error(`[ruler --repro] ${problems.length === 0 ? "REPRODUCES byte-identically" : `${problems.length} problem(s)`}`);
  return problems.length === 0;
}

// --- CLI ---------------------------------------------------------------------

const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const repro = argv.includes("--repro") || argv.includes("--offline");
const rotate = argv.includes(ROTATE_FLAG);
const ticketId = argOf("--ticket") ?? "T-140-01";

if (repro) {
  const ok = await runRepro();
  if (ok === false) process.exit(1);
} else {
  const ok = await runLive({ rotate });
  if (!ok) process.exit(1);
}
