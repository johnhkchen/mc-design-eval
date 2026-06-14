# T-154-01 — Plan (unify-chain)

Eight steps, each independently committable and verifiable. Pure leaves first (covered by `npm test`),
then the runner wiring (verified on-demand with GL), then the map. `npm test` must stay green after
every step that touches `src/`.

## Step 1 — `articulateArtifact` (pure leaf)
- `src/workshop/articulate.mjs`: add `articulateArtifact(baseArtifact, articulation)` — the
  artifact-input twin of `realizeWithArticulation` (reuse `applyArticulation` + `mergePlacements` +
  `assertArtifact`); returns the base unchanged on empty articulation.
- **Test** (`src/workshop/seed-artifact.test.mjs`, part 1): `[]` ⇒ byte-identical base; a non-empty plan
  folds relief and recomputes the manifest.
- **Verify**: `npm test` green (new tests pass; nothing else moves).
- Commit: `feat(T-154-01): articulateArtifact — fold relief onto an artifact base`.

## Step 2 — loop artifact-base seed mode
- `src/workshop/loop.mjs`: `runWorkshopLoop` gains `seedArtifact = null`; when set, `realize` returns
  `applyPaint(articulateArtifact(seedArtifact, articulationOf(currentSource)), paintTrail)`; ledger
  carries `seedArtifact`. Null path byte-identical.
- **Test** (part 2): a synthetic seed artifact + a paint-only applier table + a scripted exchange:
  one accepted paint round revises the seed; a regressive paint rolls back; an `adjust-params` action
  resolves `unavailable`; `done` terminates; assert `ledger.seedArtifact` present and
  `ledger.program`/non-seed callers unchanged (a guarded existing loop test still passes).
- **Verify**: `npm test` green; the existing `loop.test.mjs` / `replay.test.mjs` unchanged-green.
- Commit: `feat(T-154-01): workshop loop seeds from an artifact base (paint-only revision)`.

## Step 3 — replay + offline artifact-base branch
- `src/workshop/replay.mjs`: `replayLedger` and `offlineAssert` branch on `ledger.seedArtifact`
  (seed+paint→final; no `assertWorkshopProgram`; `assertArtifact` the seed).
- **Test** (part 3): seed artifact + a 2-paint ledger → `replayLedger` byte-matches a hand-built final;
  `offlineAssert` returns `{ok:true}` on a clean synthetic artifact-base ledger and flags a tampered one.
- **Verify**: `npm test` green; program-seed `offlineAssert`/`replay` tests unchanged-green.
- Commit: `feat(T-154-01): replay/offline handle artifact-base workshop ledgers`.

## Step 4 — `BUILD_BUDGET` + `buildRels`
- `src/workshop/seed.mjs`: export `BUILD_BUDGET = PATTERN_BOOK_BUDGET`; add `buildRels(key, packRel)`.
- **Test**: a small `seed.test.mjs` addition (or part 4) asserting `buildRels` paths + `BUILD_BUDGET`
  identity.
- **Verify**: `npm test` green.
- Commit: `feat(T-154-01): build path/budget seam (buildRels, BUILD_BUDGET)`.

## Step 5 — workshop runner `--seed-artifact`
- `benchmarks/sculpture/workshop.mjs`: `--seed-artifact` flag; load base, derive declarations from
  `source` (compileProgram), seed envelope, paint-only appliers, pass `seedArtifact`, record
  `seedArtifactRef`; digest note. Program-seed path untouched.
- **Verify**: syntax (`node --check`); the workshop **isolation test** still green (no judge seam
  added); `npm test` green (the runner isn't unit-tested but its imports must resolve). Defer the live
  GL run to Step 7.
- Commit: `feat(T-154-01): workshop runner accepts --seed-artifact (artifact-base seed)`.

## Step 6 — `build.mjs` orchestrator + scripts
- `benchmarks/sculpture/build.mjs`: the spawn orchestrator (verify recognition → spawn
  generated `--skip-gate` → guarded-copy seed → spawn workshop `--seed-artifact` → readback →
  renderBesideConcept → write `build/<key>.json|.md`; `--repro` delegates; self-grep; honest failure).
- `package.json`: `build`, `build:cottage`, `build:barn` (+ optional `:repro`).
- **Verify**: `node --check build.mjs`; `node build.mjs` with no subject prints the usage error;
  E-25 self-grep clean. `npm test` green.
- Commit: `feat(T-154-01): build.mjs — one entry point (recognize→generate-seed→workshop→final)`.

## Step 7 — live proof on the registered subjects (GL, on-demand)
- Run `npm run build:cottage` (or barn) end-to-end **iff GL is available** (E-36 render-every-loop;
  authoritative probe is render/src `GL_AVAILABLE`). Capture: seed produced, workshop ran, final
  rendered beside concept (`pr/assets/frames/beside-concept-<key>.png`), build record written.
- **Behavior parity (AC#3)**: compare the unified final beside the prior workshop final beside the
  concept; name the difference (generate-first seed is cleaner — expected). **No judge run.**
- If GL is genuinely unavailable in this environment, record that in `progress.md`/`review.md` with the
  exact failure (`assertGlAvailable`), and prove the deterministic stages another way: `node --check`
  + the pure unit tests (Steps 1–4) + a `--repro`-style byte check on the seed via the generated
  chain's own `--repro`. Do **not** fake a render.
- Commit (if artifacts change): `chore(T-154-01): build:<subject> live proof — final beside concept`.

## Step 8 — `STRUCTURE.md` (AC#4)
- Write `STRUCTURE.md` at the repo root: the canonical Stage→module→artifact→entry-point→archived map +
  the "retired from the live path (archive in S-156)" list. Authoritative; S-157 enforces.
- **Verify**: every module/path it names exists (manual grep); every canonical entry point is a real
  npm script.
- Commit: `docs(T-154-01): first STRUCTURE.md — the canonical build-flow map`.

## Testing strategy
- **Unit (npm test, no GL/model)**: Steps 1–4 — the artifact-base loop, replay/offline, articulate,
  and seam constants. These are the determinism-bearing logic; they carry the AC#5 byte-identity guarantee.
- **Runner/integration (on-demand, GL+spawn)**: Steps 5–7 — `--seed-artifact`, `build.mjs`, the live
  cottage/barn proof. Verified by running, captured in `progress.md`.
- **Invariants re-checked every src-touching step**: full `npm test` (target 2119+ green, the new tests
  added), the workshop isolation test, no per-building constants, subscription shim only.

## Risk gates
- After Step 2 and Step 3, explicitly diff that a program-seed fixture replay is still byte-identical
  (the additive-branch contract). If any existing test moves, stop and reconcile before proceeding.
- Step 6 spawns the generated chain — confirm `generated/<key>/artifact.json` is a free draft under
  E-36 (not the instrument allowlist) so `build` needs no `--rotate-pins` for the seed.
- Step 7 is the only GL-dependent step; its absence does not block Steps 1–6, 8 from landing.
