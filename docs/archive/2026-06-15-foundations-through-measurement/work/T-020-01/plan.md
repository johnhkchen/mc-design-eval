# T-020-01 — Plan: ordered implementation steps

Small ticket, pure module. Steps are sized to commit atomically; verification is `npm test`.

## Step 1 — Write the engine `src/color/cielab.mjs`

- Header comment documenting the zero-deps boundary, 0–255 input convention, pluggable metric.
- `@typedef`s: `RGB`, `Lab`, `PaletteEntry`, `NearestResult`.
- Constants: `D65`, `DELTA`/`DELTA_CUBED`/`THREE_DELTA_SQ`, sRGB→XYZ matrix coefficients.
- Helpers: `inverseGamma(c)`, `f(t)` (`Math.cbrt`), `assertRgb(rgb)`.
- Exports: `srgbToLab`, `deltaE76`, `deltaE` (= `deltaE76`), `nearest`.
- k-d-tree note comment at the scan.

**Verify:** `node -e "import('./src/color/cielab.mjs').then(m=>console.log(m.srgbToLab([255,255,255])))"`
prints ≈`[100, 0, 0]`. Quick sanity before the formal suite exists.

## Step 2 — Write the test suite `src/color/cielab.test.mjs`

Implements the seven test groups from `structure.md`. Expectations are published
Lindbloom/colormine Lab values with a cited comment and stated tolerances — derived
independently of the implementation, per the acceptance criterion.

**Verify:** `node --test src/color/cielab.test.mjs` → all pass.

## Step 3 — Full gate

Run `npm test` (artifact-validator self-tests + `invalid` check + `test:unit` glob). Confirm
the new suite is discovered and the whole gate is green — no regression in existing suites.

**Verify:** `npm test` exits 0.

## Step 4 — Commit

One commit on `main` (per workflow: multiple threads share the branch; lock handles
serialization). Message:
`feat(E-10 T-020-01): portable CIE-Lab color engine (srgbToLab/deltaE/nearest)`.
Stage only `src/color/cielab.mjs` + `src/color/cielab.test.mjs` (work artifacts are committed
separately by the workflow / left to Lisa).

## Testing strategy (what proves correctness)

- **Unit, offline, deterministic** — the only kind needed; the module is pure with no I/O,
  network, or SDK. No integration test is warranted at this layer (integration arrives when
  T-021/T-022 wire the engine to a real table/image).
- **Independence** — every numeric expectation traces to a published reference, not to a value
  emitted by `srgbToLab`. This is the guard against "tests that only confirm the bug."
- **Coverage targets:**
  - `srgbToLab`: anchors (white/black), published primaries (red/blue), mid-grey, all four
    validation throws.
  - `deltaE76`: identity, symmetry, known pair.
  - `nearest`: correct argmin, returned `deltaE`/`lab` correctness, metric pluggability,
    empty-palette throw.
- **Tolerances:** white/black ±0.01; primaries ±0.5 (absorbs matrix-constant rounding);
  grey L* ±0.3. Stated inline so a reviewer sees the slack is intentional.

## Risks & mitigations

- **R1 — input-convention mismatch with published tables.** Published Lab values assume the
  standard sRGB encoding; our 0–255→/255→inverse-gamma path reproduces it. Mitigated by the
  white→100 and red/blue anchor tests; if red is off by >0.5 the matrix or scaling is wrong.
- **R2 — `f(t)` branch / `Math.cbrt` on the small-t linear segment.** Black and very dark
  colors exercise the `t ≤ δ³` branch. Black→`L*≈0` test covers it; mid-grey sits on the
  cube-root branch.
- **R3 — accidental coupling.** A stray `../` import would break portability silently. The
  test importing *only* `node:*` + `./cielab.mjs`, plus the header contract, is the guard; a
  reviewer can confirm with one grep (`grep -n "import" src/color/cielab.mjs`).

## Definition of done (maps to acceptance criteria)

- [x] `src/color/cielab.mjs` exports `srgbToLab`, `deltaE`, `nearest`; no project/MC imports.
- [x] Unit tests with independently-derived expectations (white/black/grey/primary, ΔE
      symmetry + known pair, `nearest` correct key).
- [x] ΔE metric swappable, default CIE76.
- [x] `npm test` green.
