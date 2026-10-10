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
import { renderTiles, reviewChange } from "./review.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", "..", "..", "minecraft-design");
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const img = (p) => ({ data: readFileSync(p), mediaType: /\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png" });
const worker = arg("--worker", "claude-haiku-5-5");
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
  existsSync(join(dir, "concept.jpg")) ? "concept.jpg is CONCEPT ART for inspiration: take its character, massing, palette and its RECOGNISABLE ELEMENTS. It is not a " +
    "blueprint: simplify freely so the build reads well at its real size." : "",
  "THIS IS A BEST-EFFORT, FINISHED BUILD, not a rough pass. Work in this order:",
  "1. ELEMENT MAP (write it to elements.md before building): the 5-10 elements a viewer would recognise (from the brief and the concept), and for",
  "   each the REAL Minecraft thing it must be: banners are banner blocks with patterns (B.banner / `attach ... banner`), signs are signs with",
  "   text (B.sign), lanterns are lanterns, an awning is stairs/slabs/carpet in stripes, a flagpole is fences/bars plus a banner, flowers are",
  "   flowers in pots or on grass, barrels are barrels. Never substitute a coloured full block for an object.",
  "2. Build it as code (mcd new build.mjs) with the build library's shape brushes for arches/towers/setbacks. Build the ROOF with `mcd roof`",
  "   (references/roofs.md: choose style, pitch, eave, ridge, dormers, pediment, chimneys) rather than placing roof blocks by hand.",
  "3. Finish with `mcd paint` treatments (references/detail-language.md: cornice, coping, plinth, sills, lintels, frames, quoins, railing,",
  "   finial, louvres, brackets, lanterns, weather, vary).",
  "4. Render (`$MCD render <file> --front n --tiles <dir>`, MCD_TILE_SCALE=2) and LOOK at all four sides (street.png, front-left.png, front-right.png,",
  "   back-elevation.png, left/right-elevation.png). Every side gets real openings and trim, not a blank wall. Check each element in elements.md",
  "   reads as itself. Fix what reads badly.",
  "5. Save the final as build.nbt, then write tasks.json: 6-12 SMALL, CHEAP improvement tasks that would raise it most, most visible first,",
  "   each delegated to a small worker model that only has the toolkit: [{\"title\":..., \"kind\": \"sign\"|\"banner\"|\"detail\"|\"props\"|\"roof\"|\"fix\",",
  "   \"where\": \"face / position in block coordinates\", \"instruction\": \"exactly what to make and with which tool (mcd paint rule, B.sign text,",
  "   B.banner colours/patterns, mcd roof spec change, a small edit to build.mjs)\"}]. Signs: give the exact text. Banners: colours and patterns.",
  "   Each task must be doable in a few minutes on its own. Be honest about what still needs polish.",
  "Use the toolkit (MCD=\"node " + MCD + "\"). The front faces NORTH (-z); x runs along the street. Keep within the size. Report in <=5 lines.",
].filter(Boolean).join("\n");

function runAgent(prompt, label, m = model, effort = "high", cwd = dir) {
  const r = spawnSync("claude", ["-p", "--plugin-dir", PLUGIN, "--model", m, "--effort", effort, "--allowedTools", "Bash Read Write Edit Glob Grep",
    "--output-format", "json", prompt], { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  let o = {}; try { o = JSON.parse(r.stdout); } catch { o = { result: (r.stdout || "").slice(0, 1500) }; }
  cost += o.total_cost_usd || 0;
  mark(label, { turns: o.num_turns, cost: o.total_cost_usd });
  return o.result || "";
}

function card(nbt, tag) {
  const tiles = join(dir, `${tag}-tiles`), out = join(dir, `${tag}-card.png`);
  execFileSync("node", [MCD, "render", nbt, "--front", "n", "--tiles", tiles, "--out", join(dir, `${tag}-sheet.png`)], { stdio: "ignore", env: { ...process.env, MCD_TILE_SCALE: "2" } });
  execFileSync("magick", ["(", "(", join(tiles, "street.png"), "-resize", "700x700", ")", "(", join(tiles, "front-left.png"), "-resize", "700x700", ")", "+append", ")",
    "(", "(", join(tiles, "front-right.png"), "-resize", "700x700", ")", "(", join(tiles, "back-elevation.png"), "-resize", "700x700", ")", "+append", ")", "-background", "white", "-append", out]);
  return out;
}

async function judge(cardPng) {
  const r = await requestTextWithImage({
    prompt: "You are a skilled Minecraft builder reviewing a build for a shared world (views: street at eye height, two 3/4 views, back elevation). " +
      `Brief: ${b.name}, ${b.what.split(";")[0]}. Score it 1-10 for how good and usable it is AT A GLANCE (massing, roof, depth, openings, finish, ` +
      "no noise or broken bits; recognisable elements read as what they are, e.g. banners as banners). 7 = good enough to use as-is; 9 = portfolio quality. Then name the 3 changes that would raise the score most. " +
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
// 2. delegated improvements: each task in tasks.json runs as its own small worker session (Haiku) on a copy of the
// current build; a close-up before/after review keeps or drops it. Cheap, parallel-safe, and nothing is one-shot.
const tasks = existsSync(join(dir, "tasks.json")) ? (() => { const t = readFileSync(join(dir, "tasks.json"), "utf8"); try { return JSON.parse(t.slice(t.indexOf("["), t.lastIndexOf("]") + 1)); } catch { return []; } })() : [];
mark("tasks", { n: tasks.length });
let cur = join(dir, "v1.nbt"), curTiles = renderTiles(cur, join(dir, "t-cur-0")), taskLog = [];
const briefShort = `${b.name}, ${b.what.split(";")[0]}`;
for (const [i, t] of tasks.entries()) {
  const wd = join(dir, `task-${i + 1}`); mkdirSync(wd, { recursive: true });
  copyFileSync(cur, join(wd, "in.nbt"));
  if (existsSync(join(dir, "build.mjs"))) copyFileSync(join(dir, "build.mjs"), join(wd, "build.mjs"));
  const prompt = [
    "You are a worker making ONE small improvement to a finished Minecraft build (in.nbt in this directory; build.mjs is the generator that",
    "produced the main build, for reference). Use the minecraft-design toolkit: MCD=\"node " + MCD + "\" (mcd paint with the detail language,",
    "references/detail-language.md; mcd roof; or a short node script that loads in.nbt with the build library (" + join(PLUGIN, "tools", "src", "build.mjs") + ": load, B.sign,",
    "B.banner, ...) and saves). The front faces NORTH (-z). Do only this task, nothing else:",
    `TASK: ${t.title} (${t.kind}). WHERE: ${t.where}. HOW: ${t.instruction}`,
    "Save the result as out.nbt. Render it (`$MCD render out.nbt --front n --tiles t`, MCD_TILE_SCALE=2) and check the change reads as intended;",
    "fix it if not. Reply with one line.",
  ].join("\n");
  runAgent(prompt, `task ${i + 1}: ${t.title.slice(0, 40)}`, worker, "medium", wd);
  if (!existsSync(join(wd, "out.nbt"))) { taskLog.push({ ...t, kept: false, verdict: "no-output" }); continue; }
  const tiles = renderTiles(join(wd, "out.nbt"), join(wd, "t"));
  const v = await reviewChange({ before: curTiles, after: tiles, title: t.title, brief: briefShort, concept: existsSync(join(dir, "concept.jpg")) ? join(dir, "concept.jpg") : null, workDir: wd });
  cost += v.cost;
  const kept = v.verdict === "improves";
  taskLog.push({ ...t, kept, verdict: v.verdict, why: v.why });
  mark(`  review ${i + 1}`, { kept, verdict: v.verdict });
  if (kept) { cur = join(wd, "out.nbt"); curTiles = tiles; }
}
writeFileSync(join(dir, "tasks-log.json"), JSON.stringify(taskLog, null, 1) + "\n");
if (taskLog.some((t) => t.kept)) {
  copyFileSync(cur, join(dir, "v2.nbt"));
  const j2 = await judge(card(join(dir, "v2.nbt"), "v2"));
  mark("judge v2", { score: j2.score, verdict: j2.verdict, tasksKept: taskLog.filter((t) => t.kept).length });
  if (j2.score >= best.j.score) best = { tag: "v2", j: j2 };
}
// 3. accept into the collection
const accepted = best.j.score >= bar;
const summary = { key, name: b.name, tasks: tasks.length, tasksKept: taskLog.filter((t) => t.kept).length, kept: best.tag, score: best.j.score, verdict: best.j.verdict, accepted, costUsd: +cost.toFixed(2), minutes: +((Date.now() - t0) / 60000).toFixed(1), log };
writeFileSync(join(dir, "summary.json"), JSON.stringify(summary, null, 1) + "\n");
if (accepted) {
  const coll = join(HERE, "accepted"); mkdirSync(coll, { recursive: true });
  copyFileSync(join(dir, `${best.tag}.nbt`), join(coll, `${key}.nbt`));
  copyFileSync(join(dir, `${best.tag}-card.png`), join(coll, `${key}.png`));
}
appendFileSync(join(HERE, "ledger.jsonl"), JSON.stringify({ t: new Date().toISOString(), runId, ...summary, log: undefined }) + "\n");
console.log(`[${key}] ${accepted ? "ACCEPTED" : "rejected"}: ${best.tag} ${best.j.score}/10, $${summary.costUsd}, ${summary.minutes} min`);
