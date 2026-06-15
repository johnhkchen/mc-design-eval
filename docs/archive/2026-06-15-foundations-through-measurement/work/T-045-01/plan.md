# T-045-01 — Plan: deterministic-revision-loop

Ordered, independently-verifiable steps with commit boundaries. Each step ends green
(`npm test`). Two atomic commits (passes, then loop); an optional third (GL proof).

## Step 1 — `src/revise/tweak.mjs`: the scoped procedural passes

Write the pure tweak module per the structure:
- `boxesIntersect(a, b)` — inclusive 3-D integer box overlap (shared with the loop's lock check).
- `reliefPass(inRegion, subBounds, {delta})` — shift Z, clamped to `subBounds.z`. Handle `voxel`
  (`pos[2]`) and `from`/`to` ops. Use a `shiftPlacementZ` helper; never mutate inputs.
- `materialPass(inRegion, {block})` — remap `block`, positions untouched.
- `scopedTweakFor(route, attempt, intent)` + `tweakLabel(route, attempt)` — route → editor; relief
  alternates `+1,-1,+2,-2`; material steps `intent.material.blocks ?? TWEAK_DEFAULTS.materialBlocks`;
  unknown route → identity.
- `proceduralDiagnose(artifact, R)` — geometric: zero Z-variance → relief; uniform block → material;
  else clean. Routes from the imported `ROUTING_TABLE`/`ROUTE_TARGETS`.

**Verify (`tweak.test.mjs`, TA–TE):** overlap math; relief shifts & clamps (a voxel at `subBounds.max.z`
shifted `+1` stays put); material preserves all coords; selector routing & attempt stepping; diagnosis
classification with routes ∈ `ROUTE_TARGETS`; purity (inputs unchanged). `npm test` green.

**Commit:** `feat(E-15 T-045-01): scoped procedural passes + geometric diagnose`.

## Step 2 — `src/revise/loop.mjs`: the loop, accept-gate, trace, live score seam

Write `reviseLoop` exactly per the structure's body (region walk → diagnose → per-attempt
tweak/re-score/accept-or-rollback → lock-on-accept). Then `liveFormScore({conceptPath,…})` — the lazy
GL seam: `await import("../../render/src/world.mjs")` + `render.mjs` to render the artifact (via the
same path `observeRegion` uses) and `formFidelityFromPair`/`formFidelity` to score. Export
`REVISE_SCHEMA`, `LOOP_DEFAULTS`.

Implementation order inside the file: pure loop first (so the suite can drive it with injected seams),
`liveFormScore` last (it is never reached by unit tests).

**Verify (`loop.test.mjs`, LA–LF):**
- **LA Convergence.** Synthetic monotone score `s(artifact) = count of in-bounds voxels at target Z`;
  relief shifts toward target. Assert `converged:true`, `iterations ≤ regions.length × perRegion`, and
  the final artifact strictly out-scores the input.
- **LB Accept-gate.** (i) constant score → nothing accepted, `deepEqual(out.artifact, input)`. (ii) a
  `material`-routed region with a silhouette-style score (block-blind) → rolled back. Every entry
  `accepted:false`.
- **LC Spatial lock.** Two overlapping bbox specs; arrange the first to be accepted; assert the second
  entry is `reason:"locked-overlap"` and that, via `expandArtifact`, no cell outside the *first*
  region's bounds changed on the second pass (the T-044 invariant, at loop scope).
- **LD Determinism.** Two identical runs → `deepEqual` trace & artifact.
- **LE No-GL import scan** (the Group-E idiom) + assert `liveFormScore` uses `await import(...render...)`.
- **LF Trace contract.** Assert required fields present on accepted & rejected entries.

`npm test` green.

**Commit:** `feat(E-15 T-045-01): deterministic revision loop — accept-gate + spatial lock + trace`.

## Step 3 (optional) — `render/test/revise-loop.live.test.mjs`: GL-gated live proof

Mirror `render/test/observe-region.test.mjs`: gate on GL availability; run one `reviseLoop` over the
committed koi (`benchmarks/sculpture/runs/009-vConcept-a-koi-fish/`) with the real `liveFormScore`
(concept = that run's `concept.png`), a single bbox region, `perRegion:1`. Assert it returns a
well-formed trace with numeric `scoreBefore`/`scoreAfter`. Skipped (not failed) when GL is absent; not
in `npm test`.

**Commit:** `test(E-15 T-045-01): GL-gated live revise-loop proof`.

## Testing strategy summary

- **Unit (in `npm test`):** the entire cage — convergence, accept/rollback, spatial lock, determinism,
  trace contract, no-GL — proven with injected synthetic seams (no GL, no model). This is the AC's
  "unit tests prove the cage."
- **Integration (GL-gated, separate):** the live render score actually wires (Step 3), proving the
  isolated seam is real, without burdening `npm test` with GL.
- **No model/SDK anywhere** — `proceduralDiagnose` is the default; the model critic is T-046-01.

## Risks & mitigations

- **R1 — relief Z-shift escapes R → lock throws mid-loop.** Mitigated: `reliefPass` clamps Z to
  `subBounds.z` itself; the lock is a backstop. TB tests the boundary (shift at the max face is a no-op).
- **R2 — `before` recomputed per attempt drifts.** Mitigated by computing `before` once per region
  (current is stable until an accept breaks the attempt loop). LD (determinism) guards regressions.
- **R3 — score async vs sync.** The loop `await`s `score`/`diagnose`/`observe` unconditionally, so sync
  stubs and async live seams both work (await of a non-promise is a no-op).
- **R4 — overlapping regions with full containment edge cases.** `boxesIntersect` is inclusive; LC
  uses deliberately overlapping boxes so the skip path is exercised, not merely available.
- **R5 — `proceduralDiagnose` mis-routes and the loop never improves.** Acceptable: the cage is proven
  on the *gate*, not on diagnosis quality; convergence (LA) uses a route that the synthetic score can
  reward, and termination is structural regardless.

## Definition of done (maps to AC)

- [x] `reviseLoop` does pick→(observe)→diagnose→scoped procedural pass→re-score→accept/rollback→lock→
      repeat under a bounded budget, returning artifact + per-iteration trace. *(Step 2)*
- [x] Unit tests prove convergence, accept-gate, spatial lock, determinism. *(LA–LD)*
- [x] No model/SDK in the loop; the live render seam isolated so pure tests load no GL. *(LE + Step 1/2 design)*
- [x] `npm test` green. *(each step)*
