// RECOGNITION RUNNER (T-125-01, story S-125, epic E-31) — the model reads concept + conditioned
// sketch and emits the building program; the program realizes through the registry into a clean
// first draft. `node benchmarks/sculpture/recognize.mjs --subject <key> | --all [--offline]
// [--pack packs/<style>.json] [--ticket <id>] [--rotate-pins]`, or `npm run recognize:<key>` /
// `npm run recognize:offline`. Recognition is pack-conditioned (T-132-01): the sketch is the
// shared, pack-free form evidence; the emitted program speaks the invocation pack's roles, and
// records namespace per pack (recognitionRels) so packs' records never collide.
//
// LIVE (metered, subscription shim, STRONG tier — never the metered API): one recognition ask
// driven by the T-114 reply policy (same-prompt bounded re-asks on malformed/off-vocabulary
// replies; every attempt ledgered, full raw texts committed). The accepted program compiles
// (src/recognition/compile.mjs) and realizes (src/workshop/program.mjs) — zero mesh cells, no
// fit tolerances — then the pack's conformance gate judges and the 4 gate azimuths render as
// EVIDENCE (sha256-receipted; render absence is recorded, never fatal — E-24/E-28: GL bytes
// never decide). NO JUDGE CALLS — S-127 owns grading; the workshop (S-126) owns revision.
//
// --offline (E-31 Rule 5, the replay re-assert): committed program → compile → realize →
// byte-compare against the committed artifact + re-run conformance. No model, no writes.
//
// Registry-only: subjects come from the durable-skin SUBJECTS table; the self-grep pins that no
// subject key appears in this source (E-25 Rule 3 / E-31 Rule 2 — no per-building code).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { MODEL_TIERS, MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import { runReplyPolicy } from "../../src/form/judge-reply.mjs";
import { guardedWriteRecord, preflightPins, loadTrackedSet, isTracked, ROTATE_FLAG } from "../../src/form/pin-guard.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runConformance } from "../../src/pack/conformance.mjs";
import { PROGRAM_REPLY_BUDGET } from "../../src/recognition/program.mjs";
import { recognitionRenderArgs, parseProgramReply } from "../../src/recognition/prompt.mjs";
import { bamlRender } from "../../src/baml/bridge.mjs";
import { compileProgram } from "../../src/recognition/compile.mjs";
import { assertWorkshopProgram, realizeProgram } from "../../src/workshop/program.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { recognitionRels, DEFAULT_PACK_REL } from "../../src/workshop/seed.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

export const RECOGNITION_DRAFT_SCHEMA = "recognition-draft/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "recognition");
const SKETCH_DIR = join(HERE, "form-sketch");

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

/** Registered buildings that have a committed conditioned sketch to read from. */
const subjectDefs = () => Object.values(SUBJECTS).filter((d) => d.glb && d.generated?.scale);

