// Taste profiles: one person's blind pairwise picks turned into weights over measured features (L0 code metrics,
// L1 observations, L1 look reads), so "better" is relative to a named profile, not a universal score.
//   node benchmarks/plugin-baseline/profiles.mjs fit [--profile owner]      gather features, fit, nested-LOO, save
//   node benchmarks/plugin-baseline/profiles.mjs review <subject-arm> [--profile owner]   what this person would change
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { l0, PLUGIN } from "./l0.mjs";
import { SCHEMES } from "./schemes.mjs";
import { features, reviewOf } from "./profile-lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUN = join(HERE, "runs", "baseline-1");
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const NAME = opt("--profile", "owner") + (argv.includes("--free") && argv[0] === "fit" ? "-free" : "");
const PDIR = join(HERE, "profiles");
mkdirSync(PDIR, { recursive: true });
const read = (f) => JSON.parse(readFileSync(f, "utf8"));

// ---- labelled pairs (winner, loser) from every label set this person made
function pairsOf() {
  const out = [];
  const l1 = read(join(RUN, "labels.json")).pairs;                          // set 1: stock vs plugin, value = winning arm
  for (const [s, w] of Object.entries(l1)) out.push({ set: 1, s, win: `${s}-${w}`, lose: `${s}-${w === "plugin" ? "stock" : "plugin"}` });
  const p2 = read(join(RUN, "pairs-2.json")).pairs, l2 = read(join(RUN, "labels-2.json"));
  for (const p of p2) { const k = l2.picks[p.id]; if (k === "tie") continue; out.push({ set: 2, id: p.id, s: p.subject, win: `${p.subject}-${p[k]}`, lose: `${p.subject}-${p[k === "A" ? "B" : "A"]}`, note: l2.notes?.[p.id] }); }
  return out;
}

// ---- L1 look reads (one Haiku call per build, cached; first call warms the prompt cache)
const LOOK = join(RUN, "look");
mkdirSync(LOOK, { recursive: true });
function lookCall(b) {
  const file = join(LOOK, `${b}.json`);
  if (existsSync(file)) return Promise.resolve(read(file));
  const ledger = join(LOOK, `${b}.ledger.jsonl`);
  return new Promise((res) => {
    const p = spawn("baml", ["run", "--project", PLUGIN, "--agent-skill-check", "off", "--output-format", "json", "judge.look", "--", "--plugin", PLUGIN,
      "--card", join(RUN, b, "judge", "card-eye.png"), "--model", "claude-haiku-5-5", "--effort", "low", "--out_dir", LOOK], { env: { ...process.env, MCD_LEDGER: ledger } });
    let out = ""; p.stdout.on("data", (d) => (out += d));
    p.on("close", () => {
      let v = null; try { v = JSON.parse(out.slice(out.indexOf("{"))); } catch {}
      const cost = existsSync(ledger) ? readFileSync(ledger, "utf8").trim().split("\n").filter(Boolean).reduce((t, l) => t + (JSON.parse(l).cost || 0), 0) : 0;
      const r = { look: v, cost }; if (v) writeFileSync(file, JSON.stringify(r, null, 1)); res(r);
    });
  });
}

// ---- L1 observations already made (layered-v2 first, then layered v1), averaged over passes
function obsOf(b) {
  const got = [];
  for (const d of ["layered-v2", "layered"]) for (const i of [1, 2]) { const f = join(RUN, d, `${b}-haiku-${i}.json`); if (existsSync(f)) { const o = read(f).obs; if (o) got.push(o); } }
  return got;
}
// ---- direction priors: a good thing may only add, a fault may only subtract; taste-dependent features are free.
// With few labels this keeps the learned weights (and so the review's advice) from pointing the wrong way.
const SIGN = { valid: 1, stray: -1, blankWalls: -1, paletteFlags: -1, wallGaps: -1, lidRoof: -1, oddElement: -1,
  harmony: 1, colourInterest: 1, formInterest: 1, detailFinesse: 1, grounded: 1, readsClearly: 1, massing: 1, depth: 1,
  overhang: 1, shapedRoof: 1, door: 1, windows: 1, props: 1, sign: 1, detailShare: 1, stairShare: 1, slabShare: 1, fenceWallTrapShare: 1,
  rooflineVariety: 1, visibleMaterials: 0, hueFamilies: 0, neutralShare: 0, satMean: 0, lumStd: 0, wallRoofContrast: 0,
  agedShare: 0, weathering: 0, footprintFill: 0, heightToWidth: 0 };
