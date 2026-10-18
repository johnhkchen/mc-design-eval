// The fix half of the fix system, run on this machine (model calls stay local): takes the oldest queued fix job from
// the site, sends each kit run one revision that names every listed building's issues of the job's kind, cuts the
// revised modules as candidates (variants re-skinned from their fixed base), checks them before and after, renders
// them, and posts the result for review on the site's Issues page. Accepted jobs are applied with --apply.
//   node scripts/fixer.mjs [--to <site url>] [--model sonnet|lean] [--loop]     run queued jobs (one, or keep polling)
//   node scripts/fixer.mjs [--to <site url>] --apply                             put accepted candidates in the catalog
//   --dry   no revision (no model call): the candidates are the run's current version, to test the pipeline
// The cloud site needs MCD_ADMIN_TOKEN in the environment.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { checkBuilding, roomsFor, tally, REPO } from "../src/lib/checks.js";
import { KINDS } from "../src/lib/fixes.js";

const HERE = resolve(import.meta.dirname, ".."), PLUGIN = "/Volumes/ext1/swe/repos/minecraft-design";
const MCD = `${PLUGIN}/tools/bin/mcd.mjs`, AGENT = `${PLUGIN}/tools/bin/mcd-agent.mjs`;
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const TO = arg("--to", "http://127.0.0.1:5178"), MODEL = arg("--model", "sonnet"), CLOUD = !/127\.0\.0\.1|localhost/.test(TO);
const api = async (path, opts = {}) => { const r = await fetch(TO + path, { ...opts, headers: { "content-type": "application/json", ...(process.env.MCD_ADMIN_TOKEN ? { authorization: `Bearer ${process.env.MCD_ADMIN_TOKEN}` } : {}) } });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`${path}: ${j.error || r.status}`); return j; };
const patch = (id, body) => api(`/api/fix-jobs/${id}`, { method: "PATCH", body: JSON.stringify(body) });
const catalog = () => JSON.parse(readFileSync(resolve(HERE, "src/data/catalog.json"), "utf8"));
const spend = (run) => { const f = resolve(REPO, run, "ledger.jsonl"); return existsSync(f) ? readFileSync(f, "utf8").trim().split("\n").reduce((a, l) => a + (JSON.parse(l).cost || 0), 0) : 0; };
const latest = (run) => readdirSync(resolve(REPO, run)).map((f) => /^v(\d+)\.nbt$/.exec(f)).filter(Boolean).map((m) => +m[1]).sort((a, b) => b - a)[0];
const at = (p) => (p ? ` at ${p.join(",")}` : "");

// module i of a kit's sample row, as its own file: x w*i .. w*i+w-1, z 5 .. 5+d-1 (the kits' frame)
function cut(kitFile, e) {
  const k = load(kitFile), [w, d] = e.footprint, x0 = w * e.source.plot; let H = 0;
  for (const c of k.cells.values()) H = Math.max(H, c.pos[1] + 1);
  const g = new Grid([w, H, d], { dataVersion: 3955 });
  for (const c of k.cells.values()) { const [x, y, z] = c.pos; if (x < x0 || x >= x0 + w || z < 5 || z >= 5 + d || /air$/.test(c.block)) continue; g.set(x - x0, y, z - 5, c.block, c.state, c.nbt); }
  return g;
}

