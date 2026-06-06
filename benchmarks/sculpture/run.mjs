// The vConcept SCULPTURE benchmark (T-035-01 / E-13) — design a freestanding 3-D object from
// a single TERM and render it as a 3/4 still + a front-arc "rock" turntable. Each run is saved
// under runs/<NNN-vConcept-<subject>>/ and the README gallery regenerates.
//
// LIVE & METERED — runs the model via the `claude -p` subscription shim (spec §4) and Nano
// Banana (Gemini) for the concept image; rendering needs headless GL:
//   npm run bench:sculpture -- --subject "moai" --scale 32 --note "what changed"
//
// The single approach `vConcept` chains: imagined design doc (text) → ONE 3/4 concept image
// (Nano Banana, via the BAML SculptureConceptPrompt) → a 3-D DesignArtifact built grounded on
// that one view (multimodal seam) → a 3/4 still + a rock turntable. The back/sides of the object
// are the model's reconstruction from the single concept view — a known limit (see README).
//
// Prompt WORDING lives in src/sculpture.mjs (pure, unit-tested); this file is I/O + the live
// seam + rendering + run-dir provenance only.

import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import {
  requestText,
  requestDesignArtifactWithImage,
} from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID, VCONCEPT_SCULPTURE_METHOD_ID_V2 } from "../../src/config.mjs";
import {
  VCONCEPT_SCULPTURE,
  DEFAULT_SCALE,
  SCULPTURE_VIEW_3Q,
  TURNTABLE,
  assertSculptureSpec,
  runIdForSubject,
  composeSculptureDesignDocPrompt,
  composeSculptureBuildPrompt,
} from "../../src/sculpture.mjs";
import {
  VCONCEPT_BUILDING,
  BUILDING_DEFAULT_SCALE,
  BUILDING_VIEW_3Q,
  BUILDING_TURNTABLE,
  assertBuildingSpec,
  runIdForBuilding,
  composeBuildingDesignDocPrompt,
  composeBuildingBuildPrompt,
} from "../../src/building.mjs";
import { writeValueMatch } from "./value-match-shared.mjs";

// Mode dispatch — the only difference between the frozen E-13 sculpture path and the E-20 building path
// is the pure prompt builders + run-id namespace + concept variant + framing constants. `sculpture`
// (the default) is byte-identical to before; `building` swaps these. Everything downstream (render,
// turntable, summary, README) is shared.
const MODES = {
  sculpture: {
    descriptor: VCONCEPT_SCULPTURE,
    approach: "vConcept",
    defaultScale: DEFAULT_SCALE,
    assertSpec: assertSculptureSpec,
    runId: runIdForSubject,
    composeDoc: composeSculptureDesignDocPrompt,
    composeBuild: composeSculptureBuildPrompt,
    conceptVariant: "v1",
    view3q: SCULPTURE_VIEW_3Q,
    turntable: TURNTABLE,
    allowValueMatch: true,
  },
  building: {
    descriptor: VCONCEPT_BUILDING,
    approach: "vConcept-building",
    defaultScale: BUILDING_DEFAULT_SCALE,
    assertSpec: assertBuildingSpec,
    runId: runIdForBuilding,
    composeDoc: composeBuildingDesignDocPrompt,
    composeBuild: composeBuildingBuildPrompt,
    conceptVariant: "building",
    view3q: BUILDING_VIEW_3Q,
    turntable: BUILDING_TURNTABLE,
    allowValueMatch: false,
  },
};

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");
const README = join(HERE, "README.md");

// Shell out to the tsx BAML concept stage (the generated client is TypeScript). Sends the job
// JSON on stdin, gets the result record back on stdout. Mirrors temple-facade's runBamlBuild.
function runBamlConcept(input) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", join(HERE, "baml-concept.mts")], { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`baml-concept exited ${code}`));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error(`baml-concept: unparseable output (${e.message})\n${out.slice(0, 400)}`));
      }
    });
    child.stdin.end(JSON.stringify(input));
  });
}

