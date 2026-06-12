# T-135-01 proportion-conformance — Plan

Working state caution: the tree carries sibling-session changes (`src/pack/brush-door.conformance.test.mjs`
modified, `src/view/roof-steep.mjs` untracked and known to trip the brush-door sweep, `.lisa*`
files). Every commit stages **only this ticket's files, by explicit path**. The pre-existing
brush-door failure is recorded, not fixed, here (T-134's seam).

## Step 1 — pure metric core

Files: `src/form/silhouette-proportion.mjs`, `src/form/silhouette-proportion.test.mjs`.

1. Implement per structure.md §1: image-convention masks (row 0 top), `elevationMask`/`planMask`
   over `occ.cells`, `maskProportions` (eave = widest-layer top via `eaveWidthFrac`; ridge =
   thresholded top via `ridgeMinWidthFrac`), `ratiosFromMask`, `proportionRatios` (both
   elevations, eave = max of the two; aspect from plan bbox; `opts.masses` restriction),
   `targetsFromConceptMask`, `deriveProportionDeclarations` (concept-first, aspect always
   sketch, per-ratio `sources`, throws when a ratio is unmeasurable on both sides),
   `assertProportionDeclarations`, `compareRatios` (relative, absolute-floor arm), frozen
   defaults, rounding via r4-style helpers (byte-stable output).
2. Tests: synthetic occupancy gable house + chimney (hand-computed eave/ridge/aspect); direct
   Uint8Array silhouettes for mask metrics; degenerate masks → null; tolerance arms; fallback
   merge rules; per-mass restriction; mask-orientation pin (a mask from `extractSilhouette` of a
   tiny synthetic RGBA image flows through unchanged — reuse form-fidelity's in-test image
   pattern).

Verify: `node --test src/form/silhouette-proportion.test.mjs` green.
Commit 1: `feat(E-33 T-135-01): silhouette proportion metrics — eave/ridge from masks, ratios, targets, tolerance compare`.

## Step 2 — the gate check

Files: `src/pack/conformance.mjs`, `src/pack/conformance.test.mjs`.

1. Add `"proportion-vs-concept"` to `CONFORMANCE_CHECK_NAMES` + `CHECK_IMPL`; implement
   `proportionCheck(occ, {proportions})` (vacuous pass when undeclared; verdict carries `ratios`
   rows; findings carry the numbers); `runConformance` appends the check iff declared and not
   pack-listed. Header note: the declaration-driven exception, documented.
2. Tests: declared/undeclared/pack-listed×undeclared; old-report byte-stability (a
   no-proportions declarations object yields exactly the pack's checks, JSON-identical);
   findings text contains measured/target/tolerance numbers; per-mass rows recorded, findings
   only where per-mass targets exist.

Verify: `node --test src/pack/conformance.test.mjs` green; ALSO `npm run workshop:offline` (the
fixture's committed report must re-derive identically — the central compatibility claim).
Commit 2 (may fold into 3).

## Step 3 — loop rollback + prefix replay

Files: `src/workshop/loop.mjs`, `loop.test.mjs`, `src/workshop/replay.mjs`, `replay.test.mjs`.

1. `proportionRegression(before, after)` → offending ratio name | null; wire into
   `isRegression`; rollback reason names the ratio when that arm fires.
2. `replayLedger({ledger, throughRound})` prefix option (default behavior byte-identical).
3. Tests per structure.md §6 (worsen→rollback, improve→accept, inert on ratio-less reports,
   prefix replay vs full replay).

Verify: targeted tests green; then the committed-record sweep —
`npm run workshop:replay && npm run workshop:offline && npm run patternbook:offline &&
npm run patternbook:saltcrag:offline && npm run measured:offline` all exit 0 (no committed
record disturbed). Isolation: `node --test src/workshop/isolation.test.mjs` green (no new
imports trip ISO4; no judge tokens introduced).
Commit 3: `feat(E-33 T-135-01): proportion-vs-concept gate — declaration-driven check, ratio no-regress rollback, prefix replay`.

## Step 4 — the witness on the T-127 fixture

Files: `benchmarks/sculpture/proportion-witness.mjs`, `package.json`,
new committed records `benchmarks/sculpture/proportion/{cottage,barn}.{json,md}`.

1. Runner per structure.md §5 (SUBJECTS data rows; decode concept → mask → declarations;
   prefix-replay per round; per-round compare; guarded writes; `--repro` byte-compare;
   `--all`). Concept rels come from the durable-skin registry rows (cottage:
   `runs/014-vConcept-a-cottage/concept.png` — assert sha matches `ledger.conceptRef.sha256`
   so the witness provably measured the chain's own contract image).
2. npm scripts: `proportion:cottage`, `proportion:barn`, `proportion:repro`
   (`--all --repro`).
3. Run `proportion:cottage` + `proportion:barn`; inspect the cottage record — REQUIRED witness
   facts: every round's `roofShare` beyond tolerance vs target (≈0.29-0.30 sketch/concept-
   sourced), the defect row names `roofShare` (the squat-upper-storey / mostly-roof read,
   numerically), per-round ratios present; md digest ties the numbers to the round-1/2/4/6
   critique quotes and the judge-side band1-occlusion description.
4. `npm run proportion:repro` → byte-identical re-derivation, exit 0.

Risk gates in this step (resolve, don't hide):
- Concept eave detection may return null or an implausible row (perspective) → the per-ratio
  sketch fallback must engage and be `sources`-recorded; either source still names the defect
  (program roofShare ≈0.62 vs either target ≈0.29).
- If `decodeImage` of the concept is unexpectedly slow/large that's fine once — the witness runs
  offline, never per-test.

Commit 4: `feat(E-33 T-135-01): proportion witness — T-127 cottage chain measured per round, defect named, repro byte-identical`.

## Step 5 — docs, full suite, review

1. `packs/README.md`: "Proportion conformance" section — the three metric definitions (with the
   eave/ridge detection rules), declaration shape, tolerance semantics (relative + absolute
   floor, default 0.15), concept-first/sketch-fallback rule, activation rule (declared targets;
   committed chains predate declarations and are ungated — S-138 wires live seeds).
2. `npm test` — expectation: green except the **pre-existing** brush-door conformance failure
   from the sibling T-134 working tree (re-verify it reproduces on a clean stash if it appears;
   record exact status in review.md honestly).
3. Write `progress.md` updates throughout; finish with `review.md` (changes, coverage, gaps,
   open concerns: concept-perspective approximation, tolerance default provenance, S-136/S-138
   handoffs).

Commit 5: `docs(E-33 T-135-01): proportion conformance documented — metrics, tolerances, activation` (+ review artifacts).

## Acceptance criteria → steps

| AC | Covered by |
|----|------------|
| Pure metrics, synthetic-silhouette tested, per-mass, concept-vs-build, sketch fallback | Steps 1, 4 |
| Wired into per-round gate beside regularity; tolerances; rollback recorded; ledger ratios; not a judge call; isolation passes | Steps 2, 3 |
| Witness on committed T-127 cottage chain names the defect with numbers | Step 4 |
| No judge runs; replay byte-identical; docs; `npm test` green | Steps 3, 4, 5 |
