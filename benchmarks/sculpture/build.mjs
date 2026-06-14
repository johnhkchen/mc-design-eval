// THE UNIFIED BUILD CHAIN (T-154-01, story S-154, epic E-37) — the ONE entry point. Per subject,
// recognize (Stage 3, committed input) → generate-seed (Stage 4: generate-first's parametric realizer
// — GLB-fit + kit, gable-as-wall, overhang, articulation) → workshop (Stage 5: the model critiques
// renders and revises SURFACE, ledgered, judge-free render every round per E-36) → final beside concept.
//
// ONE REALIZER FEEDS THE ONE LOOP. The pattern-book seed-brush stage is retired from this live path: a
// construction fix now lands in the chain that gets measured (T-150-01's cost, paid off). The seed is
// generate-first's frozen build; the workshop iterates it through `--seed-artifact` (artifact-base mode).
//
// THE GATE IS A SEPARATE EXPLICIT STEP. `build` NEVER spawns the frozen judge — the gate stays billed
// and owned (gate:patternbook:* / the `generated`-label gate). This runner imports no gate seam.
//
// MODES
//   live (default)  verify recognition → spawn generate-seed (generated --skip-gate) → seed the
//                   workshop (artifact-base) → spawn the workshop live loop → render the final beside
//                   the concept → chain receipt. Honest failure (E-25 Rule 6): a non-zero spawn or a
//                   missing input writes {status:"pipeline-failed", stage, error} and exits 1.
//   --repro         no model: prove the deterministic stages — generate-seed determinism (generated
//                   --repro: two fresh runs byte-identical) + workshop loop replay (--replay,
//                   artifact-anchored). Exit-coded.
//
// Usage: node benchmarks/sculpture/build.mjs --subject <key> [--pack packs/<style>.json] [--repro]
//        [--rotate-pins]

import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import {
  buildRels, recognitionRels, DEFAULT_PACK_REL,
} from "../../src/workshop/seed.mjs";
import { serializeArtifact } from "../../src/workshop/replay.mjs";
import { assertGlAvailable, renderBesideConcept } from "../../src/view/render-beside.mjs";
import {
  ROTATE_FLAG, preflightPins, guardedWriteRecord, loadTrackedSet, isTracked,
} from "../../src/form/pin-guard.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

export const BUILD_CHAIN_SCHEMA = "build-chain/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";
const readRel = (rel) => readFile(join(ROOT, rel), "utf8");

// the generate-first chain's committed final lives here (its --skip-gate path refreshes it)
const generatedFinalRel = (key) => `benchmarks/sculpture/generated/${key}/artifact.json`;

