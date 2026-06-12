// THE GEOMETRY-LEVERS RUNNER (T-136-01, story S-136, epic E-33) — the cottage-fixture proof:
// a workshop run where the model's hands REACH geometry. Seeded from the COMMITTED T-127 chain
// records (workshop seed + recognized source program + conditioned sketch — read-only; no T-127
// pin is rotated, the pattern-book chain's byte-compares stay valid), with:
//   • the source building-program threaded into the loop (geometry levers + mass re-recognition
//     reachable — T-136's seams),
//   • T-135 proportion targets DECLARED on the seed (deriveProportionDeclarations from the
//     committed sketch) so the conformance gate measures every round and the loop's no-regress
//     predicate bounds geometry revisions,
//   • the re-recognize applier INJECTED here (the model transport stays out of the pure core):
//     ReRecognizeMass through the BAML bridge on the strong tier (op "workshop-rerecognize"),
//     wrapped in judge-reply's bounded same-prompt re-asks; raw fragment replies ride the round.
//
// RECORDS AT NEW PATHS (benchmarks/sculpture/levers/<runKey>.*) — the measured-proportions
// precedent. The record's per-round ratio table (before/after/target, via the T-135 prefix
// replay) is the capability finding EITHER WAY: the lever aimed, or the lever ignored — both
// are recorded outcomes; the lever's existence is the AC, its use is the milestone's evidence.
//
// NO JUDGE RUNS. No gate spawn, no verdict parse, no gate-record write — the isolation scan
// (src/workshop/isolation.test.mjs) covers this file; writes are pin-guarded under domain
// "workshop", which structurally refuses gate-record namespaces.
//
//   live        seed → rounds (GL renders as the model's eyes; metered critique) → records
//   --replay    committed ledger + pack → final build, byte-compared. Exit 0/1. No model, no GL.
//   --offline   re-assert the committed record's internal consistency. Exit 0/1.
//
// Usage: node benchmarks/sculpture/geometry-levers.mjs --subject cottage [--pack packs/<s>.json]
//        [--replay|--offline] [--rotate-pins]

import { readFile, mkdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runConformance } from "../../src/pack/conformance.mjs";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { runReplyPolicy, MAX_REPLY_ATTEMPTS } from "../../src/form/judge-reply.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import {
  ROTATE_FLAG, preflightPins, guardedWriteRecord, loadTrackedSet, isTracked,
} from "../../src/form/pin-guard.mjs";
import { deriveProportionDeclarations } from "../../src/form/silhouette-proportion.mjs";
import { parseProgramReply } from "../../src/recognition/prompt.mjs";
import { silhouetteRatios, sketchTargetRatios } from "../../src/recognition/measured-program.mjs";
import { assertWorkshopProgram } from "../../src/workshop/program.mjs";
import { runWorkshopLoop, conformanceScore } from "../../src/workshop/loop.mjs";
import { parseWorkshopReply, critiqueRenderArgs } from "../../src/workshop/critique.mjs";
import { rerecognizeRenderArgs, parseMassReply } from "../../src/workshop/rerecognize.mjs";
import { DEFAULT_APPLIERS } from "../../src/workshop/actions.mjs";
import { serializeArtifact, replayLedger, offlineAssert } from "../../src/workshop/replay.mjs";
import { workshopSubjectsFrom, chainRels, recognitionRels, packNs, DEFAULT_PACK_REL } from "../../src/workshop/seed.mjs";
import { bamlRender } from "../../src/baml/bridge.mjs";
import { SUBJECTS as REGISTRY } from "./durable-skin.mjs";

export const LEVERS_RECORD_SCHEMA = "geometry-levers/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const REL_DIR = "benchmarks/sculpture/levers";
const SKETCH_REL = "benchmarks/sculpture/form-sketch";
const WORKSHOP_REL_DIR = "benchmarks/sculpture/workshop";

const TIER = "strong"; // critique: op "workshop-critique"; fragments: op "workshop-rerecognize"
const RENDER = Object.freeze({ width: 512, height: 512 });

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

/** The levers record paths — packNs-namespaced beside chainRels (the ONE derivation rule). */
export function leverRels(key, packRel = DEFAULT_PACK_REL) {
  const runKey = `${key}${packNs(packRel)}`;
  const base = `${REL_DIR}/${runKey}`;
  return Object.freeze({
    runKey,
    dir: `${REL_DIR}/${runKey}`,
    ledger: `${base}.ledger.json`,
    final: `${base}.final-artifact.json`,
    record: `${base}.record.json`,
    md: `${base}.md`,
  });
}

