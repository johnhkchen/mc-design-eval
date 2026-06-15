# T-061-01 Plan — ordered, verifiable steps

Five steps, three commits. Each step is independently checkable. No model calls, no GL; the only
"live" action is the runner stitching composites from existing PNGs.

## Step 1 — pure scorecard core + tests

- Create `src/form/e18-scorecard.mjs`:
  - `FIXES` (thin/segment/discipline → isolating baseline + metric), `EPS` per metric.
  - `meanPresent(values)`, `attributeFixes(spine)`, `classifyRouting(spine)`, `assembleE18Scorecard(spine,opts)`.
  - `renderMd(json)` → Levels + Marginal Δ + "what each fix bought" + routing + honesty notes.
  - Reuse `METRICS`, `BUILDS`, `delta` from `remeasure.mjs`; consume spine `deltas` verbatim.
- Create `src/form/e18-scorecard.test.mjs`: synthetic spine fixture; 5 tests (attributeFixes form +
  speckle/discipline, meanPresent null-skip, classifyRouting partition, assembleE18Scorecard shape).
- **Verify:** `node --test src/form/e18-scorecard.test.mjs` green.
- **Commit:** `feat(E-18 T-061-01): e18-scorecard pure core — per-fix attribution + form-type routing`.

## Step 2 — runner + tracked bundle

- Create `benchmarks/sculpture/e18-scorecard.mjs`: reads `e18-remeasure.json`, stitches the three
  before/after composites via `montageRow`, writes `pr/assets/surface-and-thin.md` (scorecard +
  handoff/routing/sword prose) and `pr/assets/e18-scorecard.json`. `--no-frames` flag.
- **Verify:** `node benchmarks/sculpture/e18-scorecard.mjs`; confirm it logs 3/3 frames stitched and
  writes the md; spot-check the md numbers against the spine table in research.md (speckle avg
  0.44→0.30→0.13; off-pal 0→2790.57→0; value ΔE 5.47→0→8.67; bow form +0.053; dancing-man −0.10).
- **Verify:** the 3 PNGs exist and are non-trivial size; `git status` shows them tracked.
- **Commit:** `feat(E-18 T-061-01): surface-and-thin scorecard + before/after composites (E-12 bundle)`.

## Step 3 — journal section

- Append `## Surface coherence & thin form (E-18) — …` to `docs/knowledge/design-learnings.md` after the
  E-17 section: the fix table (segmentation/discipline/thin), the speckle + off-palette + thin numbers,
  the value-ΔE cost (honest negative), the form-type-routing rule + sword boundary, the residual, the
  one-sentence distillation. Numbers verbatim from the spine.
- **Verify:** read-back; every number matches `e18-remeasure.json` / `surface-and-thin.md`.

## Step 4 — frames provenance

- Append a provenance block to `pr/assets/frames/README.md` for `speckle-heart.png`, `speckle-koi.png`,
  `thin-bow-and-arrow.png`: source render per panel (the gitignored paths), the before/after meaning,
  and `node benchmarks/sculpture/e18-scorecard.mjs` as the regen command.
- **Verify:** read-back; the listed source paths exist locally.
- **Commit (Step 3+4):** `docs(E-18 T-061-01): design-learnings E-18 section + frames provenance`.

## Step 5 — gate + RDSPI close

- **Verify:** `npm test` green (≥ 605 = 600 baseline + 5 new).
- Write `progress.md` (execution log + AC evidence) and `review.md` (changes, coverage, concerns).
- The progress/review docs land with the final docs commit or a trailing commit; Lisa handles phase
  transitions from the artifacts.

## Testing strategy

- **Unit (pure, in `npm test`):** `e18-scorecard.test.mjs` covers all branchy logic — fix attribution
  math, routing partition, null tolerance, md shape. Fixture is a hand-built spine; no files, no GL.
- **Manual (runner):** numbers in the emitted md are cross-checked against the frozen spine (the spine
  itself was unit-tested in T-060-01 via `remeasure.test.mjs`, so the scorecard need only prove it
  *reads* the spine faithfully — which the shape test + manual spot-check cover).
- **No new perceptual/IoU judging** — a consolidation must not manufacture model evidence; all numbers
  trace to committed records.

## Risks & mitigations

- **Number drift** between scorecard, journal, and spine → the scorecard is a *pure read* of the spine
  (D1); the journal is hand-written but spot-checked digit-for-digit against the spine in Step 3.
- **A source render absent** → runner logs + skips that pair, still writes the scorecard (mirrors
  `sweep-scorecard.mjs`); all four confirmed present in Research, so expected 3/3.
- **Over-reading off-pal → 0 or value-ΔE=0** → both flagged in the honesty notes (augmented design-doc
  palette named; R2's 0 called tautological, E18's nonzero called a real cost).
