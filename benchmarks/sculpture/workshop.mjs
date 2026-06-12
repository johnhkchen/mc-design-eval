// THE WORKSHOP RUNNER (T-126-01, story S-126, epic E-31) — the impure composition of the pure
// loop: GL renders at the four gate azimuths (the model's eyes), the subscription shim on the
// strong tier (op "workshop-critique") wrapped in judge-reply's bounded re-ask policy, and
// pin-guarded record writes under domain "workshop" — which the pin-guard structurally refuses to
// aim at any gate record (judge isolation is the guard's, not this file's, to enforce).
//
// THE FROZEN JUDGE IS NOT HERE. No gate runner spawn, no gate parser, no gate record write — the
// isolation test (src/workshop/isolation.test.mjs) scans this file's source and pins the absence.
// S-127 convenes the judge once, from outside the workshop.
//
// MODES
//   live (default)  build → render → critique → act → conformance cage → … (metered; preflight
//                   the pins BEFORE any spend; first derivation writes freely, rebuilds need
//                   --rotate-pins)
//   --replay        committed program + ledger → final build, byte-compared to the committed
//                   final artifact (Rule 5; no model, no GL). Exit 0/1.
//   --offline       re-assert the committed record's internal consistency (no model, no GL).
//                   Exit 0/1.
//
// Usage: node benchmarks/sculpture/workshop.mjs --subject fixture [--pack packs/<style>.json]
//        [--replay|--offline] [--rotate-pins]

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
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
import { assertWorkshopProgram } from "../../src/workshop/program.mjs";
import { runWorkshopLoop, conformanceScore } from "../../src/workshop/loop.mjs";
import { parseWorkshopReply, critiqueRenderArgs } from "../../src/workshop/critique.mjs";
import { rerecognizeRenderArgs, parseMassReply } from "../../src/workshop/rerecognize.mjs";
import { DEFAULT_APPLIERS } from "../../src/workshop/actions.mjs";
import { parseProgramReply } from "../../src/recognition/prompt.mjs";
import { bamlRender } from "../../src/baml/bridge.mjs";
import { serializeArtifact, replayLedger, offlineAssert } from "../../src/workshop/replay.mjs";
import { workshopSubjectsFrom, chainRels, recognitionRels, DEFAULT_PACK_REL } from "../../src/workshop/seed.mjs";
import { SUBJECTS as REGISTRY } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const REL_DIR = "benchmarks/sculpture/workshop";
const SKETCH_REL = "benchmarks/sculpture/form-sketch";
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const TIER = "strong"; // op "workshop-critique" (model-tier OP_ROUTING)
const RENDER = Object.freeze({ width: 512, height: 512 });

// ---------------------------------------------------------------- CLI

const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const subjectKey = argOf("--subject") ?? "fixture";
const packRel = argOf("--pack") ?? DEFAULT_PACK_REL; // T-132-01: the pack is invocation data
const replay = argv.includes("--replay");
const offline = argv.includes("--offline");
const rotate = argv.includes(ROTATE_FLAG);

/** Subjects are DATA (no per-building code): program + concept + pack, all committed paths.
 *  The synthetic fixture stays the explicit row (its pack is part of the fixture contract);
 *  pipeline subjects derive from the durable-skin registry under the invocation's pack
 *  (T-127-01 — paths only, no subject key in this source; live mode fails loudly when the
 *  derived program has not been committed by the pattern-book chain's seed stage). */
const SUBJECTS = Object.freeze({
  fixture: Object.freeze({
    program: `${REL_DIR}/fixture/program.json`,
    concept: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png",
    pack: DEFAULT_PACK_REL,
  }),
  ...workshopSubjectsFrom(REGISTRY, { relDir: REL_DIR, packRel }),
});

const def = SUBJECTS[subjectKey];
if (!def) {
  console.error(`workshop: unknown subject "${subjectKey}" (have: ${Object.keys(SUBJECTS).join(", ")})`);
  process.exit(2);
}

// Record paths derive from the SUBJECT'S pack (the fixture's stays pinned to the default),
// namespaced per pack so two packs' records of one subject can never collide (T-132-01).
const rels = chainRels(subjectKey, def.pack);
const runKey = rels.runKey;
const ledgerRel = rels.ledger;
const digestRel = rels.digest;
const finalRel = rels.final;

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

