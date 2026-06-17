// T-184-01 (E-46 / S-184) — unit coverage for the PURE style-agreement core. Synthetic inputs only: no
// model, no corpus IO, no GL. Asserts the decision surface S-185's gate leans on (decomposition verdict,
// bucketed agreement, inter-label labelability, concordance, the GO/NO-GO recommendation).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DESIGN_CELL, packVsConceptDecomposition, termPairVerdict, pairwiseAgreement,
  interLabelAgreement, rankConcordance, recommendation, NOISE,
} from "./style-agreement.mjs";

const st = (id, subject, cellType, pack, score) => ({ id, subject, cellType, pack, score });
const RUSTIC = "packs/rustic.json", GUILD = "packs/guildhall.json";

test("SA1: DESIGN_CELL maps cellType + pack; hard-middle ⇒ null", () => {
  assert.deepEqual(DESIGN_CELL({ cellType: "match", pack: RUSTIC }), { pack: "matched", picture: "right" });
  assert.deepEqual(DESIGN_CELL({ cellType: "wrong-pack-right-picture", pack: GUILD }), { pack: "foreign", picture: "right" });
  assert.deepEqual(DESIGN_CELL({ cellType: "same-pack-wrong-picture", pack: RUSTIC }), { pack: "matched", picture: "wrong" });
  assert.deepEqual(DESIGN_CELL({ cellType: "cross", pack: RUSTIC }), { pack: "matched", picture: "wrong" });
  assert.equal(DESIGN_CELL({ cellType: "hard-middle", pack: RUSTIC }), null);
  assert.equal(DESIGN_CELL({ cellType: "nonsense", pack: RUSTIC }), null);
});

test("SA2: packVsConceptDecomposition — PACK-DRIVEN vs PICTURE-DRIVEN vs empty cell", () => {
  // PACK-DRIVEN: foreign-pack right-picture TANKS (pack matters); matched-pack wrong-picture STAYS HIGH.
  const packDriven = [
    st("a", "gatehouse", "match", RUSTIC, 80),                       // matchedRight
    st("b", "gatehouse", "same-pack-wrong-picture", RUSTIC, 78),     // matchedWrong (high → picture barely matters)
    st("c", "gatehouse", "wrong-pack-right-picture", GUILD, 30),     // foreignRight (low → pack matters a lot)
  ];
  const d1 = packVsConceptDecomposition(packDriven);
  assert.equal(d1.conceptImageEffect, 2);   // 80 - 78
  assert.equal(d1.packEffect, 50);          // 80 - 30
  assert.match(d1.verdict, /^PACK-DRIVEN/);

  // PICTURE-DRIVEN: wrong-picture TANKS (picture matters); foreign-pack right-picture STAYS HIGH.
  const pictureDriven = [
    st("a", "gatehouse", "match", RUSTIC, 80),
    st("b", "gatehouse", "same-pack-wrong-picture", RUSTIC, 25),     // matchedWrong low → picture matters
    st("c", "gatehouse", "wrong-pack-right-picture", GUILD, 76),     // foreignRight high → pack barely matters
  ];
  const d2 = packVsConceptDecomposition(pictureDriven);
  assert.equal(d2.conceptImageEffect, 55);
  assert.equal(d2.packEffect, 4);
  assert.match(d2.verdict, /^PICTURE-DRIVEN/);

  // Empty foreignRight cell ⇒ packEffect null, no NaN, UNDETERMINED.
  const d3 = packVsConceptDecomposition([st("a", "gatehouse", "match", RUSTIC, 80), st("b", "gatehouse", "same-pack-wrong-picture", RUSTIC, 40)]);
  assert.equal(d3.packEffect, null);
  assert.equal(d3.conceptImageEffect, 40);
  assert.match(d3.verdict, /^UNDETERMINED/);
  assert.equal(d3.cells.foreignWrong.n, 0);
});

test("SA3: pairwiseAgreement — buckets separate; tie semantics; rates", () => {
  const scoreById = { ghM: 80, ghW: 20, midA: 50, midB: 55, tieX: 40, tieY: 40 };
  const pairs = [
    { id: "E1", bucket: "easy", a: "ghM", b: "ghW" },       // term A (80>20)
    { id: "H1", bucket: "hardMiddle", a: "midA", b: "midB" }, // term B (50<55)
    { id: "H2", bucket: "hardMiddle", a: "tieX", b: "tieY" }, // term tie
  ];
  const labelById = { E1: "A", H1: "A", H2: "tie" };
  const r = pairwiseAgreement(pairs, scoreById, labelById);
  assert.equal(r.byBucket.easy.n, 1);
  assert.equal(r.byBucket.easy.agree, 1);          // A==A
  assert.equal(r.byBucket.hardMiddle.n, 2);
  assert.equal(r.byBucket.hardMiddle.agree, 1);    // H1: term B vs label A → disagree; H2: tie==tie → agree
  assert.equal(r.overall.n, 3);
  assert.equal(r.overall.agree, 2);
  // asymmetric tie disagrees: term tie vs decisive label
  const r2 = pairwiseAgreement([{ id: "H2", bucket: "hardMiddle", a: "tieX", b: "tieY" }], scoreById, { H2: "A" });
  assert.equal(r2.byBucket.hardMiddle.agree, 0);
});