// ---------------------------------------------------------------- CLI

const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const subjectKey = argOf("--subject");
const packRel = argOf("--pack") ?? DEFAULT_PACK_REL;
const replay = argv.includes("--replay");
const offline = argv.includes("--offline");
const rotate = argv.includes(ROTATE_FLAG);

const SUBJECTS = workshopSubjectsFrom(REGISTRY, { relDir: WORKSHOP_REL_DIR, packRel });
const def = subjectKey ? SUBJECTS[subjectKey] : null;
if (!def) {
  console.error(`geometry-levers: unknown subject "${subjectKey}" (have: ${Object.keys(SUBJECTS).join(", ")})`);
  process.exit(2);
}

const rels = leverRels(subjectKey, packRel);

const readRel = (rel) => readFile(join(ROOT, rel), "utf8");

async function loadInputs() {
  const pack = loadStylePack(join(ROOT, def.pack));
  const packBytes = await readFile(join(ROOT, def.pack));
  const seedRel = chainRels(subjectKey, packRel).seed;
  const sourceRel = recognitionRels(subjectKey, packRel).program;
  const sketchRel = `${SKETCH_REL}/${subjectKey}.json`;
  const [seedText, sourceText, sketchText] = await Promise.all([
    readRel(seedRel).catch(() => { throw new Error(`committed workshop seed absent: ${seedRel} (the chain's seed stage writes it)`); }),
    readRel(sourceRel).catch(() => { throw new Error(`committed recognition program absent: ${sourceRel}`); }),
    readRel(sketchRel).catch(() => { throw new Error(`committed sketch absent: ${sketchRel}`); }),
  ]);
  const source = parseProgramReply(sourceText, { pack }); // the same gates the record passed at commit
  const sketch = JSON.parse(sketchText);
  const conceptBuf = await readFile(join(ROOT, def.concept));
  // ARM THE GATE: the seed declares the sketch's proportion targets (subject data, not style
  // policy) — runConformance appends proportion-vs-concept, the loop's no-regress reads it.
  const proportions = deriveProportionDeclarations({ sketch });
  const seedRaw = assertWorkshopProgram(seedText);
  const program = assertWorkshopProgram({
    ...structuredClone(seedRaw),
    declarations: { ...structuredClone(seedRaw.declarations), proportions },
  });
  return {
    pack, source, sketch, program, conceptBuf,
    refs: {
      seed: { path: seedRel, sha256: sha256(seedText) },
      source: { path: sourceRel, sha256: sha256(sourceText) },
      sketch: { path: sketchRel, sha256: sha256(sketchText) },
      pack: { path: def.pack, sha256: sha256(packBytes) },
      concept: { path: def.concept, sha256: sha256(conceptBuf) },
    },
    proportions,
  };
}

const conformWith = (pack) => (artifact, declarations) =>
  runConformance({ occ: artifactOccupancy(artifact), declarations }, pack);