async function loadCommitted() {
  try {
    const ledger = JSON.parse(await readFile(join(ROOT, ledgerRel), "utf8"));
    const finalArtifactText = await readFile(join(ROOT, finalRel), "utf8");
    return { ledger, finalArtifactText };
  } catch (e) {
    console.error(`workshop: no committed record for "${subjectKey}" (${e.message})`);
    console.error(`workshop: run the live loop first: npm run workshop:${subjectKey}`);
    process.exit(1);
  }
}

function conformWith(pack) {
  return (artifact, declarations) => runConformance({ occ: artifactOccupancy(artifact), declarations }, pack);
}

// ---------------------------------------------------------------- the digest

function digestMd(ledger) {
  const rows = ledger.rounds.map((r) => {
    const issues = (r.critique?.issues ?? []).map((i) => `${i.severity}: ${i.region} — ${i.issue}`).join("<br>") || "—";
    const action = r.action ? `\`${JSON.stringify(r.action)}\`` : (r.decision === "done" ? "done" : "—");
    const score = (rep) => rep ? `${conformanceScore(rep).passed}✓/${conformanceScore(rep).findings}f` : "—";
    return `| ${r.round} | ${issues} | ${action} | ${score(r.conformance.before)} → ${score(r.conformance.after)} | ${r.conformance.accepted ? "ACCEPTED" : `rolled back (${r.conformance.reason})`} |`;
  });
  const finalScore = conformanceScore(ledger.final.conformance);
  return [
    `# workshop — ${ledger.subject} (T-126-01)`,
    "",
    `The workshop loop's committed record: every round's critique, action, conformance both sides,`,
    `and raw replies live in \`${runKey}.json\`. Replay: \`npm run workshop:replay\` (byte-identical,`,
    `no model calls); offline re-assert: \`npm run workshop:offline\`.`,
    "",
    `- budget: ${ledger.budget.rounds} rounds (used ${ledger.final.rounds})`,
    `- outcome: **${ledger.final.outcome}**`,
    `- final conformance: ${finalScore.passed}/${ledger.final.conformance.checks.length} checks, ${finalScore.findings} findings`,
    `- tier: ${ledger.tier} (op \`workshop-critique\`); instrument: ${ledger.instrument.azimuths.join(", ")} @ ${RENDER.width}×${RENDER.height}`,
    "",
    "| round | critique | action | gate (checks✓/findings) | verdict |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    "",
    `Render evidence (gitignored, regen via the live runner): \`workshop/${runKey}/round-N/\`;`,
    `before/after frames: \`pr/assets/frames/workshop-${runKey}-{before,after}.png\`.`,
    "",
  ].join("\n");
}

// ---------------------------------------------------------------- modes

async function runReplay() {
  const pack = loadStylePack(join(ROOT, def.pack)); // geometry rounds recompile through the pack (T-136)
  const { ledger, finalArtifactText } = await loadCommitted();
  const { artifact, applied } = replayLedger({ ledger, pack });
  const ok = serializeArtifact(artifact) === finalArtifactText;
  console.log(`workshop --replay: ${ledger.rounds.length} rounds, re-applied ${applied.programAdjusts} adjust(s) + ${applied.paintPlacements} paint placement(s)`);
  console.log(ok
    ? "workshop --replay: BYTE-IDENTICAL — the committed final artifact reproduces from program + ledger"
    : "workshop --replay: DIVERGED — replay does not reproduce the committed final artifact");
  process.exit(ok ? 0 : 1);
}

async function runOffline() {
  const pack = loadStylePack(join(ROOT, def.pack));
  const { ledger, finalArtifactText } = await loadCommitted();
  const { ok, problems } = offlineAssert({ ledger, finalArtifactText, pack, conform: conformWith(pack) });
  for (const p of problems) console.error(`workshop --offline: ${p}`);
  console.log(ok ? "workshop --offline: committed record re-asserted clean" : `workshop --offline: ${problems.length} problem(s)`);
  process.exit(ok ? 0 : 1);
}

