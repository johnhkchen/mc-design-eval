// The runner of the fix system, on this machine: takes the oldest queued job from the site (the protocol in
// src/lib/fixes.js) and runs it.
//   fix     no model: the toolkit's deterministic fixer for the kind (autofix.mjs) on each building, kept only if the
//           checks show the issue cleared and nothing else worse; candidates are rendered and posted for review, and
//           what code couldn't fix is tagged for study
//   study   scripts/study.mjs: the evidence across every build with this kind (code), read by Haiku or Sonnet on the
//           Anthropic API only when the job's tier asks (ANTHROPIC_API_KEY in .env.local, a hard cost cap)
//   node scripts/fixer.mjs [--to <site url>] [--loop]     run the oldest queued job (or keep polling; --loop also applies)
//   node scripts/fixer.mjs [--to <site url>] --apply      put accepted fix candidates in the catalog, rebuild, re-check
// The dev server runs it by itself when a job is scheduled or accepted. The cloud site needs MCD_ADMIN_TOKEN.
import { readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { checkBuilding, roomsFor, tally, REPO } from "../src/lib/checks.js";
import { autofix } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/autofix.mjs";
import { runStudy } from "./study.mjs";

const HERE = resolve(import.meta.dirname, ".."), PLUGIN = "/Volumes/ext1/swe/repos/minecraft-design";
const MCD = `${PLUGIN}/tools/bin/mcd.mjs`;
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const TO = arg("--to", "http://127.0.0.1:5178"), CLOUD = !/127\.0\.0\.1|localhost/.test(TO);
// the API key for a model study: .env.local beside the site (never committed), or the environment
const envKey = () => { const f = resolve(HERE, ".env.local"); const m = existsSync(f) && /^ANTHROPIC_API_KEY=(.+)$/m.exec(readFileSync(f, "utf8")); return (m && m[1].trim()) || process.env.ANTHROPIC_API_KEY || ""; };
const api = async (path, opts = {}) => { const r = await fetch(TO + path, { ...opts, headers: { "content-type": "application/json", ...(process.env.MCD_ADMIN_TOKEN ? { authorization: `Bearer ${process.env.MCD_ADMIN_TOKEN}` } : {}) } });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`${path}: ${j.error || r.status}`); return j; };
const patch = (id, body) => api(`/api/fix-jobs/${id}`, { method: "PATCH", body: JSON.stringify(body) });
const catalog = () => JSON.parse(readFileSync(resolve(HERE, "src/data/catalog.json"), "utf8"));

// a candidate's render, and where the site finds it (dev server, or R2 for the cloud)
function publish(job, id, out) {
  const tiles = `${out}/${id}-tiles`; mkdirSync(tiles, { recursive: true });
  execFileSync("node", [MCD, "render", `${out}/${id}.nbt`, "--out", `${tiles}/sheet.png`, "--tiles", tiles]);
  execFileSync("magick", [`${tiles}/front-right.png`, "-strip", "-quality", "82", `${out}/${id}.jpg`]);
  let image = `/api/candidates/${job.id}/${id}.jpg`, nbt = `/api/candidates/${job.id}/${id}.nbt`;
  if (CLOUD) for (const [ext, type] of [["jpg", "image/jpeg"], ["nbt", "application/octet-stream"]]) {
    execFileSync("npx", ["wrangler", "r2", "object", "put", `dragonholde-assets/fixes/${job.id}/${id}.${ext}`, "--file", `${out}/${id}.${ext}`, "--content-type", type, "--remote"], { cwd: HERE, stdio: "ignore" });
    if (ext === "jpg") image = `/api/assets/fixes/${job.id}/${id}.jpg`; else nbt = `/api/assets/fixes/${job.id}/${id}.nbt`; }
  return { image, nbt, file: `${out}/${id}.nbt` };
}

