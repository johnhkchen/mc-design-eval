// Hallway SECTION benchmark — the temple-facade champion pipeline (vRefRevise-designdoc) pointed at an
// interior: a decorated hallway seen SIDEWAYS (a longitudinal section, near wall cut away), rendered
// head-on like a facade. LIVE & METERED via the `claude -p` shim (+ one Gemini concept image).
//
//   node benchmarks/hallway-section/run.mjs [--brief "<context>"] [--ref <img>] [--note "..."]
//
// Stages (same as temple-facade 014/027, plus stage 0 since there is no reference photo):
//   0. concept art (Nano Banana Pro) = the craft reference      (skipped with --ref)
//   1. concept-grounded design doc
//   2. high-res build of the section elevation (model-authored placements)
//   3. render → revise comparing concept + render, anchored to the doc
//   + render (frontal section + 3/4) and the categorical BAML judge (MC_JUDGE_MODEL_ID to pin it)
import { mkdirSync, writeFileSync, readFileSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { requestDesignArtifact, requestDesignArtifactWithImage, requestTextWithImage } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID, JUDGE_MODEL_ID } from "../../src/config.mjs";
import { generateImage } from "../../src/nano-banana.mjs";
import { judgeRender } from "../temple-facade/judge.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");

const DEFAULT_BRIEF =
  "A service corridor inside a spruce-taiga hillside base. It connects the storage wing to the operator's " +
  "room of a redstone part-picking machine; a live redstone signal line runs along the floor in a channel " +
  "against the far wall.";

export const HALLWAY_SECTION_TASK = (brief) =>
  Object.freeze({
    id: "hallway-section",
    version: 1,
    seed: 11,
    serverStateId: "flat-creative-superflat.v1",
    brief,
    goal:
      "A beautifully DECORATED HALLWAY, shown as a longitudinal SECTION — the corridor cut along its " +
      "length with the near wall removed, so you look sideways at the far interior wall, with the floor " +
      "and ceiling seen in section. It must read as a real, walkable corridor built by a skilled human " +
      "builder: structural rhythm (bays), depth and relief on the far wall, a treated floor and ceiling, " +
      "deliberate lighting, and props that say who uses it. Context: " +
      brief,
    // Head-on, slightly above eye line so the floor treatment reads; narrow fov keeps it elevation-like.
    view: { azimuthDeg: 0, elevationDeg: 6, fov: 40 },
    view3q: { azimuthDeg: 28, elevationDeg: 18 },
  });

const ORIENTATION = [
  "## Orientation & geometry (a section, photographed head-on)",
  "- The corridor runs along X (length up to ~44). Y is up; the floor surface is at y = 1 (a structural",
  "  floor slab fills y = 0 and may go deeper below as foundations/section poché). Interior clear height",
  "  is your call (≈6–10) — the ceiling/roof structure sits above it.",
  "- The FAR WALL's interior face looks toward +Z (toward the viewer) at about z = 0; the wall's own",
  "  thickness and anything behind it go into −Z (up to ~6 deep). The corridor's walkable floor extends",
  "  from the far wall toward +Z for its full width (5–7 blocks); the NEAR wall is CUT AWAY — the section",
  "  plane is the highest Z. Floor slab and ceiling extend to the section plane and read as cut bands.",
  "- Keep a clear walk line: at least 3 blocks wide and 3 high along the whole length.",
].join("\n");

function conceptPrompt(task) {
  return [
    "Concept art for a Minecraft build (voxel blocks, vanilla 1.20 block palette, crisp and readable).",
    "Subject: a LONGITUDINAL SECTION / cutaway elevation of a beautifully decorated hallway — we look",
    "SIDEWAYS into the corridor with the near wall removed, seeing the far interior wall, the floor and the",
    "ceiling cut in section. Orthographic, straight-on, the corridor running left to right across the frame.",
    "Show structural bays (posts/pillars, beams), recessed panels and relief on the far wall, a patterned",
    "floor, a treated ceiling, hanging or wall-mounted lights in rhythm, and a few lived-in props.",
    "Skilled-human-builder showcase quality.",
    "Context: " + task.brief,
  ].join(" ");
}