async function runLive() {
  const pack = loadStylePack(join(ROOT, def.pack));
  const packBytes = await readFile(join(ROOT, def.pack));
  const programText = await readFile(join(ROOT, def.program), "utf8");
  const program = assertWorkshopProgram(programText);
  const conceptBuf = await readFile(join(ROOT, def.concept));

  // T-138-01: THE HANDS (T-136) ENGAGE WHEN THE CHAIN'S INPUTS EXIST — the recognized source
  // program (geometry levers + mass re-recognition need masses to aim at; the loop's geometry
  // applier ships in DEFAULT_APPLIERS and activates on `source`) and the conditioned sketch
  // (the re-recognition fragment's evidence). Data-driven, no per-building constants: the
  // synthetic fixture has neither and runs the eyes-only loop with a byte-identical prompt
  // (the empty source block inserts zero bytes — T-136 S1 pins it).
  const sourceRel = recognitionRels(subjectKey, def.pack).program;
  const sketchRel = `${SKETCH_REL}/${subjectKey}.json`;
  const hands = existsSync(join(ROOT, sourceRel)) && existsSync(join(ROOT, sketchRel));
  let source = null, sketch = null, handsRefs = {};
  if (hands) {
    const sourceText = await readFile(join(ROOT, sourceRel), "utf8");
    source = parseProgramReply(sourceText, { pack }); // the same gates the record passed at commit
    const sketchText = await readFile(join(ROOT, sketchRel), "utf8");
    sketch = JSON.parse(sketchText);
    handsRefs = {
      sourceRef: { path: sourceRel, sha256: sha256(sourceText) },
      sketchRef: { path: sketchRel, sha256: sha256(sketchText) },
    };
  }

  // BEFORE ANY SPEND (T-119): declare every record this run writes; workshop domain — the guard
  // additionally refuses gate-record paths outright, flag or no flag.
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [ledgerRel, digestRel, finalRel].map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate, intent: `workshop live run (${subjectKey})`, domain: "workshop",
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
    // The prompt AND the image order come from the BAML function's render (T-129-01): the loop
    // hands over the round context, critiqueRenderArgs serializes it into the typed inputs, and
    // the bridge renders CritiqueWorkshopRound. Transport stays on the tiered subscription shim;
    // the SAME rendered prompt is re-sent on a bounded re-ask (the reply policy's contract).
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

  // THE INJECTED re-recognize APPLIER (T-136's composition, chain-adopted by T-138-01): the
  // fragment exchange — text-only (the sketch digest is the evidence), strong tier, bounded
  // same-prompt re-asks, raw fragment replies returned for the round's ledger entry. A failed
  // policy throws → the loop records apply-failed.
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
    program, pack, source, seams: { exchange, render },
    appliers: hands ? { ...DEFAULT_APPLIERS, "re-recognize": reRecognize } : DEFAULT_APPLIERS,
    meta: {
      packRef: { path: def.pack, sha256: sha256(packBytes) },
      conceptRef: { path: def.concept, sha256: sha256(conceptBuf) },
      ...handsRefs,
      tier: TIER,
      instrument: { azimuths: [...MULTI_ANGLE_GATE.azimuths], ...RENDER },
    },
  });

  // commit the record: ledger + digest + final artifact (domain "workshop" on every write)
  const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate, domain: "workshop", trackedSet });
  await write(ledgerRel, JSON.stringify(ledger, null, 2) + "\n");
  await write(finalRel, serializeArtifact(artifact));
  await write(digestRel, digestMd(ledger));

  // evidence frames: first round's first azimuth (before) vs the final build re-rendered (after)
  await mkdir(FRAMES_DIR, { recursive: true });
  const firstRender = ledger.rounds[0]?.renders?.[0];
  if (firstRender) {
    await copyFile(join(ROOT, firstRender.path), join(FRAMES_DIR, `workshop-${runKey}-before.png`));
    const finalViews = await renderViews(artifact, [MULTI_ANGLE_GATE.azimuths[0]], { outDir: join(subjectDir, "final"), ...RENDER });
    await copyFile(finalViews[0].path, join(FRAMES_DIR, `workshop-${runKey}-after.png`));
  }

  const s = conformanceScore(ledger.final.conformance);
  console.log(`workshop: ${ledger.final.outcome} after ${ledger.final.rounds}/${ledger.budget.rounds} rounds — final conformance ${s.passed} checks passed, ${s.findings} findings`);
  console.log(`workshop: record ${ledgerRel}; verify with npm run workshop:replay && npm run workshop:offline`);
}

if (replay && offline) {
  console.error("workshop: --replay and --offline are separate modes; pick one");
  process.exit(2);
} else if (replay) {
  await runReplay();
} else if (offline) {
  await runOffline();
} else {
  await runLive();
}
