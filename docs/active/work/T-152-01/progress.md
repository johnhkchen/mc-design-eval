# T-152-01 — Progress: render-every-loop

Implement log. All steps from `plan.md` executed; deviations noted inline. No judge spawned
anywhere. `npm test` green (2119, stable across 3 runs).

## Step 1 — Pure core + unit tests ✅ (commit `a3e33d8`)

- `src/view/render-beside.mjs`: `GlUnavailableError` (named, remedy + `cause`), `assertGlAvailable`
  (injectable flags), `composeBesideConcept` (pure RGBA, concept prepended), `renderBesideConcept`
  (injectable render seam + GL flags, lazy `renderViews` default).
- `src/view/render-beside.test.mjs`: 6 cases — assert both branches (named error + remedy + cause),
  compose geometry + concept-first + dim-mismatch rejection, `renderBesideConcept` via fake seam
  (no GPU), and a loud-fail case (seam never runs when the assert trips first).
- Ran the file alone: 6/6 pass. **Deviation from plan:** added a 6th test (loud-fail short-circuit)
  beyond the 5 scoped — cheap and pins AC2's "fails before the work" contract.

## Step 2 + 3 — package script + CLI runner ✅ (commit `5f96991`)

- `package.json`: `"render:beside": "node benchmarks/sculpture/render-beside.mjs"`.
- `benchmarks/sculpture/render-beside.mjs`: `--subject`/`--out`, resolves the subject from the
  `durable-skin` `SUBJECTS` registry, prefers `generated/<key>/artifact.json`, `assertGlAvailable()`
  up-front, `renderBesideConcept` → `pr/assets/frames/beside-concept-<key>.png`, honest log line.
  Judge-free, no chain, no pin write.
- `node --check` clean; no-`--subject` exits with a clear "must be one of …" usage error.

## Step 4 — The barn proof ✅ (commit `bf2289b`)

- `npm run render:beside -- --subject barn` → `pr/assets/frames/beside-concept-barn.png`
  (712 KB, 5 panels: concept + 4 azimuths) rendered from the T-150-01-fixed
  `generated/barn/artifact.json`.
- **Visually inspected** (Read tool on the PNG). Honest read recorded in the commit message:
  - **Reads right:** the T-150-01 stone gable end and overhanging eave are present and legible.
  - **Still reads wrong:** the roof is ragged/holey (the build is an open shell, not fully sealed);
    the form is squatter than the concept's tall steep silhouette; the timber wagon doors are not
    yet legible. This is creation feedback, not a verdict (no judge).
- This is the whole point of the ticket: the loop now *looks* at its output.

## Step 5 — Auto-wire the judge-free chain paths ✅ (commit `c08d0db`)

- `generated-milestone.mjs`:
  - Imported `assertGlAvailable`, `renderBesideConcept`.
  - `--skip-gate` branch: `assertGlAvailable()` then `renderBesideConcept(r1.styled, def.concept,
    pr/assets/frames/beside-concept-<key>.png, {label})` **before** the early return. The judge-free
    pass now always emits the render. Log updated.
  - Gated path: `assertGlAvailable()` before `renderSheet` so GL-absence is the named error, not the
    swallowed `sheets={error}` (the success-recording try/catch kept for non-GL hiccups).
- `challenge-milestone.mjs`: `assertGlAvailable()` once at the top of the render block, so the first
  GL failure is the loud named error rather than N swallowed per-angle `tryRenderAngle` `{error}`
  records. Per-angle catch retained for genuinely per-angle issues.
- `node --check` both clean; `npm test` green.

## Verification run

- `npm test`: **2119 pass / 0 fail**, stable across 3 consecutive runs. (One transient single-test
  flake appeared on the first post-edit run and did not reproduce — the suite has known flappy
  budget-edge/timing tests; the test *count* never changed and the new tests have no timing
  dependence beyond a tmpdir round-trip that cleans up.)
- No `spawnGate` / judge invocation anywhere in this ticket's changes.

## Deviations & decisions during implement

1. **Pure core under `src/view/`, not `benchmarks/`** (as Structure planned) — `npm test` only globs
   `src/**/*.test.mjs`, so the benchmark-dir test would not run. The GL-using CLI stays in
   `benchmarks/sculpture/` beside the other runners.
2. **`renderBesideConcept` takes `opts.glFlags`** so the fake-seam test passes `{GL_AVAILABLE:true}`
   without consulting the real probe — keeping the whole unit suite GL-free.
3. **Concept panel is letterboxed** by `resampleRgba(…, "aspect")` (the concept is wider than tall);
   acceptable — it preserves the concept's aspect beside the square renders. Not a defect.
4. **Pinned-subject `--skip-gate` still throws PinGuardError** before reaching the new render (the
   artifact persist at lines 548–549 precedes the skip-gate branch). That is the E-36 wound S-151
   owns; documented in the Step-5 commit. The barn proof deliberately uses the standalone CLI on the
   committed artifact, so S-152 is provable without S-151 landing first.

## Open items handed to Review

- The skip-gate↔pin-guard ordering (above) — cross-reference S-151.
- Whether the workshop loop should also emit a beside-concept sheet (it already renders every round
  and has the concept buffer loaded) — out of scope here; noted as a low-cost future reuse.
</content>
