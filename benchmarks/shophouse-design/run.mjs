// Shophouse DESIGN-FIRST benchmark — the champion pipeline (concept → design doc → model-authored build → render
// → revise) on one real redshelf building's envelope: redshelf #66 (shophouse-m/gables). Same footprint, heights,
// shop bays and assigned materials as the procedural original, so the comparison is design craft, not colour.
// LIVE & METERED via the `claude -p` shim (+ one Gemini concept image).
//
//   node benchmarks/shophouse-design/run.mjs [--note "..."]
//
// Output: runs/NNN-*/round-0.artifact.json and artifact.json (the revise), 3/4 renders of both, design doc,
// concept. Both rounds are kept: the revise pass is a coin-flip (temple P14, hallway-section 001), so the
// better one is chosen by eye afterwards, on redshelf's own street-view sheet.
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requestDesignArtifact, requestDesignArtifactWithImage, requestTextWithImage } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";
import { generateImage } from "../../src/nano-banana.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");

const TASK = {
  id: "shophouse-design",
  seed: 11,
  serverStateId: "redshelf-66-envelope.v1",
  context:
    "A medium shophouse on a busy market street in a market town of terracotta, brick and stone shophouses " +
    "built shoulder to shoulder. Two small shops share the ground floor; the owners live upstairs. The town " +
    "assigned this house YELLOW TERRACOTTA walls and a MUD BRICK roof — keep those as the dominant materials.",
};

const ENVELOPE = [
  "## The envelope (fixed — this replaces a real building in a real street)",
  "- Footprint: exactly 12 × 12. Local x = 0..11 runs ALONG the street; local z = 0..11 runs from the STREET",
  "  FRONT (z = 0, the facade, facing −z toward the street) to the back (z = 11). y = 0 is the ground-floor slab",
  "  at street level; walls start at y = 1.",
  "- Nothing outside 0 ≤ x ≤ 11, 0 ≤ z ≤ 11 — the lot line is hard (the street needs 2 clear cells in front).",
  "  Depth on the facade comes from RECESSING into the footprint (recessed shopfronts, inset panels, reveals),",
  "  never from projecting past z = 0.",
  "- Ground storey y 1–4: TWO shop units side by side, each 6 wide (x 0–5 and x 6–11), each with a door and a",
  "  display window on the street. Upper floor at y = 5 (living quarters), windows on y 6–8. Eave at y = 9.",
  "- Roof: ridge no higher than y = 13. The town's version used a pair of front-facing gables (one per shop",
  "  bay); you may keep that or choose another roof form that suits the design.",
  "- The LEFT side (x = 0 face) is a party wall against a taller neighbour: keep it a plain solid wall.",
  "  The RIGHT side (x = 11 face) and the BACK (z = 11) are seen from the street and a yard — finish them.",
  "- Interior can stay hollow (floors at y = 0 and y = 5 only).",
  "- Use Minecraft 1.20.1 block ids. Every directional block needs its `state` (facing/half/type/axis).",
].join("\n");

function conceptPrompt() {
  return [
    "Concept art for a Minecraft build (voxel blocks, vanilla block palette, crisp and readable), three-quarter",
    "view from the street. Subject: a charming two-storey SHOPHOUSE, 12 blocks wide and 12 deep, two small shops",
    "on the ground floor with recessed shopfronts, doors and display windows, living quarters above with framed",
    "windows, a pair of front-facing gables (or another fitting roof), yellow terracotta walls and a mud-brick",
    "roof, with dressings, sills, a cornice, awnings or signs where they fit. Skilled-human-builder quality, in",
    "a lively market street. Context: " + TASK.context,
  ].join(" ");
}

