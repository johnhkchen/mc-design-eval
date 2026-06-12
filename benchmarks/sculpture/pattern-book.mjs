// THE PATTERN-BOOK CHAIN (T-127-01, story S-127, epic E-31) — the milestone end-to-end, one
// command per subject: committed conditioned sketch (T-123) → committed model-recognized program
// (T-125, re-asserted byte-identically — consumed, never re-sampled) → canonical realization
// seeded under the DECLARED revision budget (src/workshop/seed.mjs) → the workshop loop (T-126,
// spawned through its own CLI; ledgered, conformance-caged) → the final build + the chain record.
//
// THE FROZEN JUDGE IS NOT HERE — this file is scanned by src/workshop/isolation.test.mjs (the
// T-126 receipt). S-127 convenes the judge once per subject FROM OUTSIDE this chain, via the
// gate:patternbook:* scripts; this runner neither spawns it, parses it, nor writes any verdict
// record. Reading/aggregating verdicts is pattern-book-compare.mjs (deliberately outside the
// isolation scan — it must name the verdict-record paths this file is forbidden to mention).
//
// MODES
//   live (default)  verify seams → seed (program committed) → spawn the workshop live loop →
//                   chain record. Pins preflighted BEFORE any spend (T-119; the workshop spawn
//                   preflights its own ledger/final pins before ITS spend). A deterministic-
//                   stage throw writes {status:"pipeline-failed", stage, error} and exits 1
//                   (E-25 Rule 6 — the record names the gap, nothing is weakened).
//   --repro         no model, no GL, no spawn, no writes: re-derive sketch/recognition shas,
//                   seed byte-compared to the committed program, replay the committed ledger to
//                   the committed final artifact byte-identically, re-derive final conformance.
//   --offline       --repro plus the T-126 offlineAssert on the committed ledger (reply-policy
//                   bounds, cage arithmetic). Both exit-coded (E-31 Rule 5).
//
// GENERALIZATION (E-25 Rule 3 / E-31 Rule 2): subjects come from the durable-skin registry; the
// self-grep pins that no subject key appears in this source, embedded in every record.
//
// Usage: node benchmarks/sculpture/pattern-book.mjs --subject <key> | --all [--repro|--offline]
//        [--pack packs/<style>.json] [--ticket <id>] [--rotate-pins]
// The pack is invocation data (T-132-01): records namespace per pack (chainRels), the default
// pack keeps T-127's committed paths, and the sketch/recognition seam is always verified under
// the seam's own pack of record.

import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runConformance } from "../../src/pack/conformance.mjs";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { parseProgramReply } from "../../src/recognition/prompt.mjs";
import { compileProgram } from "../../src/recognition/compile.mjs";
import { assertWorkshopProgram, realizeProgram } from "../../src/workshop/program.mjs";
import { PATTERN_BOOK_BUDGET, seedWorkshopProgram, componentPlanFrom, chainRels, DEFAULT_PACK_REL } from "../../src/workshop/seed.mjs";
import { serializeArtifact, replayLedger, offlineAssert } from "../../src/workshop/replay.mjs";
import { conformanceScore } from "../../src/workshop/loop.mjs";
import {
  ROTATE_FLAG, preflightPins, guardedWriteRecord, loadTrackedSet, isTracked,
} from "../../src/form/pin-guard.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

export const PATTERN_BOOK_SCHEMA = "pattern-book-chain/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const REL_DIR = "benchmarks/sculpture/pattern-book";
const OUT_DIR = join(ROOT, REL_DIR);
const SKETCH_REL = "benchmarks/sculpture/form-sketch";
const RECOG_REL = "benchmarks/sculpture/recognition";

// T-132-01: the pack is invocation data. The committed sketch/recognition seam is always
// verified under ITS pack of record (the default — those records were minted under it); the
// --pack flag selects the BUILD pack, substituted exactly once, at seed time. Record paths
// namespace per pack via chainRels so a second-pack run never collides with committed records.
const seamPackPath = () => join(ROOT, DEFAULT_PACK_REL);

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";
const readRel = (rel) => readFile(join(ROOT, rel), "utf8");

