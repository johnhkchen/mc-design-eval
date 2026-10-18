// A study job: why does one kind of issue keep coming out of the recipe? Not a fix of any building. Code gathers the
// evidence across every build that came out this way (tier "auto", no model): each occurrence with its kit run and plot,
// the plan's rooms and parts for that plot, the run's files, what code fixes already failed, and the plugin files that
// made and checked it. At tier haiku or sonnet a model then reads that evidence and says where in the recipe it comes
// from and the smallest change to it: `claude -p --bare` (authenticated only by ANTHROPIC_API_KEY, so it is billed to
// the API), read-only tools, a hard --max-budget-usd cap, and a JSON-schema answer.
//   runStudy(job, { api, patch, envKey })   called by scripts/fixer.mjs for jobs of type "study"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { REPO } from "../src/lib/checks.js";
import { KINDS, AUTOFIX } from "../src/lib/fixes.js";

const HERE = resolve(import.meta.dirname, ".."), PLUGIN = "/Volumes/ext1/swe/repos/minecraft-design";
// where each kind is found (plugin paths are relative to the plugin repo, the rest to this repo)
const CHECKS = {
  "room unreachable": ["plugin: tools/src/rooms.mjs (walkReport)"], "dark room": ["plugin: tools/src/light.mjs"],
  "no front door": ["apps/mc-design-site/src/lib/checks.js (checkBuilding)"], "way in": ["apps/mc-design-site/src/lib/checks.js", "plugin: tools/src/approach.mjs"],
};
const RECIPE = ["plugin: baml_src/ns_workflow/workflow.baml (the build: form, plan, parts, crews, inspector)", "plugin: baml_src/ns_workflow/build_prompt.baml",
  "plugin: baml_src/ns_workflow/parts_prompt.baml (the crews)", "plugin: baml_src/ns_workflow/revise_prompt.baml", "plugin: skills/ (the design skill the agents read)", "plugin: tools/src/ (the toolkit the crews call)"];
const RUN_FILES = ["brief.txt", "plan.md", "plan.json", "rooms.json", "parts", "crew", "sessions", "build-report.json", "parts-report.json"];
const DIAGNOSIS = { type: "object", required: ["where", "cause", "evidence", "change", "fixer", "check"], properties: {
  where: { type: "string", enum: ["brief", "form", "planner", "crews", "toolkit", "inspector", "check is wrong", "intended", "unclear"] },
  cause: { type: "string", description: "why this keeps coming out, in two or three sentences" },
  evidence: { type: "array", items: { type: "string" }, description: "file:line or quoted lines that show it" },
  change: { type: "object", required: ["file", "what"], properties: { file: { type: "string" }, what: { type: "string" } }, description: "the smallest change to the recipe that stops it" },
  fixer: { type: "string", description: "could a deterministic fixer repair finished buildings of this kind, and how; or why not" },
  check: { type: "string", description: "is the check that finds it right; if not, what it should look for" },
} };

const plotRange = (s) => { const m = /plots?\s+(\d+)(?:\s*[-–]\s*(\d+))?/i.exec(s); return m ? [+m[1], +(m[2] ?? m[1])] : null; };

export function packet(job, issues, jobs, catalog) {
  const byId = Object.fromEntries(catalog.map((e) => [e.id, e])), base = (e) => byId[e?.variantOf] ?? e;
  const seen = issues.filter((i) => i.kind === job.kind && i.status !== "waived" && byId[i.building]);
  const occ = seen.map((i) => { const e = byId[i.building]; return { building: e.id, name: e.name, series: e.series, type: e.type, base: base(e).id, run: e.source.run, plot: e.source.plot, status: i.status, what: i.what, at: i.at, source: i.source }; });
  const failed = jobs.filter((j) => (j.type ?? "fix") === "fix" && j.kind === job.kind).flatMap((j) => (j.result?.remaining ?? []).filter((r) => !/already clear|not in the catalog/.test(r.reason)).map((r) => ({ job: j.id, building: r.id, reason: r.reason })));
  const count = (k) => occ.reduce((a, o) => ((a[o[k]] = (a[o[k]] || 0) + 1), a), {});
  // each base building once: its run's plan for that plot (rooms in its x range, parts naming it or its plot)
  const bases = [...new Set(occ.map((o) => o.base))].map((id) => { const e = byId[id], dir = resolve(REPO, e.source.run), w = e.footprint[0], x0 = w * e.source.plot;
    const plan = existsSync(`${dir}/plan.json`) ? JSON.parse(readFileSync(`${dir}/plan.json`, "utf8")) : {}, word = e.name.split(/[\s,]/)[0].toLowerCase();
    return { id, name: e.name, run: e.source.run, plot: e.source.plot, frame: `module x = kit x - ${x0}, z = kit z - 5`,
      rooms: (plan.rooms ?? []).filter((r) => r.box && Math.min(r.box[0], r.box[3]) >= x0 && Math.max(r.box[0], r.box[3]) < x0 + w),
      parts: (plan.parts ?? []).filter((p) => { const t = `${p.name} ${p.scope}`, r = plotRange(t); return (r && e.source.plot >= r[0] && e.source.plot <= r[1]) || t.toLowerCase().includes(word); }),
      files: RUN_FILES.filter((f) => existsSync(`${dir}/${f}`)) }; });
  const json = { kind: job.kind, means: KINDS[job.kind] ?? null, codeFixer: AUTOFIX.includes(job.kind), note: job.note || null,
    counts: { occurrences: occ.length, buildings: new Set(occ.map((o) => o.building)).size, open: occ.filter((o) => o.status === "open").length, fixed: occ.filter((o) => o.status === "fixed").length, bySeries: count("series"), byType: count("type"), byRun: count("run") },
    occurrences: occ, codeFixFailures: failed, bases, foundBy: CHECKS[job.kind] ?? (occ.some((o) => o.source === "person") ? ["a person's report (no check)"] : ["plugin: tools/src/fit-check.mjs"]), recipe: RECIPE };
  const md = [`# Study: why does "${job.kind}" keep coming out?`, "", json.means ? `What it is: ${json.means}` : "", job.note ? `The owner's note: ${job.note}` : "",
    `${json.counts.occurrences} occurrences in ${json.counts.buildings} buildings (${json.counts.open} open, ${json.counts.fixed} fixed since). Code fixer: ${json.codeFixer ? "yes" : "none"}.`,
    `By series: ${Object.entries(json.counts.bySeries).map(([k, n]) => `${k} ${n}`).join(", ")}. By type: ${Object.entries(json.counts.byType).map(([k, n]) => `${k} ${n}`).join(", ")}.`, "",
    "## Occurrences", ...occ.map((o) => `- ${o.name} (${o.building}, ${o.status}, ${o.source}): ${o.what}${o.at && !o.what.includes(o.at.join(",")) ? ` at ${o.at.join(",")}` : ""}`), "",
    ...(failed.length ? ["## Code fixes that didn't take", ...failed.map((f) => `- ${f.building} (${f.job}): ${f.reason}`), ""] : []),
    "## Each base building in its kit run", ...bases.flatMap((b) => [`### ${b.name}: plot ${b.plot} of ${b.run} (${b.frame})`,
      "Plan rooms:", ...b.rooms.map((r) => `- ${r.name} ${JSON.stringify(r.box)}: ${r.purpose ?? ""}${r.ways_in ? ` Ways in: ${r.ways_in}` : ""}`),
      "Parts that built it:", ...b.parts.map((p) => `- ${p.name} (${p.module}): ${p.scope}`), `Run files (in ${b.run}/): ${b.files.join(", ")}`, ""]),
    "## Where it's found", ...json.foundBy.map((f) => `- ${f}`), "", "## The recipe", ...RECIPE.map((f) => `- ${f}`), ""].filter((l) => l !== null).join("\n");
  return { json, md };
}

