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
import {
  requestDesignArtifact,
  requestDesignArtifactWithImage,
  requestText,
} from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";
import { judgeRender } from "./judge.mjs";

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

// Revision prompt for the multimodal approach: the model sees a head-on render of its
// own facade and re-emits an IMPROVED, complete artifact. Targets the recurring
// weaknesses (proportion, blockiness, relief depth, color balance).
function composeRevisionPrompt(task, { promptMethodId, runId }) {
  return [
    "You are a master Minecraft architect refining your own work. ATTACHED is a head-on",
    "render of the temple facade you just designed. Study it critically, then produce an",
    "IMPROVED, COMPLETE redesign — emit the WHOLE facade artifact again, better.",
    "",
    "## What to build",
    task.goal,
    "",
    "## Improve specifically (judge from the render)",
    "- Proportion & rhythm: fix awkward proportions, uneven bays, a squat or spindly look.",
    "- Detail & relief: add depth and articulation where it reads flat or crude; strengthen the",
    "  base, the crowning element, the openings, and the mouldings.",
    "- Smooth the geometry: replace clumsy uniform 45° steps with varied slab+stair pitches and",
    "  stepped curves/arches; use voxel block `state` for cleaner trim.",
    "- Color & material: keep a bold, characterful palette; improve balance and contrast; do not",
    "  drift toward monochrome.",
    "- Fix anything in the render that looks broken, floating, misaligned, or unintentional.",
    "",
    "## Orientation (unchanged)",
    "Facade FACES +Z, in the X–Y plane (X = width, Y = height, y = 0 ground), relief depth into",
    "−Z, front face at the highest Z. Model only the front and its relief.",
    "",
    "## Scale",
    "- Up to ~32 wide (X), ~24 tall (Y), depth ~4–6 (into −Z).",
    "",
    "## Materials",
    "Any survival-obtainable Minecraft 1.20.1 blocks; declare those you place in palette.manifest.",
    "",
    "## Required metadata (set EXACTLY)",
    `- metadata.trial_id = "${runId}"`,
    `- metadata.prompting_method_id = "${promptMethodId}"`,
    `- metadata.model_id = "${PHASE1_MODEL_ID}"`,
    `- metadata.seed = ${task.seed}`,
    `- metadata.server_state_id = "${task.serverStateId}"`,
    "",
    "## Style record",
    "Keep or refine your chosen style; set style.name to your label and style.rationale to a",
    "short note on what you improved.",
    "",
    "## Output (critical)",
    "Emit ONE complete design artifact for the IMPROVED facade — the full set of placements, not",
    "a diff. Local origin at x = 0, y = 0, z = 0; ground at y = 0.",
  ].join("\n");
}

// Design-doc-first prompts (v2). Stage 1 produces a finalized DESIGN DOCUMENT as plain
// text (grounded reasoning + a color-theory palette); stage 2 builds the facade from it.
// Hypothesis: grounding the design before generating raises quality vs shooting straight
// into block placement.
function composeDesignDocPrompt(task) {
  return [
    "You are a master architect and worldbuilder. BEFORE building anything, write a tight",
    "DESIGN DOCUMENT for a TEMPLE FACADE, grounded in real architectural reasoning — the kind a",
    "thoughtful designer writes to justify every choice. Output ONLY the document (markdown); no",
    "block list, JSON, or build yet.",
    "",
    "## Subject",
    task.goal,
    "",
    "## Cover each, concisely and with REASONS (not just adjectives)",
    "1. **Lore & setting** — the culture/era/tradition (real or invented), the deity or purpose",
    "   the temple serves, and the climate/landscape it sits in.",
    "2. **Aesthetic & architectural logic** — the architectural language (forms, order, silhouette)",
    "   AND why a temple of this tradition looks this way: ritual function, available materials,",
    "   structural logic, climate. Ground the look in reasons, not taste alone.",
    "3. **Color palette (apply color theory)** — choose 3–5 colors: a dominant, 1–2 supporting, and",
    "   a sparing accent. Name the harmony (analogous / complementary / triadic) and WHY it suits",
    "   the lore. Map each to a concrete Minecraft block. Avoid over-saturation and 'rainbow'",
    "   palettes — restraint and hierarchy over many hues.",
    "4. **Motifs & ornament** — 2–3 recurring motifs and where they appear.",
    "5. **Architectural features & proportion** — base, supports (columns/piers), entablature/",
    "   cornice, crowning element, entrance, windows/niches; and the key proportion ratios.",
    "",
    "FINALIZE the document — firm decisions, no open options. Keep it under ~400 words.",
  ].join("\n");
}

