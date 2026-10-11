// Judge V3 calibration on existing builds: Haiku (low effort) vs Sonnet (medium) on the same cards, singles and pairs.
//   node benchmarks/plugin-baseline/judge-v3.mjs [--run baseline-1] [--subjects a,b] [--arms stock,plugin]
// Writes runs/<run>/judge-v3/<name>.json (+ .ledger.jsonl per call) and summary.json; calls run in parallel.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const JUDGES = new URL("../judges", import.meta.url).pathname; // the lab's judging instruments (BAML)

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = "/Volumes/ext1/swe/repos/minecraft-design";
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const RUN = join(HERE, "runs", opt("--run", "baseline-1"));
const SUBJECTS = opt("--subjects", "tea-house,wizard-tower,red-barn,glass-cafe").split(",");
const [A, B] = opt("--arms", "stock,plugin").split(",");
const OUT = join(RUN, "judge-v3");
mkdirSync(OUT, { recursive: true });
const SONNET_SINGLES = opt("--sonnet-singles", "tea-house,glass-cafe").split(","); // Sonnet reference singles kept few (usage)
const HAIKU = ["claude-haiku-5-5", "low"], SONNET = ["claude-sonnet-5-5", "medium"];

function call(name, fn, args) {
  const file = join(OUT, `${name}.json`);
  if (existsSync(file)) return Promise.resolve(JSON.parse(readFileSync(file, "utf8")));
  const ledger = join(OUT, `${name}.ledger.jsonl`);
  return new Promise((res) => {
    const p = spawn("baml", ["run", "--project", JUDGES, "--agent-skill-check", "off", "--output-format", "json", `judge.${fn}`, "--", "--plugin", PLUGIN, ...args, "--out_dir", OUT],
      { env: { ...process.env, MCD_LEDGER: ledger } });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => {
      let v = null; try { v = JSON.parse(out.slice(out.indexOf("{"))); } catch {}
      const cost = existsSync(ledger) ? readFileSync(ledger, "utf8").trim().split("\n").reduce((s, l) => s + (JSON.parse(l).cost || 0), 0) : null;
      const r = { name, fn, code, verdict: v, cost, error: v ? undefined : err.slice(-400) };
      if (v) writeFileSync(file, JSON.stringify(r, null, 1));
      res(r);
    });
  });
}

// --policy: Haiku pairs in both orders; only pairs whose two orders disagree go to Sonnet (both orders). No singles.
async function policy(s) {
  const card = (arm) => join(RUN, `${s}-${arm}`, "judge", "card.png");
  const brief = readFileSync(join(RUN, `${s}-${A}`, "brief.txt"), "utf8").trim();
  const both = (m, tag) => Promise.all([
    call(`${s}-pair-${A}L-${tag}`, "pair", ["--left", card(A), "--right", card(B), "--brief", brief, "--model", m[0], "--effort", m[1]]),
    call(`${s}-pair-${B}L-${tag}`, "pair", ["--left", card(B), "--right", card(A), "--brief", brief, "--model", m[0], "--effort", m[1]])]);
  // map Left/Right back to arms; agreement = both orders name the same arm (or both Tie)
  const pick = ([x, y], k) => { const a = { Left: A, Right: B, Tie: "tie" }[x.verdict?.[k]], b = { Left: B, Right: A, Tie: "tie" }[y.verdict?.[k]]; return a === b ? a : null; };
  const h = await both(HAIKU, "haiku");
  if (pick(h, "overall")) return { subject: s, overall: pick(h, "overall"), identity: pick(h, "identity"), by: "haiku", calls: h };
  const so = await both(SONNET, "sonnet");
  return { subject: s, overall: pick(so, "overall") ?? "contested", identity: pick(so, "identity") ?? pick(h, "identity") ?? "contested", by: "sonnet", calls: [...h, ...so] };
}
if (argv.includes("--policy")) {
  const rs = await Promise.all(SUBJECTS.map(policy));
  writeFileSync(join(OUT, "policy.json"), JSON.stringify(rs, null, 1));
  for (const r of rs) console.log(r.subject.padEnd(20), "overall:", r.overall, " identity:", r.identity, " decided by", r.by, " $" + r.calls.reduce((t, c) => t + (c.cost || 0), 0).toFixed(4));
  console.log("total $", rs.flatMap((r) => r.calls).reduce((t, c) => t + (c.cost || 0), 0).toFixed(3));
  process.exit(0);
}

const jobs = [];
for (const s of SUBJECTS) {
  const card = (arm) => join(RUN, `${s}-${arm}`, "judge", "card.png");
  const brief = readFileSync(join(RUN, `${s}-${A}`, "brief.txt"), "utf8").trim();
  for (const arm of [A, B]) {
    const g = (m) => ["--card", card(arm), "--brief", brief, "--model", m[0], "--effort", m[1]];
    jobs.push(call(`${s}-${arm}-glance-haiku`, "glance3", g(HAIKU)));
    if (SONNET_SINGLES.includes(s)) jobs.push(call(`${s}-${arm}-glance-sonnet`, "glance3", g(SONNET)));
  }
  jobs.push(call(`${s}-pair-${A}L-haiku`, "pair", ["--left", card(A), "--right", card(B), "--brief", brief, "--model", HAIKU[0], "--effort", HAIKU[1]]));
  jobs.push(call(`${s}-pair-${B}L-haiku`, "pair", ["--left", card(B), "--right", card(A), "--brief", brief, "--model", HAIKU[0], "--effort", HAIKU[1]]));
  jobs.push(call(`${s}-pair-${A}L-sonnet`, "pair", ["--left", card(A), "--right", card(B), "--brief", brief, "--model", SONNET[0], "--effort", SONNET[1]]));
  jobs.push(call(`${s}-pair-${B}L-sonnet`, "pair", ["--left", card(B), "--right", card(A), "--brief", brief, "--model", SONNET[0], "--effort", SONNET[1]]));
}
const results = await Promise.all(jobs);
writeFileSync(join(OUT, "summary.json"), JSON.stringify(results, null, 1));
for (const r of results) {
  const v = r.verdict || {};
  console.log(r.name.padEnd(34), r.fn === "pair" ? `id=${v.identity} craft=${v.craft} overall=${v.overall} ${v.margin}` : `${v.identity} / ${v.usability}`, r.cost?.toFixed(4), r.error ? "ERR " + r.error : "");
}
console.log("total $", results.reduce((s, r) => s + (r.cost || 0), 0).toFixed(3));