// The single approach: term → doc → concept → 3-D build. Returns the artifact + bookkeeping.
// `mode` (sculpture|building) supplies the pure prompt builders + the concept variant.
async function runVConcept({ subject, scale, model, effort, mode }, ctx) {
  const messages = [];
  let sumIn = 0;
  let sumOut = 0;
  let sumCost = 0;
  const acc = (raw) => {
    const u = (raw && raw.usage) || {};
    sumIn += u.input_tokens || 0;
    sumOut += u.output_tokens || 0;
    sumCost += (raw && raw.total_cost_usd) || 0;
  };

  // Stage 1 — imagined design document (plain text; no reference photo).
  const ddPrompt = mode.composeDoc({ subject, scale });
  writeFileSync(join(ctx.dir, "design-doc.prompt.txt"), ddPrompt + "\n");
  const dd = await requestText({ prompt: ddPrompt, model, effort, onMessage: (m) => messages.push(m) });
  acc(dd.raw);
  writeFileSync(join(ctx.dir, "design-doc.md"), dd.text + "\n");
  console.log(`  stage 1 (design doc): ${dd.text.length} chars`);

  // Stage 2 — ONE 3/4 concept image from the doc (Nano Banana; doc-only, no reference image).
  const conceptPath = join(ctx.dir, "concept.png");
  const concept = await runBamlConcept({
    designDocPath: join(ctx.dir, "design-doc.md"),
    images: [],
    targetBlocks: scale,
    model: "pro",
    outPath: conceptPath,
    variant: mode.conceptVariant,
  });
  console.log(`  stage 2 (concept image): ${concept.model}, ~${Math.round(concept.promptChars / 4)} tok prompt, ${concept.ms}ms`);

  // Stage 3 — 3-D build grounded on the single concept view (multimodal, schema-enforced).
  const buildPrompt = mode.composeBuild({ subject, scale, designDoc: dd.text, runId: ctx.runId, model });
  writeFileSync(join(ctx.dir, "build.prompt.txt"), buildPrompt + "\n");
  const res = await requestDesignArtifactWithImage({
    prompt: buildPrompt,
    images: [readFileSync(conceptPath)],
    model,
    effort,
    onMessage: (m) => messages.push(m),
  });
  acc(res.raw);
  console.log(`  stage 3 (3-D build): ${(res.artifact.placements ?? []).length} ops`);

  const raw = {
    subtype: "success",
    num_turns: 2,
    usage: { input_tokens: sumIn, output_tokens: sumOut },
    total_cost_usd: sumCost,
  };
  return { artifact: res.artifact, raw, messages, concept };
}

function parseArgs(argv) {
  // scale defaults per-mode (resolved in main): undefined here so --mode building can pick its larger default.
  const out = { subject: undefined, scale: undefined, frames: TURNTABLE.frames, note: "", model: PHASE1_MODEL_ID, effort: undefined, valueMatch: false, mode: "sculpture" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--subject") out.subject = argv[++i];
    else if (argv[i] === "--scale") out.scale = parseInt(argv[++i], 10);
    else if (argv[i] === "--frames") out.frames = parseInt(argv[++i], 10);
    else if (argv[i] === "--note") out.note = argv[++i];
    else if (argv[i] === "--model") out.model = argv[++i];
    else if (argv[i] === "--effort") out.effort = argv[++i];
    else if (argv[i] === "--value-match") out.valueMatch = true;
    else if (argv[i] === "--mode") out.mode = argv[++i];
  }
  return out;
}

function nextSeq() {
  if (!existsSync(RUNS_DIR)) return 1;
  const seqs = readdirSync(RUNS_DIR)
    .map((d) => parseInt(d.slice(0, 3), 10))
    .filter((n) => Number.isInteger(n));
  return seqs.length ? Math.max(...seqs) + 1 : 1;
}

