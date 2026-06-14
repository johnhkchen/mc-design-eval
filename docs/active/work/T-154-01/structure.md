# T-154-01 — Structure (unify-chain)

The blueprint for Option A: a `build.mjs` orchestrator + an additive artifact-base seed mode in the
workshop loop. Every change is gated so the existing program-seed path is byte-for-byte unchanged
(committed replays + 2119 tests hold).

## Orchestration model — SPAWN, mirroring pattern-book→workshop

`build.mjs` sequences stages by **spawning the existing runners** (no refactor of `generated-milestone.mjs`),
exactly as `pattern-book.mjs` spawns `workshop.mjs`. This keeps generate-first's realizer intact and
untouched (AC#1: one realizer) and avoids the "import runs main()" hazard.

```
npm run build:<subject>  →  benchmarks/sculpture/build.mjs --subject <key> [--pack <pack>] [--rotate-pins]
  Stage 3  verify recognition  recognitionRels(key,pack).program must exist (committed input; no spend)
  Stage 4  generate-seed       spawn: generated-milestone.mjs --subject <key> --skip-gate
                               → writes generated/<key>/artifact.json (E-36: a free draft) + beside render
                               → copy that artifact → workshop/<key>/seed-artifact.json (the seed; guarded)
  Stage 5  workshop            spawn: workshop.mjs --subject <key> --pack <pack>
                                       --seed-artifact workshop/<key>/seed-artifact.json
  evidence renderBesideConcept(final, concept) — judge-free glance (E-36); NO gate spawn
  record   build/<key>.json + .md  (stage receipts: recognition sha, seed sha, workshop outcome, final sha)
```

`--repro` delegates: `generated:<key> --repro` (seed determinism, two fresh runs byte-identical) +
`workshop:<key> --replay` (loop replay byte-identical). `build` never spawns the gate; the isolation
pattern (source scan) covers it.

## Files

### NEW — `benchmarks/sculpture/build.mjs`  (the one entry point, AC#2)
- CLI: `--subject <key>` (durable-skin key with glb+generated.scale+committed recognition), `--pack`,
  `--rotate-pins`, `--repro`.
- Imports: `SUBJECTS` (durable-skin), `chainRels`/`recognitionRels`/`DEFAULT_PACK_REL`/`buildRels`
  (seed.mjs), `assertGlAvailable`/`renderBesideConcept` (render-beside), pin-guard helpers,
  `loadStylePack`, `spawnSync`. **No gate import** (isolation).
- `runLive`: verify recognition exists → spawn generate-seed → guarded-copy seed → spawn workshop →
  read back `chainRels.final` → render beside concept → write `build/<key>.json|.md`.
- Honest failure: a non-zero spawn or missing input writes `{status:"pipeline-failed", stage, error}`
  and exits 1 (E-25 Rule 6). E-25 Rule 3 self-grep (no subject keys in source) embedded in the record.

### NEW — `STRUCTURE.md`  (repo root; the canonical map, AC#4)
One screen: a table **Stage → owning module → artifact → entry point → (archived)** for the canonical
spine (Stage 1 sketch → 2 concept → 3 recognize → 4 generate-seed → 5 workshop → gate), plus a short
"retired from the live path / to be archived in S-156" list. Authoritative prose; S-157 adds the test
that fails on a stale map.

### NEW — `src/workshop/seed-artifact.test.mjs`  (pure, no GL/model)
- artifact-base `runWorkshopLoop`: a paint round revises the seed artifact; a regressive paint rolls
  back; geometry/adjust actions resolve `unavailable`; `done` terminates; ledger carries `seedArtifact`.
- artifact-base `replayLedger`: seed artifact + paint trail → final, byte-identical; `offlineAssert`
  re-asserts a synthetic artifact-base ledger clean.
- `articulateArtifact`: byte-identical to the base when articulation is `[]`; folds relief when present.

### MODIFY — `src/workshop/loop.mjs`
`runWorkshopLoop({ program, pack, source, seams, appliers, meta, seedArtifact = null })`:
- When `seedArtifact` is set, `realize(_, paintTrail)` returns
  `applyPaint(articulateArtifact(seedArtifact, articulationOf(currentSource)), paintTrail)` — the base
  is **fixed geometry**; only facade relief (from `source`) + accepted paint change it. `current`
  (program) is inert (no revisable elements); the geometry/program appliers report `unavailable`.
- When `seedArtifact` is null (every existing caller): the **current** `realize` runs unchanged —
  byte-identical. The branch is selected once, before the loop.
- Ledger: add `...(seedArtifact !== null ? { seedArtifact } : {})` beside `program`/`source` so replay
  is self-contained (the ledger IS the input — the program-seed precedent).
- No change to the score/rollback/termination logic; `liveActions` already derives from `appliers`
  (the runner passes a paint-only table ⇒ the prompt offers only paint/done).

### MODIFY — `src/workshop/articulate.mjs`
Add `articulateArtifact(baseArtifact, articulation)`: the artifact-input twin of
`realizeWithArticulation` — `applyArticulation(artifactOccupancy(base), articulation)` →
`mergePlacements` → recomputed manifest → `assertArtifact`. Returns the base unchanged when
articulation is `[]`/empty (the facade-less no-regression). Reuses the existing helpers; no new relief
logic.

### MODIFY — `src/workshop/replay.mjs`
Both entry points branch on `ledger.seedArtifact`:
- `replayLedger`: if `ledger.seedArtifact` present → **artifact-base path**: `base = ledger.seedArtifact`;
  walk accepted rounds applying only `paint` (`applied.kind === "paint"` pushes placements; any other
  accepted kind is a corrupt artifact-base ledger → throw); `source` from `ledger.source` drives
  articulation; final = `applyPaint(articulateArtifact(base, articulation), paint)`. No
  `assertWorkshopProgram` on the envelope. Returns `{artifact, program: ledger.program, source, applied}`.
- `offlineAssert`: in artifact-base mode, skip `parseWorkshopProgram(ledger.program)` (the envelope is
  not a workshop-program); assert `ledger.seedArtifact` is a valid artifact (`assertArtifact`); the
  round/cage/byte-equality checks are unchanged (they read `conformance`, not the program shape).

### MODIFY — `benchmarks/sculpture/workshop.mjs`
- CLI: add `const seedArtifactRel = argOf("--seed-artifact")`.
- `runLive`: when `seedArtifactRel` is set →
  - load `seedArtifact = assertArtifact(JSON.parse(read(seedArtifactRel)))`;
  - **require** `source` (the recognized program) — derive declarations:
    `declarations = compileProgram(source, pack).workshopProgram.declarations` (data-driven; no
    per-building constants). The seed envelope = `{ subject:key, pack:pack.style, budget:{...BUILD_BUDGET},
    declarations, elements: [] }`;
  - `appliers = { "spray-paint": DEFAULT_APPLIERS["spray-paint"] }` (paint-only; geometry/re-recognize
    ⇒ unavailable, recorded — the named AC#3 difference);
  - `runWorkshopLoop({ program: seedEnvelope, pack, source, seams, appliers, meta, seedArtifact })`;
  - meta gains `seedArtifactRef:{path,sha256}`; the digest notes seed = artifact-base.
- `--replay`/`--offline`: unchanged — `replayLedger`/`offlineAssert` branch internally on
  `ledger.seedArtifact`. Pin preflight + guarded writes unchanged (domain "workshop").
- The program-seed path (no `--seed-artifact`) is untouched.

### MODIFY — `src/workshop/seed.mjs`
- Export `BUILD_BUDGET = PATTERN_BOOK_BUDGET` (single-sourced; one calibration, no new constant).
- Add `buildRels(key, packRel)` → `{ seedArtifact: "workshop/<runKey>/seed-artifact.json",
  record: "benchmarks/sculpture/build/<runKey>.json", recordMd: "…/build/<runKey>.md" }` (the one place
  build paths derive, mirroring `chainRels`). `final` for read-back reuses `chainRels(key,pack).final`.

### MODIFY — `package.json`
Add `build:cottage`, `build:barn` (= `node benchmarks/sculpture/build.mjs --subject <key>`), and
`build` (no-subject usage error). Optional `build:<x>:repro`. (These are GL+spawn runners — on-demand,
not in `npm test`.)

## Ordering (load-bearing)
1. `articulateArtifact` (pure leaf) → 2. loop `seedArtifact` branch → 3. replay/offline branches →
4. workshop runner `--seed-artifact` → 5. `build.mjs` + `buildRels`/`BUILD_BUDGET` → 6. `package.json` →
7. `STRUCTURE.md`. Tests land beside 1–3 (pure) and run in `npm test`; 4–6 verified on-demand with GL.

## Invariants preserved
- **Replay byte-identity**: program-seed ledgers untouched; artifact-base ledgers replay seed+paint.
- **Isolation**: `build.mjs` imports no gate seam; the source-scan pattern extends to cover it (S-157
  formalizes — here just keep it clean).
- **No per-building constants / subscription shim only**: declarations derive from the committed
  recognition; budget is the single `BUILD_BUDGET`; model calls stay on the tiered shim via the loop's
  injected exchange.
- **Determinism**: generate-seed is generate-first's deterministic core; the seed copy is a byte copy.

## Known characteristic (named, per AC#3)
Declarations come from the *recognized* program while the seed geometry is *generate-first's*; round-0
`before` conformance may carry findings where the two differ. The cage rolls back only **regressions**,
so this sets a baseline, never breaks the loop — and is the honest "the seed is cleaner geometry, the
loop now refines surface" difference the ticket expects.
