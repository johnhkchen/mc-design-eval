// COLLECTION BUILDER: many usable, good-at-a-glance builds, cheaply. The concept is INSPIRATION, not a fidelity target.
//   1. one builder session (Sonnet) designs and builds the whole building with the plugin's procedural tools (shape
//      brushes, roofs, detail treatments, ornaments), using the brief + the concept image for character
//   2. a glance judge (Opus) scores the renders 1-10 as a skilled builder would ("usable in a world? good at a glance?")
//      and names the 3 biggest fixes
//   3. below the bar: ONE revision session on those fixes, re-judged; keep the better
//   4. accepted builds go to collection/<name>.nbt with a card (render, score, cost)
//
//   node benchmarks/collection/build.mjs --charter <key> [--concept file] [--bar 7] [--model claude-sonnet-5-5]
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", "..", "..", "minecraft-design");
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const img = (p) => ({ data: readFileSync(p), mediaType: /\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png" });
const model = arg("--model", "claude-sonnet-5-5"), bar = Number(arg("--bar", 7)), key = arg("--charter");

const { BUILDINGS, STYLE, SCALE } = await import("../charter-row/row.mjs");
const b = BUILDINGS[key];
if (!b) throw new Error(`--charter one of ${Object.keys(BUILDINGS).join(", ")}`);
const runId = `${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}-${key}`;
const dir = join(HERE, "runs", runId);
mkdirSync(dir, { recursive: true });
const conceptSrc = arg("--concept", join(HERE, "..", "charter-row", "concepts", key, "cx-c1.png"));
if (existsSync(conceptSrc)) execFileSync("magick", [conceptSrc, "-resize", "1600x1600>", "-quality", "92", join(dir, "concept.jpg")]);
const t0 = Date.now(); let cost = 0; const log = [];
const mark = (n, e = {}) => { log.push({ n, s: Math.round((Date.now() - t0) / 1000), ...e }); console.log(`[${key}] ${log.at(-1).s}s ${n}`, JSON.stringify(e)); };

const brief = [
  `BUILD: ${b.name}, a building in Charter Row. ${b.what}.`,
  `District: ${STYLE.read} ${STYLE.concord} ${STYLE.operator}${b.funding ? " " + STYLE.have_nots : ""}`,
  `SIZE: about ${b.size.w} wide (along the street, x), ${b.size.d} deep, ${b.size.h} tall; ${SCALE}`,
].join("\n");

const builderPrompt = (task) => [
  "Load and follow the minecraft-design skill. " + task,
  "", brief, "",
  existsSync(join(dir, "concept.jpg")) ? "concept.jpg is CONCEPT ART for inspiration: take its character, massing, palette and a few signature features. It is not a blueprint: " +
    "do NOT copy it cell by cell, and simplify freely so the build reads well at its real size." : "",
  "Goal: a build a skilled player would be glad to place in their world: clear massing, a proper roof, depth (things proud and recessed),",
  "framed openings, a readable entrance, crafted edges, and enough detail to look finished at a glance, without noise.",
  "Use the toolkit (MCD=\"node " + MCD + "\"): author it as code (mcd new build.mjs), the build library's shape brushes for arches/towers/setbacks,",
  "`mcd roof` for the roof (references/roofs.md), and `mcd paint` treatments for finish (references/detail-language.md: cornice, coping, plinth,",
  "sills, lintels, frames, quoins, railing, finial, louvres, brackets, lanterns, weather, vary). The front faces NORTH (-z); x runs along the street.",
  "Render with `$MCD render <file> --front n --tiles <dir>` (MCD_TILE_SCALE=2 for detail) and LOOK at street.png, front-left.png and front-elevation.png;",
  "fix what reads badly. Keep it within the size. Save the final as build.nbt. Report in <=5 lines.",
].filter(Boolean).join("\n");

function runAgent(prompt, label) {
  const r = spawnSync("claude", ["-p", "--plugin-dir", PLUGIN, "--model", model, "--effort", "high", "--allowedTools", "Bash Read Write Edit Glob Grep",
    "--output-format", "json", prompt], { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  let o = {}; try { o = JSON.parse(r.stdout); } catch { o = { result: (r.stdout || "").slice(0, 1500) }; }
  cost += o.total_cost_usd || 0;
  mark(label, { turns: o.num_turns, cost: o.total_cost_usd });
  return o.result || "";
}

function card(nbt, tag) {
  const tiles = join(dir, `${tag}-tiles`), out = join(dir, `${tag}-card.png`);
  execFileSync("node", [MCD, "render", nbt, "--front", "n", "--tiles", tiles, "--out", join(dir, `${tag}-sheet.png`)], { stdio: "ignore", env: { ...process.env, MCD_TILE_SCALE: "2" } });
  execFileSync("magick", ["(", "(", join(tiles, "street.png"), "-resize", "700x700", ")", "(", join(tiles, "front-left.png"), "-resize", "700x700", ")", "+append", ")",
    "(", "(", join(tiles, "front-right.png"), "-resize", "700x700", ")", "(", join(tiles, "front-elevation.png"), "-resize", "700x700", ")", "+append", ")", "-background", "white", "-append", out]);
  return out;
}

async function judge(cardPng) {
  const r = await requestTextWithImage({
    prompt: "You are a skilled Minecraft builder reviewing a build for a shared world (views: street at eye height, two 3/4 views, front elevation). " +
      `Brief: ${b.name}, ${b.what.split(";")[0]}. Score it 1-10 for how good and usable it is AT A GLANCE (massing, roof, depth, openings, finish, ` +
      "no noise or broken bits). 7 = good enough to use as-is; 9 = portfolio quality. Then name the 3 changes that would raise the score most. " +
      "Reply ONLY JSON: {\"score\": n, \"verdict\": \"one sentence\", \"fixes\": [\"...\", \"...\", \"...\"]}",
    images: [img(cardPng)], model: "claude-opus-5-5",
  });
  cost += r.raw?.total_cost_usd || 0;
  return JSON.parse(r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1));
}

// 1. build
writeFileSync(join(dir, "brief.txt"), brief + "\n");
const rep1 = runAgent(builderPrompt("Design and build this building."), "build");
if (!existsSync(join(dir, "build.nbt"))) throw new Error("builder produced no build.nbt");
copyFileSync(join(dir, "build.nbt"), join(dir, "v1.nbt"));
let best = { tag: "v1", j: await judge(card(join(dir, "v1.nbt"), "v1")) };
mark("judge v1", { score: best.j.score, verdict: best.j.verdict });
// 2. one revision if below the bar
if (best.j.score < bar) {
  const rep2 = runAgent(builderPrompt(`Improve the existing build (build.mjs / build.nbt in this directory). A reviewer scored it ${best.j.score}/10: "${best.j.verdict}". ` +
    `Make these changes: ${best.j.fixes.map((f, i) => `(${i + 1}) ${f}`).join(" ")} Keep what already works.`), "revise");
  if (existsSync(join(dir, "build.nbt"))) {
    copyFileSync(join(dir, "build.nbt"), join(dir, "v2.nbt"));
    const j2 = await judge(card(join(dir, "v2.nbt"), "v2"));
    mark("judge v2", { score: j2.score, verdict: j2.verdict });
    if (j2.score >= best.j.score) best = { tag: "v2", j: j2 };
  }
}
// 3. accept into the collection
const accepted = best.j.score >= bar;
const summary = { key, name: b.name, kept: best.tag, score: best.j.score, verdict: best.j.verdict, accepted, costUsd: +cost.toFixed(2), minutes: +((Date.now() - t0) / 60000).toFixed(1), log };
writeFileSync(join(dir, "summary.json"), JSON.stringify(summary, null, 1) + "\n");
if (accepted) {
  const coll = join(HERE, "accepted"); mkdirSync(coll, { recursive: true });
  copyFileSync(join(dir, `${best.tag}.nbt`), join(coll, `${key}.nbt`));
  copyFileSync(join(dir, `${best.tag}-card.png`), join(coll, `${key}.png`));
}
appendFileSync(join(HERE, "ledger.jsonl"), JSON.stringify({ t: new Date().toISOString(), runId, ...summary, log: undefined }) + "\n");
console.log(`[${key}] ${accepted ? "ACCEPTED" : "rejected"}: ${best.tag} ${best.j.score}/10, $${summary.costUsd}, ${summary.minutes} min`);
