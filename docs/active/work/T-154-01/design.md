# T-154-01 — Design (unify-chain)

The decision the research forces: generate-first emits an **artifact**; the workshop loop iterates a
**program** it re-realizes each round. Unifying "generate-first becomes the Stage-4 seed the workshop
iterates" is, at root, choosing how a clean parametric artifact becomes the loop's seed — and what the
loop's job *becomes* once the geometry arrives already clean.

## Forces (from Research)

- The loop re-realizes `current` (a program) every round (`loop.mjs:127-142`); the rendered/critiqued
  artifact IS that realization. Geometry levers (`program`/`geometry`/`recognize`) mutate a
  program/`source`; `paint` operates on the realized artifact; facade `articulation` folds onto it.
- generate-first's value is exactly that geometry is authored from GLB-fit + kit (gable-as-wall,
  overhang, carve-by-exclusion, provenance) — it is *cleaner than anything the loop's box-shell
  program can express*. Expressing it back as a `workshop-program/v1` would re-derive and degrade it.
- Replay/offline of committed pattern-book records is program+ledger→final byte-identity (Rule 5).
  Any change to the loop must keep those byte-identical.
- `npm test` 2119/2119, the isolation test (scans runner sources), the self-grep, and pin-guard all
  bind. Subscription shim only.

## Options

### Option A — Seed the workshop from the generate-first ARTIFACT (surface-revision loop)
Add an **artifact-base seed mode** to the loop: when the seed is a frozen artifact (generate-first's
build), `realize` returns that base (+ folded facade articulation from `source` + accepted paint)
instead of realizing a program. Geometry levers have no revisable program, so they report
**unavailable** (recorded honestly); the loop's live job is **surface/material revision + relief** on
already-clean geometry. The existing program-seed path is untouched (committed replays byte-identical).

- *Pro:* matches the pipeline philosophy split exactly — "pure code (brushes) for construction, the
  workshop loop for model self-revision"; generate-first owns Stage 4 (geometry), the loop owns Stage
  5 (surface). Keeps generate-first's realizer as-is (one realizer, AC#1). Additive to the loop:
  existing callers (no seed artifact) are byte-identical, so committed replays and the 2119 tests hold.
  The named behavior difference (no geometry levers; cleaner seed) is precisely what AC#3 asks to name.
- *Con:* touches the loop core (a new branch in `realize` + seed shape that bypasses
  `assertWorkshopProgram`), the replay module, and needs new tests. Geometry-lever appliers must
  degrade to `unavailable` rather than throw.

### Option B — Generate-first emits a `workshop-program/v1`
Make `generateProvision` (or a wrapper) express walls/roof/openings as program elements
(shell + roof idioms) so the existing loop consumes it unchanged.

- *Pro:* zero loop change; geometry levers keep working.
- *Con:* `boxShell` generates cells from a *footprint spec* — it cannot carry generate-first's GLB-fit
  cell set (carve-by-exclusion, gable-as-wall recolor, provenance, overhang). This **re-derives and
  loses** the realizer's output — the opposite of "one realizer feeds the loop." Rejected: it
  reintroduces the rougher seed the ticket exists to retire.

### Option C — Keep both seeds; orchestrator just sequences pattern-book then nothing new
Leave the loop alone; the orchestrator wires recognize → generate-first → (stop). Skip the workshop.

- *Pro:* trivial.
- *Con:* drops Stage 5 entirely — the workshop is the model's self-revision loop and the thing being
  measured. The ticket says generate-first feeds *the loop*; this feeds *the gate*. Rejected.

### Option D — Two-program splice (geometry from generate-first, program from recognition)
Seed the loop with the recognized program but swap round-0 geometry to generate-first's artifact.

- *Con:* splits geometry across two representations every round — the realize step would have to
  reconcile a program's cells with an artifact's, and replay determinism becomes a nightmare. This is
  the *current* confusion (two realizers) dressed up. Rejected.

## Decision — **Option A**

Unify via a new **`build.mjs` orchestrator** (the one entry point, AC#2) that makes generate-first's
parametric realizer the Stage-4 seed, and an **additive artifact-base seed mode** in the workshop loop
(AC#1). Rationale: it is the only option that (a) keeps generate-first's realizer intact as the single
construction authority, (b) preserves byte-identical replay of every committed program-seed record, and
(c) realizes the philosophy's own stage assignment rather than re-deriving it (CLAUDE.md: "realize it,
don't re-derive it"). The loop's degraded geometry levers are not a regression — a GLB-fit seed needs no
geometry hill-climbing; that is the *recorded improvement* AC#3 names.

## Shape of the chosen approach

```
npm run build:<subject>  →  build.mjs
  Stage 3  recognize     verify committed recognition (recognition/<key>.program.json) — input, no spend here
  Stage 4  generate-seed run generate-first's deterministic core (provision→generate→skin→stretch)
                         → seed ARTIFACT written to workshop/<key>/seed-artifact.json (builds/-free, E-36)
  Stage 5  workshop      spawn workshop.mjs --subject <key> --seed-artifact (artifact-base mode):
                         render → critique → paint/relief → conformance cage → repeat (budget) → final
  evidence  render-beside renderBesideConcept(final, concept) — judge-free glance (E-36); NO gate spawn
```

The **gate stays a separate explicit step** — `build` never spawns it (AC#2); the existing
`gate:patternbook:*` / `generated`-label gate scripts remain the billed measurement.

### Loop change (additive, replay-safe)
`runWorkshopLoop` gains an optional `seedArtifact` (a frozen base artifact). When present:
- `realize(_, paint)` = `applyPaint(foldArticulation(seedArtifact, source, pack), paint)` — the base is
  fixed geometry; only facade relief (from `source`) and accepted paint change it.
- `program`/`geometry`/`recognize` actions resolve to `unavailable` (no revisable program); `paint`
  and `done` work normally. The ledger records `seedArtifact`'s sha as the replay anchor instead of a
  seed program.
- When `seedArtifact` is absent (every existing caller), the code path is the **current** one,
  byte-for-byte — the 2119 tests and committed replays are untouched.

### Determinism & replay
- generate-seed is a pure function of committed inputs (kit/GLB/zone-map/policy) — `build --repro`
  proves two fresh seed runs byte-identical (E-36 posture, reusing generate-first's double-run).
- The workshop's artifact-base replay: committed `seedArtifact` + ledger (paint trail) → final,
  byte-identical (no model, no GL) — the same Rule 5 contract, anchored on the artifact instead of a program.

### What is NOT in this ticket
- No judge/gate run (AC#3). No archiving of the retired pattern-book seed stage (that is S-156 /
  T-156-01 — here it is merely *retired from the live `build` path*, left importable). No enforcement
  tests for the guardrails (S-157). `STRUCTURE.md` lands here as the **authoritative map** (AC#4); the
  test that keeps it honest is S-157's.

## Risks & mitigations
- *Loop-core regression* → keep the new branch strictly behind `seedArtifact`; run `npm test` after the
  loop change before wiring the orchestrator; assert byte-identity of the fixture replay.
- *Articulation on an artifact base* → `mergePlacements`/`applyArticulation` already operate on a
  placements array + occupancy, not a program — reuse them directly (no new relief logic).
- *Scope creep into the gate* → `build.mjs` imports no gate seam; the isolation pattern (source scan)
  covers it.
