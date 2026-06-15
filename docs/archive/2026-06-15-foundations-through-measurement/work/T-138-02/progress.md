# T-138-02 proportion-milestone-resumption — Progress

## Completed

- **Step 0 — hygiene**: `workshop/cottage/program.json` restored to HEAD (the interrupted
  re-seed discarded per D1 — the chain regenerates deterministically). Baseline pinned:
  `patternbook:repro` shows exactly the named window (cottage seed-compare DIVERGES; barn
  byte-identical) and `patternbook:saltcrag:repro` barn--saltcrag byte-identical.
- **Step 1 — spend probe #1**: `claude -p` (opus-4-8) answered token-bearing (`ok`). Seam live.

- **Step 2 — cottage chain DONE**: `pattern-book.mjs --subject cottage --ticket T-138-02
  --rotate-pins` — budget-exhausted 6/6 rounds, final conformance FAIL (proportion-vs-concept:
  ridgeToEave 5.5 vs 1.4145, roofShare 0.8182 vs 0.293; aspect 1.0357 within). All 8 pins
  rotated under pin-guard. Chain `--repro` and `--offline` exit 0 (byte-identical); full
  `patternbook:repro`/`:offline` sweeps green — **the T-138-01 step-5 named red window is
  closed** for all three chains.
- **FINDING (the cottage residual, diagnosed not repaired)**: the armed proportion instrument
  misread the realized cottage and the misread inverted the loop. The build carries a plinth
  band at y3–4 that is 1–2 blocks wider than the walls (verified from final-artifact extents:
  walls 26–28 wide, plinth 28–29); `eaveWidthFrac: 0.98` admits only that band as an
  eave-layer candidate, so `maskProportions` read eave=4–5 / totalH=22 (recorded 5.5/0.8182)
  where the true eave is ~12–15 (corrected read ≈1.7/0.45 — still off target, not absurd).
  Eyes-to-hands HELD: the model aimed the correct wall-raise lever in 5/6 rounds
  (`eaveHeight:24` r1/r3, `storeys:6,storeyHeight:4` r2/r5, `storeys:4,storeyHeight:4` r6) —
  refused by the rustic storeyHeight band (apply-failed, pack vocabulary) and the schema's
  storeys≤4 cap; and with the eave pinned to the plinth, every wall-raise read as a
  ridgeToEave regression, so the cage ACCEPTED the one wrong-direction move (`storeys:3`,
  r4, 6.2→5.5) — the loop hill-climbed the artifact. Per E-33 rules this is recorded honestly
  and FLAGGED (instrument defect + pack-band refusal), not repaired mid-milestone: changing
  `proportionRatios` now would re-derive conformance under every committed replay. Same class
  as `roof-diff-instrument-inverts-refits` (T-118) and the steep-gable top-block misread.

- **Step 3 — cottage gate DONE** (commit A `487fe2e`): probe green; gate decided, 4/4 views
  judged per-view through T-114 (no coverage refusal — T-137's lift held on the new build,
  consumed by a real judge run): 2 same-object (45°/135°) + 2 drifted (225°/315°, major
  massing "roof vs walls" — the judge independently sees the roof-heaviness the corrected
  instrument numbers show). Both arithmetics: identity 2/4; budget 11/2 FAIL. Gate `--offline`
  green; sheet + workshop frames committed.
- **Step 4 — compose DONE** (commit B `1a3d3af`): `milestone:proportion` composed
  (`proportion-milestone.json` + `pr/assets/proportion-milestone.md`), `:repro`
  byte-identical; `pattern-book-compare --rotate-pins` re-composed head-to-head +
  pattern-book-milestone.md; the four T-138-01 barn workshop frames committed as evidence.
  **Witness checks RAN and FAILED-NOT-SKIPPED** (verbatim below) — flagged, not repaired.
- **Step 5 — docs DONE**: design-learnings gains "Measured proportion loop (E-33)" + E-12
  handoff. `npm test` 2009/2009 after the fixture fix (commit `e0d000d`): the two T-137
  monotone tests pinned the LIVE cottage-patternbook record as their flip witness; the
  sanctioned rotation retired it, so the retired record (sha f5567754…, the exact pin quoted
  in proportion-baselines.json) is pinned verbatim at `src/view/fixtures/` and the flip proof
  reads the fixture.

## Witness-check verbatim outcomes (step 4.4)

- `npm run proportion:repro` exit 1: `cottage: replayLedger: round 4 is geometry-bearing —
  pass the pack (a committed, sha-pinned input)`; same for barn round 1. The witness's
  replayLedger call predates geometry-bearing ledgers and never passes the pack.
- `npm run visibility:repro` exit 1: `barn-patternbook`, `barn-patternbook-saltcrag`,
  `cottage-patternbook` → `repro: DIVERGES` (the SKIP guard covers artifact pins only —
  gatehouse-current shows the designed SKIP; rotated gate records re-census and diverge).
- Provenance proven at a `caf0d13` baseline worktree: barn legs ALREADY failed both witnesses
  before this session (T-138-01 rotated barn pins but was interrupted before step 9 ever ran
  these checks); the cottage legs joined after this ticket's rotation. Witness code and
  witness pins untouched — no owning mandate; flagged to the reviewer.

## Deviations from plan

1. Witness degradation produced FAIL-instead-of-SKIP (the plan's stop-and-record case).
   Recorded verbatim + provenance-proven pre-existing; the ticket continued because the
   failures are truthful tripwires on retired pins, independent of the remaining ACs, and
   repairing them (witness code or pin refresh) lies outside this ticket's mandate.
2. `npm test` required a test-only fixture change (not in the plan): the T-137 monotone tests'
   live-record fixture was retired by this ticket's own sanctioned rotation. Fixed by pinning
   the retired record bytes as a fixture (commit `e0d000d`) — no instrument code touched.
3. The cottage chain ended budget-exhausted/conformance-FAIL (contingency path, not the happy
   path): recorded honestly; the plinth-eave instrument inversion diagnosed and flagged (see
   commit A message and the E-33 design-learnings section).

## Remaining

- Commit C: design-learnings + work-dir artifacts (T-138-01 + T-138-02).
- Step 6: review.md (story S-138, both tickets).