function designDocPrompt(task) {
  return [
    "You are a master architect and Minecraft interior builder. ATTACHED is CONCEPT ART for the build.",
    "Study it, then write a DESIGN DOCUMENT for a Minecraft hallway SECTION that takes its CRAFT from the",
    "concept — rhythm, proportion, relief, ornament — and grounds every choice in the context.",
    "",
    "Materials are DIEGETIC, not optical: choose blocks from what this place would be built of (the setting,",
    "its use, its wealth), not by colour-matching pixels. The concept informs form and mood; the CONTEXT",
    "decides materials.",
    "",
    "## Subject",
    task.goal,
    "",
    "## Write the document — firm decisions, each with a REASON",
    "1. **Identity** — one line: what this corridor is and what it should feel like.",
    "2. **Palette by role** — 3–5 Minecraft 1.20.1 blocks: dominant (~60%), supporting (~30%), accent (~10%),",
    "   plus a named relationship (e.g. dark timber / pale stone / brass). Why each is local and fitting.",
    "3. **Bay rhythm** — bay length in blocks and exactly what repeats in each bay (structure, panel, light).",
    "4. **Floor / walls / ceiling** — a distinct treatment for each (floor border + field, wall footing +",
    "   panels + frieze, ceiling beams/coffers). How the redstone channel is shown off, not hidden.",
    "5. **Light & life** — light sources on the rhythm; the props and who uses the space.",
    "6. **Proportions** — clear height, bay width, depth of relief (pillars proud by N, panels recessed by N).",
    "",
    "Keep it under ~400 words. Output ONLY the document (markdown).",
  ].join("\n");
}

function metadata(task, { runId, promptMethodId }) {
  return [
    "## Required metadata (set EXACTLY)",
    `- metadata.trial_id = "${runId}"`,
    `- metadata.prompting_method_id = "${promptMethodId}"`,
    `- metadata.model_id = "${PHASE1_MODEL_ID}"`,
    `- metadata.seed = ${task.seed}`,
    `- metadata.server_state_id = "${task.serverStateId}"`,
  ].join("\n");
}

function buildPrompt(task, { runId, promptMethodId, designDoc }) {
  return [
    "You are a master Minecraft architect. Below is your FINALIZED design document for a hallway section.",
    "Build it as a structured design artifact that faithfully realizes the document, at GENEROUS SCALE and",
    "with DEEP RELIEF. Plain, boxy corridors are the failure this exercise exists to fix — use the room.",
    "",
    "## Finalized design document",
    designDoc,
    "",
    ORIENTATION,
    "",
    "## Craft (this is judged)",
    "- BAYS: a full structural frame (posts/pillars + beam + ceiling rib) on the document's rhythm, repeated",
    "  the whole length. Pillars stand PROUD of the far wall by 1–2; panels between them RECESS by 1–2.",
    "  Recesses are carved by NOT placing wall material there (there is no air op; last write wins).",
    "- NO LARGE FLAT FIELDS: every wall panel wider than ~3 gets relief, trim, a frieze, or a feature.",
    "- Sub-block detail carries the craft: stairs (upside-down as brackets/corbels), slabs, trapdoors as",
    "  panels, walls/fences as posts and rails, chains + lanterns, buttons as rivets. Use voxel `state`",
    "  (facing/half/type) for every directional block.",
    "- Floor: border + field pattern; the redstone channel shown as a deliberate feature. Ceiling: beams or",
    "  coffers on the bay rhythm. Lights on the rhythm. A few props that say who uses it.",
    "- Everything attaches to the far wall, the floor, or the ceiling — nothing floats.",
    "- Use `fill`/`box` for masses and `line` for runs to stay efficient; repeat bays consistently.",
    "",
    "## Materials",
    "Primarily the document's palette; declare the blocks you place in palette.manifest.",
    "",
    metadata(task, { runId, promptMethodId }),
    "",
    "## Style record",
    "style.name = the document's identity; style.rationale = one line tying the build to the document.",
    "",
    "Local origin at x = 0, y = 0, z = 0.",
  ].join("\n");
}

