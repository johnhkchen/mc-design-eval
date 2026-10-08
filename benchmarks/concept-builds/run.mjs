// Free CONCEPT BUILDS — the design-first pipeline with nothing imposed but a subject and a rough size: concept art →
// design doc → model-authored build → render (two 3/4 views) → revise. No reserve, no envelope from a generator.
// LIVE & METERED via the `claude -p` shim (+ one Gemini concept image). Runs in parallel safely (unique run ids).
//
//   node benchmarks/concept-builds/run.mjs --subject shophouse|corner-cafe|redstone-workshop|townhouse-row
//
// Both rounds are kept (the revise pass is a coin-flip); pick by eye afterwards.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requestDesignArtifact, requestDesignArtifactWithImage, requestTextWithImage } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";
import { generateImage } from "../../src/nano-banana.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const SUBJECTS = {
  "shophouse": {
    size: "about 12 wide (along the street) × 12 deep, two storeys plus roof",
    brief: "A shophouse on a busy market street in a market town: two small shops on the ground floor with " +
      "inviting shopfronts, the owners' home above. Charming, crafted, lived-in.",
  },
  "corner-cafe": {
    size: "about 14 × 14, on a street corner (fronts face −z AND −x), two to three storeys",
    brief: "A corner café and bakery where two market streets meet: a rounded or turreted corner, an outdoor " +
      "seating terrace, big windows, rooms to let above. The landmark building of its block.",
  },
  "redstone-workshop": {
    size: "about 16 wide × 14 deep, one tall storey plus a mezzanine/clerestory, roof",
    brief: "A redstone engineer's workshop in a market town: a handsome industrial-craft building that houses a " +
      "part-picking machine, with a big window or open bay where passers-by can watch it work, an operator's " +
      "office, chimneys or vents, signage. Workshop, not factory — proud of its machine.",
  },
  "townhouse-row": {
    size: "three attached townhouses, each 6–7 wide (about 20 wide in total) × 10 deep, three storeys plus roof",
    brief: "A row of three narrow attached townhouses on a canal-side street: varied but clearly belonging " +
      "together — shared base line, cornice height and palette family, each with its own door, colour accent, " +
      "gable or roof shape.",
  },
};

const ENVELOPE = (s) => [
  "## Geometry",
  `- Size: ${s.size}. The main street front faces −z (toward the viewer at the street); local z = 0 is the street`,
  "  front, z grows toward the back. x runs along the street. y = 0 is the ground slab at street level.",
  "- Finish every side a person in the street would see; the back can be simpler. Interior can stay hollow",
  "  except floors. A strip of sidewalk/street in front (z < 0) is allowed if the design wants it (≤ 3 deep).",
  "- Use Minecraft 1.20.1 block ids. Every directional block needs its `state` (facing/half/type/axis/shape).",
].join("\n");

const conceptPrompt = (s) => [
  "Concept art for a Minecraft build (voxel blocks, vanilla block palette, crisp and readable), three-quarter",
  "view from the street, skilled-human-builder showcase quality. Subject:", s.brief, "Size:", s.size + ".",
].join(" ");

const designDocPrompt = (s) => [
  "You are a master architect and Minecraft builder. ATTACHED is CONCEPT ART for this building. Write a DESIGN",
  "DOCUMENT that takes its CRAFT from the concept. Materials are diegetic: choose them for what this place and",
  "use would be built of, with reasons.",
  "", "## Subject", s.brief, "", ENVELOPE(s), "",
  "## Write — firm decisions with REASONS",
  "1. **Identity** — one line.",
  "2. **Palette by role** — dominant, supporting, accent; 3–6 blocks; named relationship.",
  "3. **Massing & roof** — the volumes, the roof forms and their edges.",
  "4. **Facade composition** — bays, openings, base / middle / top, what aligns with what.",
  "5. **Depth plan** — what projects, what recesses, by how much.",
  "6. **Detail & life** — shopfronts, signs, lights, plants, props.",
  "", "Under ~450 words. Output ONLY the document (markdown).",
].join("\n");

const meta = (runId, pm) => [
  "## Required metadata (set EXACTLY)",
  `- metadata.trial_id = "${runId}"`, `- metadata.prompting_method_id = "${pm}"`,
  `- metadata.model_id = "${PHASE1_MODEL_ID}"`, "- metadata.seed = 11", `- metadata.server_state_id = "concept-free.v1"`,
].join("\n");

const CRAFT = [
  "## Craft (this is judged, from the street)",
  "- Real massing: not one box — projecting bays, setbacks, roof forms that do something.",
  "- Depth: recesses and projections of 1–2 blocks; frames and dressings proud of the wall.",
  "- Sub-block detail: stairs (upside-down as brackets/cornices), slabs, trapdoors as shutters, walls/fences,",
  "  lanterns, chains, flower pots, banners, signs. `state` on every directional block.",
  "- Roofs with real edges (verges, eaves, ridges); nothing floats; every street-facing surface finished.",
  "- Use fill/box for masses, line for runs; repeat bays consistently.",
].join("\n");

