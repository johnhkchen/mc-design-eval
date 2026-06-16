#!/usr/bin/env node
/**
 * CORPUS REFEREE (T-169-01, story S-169, epic E-40) — the referee for the STYLE-DISTANCE term
 * (T-168-01) on the S-167 corpus (T-167-01). Three sections, one result doc. Builds ON the patterns of
 * clean-wrong-style.mjs (crater) and bakeoff.mjs (dispatch) — asset-guard-first, beside-PNG-first,
 * VOTES loop, no re-ask on malformed (a zero-token notice reply only burns budget) — WITHOUT editing
 * them (their results/*.json are the E-39 BASELINE this run compares against).
 *
 * FALSIFIABLE (lead with how it fails): with the new term (1) the clean × wrong-style fixture CRATERS
 * (matched ≫ wrong, outside ±12); (2) the score AGREES with the human pairwise labels on the corpus
 * pairs; (3) the ≥8-state bake-off discriminates split vs fused. FAILS IF: it craters but DISAGREES
 * (over-penalizes a close style → re-calibrate, NOT promote); agrees on easy but not the contested
 * middle; or the bake-off still cannot separate split from fused (collapse the split). Whichever way it
 * lands is the result — this harness exists to FIND the failure, not to rubber-stamp the term.
 *
 * THE NEW TERM keys on itemStyleClass: present non-empty AND missing non-empty ⇒ "wrong-style" (caps
 * the score). The open question (failure mode F3) is whether live Layer A emits a DISTINGUISHING
 * `present` for matched vs wrong — or the SAME present+missing pair for every item, collapsing both.
 *
 * Metered. NOT in `npm test`. Writes results/corpus-referee.json + beside-PNGs under the work dir.
 * Not the frozen instrument.
 *
 *   npm run corpus-referee            # full run (~48 image diagnose calls)
 *   GUARD_ONLY=1 npm run corpus-referee   # asset-guard + corpus load only, no spend
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { bamlRender, bamlParse } from "../../src/baml/bridge.mjs";
import { diagnoseRenderArgs } from "../../src/workshop/diagnose.mjs";
import { routeRenderArgs, resolveDispatch } from "../../src/workshop/route.mjs";
import { critiqueRenderArgs } from "../../src/workshop/critique.mjs";
import { ACTION_NAMES } from "../../src/workshop/actions.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import {
  critiqueEvidence, itemStyleClass, styleFidelityScore,
  worstDepartmentOfDispatch, worstDepartmentOfFusedReply, dispatchCorrectness, pairAgreement,
  kindReliability,
  BAKEOFF_SCHEMA,
} from "../../src/workshop/bakeoff-score.mjs";
import { loadDefectCorpus, singleStates, pairStates } from "../../src/workshop/defect-corpus.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = fileURLToPath(new URL("./", import.meta.url));
// Output sinks are env-gated with the T-169-01 (E-40 baseline) defaults so a baseline re-run still lands
// where FINDINGS/recommendation.md cite it; T-170-02 routes both to its own dir + a `-kind.json` results
// file so the post-`kind` run does NOT clobber the committed E-40 baseline.
const OUT_DIR = join(ROOT, process.env.REFEREE_OUT_DIR ?? "docs/active/work/T-169-01");
const RESULTS = join(ROOT, process.env.REFEREE_RESULTS ?? "experiments/eval-alignment/results/corpus-referee.json");
const TIER = "strong";
const VOTES = 2;
const NOISE = 12; // the E-38 per-call noise band
const GUARD_ONLY = process.env.GUARD_ONLY === "1";
// T-173-01 (E-42): run ONLY Section A (crater) — the faithfulness re-run question is purely
// matched-vs-wrong on the gatehouse build; agreement + bake-off use the corpus and are out of scope
// (and ~40 wasted model calls). Default unset → all three sections run exactly as before.
const CRATER_ONLY = process.env.CRATER_ONLY === "1";
const azimuths = [...MULTI_ANGLE_GATE.azimuths];

const MATCHED_PACK = "packs/rustic.json";   // the subjects' matched style
const WRONG_PACK = "packs/guildhall.json";  // the closest classical profile we ship (clean-wrong-style's B)

// A synthetic gatehouse PROGRAM — the crater build is held FIXED (= builds/gatehouse/new-roof); it only
// fills diagnose.mjs::programBlock and is NOT a recognition output (labelled as a stand-in).
const PROGRAM = Object.freeze({
  reading: { summary: "A small square stone gatehouse: thick masonry walls, a steep gabled roof, and a single arched gate on the front." },
  masses: [{ id: "gatehouse", role: "gatehouse", roof: { idiom: "roof.gable", pitchClass: 2 }, walls: { role: "wall.stone" }, openings: [{ kind: "gate", treatment: "arch", at: "front" }] }],
});
const SYNTH_WORKSHOP = { elements: [] };

// ---- small local helpers (mirrors the precedents; kept local — they are tiny) ----
const toB64 = async (p) => {
  const buf = await readFile(p);
  const mediaType = buf.slice(0, 3).toString("hex") === "ffd8ff" ? "image/jpeg" : "image/png";
  return { base64: buf.toString("base64"), mediaType };
};
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const round = (x) => Math.round(x);
/** Persist the full item triple + the SAME class the scorer uses — the audit trail critiqueEvidence drops. */
const itemsOf = (critique) => (critique?.items ?? []).map((it) => ({
  department: it.department, severity: it.severity,
  present: it.present ?? "", missing: it.missing ?? "",
  kind: it.kind ?? null, // T-170-02: the RAW tag the judge chose (null ⇒ untagged ⇒ structural fallback)
  styleClass: itemStyleClass(it),
}));

