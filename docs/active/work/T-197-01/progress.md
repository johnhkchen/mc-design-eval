# T-197-01 — Progress

## Status: COMPLETE — all three steps landed, suite green (2370/2370), evidence PASS.

## Step 1 — close-the-shell substrate ✅ (commit `feat(T-197-01): closeShell …`)
- `src/view/wall-generate.mjs`: added `eaveRingClosure(occ,{floor,eaveY})` (the one closure definition) +
  `closeShell(occ,{program,floor,eaveY,wallField,coverageFloor})` (dense ring from program footprint, accepts
  on coverage alone — ignores the near-square `ambiguous` axis tie — solidifies floor→eave, drops strays,
  keeps roof + interior; honest no-close below the trust floor). Added module-private `bandHistogram` (lifted
  from `constructWalls` step 1; `constructWalls` left untouched → no cottage/barn regression risk).
- `src/view/wall-generate.test.mjs`: WG-CS1..CS5 (closure metric; closes a colonnade + roof preserved; no
  regression on a clean shell; honest no-close; stray-drop). 25/25 green.

## Step 2 — form-before-detail gate ✅ (commit `feat(T-197-01): form-before-detail ordering gate …`)
- `src/workshop/climb-gate.mjs`: `close_shell:["WALL"]` in `TOOL_DEPARTMENTS`; `FORM_READY_CLOSURE=0.9`;
  `TOOL_STAGE` (form/detail); `formReadyGate({tool,closure,threshold})` (form/done/unknown always eligible,
  detail gated on closure≥threshold, NaN→0 fail-safe). PURE, scalar-in (no occ).
- `src/workshop/climb-gate.test.mjs`: CG-FR1..FR7 (blocked@0.05, allowed@0.95, form always, boundary@0.9 +
  real 0.615, done/unknown allowed, registry membership, NaN fail-safe). 24/24 green.

## Step 3 — runner wiring + evidence ✅ (commit `feat(T-197-01): wire close_shell hand …`)
- `experiments/eval-alignment/picture-climb.mjs`: `close_shell` hand; TOOLS/MENU/agent-enum; per-round
  `closureNow` + `formReadyGate` enforcement before apply (blocked round = no apply/no spend/re-pick, mirrors
  the no-op guard); `agentPick` surfaces FORM READINESS; `closure`/`closureAfter` on trajectory rounds;
  `closureFirst`/`closureLast`/`formReadyClosure` in the summary.
- `docs/active/work/T-197-01/closeshell-evidence.mjs` (zero spend). Parse OK; full suite + GUARD_ONLY smoke
  green.

## Measured results (the falsifiable claim, attacked on the REAL gatehouse)
```
seed wall-band closure:           0.615   (open colonnade — the reviewer's finding, reproduced)
close_shell:               0.615 → 1.000  (+0.385, ring 102 cols, coverage 0.69, axis identity)
roof cells (y>18):          1177 → 1177    PRESERVED  (composes without regressing the won roof)
gate carve_arch  @0.615  → BLOCK   |  @1.000 → ALLOW
gate relief_walls@0.615  → BLOCK   |  close_shell @0.615 → ALLOW (form always eligible)
VERDICT: PASS
```

## Deviations from plan
- None material. The plan anticipated a possible "geometry wall" (footprint can't densify) — it did NOT
  happen on this seed (coverage 0.69 ≥ 0.5), so the dense shell forms cleanly. The no-close path is still
  built + unit-tested (WG-CS4) and the runner logs it, so a future subject that can't register is handled
  honestly rather than faking density.

## Honest notes
- The ticket quotes closureOf ~0.05; my measured seed band-ring closure is **0.615** (the close-derived
  perimeter measure). The discrepancy is the measurement, not the conclusion — the shell is open and the dense
  rect (closure 1.000) was being suppressed. Both numbers recorded; the 0.615↔1.000 gap is what calibrates the
  0.9 threshold (wide margin, not knife-edge).
- The metered re-climb (LLM/VOTES spend) was deliberately NOT run here — that is T-198-01's integration, which
  depends on this substrate. This ticket delivers + proves the substrate on the seed (zero spend).