function composeBuildFromDocPrompt(task, { promptMethodId, runId, designDoc }) {
  return [
    "You are a master Minecraft architect. Below is your FINALIZED design document for a temple",
    "facade. Build the facade as a structured design artifact that FAITHFULLY realizes the",
    "document — its style, color scheme, motifs, features, and proportion. Commit fully to the",
    "document's decisions; do not water them down.",
    "",
    "## Finalized design document",
    designDoc,
    "",
    "## Orientation (critical — photographed head-on)",
    "The facade FACES +Z (toward the camera). Build it in the X–Y plane (X = width, Y = height,",
    "y = 0 ground), relief depth into −Z, front face at the highest Z. Model only the front and",
    "its relief — no back, sides, interior, or roof.",
    "",
    "## Realize the document with craft",
    "- Build every architectural feature the document specifies; honor its proportion ratios.",
    "- Use the document's color palette as the material scheme (dominant / supporting / accent).",
    "- Give openings real depth; avoid uniform 45° slopes (vary pitch with slab+stair combos;",
    "  approximate curves/arches with stepped stairs+slabs); use voxel block `state` for trim.",
    "",
    "## Scale",
    "- Width up to ~32 (X), height up to ~24 (Y), relief depth ~4–6 (into −Z).",
    "",
    "## Materials",
    "Survival-obtainable Minecraft 1.20.1 blocks — primarily the document's palette. Declare the",
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
    "Set style.name to the document's style label and style.rationale to one line tying the build",
    "to the document.",
    "",
    "Local origin at x = 0, y = 0, z = 0 (ground at y = 0).",
  ].join("\n");
}

// Identity-preserving revision (v3): tighten geometry/proportion from a render WITHOUT
// going bland — explicitly honor the design document's style/palette/motifs. Tests whether
// grounding (P4) survives a self-critique pass (P3, which otherwise drifts to convention).
function composeDocRevisionPrompt(task, { promptMethodId, runId, designDoc }) {
  return [
    "You are a master Minecraft architect refining your own work. ATTACHED is a head-on render",
    "of the temple facade you built from the design document below. Improve it — but STAY TRUE to",
    "the document: keep its style, color palette, motifs, and concept. Do NOT genericize the",
    "colors, simplify to a conventional look, or abandon the identity. Refine, do not replace.",
    "",
    "## Your design document (honor it)",
    designDoc,
    "",
    "## Improve specifically (judge from the render)",
    "- Proportion & rhythm: fix awkward proportions and uneven bays, per the document's ratios.",
    "- Geometry: replace clumsy uniform 45° steps with varied slab+stair pitches; make the iwan /",
    "  arches read as real (stepped) arches, not flat panels; clean misaligned blocks.",
    "- Relief & depth: deepen the portal and niches; strengthen the cornice, cresting, and base.",
    "- Color: keep the document's palette and its dominant/supporting/accent hierarchy; if",
    "  anything, sharpen the contrast — do NOT drift toward monochrome or convention.",
    "- Fix anything broken, floating, or unintentional.",
    "",
    "## Orientation (unchanged)",
    "Facade FACES +Z, X–Y plane (X = width, Y = height, y = 0 ground), relief into −Z, front face",
    "at the highest Z. Model only the front and its relief.",
    "",
    "## Scale",
    "- Up to ~32 wide (X), ~24 tall (Y), depth ~4–6 (into −Z).",
    "",
    "## Materials",
    "Primarily the document's palette; declare the blocks you place in palette.manifest.",
    "",
    "## Required metadata (set EXACTLY)",
    `- metadata.trial_id = "${runId}"`,
    `- metadata.prompting_method_id = "${promptMethodId}"`,
    `- metadata.model_id = "${PHASE1_MODEL_ID}"`,
    `- metadata.seed = ${task.seed}`,
    `- metadata.server_state_id = "${task.serverStateId}"`,
    "",
    "## Style record",
    "Keep style.name as the document's style; set style.rationale to one line on what you tightened.",
    "",
    "## Output (critical)",
    "Emit ONE complete design artifact for the IMPROVED facade — full placements, not a diff.",
    "Local origin x = 0, y = 0, z = 0; ground y = 0.",
  ].join("\n");
}