/** E-25 Rule 3 self-grep: no subject keys in this runner's source. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

async function renderEvidence(artifact, key) {
  const renders = [];
  let renderError = null;
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const views = await renderViews(artifact, [...MULTI_ANGLE_GATE.azimuths], {
      outDir: OUT_DIR, label: (a) => `${key}-${a}`, width: 1024, height: 1024,
    });
    for (const v of views) {
      const buf = await readFile(v.path);
      renders.push({ angle: v.angle, path: relative(ROOT, v.path), bytes: buf.length, sha256: sha256(buf) });
    }
  } catch (err) {
    renderError = err.message;
    console.error(`[recognize] render: unavailable (${renderError})`);
  }
  return { renders, renderError };
}

function draftMd(rec, program) {
  const c = rec.conformance;
  const lines = [
    `# Recognition draft — ${rec.runKey ?? rec.subject} (${RECOGNITION_DRAFT_SCHEMA}, ${rec.ticket})`,
    "",
    `The model's reading: ${program.reading.summary}`,
    "",
    `| | |`,
    `| --- | --- |`,
    `| model | \`${rec.model}\` (strong tier, subscription shim) |`,
    `| asks | ${rec.askCount} live (budget ${rec.budget}; ${rec.replies.length} ledger entries) |`,
    `| prompt | \`${rec.promptSha256.slice(0, 16)}…\` (committed: ${rec.subject}.prompt.md) |`,
    `| masses | ${program.masses.map((m) => `${m.id} ${m.rect.w}×${m.rect.d}×${m.storeys}st`).join(", ")} |`,
    `| elements | ${rec.elements.map((e) => `${e.id}(${e.cellCount})`).join(", ")} |`,
    `| cells | ${rec.cells} (zero mesh cells — realized from the program alone) |`,
    `| conformance | **${c.passed ? "PASS" : "FAIL"}** — ${c.checks.map((k) => `${k.name} ${k.passed ? "✓" : "✗"}`).join(", ")} |`,
    "",
    rec.evidence.renders.length
      ? ["Renders (evidence, never gating):", ...rec.evidence.renders.map((r) => `- \`${r.path}\` (${r.angle}) sha256 ${r.sha256.slice(0, 16)}…`)].join("\n")
      : `Renders unavailable: ${rec.evidence.renderError}`,
    "",
    `Replay: \`npm run recognize:offline\` re-derives the artifact byte-identically from the`,
    `committed program (E-31 Rule 5). Revision belongs to the workshop (S-126); grading to S-127.`,
    "",
  ];
  for (const k of c.checks.filter((k) => !k.passed)) {
    lines.push(`## ${k.name} findings`, "", ...k.findings.map((f) => `- ${f}`), "");
  }
  return lines.join("\n");
}

async function runLive(def, { rotate }) {
  const key = def.key;
  const rels = recognitionRels(key, packRel);
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [rels.program, rels.replies, rels.prompt, rels.artifact, rels.record, rels.md]
      .map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate,
    intent: `live recognition (${rels.runKey})`,
  });

  const pack = loadStylePack(join(ROOT, packRel));
  const sketch = JSON.parse(await readFile(join(SKETCH_DIR, `${key}.json`), "utf8"));
  const conceptB64 = (await readFile(join(HERE, def.concept))).toString("base64");
  const sheetB64 = (await readFile(join(SKETCH_DIR, `${key}-sheet.png`))).toString("base64");

  // The prompt is the BAML function's render (T-129-01) — text AND image order come from the
  // rendered request; the sha pins it to the committed records (byte-identical to the retired
  // .mjs builder, proven by the fixture test).
  const { prompt, images } = await bamlRender({
    fn: "RecognizeBuildingProgram",
    args: recognitionRenderArgs({ pack, sketch }),
    images: {
      concept: { base64: conceptB64, mediaType: "image/png" },
      sketch_sheet: { base64: sheetB64, mediaType: "image/png" },
    },
  });
  const promptSha256 = sha256(prompt);
  const model = MODEL_TIERS.strong;
  const rawTexts = [];
  const ask = async () => {
    const { text } = await requestTextWithImage({ prompt, images, model });
    rawTexts.push(text);
    return { text };
  };

  console.error(`[recognize] ${key}: asking (budget ${PROGRAM_REPLY_BUDGET}, model ${model})…`);
  const { verdict: program, replies, askCount } = await runReplyPolicy(ask, {
    parse: (t) => parseProgramReply(t, { pack }),
    maxAttempts: PROGRAM_REPLY_BUDGET,
  });

  await mkdir(OUT_DIR, { recursive: true });
  const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate });

  const repliesRecord = {
    schema: "recognition-replies/v1",
    ticket: ticketId,
    subject: key,
    pack: pack.style,
    model,
    promptSha256,
    budget: PROGRAM_REPLY_BUDGET,
    askCount,
    accepted: program !== null,
    replies, // the T-114 ledger (clipped raws, parse status per attempt)
    rawTexts, // FULL raw texts, one per live ask (the AC's committed raw replies)
  };
  await write(rels.replies, jsonOf(repliesRecord));
  await write(rels.prompt, `# Recognition prompt — ${rels.runKey} (${ticketId})\n\nsha256 \`${promptSha256}\`; schema: \`schema/building-program.schema.json\`.\n\n----\n\n${prompt}\n`);

  if (program === null) {
    console.error(`[recognize] ${key}: REFUSED — every reply malformed within the budget (ledger committed).`);
    return false;
  }

  const { workshopProgram } = compileProgram(program, pack);
  const { artifact, cells, elements } = realizeProgram(assertWorkshopProgram(workshopProgram));
  assertArtifact(artifact);
  const conformance = runConformance({ occ: artifactOccupancy(artifact), declarations: workshopProgram.declarations }, pack);
  const evidence = await renderEvidence(artifact, rels.runKey);
  const grep = await generalizationGrep();

  const record = {
    schema: RECOGNITION_DRAFT_SCHEMA,
    ticket: ticketId,
    subject: key,
    runKey: rels.runKey,
    pack: pack.style,
    model,
    promptSha256,
    askCount,
    budget: PROGRAM_REPLY_BUDGET,
    cells: cells.length,
    elements,
    conformance,
    evidence,
    generalization: grep,
    replies: replies.map(({ attempt, parsed, source }) => ({ attempt, parsed, source })),
    replay: {
      npmRun: packRel === DEFAULT_PACK_REL ? "recognize:offline" : `recognize:offline (--pack ${packRel})`,
      asserts: "committed program → byte-identical artifact",
    },
  };

  await write(rels.program, jsonOf(program));
  await write(rels.artifact, jsonOf(artifact));
  await write(rels.record, jsonOf(record));
  await write(rels.md, draftMd(record, program));

  console.error(`[recognize] ${rels.runKey}: ${cells.length} cells from ${elements.length} elements; ` +
    `conformance ${conformance.passed ? "PASS" : "FAIL"}; asks ${askCount}; grep ${grep.clean ? "clean" : `HITS ${grep.subjectKeysInRunner}`}`);
  return conformance.passed && grep.clean;
}

async function runOffline(def) {
  const key = def.key;
  const rels = recognitionRels(key, packRel);
  const committedProgram = await readFile(join(ROOT, rels.program), "utf8").catch(() => null);
  if (committedProgram === null) {
    console.error(`[offline] ${rels.runKey}: no committed program — skipped`);
    return null;
  }
  const pack = loadStylePack(join(ROOT, packRel));
  const program = parseProgramReply(committedProgram, { pack }); // same gates as live
  const { workshopProgram } = compileProgram(program, pack);
  const { artifact } = realizeProgram(assertWorkshopProgram(workshopProgram));
  const fresh = jsonOf(artifact);
  const committed = await readFile(join(ROOT, rels.artifact), "utf8");
  const identical = sha256(fresh) === sha256(committed);
  const conformance = runConformance({ occ: artifactOccupancy(artifact), declarations: workshopProgram.declarations }, pack);
  console.error(`[offline] ${rels.runKey}: artifact ${identical ? "REPRODUCES byte-identically" : "DIVERGES"} ` +
    `(sha ${sha256(fresh).slice(0, 12)}… vs ${sha256(committed).slice(0, 12)}…); conformance ${conformance.passed ? "PASS" : "FAIL"}`);
  return identical && conformance.passed;
}

// --- CLI ------------------------------------------------------------------------------------------

const argv = process.argv.slice(2);
const argOf = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : null;
};
const onlySubject = argOf("--subject");
const all = argv.includes("--all");
const offline = argv.includes("--offline");
const rotate = argv.includes(ROTATE_FLAG);
const packRel = argOf("--pack") ?? DEFAULT_PACK_REL; // T-132-01: recognition is pack-conditioned
const ticketId = argOf("--ticket") ?? "T-125-01"; // the run's authority, named in the records

const defs = subjectDefs();
if (!all && !onlySubject) throw new Error(`pass --subject <${defs.map((d) => d.key).join("|")}> or --all`);
if (onlySubject && !defs.some((d) => d.key === onlySubject)) {
  throw new Error(`--subject must be one of: ${defs.map((d) => d.key).join(", ")}`);
}
const selected = defs.filter((d) => !onlySubject || d.key === onlySubject);

if (offline) {
  const results = [];
  for (const def of selected) results.push(await runOffline(def));
  const ran = results.filter((r) => r !== null);
  if (ran.length === 0) throw new Error("--offline: no committed programs found for the selection");
  if (ran.some((ok) => !ok)) process.exit(1);
} else {
  for (const def of selected) {
    const ok = await runLive(def, { rotate });
    if (!ok) process.exit(1);
  }
}