/** Registered buildings with a committed conditioned sketch (the recognize.mjs predicate). */
const subjectDefs = () => Object.values(SUBJECTS).filter((d) => d.glb && d.generated?.scale);

/** E-25 Rule 3 self-grep: no subject keys in this runner's source. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

// ---------------------------------------------------------------- stages (pure of model + GL)

/** Stage 1 — the committed conditioned sketch (T-123): present, sha-receipted. */
async function verifySketch(key) {
  const rels = [`${SKETCH_REL}/${key}.json`, `${SKETCH_REL}/${key}-sheet.png`];
  const out = {};
  for (const rel of rels) {
    const p = join(ROOT, rel);
    if (!existsSync(p)) throw new Error(`committed sketch input absent: ${rel} (run sketch:${key} under its own ticket)`);
    out[rel.endsWith(".png") ? "sheet" : "read"] = { path: rel, sha256: sha256(await readFile(p)) };
  }
  return out;
}

/** Stage 2 — the committed model-recognized program (T-125): re-parsed through the SAME gates
 *  as the live ask, re-compiled, re-realized, byte-compared to the committed first draft. */
async function verifyRecognition(key, pack) {
  const programRel = `${RECOG_REL}/${key}.program.json`;
  const artifactRel = `${RECOG_REL}/${key}.artifact.json`;
  const repliesRel = `${RECOG_REL}/${key}.replies.json`;
  const programText = await readRel(programRel).catch(() => {
    throw new Error(`committed recognition program absent: ${programRel} (T-125's record is this chain's input)`);
  });
  const program = parseProgramReply(programText, { pack }); // same gates as live
  const { workshopProgram } = compileProgram(program, pack);
  const { artifact } = realizeProgram(assertWorkshopProgram(workshopProgram));
  const committed = await readRel(artifactRel);
  if (sha256(jsonOf(artifact)) !== sha256(committed)) {
    throw new Error(`recognition draft does not reproduce from its committed program (${artifactRel})`);
  }
  const conformance = runConformance(
    { occ: artifactOccupancy(JSON.parse(committed)), declarations: workshopProgram.declarations }, pack);
  const replies = JSON.parse(await readRel(repliesRel));
  return {
    program,
    receipt: {
      program: { path: programRel, sha256: sha256(programText) },
      artifact: { path: artifactRel, sha256: sha256(committed), reproduced: true },
      conformance: { passed: conformance.passed },
      replies: { askCount: replies.askCount, budget: replies.budget, accepted: replies.accepted },
    },
  };
}

/** Stage 3 — seed: compile under the declared revision budget; the committed workshop program. */
function stageSeed(program, pack) {
  const seeded = seedWorkshopProgram({ program, pack });
  if (!seeded.conformance.passed) {
    const bad = seeded.conformance.checks.filter((c) => !c.passed).map((c) => c.name).join(", ");
    throw new Error(`seeded realization fails pack conformance (${bad}) — the chain refuses to spend on it`);
  }
  return seeded;
}

/** The chain's consumption plan (T-106 contract): derived from the committed ledger's FINAL
 *  program (accepted adjusts included), persisted beside the artifact under test so the frozen
 *  gate censuses the roof program + course family the chain actually built. Pure of model/GL. */
async function derivePlan(rels) {
  const ledger = JSON.parse(await readRel(rels.ledger));
  const { program: finalProgram } = replayLedger({ ledger });
  return { planRel: rels.plan, planJson: jsonOf(componentPlanFrom(finalProgram)) };
}

