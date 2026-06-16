# T-175-01 — Progress

## Done

- **Step 1 — engine** (`src/view/treatment-grammar.mjs`): `TREATMENT_GRAMMAR_SCHEMA`, `deriveEdges`
  (geometry→edge descriptors), `composeTreatment` (declarative layered spec → relief through the registry
  door), `recessClosureGuard`. Committed.
- **Step 2 — unit suite** (`src/view/treatment-grammar.test.mjs`): TG1–TG13 on square/rectangle/with-opening
  (derivation, layering, cornice corner-exclusion, recess-by-exclusion, closure guard with teeth, in-plane
  no-regress, determinism, injected opening seam, fail-loud, purity). 13/13. Committed.
- **Step 3 — serialized spec** (`rustic-gatehouse.treatment.json`): A's restraint trio + base; rubble
  dressing on all edges against the dressed-stone field.
- **Step 4 — runner** (`experiments/eval-alignment/treatment-beside.mjs`): treated + token baseline beside
  concept; injects the dressing seam; asserts `closure.ok`.
- **Step 5 — render**: both PNGs produced. Treated: base 60 / quoins 120 / cornice 52 / arch 24; closure ok
  1.0→1.0; 2287→2515 cells. The articulation reads (see FINDINGS).
- **Step 6 — FINDINGS.md**: the busy-vs-rich call (richer, not busy; one near-edge = quoin amplitude),
  the material no-op lesson, generalization deferred to S-176.

## Deviations from the plan (documented)

1. **Brush-door rewire.** The first engine draft imported `surface-relief`/`facade-articulation` directly and
   tripped the brush-door conformance tripwire. Rewired to reach both through the registry door
   (`applyArticulation`), the `wall-skin.mjs` precedent. No behavior change; tripwire green.
2. **Layers run independently against the base occ, fold once** (not sequential folding). Sequential folding
   let the base course grow the footprint and corrupt the quoin's corner detection (quoins → 0). The
   `applyArticulation` model (passes independent over one base, last-writer-wins fold) is correct and fixed
   it. Determinism test (TG10) reframed from "compose-over-own-output idempotent" (false for a
   geometry-re-derived composite) to "same input → byte-identical placements".
3. **Edge material ≠ field material.** A same-material course no-ops (the relief no-re-emit rule). The spec
   uses `cobblestone` dressing on all edges against the `stone_bricks` field — reads + faithful. Lesson
   recorded for S-176 sourcing.
4. **TG9 in-plane no-regress** scoped to a single face (the standing reliefNoRegress contract); a
   full-perimeter treatment widens each face's perpendicular extent by design (`expectedWidening`).

## Remaining

- Step 7 — review.md (this pass).

## Open (for S-176, not this ticket)
- `deriveEdges` on two-mass / L-mass / gable geometry (untested; the named generalization risk).
- Generalize the same `edges` vocabulary to roof (overhang/ridge) and openings (reveal/arch) — the epic's
  S-176 scope.