function designDocPrompt() {
  return [
    "You are a master architect and Minecraft builder. ATTACHED is CONCEPT ART for this building. Write a DESIGN",
    "DOCUMENT for it that takes its CRAFT from the concept and fits the fixed envelope below exactly.",
    "Materials are diegetic: yellow terracotta walls and a mud-brick roof are given; choose the supporting and accent",
    "blocks for reasons (what a market-town builder would use for dressings, frames, shopfronts).",
    "",
    "## Context",
    TASK.context,
    "",
    ENVELOPE,
    "",
    "## Write — firm decisions with REASONS",
    "1. **Identity** — one line.",
    "2. **Palette by role** — dominant (given), supporting, accent; 3–5 blocks; named relationship.",
    "3. **Facade composition** — the two shop bays, the upper floor, the roofline: what aligns with what (piers",
    "   between bays, window rhythm over shop doors, base / middle / top).",
    "4. **Depth plan** — exactly what recesses and by how much (shopfronts, window reveals, panels) given the hard",
    "   lot line at z = 0.",
    "5. **Shopfronts** — doors, display windows, stall-risers, fascia/sign band, awnings (only within the lot).",
    "6. **Sides, back, roof** — how the right side and back are finished; roof form and its edges.",
    "",
    "Under ~400 words. Output ONLY the document (markdown).",
  ].join("\n");
}

const meta = (runId, pm) => [
  "## Required metadata (set EXACTLY)",
  `- metadata.trial_id = "${runId}"`,
  `- metadata.prompting_method_id = "${pm}"`,
  `- metadata.model_id = "${PHASE1_MODEL_ID}"`,
  `- metadata.seed = ${TASK.seed}`,
  `- metadata.server_state_id = "${TASK.serverStateId}"`,
].join("\n");

function buildPrompt(runId, pm, doc) {
  return [
    "You are a master Minecraft architect. Below is your FINALIZED design document for a shophouse. Build it as a",
    "structured design artifact that realizes the document with real craft. A flat box with holes punched in it",
    "is the failure this exercise exists to fix.",
    "",
    "## Finalized design document",
    doc,
    "",
    ENVELOPE,
    "",
    "## Craft (this is judged, from the street)",
    "- Depth: recess shopfronts and windows into the wall (a wall cell left out = a recess; last write wins, there",
    "  is no air op). Frames, piers and dressings stay on the facade plane so they read proud of the recesses.",
    "- Sub-block detail: stairs (upside-down as brackets/cornice), slabs, trapdoors as shutters, walls/fences,",
    "  signs-as-shapes, lanterns, flower pots. Use `state` for every directional block.",
    "- Roof: real edges (verge/eave courses), not a bare prism.",
    "- Every face the street sees is finished; nothing floats.",
    "- Use fill/box for masses, line for runs; keep both shop bays consistent.",
    "",
    "## Materials",
    "Yellow terracotta walls and mud-brick roof dominant; declare every block in palette.manifest.",
    "",
    meta(runId, pm),
    "",
    "style.name = the document's identity; style.rationale = one line.",
    "Local origin at x = 0, y = 0, z = 0.",
  ].join("\n");
}

function revisePrompt(runId, pm, doc) {
  return [
    "You are a master Minecraft architect making a SECOND, improving pass on your own building. Attached: (1) the",
    "CONCEPT ART, (2) a render of your CURRENT build from the street at the front-left, (3) from the front-right.",
    "",
    "## Your finalized design document (honor it)",
    doc,
    "",
    "## Improve — compare your build to the concept, as a person in the street would see it",
    "- Does it read as two inviting shops with a home above? Strengthen the shopfronts (frames, fascia, recess).",
    "- Where does it read flat or boxy? Add depth and edges there first. Treat the largest plain surface as unfinished.",
    "- Is the roofline resolved (edges, gable details)? Is the right side finished?",
    "- Don't add noise texture or clutter; keep the palette hierarchy; keep both bays consistent.",
    "- Keep EVERYTHING inside the envelope.",
    "",
    ENVELOPE,
    "",
    meta(runId, pm),
    "",
    "## Output (critical)",
    "Emit ONE complete improved design artifact — the full set of placements, not a diff. Local origin at 0,0,0.",
  ].join("\n");
}