/** E-25 Rule 3 self-grep: no subject keys in this runner's source. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

function spawnStage(args, label) {
  const r = spawnSync(process.execPath, args, { stdio: "inherit", cwd: ROOT });
  if (r.status !== 0) throw new Error(`${label} exited ${r.status}`);
}

// ---------------------------------------------------------------- modes

async function runLive(def, { packRel, rotate }) {
  const key = def.key;
  const pack = loadStylePack(join(ROOT, packRel));
  const rels = buildRels(key, packRel);
  const recogRel = recognitionRels(key, packRel).program;
  const conceptRel = `benchmarks/sculpture/${def.concept}`;
  const recordRel = rels.record;

  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [rels.seedArtifact, rels.record, rels.recordMd].map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate, intent: `build chain live (${key})`, domain: "build",
  });
  const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate, domain: "build", trackedSet });
  await mkdir(join(ROOT, rels.dir), { recursive: true });
  await mkdir(join(HERE, "build"), { recursive: true });

  const track = { stage: "recognize" };
  try {
    // Stage 3 — recognition is a committed input (no spend here)
    if (!existsSync(join(ROOT, recogRel))) {
      throw new Error(`committed recognition program absent: ${recogRel} (run recognize:${key} under its own ticket first)`);
    }
    const recogText = await readRel(recogRel);

    // Stage 4 — generate-seed via generate-first's realizer (spawned; --skip-gate = no judge)
    track.stage = "generate-seed";
    spawnStage([join(HERE, "generated-milestone.mjs"), "--subject", key, "--skip-gate", ...(rotate ? [ROTATE_FLAG] : [])], "generate-seed");
    const genFinalRel = generatedFinalRel(key);
    if (!existsSync(join(ROOT, genFinalRel))) throw new Error(`generate-seed produced no artifact (${genFinalRel})`);
    const seedText = await readRel(genFinalRel);
    const seedArtifact = assertArtifact(JSON.parse(seedText));
    await write(rels.seedArtifact, serializeArtifact(seedArtifact)); // the seed the workshop iterates

    // Stage 5 — the workshop loop, seeded from the artifact base
    track.stage = "workshop";
    spawnStage([join(HERE, "workshop.mjs"), "--subject", key, "--pack", packRel,
      "--seed-artifact", rels.seedArtifact, ...(rotate ? [ROTATE_FLAG] : [])], "workshop");

    // read back the workshop record + render the final beside the concept (judge-free, E-36)
    track.stage = "record";
    const ledgerText = await readRel(rels.ledger);
    const finalText = await readRel(rels.final);
    const ledger = JSON.parse(ledgerText);
    const finalArtifact = assertArtifact(JSON.parse(finalText));

    assertGlAvailable();
    const besideOut = join(FRAMES_DIR, `beside-concept-${key}-build.png`);
    await mkdir(FRAMES_DIR, { recursive: true });
    const beside = await renderBesideConcept(finalArtifact, join(ROOT, conceptRel), besideOut, { label: `${key} (build)` });

    const record = {
      schema: BUILD_CHAIN_SCHEMA,
      ticket: "T-154-01",
      subject: key,
      runKey: rels.runKey,
      pack: pack.style,
      pipelineOrder: "recognize (committed) → generate-seed (generate-first realizer, --skip-gate) → " +
        "seed-artifact → workshop (artifact-base, paint+relief) → final beside concept; gate is separate",
      stages: {
        recognition: { path: recogRel, sha256: sha256(recogText) },
        generateSeed: {
          generatedFinal: { path: genFinalRel, sha256: sha256(seedText) },
          seedArtifact: { path: rels.seedArtifact, sha256: sha256(serializeArtifact(seedArtifact)) },
        },
        workshop: {
          ledger: { path: rels.ledger, sha256: sha256(ledgerText) },
          final: { path: rels.final, sha256: sha256(finalText) },
          outcome: ledger.final?.outcome ?? null,
          rounds: { used: ledger.final?.rounds ?? null, budget: ledger.budget?.rounds ?? null },
        },
      },
      beside: beside.outPath.replace(ROOT, ""),
      generalization: await generalizationGrep(),
      replay: { npmRun: `build:${key}:repro`, asserts: "generate-seed determinism + workshop loop replay (artifact-anchored)" },
      note: "the gate is a SEPARATE billed step — this chain never spawns the frozen judge (E-37)",
    };
    await write(recordRel, jsonOf(record));
    await write(rels.recordMd, buildMd(record));
    console.error(`\n✓ build ${key}: workshop ${record.stages.workshop.outcome} ` +
      `(${record.stages.workshop.rounds.used}/${record.stages.workshop.rounds.budget} rounds); ` +
      `final beside concept → ${record.beside}; grep ${record.generalization.clean ? "clean" : "HITS"}`);
    return record.generalization.clean;
  } catch (e) {
    // AC: surface the REAL cause first; the failure-record write is a secondary note (T-151-01 precedent)
    console.error(`[build ${key}] PIPELINE FAILED at "${track.stage}": ${e.message}`);
    const failed = {
      schema: BUILD_CHAIN_SCHEMA, ticket: "T-154-01", subject: key, runKey: rels.runKey, pack: pack.style,
      status: "pipeline-failed", stage: track.stage, error: e.message,
      generalization: await generalizationGrep(),
    };
    try { await write(recordRel, jsonOf(failed)); } catch (writeErr) {
      console.error(`[build ${key}] (failure record not persisted: ${writeErr.message})`);
    }
    return false;
  }
}

function buildMd(rec) {
  if (rec.status === "pipeline-failed") {
    return `# build chain — ${rec.subject} (${rec.ticket}, E-37)\n\n**PIPELINE FAILED** at stage ` +
      `\`${rec.stage}\`:\n\n> ${rec.error}\n\nRecorded honestly (E-25 Rule 6).\n`;
  }
  const w = rec.stages.workshop;
  return [
    `# build chain — ${rec.runKey} (${BUILD_CHAIN_SCHEMA}, ${rec.ticket})`,
    "",
    `The ONE entry point (E-37): recognize → **generate-first seed** → workshop → final. The gate is a`,
    `separate billed step; this chain never spawns the judge. Replay: \`npm run build:${rec.subject}:repro\`.`,
    "",
    `| stage | receipt |`,
    `| --- | --- |`,
    `| recognition | \`${rec.stages.recognition.sha256.slice(0, 16)}…\` (committed input) |`,
    `| generate-seed | generated final \`${rec.stages.generateSeed.generatedFinal.sha256.slice(0, 16)}…\` → seed \`${rec.stages.generateSeed.seedArtifact.path}\` |`,
    `| workshop | **${w.outcome}** after ${w.rounds.used}/${w.rounds.budget} rounds — final \`${w.final.sha256.slice(0, 16)}…\` |`,
    "",
    `Final beside concept (judge-free glance, E-36): \`${rec.beside}\`.`,
    "",
  ].join("\n");
}

async function runRepro(def, { packRel }) {
  const key = def.key;
  const rels = buildRels(key, packRel);
  if (!existsSync(join(ROOT, rels.ledger)) || !existsSync(join(ROOT, rels.seedArtifact))) {
    console.error(`[build --repro] ${rels.runKey}: no committed build chain — skipped`);
    return null;
  }
  // generate-seed determinism (two fresh runs byte-identical — E-36/T-153-01)
  spawnStage([join(HERE, "generated-milestone.mjs"), "--subject", key, "--repro"], "generate-seed --repro");
  // workshop loop replay (artifact-anchored, byte-identical)
  spawnStage([join(HERE, "workshop.mjs"), "--subject", key, "--pack", packRel, "--seed-artifact", rels.seedArtifact, "--replay"], "workshop --replay");
  console.error(`[build --repro] ${rels.runKey}: deterministic stages REPRODUCE (generate-seed + workshop replay)`);
  return true;
}

// ---------------------------------------------------------------- CLI

const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const onlySubject = argOf("--subject");
const packRel = argOf("--pack") ?? DEFAULT_PACK_REL;
const repro = argv.includes("--repro");
const rotate = argv.includes(ROTATE_FLAG);

const defs = Object.values(SUBJECTS).filter((d) => d.glb && d.generated?.scale);
if (!onlySubject) {
  console.error(`build: pass --subject <${defs.map((d) => d.key).join("|")}> [--pack …] [--repro] [--rotate-pins]`);
  process.exit(2);
}
const def = defs.find((d) => d.key === onlySubject);
if (!def) {
  console.error(`build: --subject must be one of: ${defs.map((d) => d.key).join(", ")}`);
  process.exit(2);
}

if (repro) {
  const ok = await runRepro(def, { packRel });
  if (ok === false) process.exit(1);
} else {
  const ok = await runLive(def, { packRel, rotate });
  if (!ok) process.exit(1);
}
