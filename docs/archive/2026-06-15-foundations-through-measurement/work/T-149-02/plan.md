# Plan — T-149-02

Ordered, independently verifiable steps. Steps 1–3 are deterministic (no model, no GL) and are the
self-contained, committable deliverable. Steps 4–7 are the live E-35 slice (subscription shim + GL);
each is gated on environment availability and recorded honestly if it cannot complete here.

## Step 0 — preflight (no spend)
- Confirm `npm test` baseline green (T-149-01 left it 2098/2098).
- Confirm clean-ish tree for the files this ticket will touch; note pre-existing unrelated modifications.
- **Verify:** `npm test` exit 0; `git status` reviewed.

## Step 1 — DIAGNOSE band0 (the mandated first move; no spend)
- Write throwaway `docs/active/work/T-149-02/diagnose-band0.mjs`: load cottage occ + matMap + conceptImg
  + componentPlan exactly as the gate does; call exported `deriveZones`; print band `yRange`s +
  dominants; recompute per-azimuth `ownCoverage` (must reproduce committed ~0.40); print the build's
  stone→white transition (y4/5).
- Write `docs/active/work/T-149-02/diagnosis.md`: the branch verdict (instrument vs gap) **with counts** —
  `band0.yRange`, `band1.yRange`, own/dominant fractions, the transition row, and the single
  discriminating number (`band0.yRange[1]` vs y4).
- **Verify:** the harness reproduces the committed band0 own-fraction (≈0.40) → the derivation is faithful;
  the verdict is stated with numbers, not adjectives. **This step gates Step 2's branch.**

## Step 2 — FIX the root cause (branch from Step 1)
### If Branch B (build under-supplies band0's concept-zone — leaned)
- Insert a band-settle dress at the workshop realize seam (`src/workshop/seed.mjs` / `loop.mjs`), reusing
  `zoneFill` (`src/form/placement-grammar.mjs`) + the gate's zone-of, supplying each band's dominant
  across its concept-zone where a foreign block sits, under the run rule.
- The settle is a **no-op** when the dressing already matches the zone (facade-less / aligned builds
  byte-identical) — prove it.
### If Branch A (instrument — boundary snapped wrong)
- Correct only the boundary derivation (`src/color/band-profile.mjs` snap/anchor or `deriveZones`); no
  threshold, no per-building constant.
### Either branch — discipline
- Add the new unit test (Structure §B): the under-dressed/mis-zoned case reaches own ≥ threshold; the
  aligned case is unchanged.
- **Verify (the bar):**
  - `npm test` green including the new test + `coverage-monotone.test.mjs`.
  - **Monotone proof:** re-derive every committed gate record (`gate:*:offline` / `--repro`) →
    byte-identical (no previously-passing coverage changes); committed records untouched (`git diff`
    empty on records).
  - Cottage band0 own-fraction ≥ 0.5 on all 4 views in a fresh offline derivation (coverage-PASS,
    judge-eligible) — OR the residual named with counts.
  - Both arithmetics still emitted; gate contract unmoved.

## Step 3 — COMMIT the deterministic slice
- Commit Steps 1–2: diagnosis.md, the fix, the new test, RDSPI work docs. Message names the branch +
  the band0 root cause. (`Co-Authored-By` trailer per repo convention.)
- **Verify:** working tree clean for committed files; `npm test` green at HEAD; `--repro`/`--offline`
  byte-identical on the touched path.

## Step 4 — LIVE facade recognition (cottage + barn) [shim-gated]
- `node benchmarks/sculpture/facade-grammar.mjs --subject cottage --ticket T-149-02`; same for `barn`.
- Then `facade:offline` (byte-identical replay) + diegetic assertion.
- Commit `merged/record/render/replies/prompt` per subject (pin-guarded; `--rotate-pins` if a pin exists).
- **Verify:** each program gains a real `masses[].facade`; `facade:offline` exit 0; every textured-GLB
  face `layoutOnly:true`; materials are roles (diegetic). **If the shim is unavailable here:** record the
  exact commands as deferred-to-operator; do not fabricate records.

## Step 5 — LIVE relieved workshop build (cottage + barn) [shim+GL-gated]
- `node benchmarks/sculpture/pattern-book.mjs --subject cottage --ticket T-149-02 --rotate-pins`; same
  for `barn`.
- Then `patternbook:repro` + `workshop:replay` (byte-identical on the new chain); `proportion:repro` +
  `visibility:repro` (green-or-named-SKIP, recorded).
- **Verify:** articulation folded (relief present in final artifact); cottage now coverage-eligible
  (Step 2 fix in force); first articulated renders exist. **If shim/GL unavailable:** deferred-to-operator,
  recorded.

## Step 6 — THE GLANCE + facade milestone [depends on 4–5]
- `milestone:facade:baselines` → `milestone:facade --rotate-pins` → `milestone:facade:repro`.
- Compose sheets to `pr/assets/` (cottage + barn: relieved vs flat baseline vs concept).
- **Verify:** both arithmetics per row; `reliefAware armed:false` honest (no judge); `:repro`
  byte-identical. State plainly: does relief deliver / flat→articulated / band0 now reads. A still-flat
  or still-blocked result **is the finding**.

## Step 7 — DOCS + close
- `docs/knowledge/design-learnings.md` E-35: live-build outcome (texture finding) + band0 root cause.
- Pins rotated under T-119 with **retired pins named**; confirm no per-building constants; `npm test`
  green; subscription shim only (never the metered API).
- Write `review.md` (Review phase): files changed, test coverage, open concerns, what landed vs deferred.
- **Verify:** AC ledger walked; honesty clause satisfied for any deferred live stage.

## Testing strategy
- **Unit:** the new band-settle/zone-boundary test (Step 2) + `coverage-monotone.test.mjs` (unchanged,
  must stay green) — the regression guard for the dressing/geometry coupling that T-143-02 lacked.
- **Integration (this repo's idiom):** `--repro`/`--offline` byte-identity on every touched runner
  (gate, chain, witnesses, milestone) — exit-coded, the only "did the committed bytes reproduce" check.
- **Monotone proof:** committed gate records re-derive unchanged — the identity-class discipline bar.
- **No judge run** — out of scope; the glance is rendered evidence, not a verdict.

## Risk & sequencing notes
- Steps 4–5 share `recognition/<runKey>.program.json` (recognition writes the facade; chain reads it) —
  a within-ticket sequence, handled by ordering + pin-guard, not a DAG edge.
- The band0 fix must precede Step 5 so the relieved cottage build is coverage-eligible at the glance.
- Live spend discipline (`spend-limit-reply-failure-mode`, `same-prompt-seam-handle-dont-reject`): probe
  the shim minimally before committing to a full recognition spend; never re-spend on a zero-token notice.
- Environment honesty: Steps 1–3 stand alone and unblock E-34's cottage judge; Steps 4–7 are named
  deferred-with-commands if the shim/GL are absent in this run.