/** Stage 5 — read back what the workshop committed; the chain record's workshop receipt. */
async function readBackWorkshop(rels) {
  const ledgerRel = rels.ledger;
  const finalRel = rels.final;
  const ledgerText = await readRel(ledgerRel);
  const finalText = await readRel(finalRel);
  const ledger = JSON.parse(ledgerText);
  const score = (rep) => (rep ? conformanceScore(rep) : null);
  const rounds = ledger.rounds ?? [];
  return {
    ledger, finalText,
    receipt: {
      ledger: { path: ledgerRel, sha256: sha256(ledgerText) },
      final: { path: finalRel, sha256: sha256(finalText) },
      outcome: ledger.final.outcome,
      rounds: { used: ledger.final.rounds, budget: ledger.budget.rounds },
      accepted: rounds.filter((r) => r.decision === "revise" && r.conformance?.accepted).length,
      rolledBack: rounds.filter((r) => /^regressed/.test(r.conformance?.reason ?? "")).length,
      unavailable: rounds.filter((r) => r.applied?.kind === "unavailable").length,
      applyFailed: rounds.filter((r) => /^apply-failed/.test(r.conformance?.reason ?? "")).length,
      conformance: {
        first: score(rounds[0]?.conformance?.before),
        final: score(ledger.final.conformance),
        finalPassed: ledger.final.conformance.checks.every((c) => c.passed),
      },
    },
  };
}

function chainMd(rec) {
  const w = rec.stages.workshop;
  const nsPart = rec.runKey === rec.subject ? "" : `:${rec.pack}`;
  const lines = [
    `# Pattern-book chain — ${rec.runKey} (${PATTERN_BOOK_SCHEMA}, ${rec.ticket})`,
    "",
    `Sketch (T-123) → recognized program (T-125, consumed) → seeded realization (pack \`${rec.pack}\`,`,
    `declared budget ${rec.budget.rounds} rounds) → workshop revision (T-126) → final build. Replay:`,
    `\`npm run patternbook${nsPart}:repro\` / \`npm run patternbook${nsPart}:offline\` (byte-identical, no model, no GL).`,
    "",
    `| stage | receipt |`,
    `| --- | --- |`,
    `| sketch | \`${rec.stages.sketch.read.sha256.slice(0, 16)}…\` + sheet \`${rec.stages.sketch.sheet.sha256.slice(0, 16)}…\` |`,
    `| recognition | program \`${rec.stages.recognition.program.sha256.slice(0, 16)}…\` — draft reproduced byte-identically; asks ${rec.stages.recognition.replies.askCount}/${rec.stages.recognition.replies.budget} |`,
    `| seed | \`${rec.stages.seed.path}\` (\`${rec.stages.seed.sha256.slice(0, 16)}…\`), ${rec.stages.seed.cells} cells, conformance PASS |`,
    `| workshop | **${w.outcome}** after ${w.rounds.used}/${w.rounds.budget} rounds — accepted ${w.accepted}, rolled back ${w.rolledBack}; gate ${w.conformance.first ? `${w.conformance.first.passed}✓/${w.conformance.first.findings}f` : "—"} → ${w.conformance.final.passed}✓/${w.conformance.final.findings}f |`,
    `| final | \`${w.final.path}\` (\`${w.final.sha256.slice(0, 16)}…\`) |`,
    "",
    `Judging is NOT this chain's: the frozen judge runs once per subject from outside the`,
    `workshop (\`npm run gate:patternbook:${rec.subject}${nsPart}\`); the T-126 isolation receipt covers this file.`,
    "",
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------- modes

async function runLive(def, { rotate }) {
  const key = def.key;
  const seamPack = loadStylePack(seamPackPath());
  const buildPack = loadStylePack(join(ROOT, buildPackRel));
  const rels = chainRels(key, buildPackRel);
  const recordRels = [rels.record, rels.recordMd];
  const seedRel = rels.seed;

  // T-119: BEFORE any spend — this chain's own writes. The workshop spawn preflights its
  // ledger/digest/final pins itself, before its first metered call.
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [...recordRels, seedRel].map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate, intent: `pattern-book chain live (${key})`, domain: "workshop",
  });
  await mkdir(OUT_DIR, { recursive: true });
  const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate, domain: "workshop", trackedSet });

  const track = { stage: "sketch" };
  try {
    const sketch = await verifySketch(key);
    track.stage = "recognition";
    const { program, receipt: recognition } = await verifyRecognition(key, seamPack);
    track.stage = "seed";
    const seeded = stageSeed(program, buildPack);
    await mkdir(join(ROOT, rels.dir), { recursive: true });
    await write(seedRel, seeded.serialized);
    track.stage = "workshop";
    const args = [join(HERE, "workshop.mjs"), "--subject", key, "--pack", buildPackRel, ...(rotate ? [ROTATE_FLAG] : [])];
    const spawned = spawnSync(process.execPath, args, { stdio: "inherit", cwd: ROOT });
    if (spawned.status !== 0) throw new Error(`workshop loop exited ${spawned.status}`);
    track.stage = "record";
    const { planRel, planJson } = await derivePlan(rels);
    await write(planRel, planJson);
    const { receipt: workshop } = await readBackWorkshop(rels);
    const record = {
      schema: PATTERN_BOOK_SCHEMA,
      ticket: ticketId,
      subject: key,
      runKey: rels.runKey,
      pack: buildPack.style,
      budget: { ...PATTERN_BOOK_BUDGET },
      stages: {
        sketch,
        recognition,
        seed: { path: seedRel, sha256: sha256(seeded.serialized), cells: seeded.cells.length, conformance: { passed: true } },
        workshop,
        plan: { path: planRel, sha256: sha256(planJson) },
      },
      generalization: await generalizationGrep(),
      replay: {
        npmRun: rels.runKey === key
          ? "patternbook:repro / patternbook:offline"
          : `patternbook:${buildPack.style}:repro / patternbook:${buildPack.style}:offline`,
        asserts: "committed program+ledger → byte-identical final build",
      },
    };
    await write(rels.record, jsonOf(record));
    await write(rels.recordMd, chainMd(record));
    console.error(`[pattern-book] ${key}: ${workshop.outcome} after ${workshop.rounds.used}/${workshop.rounds.budget} rounds; ` +
      `final conformance ${workshop.conformance.finalPassed ? "PASS" : "FAIL"}; grep ${record.generalization.clean ? "clean" : "HITS"}`);
    return record.generalization.clean;
  } catch (e) {
    const failed = {
      schema: PATTERN_BOOK_SCHEMA, ticket: ticketId, subject: key, runKey: rels.runKey, pack: buildPack.style,
      status: "pipeline-failed", stage: track.stage, error: e.message,
      generalization: await generalizationGrep(),
    };
    await write(rels.record, jsonOf(failed));
    console.error(`[pattern-book] ${key}: PIPELINE FAILED at stage "${track.stage}" — ${e.message}`);
    return false;
  }
}

