# T-133-01 measured-proportions — Plan

Each step is independently verifiable and committed atomically. No phase/status edits to the
ticket (Lisa owns transitions). Before any record write: check for sibling-session activity on
this ticket (work-dir mtimes — the same-ticket concurrency lesson).

## Step 1 — the pure seam module + unit tests

**Files:** `src/recognition/measured-program.mjs`, `src/recognition/measured-program.test.mjs`.

Build in this order (each helper test-first against synthetic fixtures):

1. `sketchBlocksFactor` / `sketchMeasurements` — unit normalization. Fixtures: a barn-like sketch
   (factor 1) and a cottage-like sketch (factor 2/3, fractional eaveBlocks, non-rect footprint);
   a degenerate sketch missing `pitch` → `pitchRatio: null`.
2. `factorEave` — exhaustive-search correctness: barn 10 → {2,5} exact; cottage 19.3 → {4,5};
   tie-break order (band → recognized-storeys proximity → fewer storeys) each pinned by a case;
   schema bounds respected (eave 30 → best ≤ 24, residual recorded).
3. `snapPitch` — 0.71→1 for [1]; 1.6→2 and 0.6→0.5 for [2,1,0.5]; tie → smaller class.
4. `scaleFootprint` — endpoint scaling keeps touching masses touching (two-mass fixture);
   min-width clamp; per-axis applied flags.
5. `applyMeasuredProportions` — the contract tests:
   - MP-sources: ledger has an entry for EVERY dimensional parameter of every mass
     (footprint.w/d, eaveHeight/storeyFactorization, pitchClass, ridge derived) — zero silent
     defaults (AC 2).
   - MP-sketch-wins: recognition 2×4 vs sketch 19.3 → program carries 4×5; conflict recorded with
     both values, `resolved: "sketch"` (AC 1).
   - MP-fallback: sketch with `pitch: null` → pitchClass kept from recognition,
     `source: "fallback"`, note names the missing measurement (AC 2).
   - MP-naming-untouched: roles, idioms, openings, treatments, ridgeAxis, reading byte-equal
     before/after (AC 1).
   - MP-valid: output passes `assertBuildingProgram`; `validateProgramAgainstPack` residual
     findings ⊆ predicted (band excursion); an *unpredicted* finding (e.g. an opening pushed
     infeasible without the fallback path) throws.
   - MP-byte-stable: two invocations → `JSON.stringify`-identical outputs.
   - MP-lane-fallback: fixture where the measured extent breaks an opening lane → that axis falls
     back, recorded.
6. `silhouetteRatios` — synthetic compiled program with known eave/ridge/footprint → exact ratios.

**Verify:** `npm test` green (incl. the suite-wide brush/registry/isolation tests untouched).
**Commit:** `feat(E-33 T-133-01): measurement-to-program seam — quantity from geometry, sources recorded`

## Step 2 — the runner + named scripts

**Files:** `benchmarks/sculpture/measured-proportions.mjs`, `package.json`.

- `measuredRels` helper; live mode per structure.md data flow; `--repro`/`--offline` re-derive +
  byte-compare (no GL, renders excluded from decisions); skip-not-fail for uncommitted subjects;
  pipeline-failed record posture; self-grep; pin-guard preflight before writes.
- Scripts: `measured:cottage`, `measured:barn`, `measured:repro`, `measured:offline`.

**Verify:** `node benchmarks/sculpture/measured-proportions.mjs --all --repro` → "no committed
records — skipped" for every subject + the no-records error exit; self-grep clean
(`grep -c 'cottage\|barn\|church\|gatehouse' …` = 0 modulo the registry import line — use the
SUBJECTS-keys check, same as pattern-book).
**Commit:** `feat(E-33 T-133-01): measured-proportions runner — the named runs, records at new paths`

## Step 3 — re-seed cottage + barn (the named runs, live)

```
npm run measured:cottage
npm run measured:barn
```

- Expect (sanity targets, derived in research): cottage eave 8 → 20, footprint 26×28 → 27×32,
  pitch 1 → 1 (residual ~0.29 recorded); barn eave 9 → 10, storeys 3×3 → 2×5, d 24 → 26,
  pitch unchanged, ridge implied vs measured residual recorded.
- Conformance must PASS for both (else the runner refuses and writes pipeline-failed — stop and
  diagnose: likeliest culprits are opening-lane feasibility on the scaled cottage walls and the
  workshop-program schema's bounds; fix in the seam's fallback path, never per-building).
- Inspect the four renders per subject **by eye** (the glance: taller massing visible vs the
  committed recognition/workshop views). Renders are evidence; if GL is unavailable the record
  carries `renderError` and the run still stands.
- Check `record.json` ratios: cottage before ridgeToEave 17/8 ≈ 2.13 → after ≈ target-ward
  (target from sketch ≈ 27.3/19.3 ≈ 1.41); aspect 26/28 → 32/27 read against sketch 32/26.7.

**Commit:** records + any seam fixes:
`feat(E-33 T-133-01): cottage+barn re-seeded measured — programs with sources, renders, ratios`

## Step 4 — replay + suite + prior-pin proof

```
npm run measured:repro && npm run measured:offline   # byte-identical (AC 4)
npm run patternbook:repro                            # prior rustic pins still hold
npm run patternbook:saltcrag:repro                   # (drift here is pre-existing — verify
                                                     #  against a clean baseline before blaming
                                                     #  this ticket; the T-128 lesson)
npm test                                             # green (AC 5)
```

If `patternbook:repro` fails, this ticket broke a shared seam — bisect immediately (only Step 2's
runner and Step 1's module are new; neither touches chain code, so any failure means an accidental
edit — revert it).

**Commit:** (only if fixes were needed) else fold the repro receipt into Step 5's review.

## Step 5 — review

`docs/active/work/T-133-01/review.md`: files changed, AC-by-AC verification with receipts
(test names, record shas, repro exit codes), test-coverage map, open concerns (rustic pitch
immobility → S-134; opening crowding on tall walls → S-136; chain adoption of measured programs →
S-136/S-138 handoff; the cottage 19.3-block eave is TRELLIS-measured — if the concept glance
disagrees, E-33's honesty note routes that to S-135's concept-side check). Then stop — Lisa
handles transitions.

## Testing strategy summary

- **Unit (Step 1):** every pure helper + the five AC-bearing contract tests; no I/O.
- **Integration (Steps 3–4):** the named runs ARE the integration tests (committed records,
  conformance PASS receipts, byte-identical replay sweeps, prior-pin sweeps).
- **Not tested here:** judge verdicts (T-138), workshop-round behavior (S-136), render-vs-concept
  ratios (S-135).

## Risks & mitigations

| risk | mitigation |
|---|---|
| cottage lane infeasible after x-shrink (26→27 grows; z 28→32 grows — likely fine) | seam's recorded per-axis fallback; MP-lane-fallback test proves the path |
| workshop-program schema rejects sh=5 geometry | it carries only realized ints (shell height 20 etc.); assert in Step 1 via a compile round-trip in MP-valid |
| `realizeProgram`/conformance surprise at eave 20 | Step 3 refuses on conformance FAIL; diagnose against the seam, never hand-edit records |
| sibling session on this ticket | work-dir mtime + recent-commit check before Step 3 writes |
| accidental shared-file edit breaking prior pins | Step 4 sweeps; new-files-only diff audit before each commit |
