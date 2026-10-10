// COLLECTION BUILDER: many usable, good-at-a-glance builds, cheaply. The concept is INSPIRATION, not a fidelity target.
//   1. one builder session (Sonnet) designs and builds the whole building with the plugin's procedural tools (shape
//      brushes, roofs, detail treatments, ornaments), using the brief + the concept image for character
//   2. a glance judge (Sonnet, BAML JudgeGlance) gives a CATEGORICAL verdict: Reject / NeedsWork / Usable / Showcase,
//      aspect grades and typed issues with fixes (never a 1-10 score)
//   3. delegated improvements: the judge's issues + the builder's own task list, each run by a small worker (Haiku)
//      and kept only if a close-up before/after review (BAML ReviewChange) says it improves the build; re-judged
//   4. Usable/Showcase builds go to accepted/<name>.nbt with a card (render, verdict, cost)
//
//   node benchmarks/collection/build.mjs --charter <key> [--concept file] [--model claude-sonnet-5-5] [--worker claude-haiku-5-5]
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import { renderTiles, VIEWS } from "./review.mjs";

// typed, categorical judgements through BAML (baml_src/collection.baml via baml-call.mts)
function baml(fn, args, { model, effort, parseOnly } = {}) {
  const r = spawnSync("npx", ["tsx", join(HERE, "baml-call.mts")], { input: JSON.stringify({ fn, args, model, effort, parseOnly }), encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`baml ${fn}: ${(r.stderr || "").slice(-400)}`);
  const o = JSON.parse(r.stdout);
  return { result: o.result, cost: o.cost || 0 };
}
const ACCEPT = new Set(["Usable", "Showcase"]);

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", "..", "..", "minecraft-design");
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const img = (p) => ({ data: readFileSync(p), mediaType: /\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png" });
const worker = arg("--worker", "claude-haiku-5-5");
const model = arg("--model", "claude-sonnet-5-5"), key = arg("--charter");

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
  "2. Build it as code (mcd new build.mjs) with the build library's shape brushes for arches/towers/setbacks. Build the ROOF with",
  "   `mcd roof --preset <cottage|shop|townhouse|civic|temple|granary|modern>` (references/roofs.md; flags override the preset),",
  "   never by placing roof blocks by hand.",
  "3. Finish with the craft brushes, from code (B.* / plaque(), signboard(), pilaster(), surround(), ...) or `mcd paint`",
  "   (references/detail-language.md and craft.md): plaque / signboard / bunting for names and signs, pilasters with a profile,",
  "   surround on openings, glazing on big glass, weather / vary PRESETS, fixtures for lanterns, planters, railing, finial,",
  "   louvres, brackets, cornice, coping, plinth, quoins. Prefer a brush to hand-placing every time.",
  "4. Inspect: `$MCD check build.nbt` (fix floating / unsupported / orphan blocks), `$MCD palette build.nbt` (fix every flag:",
  "   roof or trim too close to the walls, outlier materials). Render with closeups (`$MCD render <file> --front n --closeups",
  "   --tiles <dir>`, MCD_TILE_SCALE=2) and LOOK at all four sides (street.png, front-left.png, front-right.png,",
  "   back-elevation.png, left/right-elevation.png). Every side gets real openings and trim, not a blank wall. Check each element in elements.md",
  "   reads as itself. Fix what reads badly.",
  "5. Save the final as build.nbt, then write tasks.json: 6-12 SMALL, CHEAP improvement tasks that would raise it most, most visible first,",
  "   each delegated to a small worker model that only has the toolkit: [{\"title\":..., \"kind\": \"sign\"|\"banner\"|\"detail\"|\"props\"|\"roof\"|\"fix\",",
  "   \"where\": \"face / position in block coordinates\", \"instruction\": \"exactly what to make and with which tool (mcd paint rule, B.sign text,",
  "   B.banner colours/patterns, mcd roof spec change, a small edit to build.mjs)\"}]. Signs: give the exact text. Banners: colours and patterns.",
  "   Each task must be doable in a few minutes on its own. Be honest about what still needs polish.",
  "6. Write gaps.md: TOOLKIT GAPS you hit: what you had to place by hand, could not express with a tool, or where a tool's options or",
  "   defaults let you down (one line each: what you needed, which tool came closest). This decides which tools get built next.",
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
  const r = baml("JudgeGlance", [`${b.name}: ${b.what}`, { image: cardPng }], {});   // model from routes.json
  cost += r.cost;
  return r.result;
}
const RANK = { Reject: 0, NeedsWork: 1, Usable: 2, Showcase: 3 };
const fixesOf = (j) => (j.issues || []).map((i) => `[${i.severity} ${i.aspect}] ${i.problem} -> ${i.fix}`);

const { decodePng } = await import(join(PLUGIN, "tools", "src", "png.mjs"));
function closeups(before, after, wd) {
  return VIEWS.map((v) => {
    const a = decodePng(readFileSync(join(before, `${v}.png`))), c = decodePng(readFileSync(join(after, `${v}.png`)));
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
      const i = 4 * (y * a.width + x);
      if (Math.abs(a.rgba[i] - c.rgba[i]) + Math.abs(a.rgba[i + 1] - c.rgba[i + 1]) + Math.abs(a.rgba[i + 2] - c.rgba[i + 2]) > 30) { n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
    return { v, n, w: a.width, h: a.height, x0, y0, x1, y1 };
  }).filter((d) => d.n > 30).sort((p, q) => q.n - p.n).slice(0, 2).map((d) => {
    const pad = Math.round(Math.max(d.x1 - d.x0, d.y1 - d.y0) * 0.4) + 30;
    const cx = Math.max(0, d.x0 - pad), cy = Math.max(0, d.y0 - pad), cw = Math.min(d.w, d.x1 + pad) - cx, ch = Math.min(d.h, d.y1 + pad) - cy;
    const f = join(wd, `review-${d.v}.png`);
    execFileSync("magick", ["(", join(before, `${d.v}.png`), "-crop", `${cw}x${ch}+${cx}+${cy}`, "+repage", "-resize", "700x700", ")",
      "(", join(after, `${d.v}.png`), "-crop", `${cw}x${ch}+${cx}+${cy}`, "+repage", "-resize", "700x700", ")", "-background", "white", "-splice", "12x0", "+append", f]);
    return f;
  });
}

// 1. build
writeFileSync(join(dir, "brief.txt"), brief + "\n");
const rep1 = runAgent(builderPrompt("Design and build this building."), "build");
if (!existsSync(join(dir, "build.nbt"))) throw new Error("builder produced no build.nbt");
copyFileSync(join(dir, "build.nbt"), join(dir, "v1.nbt"));
let best = { tag: "v1", j: await judge(card(join(dir, "v1.nbt"), "v1")) };
writeFileSync(join(dir, "v1-judge.json"), JSON.stringify(best.j, null, 1) + "\n");
mark("judge v1", { usability: best.j.usability, roof: best.j.roof, summary: best.j.summary });
// 2. one revision if below the bar
// 2. delegated improvements: each task in tasks.json runs as its own small worker session (Haiku) on a copy of the
// current build; a close-up before/after review keeps or drops it. Cheap, parallel-safe, and nothing is one-shot.
let tasks = [];
if (existsSync(join(dir, "tasks.json"))) {
  const t = readFileSync(join(dir, "tasks.json"), "utf8");
  try { tasks = baml("ParseTasks", [t.trim().startsWith("[") ? `{"tasks": ${t}}` : t], { parseOnly: true }).result.tasks || []; } catch { tasks = []; }
}
// the glance judge's issues come first (they decide acceptance); the builder's own list follows, deduped by title
const fromJudge = (best.j.issues || []).map((i) => ({ title: i.problem.slice(0, 80), kind: i.aspect === "Roof" ? "Roof" : i.aspect === "Elements" ? "Props" : "Detail", aspect: i.aspect, where: "see problem", instruction: i.fix }));
tasks = [...fromJudge, ...tasks].filter((t, i, all) => all.findIndex((u) => u.title === t.title) === i).slice(0, 10);
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
    "Prefer the ready-made brushes (references/detail-language.md, craft.md: plaque, signboard, bunting, surround, pilasters, glazing,",
    "fixtures, planters, weather/vary presets, railing, finial, louvres, brackets; `mcd roof --preset` for roofs) to hand-placing blocks.",
    "Save the result as out.nbt, then run `$MCD diff in.nbt out.nbt --fail-empty --png diff.png` (a change nobody can see is not done) and",
    "`$MCD check out.nbt` (nothing floating). Look at diff.png; fix it if it does not read as intended. Reply with one line.",
  ].join("\n");
  runAgent(prompt, `task ${i + 1}: ${t.title.slice(0, 40)}`, worker, "medium", wd);
  if (!existsSync(join(wd, "out.nbt"))) { taskLog.push({ ...t, kept: false, verdict: "no-output" }); continue; }
  const tiles = renderTiles(join(wd, "out.nbt"), join(wd, "t"));
  const crops = closeups(curTiles, tiles, wd);
  if (!crops.length) { taskLog.push({ ...t, kept: false, verdict: "Neutral", why: "no pixels changed" }); continue; }
  const rv = baml("ReviewChange", [t.title, briefShort, { images: crops }], {});   // model from routes.json (Haiku)
  cost += rv.cost;
  const v = { verdict: rv.result.verdict, why: rv.result.why };
  const kept = v.verdict === "Improves";
  taskLog.push({ ...t, kept, verdict: v.verdict, why: v.why });
  mark(`  review ${i + 1}`, { kept, verdict: v.verdict });
  if (kept) { cur = join(wd, "out.nbt"); curTiles = tiles; }
}
writeFileSync(join(dir, "tasks-log.json"), JSON.stringify(taskLog, null, 1) + "\n");
if (taskLog.some((t) => t.kept)) {
  copyFileSync(cur, join(dir, "v2.nbt"));
  const j2 = await judge(card(join(dir, "v2.nbt"), "v2"));
  writeFileSync(join(dir, "v2-judge.json"), JSON.stringify(j2, null, 1) + "\n");
  mark("judge v2", { usability: j2.usability, roof: j2.roof, summary: j2.summary, tasksKept: taskLog.filter((t) => t.kept).length });
  if (RANK[j2.usability] >= RANK[best.j.usability]) best = { tag: "v2", j: j2 };
}
// 3. accept into the collection
const accepted = ACCEPT.has(best.j.usability);
const summary = { key, name: b.name, tasks: tasks.length, tasksKept: taskLog.filter((t) => t.kept).length, kept: best.tag, usability: best.j.usability, grades: { massing: best.j.massing, roof: best.j.roof, facades: best.j.facades, elements: best.j.elements, finish: best.j.finish, palette: best.j.palette }, summary: best.j.summary, accepted, costUsd: +cost.toFixed(2), minutes: +((Date.now() - t0) / 60000).toFixed(1), log };
writeFileSync(join(dir, "summary.json"), JSON.stringify(summary, null, 1) + "\n");
if (accepted) {
  const coll = join(HERE, "accepted"); mkdirSync(coll, { recursive: true });
  copyFileSync(join(dir, `${best.tag}.nbt`), join(coll, `${key}.nbt`));
  copyFileSync(join(dir, `${best.tag}-card.png`), join(coll, `${key}.png`));
}
// tool-gap intel: classify this run's shortfalls (Haiku) into the shared backlog
spawnSync("node", [join(HERE, "..", "intel", "gaps.mjs"), "collect", dir], { stdio: "inherit" });
appendFileSync(join(HERE, "ledger.jsonl"), JSON.stringify({ t: new Date().toISOString(), runId, ...summary, log: undefined }) + "\n");
console.log(`[${key}] ${accepted ? "ACCEPTED" : "not accepted"}: ${best.tag} ${best.j.usability}, $${summary.costUsd}, ${summary.minutes} min`);
