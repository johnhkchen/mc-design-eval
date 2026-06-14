# T-159-01 Plan — generate-first watertightness

Four atomic, independently-verifiable steps. Each ends green (`npm test`) and commits. All edits in
`src/form/provision-generate.mjs` + `src/form/provision-generate.test.mjs`; re-Read before each edit.

## Step 1 — pure plan-regularization helpers + unit tests

- Add `planCloseRadius`, `minOpeningW`, `minOpeningH` to `PROVISION_GENERATE_DEFAULTS`.
- Hoist the inline `erode` closure to module scope as exported `erodePlan(cols)`.
- Add `dilatePlan(cols)`, `fillPlanHoles(cols, bbox)`, `bboxOf(cols)`, and exported
  `regularizePlan(cols, {radius, bbox})`.
- **Not yet wired** into `generateProvision` — pure additions only, so the existing output is
  byte-identical and the regen/repro state is untouched at this step.
- Tests (provision-generate.test.mjs):
  - `regularizePlan` identity on a clean rectangle.
  - fills a single enclosed hole.
  - bridges a 1-wide perimeter notch (close-1).
  - `erodePlan` 4×4 → 2×2.
- **Verify:** `npm test` green; new tests pass. Commit:
  `feat(T-159-01): pure footprint regularizer (close+fill) + erodePlan hoist`.

## Step 2 — wire the wall loop to the regularizer

- In the body-mass loop, after building `cols`, set `cols = regularizePlan(cols, {radius: o.planCloseRadius})`.
- Replace the two `erode(...)` calls with `erodePlan(...)`; delete the inline `erode` closure.
- Leave `sheetCols`/`interior` exclusion and placement unchanged.
- **Verify:**
  - `npm test` green (existing provision-generate tests still pass — the regularizer is identity on
    their clean fixtures).
  - Add an end-to-end **inert-on-clean** test: a synthetic fit with a rectangular footprint + ≥2×2
    openings → `generateProvision` placements byte-identical to a baseline captured before wiring
    (or asserted structurally: no new/lost cells vs the un-regularized path on clean input).
- Commit: `feat(T-159-01): generate-first walls build the watertight (hole-filled, closed) footprint`.

## Step 3 — opening coherence gate + tests

- In the openings loop, before the per-column carve, compute `w`/`h` and `continue` with an
  `opening-incoherent` finding when `w < minOpeningW || h < minOpeningH`.
- Tests:
  - 1×1 opening → not carved, finding emitted.
  - 3×3 opening → carved unchanged, no finding.
- **Verify:** `npm test` green. Commit:
  `feat(T-159-01): skip sub-2×2 phantom apertures (blob specks), recorded as findings`.

## Step 4 — regenerate, render proof, replay, suite

- `npm run generated:barn` (regenerate base/grammar/final artifacts).
- `npm run render:beside -- --subject barn` → inspect `pr/assets/frames/beside-concept-barn.png`:
  - roof still solid; **walls solid, no comb slots; no scattered y4–6 holes; no see-through**.
  - Re-run the ≥4/6 census + front-wall print used in Research → holes gone.
- Copy/keep a proof frame under `pr/assets/` with an honest caption: *generate-first barn — watertight
  & solid (build solidity; facade texture rides on S-145/S-149)*.
- `npm run generated:barn -- --repro` → "DETERMINISTIC (two runs byte-identical)".
- Confirm a clean subject is unaffected: regenerate the cottage path (or run its tests) — no diff in
  solidity. (Cottage uses the workshop path, not generate-first; the shared module change must not
  perturb it — covered by the inert test + full suite.)
- `npm test` green.
- Commit: `feat(T-159-01): regenerate watertight barn + render proof` (artifacts + proof frame).

## Testing strategy summary

| Concern | Test |
|---|---|
| regularizer correctness | unit: identity / hole-fill / notch-bridge / erode |
| inert where clean | end-to-end: clean fit → byte-identical placements |
| phantom suppression | unit: 1×1 skipped + finding; 3×3 kept |
| watertight in practice | render proof + census (manual, Implement) |
| determinism | `generated:barn --repro` two-run byte-identity |
| no collateral | full `npm test`; cottage solidity unchanged |

## Risks & mitigations

- **Regularizer not identity on clean input** → would change committed clean subjects. Mitigated by
  the identity unit test + the end-to-end inert test (Step 1/2) *before* regenerating.
- **Close-1 too weak for wide gaps** → hole-fill still guarantees a closed loop (no see-through); wide
  *open* gaps that are real doorways are correctly left to the opening carve. Acceptable; if the barn
  still reads ragged after Step 4, raise `planCloseRadius` (general default) — but the closed loop is
  the watertight guarantee, not the cosmetic smoothing.
- **Opening gate too aggressive** (skips a real narrow window) → defaults are general; the wagon door
  (13×7) and all ≥2×2 survive. Revisit per-subject only if a real narrow aperture is lost.
- **Shared-file sweep** (T-154-01 just landed in this module's neighbourhood) → re-Read before each
  Edit; additive only; verify green before each commit ([[shared-file-commit-sweep]]).