let SIGNS = null;   // set to feature order before fitting
// ---- pairwise logistic (Bradley-Terry) on standardised feature differences, L2, no intercept, sign-projected
function fit(X, lambda, iters = 3000, lr = 0.05) {
  const d = X[0].length, w = new Array(d).fill(0);
  for (let t = 0; t < iters; t++) {
    const g = w.map((wi) => lambda * wi);
    for (const x of X) { const z = x.reduce((s, xi, i) => s + xi * w[i], 0), p = 1 / (1 + Math.exp(-z)); for (let i = 0; i < d; i++) g[i] -= (1 - p) * x[i] / X.length; }
    for (let i = 0; i < d; i++) { w[i] -= lr * g[i]; if (SIGNS) { if (SIGNS[i] > 0 && w[i] < 0) w[i] = 0; if (SIGNS[i] < 0 && w[i] > 0) w[i] = 0; } }
  }
  return w;
}
const predict = (w, x) => x.reduce((s, xi, i) => s + xi * w[i], 0);
const LAMBDAS = [0.01, 0.03, 0.1, 0.3, 1, 3];
function looAcc(X, lambda) { let ok = 0; X.forEach((x, i) => { const w = fit(X.filter((_, j) => j !== i), lambda); if (predict(w, x) > 0) ok++; }); return ok / X.length; }
function bestLambda(X) { let best = LAMBDAS[0], acc = -1; for (const l of LAMBDAS) { const a = looAcc(X, l); if (a > acc) { acc = a; best = l; } } return { lambda: best, acc }; }

// ---- the person's own criteria, from their notes (kept verbatim; the review cites them)
const CRITERIA = [
  { key: "colour", words: ["color", "colour", "colors"], features: ["harmony", "colourInterest", "hueFamilies", "lumStd", "paletteFlags"], say: "colour: a deliberate, interesting palette" },
  { key: "form", words: ["shape", "form", "forms", "whimsical"], features: ["formInterest", "massing", "rooflineVariety", "heightToWidth"], say: "form: distinctive, clear shapes" },
  { key: "detail", words: ["detail", "details", "stair", "depth"], features: ["detailFinesse", "stairShare", "slabShare", "depth", "detailShare"], say: "detail: small blocks used well (stairs, depth)" },
  { key: "texture", words: ["texture", "textures", "realism"], features: ["colourInterest", "agedShare", "weathering", "visibleMaterials"], say: "texture and realism" },
  { key: "sense", words: ["foundation", "flag", "reads", "workshop"], features: ["grounded", "oddElement", "readsClearly"], say: "it makes sense: grounded, nothing odd, reads as what it is" },
];