const PROMPT = (file) => `You are studying a Minecraft build pipeline's recipe, the way a baker studies why cakes keep coming out wrong: not to fix one
building, but to find where in the recipe this kind of fault comes from. The evidence is in ${file}: read it first. Then read
what it points to (the runs' plan.md/plan.json/rooms.json, the crews' part files, the prompts and toolkit in the plugin at
${PLUGIN}) only as much as you need. Paths starting "plugin:" are in the plugin repo; the rest are in ${REPO}.
Say where it comes from (or that the check is wrong, or that the buildings are as intended), with evidence, and the smallest
change to the recipe that stops it. Read only; change nothing. Be brief: this is billed per token.`;

export async function runStudy(job, { api, patch, envKey }) {
  const t0 = Date.now(), out = resolve(HERE, ".cache/candidates", job.id); mkdirSync(out, { recursive: true });
  await patch(job.id, { status: "running" });
  const { issues, jobs } = await api("/api/issues"), catalog = JSON.parse(readFileSync(resolve(HERE, "src/data/catalog.json"), "utf8"));
  const { json, md } = packet(job, issues, jobs ?? [], catalog);
  writeFileSync(`${out}/packet.json`, JSON.stringify(json, null, 1) + "\n"); writeFileSync(`${out}/packet.md`, md + "\n");
  const result = { tier: job.tier, counts: json.counts, packet: `/api/candidates/${job.id}/packet.md`, file: `${out}/packet.md`, cost: 0 };
  if (job.tier !== "auto") {
    const key = envKey(); if (!key) throw new Error("a model study runs on the Anthropic API: put ANTHROPIC_API_KEY in apps/mc-design-site/.env.local");
    const raw = execFileSync("claude", ["-p", PROMPT(`${out}/packet.md`), "--bare", "--model", job.tier, "--max-budget-usd", String(job.budget), "--output-format", "json",
      "--json-schema", JSON.stringify(DIAGNOSIS), "--allowedTools", "Read", "Grep", "Glob", "--add-dir", PLUGIN, "--strict-mcp-config", "--no-session-persistence"],
      { cwd: REPO, encoding: "utf8", timeout: 20 * 60e3, maxBuffer: 64e6, env: { ...process.env, ANTHROPIC_API_KEY: key } });
    const r = JSON.parse(raw);
    result.cost = +(r.total_cost_usd ?? 0).toFixed(2); result.model = job.tier; result.turns = r.num_turns;
    result.diagnosis = r.structured_output ?? (() => { try { return JSON.parse(/\{[\s\S]*\}/.exec(r.result)[0]); } catch { return { where: "unclear", cause: String(r.result ?? r.subtype ?? "no answer").slice(0, 2000) }; } })();
    if (r.subtype && r.subtype !== "success") result.stopped = r.subtype;
  }
  result.minutes = Math.round((Date.now() - t0) / 60e3);
  result.summary = job.tier === "auto" ? `Evidence gathered (no model): ${json.counts.occurrences} occurrences in ${json.counts.buildings} buildings.` : `${job.tier} read the evidence: ${result.diagnosis?.where ?? "no answer"}.`;
  await patch(job.id, { status: "review", result });
  console.log(`${job.id}: ${result.summary}${result.cost ? ` $${result.cost}` : ""}`);
}
