// Baseline: does Claude Code build better with the minecraft-design plugin than without? Both arms get the same Codex
// concept image and the same prompt (plugin arm only adds the skill sentence + --plugin-dir). Sessions run in parallel,
// each in a fresh dir; build.nbt is scored by the frozen glance judge (benchmarks/judges, judge.glance).
//   node benchmarks/plugin-baseline/run.mjs <subject>... | --all   [--arm stock,described,sized,plain,plugin] [--run <name>] [--budget 4]
//   node benchmarks/plugin-baseline/run.mjs --aggregate [--run <name>]     (rebuild results.json/results.md only)
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync, readdirSync, createWriteStream } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { SUBJECTS } from "../collection/subjects.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", "..", "..", "minecraft-design");
const JUDGES = new URL("../judges", import.meta.url).pathname; // the lab's judging instruments (BAML)
const MODEL = "claude-sonnet-5-5";
const SCALE = "1:1 scale, a player is 2 blocks tall (doors 2 tall, storeys 4)";
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const BUDGET = opt("--budget", "4");   // no --max-turns flag exists in this claude CLI; only --max-budget-usd
const RUN = opt("--run", "baseline-1");
const ARMS = opt("--arm") ? opt("--arm").split(",") : ["plain", "plugin"];
const ROOT = join(HERE, "runs", RUN);
const flagVals = new Set(["--arm", "--run", "--budget"]);
const pos = argv.filter((a, i) => !a.startsWith("--") && !flagVals.has(argv[i - 1]));
const keys = argv.includes("--all") ? Object.keys(SUBJECTS) : pos;

const briefOf = (s) => `BUILD: ${s.name}: ${s.what}.\nSIZE: about ${s.size.w} wide (front, x), ${s.size.d} deep, ${s.size.h} tall; ${SCALE}\n`;
const conceptFile = (key) => {
  const rows = readFileSync(join(HERE, "..", "..", "ledger", "images.jsonl"), "utf8").split("\n").filter((l) => l.includes(`"collection concept ${key}"`));
  return JSON.parse(rows.at(-1)).file;
};
// harness ladder (no image, no plugin): stock = the bare ask; described = + the subject's description; sized = + size,
// scale and orientation (plain = sized + the concept image)
const LADDER = { stock: (s) => `Make me a Minecraft .nbt file of a ${s.name.toLowerCase()}. Save it as ./build.nbt. Don't ask questions.`,
  described: (s) => `Make me a Minecraft .nbt file of ${s.what}. Save it as ./build.nbt. Don't ask questions.`,
  sized: (s) => `Build this building: ${s.name}: ${s.what}. Size: about ${s.size.w} blocks wide (along the front, x), ${s.size.d} deep, ${s.size.h} tall; ${SCALE}. The front faces north. Write the result as a Minecraft Java structure file (.nbt) at ./build.nbt. You may use any tools or libraries you can install. Work autonomously; do not ask questions.` };
function prompt(s, arm) {
  if (LADDER[arm]) return LADDER[arm](s);
  const task = `${s.name}: ${s.what}. Size: about ${s.size.w} blocks wide (along the front, x), ${s.size.d} deep, ${s.size.h} tall; ${SCALE}. The front faces north. Use the concept image at ./concept.png as inspiration. Write the result as a Minecraft Java structure file (.nbt) at ./build.nbt. You may use any tools or libraries you can install. Work autonomously; do not ask questions.`;
  return arm === "plugin" ? `Use the minecraft-design skill to build this building: ${task}` : `Build this building: ${task}`;
}
const run = (cmd, args, opts) => new Promise((res) => {
  const p = spawn(cmd, args, opts); let out = "", err = "";
  p.stdout?.on("data", (d) => (out += d)); p.stderr?.on("data", (d) => (err += d));
  p.on("error", (e) => res({ code: -1, out, err: String(e) })); p.on("close", (code) => res({ code, out, err }));
});

async function judge(dir, r) {
  const out = join(dir, "judge");
  mkdirSync(out, { recursive: true });
  const j = await run("baml", ["run", "--project", JUDGES, "--agent-skill-check", "off", "--output-format", "json", "judge.glance", "--",
    "--plugin", PLUGIN, "--nbt", join(dir, "build.nbt"), "--brief", readFileSync(join(dir, "brief.txt"), "utf8").trim(), "--out_dir", out],
    { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, MCD_LEDGER: join(out, "ledger.jsonl") } });
  writeFileSync(join(dir, "judge", "stdout.txt"), j.out);   // the judge prints the verdict JSON on stdout (card png goes to --out-dir)
  delete r.judgeError;
  try { const o = j.out; r.verdict = JSON.parse(o.slice(o.indexOf("{"), o.lastIndexOf("}") + 1)); writeFileSync(join(dir, "judge", "verdict.json"), JSON.stringify(r.verdict, null, 1)); }
  catch { r.judgeError = `no verdict (exit ${j.code}): ${(j.err || j.out).slice(-300)}`; }
}

