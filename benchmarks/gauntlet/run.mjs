// The GAUNTLET: the combined pipeline — the modern harness's strengths (a reference-sheet concept, a spec measured off
// the sheet with an exact MATERIAL MAP, an external keep-the-better pick) + the minecraft-design plugin's agentic,
// code-authored build with matched-view self-critique.
//
//   MC_MODEL_ID=claude-sonnet-5-5 node benchmarks/gauntlet/run.mjs --subject grocery-store [--effort high]
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";
import { generateImage } from "../../src/nano-banana.mjs";
import { referenceSheetPrompt } from "../concept-builds/concept-bakeoff.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", "..", "..", "minecraft-design");
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
const PICKER = process.env.MC_PICK_MODEL_ID || "claude-opus-5-5";
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const key = arg("--subject"), effort = arg("--effort", "high");

export const SUBJECTS = {
  "grocery-store": {
    what: "a neighbourhood grocery store on a town street: a brick shopfront with big display windows, striped awnings, crates and baskets of produce on the sidewalk, a painted shop sign, a recessed entrance, an apartment with windows and flower boxes above, a parapet roofline with a cornice",
    size: "14 blocks wide along the street, 14 deep, two storeys plus parapet (about 12 tall)",
    palette: "red bricks (dominant), white trim in smooth quartz or calcite and dark oak shopfront frames (supporting), striped awnings, a green sign, colourful produce (melons, pumpkins, hay, flowers) (accent)",
  },
  "taj-mahal": {
    what: "the Taj Mahal: a white marble mausoleum on a square raised plinth, four slender minarets at the plinth corners, a great bulbous onion dome with a gold finial on a drum, four smaller domed chhatris around it, a tall pishtaq arch (iwan) recessed into each face with smaller stacked arches beside it, calligraphy bands framing the arches, inlaid decoration",
    size: "a 41 × 41 plinth; the mausoleum about 25 × 25; the dome top about 40 tall; minarets about 34 tall",
    palette: "smooth quartz and calcite (dominant), polished diorite and white terracotta (supporting), gold finials, dark inlay and calligraphy bands, a red-sandstone edge to the plinth (accent)",
  },
  "dance-hall": {
    what: "an art deco dance hall on a city street: a stepped symmetrical facade with tall vertical fins and setbacks, a big illuminated marquee sign over the entrance, a grand entrance under a canopy, tall stained-glass windows, a glimpse of the dance floor and chandeliers through glass, decorative zig-zag and sunburst motifs",
    size: "22 blocks wide along the street, 20 deep, about 16 tall at the central tower",
    palette: "smooth sandstone and white concrete (dominant), black and dark blue terracotta (supporting), gold, coloured stained glass, sea lanterns and glowstone for the marquee (accent)",
  },
};

