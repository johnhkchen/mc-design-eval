// STEEP-PITCH RUNNER (T-134-01, story S-134, epic E-33) — the named realization behind the
// roof.gable.steep brush: committed recognized program (T-125, naming consumed, never re-sampled)
// → BEFORE = the unchanged seed (the squat baseline) and AFTER = the same program with every
// gable roof re-aimed at the style's steepest declared class through roof.gable.steep — both
// through the SAME seedWorkshopProgram seam, so compile recomputes ridge, gable infill,
// declarations and the conformance verdict consistently. Before/after renders at the gate
// azimuths are the AC's evidence: the silhouette visibly steepens.
//
// THE DEMAND IS RECORDED HONESTLY (E-33 "Honesty"): the mesh-derived sketch flattens pitched
// roofs (TRELLIS profile drift, T-123) and may read 45° where the concept depicts ~2:1 — the
// concept is the contract, the sketch the fallback; the record carries the sketch's tilt, the
// pack's declared classes, and the class realized, side by side. A style that declares no steep
// class, or a roof family without stairs, is a NAMED REFUSAL (status "refused", exit 0 — the
// honest-fallback convention), never an approximation.
//
// RECORDS AT NEW PATHS (benchmarks/sculpture/steep-pitch/<runKey>.*): the chain's pins stay
// untouched and valid — chain adoption of steep programs is S-136/S-138's. MODEL-FREE: every
// input is a committed record; NO JUDGE RUNS (T-138-01 owns verdicts). DETERMINISM: the pure
// derivation runs twice and must byte-match before anything is written. Renders are required
// evidence here (the AC commits them): a GL failure is a loud pipeline failure, not a skip.
//
//   live      derive twice + write records + render before/after at the gate azimuths
//   --repro   re-derive from the committed inputs, byte-compare records; no GL, no writes
//   --offline alias of --repro
//
// Usage: node benchmarks/sculpture/steep-pitch.mjs --subject <key> | --all
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
import { silhouetteRatios, sketchTargetRatios } from "../../src/recognition/measured-program.mjs";
import { getBrush } from "../../src/pack/idiom-registry.mjs";
import { seedWorkshopProgram, recognitionRels, packNs, DEFAULT_PACK_REL } from "../../src/workshop/seed.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

export const STEEP_RECORD_SCHEMA = "steep-pitch/v1";
const STEEP_IDIOM = "roof.gable.steep";
// the realizable classes, read THROUGH THE DOOR (the registry entry's declared params)
const STEEP_CLASSES = getBrush(STEEP_IDIOM).paramsSchema.properties.pitch.enum;

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const REL_DIR = "benchmarks/sculpture/steep-pitch";
const OUT_DIR = join(ROOT, REL_DIR);
const SKETCH_REL = "benchmarks/sculpture/form-sketch";

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";
const readRel = (rel) => readFile(join(ROOT, rel), "utf8");