test("SA4: interLabelAgreement — unanimous LABELABLE, split ILL-POSED on the hard middle", () => {
  const pairs = [{ id: "E1", bucket: "easy" }, { id: "H1", bucket: "hardMiddle" }];
  const unanimous = interLabelAgreement({ E1: ["A", "A", "A"], H1: ["B", "B", "B"] }, pairs);
  assert.equal(unanimous.perPair.H1.fraction, 1);
  assert.match(unanimous.verdict, /^LABELABLE/);
  const split = interLabelAgreement({ E1: ["A", "A", "A"], H1: ["A", "B", "A", "B"] }, pairs);
  assert.equal(split.perPair.H1.fraction, 0.5);
  assert.match(split.verdict, /^ILL-POSED/);
});

test("SA5: rankConcordance — all-concordant +1, all-discordant -1, ties dropped", () => {
  const scoreById = { a: 9, b: 1, c: 1, d: 9, e: 5, f: 5 };
  const pairs = [
    { id: "P1", a: "a", b: "b" }, // term A
    { id: "P2", a: "c", b: "d" }, // term B
    { id: "P3", a: "e", b: "f" }, // term tie (dropped)
  ];
  const allC = rankConcordance(pairs, scoreById, { P1: "A", P2: "B", P3: "A" });
  assert.equal(allC.concordant, 2); assert.equal(allC.discordant, 0); assert.equal(allC.tau, 1);
  const allD = rankConcordance(pairs, scoreById, { P1: "B", P2: "A", P3: "B" });
  assert.equal(allD.tau, -1);
  assert.equal(allC.n, 2); // P3 tie dropped
});

test("SA6: recommendation — verdict map incl. licensing gate", () => {
  const goodAgree = { byBucket: { easy: { n: 3, rate: 1 }, hardMiddle: { n: 5, rate: 0.8 } } };
  const labelable = { verdict: "LABELABLE — ..." };

  // PACK-DRIVEN ⇒ DO-NOT-PROMOTE regardless of agreement.
  const r1 = recommendation({ decomposition: { verdict: "PACK-DRIVEN — ..." }, agreement: goodAgree, interLabel: labelable, licensing: true });
  assert.equal(r1.go, false); assert.match(r1.label, /DO-NOT-PROMOTE/);

  // PICTURE-DRIVEN + good agreement + licensing true ⇒ PROMOTE.
  const r2 = recommendation({ decomposition: { verdict: "PICTURE-DRIVEN — ..." }, agreement: goodAgree, interLabel: labelable, licensing: true });
  assert.equal(r2.go, true); assert.equal(r2.label, "PROMOTE");

  // Same but proxy labels (licensing false) ⇒ go null (recommend-only).
  const r3 = recommendation({ decomposition: { verdict: "PICTURE-DRIVEN — ..." }, agreement: goodAgree, interLabel: labelable, licensing: false });
  assert.equal(r3.go, null); assert.match(r3.label, /GO-LEANING/);

  // ILL-POSED ⇒ DO-NOT-PROMOTE.
  const r4 = recommendation({ decomposition: { verdict: "PICTURE-DRIVEN — ..." }, agreement: goodAgree, interLabel: { verdict: "ILL-POSED — ..." }, licensing: true });
  assert.equal(r4.go, false); assert.match(r4.label, /ill-posed/);

  // agrees on easy but NOT hard middle ⇒ DO-NOT-PROMOTE (validated only on the obvious pairs).
  const onlyEasy = { byBucket: { easy: { n: 3, rate: 1 }, hardMiddle: { n: 5, rate: 0.2 } } };
  const r5 = recommendation({ decomposition: { verdict: "PICTURE-DRIVEN — ..." }, agreement: onlyEasy, interLabel: labelable, licensing: true });
  assert.equal(r5.go, false); assert.match(r5.label, /obvious pairs/);
});

test("SA-const: NOISE is the project band", () => assert.equal(NOISE, 12));