const s = SUBJECTS[key];
if (!s) throw new Error(`--subject one of ${Object.keys(SUBJECTS).join(", ")}`);
const tag = PHASE1_MODEL_ID.replace(/^claude-/, "").replace(/-\d.*$/, "");
const runId = `${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}-${key}-${tag}-${effort}`;
const dir = join(HERE, "runs", runId);
mkdirSync(dir, { recursive: true });
const t0 = Date.now(), usage = { cost: 0 }, stages = [];
const mark = (n, e = {}) => { stages.push({ n, s: Math.round((Date.now() - t0) / 1000), ...e }); console.log(`[${key}] ${stages.at(-1).s}s ${n}`, JSON.stringify(e)); };
const img = (p) => ({ data: readFileSync(p), mediaType: /\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png" });

// 1. concept sheet
const conceptPrompt = referenceSheetPrompt(s);
writeFileSync(join(dir, "concept.prompt.txt"), conceptPrompt + "\n");
const c = await generateImage({ prompt: conceptPrompt });
const concept = join(dir, c.mediaType === "image/jpeg" ? "concept.jpg" : "concept.png");
writeFileSync(concept, Buffer.from(c.base64, "base64"));
mark("concept", { model: c.model });

// 2. spec measured off the sheet, with an exact material map
const specPrompt = [
  "You are a master Minecraft architect. ATTACHED is a builder's reference sheet (front elevation left, 3/4 right). Write a BUILD SPEC that",
  "lets another builder reproduce it faithfully. Use these sections:",
  "1. Identity (one line).",
  "2. Footprint and height in blocks (measure off the front elevation; respect the stated size).",
  "3. Vertical zones bottom to top with heights in blocks; horizontal bays left to right with widths in blocks; the roof/top form and its edges.",
  "4. MATERIAL MAP: a table mapping every distinct colour/texture region you can see on the sheet to an exact vanilla 1.20+ block id",
  "   (e.g. 'cream wall field → smooth_sandstone', 'gold trim → gold_block'), with where each region is. Match the sheet's materials, not generic ones.",
  "5. Features and where they sit (doors, windows, signs, ornaments, props), in block coordinates from the front-left ground corner.",
  "6. Depth plan: what projects and recesses, by how much.",
  `Stated subject: ${s.what}. Stated size: ${s.size}.`,
  "Under ~600 words. Output ONLY the spec (markdown).",
].join("\n");
const spec = await requestTextWithImage({ prompt: specPrompt, images: [img(concept)], model: PHASE1_MODEL_ID, effort });
usage.cost += spec.raw?.total_cost_usd || 0;
writeFileSync(join(dir, "spec.md"), spec.text + "\n");
mark("spec");

// 3. agentic build with the plugin (two rounds saved)
const agentPrompt = [
  "Load and follow the minecraft-design skill. Build the building shown in concept.jpg (left: front elevation, right: 3/4 view) as structure",
  "files in this directory, following spec.md (its sizes and its MATERIAL MAP are binding: use exactly those block ids for those regions).",
  "Geometry: the main front faces NORTH (−z); x runs along the street; y = 0 is the ground. Author it as code (mcd new build.mjs; design one bay,",
  "tile it, mirror for symmetry).",
  "ROUND 1: build, save round-1.nbt, then render: mcd render round-1.nbt --front n --tiles r1-tiles. Read r1-tiles/front-elevation.png and",
  "r1-tiles/front-left.png next to concept.jpg and list the biggest mismatches (silhouette, roof, zones, bays, openings, materials, depth).",
  "ROUND 2: fix them, save round-2.nbt, render it the same way (r2-tiles), and compare again.",
  "Keep BOTH files. Report in ≤8 lines: what you built, the mismatches you fixed, which round you think is better and why.",
].join(" ");
const agent = spawnSync("claude", ["-p", "--plugin-dir", PLUGIN, "--model", PHASE1_MODEL_ID, "--effort", effort,
  "--allowedTools", "Bash Read Write Edit Glob Grep", "--output-format", "json", agentPrompt], { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
// the agent's working dir is the run dir; copy concept/spec names it expects
let agentOut = {};
try { agentOut = JSON.parse(agent.stdout); } catch { agentOut = { result: agent.stdout?.slice(0, 2000), error: agent.stderr?.slice(0, 2000) }; }
usage.cost += agentOut.total_cost_usd || 0;
writeFileSync(join(dir, "agent-report.md"), (agentOut.result || "") + "\n");
mark("agentic build", { turns: agentOut.num_turns, cost: agentOut.total_cost_usd });

// 4. external keep-the-better on matched composites
const rounds = ["round-1", "round-2"].filter((r) => existsSync(join(dir, `${r}.nbt`)));
const composites = {};
for (const r of rounds) {
  const tiles = join(dir, `${r}-judge-tiles`);
  execFileSync("node", [MCD, "render", join(dir, `${r}.nbt`), "--front", "n", "--out", join(dir, `${r}-sheet.png`), "--tiles", tiles], { stdio: "ignore" });
  composites[r] = join(dir, `${r}-matched.png`);
  execFileSync("magick", ["(", concept, "-resize", "x420", ")", "(", join(tiles, "front-elevation.png"), "-resize", "x420", ")",
    "(", join(tiles, "front-left.png"), "-resize", "x420", ")", "+append", composites[r]]);
}
let kept = rounds.at(-1), why = "only one round";
if (rounds.length === 2) {
  const p = await requestTextWithImage({
    prompt: "Two builds of the same building, each shown as [reference sheet | build front elevation | build 3/4]. Image 1 = build A, image 2 = build B. " +
      "Which build better matches the reference sheet (form, roof, materials, details) AND is better crafted? Reply ONLY JSON: {\"better\": \"A\"|\"B\", \"why\": \"one sentence\"}",
    images: [img(composites["round-1"]), img(composites["round-2"])], model: PICKER,
  });
  usage.cost += p.raw?.total_cost_usd || 0;
  const j = JSON.parse(p.text.slice(p.text.indexOf("{"), p.text.lastIndexOf("}") + 1));
  kept = j.better === "A" ? "round-1" : "round-2"; why = j.why;
}
if (kept) { writeFileSync(join(dir, "final.nbt"), readFileSync(join(dir, `${kept}.nbt`))); }
mark("keep-better", { kept, why });
writeFileSync(join(dir, "summary.json"), JSON.stringify({ runId, subject: key, model: PHASE1_MODEL_ID, effort, kept, why, rounds, costUsd: usage.cost,
  durationMs: Date.now() - t0, stages }, null, 1) + "\n");
console.log(`[${key}] done: kept ${kept}, $${usage.cost.toFixed(2)}, ${Math.round((Date.now() - t0) / 1000)}s`);
