// Seal a profile's predictions for a labelling set before the labels exist: blind observations (ObserveBuild x2,
// ObserveLook) + L0 for every build, then each profile's pick per pair. Later: --score compares with the labels.
//   node benchmarks/plugin-baseline/predict.mjs --set runs/labels-3 [--pairs pairs-3.json] [--profiles owner,owner-free] [--score labels-3.json]
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { l0, PLUGIN } from "./l0.mjs";
import { features, reviewOf } from "./profile-lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const SET = join(HERE, opt("--set", "runs/labels-3"));
const PROFILES = opt("--profiles", "owner,owner-free").split(",");
const { pairs } = JSON.parse(readFileSync(join(SET, opt("--pairs", "pairs-3.json")), "utf8"));
const read = (f) => JSON.parse(readFileSync(f, "utf8"));

function baml(fn, dir, tag) {
  const file = join(dir, `${tag}.json`);
  if (existsSync(file)) return Promise.resolve(read(file));
  return new Promise((res) => {
    const p = spawn("baml", ["run", "--project", PLUGIN, "--agent-skill-check", "off", "--output-format", "json", `judge.${fn}`, "--", "--plugin", PLUGIN,
      "--card", join(dir, "card-eye.png"), "--model", "claude-haiku-5-5", "--effort", "low", "--out_dir", dir], { env: { ...process.env, MCD_LEDGER: join(dir, "ledger.jsonl") } });
    let out = ""; p.stdout.on("data", (d) => (out += d));
    p.on("close", () => { let v = null; try { v = JSON.parse(out.slice(out.indexOf("{"))); } catch {} if (v) writeFileSync(file, JSON.stringify(v)); res(v); });
  });
}
const builds = [...new Set(pairs.flatMap((p) => [`${p.subject}-${p.A}`, `${p.subject}-${p.B}`]))];
await baml("observe", join(SET, builds[0]), "obs-1");   // warm the cache
const F = Object.fromEntries(await Promise.all(builds.map(async (b) => {
  const d = join(SET, b), [o1, o2, look] = await Promise.all([baml("observe", d, "obs-1"), baml("observe", d, "obs-2"), baml("look", d, "look")]);
  return [b, features(b, l0(d), [o1, o2].filter(Boolean), look)];
})));
const cost = builds.reduce((t, b) => { const f = join(SET, b, "ledger.jsonl"); return t + (existsSync(f) ? readFileSync(f, "utf8").trim().split("\n").filter(Boolean).reduce((s, l) => s + (JSON.parse(l).cost || 0), 0) : 0); }, 0);

const out = { sealed: new Date().toISOString(), profiles: {}, cost: +cost.toFixed(3) };
for (const name of PROFILES) {
  const P = read(join(HERE, "profiles", `${name}.json`));
  out.profiles[name] = pairs.map((p) => {
    const a = reviewOf(F[`${p.subject}-${p.A}`], P).score, b = reviewOf(F[`${p.subject}-${p.B}`], P).score;
    return { id: p.id, pick: Math.abs(a - b) < 0.25 ? "tie" : a > b ? "A" : "B", a, b };
  });
}
// a no-feature baseline for same-method pairs: "the later version wins" (v2 over v1, v2 over v2old, iterated over plugin over stock)
const ORDER = { v1: 0, v2old: 1, v2: 2, v3: 3, stock: -1, plugin: 1, iterated: 2 };
out.laterWins = pairs.map((p) => ({ id: p.id, pick: ORDER[p.A] > ORDER[p.B] ? "A" : "B" }));
const sealed = join(SET, "predictions.json");
if (!argv.includes("--score")) { writeFileSync(sealed, JSON.stringify(out, null, 1)); writeFileSync(join(SET, "features.json"), JSON.stringify(F, null, 1)); console.log(`sealed ${pairs.length} predictions for ${PROFILES.join(", ")}; observation cost $${out.cost}`); process.exit(0); }

const S = read(sealed), L = read(join(SET, opt("--score", "labels-3.json"))).picks;
const rows = pairs.map((p) => ({ ...p, owner: L[p.id] }));
const acc = (preds) => { const m = Object.fromEntries(preds.map((x) => [x.id, x.pick])); const d = rows.filter((r) => r.owner !== "tie"); return `${d.filter((r) => m[r.id] === r.owner).length}/${d.length}`; };
console.log(JSON.stringify({ ...Object.fromEntries(Object.entries(S.profiles).map(([k, v]) => [k, acc(v)])), laterWins: acc(S.laterWins) }));
for (const r of rows) console.log(r.id, r.subject.padEnd(19), `${r.A}/${r.B}`.padEnd(16), "owner", r.owner.padEnd(4), Object.entries(S.profiles).map(([k, v]) => `${k}=${v.find((x) => x.id === r.id).pick}`).join(" "), "later=" + S.laterWins.find((x) => x.id === r.id).pick, "|", r.kind);
