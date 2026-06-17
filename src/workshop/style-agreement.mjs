// The E-46 / S-184 STYLE-AGREEMENT core (T-184-01) — the PURE arithmetic that turns the S-183 decoupling
// corpus + the recalibrated style-distance term's per-state scores into the GO/NO-GO evidence S-185 acts on.
// Three questions, generalized from T-182-01's single-subject C-control to the population:
//
//   (1) PACK vs CONCEPT-IMAGE — does the term's score track the recognized PACK (style spec) or the CONCEPT
//       IMAGE (does-the-build-match-the-picture)? A 2x2 (pack in {matched,foreign} x picture in {right,wrong})
//       across subjects; conceptImageEffect = matchedRight - matchedWrong (swap picture, hold pack);
//       packEffect = matchedRight - foreignRight (swap pack, hold picture). The T-182 confound (signal rides
//       the pack) generalizes IFF packEffect >> conceptImageEffect at population scale -> DO-NOT-PROMOTE.
//   (2) TERM vs HUMAN pairwise agreement on the curated pairs — reported OVERALL, EASY, and HARD-MIDDLE
//       separately (a term that only nails the obvious pairs is not validated).
//   (3) INTER-LABEL agreement — proxy-panel self-consistency stands in for inter-rater when only one human
//       (or the LLM-proxy fallback) labels; low self-consistency on the hard middle => the gate is ill-posed.
//
// THIS IS GATE EVIDENCE, NOT THE FROZEN INSTRUMENT and NOT the scored term: it takes scores IN (the harness
// joins corpus<->scorer<->labels), so it has NO dependency on bakeoff-score.mjs. Keeping it out of the scorer
// keeps S-185's freeze surface minimal (the agreement math is never promoted). PURE — no GL/IO/model/Date/
// random — runs under the `src/**/*.test.mjs` glob.

/** Evidence tag for the harness JSON. */
export const STYLE_AGREEMENT_SCHEMA = "style-agreement/v1";

/** The project per-call noise band (the E-38 ±12 the referee uses) — the default decomposition margin. */
export const NOISE = 12;

/** The hard-middle proxy self-consistency floor below which the gate is "ill-posed" (no ground truth). */
export const LABELABLE_FLOOR = 0.67;

const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
const round = (x) => (x === null ? null : Math.round(x));

/**
 * The decoupling design cell of a corpus state. Hard-middle states vary the BUILD (not pack/concept), so they
 * are NOT part of the pack-vs-concept decomposition — they return null and are excluded.
 *   picture: match / wrong-pack-right-picture => "right"; same-pack-wrong-picture / cross => "wrong"
 *   pack:    a pack path ending "rustic.json" => "matched"; anything else (guildhall) => "foreign"
 * @param {{cellType:string, pack:string}} state
 * @returns {{pack:"matched"|"foreign", picture:"right"|"wrong"}|null}
 */
export function DESIGN_CELL(state) {
  const ct = state?.cellType;
  let picture;
  if (ct === "match" || ct === "wrong-pack-right-picture") picture = "right";
  else if (ct === "same-pack-wrong-picture" || ct === "cross") picture = "wrong";
  else return null; // hard-middle (or unknown) — not a decomposition cell
  const pack = /rustic\.json$/.test(state?.pack ?? "") ? "matched" : "foreign";
  return { pack, picture };
}

const CELL_KEYS = Object.freeze(["matchedRight", "matchedWrong", "foreignRight", "foreignWrong"]);
const cellKey = (c) => `${c.pack === "matched" ? "matched" : "foreign"}${c.picture === "right" ? "Right" : "Wrong"}`;

