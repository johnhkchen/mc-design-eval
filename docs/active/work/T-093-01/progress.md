# T-093-01 — multi-angle-same-object-gate — Progress

## Completed (all five plan steps)

- **Step 1 — pure core** (`cb14d67`): `MULTI_ANGLE_GATE` in src/config.mjs (4 fixed diagonals,
  gap budget 2 — frozen, no flags); `src/form/multi-angle-gate.mjs` (v2 prompt/parser,
  `aggregateMultiAngle` REFUSE/DECIDE, `viewOutcomeLabel`) + 19 unit tests.
- **Step 2 — composeSheet** (`1006ecd`): N-panel composer in resemblance.mjs; `composeTriptych`
  delegates with its exactly-3 contract preserved (byte-identical output asserted). +2 tests.
- **Step 3 — runner** (`3cb629b`): `npm run gate:multi` — renders the config azimuths at the 512²
  contract lens, per-view T-088 coverage on each view's own visible skin (the diagonal projection
  census via existing `surfaceZoneHistogram(faces:[diag])` — zero new instruments), per-view judge
  (concept | mesh@angle | build@angle triptych, one `claude -p` call each), pure aggregation,
  labeled contact sheet, exit 0/1/2 = pass/fail/refusal, `--offline` re-assert. Zones = the T-092
  derivation re-run from committed inputs, mapped into the artifact's shipped palette.
- **Step 4 — proof both ways** (`4acef49`): four recorded runs + committed sheets
  (`pr/assets/frames/multi-angle-*.png`), all `--offline`-re-asserted:
  - `cottage-baseline` (pre-fill grey-roof artifact): **FAIL** — coverage REJECT at all 4 azimuths
    (band1 plaster 0%, roof dominant ≤0.9%), judge correctly never called (T-088 short-circuit).
  - `synthetic-hut`: **PASS** — 4× same-object, 2 minor gaps (exactly the budget). The committed
    fixture's concept is a render of its own artifact (ground truth same-object by construction);
    labeled synthetic everywhere; proves the full pass path (render → coverage → judge → aggregate
    → sheet → exit 0).
  - `cottage-current` / `gatehouse-current`: **FAIL** — honest findings (see below).
- **Step 5 — audit + suite**: `npm test` 1105/1105; v1 surface untouched except the delegating
  `composeTriptych` (runner `resemblance.mjs` and `resemblance-consolidation.mjs`: zero diff).

## Deviations from plan (dated 2026-06-10)

1. **Bug found live**: `VIEW_ANGLES` is nested (`{ortho, diag, threeQuarter}`), not flat —
   azimuth lookup switched to `resolveAngle(angle).azimuthDeg`.
2. **One general prompt hardening after the first synthetic run**: the judge listed voxel
   stepping present *identically in the concept panel* as gaps; the fixed prompt now states a gap
   must be a DIFFERENCE from the reference panels and that the medium (blockiness) is never a gap.
   This is a contract clarification, not case tuning — the failing subjects stayed failing.
3. **Fixture iteration**: the first synthetic hut (stepped pyramid roof) drew 3 minor gaps
   (budget 2); replaced with a rotationally symmetric flat-slab-roof hut so every diagonal view is
   identical to the concept view. Ground truth unchanged: same object by construction.

## The findings (recorded, not tuned away — E-25 Rule 6)

The durable skins **pass coverage at every azimuth but do not yet read same-object from the
oblique family**: cottage drifted ×4 (dominant gap: roof form/massing — at the 30° contract
elevation the views are roof-dominated and the voxel roof reads as a dark beam jumble);
gatehouse drifted ×3 + different-object ×1 (form/massing/zoning: rough silhouette, busy walls).
This is exactly the divergence the ticket predicted the single-angle gate was hiding — the gate's
job is to expose it. The gaps route to E-25's remaining work (roof form/coherence is S-090/S-087
territory; the shell roughness S-091), and S-095 inherits these sheets as its baseline.

## Remaining

Nothing — Review next (review.md).
