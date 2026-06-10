// SUBJECT PROVISIONING — concept-only vConcept BUILDING run (stages 1+2; NO build stage). Mints a
// challenge-subject concept image through the SAME path as `npm run bench:building` — the pure
// composeBuildingDesignDocPrompt → metered `claude -p` shim (stage 1), then the BAML
// BuildingConceptPrompt → Nano Banana pro via baml-concept.mts (stage 2) — into a real
// runs/NNN-vBuilding-<slug>/ dir, but deliberately stops before the metered 3-D build: a challenge
// subject must arrive with NO build (E-25 Rule 3 — the pipeline later runs it untuned). Sibling of
// the building-concept.mjs one-off (the E-20 cottage de-risk); this is its formalized, reusable form.
//
// The concept is NOT registered by this script. Judge it against the sanity checklist (T-094-01:
// single building · clean background · one canonical 3/4 view · ≥3 material zones · readable
// silhouette · no clutter · bulky throughout), record concept-checklist.md beside the image, and
// regenerate on failure with --run-dir (attempts are preserved as concept-attempt-N.png). Once a
// passing concept is registered it is IMMUTABLE (E-25 Rule 2).
//
// SECRET HYGIENE: GEMINI_API_KEY rides in process.env (sourced from the gitignored .env); never printed.
//
//   set -a; . ./.env; set +a
//   node benchmarks/sculpture/provision-concept.mjs --subject "a village church with a square bell tower"
//   node benchmarks/sculpture/provision-concept.mjs --subject "..." --run-dir runs/016-vBuilding-... \
//     --attached "bulky throughout; no thin freestanding spire or cross"   # regeneration
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, renameSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { requestText } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";
import {
  BUILDING_DEFAULT_SCALE,
  assertBuildingSpec,
  runIdForBuilding,
  composeBuildingDesignDocPrompt,
} from "../../src/building.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");

/** run.mjs's nextSeq, verbatim: max 3-digit runs/ prefix + 1. */
function nextSeq() {
  const seqs = readdirSync(RUNS_DIR)
    .map((d) => (/^(\d{3})-/.exec(d) || [])[1])
    .filter(Boolean)
    .map(Number);
  return seqs.length ? Math.max(...seqs) + 1 : 1;
}

/** run.mjs's runBamlConcept spawn contract, verbatim (not exported there): job JSON on stdin → record on stdout. */
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

function parseArgs(argv) {
  const out = { subject: undefined, scale: BUILDING_DEFAULT_SCALE, attached: "", runDir: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--subject") out.subject = argv[++i];
    else if (argv[i] === "--scale") out.scale = Number(argv[++i]);
    else if (argv[i] === "--attached") out.attached = argv[++i];
    else if (argv[i] === "--run-dir") out.runDir = argv[++i];
    else throw new Error(`unknown arg "${argv[i]}"`);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.subject) {
    console.error('usage: node benchmarks/sculpture/provision-concept.mjs --subject "<term>" [--scale N] [--attached "<note>"] [--run-dir runs/NNN-…]');
    process.exit(2);
  }
  // Validate BEFORE any metered work (run.mjs convention).
  const { subject, scale } = assertBuildingSpec({ subject: args.subject, scale: args.scale });

  // Fresh dir (new seq) or an existing one (regeneration: reuse the stage-1 design doc).
  const dir = args.runDir ? join(HERE, args.runDir.replace(/^benchmarks\/sculpture\//, "")) : join(RUNS_DIR, runIdForBuilding(nextSeq(), subject));
  const runId = basename(dir);
  const docPath = join(dir, "design-doc.md");
  const regen = Boolean(args.runDir);
  if (regen && !existsSync(docPath)) throw new Error(`--run-dir given but ${docPath} is missing`);
  mkdirSync(dir, { recursive: true });
  console.log(`provision-concept: ${runId} (scale ${scale}${regen ? ", regeneration" : ""})`);

  // Stage 1 — imagined design doc (text), via the same metered shim as run.mjs. Skipped on regen.
  if (!regen) {
    const ddPrompt = composeBuildingDesignDocPrompt({ subject, scale });
    writeFileSync(join(dir, "design-doc.prompt.txt"), ddPrompt);
    const t0 = Date.now();
    const dd = await requestText({ prompt: ddPrompt, model: PHASE1_MODEL_ID });
    writeFileSync(docPath, dd.text);
    console.log(`  stage 1 (design doc): ${dd.text.length} chars, ${Date.now() - t0}ms`);
  }

  // Preserve a previous attempt before overwriting (the checklist references attempt numbers).
  const conceptPath = join(dir, "concept.png");
  if (existsSync(conceptPath)) {
    let n = 1;
    while (existsSync(join(dir, `concept-attempt-${n}.png`))) n++;
    renameSync(conceptPath, join(dir, `concept-attempt-${n}.png`));
    console.log(`  previous concept preserved as concept-attempt-${n}.png`);
  }

  // Stage 2 — ONE 3/4 building concept image (BAML BuildingConceptPrompt → Nano Banana pro; doc-only).
  const concept = await runBamlConcept({
    designDocPath: docPath,
    images: [],
    targetBlocks: scale,
    model: "pro",
    outPath: conceptPath,
    variant: "building",
    attached: args.attached,
  });
  console.log(`  stage 2 (concept image): ${concept.model}, ~${Math.round(concept.promptChars / 4)} tok prompt, ${concept.ms}ms`);
  console.log(`✓ ${conceptPath}`);
  console.log(`  next: judge it against the sanity checklist (concept-checklist.md beside the image) before any registration.`);
}

main().catch((e) => {
  console.error(`provision-concept failed:\n  ${e.message}`);
  process.exit(1);
});