function bucketCells(scoredStates) {
  const cells = Object.fromEntries(CELL_KEYS.map((k) => [k, { n: 0, mean: null, ids: [], scores: [] }]));
  for (const s of scoredStates ?? []) {
    const c = DESIGN_CELL(s);
    if (!c) continue;
    const b = cells[cellKey(c)];
    b.scores.push(s.score);
    b.ids.push(s.id);
    b.n += 1;
  }
  for (const k of CELL_KEYS) { cells[k].mean = round(mean(cells[k].scores)); }
  return cells;
}

const effect = (a, b) => (a === null || b === null ? null : a - b);

/**
 * The pack-vs-concept-image decomposition — the T-182 C-control generalized to a population. Buckets the
 * NON-middle states into the 2x2 and reports the two main effects + a verdict. Also per-subject where cells
 * exist (a subject missing a cell reports that effect as null, never imputed).
 * @param {Array<{id:string, subject:string, cellType:string, pack:string, score:number}>} scoredStates
 * @param {number} [noise=NOISE] the margin a dominant effect must clear to be called the driver
 * @returns {{cells, conceptImageEffect, packEffect, perSubject, verdict, noise}}
 */
export function packVsConceptDecomposition(scoredStates, noise = NOISE) {
  const cells = bucketCells(scoredStates);
  const strip = (cs) => Object.fromEntries(CELL_KEYS.map((k) => [k, { n: cs[k].n, mean: cs[k].mean, ids: cs[k].ids }]));
  const conceptImageEffect = effect(cells.matchedRight.mean, cells.matchedWrong.mean);
  const packEffect = effect(cells.matchedRight.mean, cells.foreignRight.mean);

  const subjects = [...new Set((scoredStates ?? []).map((s) => s.subject))];
  const perSubject = {};
  for (const subj of subjects) {
    const sc = (scoredStates ?? []).filter((s) => s.subject === subj);
    const cc = bucketCells(sc);
    perSubject[subj] = {
      cells: strip(cc),
      conceptImageEffect: effect(cc.matchedRight.mean, cc.matchedWrong.mean),
      packEffect: effect(cc.matchedRight.mean, cc.foreignRight.mean),
    };
  }

  let verdict;
  if (conceptImageEffect === null || packEffect === null) {
    verdict = "UNDETERMINED — a required cell (matched-right + one swap) is empty; effect not computable";
  } else if (packEffect > conceptImageEffect + noise) {
    verdict = "PACK-DRIVEN — the score tracks the pack, not the picture (the T-182 confound generalizes → DO-NOT-PROMOTE, concept-image-conditioning fix)";
  } else if (conceptImageEffect > packEffect + noise) {
    verdict = "PICTURE-DRIVEN — the score tracks the concept image more than the pack (the signal S-185's PROMOTE needs)";
  } else {
    verdict = "MIXED — pack and concept-image effects are within the noise band of each other (inseparable on this population; report, do not promote on a tie)";
  }
  return { cells: strip(cells), conceptImageEffect, packEffect, perSubject, verdict, noise };
}

/** The term's pick for one pair from the scored states (argmax score; equal ⇒ tie). */
export function termPairVerdict(pair, scoreById) {
  const a = scoreById[pair.a], b = scoreById[pair.b];
  if (typeof a !== "number" || typeof b !== "number") return null;
  if (a === b) return "tie";
  return a > b ? "A" : "B";
}

/** agree semantics: mutual tie ⇒ agree; one tie + one decisive ⇒ disagree; both decisive ⇒ equal picks. */
function picksAgree(termPick, label) {
  if (termPick === null || label === null || label === undefined) return null;
  return termPick === label;
}

/**
 * Term-vs-label pairwise agreement, bucketed (easy / hardMiddle reported SEPARATELY — never averaged into one
 * headline). A term that only nails the obvious pairs is not validated, so the hard middle stands alone.
 * @param {Array<{id:string, bucket:"easy"|"hardMiddle", a:string, b:string}>} pairs
 * @param {Object<string,number>} scoreById  corpus-state-id -> term score
 * @param {Object<string,"A"|"B"|"tie">} labelById  pair-id -> the human (or proxy) label
 * @returns {{overall, byBucket:{easy, hardMiddle}}} each bucket {n, agree, rate, pairs:[...]}
 */
