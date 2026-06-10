# T-088-01 coverage-aware-gate — Design

Decision: promote the runner-local coverage decoration to a pure metric in `zone-fill.mjs`
(`dominantCoverage`), add a pure precondition + combined accept to `face-resemblance.mjs`
(`coverageGate`, `acceptWithCoverage`, default threshold 0.5), wire them into the spray-paint runner
ahead of `acceptIfCloser`, and record the proof both ways in `spray-paint/cottage.json` (gate rejects
the splat-only replay, passes the zone-filled skin) with `--offline` asserting both verdicts.

## Decision 1 — what the metric measures

**Chosen: full-zone-skin denominator.** `dominantFraction(zone) = byBlock[dominant] / total` over the
zone's visible-skin census (`surfaceZoneHistogram`). This is exactly the number already recorded in
`zones.coverage` (0.13 / 0.712) — the gate's unit tests and the proof replay the *same* quantity the
T-085-01 evidence established, with no second definition to drift.

- **Rejected: field-only denominator** (exclude the zone's `preserve` runs — "wall-field" read
  literally). It would push the metric toward 1.0 post-fill by construction (tautology: filled cells
  ARE the dominant), couples the metric to the preserve policy + run detection, and still separates the
  two skins no better (splat-only upper = 83/451 ≈ 0.184 vs 0.13 — both far under any sane threshold).
  The full-skin number is the honest one: a zone where legit secondaries crowd out the dominant SHOULD
  read lower, and the threshold absorbs the secondary share (upper timber ≈ 29%).
- **Rejected: pixel/render-space coverage** (measure the rendered face). Re-introduces the lens the
  whole E-24 line is escaping ([[render-aliasing-not-material-speckle]]); the voxel census is the
  ground truth the render can only distort.

## Decision 2 — where the code lives

**Chosen: split along the existing seam.**

