// The temple-facade task (same goal, same reference photo) through the MODERN pipeline — every fix the session found:
//   0. concept = a Nano Banana 2.1 builder's reference sheet made FROM the reference photo (front elevation + 3/4)
//   1. design doc reads proportions/feature placement off the concept sheet (size from the concept, not a guess)
//   2. the build step SEES the concept image (no image→text→build telephone game)
//   3. matched-view critique: the build's front elevation + 3/4 (minecraft-design renderer) beside the concept
//   4. keep the better round (Opus pairwise against the concept)
// Then the classic frontal render + the classic judge, for comparison with runs 021/029/037/032.
//
//   MC_MODEL_ID=claude-sonnet-5-5 node benchmarks/temple-facade/modern.mjs --ref references/arc_de_triomph.JPG --effort high
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { requestDesignArtifactWithImage, requestTextWithImage } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";
import { generateImage } from "../../src/nano-banana.mjs";
import { expandArtifact } from "../../src/expand.mjs";
import { TEMPLE_FACADE_TASK } from "./task.mjs";
import { judgeRender } from "./judge.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", "..", "..", "minecraft-design");
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
const { Grid } = await import(join(PLUGIN, "tools", "src", "structure.mjs"));
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const refPath = arg("--ref", "references/arc_de_triomph.JPG"), effort = arg("--effort"), conceptIn = arg("--concept");
const PICKER = process.env.MC_PICK_MODEL_ID || "claude-opus-5-5";
const mime = (p) => (/\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png");
const img = (p) => ({ data: readFileSync(p), mediaType: mime(p) });

const task = TEMPLE_FACADE_TASK;
const seq = readdirSync(join(HERE, "runs")).filter((d) => /^\d{3}-/.test(d)).length + 1;
const tag = PHASE1_MODEL_ID.replace(/^claude-/, "").replace(/-\d.*$/, "");
const runId = `${String(seq).padStart(3, "0")}-modern-${tag}${effort ? "-" + effort : ""}`;
const dir = join(HERE, "runs", runId);
mkdirSync(dir, { recursive: true });
const t0 = Date.now(), usage = { out: 0, cost: 0 }, stages = [];
const acc = (raw) => { usage.out += raw?.usage?.output_tokens || 0; usage.cost += raw?.total_cost_usd || 0; };
const mark = (n, e = {}) => { stages.push({ n, s: Math.round((Date.now() - t0) / 1000), ...e }); console.log(`[${runId}] ${stages.at(-1).s}s ${n}`, JSON.stringify(e)); };
writeFileSync(join(dir, "reference" + extname(refPath)), readFileSync(refPath));

const FACADE_RULES = [
  "## Orientation & scale",
  "Facade FACES +Z, in the X–Y plane (X = width, Y = height, y = 0 ground). Front face at the highest Z; relief recedes",
  "into −Z. Width up to ~56, height up to ~48, relief up to ~24 deep — use the room. Front and its relief only.",
  "A facade is ONE connected plane: towers/columns are engaged relief, never detached pillars with sky between them.",
].join("\n");
const meta = [
  "## Required metadata (set EXACTLY)", `- metadata.trial_id = "${runId}"`, `- metadata.prompting_method_id = "temple-facade-modern.v0"`,
  `- metadata.model_id = "${PHASE1_MODEL_ID}"`, `- metadata.seed = ${task.seed}`, `- metadata.server_state_id = "${task.serverStateId}"`,
].join("\n");

// 0. concept sheet from the reference photo
let conceptPath;
if (conceptIn) { conceptPath = join(dir, "concept" + extname(conceptIn)); writeFileSync(conceptPath, readFileSync(conceptIn)); mark("concept (shared)"); }
else {
  const prompt = [
    "Minecraft builder reference sheet for ONE building FACADE, vanilla Minecraft blocks only, crisp voxel style, plain light background,",
    "no characters, no scene. Two views side by side: LEFT a straight-on FRONT ELEVATION (orthographic, no perspective); RIGHT a three-quarter",
    "view at the same scale showing the relief depth. Subject: the full-quality front facade of a TEMPLE whose CRAFT comes from the attached",
    "reference photograph — its proportions, massing, central arch, relief, attic and ornament — translated into Minecraft blocks.",
    "COLOUR comes from the brief, not the photo: a distinctive, COLOURFUL scheme (a dominant / supporting / accent harmony), never white or monochrome.",
    "Size: about 56 blocks wide, 48 tall, relief up to 24 deep. Skilled human builder quality: deep relief, framed openings, engaged columns,",
    "a full-width crowning attic, sub-block detail (stairs, slabs, walls, trapdoors).",
  ].join(" ");
  writeFileSync(join(dir, "concept.prompt.txt"), prompt + "\n");
  const r = await generateImage({ prompt, images: [{ base64: readFileSync(refPath).toString("base64"), mediaType: mime(refPath) }] });
  conceptPath = join(dir, r.mediaType === "image/jpeg" ? "concept.jpg" : "concept.png");
  writeFileSync(conceptPath, Buffer.from(r.base64, "base64"));
  mark("concept", { model: r.model });
}

// 1. design doc read off the concept sheet
const ddPrompt = [
  "You are a master Minecraft architect. Image 1 is a BUILDER'S REFERENCE SHEET for the facade you will build (front elevation left, 3/4 right);",
  "image 2 is the real building it was derived from. Write a DESIGN DOCUMENT that lets a builder reproduce the SHEET faithfully:",
  "1. Identity (one line). 2. Overall size in blocks, measured off the front elevation (width, height to the top of the attic, relief depth),",
  "scaled to fit ~56 wide × 48 tall. 3. The vertical zones bottom to top with their heights in blocks (plinth, main storey, impost line, arch,",
  "entablature, attic, crown). 4. The horizontal bays left to right with widths in blocks (piers, arch, side panels). 5. Every feature and where",
  "it sits (block coordinates relative to the facade's left edge and ground). 6. Palette by role exactly as the sheet shows it, with block ids.",
  "7. Depth plan: what projects and recesses, by how many blocks. Under ~500 words. Output ONLY the document.",
  "", "## Brief", task.goal,
].join("\n");
const dd = await requestTextWithImage({ prompt: ddPrompt, images: [img(conceptPath), img(refPath)], model: PHASE1_MODEL_ID, effort });
acc(dd.raw); writeFileSync(join(dir, "design-doc.md"), dd.text + "\n"); mark("doc");

// 2. build WITH the concept image
const buildPrompt = [
  "You are a master Minecraft architect. ATTACHED is the builder's reference sheet (front elevation left, 3/4 right). Build the facade it shows,",
  "matching its silhouette, proportions, zones, bays and feature placement as closely as blocks allow, using the design document's measurements.",
  "", "## Design document", dd.text, "", FACADE_RULES, "",
  "## Craft", "Deep relief; framed openings with reveals; use voxel `state` for stairs/slabs (mouldings, cornices); fill/box for masses, line for runs.",
  "", meta, "", "style.name = the document's identity; style.rationale = one line. Local origin at 0,0,0 (ground y = 0).",
].join("\n");
let res = await requestDesignArtifactWithImage({ prompt: buildPrompt, images: [img(conceptPath)], model: PHASE1_MODEL_ID, effort });
acc(res.raw); const r0 = res.artifact; writeFileSync(join(dir, "round-0.artifact.json"), JSON.stringify(r0) + "\n");
mark("build", { ops: r0.placements?.length });

// render helper: artifact -> nbt -> minecraft-design tiles -> matched composite [concept | front elevation | 3/4]
function matched(artifact, name) {
  const ex = expandArtifact(artifact); const list = Array.isArray(ex) ? ex : ex.voxels;
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const v of list) for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], v.pos[i]); mx[i] = Math.max(mx[i], v.pos[i]); }
  const g = new Grid([mx[0] - mn[0] + 1, mx[1] - mn[1] + 1, mx[2] - mn[2] + 1], { dataVersion: 3465 });
  for (const v of list) g.set(v.pos[0] - mn[0], v.pos[1] - mn[1], v.pos[2] - mn[2], v.block, v.state);
  const nbt = join(dir, `${name}.nbt`), tiles = join(dir, `${name}-tiles`);
  g.save(nbt);
  execFileSync("node", [MCD, "render", nbt, "--front", "s", "--out", join(dir, `${name}-sheet.png`), "--tiles", tiles], { stdio: "ignore" });
  const out = join(dir, `${name}-matched.png`);
  execFileSync("magick", ["(", conceptPath, "-resize", "x420", ")", "(", join(tiles, "front-elevation.png"), "-resize", "x420", ")",
    "(", join(tiles, "front-right.png"), "-resize", "x420", ")", "+append", out]);
  return out;
}