function revisePrompt(task, { runId, promptMethodId, designDoc }) {
  return [
    "You are a master Minecraft architect making a SECOND, improving pass on your own work. TWO images are",
    "attached: (1) the CONCEPT ART, and (2) a head-on render of your CURRENT hallway section.",
    "The concept is a CRAFT reference — rhythm, relief, ornament, mood. Materials come from your document.",
    "",
    "## Your finalized design document (honor it)",
    designDoc,
    "",
    "## Improve — compare your build (image 2) to the concept (image 1)",
    "- Rhythm: are the bays clear, consistent, and strong enough to read at a glance? Fix any bay that",
    "  breaks the pattern or reads weak.",
    "- Depth: deepen wherever the far wall reads flat; pillars proud, panels recessed, frieze/cornice layers.",
    "- NO LARGE FLAT FIELDS: treat the largest remaining blank surface (wall, floor, or ceiling) as",
    "  unfinished and give it relief or pattern. Then the next largest.",
    "- Floor and ceiling must be designed surfaces, not plain slabs. The redstone channel stays a feature.",
    "- Hold the palette hierarchy; don't let it go monochrome or muddy; don't add noise texture.",
    "- Keep the 3-wide × 3-high walk line clear. Fix anything floating, misaligned, or awkward.",
    "",
    ORIENTATION,
    "",
    metadata(task, { runId, promptMethodId }),
    "",
    "## Style record",
    "Keep style.name; set style.rationale to one line on what you improved.",
    "",
    "## Output (critical)",
    "Emit ONE complete improved design artifact — the full set of placements, not a diff. Local origin at 0,0,0.",
  ].join("\n");
}

const IMAGE_MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