// tier auto: deterministic code on each building, kept only when the checks agree it helped
async function runAuto(job) {
  const cat = catalog(), byId = Object.fromEntries(cat.map((e) => [e.id, e])), t0 = Date.now();
  const out = resolve(HERE, ".cache/candidates", job.id); mkdirSync(out, { recursive: true });
  const result = { tier: "auto", model: "none", cost: 0, buildings: {}, remaining: [] };
  await patch(job.id, { status: "running" });
  for (const id of job.buildings) {
    const e = byId[id]; if (!e) { result.remaining.push({ id, reason: "not in the catalog" }); continue; }
    const rooms = roomsFor(byId[e.variantOf] ?? e), g = load(resolve(HERE, "public" + e.nbt)), was = checkBuilding(g, rooms), before = tally(was);
    if (!before[job.kind]) { result.remaining.push({ id, reason: "already clear of it" }); continue; }
    const r = autofix(g, job.kind, { issues: was, rooms });
    if (!r.available) { result.remaining.push({ id, reason: `no deterministic fixer for "${job.kind}"` }); continue; }
    const after = tally(checkBuilding(g, rooms)), worse = Object.keys(after).filter((k) => k !== job.kind && (after[k] || 0) > (before[k] || 0));
    if (!r.changed || (after[job.kind] || 0) >= before[job.kind] || worse.length) { result.remaining.push({ id, reason: worse.length ? `the fix made ${worse.join(", ")} worse` : "the fix didn't clear it" }); continue; }
    g.save(`${out}/${id}.nbt`);
    result.buildings[id] = { before, after, tier: "auto", notes: r.notes.slice(0, 20), ...publish(job, id, out) };
  }
  const fixed = Object.keys(result.buildings).length;
  const tagged = result.remaining.filter((r) => !/already clear|not in the catalog/.test(r.reason)).length;
  Object.assign(result, { minutes: Math.round((Date.now() - t0) / 60e3), summary: `Fixed by code: ${fixed} of ${job.buildings.length}.${tagged ? ` ${tagged} tagged for study.` : ""}` });
  await patch(job.id, { status: fixed ? "review" : "tagged", result });
  console.log(`${job.id}: ${result.summary}`);
}

async function runJob(job) {
  if ((job.type ?? "fix") === "study") return runStudy(job, { api, patch, envKey });
  if ((job.tier ?? "auto") !== "auto") throw new Error("fix jobs are code only; a model can only study a kind");
  return runAuto(job);
}

async function apply() {
  const jobs = await api("/api/fix-jobs?status=accepted"), cat = catalog(), byId = Object.fromEntries(cat.map((e) => [e.id, e]));
  let n = 0;
  for (const j of jobs) { if (j.result?.applied || (j.type ?? "fix") !== "fix") continue;
    for (const [id, r] of Object.entries(j.result?.buildings ?? {})) { if (!byId[id] || !existsSync(r.file)) continue; copyFileSync(r.file, resolve(REPO, byId[id].source.file)); n++; }
    await patch(j.id, { result: { ...j.result, applied: new Date().toISOString() } }); }
  if (!n) return process.argv.includes("--loop") || console.log("nothing accepted to apply");
  execFileSync("node", ["scripts/catalog.mjs"], { cwd: HERE, stdio: "inherit" });
  execFileSync("node", ["scripts/check.mjs", "--to", TO], { cwd: HERE, stdio: "inherit" });
  console.log(`applied ${n} buildings; re-checked and synced`);
}

if (process.argv.includes("--apply")) await apply();
else do {
  const [job] = (await api("/api/fix-jobs?status=queued")).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (job) { try { await runJob(job); } catch (e) { console.error(`${job.id}: ${e.message}`); await patch(job.id, { status: "failed", result: { error: e.message } }); } }
  else if (process.argv.includes("--loop")) { await apply(); await new Promise((r) => setTimeout(r, 30e3)); }
  else console.log("no queued fix jobs");
} while (process.argv.includes("--loop"));