export function pairwiseAgreement(pairs, scoreById, labelById) {
  const mk = () => ({ n: 0, agree: 0, rate: 0, pairs: [] });
  const byBucket = { easy: mk(), hardMiddle: mk() };
  let nAll = 0, agreeAll = 0;
  for (const p of pairs ?? []) {
    const termPick = termPairVerdict(p, scoreById);
    const label = labelById?.[p.id] ?? null;
    const agree = picksAgree(termPick, label);
    const b = byBucket[p.bucket] ?? (byBucket[p.bucket] = mk());
    b.n += 1; nAll += 1;
    if (agree === true) { b.agree += 1; agreeAll += 1; }
    b.pairs.push({
      id: p.id, bucket: p.bucket, termPick, label,
      termScoreA: scoreById[p.a] ?? null, termScoreB: scoreById[p.b] ?? null, agree,
    });
  }
  for (const b of Object.values(byBucket)) b.rate = b.n ? b.agree / b.n : 0;
  return { overall: { n: nAll, agree: agreeAll, rate: nAll ? agreeAll / nAll : 0 }, byBucket };
}

/**
 * Inter-label agreement — the per-pair majority fraction across a panel's votes (the labelability signal).
 * With one human this stands in for inter-rater via the LLM-proxy panel's SELF-consistency: a pair whose votes
 * split ~evenly has no stable label (ill-posed). Reported bucketed; the hard middle decides the verdict.
 * @param {Object<string,Array<"A"|"B"|"tie">>} perPairVotes  pair-id -> the panel's votes
 * @param {Array<{id:string, bucket:string}>} pairs  (for bucket lookup)
 * @param {number} [floor=LABELABLE_FLOOR]
 * @returns {{perPair, byBucket:{easy,hardMiddle}, overall, verdict, floor}}
 */
export function interLabelAgreement(perPairVotes, pairs, floor = LABELABLE_FLOOR) {
  const bucketOf = Object.fromEntries((pairs ?? []).map((p) => [p.id, p.bucket]));
  const perPair = {};
  const byBucketFracs = {};
  const allFracs = [];
  for (const [id, votes] of Object.entries(perPairVotes ?? {})) {
    const v = votes ?? [];
    if (!v.length) { perPair[id] = { n: 0, majority: null, fraction: null }; continue; }
    const counts = {};
    for (const x of v) counts[x] = (counts[x] ?? 0) + 1;
    const [maj, cnt] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const fraction = cnt / v.length;
    perPair[id] = { n: v.length, majority: maj, fraction };
    const bk = bucketOf[id] ?? "easy";
    (byBucketFracs[bk] ??= []).push(fraction);
    allFracs.push(fraction);
  }
  const byBucket = {};
  for (const bk of ["easy", "hardMiddle"]) byBucket[bk] = { n: (byBucketFracs[bk] ?? []).length, meanFraction: round1(mean(byBucketFracs[bk] ?? [])) };
  const overall = { n: allFracs.length, meanFraction: round1(mean(allFracs)) };
  const hm = byBucket.hardMiddle.meanFraction;
  const verdict = hm === null
    ? "NO HARD-MIDDLE VOTES — labelability of the contested middle untested"
    : hm < floor
      ? `ILL-POSED — hard-middle self-consistency ${hm} < ${floor}; the contested pairs have no stable label (no ground truth → the gate is ill-posed)`
      : `LABELABLE — hard-middle self-consistency ${hm} ≥ ${floor}; the contested pairs carry a stable majority`;
  return { perPair, byBucket, overall, verdict, floor };
}

const round1 = (x) => (x === null ? null : Math.round(x * 100) / 100);