const buildPrompt = (s, runId, pm, doc) => [
  "You are a master Minecraft architect. Below is your FINALIZED design document. Build it as a structured design",
  "artifact that realizes it with real craft. A box with holes punched in it is the failure to avoid.",
  "", "## Finalized design document", doc, "", ENVELOPE(s), "", CRAFT, "",
  "Declare every block in palette.manifest.", "", meta(runId, pm), "",
  "style.name = the document's identity; style.rationale = one line. Local origin at x = 0, y = 0, z = 0.",
].join("\n");

const revisePrompt = (s, runId, pm, doc) => [
  "You are a master Minecraft architect making a SECOND, improving pass on your own building. Attached: (1) the",
  "CONCEPT ART, (2) a render of your CURRENT build from the front-left, (3) from the front-right.",
  "", "## Your finalized design document (honor it)", doc, "",
  "## Improve — as a person in the street would see it",
  "- Where does it read flat, boxy or unfinished? Fix that first (depth, edges, roof, the largest plain surface).",
  "- Does the ground floor invite you in? Is the roofline resolved? Are side faces finished?",
  "- No noise texture or clutter; keep the palette hierarchy; keep repeated bays consistent.",
  "- If the current build is already strong somewhere, KEEP it — improve, don't redesign.",
  "", ENVELOPE(s), "", meta(runId, pm), "",
  "## Output (critical)", "Emit ONE complete improved design artifact — the full set of placements, not a diff.",
].join("\n");

async function main() {
  const key = process.argv[process.argv.indexOf("--subject") + 1];
  const s = SUBJECTS[key];
  if (!s) throw new Error(`--subject one of ${Object.keys(SUBJECTS).join(", ")}`);
  const pm = "concept-build-free.v0";
  const runId = `${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}-${key}`;
  const dir = join(HERE, "runs", runId);
  mkdirSync(dir, { recursive: true });
  const t0 = Date.now(), usage = { out: 0, cost: 0 }, stages = [];
  const acc = (raw) => { usage.out += raw?.usage?.output_tokens || 0; usage.cost += raw?.total_cost_usd || 0; };
  const mark = (n, e = {}) => { stages.push({ n, s: Math.round((Date.now() - t0) / 1000), ...e }); console.log(`[${key}] ${stages.at(-1).s}s ${n}`, JSON.stringify(e)); };
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const views = { fl: { azimuthDeg: 225, elevationDeg: 20 }, fr: { azimuthDeg: 135, elevationDeg: 20 } };

  const img = await generateImage({ prompt: conceptPrompt(s) });
  const cpath = join(dir, img.mediaType === "image/jpeg" ? "concept.jpg" : "concept.png");
  writeFileSync(cpath, Buffer.from(img.base64, "base64"));
  const ref = { data: readFileSync(cpath), mediaType: img.mediaType };
  mark("concept");
  const dd = await requestTextWithImage({ prompt: designDocPrompt(s), images: [ref], model: PHASE1_MODEL_ID });
  acc(dd.raw); writeFileSync(join(dir, "design-doc.md"), dd.text + "\n"); mark("doc");
  let res = await requestDesignArtifact({ prompt: buildPrompt(s, runId, pm, dd.text), model: PHASE1_MODEL_ID });
  acc(res.raw); writeFileSync(join(dir, "round-0.artifact.json"), JSON.stringify(res.artifact) + "\n");
  mark("build", { ops: res.artifact.placements?.length });
  for (const [k, v] of Object.entries(views)) await renderArtifact(res.artifact, { outPath: join(dir, `round-0-${k}.png`), view: v });
  res = await requestDesignArtifactWithImage({
    prompt: revisePrompt(s, runId, pm, dd.text),
    images: [ref, readFileSync(join(dir, "round-0-fl.png")), readFileSync(join(dir, "round-0-fr.png"))],
    model: PHASE1_MODEL_ID,
  });
  acc(res.raw); writeFileSync(join(dir, "round-1.artifact.json"), JSON.stringify(res.artifact) + "\n");
  mark("revise", { ops: res.artifact.placements?.length });
  for (const [k, v] of Object.entries(views)) await renderArtifact(res.artifact, { outPath: join(dir, `round-1-${k}.png`), view: v });
  writeFileSync(join(dir, "summary.json"), JSON.stringify({ runId, subject: key, model: PHASE1_MODEL_ID, tokensOut: usage.out, costUsd: usage.cost, durationMs: Date.now() - t0, stages }, null, 1) + "\n");
  console.log(`[${key}] done: $${usage.cost.toFixed(2)}, ${Math.round((Date.now() - t0) / 1000)}s`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