async function main() {
  const note = process.argv.includes("--note") ? process.argv[process.argv.indexOf("--note") + 1] : "";
  const pm = "shophouse-design-concept-revise.v0";
  mkdirSync(RUNS_DIR, { recursive: true });
  const seq = readdirSync(RUNS_DIR).filter((d) => /^\d{3}-/.test(d)).length + 1;
  const runId = `${String(seq).padStart(3, "0")}-redshelf-66`;
  const dir = join(RUNS_DIR, runId);
  mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  const stages = [];
  const usage = { out: 0, cost: 0 };
  const acc = (raw) => { usage.out += raw?.usage?.output_tokens || 0; usage.cost += raw?.total_cost_usd || 0; };
  const mark = (name, extra = {}) => { stages.push({ name, s: Math.round((Date.now() - t0) / 1000), ...extra }); console.log(`  [${stages.at(-1).s}s] ${name}`, JSON.stringify(extra)); };
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const views = { fl: { azimuthDeg: 225, elevationDeg: 18 }, fr: { azimuthDeg: 135, elevationDeg: 18 } }; // front faces −z
  console.log(`shophouse-design ${runId} — builder ${PHASE1_MODEL_ID}`);

  const cp = conceptPrompt();
  writeFileSync(join(dir, "concept.prompt.txt"), cp + "\n");
  const img = await generateImage({ prompt: cp });
  const conceptPath = join(dir, img.mediaType === "image/jpeg" ? "concept.jpg" : "concept.png");
  writeFileSync(conceptPath, Buffer.from(img.base64, "base64"));
  const ref = { data: readFileSync(conceptPath), mediaType: img.mediaType };
  mark("0 concept", { ms: img.ms });

  const ddp = designDocPrompt();
  writeFileSync(join(dir, "design-doc.prompt.txt"), ddp + "\n");
  const dd = await requestTextWithImage({ prompt: ddp, images: [ref], model: PHASE1_MODEL_ID });
  acc(dd.raw);
  writeFileSync(join(dir, "design-doc.md"), dd.text + "\n");
  mark("1 design doc", { chars: dd.text.length });

  const bp = buildPrompt(runId, pm, dd.text);
  writeFileSync(join(dir, "build.prompt.txt"), bp + "\n");
  let res = await requestDesignArtifact({ prompt: bp, model: PHASE1_MODEL_ID });
  acc(res.raw);
  writeFileSync(join(dir, "round-0.artifact.json"), JSON.stringify(res.artifact) + "\n");
  mark("2 build", { ops: res.artifact.placements?.length });
  for (const [k, v] of Object.entries(views)) await renderArtifact(res.artifact, { outPath: join(dir, `round-0-${k}.png`), view: v });

  const rp = revisePrompt(runId, pm, dd.text);
  writeFileSync(join(dir, "revise.prompt.txt"), rp + "\n");
  res = await requestDesignArtifactWithImage({
    prompt: rp,
    images: [ref, readFileSync(join(dir, "round-0-fl.png")), readFileSync(join(dir, "round-0-fr.png"))],
    model: PHASE1_MODEL_ID,
  });
  acc(res.raw);
  writeFileSync(join(dir, "artifact.json"), JSON.stringify(res.artifact, null, 1) + "\n");
  mark("3 revise", { ops: res.artifact.placements?.length });
  for (const [k, v] of Object.entries(views)) await renderArtifact(res.artifact, { outPath: join(dir, `round-1-${k}.png`), view: v });

  const summary = { runId, model: PHASE1_MODEL_ID, context: TASK.context, tokensOut: usage.out, costUsd: usage.cost, durationMs: Date.now() - t0, stages, note };
  writeFileSync(join(dir, "summary.json"), JSON.stringify(summary, null, 1) + "\n");
  console.log(`done ${runId}: ${usage.out} out tok, $${usage.cost.toFixed(2)}, ${Math.round(summary.durationMs / 1000)}s`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
