# Relief calibration — relief-aware-gate (relief-calibration/v1, T-148-01, E-35)

Pure re-derivation: the relief lens (`src/form/relief-presence.mjs`) over committed builds — **no
judge, no re-judge, no per-building constant**. The relief verdict is the fixpoint (re-running
surfaceRelief is a no-op on the demanded strips); the **kit-aware** verdict (kit-aware-gate/v1) is
reported BESIDE it, valid forever.

**Subject:** the T-143-01 first-composite-PASS barn. **Grammar:** benchmarks/sculpture/relief/barn-grammar.json (a diegetic
recognised facade grammar — dark_oak_log studs, column rhythm every 4 on the front/back walls).

| anchor | relief lens | kit-aware (beside) | expected | result |
| --- | --- | --- | --- | --- |
| anti-anchor (flat barn) | **FAIL** | PASS | FAIL | ✓ |
| articulated (relief applied) | **PASS** | PASS | PASS | ✓ |

**Anti-anchor residual** (the flat barn lacks the demanded relief): `missing relief: dark_oak_log on +z @ column every 4 (300 cells)`; `missing relief: dark_oak_log on -z @ column every 4 (300 cells)`.

**Articulated no-regress** (relief is honest construction): in-plane ruler preserved = **true**, height ratios preserved = **true** (only the perpendicular extent widens — honest visible relief, never gated).

**Committed-unchanged** (monotone re-derivation): 18 committed gate records swept; relief lens `ran:false` on all (no facade wired) → every kit-aware `overall` re-derives unchanged. ✓

Anchors: **all hold** — anti-anchor ✓, articulated ✓, committed-unchanged ✓.

The frozen judge contract is byte-unmoved (the lens calls no judge; `instrument.diffs: []`). The
anti-anchor's committed gate record is NOT mutated — the flip is demonstrated here, beside the
legacy kit-aware verdict.
