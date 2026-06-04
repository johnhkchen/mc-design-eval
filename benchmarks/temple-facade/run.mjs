// The consolidated benchmark — design a TEMPLE FACADE and render it HEAD-ON. Fast (one
// short claude -p call, no multi-phase iteration). Each run is saved under
// runs/<NNN-approach>/ and the README gallery regenerates, so facades are compared
// frontally as the approach is refined.
//
// LIVE & METERED — runs the model via the `claude -p` subscription shim (spec §4):
//   npm run bench:temple-facade -- --approach v0-facade --note "what changed"

import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TEMPLE_FACADE_TASK } from "./task.mjs";
import { requestDesignArtifact } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");
const README = join(HERE, "README.md");

function composeFacadePrompt(task, { promptMethodId, runId }) {
  return [
    "You are a master Minecraft architect and a bold, imaginative designer. Design the",
    "full-quality FACADE (front elevation) of a TEMPLE as a single, complete structured design",
    "artifact — the one grand face you would photograph head-on. Show creativity, proportion,",
    "and rich detail. Do NOT produce a flat or monochrome wall.",
    "",
    "## What to build",
    task.goal,
    "",
    "## Style & palette — be creative and colorful (important)",
    "Invent or choose a distinctive style and commit to it — 'temple' is open to any culture,",
    "era, or imagination (classical, Egyptian, Mesoamerican, East/South Asian, Byzantine, baroque,",
    "art-deco, brutalist, fantastical, futurist...). Use COLOR and material variety deliberately:",
    "draw on the full block range — glazed/colored terracotta, colored concrete, copper and",
    "oxidized copper, prismarine and sea lanterns, blackstone/deepslate, gold, warm woods,",
    "nether/warped, wool — not a single pale stone. Give the facade a strong, recognizable",
    "identity. AVOID defaulting to plain white quartz or sandstone.",
    "",
    "## Orientation (critical — it is photographed head-on)",
    "The facade FACES +Z (toward the camera). Build it in the X–Y plane (X = width, Y = height,",
    "y = 0 at ground) with shallow RELIEF DEPTH into −Z: projecting elements (columns, buttresses,",
    "cornices) come forward; openings recede. Model only the FRONT and its relief — no back,",
    "sides, interior, or roof.",
    "",
    "## Detail & proportion bar (what quality means here)",
    "- Vertical articulation in your chosen idiom (columns, pilasters, piers, buttresses).",
    "- A crowning element (pediment, parapet, cresting, finials, stepped attic) and a defined base.",
    "- Framed openings with depth — a grand central entrance, windows/niches with surrounds —",
    "  string courses, ornament, and lighting worked into the design.",
    "- Strong proportion and an even bay rhythm; rich, intentional detail over blank fields.",
    "- Avoid uniform 45° slopes: vary pitches with slab+stair combinations and approximate",
    "  curves/arches with stepped stairs+slabs. Use voxel with block `state` (stairs/slabs,",
    "  facing/half) richly for mouldings, sills, reveals, and trim.",
    "",
    "## Scale",
    "- Width up to ~32 (X), height up to ~24 (Y), relief depth ~4–6 (into −Z). Fill it with detail.",
    "",
    "## Materials",
    "Any survival-obtainable Minecraft 1.20.1 blocks — lean into color and variety. Declare the",
    "blocks you place in palette.manifest.",
    "",
    "## Required metadata (set EXACTLY)",
    `- metadata.trial_id = "${runId}"`,
    `- metadata.prompting_method_id = "${promptMethodId}"`,
    `- metadata.model_id = "${PHASE1_MODEL_ID}"`,
    `- metadata.seed = ${task.seed}`,
    `- metadata.server_state_id = "${task.serverStateId}"`,
    "",
    "## Style record",
    "Set style.name to the style you chose (your own label) and style.rationale to a short account.",
    "",
    "Build with a local origin at x = 0, y = 0, z = 0 (ground at y = 0); the facade's front",
    "face at the highest Z so a camera in front of it (+Z) sees the detailed elevation.",
  ].join("\n");
}

const APPROACHES = {
  "v0-facade": async (task, ctx) => {
    const promptMethodId = "temple-facade-singleshot.v0";
    const prompt = composeFacadePrompt(task, { promptMethodId, runId: ctx.runId });
    const messages = [];
    const { artifact, raw } = await requestDesignArtifact({
      prompt,
      model: PHASE1_MODEL_ID,
      onMessage: (m) => messages.push(m),
    });
    return { artifact, raw, messages, prompt, promptMethodId };
  },
};

