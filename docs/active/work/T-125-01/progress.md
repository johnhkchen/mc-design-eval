# T-125-01 idiom-recognition — Progress

Phase artifact 5/6 (Implement). Plan: `plan.md`. Baseline: 1754 unit tests green.

## Step 0 — Preconditions ✓

- Sibling T-126-01 committed its whole chain while we researched (`ab7fdf9` program,
  `c35ffc9` actions, `15e68cf` exchange, `d3b6c60` loop, `045db75` replay) — the Design-D6
  dependency risk is GONE; `src/workshop/program.mjs` is a committed import.
- Their `actions.mjs` declares `re-recognize` VOCABULARY but leaves the applier unwired,
  explicitly "for S-125 to wire later" — matches this ticket's AC ("recognition may re-sample
  inside the workshop later"); noted as follow-up, not wired here.
- Committed inputs verified: rustic pack; cottage + barn sketches (cottage: pitched45, 3 masses,
  4-storey plausible; barn: clean 48×26 rectangle, pitched45 @45°, 2–3 storeys plausible);
  concept PNGs live under `benchmarks/sculpture/runs/...` (registry paths are HERE-relative).

## Step 1 — Program contract ✓ (committed)

`schema/building-program.schema.json` + `src/recognition/program.mjs` + tests (14).
Added beyond plan: same-wall openings must occupy disjoint vertical ranges (each entry is its
own rhythm lane — lanes that overlap vertically could collide laterally); dormer wall must be
an eave side (perpendicular to ridge).

## Step 2 — Prompt + reply parser ✓ (committed)

`src/recognition/prompt.mjs` + tests (5). Prompt = pack digest (roles with diegetic rationales,
roof idioms, treatments, proportions, MATERIAL_PRECEDENCE) + sketch digest + embedded schema +
strict bare-JSON rules. Parser = strip → schema gate → pack gate; throws classify MALFORMED for
runReplyPolicy. One test pins the digest against a COMMITTED sketch record (the form-sketch/v1
shape contract).

## Step 3 — Gable-end closure: SKIPPED (finding recorded)

Probe: `roofGableConstruct` over a 13×9 footprint emits **solid** stepped courses between the
slopes (325 cells = exactly Σ layer areas) — generateRoof fills the cross-section, so gable ends
are closed by construction. No new construct, no registry/card changes. The plan's contingency
taken; watertightness regression-pinned by the step-4 integration test instead.

## Step 4 — Compiler ✓ (committed with this file)

`src/recognition/compile.mjs` + tests (8, incl. two integration legs realizing through the REAL
registry and judging with the REAL conformance gate — all six checks pass on the synthetic
build). Findings fixed along the way (both are compile-level decisions, sibling/T-124 code
untouched):

1. **Dormer default aperture orphans the ridge** — the 1×2 face hole eats the face center
   column, the ridge row's only 6-connection (single-component fail) → compile passes an
   explicit 1×1 light.
2. **Dormer on the eave edge is floodable** — dormer roofs are stairs (fixtures never seal);
   a face on the eave overhang leaves a cavity reachable over the cheeks (watertight fail) →
   compile seats the dormer front on the WALL plane, so the main roof's solid courses back the
   face: the light is a sealed niche, cheeks embed in solid.
3. Roof stair/slab family members ride only when the program's field role matches the pack's
   declared roof family — any other field realizes full-cube (NO name derivation, the
   voxel-palette lesson).

Suite after step 4: **1785 unit tests green** (was 1754).

## Remaining

- Step 5: runner + npm scripts
- Step 6: LIVE cottage + barn drafts (metered, subscription)
- Step 7: offline replay re-assert ×2 + full npm test + self-grep
- Step 8: review.md
