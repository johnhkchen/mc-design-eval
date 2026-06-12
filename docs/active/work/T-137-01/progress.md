# T-137-01 visibility-aware-census — Progress

## Completed

- **Step 1+2 — pure core + V-tests** (commit `495531b`): `visibilityAwareCoverage` in
  `src/view/face-resemblance.mjs` (`coverageGate` byte-untouched; aware/legacy both returned;
  visible / not-visible-from-view / not-visible-from-any-view / not-on-skin split; exposure skin as
  the existence basis). V1–V7 unit tests incl. the structural monotone property. 18/18 green.
- **Step 3 — proofs** (commit `6820192`): `src/view/visibility-monotone.test.mjs` — replay of
  EVERY committed multi-angle record (legacy replay must agree with the committed verdict before
  the aware direction is trusted; every previously passing view still passes; ≥1 witness flip
  exists), the T-127 cottage-patternbook flip (legacy fail ×4 → aware pass ×4, band1
  not-on-skin / not-visible-from-view), the cottage-baseline guard (visible band at fraction 0
  still fails), and the synthetic ring fixture on the real diagonal projections + exposure skin
  (hidden-but-exposed ⇒ named not-visible-from-any-view failure; declared-but-absent ⇒
  not-on-skin, no failure). 5/5 green.
- **Step 4 — gate runner wiring** (commit `ac8e203`): four per-view censuses + exposure census
  hoisted, one `visibilityAwareCoverage` call, aware arithmetic drives the T-088 short-circuit,
  legacy recorded beside it (`coverage.legacy`), record-level `visibility` block, offline checker
  presence-optional consistency check, md renders excluded rows. All committed records re-assert
  valid offline (cottage ×6, barn/church/synthetic-hut/gatehouse spot checks). No live gate run.
- **Step 5 — witness** (commit `7e231ee`): `benchmarks/sculpture/visibility-witness.mjs` + npm
  scripts (`visibility:cottage|all|repro`). 17 witness records emitted at NEW paths
  (`visibility/<subject>-<label>.*`); committed gate pins untouched. Headline: cottage-patternbook
  legacy 0/4 → aware 4/4, census re-derivation reproduces every committed denominator, band1
  not-on-skin (0 exposure cells), no hidden-band failure, judge not called. Drift on
  barn-challenge/church-challenge/church-styled/cottage-challenge/gatehouse-generated is NAMED per
  band-view (the known pre-T-128 live-vs-pins drift; recorded numbers replayed); gatehouse-current
  artifact-pin mismatch is a named SKIP. `--repro` byte-identical ×17.
- **Step 6 (partial) — discipline sweep**: committed `multi-angle/*` diff empty; instrument-diff
  demonstration: a simulated re-emission (coverage.legacy + visibility added) diffs ONLY
  `views[*].coverage` — the new census fields, nothing else; no model-tier/OP_ROUTING change (no
  new model calls).
- **Tripwire fix** (commit `0f1a4f6`): first full-suite run caught the witness importing
  zone-fill.mjs directly (brush-door conformance, 2004/2005). Fixed per the tripwire's own
  contract — allowlist NOT widened; the gate runner exports `gateCensuses()` (one census
  definition) and both gate + witness consume it. Witness records re-verified byte-identical ×17;
  tripwire green.

## Deviations from plan

- Witness gates on RECORDED rows with re-derivation as the fidelity check (plan had this as the
  contingency; it is the primary because it makes the witness exact replay + named drift, immune
  to the pre-existing live-vs-pins drift).
- `gateCensuses` export added (not in structure.md) — forced by the brush-door tripwire; it
  strengthens the one-definition discipline rather than bending it.
- A sibling T-136 commit (`e34e4ab`) landed mid-flight; files disjoint, no conflict.

## Remaining

- Full `npm test` green confirmation (re-run in flight after the tripwire fix).
- review.md.