async function loadCommitted() {
  try {
    const ledger = JSON.parse(await readRel(rels.ledger));
    const finalArtifactText = await readRel(rels.final);
    return { ledger, finalArtifactText };
  } catch (e) {
    console.error(`geometry-levers: no committed record for "${subjectKey}" (${e.message})`);
    console.error(`geometry-levers: run live first: node benchmarks/sculpture/geometry-levers.mjs --subject ${subjectKey}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------- the ratio table + digest

/** Per-round silhouette ratios via the T-135 prefix replay: row r = the program AFTER rounds ≤ r. */
function ratioTable({ ledger, pack, targets }) {
  const rows = [];
  for (let r = 0; r <= ledger.rounds.length; r++) {
    const { program } = replayLedger({ ledger, pack, throughRound: r });
    rows.push({ round: r, ...silhouetteRatios(program) });
  }
  return { targets, rows };
}

function digestMd(ledger, ratios) {
  const geomRounds = ledger.rounds.filter((r) => ["geometry", "recognize"].includes(r.applied?.kind));
  const rows = ledger.rounds.map((r) => {
    const issues = (r.critique?.issues ?? []).map((i) => `${i.severity}: ${i.region} — ${i.issue}`).join("<br>") || "—";
    const action = r.action ? `\`${JSON.stringify(r.action)}\`` : (r.decision === "done" ? "done" : "—");
    const score = (rep) => rep ? `${conformanceScore(rep).passed}✓/${conformanceScore(rep).findings}f` : "—";
    const after = ratios.rows[r.round];
    return `| ${r.round} | ${issues} | ${action} | ${score(r.conformance.before)} → ${score(r.conformance.after)} | ${r.conformance.accepted ? "ACCEPTED" : `rolled back (${r.conformance.reason})`} | ${after.ridgeToEave} / ${after.roofShare} / ${after.aspect} |`;
  });
  const t = ratios.targets;
  return [
    `# geometry levers — ${ledger.subject} (T-136-01)`,
    "",
    `The T-127 finding, closed or named: the model's critique can now AIM at geometry`,
    `(adjust-params on a mass; re-recognize a mass) and every revision is conformance- and`,
    `proportion-gated, ledgered, and replayed deterministically.`,
    "",
    `- outcome: **${ledger.final.outcome}** after ${ledger.final.rounds}/${ledger.budget.rounds} rounds`,
    `- geometry-bearing rounds: ${geomRounds.length} (${geomRounds.map((r) => `round ${r.round}: ${r.applied.kind}${r.conformance.accepted ? " ACCEPTED" : " rolled back"}`).join("; ") || "none — the lever existed and was not aimed (recorded capability finding)"})`,
    `- ratio targets (sketch): ridge:eave ${t.ridgeToEave}, roof share ${t.roofShare}, aspect ${t.aspect}`,
    `- replay: \`node benchmarks/sculpture/geometry-levers.mjs --subject ${ledger.subject} --replay\`;`,
    `  offline: \`… --offline\` (both exit-coded; no model, no GL)`,
    "",
    "| round | critique | action | gate (checks✓/findings) | verdict | ridge:eave / roofShare / aspect after |",
    "| --- | --- | --- | --- | --- | --- |",
    `| 0 (seed) | — | — | — | — | ${ratios.rows[0].ridgeToEave} / ${ratios.rows[0].roofShare} / ${ratios.rows[0].aspect} |`,
    ...rows,
    "",
  ].join("\n");
}

// ---------------------------------------------------------------- modes

async function runReplay() {
  const { pack } = await loadInputs();
  const { ledger, finalArtifactText } = await loadCommitted();
  const { artifact, applied } = replayLedger({ ledger, pack });
  const ok = serializeArtifact(artifact) === finalArtifactText;
  console.log(`geometry-levers --replay: ${ledger.rounds.length} rounds — re-applied ${applied.programAdjusts} spec adjust(s), ${applied.geometryAdjusts} geometry adjust(s), ${applied.recognized} re-recognition(s), ${applied.paintPlacements} paint placement(s) (${applied.paintPruned} pruned)`);
  console.log(ok
    ? "geometry-levers --replay: BYTE-IDENTICAL — the committed final artifact reproduces from program + source + ledger"
    : "geometry-levers --replay: DIVERGED");
  process.exit(ok ? 0 : 1);
}

async function runOffline() {
  const { pack } = await loadInputs();
  const { ledger, finalArtifactText } = await loadCommitted();
  const { ok, problems } = offlineAssert({ ledger, finalArtifactText, pack, conform: conformWith(pack) });
  for (const p of problems) console.error(`geometry-levers --offline: ${p}`);
  console.log(ok ? "geometry-levers --offline: committed record re-asserted clean" : `geometry-levers --offline: ${problems.length} problem(s)`);
  process.exit(ok ? 0 : 1);
}