// 3. matched-view critique + revise
const m0 = matched(r0, "round-0");
const revPrompt = [
  "You are a master Minecraft architect making a SECOND pass. The attached image shows, left to right: the REFERENCE SHEET (front elevation +",
  "3/4), then YOUR BUILD's front elevation, then your build's 3/4 view (rendered from the game's real block models).",
  "First list, to yourself, the biggest mismatches between your build and the sheet — silhouette, zone heights, bay widths, the arch, the attic,",
  "relief depth, palette placement. Then fix them. Keep what already matches. Output ONE complete improved artifact (all placements).",
  "", "## Design document", dd.text, "", FACADE_RULES, "", meta,
].join("\n");
res = await requestDesignArtifactWithImage({ prompt: revPrompt, images: [img(m0)], model: PHASE1_MODEL_ID, effort });
acc(res.raw); const r1 = res.artifact; writeFileSync(join(dir, "round-1.artifact.json"), JSON.stringify(r1) + "\n");
mark("revise", { ops: r1.placements?.length });
const m1 = matched(r1, "round-1");

// 4. keep the better (pairwise, against the concept)
const pick = await requestTextWithImage({
  prompt: "Two builds of the same facade, each shown as [reference sheet | build front elevation | build 3/4]. Image 1 = build A, image 2 = build B. " +
    "Which build better matches the reference sheet AND is better crafted? Reply ONLY JSON: {\"better\": \"A\"|\"B\", \"why\": \"one sentence\"}",
  images: [img(m0), img(m1)], model: PICKER,
});
const pj = JSON.parse(pick.text.slice(pick.text.indexOf("{"), pick.text.lastIndexOf("}") + 1));
const kept = pj.better === "A" ? r0 : r1;
writeFileSync(join(dir, "artifact.json"), JSON.stringify(kept, null, 1) + "\n");
mark("keep-better", pj);

// classic frontal render + classic judge (comparable with the earlier runs)
const { renderArtifact } = await import("../../render/src/render-tool.mjs");
const rep = await renderArtifact(kept, { outPath: join(dir, "render.png"), view: task.view });
const score = await judgeRender({ imagePath: join(dir, "render.png"), brief: task.goal });
mark("judge", { overall: score.overall, detail: score.detail });
writeFileSync(join(dir, "summary.json"), JSON.stringify({ runId, approach: "modern", model: PHASE1_MODEL_ID, effort: effort ?? null, kept: pj.better === "A" ? "round-0" : "round-1",
  pick: pj, blocks: rep.placed, tokensOut: usage.out, costUsd: usage.cost, durationMs: Date.now() - t0, stages, score }, null, 1) + "\n");
console.log(`[${runId}] done: kept ${pj.better === "A" ? "round 0" : "round 1"}, ${rep.placed} blocks, $${usage.cost.toFixed(2)}, ${Math.round((Date.now() - t0) / 1000)}s, judge ${score.overall}/${score.detail}`);
