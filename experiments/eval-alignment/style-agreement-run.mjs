#!/usr/bin/env node
/**
 * STYLE-AGREEMENT RUN (T-184-01, story S-184, epic E-46) — the metered harness that turns the S-183 corpus
 * + the recalibrated style-distance term into the GO/NO-GO evidence S-185 acts on. Three outputs joined by
 * the PURE core (src/workshop/style-agreement.mjs):
 *   1. score EACH corpus state once (VOTES-averaged) with the term (diagnose → styleFidelityScore);
 *   2. LABEL each curated pair — HUMAN if labels.human.json is present (the gate), else the LLM-PROXY
 *      fallback (a holistic glance judge, INDEPENDENT of the term) explicitly flagged non-licensing;
 *   3. report the pack-vs-concept-image decomposition, term-vs-label agreement (overall + easy + hardMiddle
 *      SEPARATELY), inter-label self-consistency, rank concordance, and the recommendation.
 *
 * Generalizes T-182-01's single-subject A/B/C-control to a population. Asset-guard-before-spend; GUARD_ONLY=1
 * exits clean; VOTES default 6 (T-182's confirmation level); no re-ask on malformed (a zero-token notice reply
 * only burns budget — spend-limit-reply-failure-mode). Metered. NOT in `npm test`. NOTHING under measurements/.
 *
 *   VOTES=6 node experiments/eval-alignment/style-agreement-run.mjs
 *   GUARD_ONLY=1 node experiments/eval-alignment/style-agreement-run.mjs   # guard + load only, no spend
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { bamlRender, bamlParse } from "../../src/baml/bridge.mjs";
import { diagnoseRenderArgs } from "../../src/workshop/diagnose.mjs";
import { critiqueEvidence, itemStyleClass, styleFidelityScore } from "../../src/workshop/bakeoff-score.mjs";
import { loadStyleCorpus } from "../../src/workshop/style-corpus.mjs";
import {
  packVsConceptDecomposition, pairwiseAgreement, interLabelAgreement, rankConcordance,
  recommendation, termPairVerdict, STYLE_AGREEMENT_SCHEMA,
} from "../../src/workshop/style-agreement.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const LABELS_DIR = join(ROOT, "experiments/eval-alignment/corpus/labels");
const PAIRS_PATH = join(LABELS_DIR, "pairs.json");
const HUMAN_PATH = join(LABELS_DIR, "labels.human.json");
const INSTRUMENT_DIR = join(LABELS_DIR, "instrument");
const RESULTS = join(ROOT, "experiments/eval-alignment/results/style-agreement.json");
const TIER = "strong";
const VOTES = Number(process.env.VOTES ?? 6);
const GUARD_ONLY = process.env.GUARD_ONLY === "1";
const azimuths = [...MULTI_ANGLE_GATE.azimuths];

// ---- per-SUBJECT programs (Decision 2) — the recognized "what the build SHOULD read as", held CONSTANT
// across that subject's pack/concept conditions so (pack, concept) are the only varied factors. The gatehouse
// is the referee's synthetic PROGRAM VERBATIM (preserves T-182 comparability: gh-match == A-matched); cottage
// and barn load their real recognition programs (per-subject-valid; the corpus carries no per-state program).
const GATEHOUSE_PROGRAM = Object.freeze({
  reading: { summary: "A small square stone gatehouse: thick masonry walls, a steep gabled roof, and a single arched gate on the front." },
  masses: [{ id: "gatehouse", role: "gatehouse", roof: { idiom: "roof.gable", pitchClass: 2 }, walls: { role: "wall.stone" }, openings: [{ kind: "gate", treatment: "arch", at: "front" }] }],
});
const loadProgram = (subject) => {
  const p = JSON.parse(readFileSync(join(ROOT, `benchmarks/sculpture/recognition/${subject}.program.json`), "utf8"));
  return { reading: p.reading, masses: p.masses };
};
const SUBJECT_PROGRAMS = {
  gatehouse: GATEHOUSE_PROGRAM,
  cottage: loadProgram("cottage"),
  barn: loadProgram("barn"),
};

// ---- small local helpers (the referee idiom — kept local, tiny) ----
const toB64 = async (p) => {
  const buf = await readFile(p);
  const mediaType = buf.slice(0, 3).toString("hex") === "ffd8ff" ? "image/jpeg" : "image/png";
  return { base64: buf.toString("base64"), mediaType };
};
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const std = (a) => { const m = mean(a); return a.length ? Math.sqrt(mean(a.map((v) => (v - m) ** 2))) : 0; };
const round = (x) => Math.round(x);
const itemsOf = (critique) => (critique?.items ?? []).map((it) => ({
  department: it.department, severity: it.severity, present: it.present ?? "", missing: it.missing ?? "",
  kind: it.kind ?? null, styleClass: itemStyleClass(it),
}));
const renderB64s = async (renderDir) => Promise.all(azimuths.map((a) => toB64(join(ROOT, renderDir, `view-${a}.png`))));

/** One DiagnoseBuild → {ev, items, score}. No re-ask (a malformed reply burns budget). */
async function diagnose({ program, pack, concept, renders }) {
  const args = diagnoseRenderArgs({ program, pack, azimuths });
  const { prompt, images } = await bamlRender({ fn: "DiagnoseBuild", args, images: { concept, renders } });
  const { text } = await runTieredOp({ tier: TIER, prompt, images });
  const critique = await bamlParse({ fn: "DiagnoseBuild", text });
  return { ev: critiqueEvidence(critique), items: itemsOf(critique), score: styleFidelityScore(critique) };
}