/**
 * A Kendall-τ-like rank concordance over the labeled DECISIVE pairs: +1 all term/label picks concordant,
 * −1 all discordant. Ties (either side) are dropped (not concordant or discordant). The rank-correlation the
 * AC names, reported beside pairwise accuracy.
 * @returns {{concordant:number, discordant:number, n:number, tau:(number|null)}}
 */
export function rankConcordance(pairs, scoreById, labelById) {
  let c = 0, d = 0;
  for (const p of pairs ?? []) {
    const termPick = termPairVerdict(p, scoreById);
    const label = labelById?.[p.id] ?? null;
    if (termPick === null || termPick === "tie" || label === null || label === "tie") continue;
    if (termPick === label) c += 1; else d += 1;
  }
  const n = c + d;
  return { concordant: c, discordant: d, n, tau: n ? (c - d) / n : null };
}

/**
 * The S-185 recommendation, encoding the design's verdict map. `go` is the GO/NO-GO bit:
 *   - false (DO-NOT-PROMOTE) if the decomposition is PACK-DRIVEN, or the gate is ILL-POSED, or the term agrees
 *     on easy but not the hard middle (validated where it didn't need to);
 *   - true (GO) if PICTURE-DRIVEN AND hard-middle agreement clears the bar AND the labels are licensing;
 *   - null (RECOMMEND-ONLY) when licensing===false — a proxy panel can REFUTE but never LICENSE a promotion;
 *     the human labels are S-185's gate.
 * @param {{decomposition, agreement, interLabel, licensing:boolean, hardMiddleBar?:number}} input
 * @returns {{go:boolean|null, label:string, rationale:string[]}}
 */
export function recommendation({ decomposition, agreement, interLabel, licensing, hardMiddleBar = 0.7 }) {
  const rationale = [];
  const packDriven = /^PACK-DRIVEN/.test(decomposition?.verdict ?? "");
  const pictureDriven = /^PICTURE-DRIVEN/.test(decomposition?.verdict ?? "");
  const illPosed = /^ILL-POSED/.test(interLabel?.verdict ?? "");
  const hm = agreement?.byBucket?.hardMiddle ?? { n: 0, rate: 0 };
  const easy = agreement?.byBucket?.easy ?? { n: 0, rate: 0 };
  const hardClears = hm.n > 0 && hm.rate >= hardMiddleBar;
  const onlyEasy = easy.n > 0 && easy.rate >= hardMiddleBar && hm.n > 0 && hm.rate < hardMiddleBar;

  if (packDriven) {
    rationale.push(`decomposition ${decomposition.verdict}`);
    return { go: false, label: "DO-NOT-PROMOTE", rationale };
  }
  if (illPosed) {
    rationale.push(`inter-label ${interLabel.verdict}`);
    return { go: false, label: "DO-NOT-PROMOTE (ill-posed gate)", rationale };
  }
  if (onlyEasy) {
    rationale.push(`term agrees on easy (${round1(easy.rate)}) but not the hard middle (${round1(hm.rate)}) — validated where it didn't need to`);
    return { go: false, label: "DO-NOT-PROMOTE (validated only on the obvious pairs)", rationale };
  }
  if (pictureDriven && hardClears) {
    rationale.push(`decomposition PICTURE-DRIVEN; hard-middle agreement ${round1(hm.rate)} ≥ ${hardMiddleBar}`);
    if (licensing === false) {
      rationale.push("labels are LLM-proxy (non-licensing) — a proxy can refute, not license; the human labels are S-185's gate");
      return { go: null, label: "GO-LEANING (recommend-only; human labels required to license)", rationale };
    }
    return { go: true, label: "PROMOTE", rationale };
  }
  rationale.push(`decomposition ${decomposition?.verdict ?? "?"}; hard-middle agreement ${round1(hm.rate)} (n=${hm.n})`);
  return { go: licensing === false ? null : false, label: "INCONCLUSIVE — magnitude/agreement do not clear the bar", rationale };
}
