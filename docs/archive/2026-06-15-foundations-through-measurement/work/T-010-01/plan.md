# Plan — T-010-01: detail lever B (texture grain)

Ordered, independently-verifiable steps to apply the one texture-grain detail lever (revision seam),
run the Taj `vRefRevise-designdoc` trial twice, judge both rounds, decide the verdict, and journal it
with an explicit comparison to S-006's relief-panel lever. Live & metered — each run is 3 `claude -p`
calls (~$1.6–2.0, ~15–18 min).

## Step 1 — Apply the lever (one prompt diff)
Edit `composeRefRevisionPrompt` in `benchmarks/temple-facade/run.mjs`: replace the two `Detail —`
bullets (lines 429–441, S-006's panel grammar + anti-grain guard) with the two **texture-grain**
bullets (Design §"The lever, concretely"): (1) patterned variant-block grain within each field's
material family; (2) hard color-hierarchy guard (texture not hue, no contrast loss, accents un-grained).
Leave the one-plane / proportion / relief / color-restore bullets intact and ahead.
- **Verify:** `git diff` shows exactly the two detail bullets changed in one function; no other hunk.

## Step 2 — Tests stay green
Run `npm test`.
- **Verify:** validate self-test + invalid check + unit tests pass (133 expected). No `baml:gen`
  (no `.baml` changed). If anything fails, the prompt edit is the only suspect — fix or revert.

## Step 3 — Copy the round-0 judge helper
Copy T-006-01's `judge-round0.mjs` to `docs/active/work/T-010-01/judge-round0.mjs` (identical relative
imports resolve from the sibling dir).
- **Verify:** `node docs/active/work/T-010-01/judge-round0.mjs` prints its usage line (imports resolve).

## Step 4 — Generation 1 of the variant (run 018)
`node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/taj_mahal.png`
(launched as a background task; the harness re-invokes on completion).
- Produces `runs/018-vRefRevise-designdoc/` with `round-0.png`, `render.png`, `summary.json`
  (render score, median-of-3).
- **Verify:** run completes; `summary.json.score` present; both PNGs exist.

## Step 5 — Judge round-0 of generation 1
`node docs/active/work/T-010-01/judge-round0.mjs runs/018-vRefRevise-designdoc/round-0.png`.
- **Verify:** per-dimension categorical score for round-0 (the within-run control). Record the A/B
  (round-0 vs render, all 5 dimensions) in `progress.md`.

## Step 6 — Generation 2 of the variant (run 019, robustness)
Re-run the identical command (no config change) → `runs/019-vRefRevise-designdoc/`. Judge its
`render.png` (auto) and `round-0.png` (helper).
- **Verify:** second full A/B captured — the 2-generation robustness sample the AC requires
  (detail=strong must replicate, not be a one-shot flip). **Color is watched as closely as detail**
  (the v5 tripwire): a color drop on either generation is an automatic non-promote.

## Step 7 — Baseline texture-articulation comparison
Compare the 018/019 renders' detail to the **015 baseline** render
(`runs/015-vRefRevise-designdoc/render.png`): is there a *describable* texture-articulation increase
(coursing/quoining/banding now breaking the orange wall fields) beyond 015's window grain, and does the
palette still read as 3-tier (dominant terracotta / supporting gold / lapis accent)? Note qualitatively
in `progress.md` — the second acceptable robustness signal per the AC.

## Step 8 — Decide the verdict (AC promotion rule)
Promote **iff** ALL hold:
- `detail` rises a full category to *strong* (vs round-0 control and vs 014 competent), AND
- **no regression on proportion / color / fidelity** (color especially), AND overall ≥ *strong*, AND
- robust: `detail` *strong* across **both** generations' renders, OR a clear describable
  texture-articulation increase vs the 015 baseline.
Else → **discard** (or **scope** if it helped one generation but not robustly): revert the diff. A
single noisy `detail=strong`, or any color regression, does not promote.
- **Verify:** the decision is written with the numbers that justify it.

## Step 9 — Revert if not promoting
If discard/scope: restore lines 429–441 to their correct champion state in `run.mjs`. Because S-006 did
not promote (016 detail=competent), the correct champion is the pre-S-006 **015 menu** baseline; restore
to that (not to S-006's panel grammar) so the on-disk config reflects the actual champion. Record the
choice in `progress.md`.
- **Verify:** `git diff benchmarks/temple-facade/run.mjs` reflects only the intended champion state.

## Step 10 — Append the attempt-log entry
Append a dated entry (newest last) to `docs/knowledge/design-learnings.md`: the **prompt diff**
(before/after bullets), the **A/B per-dimension scores** for both generations (round-0 vs render), the
**015-baseline** texture comparison, the **judge notes**, the **verdict**, and — the headline AC — the
**explicit S-006 (relief panels) vs S-010 (texture grain) comparison**: which detail mechanism works
better and *why* (depth-dependent and flattened by the model vs flat-Z-legible but color-risky). Refine
P15 / the measurement caveat only as the result warrants.
- **Verify:** entry present; contains diff + both A/Bs + verdict + mechanism comparison.

## Step 11 — Retain artifacts + Review
Confirm renders + `summary.json` retained under each `runs/<id>/`. Write `review.md`.

## Testing strategy
- **Unit/contract:** `npm test` (Step 2) — the only automated gate; guards the edit didn't break the
  harness. A prompt change has no unit test of its own (P: prompt strings aren't unit-tested).
- **Experimental (the real test):** the frozen categorical judge, median-of-3, on 4 renders (2 gens ×
  {round-0, render}). The A/B + 2-gen robustness + 015-baseline comparison IS the hypothesis test —
  judgment under noise, with round-0 / 015 / 2-generations as the controls that make a `detail=strong`
  credible rather than lucky. **The color dimension is a co-equal gate here** (v5 precedent), unlike
  S-006 where relief could not crash color.
- **Verification criteria = the AC promotion rule** (Step 8), applied honestly. A falsified texture
  lever (esp. a color crash) is a *successful* ticket outcome — it resolves the corpus's open
  "texture as a deliberate variable" question with a controlled result.

## Commit strategy
Commit the lever edit + work artifacts after the experiment concludes — one commit if promoting; if
reverting, commit the journal entry + revert together so the trail shows the texture lever was tried
and judged. Lisa handles branch/serialization.

## Cost / time budget
~2 full runs × (3 model calls + 1 judge) + 2 round-0 judges ≈ ~$4–5, ~15–18 min each. Acceptable for
an overnight hill-climb link. If gen 1 crashes color hard and unambiguously, gen 2 may be skipped and
the negative recorded (a clear color crash needs no replication to falsify a promotion).
