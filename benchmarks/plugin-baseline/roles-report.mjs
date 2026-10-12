#!/usr/bin/env node
// The crew roles asked for across runs: the designer's `recruit` list (plan.json) and the Haiku workers' `companions`
// (build-report.json), grouped by role, so the roles that keep coming back can be designed into trade cards
// (minecraft-design skills/minecraft-design/trades).
//   node roles-report.mjs [runs dir, default runs/] [--json]
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? new URL("runs", import.meta.url).pathname;
const runs = [];
(function walk(d, depth) {
  if (existsSync(join(d, "plan.json")) || existsSync(join(d, "build-report.json"))) runs.push(d);
  if (depth > 3) return;
  for (const f of readdirSync(d)) {
    if (/^(crew|plan-kit|sessions|tiles|parts|vocab)$/.test(f)) continue;
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p, depth + 1);
  }
})(root, 0);

const read = (f) => { try { return JSON.parse(readFileSync(f, "utf8")); } catch { return null; } };
const norm = (r) => r.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim().replace(/s$/, "");
const roles = new Map();
const add = (role, kind, run, note) => {
  const k = norm(role);
  if (!k) return;
  const e = roles.get(k) ?? { role: k, recruit: 0, companion: 0, runs: new Set(), notes: [] };
  e[kind]++; e.runs.add(run); if (note && e.notes.length < 4) e.notes.push(note);
  roles.set(k, e);
};
for (const d of runs) {
  const run = d.slice(root.length + 1) || d;
  for (const r of read(join(d, "plan.json"))?.recruit ?? []) add(r.role, "recruit", run, r.why);
  const br = read(join(d, "build-report.json"));
  for (const rep of Array.isArray(br) ? br : br?.reports ?? []) for (const c of rep.companions ?? []) add(c.role, "companion", run, c.task);
}
const rows = [...roles.values()].sort((a, b) => b.recruit + b.companion - (a.recruit + a.companion));
if (process.argv.includes("--json")) console.log(JSON.stringify(rows.map((r) => ({ ...r, runs: [...r.runs] })), null, 1));
else {
  console.log(`${rows.length} roles from ${runs.length} runs (recruited by the designer / called for by workers):`);
  for (const r of rows) console.log(`${String(r.recruit).padStart(3)} ${String(r.companion).padStart(3)}  ${r.role}  [${r.runs.size} run${r.runs.size > 1 ? "s" : ""}]${r.notes[0] ? `  e.g. ${r.notes[0].slice(0, 90)}` : ""}`);
}
