# T-204-01 — Design: land slate colour; build a real (tolerance-gated) pitch lever; name the residual

Grounded in research.md. The ticket's two coupled fixes split cleanly into **a clean win (colour)** and **an
honest, anti-hedge-shaped result (pitch)**. Lead with how each fails.

## Decision summary

1. **Colour — land it by demonstration, no code change.** `recolor_roof` already resolves to value-true
   `deepslate_tiles` (research §1). Run the existing zero-spend `ROOF_MATERIAL_PROBE` glance + a roof-cell
   census proving every roof cell flipped brown→slate. AC1 met by running the wired path, not by editing it.
2. **Pitch — build a REAL, tolerance-gated ridge-for-ratio lever; do NOT force-flatten the gatehouse.** Add a
   pure `gableRidgeForRatio` helper, wire it into both roof hands, unit-test it firing on an out-of-tolerance
   case. For the gatehouse the honest gable is **within tolerance (1.55)**, so the lever is byte-identical
   there (it only corrects genuine drift) — and the end-of-climb flag (1.6316) is named as a **measurement
   artifact** (relief proud-detail polluting `eaveYOf`), cross-referenced to T-202. This is the ticket's
   explicit "demonstrate the limit, don't fake the lever" branch — at full strength.

## Why this split (the anti-hedge reasoning)

The naïve reading is "the roof is too steep → flatten it to 1.35." The trajectory **refutes** that: the roof
at honest pitch 1 measures 1.55 (relDelta 0.148 < 0.2 — *not flagged*); the flag appears only after
`relief_walls` pushes the *measured* ratio to 1.6316 by polluting `eaveYOf` (proud quoins/plinth raise the
per-y perp extent, drop the detected `eaveY`, shrink the eave denominator). So:

- Flattening the roof to 1.35 would over-correct a non-divergence to mask a bug that lives in the *eave
  measurement*, not the roof. The ticket calls this out by name: *"anti-hedge: don't fake a lever."*
- The genuinely correct fix for the *flag* is to make the framing eave read proud-detail-invariant — the same
  invariance T-202 is building for `eaveRingClosure`. That is **T-202-adjacent scope**, not this ticket.

So the honest deliverable is: a real pitch lever that exists, is tested, and fires on demand (refuting "the
lever doesn't exist"); applied tolerance-gated so it never fakes a fix; plus the residual named precisely.

## Options considered — pitch

### Option A — force the ridge to the target ratio in both hands (rejected)
Compute `ridgeY = eaveY + round(eaveHeight·(target−1))` unconditionally. Brings the gatehouse honest gable to
1.35. **Rejected:** (a) over-corrects a within-tolerance roof; (b) masks the relief/`eaveYOf` measurement bug,
the explicit anti-hedge failure; (c) flattens below the recognised `pitchClass 1`, fighting the "peaked gable"
glance for a ratio that wasn't actually wrong; (d) changes byte output for matched subjects too.

### Option B — tolerance-gated ridge-for-ratio lever (CHOSEN)
A pure helper computes, given `(eaveY, eaveHeight, perp, targetRatio, tol)`:
- `riseAtPitch1 = floor(perp/2)`, `ratioAtPitch1 = (eaveHeight + riseAtPitch1)/eaveHeight`.
- If `relDelta(ratioAtPitch1, target) ≤ tol` → **keep pitch 1 exactly** (`changed:false`, byte-identical).
- Else compute `targetRise = round(eaveHeight·(target−1))`, snap `pitch` to the nearest generator-supported
  class in `{0.5, 1, 2, 3}` minimising `|achievedRatio − target|`, set `ridgeY = eaveY + achievedRise`,
  return `{ridgeY, pitch, changed:true, ratioBefore, ratioAfter, reason}`.

**Chosen** because it is a genuine construction guardrail ("build the roof to the recognised proportion when it
would otherwise drift out of tolerance"), it is byte-identical for the gatehouse and other in-tolerance
subjects (no regression), and it is the real lever the ticket asks for — demonstrable on a synthetic
out-of-tolerance case. **Fails if:** the snapped pitch class can't get within tolerance for some footprint
(then `changed:true` but flag persists — reported, not hidden); or a future subject's matched roof sits just
inside tol and a later detail pass tips it out (the T-202 measurement-invariance issue, not the lever's).

### Option C — pitch as a pure named residual, no lever code (rejected)
Just write up that the flag is a measurement artifact and add nothing. **Rejected:** the ticket asks for a
lever and anti-hedge wants the falsifiable "lever exists" claim *run*, not asserted. Building + testing the
lever is cheap and refutes failure-mode #1 concretely.

## Options considered — colour

### Option A — run the existing probe + census (CHOSEN)
`ROOF_MATERIAL_PROBE=1` already renders the slate glance with zero spend; add a deterministic roof-cell census
(every cell at `y ≥ eaveY+1` is `deepslate_tiles`) as render-independent proof. No code change to the colour
decision (it is correct). **Fails if:** GL is unavailable (then census + the existing committed T-189 probe
renders stand as evidence, render attempted and its absence reported — never claimed).

### Option B — add `selectValueTrueBlock` value-true re-selection (rejected)
Re-pick the slate via `src/color/value-select.mjs` against a concept swatch. **Rejected:** the material map
*already* chose the dark value-true block (`deepslate_tiles`, explicitly "markedly darker than the walls");
re-selecting would duplicate recognition and risk dethroning the correct named block. Value-true is already
satisfied; verify on the glance, don't re-derive.

## E-50 override (rollback-keep) — verify, don't rebuild

recolor_roof is `TOOL_DEPARTMENTS:["ROOF"]`, stage `form`. Clearing the ROOF wrong-style `replace` while
adding no new major is the department-dominant keep case. Confirm coverage in `climb-gate.test.mjs`; add an
explicit `recolor_roof`-named assertion if the existing tests only cover it generically. No live climb needed
(the gate is pure and unit-tested).

## What lands where

- **Lever (pure, tested):** `src/view/roof-generate.mjs` + `roof-generate.test.mjs`.
- **Wiring (tolerance-gated, byte-safe):** both roof hands in `experiments/eval-alignment/picture-climb.mjs`.
- **Evidence (zero-spend):** extend the probe to also print framing `ridgeToEave`/flag for the honest gable
  vs the relief build (the artifact) and the lever firing on a synthetic case; renders under `builds/`.
- **Gate check:** `src/workshop/climb-gate.test.mjs` (assert recolor_roof keep) if needed.
- `measurements/` untouched; `npm test` green.

## Falsifiable claim (restated, led with failure)

Roof reaches its picture: dark slate lands (demonstrated) and a real pitch lever exists. **It does NOT reach
the picture by faking the pitch:** the gatehouse roof is already in tolerance; the flag is a relief/`eaveYOf`
measurement artifact (T-202 family), so pitch is recorded as a named residual, not force-corrected. The lever
is proven by firing it on a synthetic out-of-tolerance case.