function regenerateReadme() {
  const dirs = existsSync(RUNS_DIR)
    ? readdirSync(RUNS_DIR).filter((d) => existsSync(join(RUNS_DIR, d, "summary.json")))
    : [];
  const summaries = dirs
    .map((d) => JSON.parse(readFileSync(join(RUNS_DIR, d, "summary.json"), "utf8")))
    .sort((a, b) => a.seq - b.seq);

  const usd = (n) => `$${Number(n ?? 0).toFixed(4)}`;
  const table = [
    "| # | date | subject | scale | blocks | tok in/out | $ | note |",
    "|---|------|---------|-------|--------|-----------|---|------|",
    ...summaries.map(
      (s) =>
        `| ${s.seq} | ${s.date} | \`${s.subject}\` | ${s.scale} | ${s.blocks} | ${s.tokensIn}/${s.tokensOut} | ${usd(s.costUsd)} | ${s.note || ""} |`,
    ),
  ].join("\n");

  const gallery = summaries
    .map(
      (s) =>
        `### ${String(s.seq).padStart(3, "0")} — \`${s.subject}\` (scale ${s.scale}) · ${s.date}\n\n` +
        `![sculpture run ${s.seq} — 3/4](runs/${s.runId}/render-3q.png)\n\n` +
        `**${s.blocks} blocks** · ${s.tokensIn}/${s.tokensOut} tok · ${usd(s.costUsd)}` +
        (s.note ? `\n\n> ${s.note}` : ""),
    )
    .join("\n\n");

  const body = summaries.length
    ? `${table}\n\n## Gallery\n\n${gallery}`
    : "_(no runs yet — run the benchmark to populate this)_";

  const block = `<!-- RUNS:START (generated by run.mjs — do not edit by hand) -->\n\n${body}\n\n<!-- RUNS:END -->`;
  const md = readFileSync(README, "utf8").replace(/<!-- RUNS:START[\s\S]*?<!-- RUNS:END -->/, block);
  writeFileSync(README, md);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = MODES[args.mode];
  if (!args.subject || !mode) {
    console.error('usage: npm run bench:sculpture -- --subject "<term>" --scale <N> [--frames N] [--note "..."] [--model id] [--effort low|medium|high] [--value-match] [--mode sculpture|building]');
    if (args.subject && !mode) console.error(`  unknown --mode "${args.mode}" (expected: ${Object.keys(MODES).join(" | ")})`);
    process.exit(1);
  }
  // Validate BEFORE any metered work (throws sculpture:/building: … on a bad subject/scale). Scale
  // defaults per-mode (building's envelope is larger than sculpture's) when --scale is omitted.
  const reqScale = Number.isInteger(args.scale) ? args.scale : mode.defaultScale;
  const { subject, scale } = mode.assertSpec({ subject: args.subject, scale: reqScale });
  if (args.valueMatch && !mode.allowValueMatch) {
    console.log(`  note: --value-match is a sculpture-only path; ignored in ${args.mode} mode.`);
  }

  const startedAt = Date.now();
  const seq = nextSeq();
  const runId = mode.runId(seq, subject);
  const dir = join(RUNS_DIR, runId);
  mkdirSync(dir, { recursive: true });

  // Lazy: only a live run pulls the GL/prismarine core + orbit rig into the process.
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const { renderOrbit, oscillateAzimuths } = await import("../../render/src/orbit.mjs");
  const { renderSummary } = await import("../../src/render-tool.mjs");

  console.log(`${args.mode} benchmark ${runId} (${mode.approach}, scale ${scale}) — LIVE via claude -p + Nano Banana ...`);
  const { artifact, raw, messages, concept } = await runVConcept(
    { subject, scale, model: args.model, effort: args.effort, mode },
    { runId, dir },
  );

  // NB: the per-subject join key is the run id (it embeds the subject slug) + summary.json, NOT
  // metadata.target — in the live schema `target` is an enum (house|path|landscape), so a subject
  // term cannot go there without failing the AJV gate. We leave metadata exactly as the model
  // emitted it (already schema-valid via the build seam).
  writeFileSync(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

  // 3/4 hero still — the canonical three-quarter view.
  const report = await renderArtifact(artifact, { outPath: join(dir, "render-3q.png"), view: mode.view3q });
  const sum = renderSummary(report);
  console.log(`  3/4 still: ${sum.placed} blocks (unmapped ${sum.unmapped}) -> render-3q.png`);

  // Additive .v2 value-matched build (E-14 / T-041-01): snap placements to the value-true blocks that
  // hit the concept's realized value, then render a side-by-side still. ALL .v1 files above untouched.
  let valueMatch = null;
  if (args.valueMatch && mode.allowValueMatch) {
    const { snap } = await writeValueMatch({
      dir,
      runId,
      artifact,
      conceptPath: join(dir, "concept.png"),
      renderArtifact,
      renderSummary,
    });
    valueMatch = { methodId: snap.artifact.metadata.prompting_method_id, changedPlacements: snap.changedPlacements, manifest: snap.manifest };
    console.log(`  value-matched (.v2): ${snap.changedPlacements} placements rewritten -> render-3q.value.png`);
  }

  // Front-arc rock turntable — sweeps the front hemisphere only (never the imagined back).
  const tt = mode.turntable;
  const frames = Number.isInteger(args.frames) && args.frames > 0 ? args.frames : tt.frames;
  const azimuths = oscillateAzimuths(frames, { centerDeg: tt.centerDeg, amplitudeDeg: tt.amplitudeDeg });
  const orbit = await renderOrbit(artifact, {
    frames,
    azimuths,
    outDir: join(dir, "turntable"),
    baseName: "frame",
    view: { elevationDeg: tt.elevationDeg, fov: tt.fov },
  });
  console.log(`  rock turntable: ${orbit.frames.length} frames -> turntable/`);

  writeFileSync(join(dir, "transcript.jsonl"), messages.map((m) => JSON.stringify(m)).join("\n") + "\n");

  const u = raw.usage || {};
  const summary = {
    seq,
    runId,
    date: new Date().toISOString().slice(0, 10),
    approach: mode.approach,
    promptMethodId: mode.descriptor.id,
    model: args.model,
    effort: args.effort ?? null,
    subject,
    scale,
    blocks: sum.placed,
    unmapped: sum.unmapped,
    bounds: sum.bounds,
    view3q: mode.view3q,
    turntable: { frames, centerDeg: tt.centerDeg, amplitudeDeg: tt.amplitudeDeg, mode: "rock" },
    concept: { model: concept.model, promptChars: concept.promptChars, ms: concept.ms },
    tokensIn: u.input_tokens ?? 0,
    tokensOut: u.output_tokens ?? 0,
    costUsd: raw.total_cost_usd ?? 0,
    durationMs: Date.now() - startedAt,
    note: args.note,
    valueMatch,
  };
  writeFileSync(join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");

  regenerateReadme();

  console.log(
    `done ${runId}: ${summary.blocks} blocks, ${summary.tokensIn}/${summary.tokensOut} tok, ` +
      `$${Number(summary.costUsd).toFixed(4)}`,
  );
  console.log(`  3/4 still -> benchmarks/sculpture/runs/${runId}/render-3q.png`);
}

main().catch((err) => {
  console.error("sculpture benchmark run failed:\n  " + (err?.message || err));
  process.exit(1);
});
