# Plan — T-083-01 hollow-cottage-milestone

Ordered, independently-verifiable steps. Each step commits atomically. The suite stays green from step 1.
Testing strategy: the **pure cutaway helper is unit-tested**; the **chain is exercised by the metered/GL
runner** (the documented sibling boundary — live `claude -p` + GL are not in `npm test`); every geometric
guarantee (exteriorHeld, gate constraints, paint/carve counts) is asserted in the runner and recorded.

## Step 1 — pure cutaway core + tests

- Create `src/view/cutaway.mjs`: `sectionKeys(occ, {axis, at, side})`, `roofCut(occ, read)`,
  `frontHalfCut(occ)`. Pure; keys in `"x,y,z"` form (drop straight into `carveArtifact`).
- Create `src/view/cutaway.test.mjs` (~10 tests): plane-side removal exactness; complement kept; empty occ →
  empty set; boundary plane (all/none); `roofCut` removes the roof band only; `frontHalfCut` removes `z≥mid`;
  **round-trip** `carveOccupancy(occ, sectionKeys(...))` equals the manual clip; source guard.
- **Verify:** `npm test` green (expect 965 + ~10 = ~975).
- **Commit:** `feat(E-23 T-083-01): render-only cutaway core (section-by-exclusion) + tests`.

## Step 2 — the chained milestone runner (offline-provable)

- Create `benchmarks/sculpture/hollow-cottage-milestone.mjs` per `structure.md` §runner (paint → seal →
  hollow → fill → gates → renders → write). Use the sibling runners verbatim for each stage's wiring
  (`spray-paint.mjs` for paint, `hollow-cottage.mjs` for seal+carve, `floorplan-cottage.mjs` for fill).
- Each metered call wrapped in try/catch with a deterministic fallback (geometric mark; 2×2 spec). GL renders
  best-effort. The `exteriorHeld` checks **throw** on failure (the load-bearing invariant must never silently
  pass).
- Add `package.json` `milestone:cottage` script.
- **Verify (offline):** the chain's deterministic spine runs to a written artifact + report even with the
  shim/GL stubbed — confirm `assertArtifact(milestone)` passes and both `exteriorHeld` are true on the pure
  occupancy path (these need no GL). Confirm `node scripts/validate-artifact.mjs --expect valid <artifact>`.
- **Commit:** `feat(E-23 T-083-01): chained milestone runner — paint→seal→hollow→fill, both gates`.

## Step 3 — the live metered run + renders

- Run `npm run milestone:cottage` (metered: one **light** hollowable detector + one **strong** floorplan-
  author; GL renders; GLB decode via `dwebp`).
- Capture: `milestone-cottage-artifact.json`, `milestone-report.json`, and the PNGs (`view-front`,
  `view-+x+z`, `view-threeQuarter`, `view-cutaway-plan`, `view-cutaway-section`, `view-from-below`,
  `face-front-before`, `face-front-after`) into `docs/active/work/T-083-01/`.
- Assert in the report: plaster reversed (`>8`), `exteriorHeld.held === true` (both carve and fill),
  plausibility gate constraints, resemblance before→after.
- **If the shim/GL is unavailable in this environment:** record the deterministic spine result + the gap in
  `progress.md` honestly (sibling precedent), and proceed — the structure is proven offline and the live run
  is reproducible by a reviewer with the subscription.
- **Commit:** `feat(E-23 T-083-01): live milestone run — hollow accurate cottage + N×M infill + artifacts`.

## Step 4 — E-12 handoff assets

- Copy `face-front-before.png` → `pr/assets/cottage-face-before.png`, `face-front-after.png` →
  `pr/assets/cottage-face-after.png`.
- Assemble `pr/assets/cottage-multi-angle.png` (`magick montage` of front/+x+z/threeQuarter) and
  `pr/assets/cottage-cutaway.png` (`magick montage` of cutaway-plan + cutaway-section).
- Write `pr/assets/hollow-cottage.md` (narrative for E-12, pattern of `beyond-facade.md`): the milestone in
  one screen — both paths, both gates, the before/after, the cutaway.
- **Verify:** the four PNGs + md exist and are non-empty; montages open.
- **Commit:** `docs(E-23 T-083-01): E-12 handoff — face before/after + multi-angle + cutaway`.

## Step 5 — design-learnings E-23 section

- Append `## 2.5-D interaction sector (E-23) — view-matched-to-task, two paths, the gate-switch (S-083,
  T-083-01)` to `docs/knowledge/design-learnings.md`. Content (AC #5):
  - **View-matched-to-task:** hand the LLM a task-shaped view (plan for the floorplan, elevation for the
    face, 3-Q for massing), not 57k voxels (`[[twodee-interaction-sector]]`).
  - **Two paths:** *program* (hollow carve + floorplan generate — bulk placement is the program's job) vs
    *judgement* (spray-paint — the LLM recolors a face). When each wins.
  - **The gate-switch at the craft→design line:** **resemblance** where a reference exists (exterior vs
    concept); **plausibility** where none does (interior rooms are invention). The headline of E-23.
  - **Right-sized-model results:** which ops ran light (detectors on Haiku) vs strong (floorplan-author,
    spray judgement), and the scoping rubric (scope to one view → small model handles it; escalate
    judgement that needs it).
  - **Over/under-reach (honest):** the side-face by-construction gate (no concept side); the steered
    `openings-align` residual; no stair; the perspective-through-door render delta; the cutaway is a render-
    only section.
- **Verify:** the section renders; one-sentence summary present.
- **Commit:** `docs(E-23 T-083-01): design-learnings — 2.5-D interaction sector section`.

## Step 6 — review

- Write `review.md`: files created/modified, test coverage + gaps, open concerns, suggested reviewer
  verification. Confirm `npm test` green. Stop (Lisa handles the rest).

## Test matrix

| Capability | Unit (npm test) | Live runner | Asserted-in-runner |
| --- | --- | --- | --- |
| `sectionKeys`/`roofCut`/`frontHalfCut` | ✅ ~10 tests | — | — |
| section round-trip vs `carveArtifact` | ✅ | (renders the section) | — |
| paint reversal (plaster >8) | (T-079 cores tested) | ✅ | ✅ count check |
| carve exterior-held | (T-080 cores tested) | ✅ | ✅ throws if false |
| fill exterior-held | (T-081 cores tested) | ✅ | ✅ throws if false |
| plausibility gate | (T-081 cores tested) | ✅ | ✅ recorded |
| resemblance gate | (T-079 cores tested) | ✅ best-effort GL | ✅ recorded |
| tier routing (light+strong) | (T-082 cores tested) | ✅ | ✅ usage echoed |
| AJV validity of final build | — | ✅ `assertArtifact` | ✅ |

## Risks & mitigations

- **Shim/GL/`dwebp` unavailable here** → deterministic spine still proves the chain; live run is reproducible.
  Recorded honestly in `progress.md` (sibling precedent).
- **Sealing closes the front door** → it does not (coherence holes only; `watertight:false` persists) —
  verified by the existing T-080 watertight record; re-asserted in the milestone report.
- **Cutaway mistaken for a build edit (Rule 3)** → the section is a throwaway copy; only its PNG is kept; the
  report + `cutaway.mjs` doc state "render-only." The real artifact carries the exteriorHeld proof.
