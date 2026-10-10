// TOOL-GAP INTEL: what tools are worth building? Every run leaves evidence of where builds fall short. This collects it
// (glance-judge issues, rejected improvement tasks, the builder's own gaps.md, detail-pass job logs), classifies each with
// Haiku through BAML (ClassifyGaps: MissingTool / MissingOption / MisusedTool / RendererGap / NotATool), and ranks the
// gaps across runs into a backlog. Opus is spent only on the top of the backlog, and its output is a reusable tool.
//
//   node benchmarks/intel/gaps.mjs collect <run-dir>...     classify one or more runs (idempotent per run)
//   node benchmarks/intel/gaps.mjs backfill                 collect every known run (collection + gauntlet detail passes)
//   node benchmarks/intel/gaps.mjs rank                     write intel/backlog.md from intel/gaps.jsonl
//   node benchmarks/intel/gaps.mjs built "<tool>" "<commit>" mark a backlog entry as built (keeps its evidence)
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const PLUGIN = join(ROOT, "..", "minecraft-design");
const DB = join(HERE, "gaps.jsonl"), BUILT = join(HERE, "built.json");
mkdirSync(HERE, { recursive: true });

function baml(fn, args) {
  const r = spawnSync("npx", ["tsx", join(ROOT, "benchmarks", "collection", "baml-call.mts")], { input: JSON.stringify({ fn, args, model: "claude-haiku-5-5", effort: "low" }), encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`baml ${fn}: ${(r.stderr || "").slice(-300)}`);
  return JSON.parse(r.stdout);
}

/** A compact catalogue of the toolkit (commands, treatments, presets) so the classifier knows what exists. */
function toolkit() {
  const refs = join(PLUGIN, "skills", "minecraft-design", "references");
  const lines = [];
  for (const f of readdirSync(refs).filter((f) => f.endsWith(".md"))) {
    const t = readFileSync(join(refs, f), "utf8");
    const heads = [...t.matchAll(/^#+ (.+)$/gm)].map((m) => m[1]).slice(0, 12);
    const code = [...t.matchAll(/`([a-z][\w.-]*(?: [\w<>|-]+)?)`/g)].map((m) => m[1]).filter((c) => c.length < 30);
    lines.push(`${f}: ${heads.join("; ")} | ${[...new Set(code)].slice(0, 40).join(", ")}`);
  }
  return lines.join("\n").slice(0, 9000);   // keep Haiku calls small
}

/** Everything a run tells us about shortfalls, as plain text lines. */
function observations(dir) {
  const obs = [];
  const j = (f) => { try { return JSON.parse(readFileSync(join(dir, f), "utf8")); } catch { return null; } };
  const s = j("summary.json");
  if (s?.summary) obs.push(`Reviewer verdict: ${s.usability || ""} — ${s.summary}`);
  for (const f of readdirSync(dir).filter((f) => /^v\d-judge\.json$/.test(f))) for (const i of j(f)?.issues || []) obs.push(`Reviewer issue [${i.severity} ${i.aspect}]: ${i.problem} (fix: ${i.fix})`);
  for (const t of j("tasks-log.json") || []) if (!t.kept) obs.push(`Rejected task "${t.title}" (${t.kind}): ${t.why || t.verdict}`);
  if (existsSync(join(dir, "gaps.md"))) obs.push("Builder's own notes:\n" + readFileSync(join(dir, "gaps.md"), "utf8").slice(0, 3000));
  // gauntlet detail passes: rejected or invisible jobs
  for (const d of readdirSync(dir).filter((f) => f.startsWith("detail-") && statSync(join(dir, f)).isDirectory())) {
    const g = (() => { try { return JSON.parse(readFileSync(join(dir, d, "greedy.json"), "utf8")); } catch { return []; } })();
    for (const x of g) if (!x.kept) obs.push(`Detail job "${x.job}" ${x.verdict}: ${x.why}`);
  }
  return obs;
}

const seen = () => new Set(existsSync(DB) ? readFileSync(DB, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l).run) : []);

function collect(dirs) {
  const done = seen(), cat = toolkit();
  for (const dir of dirs) {
    const run = basename(dir);
    if (done.has(run)) { console.log(`${run}: already collected`); continue; }
    const obs = observations(dir);
    if (!obs.length) { console.log(`${run}: no observations`); continue; }
    // chunk so every Haiku call stays small
    let n = 0;
    for (let i = 0; i < obs.length; i += 25) {
      const r = baml("ClassifyGaps", [obs.slice(i, i + 25).join("\n"), cat]);
      for (const g of r.result.gaps || []) { appendFileSync(DB, JSON.stringify({ run, t: new Date().toISOString(), ...g }) + "\n"); n++; }
    }
    console.log(`${run}: ${obs.length} observations -> ${n} gaps`);
  }
}

function rank() {
  const rows = (existsSync(DB) ? readFileSync(DB, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []).filter((r) => r.kind !== "NotATool");
  const built = existsSync(BUILT) ? JSON.parse(readFileSync(BUILT, "utf8")) : {};
  const W = { MissingTool: 3, MissingOption: 2, MisusedTool: 2, RendererGap: 3 };
  // cluster free-text gaps into canonical tools (Haiku, chunked so each call stays small)
  const clusters = [];
  for (let i = 0; i < rows.length; i += 120) {
    const chunk = rows.slice(i, i + 120).map((r, k) => `${i + k} | ${r.kind} | ${r.tool} | ${r.need}`).join("\n");
    const r = baml("ClusterGaps", [chunk]);
    clusters.push(...(r.result.clusters || []));
  }
  // merge clusters from different chunks that got the same canonical name
  const byName = new Map();
  for (const c of clusters) {
    const k = c.tool.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!byName.has(k)) byName.set(k, { tool: c.tool, kind: c.kind, need: c.need, members: [] });
    byName.get(k).members.push(...c.members.filter((m) => rows[m]));
  }
  const list = [...byName.entries()].map(([k, c]) => {
    const ms = [...new Set(c.members)].map((m) => rows[m]);
    const runs = new Set(ms.map((m) => m.run));
    const score = ms.reduce((s, m) => s + (W[m.kind] ?? 1), 0);
    return { ...c, key: k, n: ms.length, runs: runs.size, value: score * Math.sqrt(runs.size), evidence: ms.slice(0, 4).map((m) => m.evidence), built: built[k] };
  }).sort((a, b) => b.value - a.value);
  writeFileSync(join(HERE, "backlog.json"), JSON.stringify(list, null, 1) + "\n");
  const md = [
    `# Tool backlog (${rows.length} classified gaps over ${new Set(rows.map((r) => r.run)).size} runs, ${list.length} clusters)`,
    "",
    "Value = weighted count (MissingTool/RendererGap 3, MissingOption/MisusedTool 2) x sqrt(distinct runs): a gap that recurs across buildings",
    "amortises best. Build from the top with Opus; every build must be a reusable, tested tool. Mark built: `gaps.mjs built \"<tool>\" <commit>`.",
    "",
    ...list.slice(0, 30).flatMap((c, i) => [
      `## ${i + 1}. ${c.tool} — value ${c.value.toFixed(1)} (${c.n} gaps, ${c.runs} runs, ${c.kind})${c.built ? `  ✅ built ${c.built}` : ""}`,
      `${c.need}`,
      ...c.evidence.map((e) => `- _${e.slice(0, 140)}_`),
      "",
    ]),
  ].join("\n");
  writeFileSync(join(HERE, "backlog.md"), md + "\n");
  console.log(md.split("\n").filter((l) => l.startsWith("## ")).slice(0, 15).join("\n"));
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "collect") collect(rest);
else if (cmd === "backfill") {
  const dirs = [];
  for (const base of [join(ROOT, "benchmarks", "collection", "runs"), join(ROOT, "benchmarks", "gauntlet", "runs")])
    if (existsSync(base)) for (const d of readdirSync(base)) { const p = join(base, d); if (statSync(p).isDirectory() && (existsSync(join(p, "tasks-log.json")) || readdirSync(p).some((f) => f.startsWith("detail-")) || existsSync(join(p, "summary.json")) && base.includes("collection"))) dirs.push(p); }
  collect(dirs);
  rank();
} else if (cmd === "rank") rank();
else if (cmd === "built") {
  const built = existsSync(BUILT) ? JSON.parse(readFileSync(BUILT, "utf8")) : {};
  built[rest[0].toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()] = rest[1] || new Date().toISOString().slice(0, 10);
  writeFileSync(BUILT, JSON.stringify(built, null, 1) + "\n"); rank();
} else console.log("usage: gaps.mjs collect <run-dir>... | backfill | rank | built <tool> <commit>");
