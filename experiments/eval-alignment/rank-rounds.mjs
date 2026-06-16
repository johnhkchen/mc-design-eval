#!/usr/bin/env node
/**
 * EXPERIMENT (E-38 falsification, 2026-06-15): does the workshop's progress signal track quality?
 *
 * The frozen instrument is categorical (same-object/drifted) and cannot rank. The workshop climbs
 * ONLY conformanceScore = {passed, findings} with a no-regress rollback, so round order is
 * conformance-monotonic BY CONSTRUCTION (loop.mjs isRegression): round-1 <= ... <= final on the
 * only signal the system optimizes. This script asks an INDEPENDENT quality ranker (a DIFFERENT
 * model than the pinned opus-4-8 identity judge; quality task, not identity) to rank the round
 * renders blind (shuffled, so image order != round order), then correlates that quality ranking
 * against round order.
 *
 * FALSIFIABLE CLAIM: Spearman rho(round-order, quality-rank) <= 0.30 — the progress the system
 * climbs is decoupled from perceived quality. rho >= 0.70 falsifies it (the gate tracks quality
 * better than claimed). This is NOT the frozen instrument and writes nothing under measurements/.
 *
 * Honest limits (reported, per anti-hedge): (1) the quality ranker is itself an UNVALIDATED LLM —
 * the human (reviewer) blind-ranks a contested subset next to validate it; this run measures
 * gate-vs-independent-LLM, the cheap proxy. (2) one azimuth (+x+z) per round; multi-view is a
 * follow-up. (3) N=3 samples per subject — a variance read, not a tight CI.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const RANKER_MODEL = "claude-sonnet-4-6"; // independent of the pinned opus-4-8 identity judge
const SAMPLES = 3;
const VIEW = "view-+x+z.png"; // one consistent azimuth across rounds (first-pass; multi-view later)

const SUBJECTS = {
  cottage: {
    concept: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png",
    buildsDir: "builds/cottage",
  },
  barn: {
    concept: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png",
    buildsDir: "builds/barn",
  },
};

const LABELS = "ABCDEFGHIJ".split("");

function roundsOf(buildsDir) {
  const dirs = readdirSync(join(ROOT, buildsDir), { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^round-\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]));
  const ordered = [...dirs];
  if (existsSync(join(ROOT, buildsDir, "final", VIEW))) ordered.push("final");
  // round-order index = the workshop's monotonic progress order (earliest=1 .. final=N)
  return ordered.map((name, i) => ({ name, order: i + 1, view: join(buildsDir, name, VIEW) }));
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// tiny seeded PRNG so each sample's shuffle is recorded & reproducible
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function img(path) {
  return { data: readFileSync(join(ROOT, path)), mediaType: "image/png" };
}

function buildPrompt(labels) {
  return [
    "You are judging the QUALITY of Minecraft builds, not their identity. Image 1 is a CONCEPT",
    "(the target a builder was trying to recreate in Minecraft). The remaining images are candidate",
    `Minecraft builds, one per build, labeled ${labels.join(", ")} in the order shown after the concept.`,
    "",
    "Score each build 0-100 on how GOOD a realization of the concept it is — judge proportion/massing,",
    "roof form, surface relief and detail, material/craft, and overall resemblance to the concept as a",
    "skilled builder would. A boxy, flat, or roofless build scores low even if it has the right blocks.",
    "Differences between builds may be subtle — do not assume any ordering; judge each on its merits.",
    "",
    "Output ONE JSON object, nothing else:",
    '{"scores": {"A": <int 0-100>, ...one per build label...},',
    ' "ranking": [<labels best-to-worst>],',
    ' "rationale": "<one sentence on what separated the best from the worst>"}',
  ].join("\n");
}

function parseJson(text) {
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("no JSON object in reply");
  return JSON.parse(text.slice(s, e + 1));
}

/** Spearman rho via Pearson on ranks (handles ties by average rank). */
function spearman(xs, ys) {
  const rank = (vals) => {
    const idx = vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const r = new Array(vals.length);
    let i = 0;
    while (i < idx.length) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
      i = j + 1;
    }
    return r;
  };
  const rx = rank(xs), ry = rank(ys);
  const n = xs.length;
  const mean = (a) => a.reduce((s, v) => s + v, 0) / n;
  const mx = mean(rx), my = mean(ry);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { num += (rx[i] - mx) * (ry[i] - my); dx += (rx[i] - mx) ** 2; dy += (ry[i] - my) ** 2; }
  return dx === 0 || dy === 0 ? 0 : num / Math.sqrt(dx * dy);
}

