# T-174-01 — Plan: ordered steps + verification

Throwaway scouting spike. One runner under `experiments/`, four renders, a decision. No production edits, no
new tests (spike is unswept). `npm test` must stay green (i.e. unchanged).

## Steps

### Step 1 — runner skeleton + path proof (baseline + A)
Write `experiments/eval-alignment/articulation-spike.mjs` with: imports, constants (BASE, CONCEPT, OUT,
EAVE_Y=19, roles), `occToCells`/`fold` helpers, `baseline(occ)` (quoin run=4 hd=1), `candidateA(occ)` (quoin
run=full hd=2 + eave/verge band), and `main()` that renders just those two beside the concept.
- **Verify:** script runs without throwing; `baseline-beside.png` + `candidateA-beside.png` written; console
  prints cell deltas + quoin `report.corners` (expect 8 corner-columns across 4 faces) and `proudCells`.
- **Commit:** `feat(T-174-01): articulation spike runner — baseline + candidate A renders`.

### Step 2 — candidate B (curated) + arch dressing
Add `dressArch(occ)` (extractApertures + dressOpenings with door=spruce_door, frame=dark_oak_log, light
lantern) and `candidateB(occ)` (bold quoins hd=3 full height + 2-course stone band + arch + subtle coursed
`surfaceRelief` row belt). Wire B into `main()`.
- **Verify:** `candidateB-beside.png` written; arch placements > 0 (or, if `dressOpenings` no-ops on this
  build, log it and apply the manual timber-perimeter fallback — record which path was taken). Quoin proud
  cells for B > A (bolder).
- **Commit:** `feat(T-174-01): candidate B (curated pattern-book) + arch reveal render`.

### Step 3 — candidate D (critique-amplification) + finalize main
Add `candidateD(occ)`: apply token → deepen quoins → add arch as 3 deterministic rounds, render the final,
print the round-by-round proudCell counts (the "critique" log). Wire D in; `main()` renders all four
(baseline, A, B, D).
- **Verify:** `candidateD-beside.png` written; the progression log shows quoin proudCells rising token→final;
  D's final ≈ A's composition (the method-vs-amplitude probe).
- **Commit:** `feat(T-174-01): candidate D (critique-amplification) + all-candidate render`.

### Step 4 — glance judgement + recommendation
Read all four `*-beside.png` with the Read tool (the glance). Compare each against the concept on the four gap
elements (quoins, arch, eave/verge band, coursed field) and against each other. Decide the winner / tie /
busy-ceiling. Write `progress.md` (what built, deviations) and `review.md` (the recommendation + evidence +
what S-175 builds + what was dropped (C) and why).
- **Verify:** `npm test` green (unchanged — spike is unswept; confirm nothing under `src/` was touched).
- **Commit:** `docs(T-174-01): recommendation + renders — <winner>; review.md`.

## Testing strategy

- **No new unit tests.** Spike code is throwaway and lives in `experiments/` (outside the `src/**/*.test.mjs`
  glob). The brushes it drives are already covered by their own suites (`facade-articulation.test.mjs`,
  `surface-relief.test.mjs`, `wall-skin.test.mjs`, `render-beside.test.mjs`).
- **Verification is the render (the glance).** Per S-174: judge on the beside-concept image, not a score. The
  console reports (proudCells, corners, cell deltas) are sanity checks that the brushes fired, not the
  verdict.
- **Regression gate:** `npm test` must remain green and the working tree must show **zero** changes under
  `src/`, `packs/`, `schemas/`, `measurements/` — only `experiments/` + `docs/active/work/T-174-01/` added.

## Risks & mitigations

- **`dressOpenings` fiddly on this artifact** → fallback to a manual timber-perimeter reveal for the arch
  (Step 2); the arch is 1 of 4 glance elements. Record which path ran.
- **Brushes no-op (flat result)** → that is the "all stay flat / gated upstream" failure mode; inspect
  `report.proudCells`==0 and the render, and name the upstream gate (geometry/scale) in `review.md`.
- **Candidates tie at the glance** → the named "lever is amplitude not method" finding; say so and redirect
  S-175 to amplitude rather than method.
- **Winner reads busy** → the "ceiling is taste/amplitude" finding; report it honestly with the render.
- **Render path GL** → GL confirmed available this session; `renderBesideConcept` asserts loudly otherwise.

## Done when

Four beside-concept renders exist in the work dir; `review.md` names the glance-winner (or the honest
tie/flat/busy verdict) with the renders as evidence and a one-paragraph why + what S-175 should build, and
notes C as deferred-with-rationale; `npm test` green; frozen instrument untouched.