/** The steep-pitch record paths — packNs-namespaced (the measured-proportions convention). */
export function steepRels(key, packRel = DEFAULT_PACK_REL) {
  const runKey = `${key}${packNs(packRel)}`;
  const base = `${REL_DIR}/${runKey}`;
  return Object.freeze({
    runKey,
    record: `${base}.record.json`,
    after: `${base}.after-artifact.json`,
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

/** A named refusal — recorded honestly, never approximated around. */
class SteepRefusal extends Error {}

/**
 * The deterministic derivation both modes share: committed recognized program → before seed +
 * steep-patched after seed + ratios + demand evidence. Pure of GL and of writes; throws
 * SteepRefusal where the style or family cannot take the class (a correct outcome).
 */
async function derive(key, pack) {
  const sketchRel = `${SKETCH_REL}/${key}.json`;
  const recogRel = recognitionRels(key, packRel).program;
  const programText = await readRel(recogRel).catch(() => {
    throw new Error(`committed recognition program absent: ${recogRel} (T-125's record is this run's input)`);
  });
  const sketchText = await readRel(sketchRel).catch(() => {
    throw new Error(`committed sketch absent: ${sketchRel}`);
  });
  const sketch = JSON.parse(sketchText);
  const recognized = parseProgramReply(programText, { pack }); // same gates as the live ask

  // the demand class is the STYLE's steepest declared class above 45° (per-style, never
  // per-building); a style without one refuses by name — widening is a pack decision
  const declaredSteep = pack.proportions.pitchClasses.filter((c) => STEEP_CLASSES.includes(c));
  if (declaredSteep.length === 0) {
    throw new SteepRefusal(`the style declares no steep pitch class (pack vocabulary [${pack.proportions.pitchClasses.join(", ")}]) — ` +
      `widening it is a pack decision, not this runner's`);
  }
  const steepClass = Math.max(...declaredSteep);

  const before = seedWorkshopProgram({ program: recognized, pack });

  const patched = structuredClone(recognized);
  const steepened = [];
  for (const m of patched.masses) {
    if (m.roof?.idiom === "roof.gable") {
      m.roof.idiom = STEEP_IDIOM;
      m.roof.pitchClass = steepClass;
      steepened.push(m.id);
    }
  }
  if (steepened.length === 0) throw new SteepRefusal("the program names no gable roof to steepen");
  let after;
  try {
    after = seedWorkshopProgram({ program: patched, pack });
  } catch (e) {
    // the construct's named refusals (missing stair family, …) surface here — honest outcomes
    throw new SteepRefusal(e.message);
  }
  if (!after.conformance.passed) {
    const bad = after.conformance.checks.filter((c) => !c.passed).map((c) => c.name).join(", ");
    throw new Error(`steepened realization fails pack conformance (${bad})`);
  }

  const roofSpecOf = (seeded, idiom) => seeded.workshopProgram.elements
    .filter((e) => e.idiom === idiom).map((e) => ({ id: e.id, eaveY: e.spec.eaveY, ridgeY: e.spec.ridgeY, pitch: e.spec.pitch }));
  return {
    rels: steepRels(key, packRel),
    inputs: {
      recognitionProgram: { path: recogRel, sha256: sha256(programText) },
      sketch: { path: sketchRel, sha256: sha256(sketchText) },
    },
    demand: {
      conceptPath: `benchmarks/sculpture/${SUBJECTS[key].concept}`,
      sketchPitch: sketch.pitch ? { class: sketch.pitch.class, dominantTiltDeg: sketch.pitch.dominantTiltDeg } : null,
      packPitchClasses: [...pack.proportions.pitchClasses],
      steepClass,
      note: "the mesh-derived sketch flattens pitched roofs (TRELLIS profile drift, T-123); the concept is the contract (E-33 Honesty) — the realized class is the style's steepest declared, the sketch's tilt recorded beside it",
    },
    steepened,
    before: { seedSha256: sha256(before.serialized), cells: before.cells.length,
              roofs: roofSpecOf(before, "roof.gable"), ratios: silhouetteRatios(before.workshopProgram) },
    after: { seedSha256: sha256(after.serialized), cells: after.cells.length,
             roofs: roofSpecOf(after, STEEP_IDIOM), ratios: silhouetteRatios(after.workshopProgram),
             conformance: { passed: true } },
    target: sketchTargetRatios(sketch),
    artifacts: { before: before.artifact, after: after.artifact },
  };
}

async function renderEvidence(artifacts, runKey) {
  const { renderViews } = await import("../../src/view/multi-angle.mjs");
  const out = {};
  for (const side of ["before", "after"]) {
    out[side] = [];
    const views = await renderViews(artifacts[side], [...MULTI_ANGLE_GATE.azimuths], {
      outDir: OUT_DIR, label: (a) => `${runKey}-${side}-${a}`, width: 1024, height: 1024,
    });
    for (const v of views) {
      const buf = await readFile(v.path);
      out[side].push({ angle: v.angle, path: relative(ROOT, v.path), bytes: buf.length, sha256: sha256(buf) });
    }
  }
  return out;
}

function recordMd(rec) {
  const r = (name, x) => `| ${name} | ${x ? `${x.ridgeToEave} | ${x.roofShare} | ${x.aspect}` : "— | — | —"} |`;
  const roofLine = (side) => rec[side].roofs.map((x) => `${x.id}: eave ${x.eaveY}, ridge ${x.ridgeY}, pitch ${x.pitch}`).join("; ");
  return [
    `# Steep pitch — ${rec.runKey} (${STEEP_RECORD_SCHEMA}, ${rec.ticket})`,
    "",
    "One parameter moved through one seam: every gable roof re-aimed at the style's steepest",
    `declared class via \`${STEEP_IDIOM}\` (mixed full-block/stair courses), before/after seeded by`,
    "the same compile. No judge runs (T-138-01 owns verdicts); renders are evidence, never gating.",
    "",
    "## Demand (recorded honestly — E-33)",
    "",
    `- concept (the contract): \`${rec.demand.conceptPath}\``,
    `- sketch (mesh-derived, TRELLIS-flattened): class \`${rec.demand.sketchPitch?.class}\`, tilt ${rec.demand.sketchPitch?.dominantTiltDeg}°`,
    `- pack classes [${rec.demand.packPitchClasses.join(", ")}] → realized class **${rec.demand.steepClass}** on: ${rec.steepened.join(", ")}`,
    "",
    "## Before → after",
    "",
    `- roofs before: ${roofLine("before")}`,
    `- roofs after: ${roofLine("after")}`,
    `- cells ${rec.before.cells} → ${rec.after.cells}; after conformance PASS (courses-even included)`,
    `- determinism: derivation ran twice, byte-identical (seed shas recorded)`,
    "",
    "| | ridge:eave | roof share | aspect |",
    "| --- | --- | --- | --- |",
    r("before (committed program seed)", rec.before.ratios),
    r("**after** (steepened seed)", rec.after.ratios),
    r("target (sketch — see demand note)", rec.target),
    "",
    "Renders (the gate azimuths, evidence):",
    ...["before", "after"].flatMap((side) => rec.evidence[side].map((v) => `- \`${v.path}\` (${side} ${v.angle}) sha256 ${v.sha256.slice(0, 16)}…`)),
    "",
  ].join("\n");
}

async function runLive(def, { rotate }) {
  const key = def.key;
  const rels = steepRels(key, packRel);
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [rels.record, rels.after, rels.md].map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate,
    intent: `steep pitch (${rels.runKey})`,
  });
  const pack = loadStylePack(join(ROOT, packRel));
  await mkdir(OUT_DIR, { recursive: true });
  const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate });

  const track = { stage: "derive" };
  try {
    const first = await derive(key, pack);
    const second = await derive(key, pack); // the pure core runs twice (E-24 Rule 2)
    if (sha256(jsonOf(first.artifacts.after)) !== sha256(jsonOf(second.artifacts.after)) ||
        first.before.seedSha256 !== second.before.seedSha256) {
      throw new Error("derivation is not deterministic across two runs — refusing to record");
    }
    track.stage = "render";
    const evidence = await renderEvidence(first.artifacts, rels.runKey); // REQUIRED evidence: throws loudly
    track.stage = "record";
    const grep = await generalizationGrep();
    const { artifacts, rels: _r, ...recBody } = first;
    const record = {
      schema: STEEP_RECORD_SCHEMA, ticket: ticketId, subject: key, runKey: rels.runKey,
      pack: pack.style, ...recBody, evidence, generalization: grep,
      replay: { npmRun: `steep:repro${packRel === DEFAULT_PACK_REL ? "" : ` (--pack ${packRel})`}`,
                asserts: "committed program + pack → byte-identical before/after seeds, ratios, after-artifact" },
    };
    await write(rels.after, jsonOf(first.artifacts.after));
    await write(rels.record, jsonOf(record));
    await write(rels.md, recordMd(record));
    console.error(`[steep] ${rels.runKey}: class ${first.demand.steepClass} on ${first.steepened.join(",")}; ` +
      `ridge ${first.before.roofs[0]?.ridgeY} → ${first.after.roofs[0]?.ridgeY}; conformance PASS; ` +
      `ratios ${JSON.stringify(first.before.ratios)} → ${JSON.stringify(first.after.ratios)}; ` +
      `grep ${grep.clean ? "clean" : `HITS ${grep.subjectKeysInRunner}`}`);
    return grep.clean;
  } catch (e) {
    const refused = e instanceof SteepRefusal;
    const record = {
      schema: STEEP_RECORD_SCHEMA, ticket: ticketId, subject: key, runKey: rels.runKey,
      pack: pack.style,
      ...(refused ? { status: "refused", finding: e.message } :
                    { status: "pipeline-failed", stage: track.stage, error: e.message }),
      generalization: await generalizationGrep(),
    };
    await write(rels.record, jsonOf(record));
    console.error(`[steep] ${rels.runKey}: ${refused ? `REFUSED (named) — ${e.message}` :
      `PIPELINE FAILED at stage "${track.stage}" — ${e.message}`}`);
    return refused; // a named refusal is a correct outcome (exit 0); a pipeline failure is not
  }
}

