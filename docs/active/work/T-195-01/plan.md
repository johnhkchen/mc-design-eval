# T-195-01 — Plan

Ordered, independently-verifiable steps. Pure core first (testable in isolation), then registration, then the
runner hand, then the glance. Each step is an atomic commit. `npm test` must be green before every commit
(shared-file collision discipline with T-194-01).

## Step 1 — Pure core `src/view/wall-relief.mjs` + tests
- Write `wall-relief.mjs`: `recolorWallField`, `wallReliefSpec` (with the `dressBlock===fieldBlock` fail-loud),
  `buildWallRelief`. Reach proud/quoin geometry only via `composeTreatment` (door-routed); no direct
  technique import.
- Write `wall-relief.test.mjs` (WR1–WR6): recolor correctness + keep/shaped pass-through (WR1), spec shape
  (WR2), fail-loud (WR3), **proud quoins emit after recolor-first** (WR4, the crux), closure not regressed
  (WR5), purity/no-mutation/byte-stability (WR6).
- **Verify:** `node --test src/view/wall-relief.test.mjs` green; full `npm test` green.
- **Commit:** `feat(T-195-01): wall-relief pure core — recolor-then-composeTreatment (proud quoins emit)`.

## Step 2 — Department registration
- Add `relief_walls: Object.freeze(["WALL"])` to `TOOL_DEPARTMENTS` in `src/workshop/climb-gate.mjs`
  (re-Read first — sibling may have touched it).
- Extend the `TOOL_DEPARTMENTS` assertion in `src/workshop/climb-gate.test.mjs` to cover `relief_walls`.
- **Verify:** `node --test src/workshop/climb-gate.test.mjs` green; `npm test` green.
- **Commit:** `feat(T-195-01): register relief_walls → WALL in TOOL_DEPARTMENTS`.

## Step 3 — Wire the hand into the runner
- Re-Read `experiments/eval-alignment/picture-climb.mjs` (sibling collision), then add: the `buildWallRelief`
  import; the `relief_walls(occ)` hand (thin disk-loading wrapper) after `articulate_walls`; the `TOOLS` entry;
  a `MENU` line steering toward construction-relief; the JSON enum token.
- **Verify:** `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` — wiring + render seam, zero
  spend; confirms the hand is dispatchable and the runner still boots. `npm test` green (runner not in tests,
  but the gate/department test is).
- **Commit:** `feat(T-195-01): wire relief_walls hand into the picture-climb runner`.

## Step 4 — The glance (zero-spend triptych) + busy-vs-rich verdict
- Write `docs/active/work/T-195-01/render-relief.mjs`: seed → `apply_gable_roof` → `recolor_roof` →
  render `articulate_walls` (flat) and `relief_walls` (relief) each beside the concept (`renderBesideConcept`,
  `assertGlAvailable`), zero spend.
- **Run it** (requires headless GL). If GL present: produce `relief-beside.png` + `articulate-beside.png`;
  **inspect both with the Read tool** and record the busy-vs-rich verdict (does the relief read as pale dressed
  stone with proud quoins? richer or busier than the flat recolor?). If GL absent: record the blocker, ship the
  script + the pure-core proof, and defer the render to the metered climb env (precedent: GL-absent deferral).
- **Commit:** `docs(T-195-01): relief glance triptych + busy-vs-rich verdict`.

## Step 5 — Review
- Write `review.md`: files changed, test coverage + gaps, the glance verdict (richer/busier; hand-gap
  vs eyes-gap localized — if the build reads as relief but the WALL critique wouldn't register it, that's the
  S-196 coverage gap, flagged), closure result, open concerns, the T-194-01 collision status.

## Testing strategy
- **Unit (in `npm test`):** `wall-relief.test.mjs` (WR1–WR6) covers every pure part — recolor, spec, fail-loud,
  the proud-quoin emission crux, closure, purity. `climb-gate.test.mjs` covers the department registration.
- **Smoke (out of `npm test`):** `GUARD_ONLY=1` runner boot (dispatch + render seam).
- **Glance (the judge, out of `npm test`):** the beside-concept triptych — the falsifiable deliverable, read
  and reported honestly, never asserted.
- **What is NOT in scope:** running the full metered climb to closure (that is T-196-01 — wider eyes + re-climb).
  This ticket proves the *hand* builds real relief that reads on the glance and localizes the residual; the
  WALL-major-clears-on-the-critique outcome is verified by the climb in T-196-01, or flagged here as the S-196
  eyes-gap if the build reads relief but the critique is blind to it.

## Verification criteria (maps to the ACs)
- Wall-relief hand built via E-43 relief ops, not recolor; pure parts unit-tested → Steps 1–3, WR1–WR6.
- Walls read as pale dressed stone with relief beside concept; WALL major clears OR residual localized to
  S-196 → Step 4 glance + the localization in review.md.
- `closureOf` not regressed; busy-vs-rich reported on the render → WR5 + Step 4 verdict.
- Recorded honestly (richer vs busier; hand-gap vs eyes-gap) → review.md.
- `npm test` green; frozen instrument untouched → verified before every commit; no `measurements/` edits.

## Risks / mitigations
- **GL unavailable** → Step 4 degrades to "script shipped + render deferred"; the pure-core proof (WR4 proud
  quoins emit) still substantiates the construction claim. Recorded, not hidden.
- **Sibling commit sweep** (T-194-01 on the 3 shared files) → re-Read before each Edit, additive hunks, green
  before commit; if swept, re-apply on top.
- **Relief reads busy** → record on the render; the spec amplitude (drop base, shorten quoin run, depth) is the
  knob — a reported E-43 amplitude finding, still worthy.