async function one(key, arm) {
  const s = SUBJECTS[key], dir = join(ROOT, `${key}-${arm}`), done = join(dir, "result.json");
  if (existsSync(done)) {
    const old = JSON.parse(readFileSync(done, "utf8"));
    if (old.nbt && !old.verdict) { await judge(dir, old); writeFileSync(done, JSON.stringify(old, null, 1)); }   // re-judge only
    return old;
  }
  mkdirSync(dir, { recursive: true });
  if (!LADDER[arm]) copyFileSync(conceptFile(key), join(dir, "concept.png"));
  writeFileSync(join(dir, "brief.txt"), briefOf(s));
  const args = ["-p", "--model", MODEL, "--setting-sources", "", "--strict-mcp-config", "--permission-mode", "bypassPermissions",
    "--output-format", "stream-json", "--verbose", "--max-budget-usd", BUDGET, ...(arm === "plugin" ? ["--plugin-dir", PLUGIN] : []), prompt(s, arm)];
  const t0 = Date.now();
  const sess = await new Promise((res) => {
    const log = createWriteStream(join(dir, "session.jsonl"));
    const p = spawn("claude", args, { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    p.stdout.pipe(log); let err = ""; p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => res({ code: -1, err: String(e) })); p.on("close", (code) => { log.end(); res({ code, err }); });
  });
  const r = { key, arm, name: s.name, exit: sess.code, stderr: sess.err.slice(0, 500), minutes: +((Date.now() - t0) / 60000).toFixed(1) };
  try {
    const lines = readFileSync(join(dir, "session.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const res = lines.findLast((l) => l.type === "result");
    if (res) Object.assign(r, { costUsd: res.total_cost_usd, turns: res.num_turns, durationMin: +(res.duration_ms / 60000).toFixed(1), subtype: res.subtype, isError: res.is_error });
    else r.noResultLine = true;
    r.skillUsed = lines.some((l) => l.type === "assistant" && l.message?.content?.some?.((c) => c.type === "tool_use" && c.name === "Skill"));
  } catch (e) { r.parseError = String(e); }
  const nbt = join(dir, "build.nbt");
  r.nbt = existsSync(nbt);
  if (r.nbt) await judge(dir, r);
  writeFileSync(done, JSON.stringify(r, null, 1));
  return r;
}

function aggregate() {
  const rows = [];
  for (const key of Object.keys(SUBJECTS)) for (const arm of ["stock", "described", "sized", "plain", "plugin"]) {
    const f = join(ROOT, `${key}-${arm}`, "result.json"); if (existsSync(f)) rows.push(JSON.parse(readFileSync(f, "utf8")));
  }
  writeFileSync(join(ROOT, "results.json"), JSON.stringify(rows, null, 1));
  const g = (v) => v ?? "-";
  const L = ["| subject | arm | usability | massing | roof | facades | elements | finish | palette | cost $ | min | turns |", "|---|---|---|---|---|---|---|---|---|---|---|---|"];
  for (const r of rows) {
    const v = r.verdict ?? {};
    const u = r.nbt ? (v.usability ?? "JUDGE-FAIL") : "NO-NBT";
    L.push(`| ${r.key} | ${r.arm} | ${u} | ${g(v.massing)} | ${g(v.roof)} | ${g(v.facades)} | ${g(v.elements)} | ${g(v.finish)} | ${g(v.palette)} | ${r.costUsd?.toFixed(2) ?? "-"} | ${g(r.durationMin ?? r.minutes)} | ${g(r.turns)} |`);
  }
  const usable = (u) => u === "Usable" || u === "Showcase";
  L.push("", "| arm | n | NBT produced | Usable+ | mean cost $ | mean min |", "|---|---|---|---|---|---|");
  for (const arm of ["stock", "described", "sized", "plain", "plugin"]) {
    const a = rows.filter((r) => r.arm === arm); if (!a.length) continue;
    const m = (f) => (a.reduce((x, r) => x + (f(r) || 0), 0) / a.length).toFixed(2);
    L.push(`| ${arm} | ${a.length} | ${a.filter((r) => r.nbt).length} | ${a.filter((r) => usable(r.verdict?.usability)).length} | ${m((r) => r.costUsd)} | ${m((r) => r.durationMin ?? r.minutes)} |`);
  }
  L.push("", `Model ${MODEL}; per-session cap --max-budget-usd ${BUDGET} (no turn-cap flag in this claude CLI). Usable+ = Usable and above in the judge's scale (ladder: CannotSee < Reject < NeedsWork < Usable < Showcase).`);
  writeFileSync(join(ROOT, "results.md"), L.join("\n") + "\n");
  console.log(L.join("\n"));
}

mkdirSync(ROOT, { recursive: true });
if (!argv.includes("--aggregate")) {
  if (!keys.length || keys.some((k) => !SUBJECTS[k])) throw new Error(`subjects: ${Object.keys(SUBJECTS).join(", ")} | --all`);
  await Promise.all(keys.flatMap((k) => ARMS.map((a) => one(k, a).then((r) => console.log(k, a, r.nbt ? r.verdict?.usability ?? r.judgeError : "NO-NBT", r.costUsd)))));
}
aggregate();
