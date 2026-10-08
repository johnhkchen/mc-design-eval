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
  "shophouse-contract": {
    size: "exactly 12 wide × 12 deep, two storeys (eave at y = 9), roof ridge no higher than y = 13",
    brief: "A shophouse on a busy market street: three small open-fronted shop stalls on the ground floor, the " +
      "owners' home above. Charming, crafted, lived-in. It must work as the town's redstone shop: the stalls and " +
      "the machinery space behind them are fixed (see the contract) — design the building AROUND them.",
    contract: [
      "## Geometry and FUNCTION CONTRACT (hard — this building houses real redstone)",
      "- Footprint exactly 12 × 12: local x = 0..11 along the street, z = 0..11 from the STREET FRONT (z = 0, facing",
      "  −z) to the back. y = 0 is the ground slab at street level. Nothing outside 0 ≤ x ≤ 11, 0 ≤ z ≤ 11.",
      "- Ground storey y 1–4 is the machine's. Plan (x →, z ↓), legend below:",
      "    z0  W...W...W...",
      "    z1  W...W...W...",
      "    z2  WHHHW.H.WHHH",
      "    z3–z8 WRRRWRRRWRRR",
      "    z9  .BBBWRRRWBBB",
      "    z10 ....WRRRW...",
      "    z11 ....WRRRW...",
      "  W = stall walls: white_concrete, x = 0, 4, 8, y 1–4 (placed for you; do not change them).",
      "  B = stall backs: light_gray_stained_glass, y 1–4 (placed for you).",
      "  R = the redstone space, y 1–4: place NOTHING there — machinery fills it later.",
      "  H = hoppers in the floor slab (y = 0): place nothing at y 0–4 on those cells.",
      "  '.' at z 0–1 = the three open stall fronts / counters (x 1–3, 5–7, 9–11): keep them OPEN, y 1–4.",
      "  You may design freely: the ground-storey cells NOT listed (e.g. x 0–3 and 9–11 at z 10–11, the x = 11",
      "  edge... wherever the plan shows '.' outside the stall fronts), everything from y = 5 up, the roof.",
      "- Street clearance: nothing at z < 0 below y = 10 (the street needs 2 clear cells up to the eave). Every",
      "  street-facing cell of the front wall from y = 5 to the eave must be a block (windows = glass panes) — no",
      "  holes; depth on the upper front comes from the wall plane's own detail, not recesses of air.",
      "- Upper floor at y = 5; living quarters y 6–8; eave at y = 9; ridge ≤ 13.",
      "- Both side walls show above lower neighbours from about y = 5 up — finish them. The back faces a yard.",
      "- Use Minecraft 1.20.1 block ids. Every directional block needs its `state`.",
    ].join("\n"),
  },
  "old-west-saloon": {
    size: "about 14 wide (along the main street) × 16 deep, two storeys plus a tall false front, a boardwalk in front",
    brief: "An old west saloon on the dusty main street of a frontier town: a tall false-front facade with a painted " +
      "sign, swinging doors, a covered boardwalk porch on posts, a second-floor balcony with railings, hitching rails, " +
      "weathered timber. The liveliest building on the street.",
  },
  "nether-temple": {
    size: "about 21 wide × 21 deep, 3 stepped tiers plus a central spire (about 24 tall), on a platform over lava",
    brief: "A nether temple: a stepped blackstone ziggurat shrine in the Nether, approached by a grand stair over a lava " +
      "moat, flanked by basalt pillars with soul-fire braziers, gilded blackstone and gold trim, crimson and warped " +
      "accents, a central spire, carved polished-blackstone friezes, chains and lanterns. Ominous, ceremonial, crafted.",
  },
  "townhouse-row": {
    size: "three attached townhouses, each 6–7 wide (about 20 wide in total) × 10 deep, three storeys plus roof",
    brief: "A row of three narrow attached townhouses on a canal-side street: varied but clearly belonging " +
      "together — shared base line, cornice height and palette family, each with its own door, colour accent, " +
      "gable or roof shape.",
  },
};