async function runRepro(def) {
  const key = def.key;
  const rels = steepRels(key, packRel);
  if (!existsSync(join(ROOT, rels.record))) {
    console.error(`[steep --repro] ${rels.runKey}: no committed steep records — skipped`);
    return null;
  }
  const pack = loadStylePack(join(ROOT, packRel));
  const problems = [];
  try {
    const committed = JSON.parse(await readRel(rels.record));
    if (committed.status === "refused") {
      try {
        await derive(key, pack);
        problems.push("committed record is a refusal but the derivation now succeeds — rotate under a ticket");
      } catch (e) {
        if (!(e instanceof SteepRefusal) || e.message !== committed.finding) {
          problems.push(`refusal DIVERGES: committed "${committed.finding}" vs derived "${e.message}"`);
        }
      }
    } else if (committed.status === "pipeline-failed") {
      problems.push(`committed record is pipeline-failed at stage "${committed.stage}"`);
    } else {
      const d = await derive(key, pack);
      if (d.before.seedSha256 !== committed.before.seedSha256) problems.push("before seed DIVERGES");
      if (d.after.seedSha256 !== committed.after.seedSha256) problems.push("after seed DIVERGES");
      if (sha256(jsonOf(d.artifacts.after)) !== sha256(await readRel(rels.after))) {
        problems.push("after-artifact DIVERGES from the committed one");
      }
      const ratios = { before: d.before.ratios, after: d.after.ratios, target: d.target };
      const committedRatios = { before: committed.before.ratios, after: committed.after.ratios, target: committed.target };
      if (JSON.stringify(ratios) !== JSON.stringify(committedRatios)) problems.push("ratios DIVERGE");
    }
  } catch (e) {
    problems.push(e.message);
  }
  for (const p of problems) console.error(`[steep --repro] ${rels.runKey}: ${p}`);
  console.error(`[steep --repro] ${rels.runKey}: ${problems.length === 0
    ? "REPRODUCES byte-identically (program + pack → before/after seeds → ratios)"
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
const ticketId = argOf("--ticket") ?? "T-134-01"; // the run's authority, named in the records

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
  if (ran.length === 0) throw new Error("--repro: no committed steep records found for the selection");
  if (ran.some((ok) => !ok)) process.exit(1);
} else {
  for (const def of selected) {
    const ok = await runLive(def, { rotate });
    if (!ok) process.exit(1);
  }
}