async function runLive() {
  const { pack, source, sketch, program, conceptBuf, refs, proportions } = await loadInputs();

  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [rels.ledger, rels.final, rels.record, rels.md].map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate, intent: `geometry-levers live run (${subjectKey})`, domain: "workshop",
  });

  const subjectDir = join(ROOT, rels.dir);
  await mkdir(subjectDir, { recursive: true });

  const render = async ({ artifact, round }) => {
    const outDir = join(subjectDir, `round-${round}`);
    const views = await renderViews(artifact, [...MULTI_ANGLE_GATE.azimuths], { outDir, ...RENDER });
    return views.map((v) => ({ angle: v.angle, path: relative(ROOT, v.path), bytes: v.bytes }));
  };

  const exchange = async (ctx) => {
    const { renders, program: current, source: currentSource } = ctx;
    const renderB64 = await Promise.all(
      renders.map(async (r) => (await readFile(join(ROOT, r.path))).toString("base64")),
    );
    const { prompt, images } = await bamlRender({
      fn: "CritiqueWorkshopRound",
      args: critiqueRenderArgs(ctx),
      images: {
        concept: { base64: conceptBuf.toString("base64"), mediaType: "image/png" },
        renders: renderB64.map((base64) => ({ base64, mediaType: "image/png" })),
      },
    });
    const ask = async () => {
      const { text, raw } = await runTieredOp({ tier: TIER, prompt, images });
      return { text, usage: raw?.usage };
    };
    const { verdict, replies, askCount } = await runReplyPolicy(ask, {
      parse: (text) => parseWorkshopReply(text, { program: current, pack, source: currentSource }),
      maxAttempts: MAX_REPLY_ATTEMPTS,
    });
    return { verdict, replies, askCount };
  };

  // THE INJECTED re-recognize APPLIER (T-136-01): the fragment exchange — text-only (the sketch
  // digest is the evidence), strong tier, bounded same-prompt re-asks, raw replies returned for
  // the round's ledger entry. A failed policy throws → the loop records apply-failed.
  const reRecognize = async ({ program: current, source: currentSource, critique }, action) => {
    const mass = currentSource.masses.find((m) => m.id === action.massId);
    const { prompt } = await bamlRender({
      fn: "ReRecognizeMass",
      args: rerecognizeRenderArgs({ pack, sketch, mass, issues: critique?.issues ?? [] }),
      images: {},
    });
    const ask = async () => {
      const { text, raw } = await runTieredOp({ tier: TIER, prompt });
      return { text, usage: raw?.usage };
    };
    const { verdict, replies, askCount } = await runReplyPolicy(ask, {
      parse: (text) => parseMassReply(text, {
        source: currentSource, massId: action.massId, pack,
        budget: { ...current.budget },
        proportions: current.declarations?.proportions ?? null,
      }),
      maxAttempts: MAX_REPLY_ATTEMPTS,
    });
    if (!verdict) throw new Error(`re-recognition re-asks exhausted after ${askCount} attempt(s)`);
    return { kind: "recognize", mass: verdict.mass, replies, askCount, program: verdict.program, source: verdict.source };
  };

  const { ledger, artifact } = await runWorkshopLoop({
    program, pack, source,
    seams: { exchange, render },
    appliers: { ...DEFAULT_APPLIERS, "re-recognize": reRecognize },
    meta: {
      ticket: "T-136-01",
      packRef: refs.pack, conceptRef: refs.concept, sketchRef: refs.sketch,
      seedRef: refs.seed, sourceRef: refs.source,
      tier: TIER,
      instrument: { azimuths: [...MULTI_ANGLE_GATE.azimuths], ...RENDER },
    },
  });

  const ratios = ratioTable({ ledger, pack, targets: sketchTargetRatios(sketch) });
  const record = {
    schema: LEVERS_RECORD_SCHEMA,
    ticket: "T-136-01",
    subject: subjectKey,
    runKey: rels.runKey,
    pack: pack.style,
    inputs: refs,
    proportionsDeclared: proportions,
    ratios,
    outcome: ledger.final.outcome,
    geometryRounds: ledger.rounds
      .filter((r) => ["geometry", "recognize"].includes(r.applied?.kind))
      .map((r) => ({ round: r.round, kind: r.applied.kind, accepted: r.conformance.accepted, reason: r.conformance.reason })),
  };

  const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate, domain: "workshop", trackedSet });
  await write(rels.ledger, jsonOf(ledger));
  await write(rels.final, serializeArtifact(artifact));
  await write(rels.record, jsonOf(record));
  await write(rels.md, digestMd(ledger, ratios));

  const s = conformanceScore(ledger.final.conformance);
  console.log(`geometry-levers: ${ledger.final.outcome} after ${ledger.final.rounds}/${ledger.budget.rounds} rounds — final ${s.passed} checks passed, ${s.findings} findings`);
  console.log(`geometry-levers: geometry-bearing rounds: ${record.geometryRounds.length ? JSON.stringify(record.geometryRounds) : "NONE (recorded capability finding)"}`);
  console.log(`geometry-levers: record ${rels.record}; verify with --replay && --offline`);
}

if (replay && offline) {
  console.error("geometry-levers: --replay and --offline are separate modes; pick one");
  process.exit(2);
} else if (replay) {
  await runReplay();
} else if (offline) {
  await runOffline();
} else {
  await runLive();
}
