# T-166-01 — Plan

Ordered, independently-verifiable steps. Each commits atomically. Live (metered) steps are isolated so a
spend failure leaves the pure + deterministic work committed.

## Step 1 — Pure scoring module + test (no model; gates `npm test`)
- Create `src/workshop/bakeoff-score.mjs` per Structure: `regionToDepartment`, `worstDepartmentOfDispatch`,
  `worstDepartmentOfFusedReply`, `styleFidelityScore`, `critiqueEvidence`, `dispatchCorrectness`, `PENALTY`,
  `BAKEOFF_SCHEMA`.
- Create `src/workshop/bakeoff-score.test.mjs`: keyword map (one case per department + the default-WALL
  `matched:false`), score boundaries (empty→100, one major→80, clamp floor at 0), worst-dept extractors
  (dispatch first item; fused first-major-else-first; throw on empty), `dispatchCorrectness` aggregation.
- **Verify:** `npm test` green (count = baseline + new). Commit: `feat(T-166-01): pure bake-off scoring`.

## Step 2 — package.json scripts (additive)
- Add `"bakeoff"` and `"clean-wrong-style"` scripts.
- **Verify:** `node -e` import smoke of the harness files (they should fail only on missing live transport,
  not on syntax/import). Commit with Step 1 or separately.

## Step 3 — Claim 2 harness `clean-wrong-style.mjs` (the headline)
- Write the harness: fixed gatehouse renders + inline synthetic gatehouse program; CONDITIONS A/B/C (+ a
  triangulation wrong-style concept); `VOTES=3`; per-condition mean `styleFidelityScore` + `critiqueEvidence`;
  spreads A−B, A−C, B−C; read the E-38 scalar baseline for the side-by-side; beside-concept compose.
- **Asset guard** before any spend: every concept/render path `existsSync`.
- Confirm the wrong-style + matched renders compose beside concepts (no model): write the two PNGs first,
  verify they open, *then* gate the live calls.
- **Verify (live):** run `npm run clean-wrong-style`. Inspect `results/clean-wrong-style.json` + the PNGs.
- Commit: `test(T-166-01): clean×wrong-style crater harness + evidence`.

## Step 4 — Claim 1 harness `bakeoff.mjs`
- **First, confirm ground-truth labels** by render inspection (Read the candidate renders beside their
  concepts); keep only unambiguous worst-defect states, log the excluded ones.
- Write the harness: `STATES[]`, split + fused per state × `VOTES`, `dispatchCorrectness`, write
  `results/bakeoff.json`. One call per layer, no re-ask.
- **Verify (live):** run `npm run bakeoff`. Inspect rows + totals; confirm fused-wins are reported if they
  occur.
- Commit: `test(T-166-01): split-vs-fused dispatch bake-off + evidence`.

## Step 5 — FINDINGS.md (the honest record, AC3)
- From the real numbers: lead with how each claim fails; state which way each landed; numbers + `missing`
  evidence + render paths; name the localized next gate for whichever failed.
- Commit: `docs(T-166-01): bake-off + crater FINDINGS`.

## Step 6 — Review
- Re-run `npm test` (green). Write `review.md`: files, AC status, test coverage + gaps, open concerns,
  risk. Commit: `docs(T-166-01): review`.

## Testing strategy
- **Unit (in `npm test`):** the entire `bakeoff-score.mjs` surface — deterministic, the rules a reviewer
  must trust. This is the only code that gates the suite.
- **Live witnesses (NOT in `npm test`):** the two harnesses, metered + non-deterministic, one call per
  layer (smoke precedent). Their committed JSON + PNG are the evidence; they are not gating tests.
- **Frozen-instrument guard:** no edits to the scalar judge / gate / transport-guard / `loop.mjs` / BAML
  sources — verified by the unchanged TG suite passing.

## Fallback / failure handling (anti-hedge, pre-committed)
- **Live transport unavailable / auth fails:** commit the pure module + harnesses + a FINDINGS that records
  the run could not be metered here and exactly what command reproduces the numbers. The claims then carry
  the *deterministic* support (DG7 for the per-style grammar diff; the typed-vs-untyped asymmetry for
  dispatch) with the live confirmation named as the remaining step. State it plainly — do not imply numbers
  that were not produced.
- **No build clean enough / crater doesn't appear / split loses:** these are the *valuable* outcomes —
  record them with numbers and route each to its named next gate. A green that hid them is the anti-hedge
  violation this ticket exists to prevent.
</content>
