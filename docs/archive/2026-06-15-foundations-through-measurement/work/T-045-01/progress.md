# T-045-01 — Progress: deterministic-revision-loop

## Status: Implement complete — all steps done, `npm test` green (432/432), live seam proven.

## Step 1 — scoped procedural passes (`src/revise/tweak.mjs`) — DONE
- `reliefPass` (Z move clamped to R), `materialPass` (block swap), `boxesIntersect`, `scopedTweakFor`,
  `tweakLabel`, `proceduralDiagnose` (model-free geometric, shared E-11 route vocabulary).
- `src/revise/tweak.test.mjs`: 10 tests (TA–TE) — overlap math, relief shift/clamp, material
  invariance, selector routing/stepping, diagnosis classification, purity. All green.
- Committed as the first atomic commit (with the RDSPI planning artifacts).

## Step 2 — the loop (`src/revise/loop.mjs`) — DONE
- `reviseLoop(artifact, opts)` — region walk → diagnose → per-attempt tweak/re-score/accept-or-rollback
  → lock-on-accept; returns `{schema, artifact, trace, iterations, converged, locked}`.
- `liveFormScore(cfg)` — the lazy GL form-score seam (observeRegion → formFidelityFromPair).
- `src/revise/loop.test.mjs`: 7 tests (LA–LG) — convergence, accept-gate/rollback, spatial lock,
  determinism, no-GL import scan, trace contract, defaults. All green.

## Step 3 — GL-gated live proof (`render/test/revise-loop.live.test.mjs`) — DONE
- One `reviseLoop` over the committed koi with the real `liveFormScore`; renders + scores end-to-end.
- Passes locally with GL present (~1.3 s); skips cleanly when GL is absent; not in `npm test`.

## Deviations from the plan (documented)

1. **Editor arity / `subBounds` binding.** `applyRegionEdit` calls the function-form `edit` with **one**
   argument (`R.placements`). The plan's `scopedTweakFor` returns a `(inRegion, subBounds) => …`
   editor (relief needs `subBounds` to clamp). Resolution: the LOOP binds `subBounds` before handing
   the editor to `applyRegionEdit` — `applyRegionEdit(current, R, (inR) => tweakFn(inR, sub))`. Keeps
   `tweak.mjs` clean and matches the lock's single-arg contract. No interface surprise for callers.

2. **Live test needed a forced route.** The koi head region is geometrically *rich* (varied depth +
   varied blocks), so the model-free `proceduralDiagnose` correctly returns **clean** (nothing to
   route) — which means the default path skips scoring. The live test's purpose is the **score seam**,
   not diagnosis, so it injects `diagnose: () => [{route:"relief"}]` to force the render+score path.
   This is faithful: the deterministic diagnosis quality is a separate concern (and a future model's),
   while the seam under test is the live render→IoU score. The pure suite still exercises the real
   `proceduralDiagnose` (tweak.test TE, loop.test LA via flat columns).

3. **`regionIoU` vs whole-object IoU.** As designed, `liveFormScore` defaults to **whole-object** IoU
   (a 3-D `subBounds` → 2-D render-rect projection is out of scope); a caller may pass an explicit 2-D
   `region` for `regionIoU`. Documented in the module + design.

## Verification
- `npm test`: 432 pass / 0 fail (was 415 before this ticket → +17: 10 tweak + 7 loop).
- `render/` GL suite: live loop proof passes with GL present.
- No model/SDK call anywhere in the loop; pure tests load no GL (LE import scan enforces it).