/** Minimal side-by-side composite (no GL, no model). decodeImage sniffs JPEG/PNG. */
async function composeTwo(pathA, pathB, outPath, gutter = 16) {
  const a = await decodeImage(pathA);
  const b = await decodeImage(pathB);
  const W = a.width + gutter + b.width, H = Math.max(a.height, b.height);
  const out = new PNG({ width: W, height: H });
  out.data.fill(0xff);
  const blit = (src, dx) => {
    for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
      const si = (src.width * y + x) << 2, di = (W * y + (x + dx)) << 2;
      out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = 0xff;
    }
  };
  blit(a, 0); blit(b, a.width + gutter);
  writeFileSync(outPath, PNG.sync.write(out));
}

/** One DiagnoseBuild → {evidence, items, score}. No re-ask. */
async function diagnose({ program, pack, concept, renders }) {
  const args = diagnoseRenderArgs({ program, pack, azimuths });
  const { prompt, images } = await bamlRender({ fn: "DiagnoseBuild", args, images: { concept, renders } });
  const { text } = await runTieredOp({ tier: TIER, prompt, images });
  const critique = await bamlParse({ fn: "DiagnoseBuild", text });
  return { ev: critiqueEvidence(critique), items: itemsOf(critique), score: styleFidelityScore(critique) };
}

const renderB64s = async (renderDir) => Promise.all(azimuths.map((a) => toB64(join(ROOT, renderDir, `view-${a}.png`))));

