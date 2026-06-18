# T-204-01 — Structure: file-level blueprint

Shape of the code, not the code. Ordering matters where noted.

## A. New pure helper — `src/view/roof-generate.mjs` (MODIFY)

Add one exported pure function near `gableRecord`:

```
export function gableRidgeForRatio({ eaveY, eaveHeight, perp, targetRatio, tol = 0.2,
                                     pitchClasses = [0.5, 1, 2, 3] }) → {
  ridgeY, pitch, changed, ratioBefore, ratioAfter, reason
}
```

Contract:
- Inputs are integers/finite numbers; `eaveHeight ≥ 1`, `perp ≥ 0`, `targetRatio ≥ 1`. Guard bad input by
  returning the pitch-1 default with `changed:false, reason:"degenerate input"` (never throw on the hand path).
- `riseAtPitch1 = Math.floor(perp / 2)`; `ratioBefore = (eaveHeight + riseAtPitch1) / eaveHeight`.
- `relDelta(a,b) = |a−b| / max(|b|, 1e-9)`.
- **In-tolerance branch:** `relDelta(ratioBefore, targetRatio) ≤ tol` ⟹
  `{ ridgeY: eaveY + riseAtPitch1, pitch: 1, changed:false, ratioBefore, ratioAfter: ratioBefore,
     reason: "within tol — pitch 1 kept" }` (byte-identical to today).
- **Correcting branch:** pick `pitch ∈ pitchClasses` minimising `|achievedRatio − targetRatio|` where
  `achievedRise = roundHalf(min(riseAtPitch1·pitch, eaveHeight·(targetRatio−1)))` capped so the roof never
  exceeds the half-perp run (`riseAtPitch1`), `achievedRatio = (eaveHeight + achievedRise)/eaveHeight`.
  Return `ridgeY: eaveY + Math.round(achievedRise)`, the chosen `pitch`, `changed:true`,
  `reason: "ratio NN → MM via pitch P"`.
- PURE: no IO, no GL, no `Date`/random. Reuse the existing `roundHalf` already in the module.
- Export it (module already uses named exports).

Rationale for living here: it is roof geometry, sits beside `gableRecord`, and is unit-testable in the same
test file under the `npm test` glob (the hands are not).

## B. Wire the lever into the hands — `experiments/eval-alignment/picture-climb.mjs` (MODIFY)

Two edits, identical shape, at the two hardcoded ridge sites:

- `apply_gable_roof` (line 107) and `recolor_roof` (line 170): replace
  `ridgeY: CFG.eaveY + Math.floor(perp/2), pitch: 1` with values from the helper:
  ```
  const eaveHeight = CFG.eaveY - occ.bounds.min[1] + 1;
  const target = targetRatiosOf(PROGRAM).ridgeToEave ?? null;
  const L = target ? gableRidgeForRatio({ eaveY: CFG.eaveY, eaveHeight, perp, targetRatio: target })
                    : { ridgeY: CFG.eaveY + Math.floor(perp/2), pitch: 1, changed:false };
  const gable = gableRecord({ ..., ridgeY: L.ridgeY, pitch: L.pitch, ... });
  if (L.changed) console.error(`  [<hand>] pitch lever: ${L.reason}`);
  ```
- Import additions at the top: `gableRidgeForRatio` from `roof-generate.mjs` (already imports `gableRecord`,
  `generateRoof`); `targetRatiosOf` from `../../src/view/framing.mjs` (framing already imported for
  `framingReport`). Verify exact existing import lines before editing.
- **Invariant:** for the gatehouse `target≈1.35`, `ratioBefore≈1.55`, `relDelta≈0.148 ≤ 0.2` ⟹
  `changed:false` ⟹ **byte-identical** geometry. The wiring is live but a no-op here (by design).

## C. Evidence probe (zero-spend) — `picture-climb.mjs` (MODIFY)

Extend the existing `ROOF_MATERIAL_PROBE` block (lines 494–505) — or add a sibling `ROOF_PITCH_PROBE` flag —
to additionally:
1. Build `closed = close_shell(occ)`; `gabled = apply_gable_roof(closed)`.
2. Print `framingReport(PROGRAM, gabled).scale`: `ridgeToEave`, `flagged` (expect ≈1.55, false — honest roof
   in tolerance).
3. Build `relief = relief_walls(gabled)`; print its `framingReport(...).scale` (expect ≈1.63, flagged —
   relief proud-detail polluting `eaveYOf`). This is the named-residual demonstration.
4. Print the **roof-cell census** of `recolor_roof(closed)`: count cells at `y ≥ eaveY+1`, assert all are
   `deepslate_tiles` (colour landed, render-independent).
5. Demonstrate the lever firing: call `gableRidgeForRatio` with a synthetic out-of-tolerance `targetRatio`
   (e.g. 1.1) and print `changed:true` + `ratioBefore→ratioAfter` (refutes "lever doesn't exist").
6. Keep the existing three beside renders (`seed`, `gable-brown`, `recolored`) — the colour glance.

Outputs to `builds/gatehouse/picture-climb/roof-material/` (already the probe's dir). No `measurements/` writes.
No LLM spend (`return` before the metered loop, as today).

## D. Gate coverage — `src/workshop/climb-gate.test.mjs` (MODIFY, only if gap)

Read existing recolor_roof coverage. If no test asserts the **department-dominant keep** specifically for
`recolor_roof` (ROOF wrong-style `replace` cleared, scalar regression, kept), add one case:
`acceptsRound(before, after, {targetDepartments:["ROOF"], ...})` with `accept:true`, reason mentioning
department-dominant. If existing CG17 already covers a ROOF-targeted tool generically, reference it and add a
named recolor_roof assertion only if it strengthens the record.

## Ordering

1. **A** (pure helper + export) — independent, lands first; unit-testable immediately.
2. **A-test** (roof-generate.test.mjs) — co-commit with A; `npm test` green.
3. **B** (wire hands) — depends on A; verify byte-identical gatehouse geometry (probe diff vs prior renders).
4. **C** (probe evidence) — depends on A+B; run it for the artifacts.
5. **D** (gate test) — independent; only if a gap is found.

## Files touched (summary)

| File | Change |
|------|--------|
| `src/view/roof-generate.mjs` | + `gableRidgeForRatio` (pure, exported) |
| `src/view/roof-generate.test.mjs` | + unit tests (in-tol no-op, correcting fire, cap, degenerate) |
| `experiments/eval-alignment/picture-climb.mjs` | wire lever into 2 hands; extend probe; +2 imports |
| `src/workshop/climb-gate.test.mjs` | + recolor_roof department-dominant keep assertion (if gap) |

## Out of scope (named, not touched)

- `src/view/framing.mjs` `eaveYOf` proud-detail invariance — **T-202 family**; touching it here would
  overlap. The residual is named and cross-referenced, not fixed.
- The arched gate / wide-opening rebuild — **T-203**.
- The frozen instrument (`measurements/`) — byte-clean throughout.