async function runRepro(def, { offline }) {
  const key = def.key;
  const rels = chainRels(key, buildPackRel);
  // the recognize.mjs --offline precedent: a subject with no committed chain is SKIPPED, not
  // failed — the sweep asserts every committed chain, and at least one must exist.
  if (!existsSync(join(ROOT, `${RECOG_REL}/${key}.program.json`)) ||
      !existsSync(join(ROOT, rels.seed))) {
    console.error(`[pattern-book ${offline ? "--offline" : "--repro"}] ${rels.runKey}: no committed chain — skipped`);
    return null;
  }
  const seamPack = loadStylePack(seamPackPath());
  const buildPack = loadStylePack(join(ROOT, buildPackRel));
  const problems = [];
  try {
    await verifySketch(key);
    const { program } = await verifyRecognition(key, seamPack);
    const seeded = seedWorkshopProgram({ program, pack: buildPack });
    const committedSeed = await readRel(rels.seed);
    if (sha256(seeded.serialized) !== sha256(committedSeed)) {
      problems.push("seeded program DIVERGES from the committed workshop program");
    }
    const ledgerText = await readRel(rels.ledger);
    const finalText = await readRel(rels.final);
    const ledger = JSON.parse(ledgerText);
    const { artifact, program: finalProgram } = replayLedger({ ledger });
    if (serializeArtifact(artifact) !== finalText) {
      problems.push("ledger replay DIVERGES from the committed final artifact");
    }
    const conform = (a, d) => runConformance({ occ: artifactOccupancy(a), declarations: d }, buildPack);
    const finalConf = conform(artifact, finalProgram.declarations);
    if (JSON.stringify(conformanceScore(finalConf)) !== JSON.stringify(conformanceScore(ledger.final.conformance))) {
      problems.push("re-derived final conformance score diverges from the ledger's");
    }
    const { planRel, planJson } = await derivePlan(rels);
    const committedPlan = await readRel(planRel).catch(() => null);
    if (committedPlan === null) problems.push(`consumption plan absent (${planRel}) — backfill with --plan-only`);
    else if (sha256(planJson) !== sha256(committedPlan)) problems.push("re-derived consumption plan DIVERGES from the committed one");
    if (offline) {
      const oa = offlineAssert({ ledger, finalArtifactText: finalText, conform });
      if (!oa.ok) problems.push(...oa.problems.map((p) => `offlineAssert: ${p}`));
    }
  } catch (e) {
    problems.push(e.message);
  }
  for (const p of problems) console.error(`[pattern-book ${offline ? "--offline" : "--repro"}] ${rels.runKey}: ${p}`);
  console.error(`[pattern-book ${offline ? "--offline" : "--repro"}] ${rels.runKey}: ${problems.length === 0
    ? "chain REPRODUCES byte-identically (sketch → program → seed → replayed final)"
    : `${problems.length} problem(s)`}`);
  return problems.length === 0;
}