async function runSubject(key) {
  const def = SUBJECTS[key];
  const rounds = roundsOf(def.buildsDir);
  console.error(`\n[${key}] ${rounds.length} rounds: ${rounds.map((r) => r.name).join(", ")}`);
  const conceptImg = img(def.concept);
  const samples = [];
  for (let s = 0; s < SAMPLES; s++) {
    const rng = mulberry32(1000 + s);
    const shown = shuffle(rounds, rng); // image order != round order (unbias)
    const labels = shown.map((_, i) => LABELS[i]);
    const labelToOrder = Object.fromEntries(shown.map((r, i) => [labels[i], r.order]));
    const labelToName = Object.fromEntries(shown.map((r, i) => [labels[i], r.name]));
    const images = [conceptImg, ...shown.map((r) => img(r.view))];
    const { text } = await requestTextWithImage({ prompt: buildPrompt(labels), images, model: RANKER_MODEL });
    const out = parseJson(text);
    // correlate quality score with round order across the labels we presented
    const presentLabels = labels.filter((l) => out.scores && out.scores[l] != null);
    const orders = presentLabels.map((l) => labelToOrder[l]);
    const quality = presentLabels.map((l) => out.scores[l]);
    const rho = spearman(orders, quality);
    const byRound = Object.fromEntries(presentLabels.map((l) => [labelToName[l], out.scores[l]]));
    samples.push({ sample: s, rho, scoresByRound: byRound, rationale: out.rationale });
    console.error(`  sample ${s}: rho(round-order, quality)=${rho.toFixed(3)} | ${out.rationale ?? ""}`);
  }
  const rhos = samples.map((x) => x.rho);
  const meanRho = rhos.reduce((a, b) => a + b, 0) / rhos.length;
  return { subject: key, rounds: rounds.map((r) => r.name), rankerModel: RANKER_MODEL, view: VIEW, samples, meanRho, rhos };
}

async function main() {
  const which = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const keys = which ? [which] : Object.keys(SUBJECTS);
  const results = [];
  for (const k of keys) results.push(await runSubject(k));
  const outDir = join(HERE, "results");
  mkdirSync(outDir, { recursive: true });
  const stamp = process.argv.includes("--stamp") ? process.argv[process.argv.indexOf("--stamp") + 1] : "latest";
  const payload = { schema: "eval-alignment/round-rank/v1", claim: "spearman(round-order, quality) <= 0.30", rankerModel: RANKER_MODEL, samples: SAMPLES, results };
  writeFileSync(join(outDir, `round-rank-${stamp}.json`), JSON.stringify(payload, null, 2));
  console.error("\n================ RESULT ================");
  for (const r of results) {
    console.error(`${r.subject}: mean rho = ${r.meanRho.toFixed(3)}  (samples: ${r.rhos.map((x) => x.toFixed(2)).join(", ")})`);
  }
  const allRho = results.flatMap((r) => r.rhos);
  const overall = allRho.reduce((a, b) => a + b, 0) / allRho.length;
  console.error(`OVERALL mean rho = ${overall.toFixed(3)}`);
  console.error(overall <= 0.3 ? "→ CLAIM HOLDS: progress decoupled from quality." : overall >= 0.7 ? "→ CLAIM FALSIFIED: progress tracks quality (I was wrong)." : "→ MIDDLE: partial coupling — refine.");
  console.error("========================================");
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