function parseArgs(argv) {
  const out = { approach: "v0-facade", note: "" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--approach") out.approach = argv[++i];
    else if (argv[i] === "--note") out.note = argv[++i];
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
    "| # | date | approach | blocks | tok in/out | cost | note |",
    "|---|------|----------|--------|-----------|------|------|",
    ...summaries.map(
      (s) =>
        `| ${s.seq} | ${s.date} | \`${s.approach}\` | ${s.blocks} | ${s.tokensIn}/${s.tokensOut} | ${usd(s.costUsd)} | ${s.note || ""} |`,
    ),
  ].join("\n");

  const gallery = summaries
    .map(
      (s) =>
        `### ${String(s.seq).padStart(3, "0")} — \`${s.approach}\` · ${s.date}\n\n` +
        `![temple-facade run ${s.seq}](runs/${s.runId}/render.png)\n\n` +
        `${s.blocks} blocks · ${s.tokensIn}/${s.tokensOut} tok · ${usd(s.costUsd)}` +
        (s.note ? `\n\n> ${s.note}` : ""),
    )
    .join("\n\n");

  const body = summaries.length
    ? `${table}\n\n## Gallery\n\n${gallery}`
    : "_(no runs yet — run the benchmark to populate this)_";

  const block = `<!-- RUNS:START (generated by run.mjs — do not edit by hand) -->\n\n${body}\n\n<!-- RUNS:END -->`;
  const md = readFileSync(README, "utf8").replace(
    /<!-- RUNS:START[\s\S]*?<!-- RUNS:END -->/,
    block,
  );
  writeFileSync(README, md);
}

async function main() {
  const { approach, note } = parseArgs(process.argv.slice(2));
  const run = APPROACHES[approach];
  if (!run) {
    console.error(`unknown approach "${approach}" (have: ${Object.keys(APPROACHES).join(", ")})`);
    process.exit(1);
  }

  const seq = nextSeq();
  const runId = `${String(seq).padStart(3, "0")}-${approach}`;
  const dir = join(RUNS_DIR, runId);
  mkdirSync(dir, { recursive: true });

  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const { renderSummary } = await import("../../src/render-tool.mjs");

  console.log(`temple-facade benchmark ${runId} (approach: ${approach}) — LIVE via claude -p ...`);
  const { artifact, raw, messages, prompt, promptMethodId } = await run(TEMPLE_FACADE_TASK, { runId, dir });

  // Frontal shot — the whole point of this benchmark (task.view).
  const report = await renderArtifact(artifact, {
    outPath: join(dir, "render.png"),
    view: TEMPLE_FACADE_TASK.view,
  });
  const sum = renderSummary(report);

  writeFileSync(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");
  writeFileSync(join(dir, "prompt.txt"), prompt + "\n");
  writeFileSync(join(dir, "transcript.jsonl"), messages.map((m) => JSON.stringify(m)).join("\n") + "\n");

  const u = raw.usage || {};
  const summary = {
    seq,
    runId,
    date: new Date().toISOString().slice(0, 10),
    task: TEMPLE_FACADE_TASK.id,
    taskVersion: TEMPLE_FACADE_TASK.version,
    approach,
    promptMethodId,
    model: PHASE1_MODEL_ID,
    seed: TEMPLE_FACADE_TASK.seed,
    view: TEMPLE_FACADE_TASK.view,
    blocks: sum.placed,
    unmapped: sum.unmapped,
    bounds: sum.bounds,
    tokensIn: u.input_tokens ?? 0,
    tokensOut: u.output_tokens ?? 0,
    costUsd: raw.total_cost_usd ?? 0,
    note,
  };
  writeFileSync(join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");

  regenerateReadme();

  console.log(
    `done ${runId}: ${summary.blocks} blocks (unmapped ${summary.unmapped}), ` +
      `${summary.tokensIn}/${summary.tokensOut} tok, $${Number(summary.costUsd).toFixed(4)}`,
  );
  console.log(`  frontal render -> benchmarks/temple-facade/runs/${runId}/render.png`);
}

main().catch((err) => {
  console.error("benchmark run failed:\n  " + (err?.message || err));
  process.exit(1);
});
