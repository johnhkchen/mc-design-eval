// Persistent "design a temple" benchmark. Re-run as the approach is refined; each run
// is saved under runs/<NNN-approach>/ with its rendered build, and the README gallery
// regenerates so the PROGRESSION of builds is visible over time.
//
// The TASK (task.mjs) is held constant; the APPROACH varies and is the run's label.
//
// LIVE & METERED — runs the model via the `claude -p` subscription shim (spec §4):
//   node benchmarks/temple/run.mjs --approach v0-singleshot --note "what changed"
//   npm run bench:temple -- --approach v0-singleshot --note "..."

import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TEMPLE_TASK } from "./task.mjs";
import { requestDesignArtifact } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");
const README = join(HERE, "README.md");

// --- prompt composition: the v0 approach owns HOW it asks (the variable part). ------
// Deliberately uncapped and detail-inviting — the opposite of the single-shot house
// brief that hobbled the model (no "modest footprint", no "over ornament").
function composeFreeformPrompt(task, { promptMethodId, runId }) {
  return [
    "You are a master Minecraft architect. Design a GRAND CLASSICAL TEMPLE as a single,",
    "complete structured design artifact — your one chance to show the full range of your",
    "spatial and material design skill. Be ambitious and richly detailed; do NOT hold back",
    "and do NOT simplify to a plain box.",
    "",
    "## The build",
    task.goal,
    "",
    "## Scale & budget (generous on purpose)",
    "- Footprint: up to about 32 x 32 blocks — use the full area; go larger if the design needs it.",
    "- Height: up to about 28 blocks including the roof and pediment.",
    "- Block budget: aim HIGH — on the order of one to several THOUSAND blocks. Detail and scale are rewarded.",
    "",
    "## Make it detailed",
    "- Real architectural articulation: columns with capitals and bases, stepped cornices, a",
    "  pedimented/pitched roof, recessed coffers, openings with depth, and interior furnishing.",
    "- Exploit the placement DSL fully: `fill`/`box` for masses, `line` for column shafts and",
    "  edges, and `voxel` with block `state` (stairs/slabs — facing/half) for steps, cornices,",
    "  roof slopes, and trim so surfaces are not flat cuboids.",
    "- Vary materials for light, shadow, and accent.",
    "",
    "## Materials (free choice)",
    "Choose any survival-obtainable Minecraft (1.20.1) blocks that suit a classical temple —",
    "the sandstone family (smooth/cut/chiseled), quartz (block/pillar/chiseled/smooth/stairs/",
    "slab), stone bricks and variants, polished stone, prismarine, sea lanterns/glowstone for",
    "lighting, gold/copper accents. Declare exactly the blocks you place in palette.manifest.",
    "There is no whitelist — design freely.",
    "",
    "## Required metadata (set EXACTLY)",
    `- metadata.trial_id = "${runId}"`,
    `- metadata.prompting_method_id = "${promptMethodId}"`,
    `- metadata.model_id = "${PHASE1_MODEL_ID}"`,
    `- metadata.seed = ${task.seed}`,
    `- metadata.server_state_id = "${task.serverStateId}"`,
    "",
    "## Style record",
    'Set style.name = "classical temple" and style.rationale to a short account of the design.',
    "",
    "Build on flat ground with a local origin at or above y = 0 (the stepped base floor at y = 0).",
  ].join("\n");
}

// --- approaches: label -> async (task, ctx) => { artifact, raw, messages, prompt, promptMethodId }
// Add a new entry here each time the system is refined; the label becomes the run's id.
const APPROACHES = {
  "v0-singleshot": async (task, ctx) => {
    const promptMethodId = "freeform-temple.v0";
    const prompt = composeFreeformPrompt(task, { promptMethodId, runId: ctx.runId });
    const messages = [];
    const { artifact, raw } = await requestDesignArtifact({
      prompt,
      model: PHASE1_MODEL_ID,
      onMessage: (m) => messages.push(m),
    });
    return { artifact, raw, messages, prompt, promptMethodId };
  },
  // Future, once S-005 lands:
  // "v1-iterative-multimodal": async (task, ctx) => { ...render→see→revise loop... },
};

function parseArgs(argv) {
  const out = { approach: "v0-singleshot", note: "" };
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

// Rebuild the README progression section (summary table + image gallery) from every
// run's summary.json, so the README is always an accurate, scrollable history.
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
        `![temple run ${s.seq}](runs/${s.runId}/render.png)\n\n` +
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

  console.log(`temple benchmark ${runId} (approach: ${approach}) — LIVE via claude -p ...`);
  const { artifact, raw, messages, prompt, promptMethodId } = await run(TEMPLE_TASK, { runId });

  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const { renderSummary } = await import("../../src/render-tool.mjs");
  const report = await renderArtifact(artifact, { outPath: join(dir, "render.png") });
  const sum = renderSummary(report);

  writeFileSync(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");
  writeFileSync(join(dir, "prompt.txt"), prompt + "\n");
  writeFileSync(join(dir, "transcript.jsonl"), messages.map((m) => JSON.stringify(m)).join("\n") + "\n");

  const u = raw.usage || {};
  const summary = {
    seq,
    runId,
    date: new Date().toISOString().slice(0, 10),
    task: TEMPLE_TASK.id,
    taskVersion: TEMPLE_TASK.version,
    approach,
    promptMethodId,
    model: PHASE1_MODEL_ID,
    seed: TEMPLE_TASK.seed,
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
  console.log(`  render -> benchmarks/temple/runs/${runId}/render.png`);
}

main().catch((err) => {
  console.error("benchmark run failed:\n  " + (err?.message || err));
  process.exit(1);
});