const cmd = argv[0];
if (cmd === "fit") {
  const pairs = pairsOf(), builds = [...new Set(pairs.flatMap((p) => [p.win, p.lose]))];
  const first = await lookCall(builds[0]);
  const looks = Object.fromEntries(await Promise.all(builds.map(async (b) => [b, b === builds[0] ? first : await lookCall(b)])));
  const F = Object.fromEntries(builds.map((b) => [b, features(b, l0(join(RUN, b)), obsOf(b), looks[b]?.look)]));
  const names = Object.keys(F[builds[0]]);
  SIGNS = argv.includes("--free") ? null : names.map((n) => SIGN[n] ?? 0);
  const mean = names.map((n) => builds.reduce((t, b) => t + F[b][n], 0) / builds.length);
  const sd = names.map((n, i) => Math.sqrt(builds.reduce((t, b) => t + (F[b][n] - mean[i]) ** 2, 0) / builds.length) || 1);
  const z = (b) => names.map((n, i) => (F[b][n] - mean[i]) / sd[i]);
  const X = pairs.map((p) => z(p.win).map((v, i) => v - z(p.lose)[i]));

  // honest estimate: nested LOO (lambda chosen inside each fold)
  let nested = 0, nested2 = 0;
  X.forEach((x, i) => { const rest = X.filter((_, j) => j !== i), { lambda } = bestLambda(rest); if (predict(fit(rest, lambda), x) > 0) { nested++; if (pairs[i].set === 2) nested2++; } });
  // confound checks: (a) "the arm with more help wins" (plugin > plain > described > stock) needs no features at all;
  // (b) train on set 1 only (all stock vs plugin), test on set 2
  const RANK = { stock: 0, described: 1, sized: 2, plain: 3, plugin: 4 }, arm = (b) => b.split("-").pop();
  const armHits = pairs.filter((p) => RANK[arm(p.win)] > RANK[arm(p.lose)]).length, armHits2 = pairs.filter((p) => p.set === 2 && RANK[arm(p.win)] > RANK[arm(p.lose)]).length;
  const X1 = X.filter((_, i) => pairs[i].set === 1), X2 = X.filter((_, i) => pairs[i].set === 2);
  const w1 = fit(X1, bestLambda(X1).lambda), transfer = X2.filter((x) => predict(w1, x) > 0).length;
  const { lambda, acc } = bestLambda(X), w = fit(X, lambda);
  const ranked = names.map((n, i) => ({ feature: n, weight: +w[i].toFixed(3) })).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  // baselines on the same pairs: pre-registered schemes, and the best single feature (chosen with hindsight)
  const schemeAcc = Object.fromEntries(Object.entries(SCHEMES).map(([k]) => [k, null]));
  const single = names.map((n, i) => ({ n, a: X.filter((x) => x[i] > 0).length / X.length })).sort((a, b) => b.a - a.a)[0];
  const profile = {
    name: NAME, version: 1, created: new Date().toISOString().slice(0, 10),
    labels: { sets: ["labels.json (set 1, 8 pairs)", "labels-2.json (set 2, 11 decisive pairs)"], pairs: pairs.length },
    criteria: CRITERIA.map(({ key, say, features }) => ({ key, say, features, quotes: pairs.filter((p) => p.note && CRITERIA.find((c) => c.key === key).words.some((wd) => p.note.toLowerCase().includes(wd))).map((p) => p.note) })),
    model: { kind: "pairwise logistic on standardised feature differences, sign-constrained", signs: Object.fromEntries(names.map((n) => [n, SIGN[n] ?? 0])), lambda, features: names, mean, sd, weights: Object.fromEntries(names.map((n, i) => [n, w[i]])) },
    accuracy: { nestedLOO: `${nested}/${X.length}`, nestedLOO_set2: `${nested2}/${X2.length}`, armOrderBaseline: `${armHits}/${X.length}`, armOrderBaseline_set2: `${armHits2}/${X2.length}`,
      trainSet1_testSet2: `${transfer}/${X2.length}`, inSampleLOO_tunedLambda: `${Math.round(acc * X.length)}/${X.length}`, bestSingleFeatureHindsight: `${single.n} ${Math.round(single.a * X.length)}/${X.length}` },
    top: ranked.slice(0, 12),
    cost: Object.values(looks).reduce((t, r) => t + (r?.cost || 0), 0),
  };
  writeFileSync(join(PDIR, `${NAME}.json`), JSON.stringify(profile, null, 1));
  writeFileSync(join(PDIR, `${NAME}-features.json`), JSON.stringify(F, null, 1));
  console.log(JSON.stringify({ accuracy: profile.accuracy, lambda, top: profile.top, lookCost: +profile.cost.toFixed(3) }, null, 1));
}

if (cmd === "review") {
  const b = argv[1], P = read(join(PDIR, `${NAME}.json`)), F = read(join(PDIR, `${NAME}-features.json`));
  const f = F[b] || features(b, l0(join(RUN, b)), obsOf(b), existsSync(join(LOOK, `${b}.json`)) ? read(join(LOOK, `${b}.json`)).look : null);
  console.log(JSON.stringify({ build: b, profile: NAME, ...reviewOf(f, P) }, null, 1));
}
