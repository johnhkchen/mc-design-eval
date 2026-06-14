# T-149-01 Research — re-skin-reverdict (E-35 terminal)

Descriptive map of what exists. This is the epic's terminal integration story: it asks the texture
question with everything live. Upstream (S-145..S-148) built four parts; nothing yet joins them into
a build that *carries* relief, and no instrument run *requires* it. This document maps that gap.

## What the ticket asks (decomposed)

1. **Cottage (mandatory) + barn through the full loop** behind `--ticket T-149-01 --rotate-pins`:
   grammar recognition (S-145) live, relief op + articulation brushes (S-146/S-147) live in the build,
   workshop with levers + the relief-aware gate armed; ledgers committed; `--repro`/`--offline`
   byte-identical.
2. **The epic's only judge runs**: one per view, fresh renders, T-114 replies, pins rotated under
   T-119 (retired pins named); decided under the T-148 relief-aware gate with the prior arithmetic
   reported beside; the S-142 witnesses green-or-named-SKIP **before AND after** rotation (recorded
   both times).
3. **Recorded honestly**: does the flat box become the articulated build? Sheets beside concepts in
   `pr/assets/`; residuals carry the named relief/rhythm lens + measured deltas. A still-flat cottage
   *is the finding* and scopes the next rung.
4. **Milestone recompose** (`milestone:*` or successor): both subjects, baselines quoted
   pre-rotation, both arithmetics beside every verdict, `--repro` byte-identical (baselines never
   re-banked).
5. **Docs**: `design-learnings.md` gains the facade-grammar-&-relief (E-35) section + E-12 handoff;
   `review.md` for S-149; no per-building constants; `npm test` green.

## The four upstream parts and where they live

- **S-145 — facade grammar recognition.** `src/recognition/program.mjs:131` reads pack-carried
  facade-grammar bounds (`proportions.articulation`). The recognition schema can carry a `facade`
  block per mass (faces with `period`, `member` roles, `jettyDepth`, `eaveOverhang`, `courseLines`).
  **Status:** the schema + prompt support it; the **committed** `cottage.program.json` and
  `barn.program.json` carry **zero** `facade` keys (`grep -c facade` = 0). The only committed
  facade-bearing program is the fixture `recognition/facade/fixture-house/merged-program.json` and
  T-147's `src/recognition/fixtures/facade/articulated-program.json`.
- **S-146 — surface relief op.** `surfaceRelief` (in `src/form/surface-relief.mjs`, exercised by the
  brushes) places proud cells *in front of* existing skin, in-plane silhouette preserved
  (`reliefNoRegress` charter). It is construction, not recolor — the answer to "a recolor of a box
  can never make a pilaster proud."
- **S-147 — articulation brushes.** `src/view/facade-articulation.mjs` exports four `kind:pass`
  brushes (`pilaster`, `quoin`, `infillPanel`/`infill`, `eaveOverhang`), each delegating to
  `surfaceRelief`, registered through the brush door (`idiom-registry.mjs`, brush count 28). Each
  returns `{placements:[{pos,block}], report}` with byte-stable placement order.
  `src/recognition/compile.mjs` lowers a mass's `facade` into an **ordered plan**
  `[{massId, brush, params}]` (`facadeArticulationPlan`, compile.mjs:375) and exports
  `applyArticulation(occ, plan)` (compile.mjs:419) which runs the plan over an occupancy and returns
  `{placements, report}`. `compileProgram` returns `{workshopProgram, articulation}` (compile.mjs:359).