/** The INDEPENDENT proxy glance judge — NOT the term: no pack, no score, no DiagnoseBuild. One composite in,
 *  a pairwise pick out. Tolerant JSON extraction; null (dropped) on malformed (no re-ask). */
const PROXY_PROMPT = [
  "You are shown a single image with TWO panels separated by a gap.",
  "LEFT panel: build A rendered beside ITS OWN target concept image.",
  "RIGHT panel: build B rendered beside ITS OWN target concept image.",
  "Each build has a DIFFERENT target. Judge the GLANCE: which build more faithfully realizes ITS OWN concept",
  "image — its form, roof, walls, and openings looking like its picture? Ignore which picture you prefer.",
  'Answer ONLY compact JSON: {"pick":"A"|"B"|"tie","reason":"<one short clause>"}.',
].join("\n");
async function proxyJudge(compositePath) {
  const img = await toB64(compositePath);
  const { text } = await runTieredOp({ tier: TIER, prompt: PROXY_PROMPT, images: [img] });
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const pick = JSON.parse(m[0]).pick;
    return ["A", "B", "tie"].includes(pick) ? pick : null;
  } catch { return null; }
}

async function main() {
  await mkdir(dirname(RESULTS), { recursive: true });
  const corpus = loadStyleCorpus();
  const byId = Object.fromEntries(corpus.states.map((s) => [s.id, s]));
  const pairs = JSON.parse(readFileSync(PAIRS_PATH, "utf8")).pairs;

  // ---- asset guard BEFORE any spend ----
  const guard = new Set();
  for (const s of corpus.states) {
    for (const a of azimuths) guard.add(join(ROOT, s.renderDir, `view-${a}.png`));
    guard.add(join(ROOT, s.pack)); guard.add(join(ROOT, s.concept));
  }
  for (const p of pairs) guard.add(join(INSTRUMENT_DIR, `${p.id}.png`));
  for (const f of guard) if (!existsSync(f)) throw new Error(`missing asset: ${f} (run npm run style:label first?)`);
  console.log(`[guard] ${guard.size} assets present; ${corpus.states.length} states, ${pairs.length} pairs, VOTES=${VOTES}`);
  if (GUARD_ONLY) { console.log("[guard] GUARD_ONLY — no spend; exiting clean."); return; }

  // ---- 1. score each state once (VOTES-averaged) ----
  const scoredStates = [];
  const scoreById = {};
  for (const s of corpus.states) {
    const program = SUBJECT_PROGRAMS[s.subject];
    if (!program) throw new Error(`no SUBJECT_PROGRAM for subject "${s.subject}"`);
    const pack = loadStylePack(join(ROOT, s.pack));
    const concept = await toB64(join(ROOT, s.concept));
    const renders = await renderB64s(s.renderDir);
    const votes = [];
    for (let v = 0; v < VOTES; v++) {
      const d = await diagnose({ program, pack, concept, renders });
      votes.push(d);
      console.log(`[score] ${s.id} v${v + 1}: score=${d.score} nWrongStyle=${d.ev.nWrongStyle}/${d.items.length} breadth=${d.ev.wrongStyleBreadth}`);
    }
    const voteScores = votes.map((x) => x.score);
    const score = round(mean(voteScores));
    scoreById[s.id] = score;
    scoredStates.push({
      id: s.id, subject: s.subject, cellType: s.cellType, pack: s.pack, intendedFaithfulness: s.intendedFaithfulness,
      score, scoreStd: round(std(voteScores)), votes: voteScores, items: votes[0].items,
    });
  }

  // ---- 2. labels: HUMAN gate if present, else the flagged LLM-PROXY fallback ----
  let labelSource, licensing, labelById = {}, perPairVotes = {}, humanNote;
  if (existsSync(HUMAN_PATH)) {
    const human = JSON.parse(readFileSync(HUMAN_PATH, "utf8"));
    for (const p of human.pairs ?? []) if (["A", "B", "tie"].includes(p.humanLabel)) labelById[p.id] = p.humanLabel;
    labelSource = "human"; licensing = true;
    humanNote = `human labels read from ${HUMAN_PATH.replace(ROOT, "")} (${Object.keys(labelById).length}/${pairs.length})`;
    console.log(`[label] ${humanNote}`);
  } else {
    labelSource = "llm-proxy"; licensing = false;
    humanNote = "NO labels.human.json — LLM-proxy fallback used. NON-LICENSING: a proxy panel can REFUTE but never LICENSE a promotion. The human labels remain S-185's gate.";
    for (const p of pairs) {
      const votes = [];
      for (let v = 0; v < VOTES; v++) {
        const pick = await proxyJudge(join(INSTRUMENT_DIR, `${p.id}.png`));
        if (pick) votes.push(pick);
        console.log(`[proxy] ${p.id} v${v + 1}: ${pick ?? "DROPPED(malformed)"}`);
      }
      perPairVotes[p.id] = votes;
      if (votes.length) {
        const counts = {};
        for (const x of votes) counts[x] = (counts[x] ?? 0) + 1;
        labelById[p.id] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      }
    }
  }

  // ---- 3. join through the pure core ----
  const decomposition = packVsConceptDecomposition(scoredStates);
  const agreement = pairwiseAgreement(pairs, scoreById, labelById);
  const interLabel = labelSource === "llm-proxy" ? interLabelAgreement(perPairVotes, pairs) : null;
  const concordance = rankConcordance(pairs, scoreById, labelById);
  const rec = recommendation({ decomposition, agreement, interLabel: interLabel ?? { verdict: "" }, licensing });

  // per-pair audit (term pick vs intended vs label) for the report
  const pairAudit = pairs.map((p) => ({
    id: p.id, bucket: p.bucket, a: p.a, b: p.b, intended: p.intended,
    termPick: termPairVerdict(p, scoreById), scoreA: scoreById[p.a], scoreB: scoreById[p.b],
    label: labelById[p.id] ?? null, proxyVotes: perPairVotes[p.id] ?? null,
  }));

  await writeFile(RESULTS, JSON.stringify({
    schema: STYLE_AGREEMENT_SCHEMA, tier: TIER, votes: VOTES, labelSource, licensing, labelNote: humanNote,
    scoredStates, decomposition, agreement, interLabel, concordance, recommendation: rec, pairAudit,
  }, null, 2) + "\n");

  console.log("\n================ STYLE-AGREEMENT VERDICT ================");
  console.log(`DECOMPOSITION: conceptImageEffect=${decomposition.conceptImageEffect} packEffect=${decomposition.packEffect} -> ${decomposition.verdict}`);
  console.log(`AGREEMENT:     overall ${agreement.overall.agree}/${agreement.overall.n}  easy ${agreement.byBucket.easy.agree}/${agreement.byBucket.easy.n}  hardMiddle ${agreement.byBucket.hardMiddle.agree}/${agreement.byBucket.hardMiddle.n}`);
  if (interLabel) console.log(`INTER-LABEL:   ${interLabel.verdict}`);
  console.log(`CONCORDANCE:   tau=${concordance.tau} (C=${concordance.concordant} D=${concordance.discordant})`);
  console.log(`LABELS:        ${labelSource} (licensing=${licensing})`);
  console.log(`RECOMMENDATION: ${rec.label} (go=${rec.go})`);
  console.log("========================================================");
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
