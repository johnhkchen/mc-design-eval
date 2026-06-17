# T-176-01 — Plan: ordered, independently-verifiable steps

Each step ends green (`npm test`) and is committable. Steps 1–2 are the pure, durable core; step 3 is GL
evidence; step 4 is the metered re-score. Verification criterion per step is explicit.

## Step 1 — Sourcing + critique-refine loop (pure)

**Files:** NEW `src/recognition/treatment-source.mjs`, NEW `src/recognition/treatment-source.test.mjs`.

1. `sourceTreatment(program, pack, {mass})`: resolve field/edge/roof/opening blocks via `roleBlock`; build the
   `treatment-grammar/v1` spec with `AMPLITUDE_DEFAULTS`; fail-loud no-op guard (edge===field, roofEdge===
   roofField). Decoration lookup for the door light.
2. `refineAmplitude(spec, critique)`: `structuredClone` the spec; per item, switch on `department`+`kind`,
   route WALL by the small `missing`-keyword set, bump within `AMPLITUDE_CAPS`, record `changes[]`; `replace`
   → `notes` materialMismatch. Return `{spec, changes, notes}`.
3. Tests TS1–TS8 (structure.md). TS1 is the load-bearing one: sourced materials === hand-authored
   `rustic-gatehouse.treatment.json` materials (read the file, compare the resolved blocks).

**Verify:** `node --test src/recognition/treatment-source.test.mjs` green; `npm test` green. TS1 proves
sourcing reproduces the hand-authored spec (AC #1, "sourced not hand-authored").
**Commit:** `feat(T-176-01): source treatment spec from program+pack + critique→amplitude refinement loop`.

## Step 2 — Roof + opening generalization (pure)

**Files:** EXTEND `src/view/treatment-grammar.mjs`, EXTEND `src/view/treatment-grammar.test.mjs`.

1. Generalize `recessClosureGuard` to accept an explicit `{floor,eaveY}` band already — reuse for the roof
   band `{floor:eaveY+1, eaveY:ridgeY}` (no signature change; it already takes the band).
2. `deriveRoofEdges(occ, {ridgeAxis, eaveY, ridgeY, faces})` — footprint over the roof band; `eaveRow`,
   `ridgeRow`, `vergeColumns` (perpendicular-to-ridge extrema column lines).
3. `deriveOpeningEdges(aperture)` — reveal=perim, head=lintel|arch cells, isArch from interior solids.
4. `composeRoofTreatment(occ, roofSpec, ctx)` — eave (`eave-overhang` via door), ridge (`rowCourse` at
   ridgeRow), verge (`surface.relief` keyed to vergeColumns via column `zoneOf`); single fold; closure over
   the roof band; attach the `leak` note on the verge layer.
5. Tests TG14–TG20 (structure.md), incl. closure-with-teeth on a roof-band carve (TG17) and ridgeAxis-z
   derivation (TG15).

**Verify:** `node --test src/view/treatment-grammar.test.mjs` green; `npm test` green. The synthetic gable
box proves derivation is geometric; the leak is documented in the layer report.
**Commit:** `feat(T-176-01): generalize edges-from-geometry to roof (eave/ridge/verge) + opening reveal/head`.

## Step 3 — The runner + sourced spec + witness renders (GL evidence)

**Files:** NEW `experiments/eval-alignment/treatment-sourced-beside.mjs`, generated
`docs/active/work/T-176-01/gatehouse.sourced.treatment.json` + four `*-beside.png`.

1. Source → write `gatehouse.sourced.treatment.json`; assert materials match the hand-authored spec.
2. Render sourced, refined (default inline gatehouse critique), roof-treated, opening-treated, each beside
   the concept. Assert `closure.ok` on each; print `changes[]` and the verge leak.
3. `assertGlAvailable` first (fail loud if GL absent — the render-every-loop pattern). If GL is genuinely
   unavailable in this environment, record that in progress.md and FINDINGS (the renders are reproduced by
   `node experiments/eval-alignment/treatment-sourced-beside.mjs`), and lean on the unit-tested closure +
   the deterministic spec diff as the machine-checked evidence.

**Verify:** the four PNGs exist; closure asserted ok by the runner (non-zero exit on regression). The glance
(busy-vs-rich) is human-judged from the PNGs and recorded in FINDINGS.
**Commit:** `docs(T-176-01): sourced spec + witness renders (sourced/refined/roof/opening) beside concept`.

## Step 4 — Re-score vs the token baseline 42 (metered, optional)

**Files:** NEW `experiments/eval-alignment/score-gatehouse-treatment.mjs`, generated `treatment-score.json`.

1. `GUARD_ONLY=1` wiring check (assets present, no spend).
2. If spend is available and renders exist, run 2 votes of `DiagnoseBuild` over the **refined** build,
   compute `styleFidelityScore`, report `lift = score − 42`. Verdict bands: lift>0 reads-the-concept; ≤0
   capped (attribute via per-item breakdown — roof `replace` cap vs missing-detail).
3. FINDINGS reports the live number if run; else the deterministic projection (the refined critique's
   `styleFidelityScore`) with the live step flagged as the reviewer's metered confirmation.

**Verify:** `treatment-score.json` written (or the deterministic projection recorded). This is evidence for
AC #3, not a test gate.
**Commit:** `docs(T-176-01): gatehouse re-score vs token baseline 42 + FINDINGS (lift, busy-vs-rich, leak)`.

## Testing strategy

- **Unit (in `npm test`, no GL/LLM):** TS1–TS8 (sourcing + refinement), TG14–TG20 (roof/opening derivation +
  composition). These cover the falsifiable claims: sourcing reproduces hand-authored (TS1), refinement
  transforms deterministically and caps overshoot (TS5–TS8), roof/opening derivation is geometric and the
  closure guard has teeth (TG14–TG20).
- **Integration (impure runner, GL):** the four witness renders + closure assertions. Not in `npm test`;
  reproduced by one command.
- **Measurement (impure, LLM):** the metered re-score. Reported, not gated.
- **Regression guard:** every composed build asserts `recessClosureGuard.ok`; `reliefNoRegress` reported per
  face. Frozen instrument (`measurements/`, pin-guard) untouched — verified by `git status` showing only new
  `src/recognition/*`, extended `src/view/treatment-grammar*`, new `experiments/*`, and work-dir docs.

## Risk register (with the falsifiable failure each step would surface)

- **Sourcing ≠ hand-authored (TS1 fails):** recognition does not actually carry the field/edge split → the
  pattern-book fallback is the answer; reported plainly (AC allows it).
- **Refinement overshoots (render busy):** caps bound it; the glance overrules and FINDINGS records the call.
- **Roof/opening leak (TG/witness):** the raking verge / arch arc are not row-expressible → reported as the
  named "unification leaks" — a worthy negative result, not hidden.
- **GL or LLM unavailable here:** the pure core still proves the mechanism; renders/score are reproduced by
  the committed runners and flagged in FINDINGS.
</content>