// ---------------------------------------------------------------- CLI

const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const onlySubject = argOf("--subject");
const all = argv.includes("--all");
const repro = argv.includes("--repro");
const offline = argv.includes("--offline");
const planOnly = argv.includes("--plan-only");
const rotate = argv.includes(ROTATE_FLAG);
const buildPackRel = argOf("--pack") ?? DEFAULT_PACK_REL; // T-132-01: substitution pack (data)
const ticketId = argOf("--ticket") ?? "T-127-01"; // the run's authority, named in the record

const defs = subjectDefs();
if (!all && !onlySubject) throw new Error(`pass --subject <${defs.map((d) => d.key).join("|")}> or --all`);
if (onlySubject && !defs.some((d) => d.key === onlySubject)) {
  throw new Error(`--subject must be one of: ${defs.map((d) => d.key).join(", ")}`);
}
const selected = defs.filter((d) => !onlySubject || d.key === onlySubject);

if (planOnly) {
  // Backfill the T-106 consumption plan from a COMMITTED chain (pure of model/GL; the plan is a
  // function of the committed ledger's final program). First writes are free; a committed plan
  // needs --rotate-pins like any record.
  const trackedSet = loadTrackedSet(ROOT);
  let wrote = 0;
  for (const def of selected) {
    const rels = chainRels(def.key, buildPackRel);
    if (!existsSync(join(ROOT, rels.ledger))) {
      console.error(`[pattern-book --plan-only] ${rels.runKey}: no committed ledger — skipped`);
      continue;
    }
    const { planRel, planJson } = await derivePlan(rels);
    preflightPins({
      pins: [{ rel: planRel, tracked: isTracked(trackedSet, planRel) }],
      rotate, intent: `consumption-plan backfill (${def.key})`, domain: "workshop",
    });
    await guardedWriteRecord({ root: ROOT, rel: planRel, content: planJson, rotate, domain: "workshop", trackedSet });
    console.error(`[pattern-book --plan-only] ${def.key}: wrote ${planRel}`);
    wrote++;
  }
  if (wrote === 0) throw new Error("--plan-only: no committed ledgers found for the selection");
} else if (repro || offline) {
  const results = [];
  for (const def of selected) results.push(await runRepro(def, { offline }));
  const ran = results.filter((r) => r !== null);
  if (ran.length === 0) throw new Error(`--${offline ? "offline" : "repro"}: no committed chains found for the selection`);
  if (ran.some((ok) => !ok)) process.exit(1);
} else {
  for (const def of selected) {
    const ok = await runLive(def, { rotate });
    if (!ok) process.exit(1);
  }
}