const ENVELOPE = (s) => s.contract ? s.contract : [
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
  const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : undefined);
  const key = arg("--subject");
  const effort = arg("--effort");                 // low | medium | high | xhigh | max (claude -p --effort)
  const conceptIn = arg("--concept");             // reuse one concept image across runs (fair comparisons)
  const s = SUBJECTS[key];
  if (!s) throw new Error(`--subject one of ${Object.keys(SUBJECTS).join(", ")}`);
  const pm = "concept-build-free.v0";
  const modelTag = PHASE1_MODEL_ID.replace(/^claude-/, "").replace(/-\d.*$/, "");     // opus / sonnet / haiku
  const runId = `${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}-${key}-${modelTag}${effort ? `-effort-${effort}` : ""}`;
  const dir = join(HERE, "runs", runId);
  mkdirSync(dir, { recursive: true });
  const t0 = Date.now(), usage = { out: 0, cost: 0 }, stages = [];
  const acc = (raw) => { usage.out += raw?.usage?.output_tokens || 0; usage.cost += raw?.total_cost_usd || 0; };
  const mark = (n, e = {}) => { stages.push({ n, s: Math.round((Date.now() - t0) / 1000), ...e }); console.log(`[${key}] ${stages.at(-1).s}s ${n}`, JSON.stringify(e)); };
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const views = { fl: { azimuthDeg: 225, elevationDeg: 20 }, fr: { azimuthDeg: 135, elevationDeg: 20 } };

  let ref;
  if (conceptIn) {
    const mt = /\.jpe?g$/i.test(conceptIn) ? "image/jpeg" : "image/png";
    writeFileSync(join(dir, mt === "image/jpeg" ? "concept.jpg" : "concept.png"), readFileSync(conceptIn));
    ref = { data: readFileSync(conceptIn), mediaType: mt };
    mark("concept (shared)");
  } else {
    const img = await generateImage({ prompt: conceptPrompt(s) });
    const cpath = join(dir, img.mediaType === "image/jpeg" ? "concept.jpg" : "concept.png");
    writeFileSync(cpath, Buffer.from(img.base64, "base64"));
    ref = { data: readFileSync(cpath), mediaType: img.mediaType };
    mark("concept");
  }
  const dd = await requestTextWithImage({ prompt: designDocPrompt(s), images: [ref], model: PHASE1_MODEL_ID, effort });
  acc(dd.raw); writeFileSync(join(dir, "design-doc.md"), dd.text + "\n"); mark("doc");
  let res = await requestDesignArtifact({ prompt: buildPrompt(s, runId, pm, dd.text), model: PHASE1_MODEL_ID, effort });
  acc(res.raw); writeFileSync(join(dir, "round-0.artifact.json"), JSON.stringify(res.artifact) + "\n");
  mark("build", { ops: res.artifact.placements?.length });
  for (const [k, v] of Object.entries(views)) await renderArtifact(res.artifact, { outPath: join(dir, `round-0-${k}.png`), view: v });
  res = await requestDesignArtifactWithImage({
    prompt: revisePrompt(s, runId, pm, dd.text),
    images: [ref, readFileSync(join(dir, "round-0-fl.png")), readFileSync(join(dir, "round-0-fr.png"))],
    model: PHASE1_MODEL_ID,
    effort,
  });
  acc(res.raw); writeFileSync(join(dir, "round-1.artifact.json"), JSON.stringify(res.artifact) + "\n");
  mark("revise", { ops: res.artifact.placements?.length });
  for (const [k, v] of Object.entries(views)) await renderArtifact(res.artifact, { outPath: join(dir, `round-1-${k}.png`), view: v });
  writeFileSync(join(dir, "summary.json"), JSON.stringify({ runId, subject: key, model: PHASE1_MODEL_ID, effort: effort ?? null, conceptShared: !!conceptIn, tokensOut: usage.out, costUsd: usage.cost, durationMs: Date.now() - t0, stages }, null, 1) + "\n");
  console.log(`[${key}] done: $${usage.cost.toFixed(2)}, ${Math.round((Date.now() - t0) / 1000)}s`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