// High-resolution build (v4): same design-doc, but LIFT the scale/relief caps that every
// prior run hit exactly (depth pinned at 4–6) and REQUIRE deep relief + a proportioned
// crown — testing whether the "shallow relief / awkward crown" ceiling was self-inflicted.
function composeHighResBuildPrompt(task, { promptMethodId, runId, designDoc }) {
  return [
    "You are a master Minecraft architect. Below is your FINALIZED design document for a temple",
    "facade. Build it as a structured design artifact that faithfully realizes the document, at",
    "GENEROUS SCALE and with DEEP RELIEF. Earlier facades were too small and too flat — do not",
    "repeat that; use the room you are given.",
    "",
    "## Finalized design document",
    designDoc,
    "",
    "## Orientation (photographed head-on)",
    "Facade FACES +Z, in the X–Y plane (X = width, Y = height, y = 0 ground). Front face at the",
    "highest Z; relief recedes into −Z. Model only the front and its relief.",
    "",
    "## Scale & RELIEF — use it (this is judged)",
    "- Width up to ~48 (X), height up to ~40 (Y) including the crown. Build big.",
    "- DEEP relief: up to ~16 blocks of depth into −Z, and genuinely use it. Columns/buttresses",
    "  project several blocks PROUD of the wall; the central portal RECESSES several blocks deep;",
    "  cornices, string courses, and the crown step forward and back across MULTIPLE Z-layers. A",
    "  near-flat screen only 4–6 deep is a failure.",
    "- CROWN proportion: the crowning element (pediment / parapet / attic / cresting) must span the",
    "  facade's full width and have real height — a deliberate culmination of the body, never a",
    "  small cap perched on a wide base.",
    "",
    "## Realize the document with craft",
    "- Build every feature the document specifies; honor its proportion ratios and palette.",
    "- Frame openings with deep reveals; avoid uniform 45° slopes (vary pitch with slab+stair",
    "  combos; step curves/arches); use voxel block `state` for mouldings and trim.",
    "- Use `fill`/`box` for masses and `line` for shafts/edges to stay efficient at this scale.",
    "",
    "## Materials",
    "Primarily the document's palette; declare the blocks you place in palette.manifest.",
    "",
    "## Required metadata (set EXACTLY)",
    `- metadata.trial_id = "${runId}"`,
    `- metadata.prompting_method_id = "${promptMethodId}"`,
    `- metadata.model_id = "${PHASE1_MODEL_ID}"`,
    `- metadata.seed = ${task.seed}`,
    `- metadata.server_state_id = "${task.serverStateId}"`,
    "",
    "## Style record",
    "Set style.name to the document's style label and style.rationale to one line tying the build",
    "to the document.",
    "",
    "Local origin at x = 0, y = 0, z = 0 (ground at y = 0).",
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

  "v1-multimodal": async (task, ctx) => {
    const promptMethodId = "temple-facade-multimodal.v1";
    const REVISIONS = 1; // revision rounds after the initial draft (REVISIONS+1 calls)
    const messages = [];
    const roundImages = [];
    let sumIn = 0;
    let sumOut = 0;
    let sumCost = 0;
    const acc = (raw) => {
      const u = raw.usage || {};
      sumIn += u.input_tokens || 0;
      sumOut += u.output_tokens || 0;
      sumCost += raw.total_cost_usd || 0;
    };

    // Round 0 — initial single-shot facade (text only).
    const initPrompt = composeFacadePrompt(task, { promptMethodId, runId: ctx.runId });
    writeFileSync(join(ctx.dir, "round-0.prompt.txt"), initPrompt + "\n");
    let res = await requestDesignArtifact({
      prompt: initPrompt,
      model: PHASE1_MODEL_ID,
      onMessage: (m) => messages.push(m),
    });
    acc(res.raw);
    let artifact = res.artifact;
    console.log(`  round 0 (draft): ${(artifact.placements ?? []).length} ops`);

    // Revision rounds — render the current facade head-on, feed it back, re-emit improved.
    for (let r = 1; r <= REVISIONS; r++) {
      const wipName = `round-${r - 1}.png`;
      await ctx.renderArtifact(artifact, { outPath: join(ctx.dir, wipName), view: task.view });
      roundImages.push(wipName);
      const revPrompt = composeRevisionPrompt(task, { promptMethodId, runId: ctx.runId, round: r });
      writeFileSync(join(ctx.dir, `round-${r}.prompt.txt`), revPrompt + "\n");
      res = await requestDesignArtifactWithImage({
        prompt: revPrompt,
        images: [readFileSync(join(ctx.dir, wipName))],
        model: PHASE1_MODEL_ID,
        onMessage: (m) => messages.push(m),
      });
      acc(res.raw);
      artifact = res.artifact;
      console.log(`  round ${r} (revised): ${(artifact.placements ?? []).length} ops`);
    }

    const raw = {
      subtype: "success",
      num_turns: REVISIONS + 1,
      usage: { input_tokens: sumIn, output_tokens: sumOut },
      total_cost_usd: sumCost,
    };
    return {
      artifact,
      raw,
      messages,
      prompt: "(multimodal — see round-N.prompt.txt in this run dir)",
      promptMethodId,
      roundImages,
    };
  },

  "v2-designdoc": async (task, ctx) => {
    const promptMethodId = "temple-facade-designdoc.v0";
    const messages = [];
    let sumIn = 0;
    let sumOut = 0;
    let sumCost = 0;
    const acc = (raw) => {
      const u = raw.usage || {};
      sumIn += u.input_tokens || 0;
      sumOut += u.output_tokens || 0;
      sumCost += raw.total_cost_usd || 0;
    };

    // Stage 1 — finalized design document (plain text, grounded reasoning + palette).
    const ddPrompt = composeDesignDocPrompt(task);
    writeFileSync(join(ctx.dir, "design-doc.prompt.txt"), ddPrompt + "\n");
    const dd = await requestText({ prompt: ddPrompt, model: PHASE1_MODEL_ID, onMessage: (m) => messages.push(m) });
    acc(dd.raw);
    writeFileSync(join(ctx.dir, "design-doc.md"), dd.text + "\n");
    console.log(`  stage 1 (design doc): ${dd.text.length} chars`);

    // Stage 2 — build the facade FROM the finalized document.
    const buildPrompt = composeBuildFromDocPrompt(task, {
      promptMethodId,
      runId: ctx.runId,
      designDoc: dd.text,
    });
    writeFileSync(join(ctx.dir, "build.prompt.txt"), buildPrompt + "\n");
    const res = await requestDesignArtifact({ prompt: buildPrompt, model: PHASE1_MODEL_ID, onMessage: (m) => messages.push(m) });
    acc(res.raw);
    console.log(`  stage 2 (build): ${(res.artifact.placements ?? []).length} ops`);

    const raw = {
      subtype: "success",
      num_turns: 2,
      usage: { input_tokens: sumIn, output_tokens: sumOut },
      total_cost_usd: sumCost,
    };
    return {
      artifact: res.artifact,
      raw,
      messages,
      prompt: "(design-doc-first — see design-doc.md + *.prompt.txt in this run dir)",
      promptMethodId,
    };
  },

  "v3-designdoc-revise": async (task, ctx) => {
    const promptMethodId = "temple-facade-designdoc-revise.v0";
    const messages = [];
    const roundImages = [];
    let sumIn = 0;
    let sumOut = 0;
    let sumCost = 0;
    const acc = (raw) => {
      const u = raw.usage || {};
      sumIn += u.input_tokens || 0;
      sumOut += u.output_tokens || 0;
      sumCost += raw.total_cost_usd || 0;
    };

    // Stage 1 — finalized design document.
    const ddPrompt = composeDesignDocPrompt(task);
    writeFileSync(join(ctx.dir, "design-doc.prompt.txt"), ddPrompt + "\n");
    const dd = await requestText({ prompt: ddPrompt, model: PHASE1_MODEL_ID, onMessage: (m) => messages.push(m) });
    acc(dd.raw);
    writeFileSync(join(ctx.dir, "design-doc.md"), dd.text + "\n");
    console.log(`  stage 1 (design doc): ${dd.text.length} chars`);

    // Stage 2 — build from the document.
    const buildPrompt = composeBuildFromDocPrompt(task, { promptMethodId, runId: ctx.runId, designDoc: dd.text });
    writeFileSync(join(ctx.dir, "build.prompt.txt"), buildPrompt + "\n");
    let res = await requestDesignArtifact({ prompt: buildPrompt, model: PHASE1_MODEL_ID, onMessage: (m) => messages.push(m) });
    acc(res.raw);
    let artifact = res.artifact;
    console.log(`  stage 2 (build): ${(artifact.placements ?? []).length} ops`);

    // Stage 3 — identity-preserving multimodal revision (render → see → tighten).
    const wipName = "round-0.png";
    await ctx.renderArtifact(artifact, { outPath: join(ctx.dir, wipName), view: task.view });
    roundImages.push(wipName);
    const revPrompt = composeDocRevisionPrompt(task, { promptMethodId, runId: ctx.runId, designDoc: dd.text });
    writeFileSync(join(ctx.dir, "revise.prompt.txt"), revPrompt + "\n");
    res = await requestDesignArtifactWithImage({
      prompt: revPrompt,
      images: [readFileSync(join(ctx.dir, wipName))],
      model: PHASE1_MODEL_ID,
      onMessage: (m) => messages.push(m),
    });
    acc(res.raw);
    artifact = res.artifact;
    console.log(`  stage 3 (revised): ${(artifact.placements ?? []).length} ops`);

    const raw = {
      subtype: "success",
      num_turns: 3,
      usage: { input_tokens: sumIn, output_tokens: sumOut },
      total_cost_usd: sumCost,
    };
    return {
      artifact,
      raw,
      messages,
      prompt: "(design-doc + identity-preserving revision — see design-doc.md + *.prompt.txt)",
      promptMethodId,
      roundImages,
    };
  },

  // Design-doc + HIGH-RESOLUTION build: the design-doc stage is identical to v2; only the
  // build prompt changes (caps lifted, deep relief + proportioned crown required). Isolates
  // the resolution variable — does lifting the self-inflicted caps dissolve the "ceiling"?
  "v4-designdoc-highres": async (task, ctx) => {
    const promptMethodId = "temple-facade-designdoc-highres.v0";
    const messages = [];
    let sumIn = 0;
    let sumOut = 0;
    let sumCost = 0;
    const acc = (raw) => {
      const u = raw.usage || {};
      sumIn += u.input_tokens || 0;
      sumOut += u.output_tokens || 0;
      sumCost += raw.total_cost_usd || 0;
    };

    const ddPrompt = composeDesignDocPrompt(task);
    writeFileSync(join(ctx.dir, "design-doc.prompt.txt"), ddPrompt + "\n");
    const dd = await requestText({ prompt: ddPrompt, model: PHASE1_MODEL_ID, onMessage: (m) => messages.push(m) });
    acc(dd.raw);
    writeFileSync(join(ctx.dir, "design-doc.md"), dd.text + "\n");
    console.log(`  stage 1 (design doc): ${dd.text.length} chars`);

    const buildPrompt = composeHighResBuildPrompt(task, { promptMethodId, runId: ctx.runId, designDoc: dd.text });
    writeFileSync(join(ctx.dir, "build.prompt.txt"), buildPrompt + "\n");
    const res = await requestDesignArtifact({ prompt: buildPrompt, model: PHASE1_MODEL_ID, onMessage: (m) => messages.push(m) });
    acc(res.raw);
    console.log(`  stage 2 (high-res build): ${(res.artifact.placements ?? []).length} ops`);

    const raw = {
      subtype: "success",
      num_turns: 2,
      usage: { input_tokens: sumIn, output_tokens: sumOut },
      total_cost_usd: sumCost,
    };
    return {
      artifact: res.artifact,
      raw,
      messages,
      prompt: "(design-doc → HIGH-RES build — see design-doc.md + build.prompt.txt)",
      promptMethodId,
    };
  },

  // Best-of-N (literature: for divergent/open-ended tasks, parallel sampling + a verifier
  // beats sequential refinement — Snell et al. 2408.03314). Sample K independent design-doc
  // candidates IN PARALLEL, judge each with the rubric, keep the best. Free on a flat-cost
  // plan; wall-clock stays ~1x within rate limits. allSettled so a rate-limited candidate
  // drops out instead of failing the run.
  "vN-bestof": async (task, ctx) => {
    const promptMethodId = "temple-facade-bestof.v0";
    const K = ctx.k || 4;
    const messages = [];

    const settled = await Promise.allSettled(
      Array.from({ length: K }, async (_, i) => {
        const m = [];
        const dd = await requestText({ prompt: composeDesignDocPrompt(task), model: PHASE1_MODEL_ID, onMessage: (x) => m.push(x) });
        const buildPrompt = composeBuildFromDocPrompt(task, { promptMethodId, runId: `${ctx.runId}-c${i}`, designDoc: dd.text });
        const res = await requestDesignArtifact({ prompt: buildPrompt, model: PHASE1_MODEL_ID, onMessage: (x) => m.push(x) });
        const cimg = join(ctx.dir, `cand-${i}.png`);
        await ctx.renderArtifact(res.artifact, { outPath: cimg, view: task.view });
        writeFileSync(join(ctx.dir, `cand-${i}.design-doc.md`), dd.text + "\n");
        const score = await judgeRender({ imagePath: cimg, brief: task.goal });
        return { i, artifact: res.artifact, score, m, raws: [dd.raw, res.raw], judgeUsage: score.usage };
      }),
    );

    const cands = settled.filter((s) => s.status === "fulfilled").map((s) => s.value);
    if (cands.length === 0) throw new Error("best-of-N: all candidates failed (rate limit?)");
    cands.sort((a, b) => b.score.overall - a.score.overall);
    const winner = cands[0];

    let sumIn = 0;
    let sumOut = 0;
    let sumCost = 0;
    for (const c of cands) {
      for (const r of c.raws) {
        const u = r.usage || {};
        sumIn += u.input_tokens || 0;
        sumOut += u.output_tokens || 0;
        sumCost += r.total_cost_usd || 0;
      }
      sumIn += c.judgeUsage.input_tokens;
      sumOut += c.judgeUsage.output_tokens;
      sumCost += c.judgeUsage.cost_usd;
      for (const x of c.m) messages.push(x);
    }

    const candScores = cands.map((c) => ({
      i: c.i,
      overall: c.score.overall,
      proportion: c.score.proportion,
      color: c.score.color,
      detail: c.score.detail,
      fidelity: c.score.fidelity,
    }));
    writeFileSync(join(ctx.dir, "candidates.json"), JSON.stringify(candScores, null, 2) + "\n");
    console.log(
      `  best-of-${K} (${cands.length} ok): overalls ${candScores.map((c) => c.overall).join(", ")} → ` +
        `winner cand-${winner.i} (${winner.score.overall})`,
    );

    const raw = {
      subtype: "success",
      num_turns: cands.length * 2,
      usage: { input_tokens: sumIn, output_tokens: sumOut },
      total_cost_usd: sumCost,
    };
    return {
      artifact: winner.artifact,
      raw,
      messages,
      prompt: "(best-of-N design-doc — see cand-*.png + candidates.json)",
      promptMethodId,
      bestof: { k: K, completed: cands.length, winner: winner.i, candScores },
    };
  },
};

function parseArgs(argv) {
  const out = { approach: "v0-facade", note: "", k: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--approach") out.approach = argv[++i];
    else if (argv[i] === "--note") out.note = argv[++i];
    else if (argv[i] === "--k") out.k = parseInt(argv[++i], 10);
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
  const dur = (ms) => (ms ? `${Math.round(ms / 1000)}s` : "—");
  const sc = (s) => (s.score && s.score.overall != null ? `${s.score.overall}` : "—");
  const table = [
    "| # | date | approach | score | blocks | tok in/out | $ | wall | note |",
    "|---|------|----------|-------|--------|-----------|---|------|------|",
    ...summaries.map(
      (s) =>
        `| ${s.seq} | ${s.date} | \`${s.approach}\` | ${sc(s)} | ${s.blocks} | ${s.tokensIn}/${s.tokensOut} | ${usd(s.costUsd)} | ${dur(s.durationMs)} | ${s.note || ""} |`,
    ),
  ].join("\n");

  const gallery = summaries
    .map(
      (s) =>
        `### ${String(s.seq).padStart(3, "0")} — \`${s.approach}\` · ${s.date}\n\n` +
        `![temple-facade run ${s.seq}](runs/${s.runId}/render.png)\n\n` +
        `score ${sc(s)}/5 · ${s.blocks} blocks · ${s.tokensIn}/${s.tokensOut} tok · ${usd(s.costUsd)}` +
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
  const { approach, note, k } = parseArgs(process.argv.slice(2));
  const startedAt = Date.now();
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
  const { artifact, raw, messages, prompt, promptMethodId, roundImages = [], bestof = null } =
    await run(TEMPLE_FACADE_TASK, { runId, dir, renderArtifact, k });

  // Frontal shot — the whole point of this benchmark (task.view).
  const report = await renderArtifact(artifact, {
    outPath: join(dir, "render.png"),
    view: TEMPLE_FACADE_TASK.view,
  });
  const sum = renderSummary(report);

  // Score the final render against the locked rubric (instrument + the best-of-N verifier).
  const score = await judgeRender({ imagePath: join(dir, "render.png"), brief: TEMPLE_FACADE_TASK.goal });
  console.log(
    `  judge[${score.rubric}] overall=${score.overall} ` +
      `(prop ${score.proportion} / color ${score.color} / detail ${score.detail} / fidelity ${score.fidelity})`,
  );

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
    // Tunable params, recorded per run for attribution. `claude -p` exposes no
    // --temperature (would need the metered API path); --effort is the available knob.
    temperature: null,
    effort: null,
    view: TEMPLE_FACADE_TASK.view,
    blocks: sum.placed,
    unmapped: sum.unmapped,
    bounds: sum.bounds,
    tokensIn: u.input_tokens ?? 0,
    tokensOut: u.output_tokens ?? 0,
    costUsd: raw.total_cost_usd ?? 0,
    durationMs: Date.now() - startedAt,
    score,
    roundImages,
    bestof,
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