function parseArgs(argv) {
  const o = { brief: DEFAULT_BRIEF, note: "" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--brief") o.brief = argv[++i];
    else if (argv[i] === "--ref") o.ref = argv[++i];
    else if (argv[i] === "--note") o.note = argv[++i];
  }
  return o;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const task = HALLWAY_SECTION_TASK(args.brief);
  const promptMethodId = "hallway-section-concept-revise.v0";
  mkdirSync(RUNS_DIR, { recursive: true });
  const seq = readdirSync(RUNS_DIR).filter((d) => /^\d{3}-/.test(d)).length + 1;
  const runId = `${String(seq).padStart(3, "0")}-concept-revise`;
  const dir = join(RUNS_DIR, runId);
  mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  const stages = [];
  const usage = { in: 0, out: 0, cost: 0 };
  const messages = [];
  const acc = (raw) => {
    const u = raw?.usage || {};
    usage.in += u.input_tokens || 0;
    usage.out += u.output_tokens || 0;
    usage.cost += raw?.total_cost_usd || 0;
  };
  const mark = (name, extra = {}) => {
    stages.push({ name, s: Math.round((Date.now() - t0) / 1000), ...extra });
    console.log(`  [${stages.at(-1).s}s] ${name}`, Object.keys(extra).length ? JSON.stringify(extra) : "");
  };
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  console.log(`hallway-section ${runId} — builder ${PHASE1_MODEL_ID}, judge ${JUDGE_MODEL_ID}`);

  // Stage 0 — concept art (the craft reference).
  let refPath, refMime;
  if (args.ref) {
    refPath = join(dir, "reference" + extname(args.ref));
    copyFileSync(args.ref, refPath);
    refMime = IMAGE_MIME[extname(args.ref).toLowerCase()] || "image/png";
  } else {
    const cp = conceptPrompt(task);
    writeFileSync(join(dir, "concept.prompt.txt"), cp + "\n");
    const img = await generateImage({ prompt: cp });
    refMime = img.mediaType;
    refPath = join(dir, "concept" + (img.mediaType === "image/jpeg" ? ".jpg" : ".png"));
    writeFileSync(refPath, Buffer.from(img.base64, "base64"));
    mark("0 concept", { model: img.model, ms: img.ms });
  }
  const ref = { data: readFileSync(refPath), mediaType: refMime };

  // Stage 1 — concept-grounded design doc.
  const ddPrompt = designDocPrompt(task);
  writeFileSync(join(dir, "design-doc.prompt.txt"), ddPrompt + "\n");
  const dd = await requestTextWithImage({ prompt: ddPrompt, images: [ref], model: PHASE1_MODEL_ID, onMessage: (m) => messages.push(m) });
  acc(dd.raw);
  writeFileSync(join(dir, "design-doc.md"), dd.text + "\n");
  mark("1 design doc", { chars: dd.text.length });

  // Stage 2 — high-res build.
  const bp = buildPrompt(task, { runId, promptMethodId, designDoc: dd.text });
  writeFileSync(join(dir, "build.prompt.txt"), bp + "\n");
  let res = await requestDesignArtifact({ prompt: bp, model: PHASE1_MODEL_ID, onMessage: (m) => messages.push(m) });
  acc(res.raw);
  let artifact = res.artifact;
  writeFileSync(join(dir, "round-0.artifact.json"), JSON.stringify(artifact) + "\n");
  mark("2 build", { ops: artifact.placements?.length, outTok: res.raw?.usage?.output_tokens });

  // Stage 3 — render → revise against concept + render.
  await renderArtifact(artifact, { outPath: join(dir, "round-0.png"), view: task.view });
  const rp = revisePrompt(task, { runId, promptMethodId, designDoc: dd.text });
  writeFileSync(join(dir, "revise.prompt.txt"), rp + "\n");
  res = await requestDesignArtifactWithImage({
    prompt: rp,
    images: [ref, readFileSync(join(dir, "round-0.png"))],
    model: PHASE1_MODEL_ID,
    onMessage: (m) => messages.push(m),
  });
  acc(res.raw);
  artifact = res.artifact;
  writeFileSync(join(dir, "artifact.json"), JSON.stringify(artifact, null, 1) + "\n");
  mark("3 revise", { ops: artifact.placements?.length, outTok: res.raw?.usage?.output_tokens });

  // Final renders + judge.
  const r = await renderArtifact(artifact, { outPath: join(dir, "render.png"), view: task.view });
  await renderArtifact(artifact, { outPath: join(dir, "render-3q.png"), view: task.view3q });
  const r0 = await renderArtifact(JSON.parse(readFileSync(join(dir, "round-0.artifact.json"), "utf8")), { outPath: join(dir, "round-0-3q.png"), view: task.view3q });
  mark("renders", { blocks: r.placed, unmapped: r.unmapped?.length ?? 0, round0Blocks: r0.placed });
  const score = await judgeRender({ imagePath: join(dir, "render.png"), brief: task.goal });
  const score0 = await judgeRender({ imagePath: join(dir, "round-0.png"), brief: task.goal });
  mark("judge", { final: score.overall, round0: score0.overall });

  const summary = {
    runId, date: new Date().toISOString().slice(0, 10), task: task.id, taskVersion: task.version, brief: task.brief,
    promptMethodId, model: PHASE1_MODEL_ID, judgeModel: JUDGE_MODEL_ID, view: task.view,
    blocks: r.placed, unmapped: r.unmapped?.length ?? 0, tokensIn: usage.in, tokensOut: usage.out, costUsd: usage.cost,
    durationMs: Date.now() - t0, stages, score, scoreRound0: score0, note: args.note,
  };
  writeFileSync(join(dir, "summary.json"), JSON.stringify(summary, null, 1) + "\n");
  writeFileSync(join(dir, "transcript.jsonl"), messages.map((m) => JSON.stringify(m)).join("\n") + "\n");
  console.log(`done ${runId}: ${r.placed} blocks, ${usage.out} out tok, $${usage.cost.toFixed(2)}, ${Math.round(summary.durationMs / 1000)}s — final ${score.overall} (round-0 ${score0.overall})`);
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
