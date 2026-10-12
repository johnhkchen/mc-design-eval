// Blind judging on existing builds: the judges never see the brief. Per build, a blind read (what is it? grades) on the
// eye-level card, then a text-only match of the guess to the subject; per pair, a blind compare in both orders by Haiku,
// with Sonnet (both orders) only where Haiku's two orders disagree. Scored against the owner's labels.json.
//   node benchmarks/plugin-baseline/blind.mjs [--run baseline-1] [--subjects a,b] [--arms stock,plugin] [--out blind-v2] [--match]
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SUBJECTS as ALL } from "../collection/subjects.mjs";
const JUDGES = new URL("../judges", import.meta.url).pathname; // the lab's judging instruments (BAML)

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = "/Volumes/ext1/swe/repos/minecraft-design";
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const RUN = join(HERE, "runs", opt("--run", "baseline-1"));
const SUBJECTS = opt("--subjects", Object.keys(ALL).join(",")).split(",");
const [A, B] = opt("--arms", "stock,plugin").split(",");
const OUT = join(RUN, opt("--out", "blind-v2"));   // blind = first prompt (v1, kept); blind-v2 = describe-first + weathering
mkdirSync(OUT, { recursive: true });
const HAIKU = ["haiku", "low"], SONNET = ["sonnet", "medium"];
const LABELS = existsSync(join(RUN, "labels.json")) ? JSON.parse(readFileSync(join(RUN, "labels.json"), "utf8")).pairs : {};

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
      const cost = existsSync(ledger) ? readFileSync(ledger, "utf8").trim().split("\n").filter(Boolean).reduce((s, l) => s + (JSON.parse(l).cost || 0), 0) : 0;
      const r = { name, fn, code, verdict: v, cost, error: v ? undefined : err.split("\n").filter((l) => l && !l.startsWith("warning")).slice(-4).join(" | ") };
      if (v) writeFileSync(file, JSON.stringify(r, null, 1));
      res(r);
    });
  });
}

const card = (s, arm) => join(RUN, `${s}-${arm}`, "judge", "card-eye.png");
async function read(s, arm) {
  const r = await call(`${s}-${arm}-read-haiku`, "read_blind", ["--card", card(s, arm), "--model", ...HAIKU.slice(0, 1), "--effort", HAIKU[1]]);
  const guess = r.verdict ? `${r.verdict.what} (${r.verdict.style})` : "";
  const m = guess && argv.includes("--match") ? await call(`${s}-${arm}-match`, "match_guess", ["--subject", `${ALL[s].name}: ${ALL[s].what}`, "--guess", guess]) : null;
  return { arm, what: r.verdict?.what, style: r.verdict?.style, texture: r.verdict?.texture, usability: r.verdict?.usability, fit: m?.verdict?.fit, cost: r.cost + (m?.cost || 0), error: r.error || m?.error };
}
async function pair(s) {
  const both = (m, tag) => Promise.all([
    call(`${s}-pair-${A}L-${tag}`, "pair_blind", ["--left", card(s, A), "--right", card(s, B), "--model", m[0], "--effort", m[1]]),
    call(`${s}-pair-${B}L-${tag}`, "pair_blind", ["--left", card(s, B), "--right", card(s, A), "--model", m[0], "--effort", m[1]])]);
  const pick = ([x, y]) => { const a = { Left: A, Right: B, Tie: "tie" }[x.verdict?.overall], b = { Left: B, Right: A, Tie: "tie" }[y.verdict?.overall]; return a && a === b ? a : null; };
  const h = await both(HAIKU, "haiku");
  if (pick(h)) return { winner: pick(h), by: "haiku", calls: h };
  const so = await both(SONNET, "sonnet");
  return { winner: pick(so) ?? "contested", by: "sonnet", calls: [...h, ...so] };
}

const rows = await Promise.all(SUBJECTS.map(async (s) => {
  const [ra, rb, p] = await Promise.all([read(s, A), read(s, B), pair(s)]);
  return { subject: s, label: LABELS[s], winner: p.winner, by: p.by, reads: [ra, rb], cost: ra.cost + rb.cost + p.calls.reduce((t, c) => t + (c.cost || 0), 0),
    errors: [ra.error, rb.error, ...p.calls.map((c) => c.error)].filter(Boolean) };
}));
writeFileSync(join(OUT, "summary.json"), JSON.stringify(rows, null, 1));
const cell = (x) => `${x.what} [${x.texture}, ${x.usability}]${x.fit ? ` (${x.fit})` : ""}`;
const L = [`| subject | owner | blind pick | by | ${A}: named as [texture, usability] | ${B}: named as [texture, usability] |`, "|---|---|---|---|---|---|"];
for (const r of rows) L.push(`| ${r.subject} | ${r.label ?? "-"} | ${r.winner} | ${r.by} | ${cell(r.reads[0])} | ${cell(r.reads[1])} |`);
const agree = rows.filter((r) => r.label && r.winner === r.label).length;
const fits = (arm) => rows.map((r) => r.reads.find((x) => x.arm === arm)?.fit);
L.push("", `Agreement with the owner: ${agree}/${rows.filter((r) => r.label).length}.`,
  ...(argv.includes("--match") ? [`Recognised blind (Exact or Close): ${A} ${fits(A).filter((f) => f === "Exact" || f === "Close").length}/${rows.length}, ${B} ${fits(B).filter((f) => f === "Exact" || f === "Close").length}/${rows.length}.`] : []),
  `Cost: $${rows.reduce((t, r) => t + r.cost, 0).toFixed(3)}.`);
writeFileSync(join(OUT, "results.md"), L.join("\n") + "\n");
console.log(L.join("\n"));
for (const r of rows) if (r.errors.length) console.log("ERR", r.subject, r.errors.join(" ; "));
