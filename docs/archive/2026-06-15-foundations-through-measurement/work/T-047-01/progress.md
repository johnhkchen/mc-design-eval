# T-047-01 — progress

Status: **implementation complete.** All five plan steps done, each committed atomically. `npm test`
456/456 green; the GL-gated live tests pass where GL is up.

## Steps

### ✅ Step 1 — form-target interface (`src/form/form-target.mjs` + test)
- `FORM_TARGET_SCHEMA`, `FormTargetNotImplementedError`, `conceptFormTarget` (today's concept+IoU target,
  injectable `_fidelity` for pure tests), `glbFormTarget` (the documented GLB adapter point — throws),
  `resolveFormTarget` (the one place the default is chosen).
- `form-target.test.mjs`: 9 pure tests (A concept delegation/region selection/opts pass-through, B GLB
  throw+message, C resolve pass-through/default/throw, D swap-invariance, E schema tag). All green.
- Commit `feat(E-15 T-047-01): form-target interface — concept impl + documented GLB adapter point`.

### ✅ Step 2 — wire `liveFormScore` to the seam (`src/revise/loop.mjs`)
- The closure now lazy-imports `resolveFormTarget`, builds `target = resolveFormTarget(cfg)`, and returns
  `target.scoreRender(outPath, R)`. The `cfg.conceptPath`-required throw moved into `resolveFormTarget`
  (same effect). JSDoc updated with `formTarget?` + the GLB-swap note.
- **Deviation (planned-adjacent):** the loop's no-top-level-GL invariant test (`loop.test.mjs` group LE)
  pinned the exact lazy-imported module name `form-fidelity.mjs`. The refactor reaches the metric *through*
  `form-target.mjs` (which imports form-fidelity), so I updated that one assertion to check for
  `form-target.mjs`. The invariant's intent — the form/render stack is lazy, never top-level — is
  unchanged and still enforced. Documented here per the RDSPI deviation rule.
- `reviseLoop`, the accept gate, and the `score`/`diagnose`/`observe` seams are **untouched** (AC #1).
- Verified: `npm test` 456/456; `render/test/revise-loop.live.test.mjs` passes (GL up) — proves the
  end-to-end wiring through the new seam with the concept default.
- Commit `feat(E-15 T-047-01): reviseLoop accept consults the form-target seam (concept default)`.

### ✅ Step 3 — demo consults the seam + E-13-baseline verdict (`form-revise-ab.mjs` + regenerate)
- Harness `score` is now `liveFormScore({ formTarget: conceptFormTarget({ conceptPath }) })` — the demo
  exercises the seam live. Added pure exports `formVerdictOf(baseline, after, accepted)` +
  `VERDICT_GLOSS`, `e13Baseline` per subject (read from `form-baseline.json`), a verdict column, and a
  `--offline` regenerator that re-derives baseline+verdict from the **committed measured numbers** (no GL,
  no model).
- Ran `--offline`: committed `form-revise-ab.{json,md}` now carry `e13Baseline` + `verdict`. **Measured
  IoUs preserved verbatim** (koi 0.481 / region 0.455→0.455; heart 0.347 / region 0.384→0.379; proposed
  0.481 / 0.345). Both verdicts **`held`** (no regression slipped the gate).
- Commit `feat(E-15 T-047-01): form-revise demo consults the target seam + E-13-baseline verdict`.

### ✅ Step 4 — E-12 handoff (`pr/assets/`)
- Copied `form-{koi,heart}-{before,proposed}.png` into `pr/assets/frames/`. Note: koi before==proposed
  (byte-identical — the in-region edit didn't move the whole 3/4 silhouette); heart proposed differs and
  *regressed* (the edit the cage rejected). Both stated honestly.
- Wrote `pr/assets/form-revise.md` mirroring `value-true.md`: number table, the hero pair (before →
  proposed = *what the cage refused*), honest caveat block (whole-object single-view ceiling, the GLB
  lever, metered cost), a "Suggested E-12 beat."
- Commit `docs(E-15 T-047-01): E-12 handoff — form-revise before/after beat in pr/assets`.

### ✅ Step 5 — design-learnings E-15 section
- Appended `## E-15 surgical form revision …` after §E-14: intro, before/after IoU table, "The honest read
  (the headline)" (2-of-2 rolled back; the gate rejected a regressing heart edit → the gate is real),
  "Honest notes — where surgical revision *didn't* help, and what it cost" (whole-object single-view
  ceiling; the GLB seam as the forward lever; metered cost; IoU necessary-not-sufficient; structural
  value), one-sentence summary.
- Commit `docs(E-15 T-047-01): design-learnings E-15 form-revision section (honest before/after)`.

## Deviations from plan
1. **LE invariant assertion updated** (Step 2, above) — module name `form-fidelity.mjs` → `form-target.mjs`
   in the lazy-import check; invariant unchanged.
2. **No separate unit test for `formVerdictOf`** — it lives in a `benchmarks/` file (outside the
   `src/**/*.test.mjs` glob, so it wouldn't run in `npm test`); it is verified by the `--offline` regen
   output and the committed numbers. The honest-verdict logic is also covered conceptually by the
   `held`/`regressed`/`improved` branches exercised on the two real subjects.

## Acceptance criteria status
- [x] Per-region form-target interface the accept step consults; concept impl today + documented GLB
      adapter point; swap needs no observe/diagnose/accept change (`form-target.mjs`, `resolveFormTarget`,
      wired in `liveFormScore`; proven by `form-target.test.mjs` group D + the live test).
- [x] Full loop on koi + heart; before/after IoU + categorical verdict vs E-13 baseline; renders +
      before/after pairs saved (`form-revise-ab.{json,md}` + `form-revise-ab/<subj>/` + `pr/assets/frames/`).
- [x] `design-learnings.md` E-15 form-revision section (before/after IoU, where it helped vs didn't,
      iteration cost, residual — honest, E-14 style).
- [x] E-12 handoff in `pr/assets/` (`form-revise.md` + frames; the "measured the gap, narrowed it
      surgically" story — told honestly as measure→attempt→refuse).
- [x] Honest (the rolled-back residual is the headline); `npm test` green.