- **S-148 — relief-aware gate.** `src/form/relief-presence.mjs`: `reliefDemand(grammar, pack)` →
  per-face/per-course rhythm demands; `reliefPresence(occ, {demand})` → the fixpoint (`missing===0`
  ⇒ rhythm realized; `surfaceRelief`'s would-be placements ARE the missing relief);
  `composeReliefAwareVerdict(kitAware, presence)` → `relief-aware-gate/v1`, ANDs relief with the
  kit-aware verdict, **both reported**. The gate opt-in is `multi-angle-gate.mjs:130` `loadReliefLens`:
  fires only when `def.facadeGrammar` + `def.pack` are present and the grammar yields a non-empty
  demand. **No committed gate subject declares `facadeGrammar`.**

## THE GAP (the one deterministic code defect this ticket owns)

`compileProgram` returns `{workshopProgram, articulation}`, but **`seedWorkshopProgram`
(src/workshop/seed.mjs:103) destructures only `workshopProgram` and silently drops `articulation`.**
The build occupancy is `realizeProgram(workshopProgram)` (seed.mjs:106) — the bare skin, no relief.
The same drop exists in the per-round rebuild: `src/workshop/loop.mjs:127` calls
`realizeProgram(prog)` and never applies articulation; `src/workshop/geometry.mjs:54` recompiles for
the geometry levers and also takes only `workshopProgram`. So **even a facade-bearing program would
build flat** — `applyArticulation` is exported, tested (T-147 FA1–FA9 + facade-build.test), and
*unreached by any build path*. T-147's review names this exactly: "not yet applied by any live
committed chain … the correct integration point couples with S-148's gate and the workshop-loop
ordering" — i.e. deferred to S-149.

This is the only missing **deterministic** wiring. Closing it is byte-safe: a facade-less program
(today's cottage/barn + the synthetic fixture) compiles to an **empty** articulation plan
(`facadeArticulationPlan` returns `[]` with no `facade`), so `applyArticulation` adds zero
placements and the artifact is byte-identical — the no-regression guarantee is structural and
offline-testable.

## The build → render → gate → judge chain (how a run flows)

- **`benchmarks/sculpture/pattern-book.mjs`** — the chain orchestrator. Stage 1 verifies the committed
  conditioned sketch; Stage 2 verifies the committed recognized program reproduces; Stage 3 seeds the
  workshop program (`seedWorkshopProgram` via `seed.mjs`); the workshop runs; records committed. Flags:
  `--subject`/`--all`, `--repro` (no model/GL/spawn/writes — re-derive shas), `--offline` (`--repro` +
  `offlineAssert` on the committed ledger), `--pack`, `--ticket` (default `T-127-01` — **must be
  overridden to `T-149-01`**), `--rotate-pins`. The ticket's note "`pattern-book.mjs --ticket`
  defaults to an older ID — override" matches `pattern-book.mjs:371`.
- **`benchmarks/sculpture/workshop.mjs`** `runLive()` — loads pack + recognized program + concept,
  engages "the hands" when the recognized source program + sketch exist (geometry levers +
  re-recognize applier), `preflightPins` BEFORE any spend (T-119), runs `runWorkshopLoop` with
  render/exchange seams (BAML `CritiqueWorkshopRound` over real GL renders + tiered subscription
  model), then `guardedWriteRecord`s ledger/digest/final-artifact. This is where relief must be
  applied so the rendered build the judge sees carries it.
- **`benchmarks/sculpture/multi-angle-gate.mjs`** — THE gate. `deriveZones` / `policyInShippedPalette`
  / `gateCensuses` (per-view own-coverage + exposure existence); `loadReliefLens` (the S-148 opt-in);
  `judgeThroughPolicy` (T-114 metered ask, one thunk/view, fixed prompt, byte-identical re-asks);
  pins under T-119 (`preflightPins`, `guardedWriteRecord`). `--rejudge` seeds a committed malformed
  reply; `--offline` re-asserts committed records. The S-142 visibility witnesses run the gate's own
  `gateCensuses` (T-137) — green-or-named-SKIP.
- **Milestone recompose** — candidates: `milestone:proportion` (E-34's, `proportion-milestone.mjs`,
  `--baselines`/`--repro`), `styled:*`, `reconstructed:*`, `generated:*`. None is E-35-specific;
  the ticket allows "`milestone:*` or successor" — a new facade/relief milestone runner is the
  natural successor (quotes E-34 baselines pre-rotation, both arithmetics beside).

## Constraints surfaced (from memory + reviews)

- **Baselines are never re-banked.** barn (rustic) = committed E-34 verdict: 4/4 same-object, 8 minor,
  v2 PASS / legacy FAIL, *flat at the glance* (the S-148 anti-anchor). cottage = T-143-02's committed
  straight-ruler re-verdict (quote it as the texture baseline). Quote pre-rotation; do not regenerate
  pins to "fix" drift (`challenge-repro-drift-preexisting`, `pin-guard-is-structural`).
- **No per-building constants.** The period/rhythm lives in committed recognized-grammar JSON, not
  source (S-148 charter). Any threshold is the fixpoint `missing===0`, not a tuned number.
- **A committed verdict is never re-judged to fix a record field** (`generalization-grep…`,
  `judge-reply-policy-seam`). The judge runs here are *new* runs on *new* (relieved) builds.
- **Pin rotation needs `--rotate-pins` in the owning ticket** (`pin-guard-is-structural`,
  T-119). Rotated pins make witnesses FAIL-not-SKIP (`proportion-eave-latches-plinth`).
- **The live slice needs model + headless GL.** Recognition (facade grammar), the workshop critique
  loop, judge runs, and milestone renders all spawn `claude -p` and render WebGL — non-deterministic,
  real subscription spend; `--repro`/`--offline` re-derive shas from committed records only.

## Open questions for Design

- How much of the ticket is **deterministic code** (commit + test offline) vs **operator-run live**
  (model + GL + the epic's only judge runs, which must not be burned speculatively)?
- Where exactly to apply articulation (seed only, or seed + loop + geometry) so the rendered build —
  the one the judge and gate see — carries relief on every round, while facade-less builds stay
  byte-identical?
- Is the milestone a reuse (`milestone:proportion`) or a new E-35 successor runner?