async function runJob(job) {
  const cat = catalog(), byId = Object.fromEntries(cat.map((e) => [e.id, e]));
  const { issues } = await api("/api/issues");
  const t0 = Date.now(), result = { model: process.argv.includes("--dry") ? "dry run (no revision)" : MODEL, buildings: {}, runs: [] };
  await patch(job.id, { status: "running" });
  // every listed building's open issues of this kind, gathered on its base (a variant is fixed through its base)
  const base = (id) => byId[byId[id]?.variantOf] ?? byId[id];
  const byRun = {};
  for (const id of job.buildings) { const e = base(id); if (!e) continue; const r = (byRun[e.source.run] ??= new Map()); if (!r.has(e.id)) r.set(e.id, { e, lines: new Set() });
    for (const i of issues.filter((i) => i.building === id && i.kind === job.kind && i.status === "open")) r.get(e.id).lines.add(`${i.what.replace(/\s*@?-?\d+,-?\d+,-?\d+/g, "")}${at(i.at)}`); }
  let cost = 0;
  for (const [run, mods] of Object.entries(byRun)) {
    const comment = [`Fix job ${job.id}: "${job.kind}" in ${mods.size} building${mods.size === 1 ? "" : "s"}, fixed together.`,
      KINDS[job.kind] ? `What it is: ${KINDS[job.kind]}` : "", job.note ? `How the owner wants it fixed: ${job.note}` : "",
      ...[...mods.values()].map(({ e, lines }) => `- Plot ${e.source.plot} (${e.name}): ${[...lines].join("; ") || job.kind} (coordinates in the module's own frame: add ${e.footprint[0] * e.source.plot} to x and 5 to z for the kit's)`),
      "Fix only these; everything else in every house stays exactly as it is."].filter(Boolean).join("\n");
    const dir = resolve(REPO, run), f = resolve(dir, `fix-${job.id}.txt`); writeFileSync(f, comment + "\n");
    const before = spend(run), v0 = latest(run);
    if (!process.argv.includes("--dry")) execFileSync("node", [AGENT, "revise", "--dir", dir, "--comment-file", f, "--minutes", "15", "--sessions", "2", ...(MODEL === "lean" ? ["--lean"] : [])], { stdio: ["ignore", "ignore", "inherit"], timeout: 50 * 60e3 });
    const v1 = latest(run); if (v1 === v0 && !process.argv.includes("--dry")) throw new Error(`${run}: the revision made no new version`);
    cost += spend(run) - before; result.runs.push({ run, from: `v${v0}`, to: `v${v1}`, comment });
    const kitFile = resolve(dir, `v${v1}.nbt`), out = resolve(HERE, ".cache/candidates", job.id); mkdirSync(out, { recursive: true });
    for (const { e } of mods.values()) {
      const cand = `${out}/${e.id}.nbt`; cut(kitFile, e).save(cand);
      // the job's variants of this base: re-skinned from the fixed base
      const ids = [e.id, ...job.buildings.filter((id) => byId[id]?.variantOf === e.id)];
      for (const id of ids) {
        const v = byId[id], file = `${out}/${id}.nbt`;
        if (id !== e.id) execFileSync("node", [MCD, "reskin", cand, file, "--swap", v.swap, "--json"]);
        const rooms = roomsFor(e), was = tally(checkBuilding(load(resolve(HERE, "public" + v.nbt)), rooms)), now = tally(checkBuilding(load(file), rooms));
        const tiles = `${out}/${id}-tiles`; mkdirSync(tiles, { recursive: true }); execFileSync("node", [MCD, "render", file, "--out", `${tiles}/sheet.png`, "--tiles", tiles]);
        execFileSync("magick", [`${tiles}/front-right.png`, "-strip", "-quality", "82", `${out}/${id}.jpg`]);
        let image = `/api/candidates/${job.id}/${id}.jpg`, nbt = `/api/candidates/${job.id}/${id}.nbt`;
        if (CLOUD) for (const [ext, type] of [["jpg", "image/jpeg"], ["nbt", "application/octet-stream"]]) {
          execFileSync("npx", ["wrangler", "r2", "object", "put", `dragonholde-assets/fixes/${job.id}/${id}.${ext}`, "--file", `${out}/${id}.${ext}`, "--content-type", type, "--remote"], { cwd: HERE, stdio: "ignore" });
          if (ext === "jpg") image = `/api/assets/fixes/${job.id}/${id}.jpg`; else nbt = `/api/assets/fixes/${job.id}/${id}.nbt`; }
        result.buildings[id] = { before: was, after: now, image, nbt, file };
      }
    }
  }
  const cleared = Object.values(result.buildings).filter((r) => !(r.after[job.kind] > 0)).length;
  Object.assign(result, { cost: +cost.toFixed(2), minutes: Math.round((Date.now() - t0) / 60e3), summary: `${cleared} of ${Object.keys(result.buildings).length} buildings clear of "${job.kind}" after the fix.` });
  await patch(job.id, { status: "review", result });
  console.log(`${job.id}: ${result.summary} $${result.cost}, ${result.minutes} min`);
}

async function apply() {
  const jobs = await api("/api/fix-jobs?status=accepted"), cat = catalog(), byId = Object.fromEntries(cat.map((e) => [e.id, e]));
  let n = 0;
  for (const j of jobs) { if (j.result?.applied) continue;
    for (const [id, r] of Object.entries(j.result?.buildings ?? {})) { if (!byId[id] || !existsSync(r.file)) continue; copyFileSync(r.file, resolve(REPO, byId[id].source.file)); n++; }
    await patch(j.id, { result: { ...j.result, applied: new Date().toISOString() } }); }
  if (!n) return console.log("nothing accepted to apply");
  execFileSync("node", ["scripts/catalog.mjs"], { cwd: HERE, stdio: "inherit" });
  execFileSync("node", ["scripts/check.mjs", "--to", TO], { cwd: HERE, stdio: "inherit" });
  console.log(`applied ${n} buildings; re-checked and synced`);
}

if (process.argv.includes("--apply")) await apply();
else do {
  const [job] = (await api("/api/fix-jobs?status=queued")).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (job) { try { await runJob(job); } catch (e) { console.error(`${job.id}: ${e.message}`); await patch(job.id, { status: "failed", result: { error: e.message } }); } }
  else if (process.argv.includes("--loop")) await new Promise((r) => setTimeout(r, 30e3));
  else console.log("no queued fix jobs");
} while (process.argv.includes("--loop"));