- `dominantCoverage(hist, zones)` → `src/view/zone-fill.mjs`, beside `surfaceZoneHistogram` (whose
  docstring already names this ticket). It is the runner's `coverageRecord` promoted verbatim-in-spirit:
  decorate each census zone with `{dominant, dominantFraction}` from a `zones` policy map (same
  `{[zone]:{dominant}}` shape `zoneFill` takes; dominants normalized via `bareBlock`). The runner's
  local copy is deleted — one definition, now unit-tested (closes the gap T-085-01's review flagged).
- `coverageGate(coverage, {threshold, zones})` + `acceptWithCoverage({coverage, threshold, before,
  after, epsilon})` → `src/view/face-resemblance.mjs`. The AC says "wired into the per-face /
  resemblance gate (E-22)" — the gate logic belongs next to `acceptIfCloser`, which it wraps.

**Rejected: a new `src/view/coverage-gate.mjs` module.** Two ~25-line pure functions split across a new
file boundary buys nothing; both host files are small, on-theme, and already imported by the runner.

## Decision 3 — gate semantics (the precondition)

`coverageGate(coverage, {threshold = DEFAULT_COVERAGE_THRESHOLD, zones})`:

- Iterates the **policy zones** (the intent), not the census zones: every zone the E-21-derived policy
  declares must *demonstrate* its base coat. A policy zone missing from the census, with `total === 0`,
  or with `dominantFraction == null` **fails** — absence of evidence is failure, exactly the
  fooled-gate lesson (the 91%-bare wall *had* a number; a zone with no number is worse). `zones`
  defaults to the coverage record's own keys when omitted (gate everything measured).
- A zone fails when `dominantFraction < threshold` (strictly below, per the AC's "below threshold");
  `fraction === threshold` passes.
- Returns `{passed, threshold, failures: [{zone, dominant, fraction, total}], byZone}` — failures
  carry enough to print one honest line in the record.

`acceptWithCoverage({coverage, threshold, before, after, epsilon})`:

- Runs `coverageGate` FIRST. If it fails → `{accepted: false, reason: "coverage", coverage: <gate>,
  resemblance: null}` — the resemblance delta is **not consulted** (precondition, not tie-breaker; an
  improving 0.25→0.40 cannot rescue a 13% base coat).
- If coverage passes → delegate to `acceptIfCloser`; result is `{...that, reason: accepted ?
  "resemblance-improved" : "resemblance-not-improved", coverage: <gate>}`. `acceptIfCloser` itself is
  untouched — existing callers (and the GL-blind by-construction path in the runner) keep their exact
  contract.

**Threshold = 0.5 default.** Constraints from the recorded evidence: must reject upper@0.13, must pass
the weakest passing zone, base@0.619 → any `T ∈ (0.13, 0.619]`. 0.5 is the natural "is the dominant
actually dominant" reading — a *majority* of the zone's skin — sits mid-window with margin on both
sides, and tolerates upper's 29% legit timber share. Exported as a named constant; the runner passes it
explicitly into the record so the number is durable, not implicit.

- **Rejected: per-zone thresholds.** No evidence yet that zones need different bars; YAGNI — the
  `opts.threshold` scalar can grow into a map later without breaking the seam.
- **Rejected: deriving the threshold from the concept's zone composition.** Attractive (the concept
  says how much field vs. secondary to expect) but it re-couples the gate to the quantization path that
  caused the 9% collapse in the first place. A fixed majority bar is the dumb, auditable precondition.

## Decision 4 — runner wiring & the proof

In `benchmarks/sculpture/spray-paint.mjs`:

1. **§4 front gate (the live path)**: compute `covFrontCandidate =
   dominantCoverage(surfaceZoneHistogram(occ(frontCandidate)), fillZones)` and replace the bare
   `acceptIfCloser` with `acceptWithCoverage({coverage: covFrontCandidate, threshold, before, after})`.
   GL-blind handling unchanged: blind acceptance now ALSO requires the coverage precondition (`before ==
   null → accepted = coverageGate.passed` instead of unconditional `true`) — the gate can no longer
   rubber-stamp while blind, which is strictly safer than today.
2. **§5b final-skin guard**: after the existing base/roof-plaster throw, run `coverageGate(covFilled)`
   and **throw on failure** — same precedent as the plaster guard: a failing skin must never silently
   ship a record.
3. **§2b proof both ways**: gate both replays with the same pure call —
   `gateSplatOnly = coverageGate(covSplatOnly)` (expect `passed: false`, failures = [upper 0.13]) and
   `gateZoneFilled = coverageGate(covFilled)` (expect `passed: true`). Recorded under
   `zones.coverageGate = {threshold, splatOnly, zoneFilled}` + a line in `cottage.md`. The splat-only
   record notes that the verdict is delta-independent: even the historically accepted 0.25→0.40 front
   delta cannot pass it (`acceptWithCoverage` with that delta is also exercised in unit tests with the
   real recorded fractions).
4. **`--offline`**: extend the assertion to `coverageGate.splatOnly.passed === false &&
   coverageGate.zoneFilled.passed === true` (skip-if-absent like the other fields, so older records
   degrade to the previous check rather than crash).
5. Delete runner-local `coverageRecord`; keep `coverageLine` (formatting only).

**Rejected: gating only inside the runner (no pure export).** The AC demands a pure, unit-tested metric
and gate; the runner stays wiring-only per the seam invariant.

**Rejected: blocking `npm test` on the cottage record.** Benchmarks stay out of the unit gate by
convention; the unit tests pin the gate logic against the recorded fractions as fixtures, and
`--offline` re-checks the committed record on demand.

## Test design

- `zone-fill.test.mjs` (+~3): `dominantCoverage` on a hand-built census — fraction correctness +
  ‰-rounding; dominant absent from `byBlock` → 0; zone without policy → `dominant: null, fraction:
  null`; runs against the synthetic hut histogram already in the file.
- `face-resemblance.test.mjs` (+~5): `coverageGate` pass / single-zone-fail (any-zone semantics) /
  boundary (`=== threshold` passes) / missing-policy-zone fails / empty census fails;
  `acceptWithCoverage` — coverage-fail + improving delta → rejected with `reason: "coverage"`;
  coverage-pass + improving delta → accepted; coverage-pass + non-improving → rejected
  (resemblance reason); **the real-numbers proof**: recorded fixtures (upper 0.13 splat-only vs 0.712
  zone-filled, delta 0.25→0.40) reject/pass exactly as the AC demands.

## Risks

- The live GL run regenerates face PNGs/scores; coverage numbers are deterministic but resemblance
  scores may drift a few ‰ — acceptable, records are regenerated-by-run artifacts (Rule 1).
- T-086-01 may swap upper's dominant block id; nothing here hard-codes plaster — the gate reads
  whatever `ZONE_POLICY`/the map says.