// ============================ SECTION A — CRATER (AC #1) ============================
// T-173-01 (E-42): env-overridable so the faithfulness re-run can repoint at the materially-faithful
// recognition build (S-171, staged at builds/gatehouse/faithful) or the roof-covering build (S-172)
// WITHOUT touching the held-fixed PROGRAM/conditions. Default unchanged → E-40/T-170-02 reproducible.
const CRATER_BUILD = process.env.CRATER_BUILD ?? "builds/gatehouse/new-roof";
const CRATER_CONDITIONS = [
  { key: "A-matched",  tier: "MATCHED", pack: MATCHED_PACK, concept: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png", note: "rustic concept + rustic pack (build matches both)" },
  { key: "B-arc",      tier: "WRONG",   pack: WRONG_PACK,   concept: "benchmarks/temple-facade/concepts/arc-A-flash.png",      note: "classical arch + guildhall pack" },
  { key: "B2-chapelle",tier: "WRONG",   pack: WRONG_PACK,   concept: "benchmarks/temple-facade/concepts/chapelle-A-flash.png", note: "gothic cathedral + guildhall pack (triangulates arc-A's palette confound)" },
  { key: "C-control",  tier: "CONTROL", pack: MATCHED_PACK, concept: "benchmarks/temple-facade/concepts/arc-A-flash.png",      note: "classical concept + RUSTIC pack (isolates pack vs concept-image)" },
];

async function runCrater() {
  const renders = await renderB64s(CRATER_BUILD);
  const buildView = join(ROOT, CRATER_BUILD, "view-+x+z.png");
  await composeTwo(join(ROOT, CRATER_CONDITIONS[0].concept), buildView, join(OUT_DIR, "crater-matched.png"));
  await composeTwo(join(ROOT, CRATER_CONDITIONS[1].concept), buildView, join(OUT_DIR, "crater-wrongstyle.png"));
  await composeTwo(join(ROOT, CRATER_CONDITIONS[2].concept), buildView, join(OUT_DIR, "crater-wrongstyle-2.png"));
  console.log("[crater] wrote beside-concept PNGs");

  const conditions = [];
  for (const c of CRATER_CONDITIONS) {
    const pack = loadStylePack(join(ROOT, c.pack));
    const concept = await toB64(join(ROOT, c.concept));
    const votes = [];
    for (let v = 0; v < VOTES; v++) {
      const d = await diagnose({ program: PROGRAM, pack, concept, renders });
      votes.push({ score: d.score, nWrongStyle: d.ev.nWrongStyle, wrongStyleCapped: d.ev.wrongStyleCapped, items: d.items });
      console.log(`[crater] ${c.key} v${v + 1}: score=${d.score} nWrongStyle=${d.ev.nWrongStyle}/${d.items.length}`);
    }
    conditions.push({ ...c, scoreMean: round(mean(votes.map((x) => x.score))), votes });
  }
  const sc = (k) => conditions.find((c) => c.key === k)?.scoreMean ?? null;
  const A = sc("A-matched"), B = sc("B-arc"), B2 = sc("B2-chapelle"), C = sc("C-control");
  const spreads = { "A-B": A - B, "A-B2": A - B2, "A-C": A - C, "C-B (pack effect)": C - B };
  const kindRel = kindReliability(conditions); // T-170-02: per-condition tag distribution + replace contrast
  const cratered = A != null && B != null && (A - B) > 2 * NOISE;
  const collapsed = A != null && B != null && A <= NOISE && B <= NOISE; // the new-term failure signature
  const verdict = cratered
    ? "CRATERED — matched ≫ wrong-style outside the ±12 noise (the term produced the within-family gradient)"
    : collapsed
      ? "COLLAPSED — matched AND wrong-style both FLOORED; the term over-penalizes the close style (live Layer A emits present+missing for every item → itemStyleClass caps everything). NOT a crater."
      : "DID NOT CRATER — matched and wrong-style stay close, inside the ±12 noise";
  return { build: CRATER_BUILD, program: "synthetic-gatehouse (fixed)", conditions, spreads, cratered, collapsed, verdict, scores: { A, B, B2, C }, kindReliability: kindRel };
}

// ====================== SECTION B — CORPUS AGREEMENT (AC #2) ======================
async function runAgreement(corpus) {
  const matchedPack = loadStylePack(join(ROOT, MATCHED_PACK));
  const wrongPack = loadStylePack(join(ROOT, WRONG_PACK));
  const rows = [];
  for (const s of pairStates(corpus)) {
    const renders = await renderB64s(s.renderDir);
    const matchedConcept = await toB64(join(ROOT, s.labels.matchedConcept));
    const wrongConcept = await toB64(join(ROOT, s.labels.wrongStyleConcept));
    const mVotes = [], wVotes = [];
    for (let v = 0; v < VOTES; v++) {
      const m = await diagnose({ program: PROGRAM, pack: matchedPack, concept: matchedConcept, renders });
      const w = await diagnose({ program: PROGRAM, pack: wrongPack, concept: wrongConcept, renders });
      mVotes.push(m); wVotes.push(w);
      console.log(`[agree] ${s.id} v${v + 1}: matched=${m.score} wrong=${w.score}`);
    }
    const matchedScore = round(mean(mVotes.map((x) => x.score)));
    const wrongScore = round(mean(wVotes.map((x) => x.score)));
    rows.push({
      key: s.id, confidence: s.labels.confidence, moreFaithful: s.labels.moreFaithful,
      matchedScore, wrongScore, matchedItems: mVotes[0].items, wrongItems: wVotes[0].items,
    });
  }
  const summary = pairAgreement(rows);
  const contestedEmpty = summary.contested.n === 0;
  const verdict = `easy(high-conf) ${summary.easy.agree}/${summary.easy.n} ordered correctly`
    + (contestedEmpty
      ? "; the CONTESTED middle is EMPTY by construction — the S-167 corpus excludes its only contested pair (cottage-cream-vs-pink, sub-threshold noise), so agreement on the contested middle CANNOT be tested here."
      : `; contested ${summary.contested.agree}/${summary.contested.n}`);
  return { rows, summary, contestedEmpty, verdict };
}

// ========================= SECTION C — BAKE-OFF (AC #3) =========================
async function runBakeoff(corpus) {
  const rows = [];
  for (const s of singleStates(corpus)) {
    const pack = loadStylePack(join(ROOT, MATCHED_PACK));
    const concept = await toB64(join(ROOT, s.concept));
    const renders = await renderB64s(s.renderDir);
    const ground = s.labels.worstDepartment;
    for (let v = 0; v < VOTES; v++) {
      let splitDept = "ERROR", fusedDept = "ERROR", fusedMatched = null, fusedRegion = "";
      try {
        const diag = await bamlRender({ fn: "DiagnoseBuild", args: diagnoseRenderArgs({ program: PROGRAM, pack, azimuths }), images: { concept, renders } });
        const critique = await bamlParse({ fn: "DiagnoseBuild", text: (await runTieredOp({ tier: TIER, prompt: diag.prompt, images: diag.images })).text });
        const route = await bamlRender({ fn: "RouteCritique", args: routeRenderArgs({ critique }) });
        const dispatch = resolveDispatch(await bamlParse({ fn: "RouteCritique", text: (await runTieredOp({ tier: TIER, prompt: route.prompt })).text }));
        splitDept = worstDepartmentOfDispatch(dispatch);
      } catch (e) { console.error(`[bakeoff] ${s.id} v${v + 1} SPLIT error: ${e.message}`); }
      try {
        const args = critiqueRenderArgs({ program: SYNTH_WORKSHOP, pack, round: 6, budget: 2, liveActions: ACTION_NAMES, azimuths, conformance: { checks: [] }, lastRound: null, source: PROGRAM });
        const fused = await bamlRender({ fn: "CritiqueWorkshopRound", args, images: { concept, renders } });
        const reply = await bamlParse({ fn: "CritiqueWorkshopRound", text: (await runTieredOp({ tier: TIER, prompt: fused.prompt, images: fused.images })).text });
        const w = worstDepartmentOfFusedReply(reply);
        fusedDept = w.department; fusedMatched = w.matched; fusedRegion = w.region;
      } catch (e) { console.error(`[bakeoff] ${s.id} v${v + 1} FUSED error: ${e.message}`); }
      rows.push({ key: s.id, ground, splitDept, fusedDept, fusedMatched, fusedRegion });
      console.log(`[bakeoff] ${s.id} v${v + 1}: ground=${ground} split=${splitDept} fused=${fusedDept}${fusedMatched === false ? " (region→WALL)" : ""}`);
    }
  }
  return { rows, summary: dispatchCorrectness(rows) };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const corpus = loadDefectCorpus();

  // ---- asset guard before ANY spend ----
  const guardPaths = new Set();
  for (const p of azimuths.map((a) => join(ROOT, CRATER_BUILD, `view-${a}.png`))) guardPaths.add(p);
  for (const c of CRATER_CONDITIONS) guardPaths.add(join(ROOT, c.concept));
  if (!CRATER_ONLY) { // T-173-01: corpus assets are only needed for the agreement + bake-off sections
    for (const s of pairStates(corpus)) {
      for (const a of azimuths) guardPaths.add(join(ROOT, s.renderDir, `view-${a}.png`));
      guardPaths.add(join(ROOT, s.labels.matchedConcept)); guardPaths.add(join(ROOT, s.labels.wrongStyleConcept));
    }
    for (const s of singleStates(corpus)) {
      for (const a of azimuths) guardPaths.add(join(ROOT, s.renderDir, `view-${a}.png`));
      guardPaths.add(join(ROOT, s.concept));
    }
  }
  for (const p of guardPaths) if (!existsSync(p)) throw new Error(`missing asset: ${p}`);
  console.log(`[guard] ${guardPaths.size} assets present; build=${CRATER_BUILD}${CRATER_ONLY ? " (CRATER_ONLY)" : `; corpus ${singleStates(corpus).length} single + ${pairStates(corpus).length} pair`}`);
  if (GUARD_ONLY) { console.log("[guard] GUARD_ONLY — no spend; exiting clean."); return; }

  const crater = await runCrater();
  // T-173-01: the faithfulness re-run scores ONLY the crater; the corpus sections + their E-39 baseline
  // side-by-side are skipped (recorded as a sentinel so the result JSON stays self-describing).
  const agreement = CRATER_ONLY ? { skipped: "CRATER_ONLY" } : await runAgreement(corpus);
  const bakeoff = CRATER_ONLY ? { skipped: "CRATER_ONLY" } : await runBakeoff(corpus);

  // E-39 baseline for the side-by-side
  let baseline = {};
  if (CRATER_ONLY) baseline = { skipped: "CRATER_ONLY" };
  else try {
    const cw = JSON.parse(readFileSync(join(HERE, "results", "clean-wrong-style.json"), "utf8"));
    const bo = JSON.parse(readFileSync(join(HERE, "results", "bakeoff.json"), "utf8"));
    baseline = {
      e39CleanWrongStyle: Object.fromEntries(cw.results.map((r) => [r.key, r.scoreMean])),
      e39CleanWrongVerdict: cw.verdict,
      e39Bakeoff: { split: bo.summary.split, fused: bo.summary.fused, verdict: bo.summary.verdict },
    };
  } catch { baseline = "not found"; }

  await mkdir(dirname(RESULTS), { recursive: true });
  await writeFile(RESULTS,
    JSON.stringify({ schema: BAKEOFF_SCHEMA, tier: TIER, votes: VOTES, noiseBand: NOISE, crater, agreement, bakeoff, baseline }, null, 2) + "\n");

  console.log("\n================ CORPUS REFEREE VERDICT ================");
  console.log(`CRATER:    A=${crater.scores.A} B=${crater.scores.B} B2=${crater.scores.B2} C=${crater.scores.C}  -> ${crater.verdict}`);
  console.log(`KIND:      contrast=${crater.kindReliability.replaceContrast}  -> ${crater.kindReliability.verdict}`);
  if (CRATER_ONLY) {
    console.log(`AGREEMENT: skipped (CRATER_ONLY)`);
    console.log(`BAKE-OFF:  skipped (CRATER_ONLY)`);
  } else {
    console.log(`AGREEMENT: ${agreement.verdict}`);
    console.log(`BAKE-OFF:  split ${bakeoff.summary.split.correct}/${bakeoff.summary.n}  fused ${bakeoff.summary.fused.correct}/${bakeoff.summary.n}  -> ${bakeoff.summary.verdict}`);
  }
  console.log("=======================================================");
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
