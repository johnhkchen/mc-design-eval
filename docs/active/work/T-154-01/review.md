# T-154-01 — Review (unify-chain)

Handoff for a human reviewer. The unified build chain (E-37 / S-154): generate-first's parametric
realizer is now the Stage-4 seed the workshop iterates, behind one `build:<subject>` entry point.

## What changed

### New files
- **`benchmarks/sculpture/build.mjs`** — the ONE entry point. Spawns recognize (verify, committed) →
  `generated-milestone.mjs --skip-gate` (Stage 4 seed) → copies the seed → `workshop.mjs --seed-artifact`
  (Stage 5) → `renderBesideConcept` (E-36 glance) → `build/<key>.{json,md}` receipt. Imports **no gate
  seam**; `--repro` proves the deterministic stages; honest pipeline-failure record; E-25 self-grep.
- **`STRUCTURE.md`** (repo root) — the canonical Stage→module→artifact→entry-point map + the
  retired-from-live-path list + enforced invariants. Authoritative; S-157 adds the staleness test.
- **`src/workshop/seed-artifact.test.mjs`** — 9 tests (AA/AB/AR/AS): `articulateArtifact`, the loop's
  artifact-base mode (accept/rollback/unavailable/done), replay+offline, the build seam constants.

### Modified
- **`src/workshop/loop.mjs`** — `runWorkshopLoop` gains optional `seedArtifact`. When set, `realize`
  returns the frozen seed + recognized relief + paint (geometry is fixed); the ledger carries
  `seedArtifact`. **Null path is byte-for-byte unchanged** (the branch is selected once, before the loop).
- **`src/workshop/articulate.mjs`** — `articulateArtifact(base, articulation)`: the artifact-input twin
  of `realizeWithArticulation` (reuses `applyArticulation` + `mergePlacements`); base-unchanged on empty.
- **`src/workshop/replay.mjs`** — `replayLedger`/`offlineAssert` branch on `ledger.seedArtifact`
  (seed + paint trail → final; `assertArtifact` the seed; no `assertWorkshopProgram` on the envelope).
- **`benchmarks/sculpture/workshop.mjs`** — `--seed-artifact` flag: loads the base, derives declarations
  from the committed recognition (`compileProgram`), builds the seed envelope, runs paint-only, records
  under the distinct `<key>-build` namespace (`buildRels`). Legacy program-seed path untouched.
- **`src/workshop/seed.mjs`** — `BUILD_BUDGET` (= `PATTERN_BOOK_BUDGET`, one calibration) + `buildRels`.
- **`package.json`** — `build:{cottage,barn}` + `:repro`.

## How it satisfies the ACs
- **AC#1 generate-first is the seed, one realizer feeds the loop** — `build.mjs` seeds the workshop from
  `generated-milestone`'s output (`provision-generate` realizer, untouched); the workshop iterates it via
  `--seed-artifact`. Pattern-book's `seedWorkshopProgram` is retired from the live path (still importable;
  archived in S-156).
- **AC#2 one entry point; gate separate** — `npm run build:<subject>` runs Stage 3→4→5→final; `build.mjs`
  imports no gate seam and never spawns the judge.
- **AC#3 behavior parity / recorded improvement, beside concept, no judge** — the named difference: the
  generate-first seed is clean GLB-fit geometry, so the loop revises **surface** (paint + relief); the
  geometry levers are `unavailable` by design. `renderBesideConcept` is the judge-free glance. No judge run.
- **AC#4 first STRUCTURE.md** — written, authoritative.
- **AC#5 replay/offline byte-identical; tests green; no per-building constants; subscription shim only** —
  artifact-base replay is byte-identical (proven live, below); `npm test` 2138/2138; declarations derive
  from the committed recognition; budget is the single `BUILD_BUDGET`; the loop's model stays on the shim.

## Test coverage
- **2138/2138** `npm test` green after every src-touching step (+11 net). New `seed-artifact.test.mjs`
  covers the artifact-base loop, replay/offline, articulate, and the seam constants.
- **Workshop isolation test** green — no judge seam added to `workshop.mjs`; `build.mjs` is gate-free.
- **Live integration proof (no model spend)** on the real cottage seed (6306 placements) + real
  recognition: declarations derive (`bands,symmetry,openings`); the artifact-base loop accepts paint and
  declares done; **replay byte-identical**; `renderBesideConcept` produced a real 5-panel PNG.

### Coverage gaps (flagged)
- **No unit test exercises `build.mjs` directly** — it is a spawn orchestrator (GL + subprocess), like
  `pattern-book.mjs`; verified by usage-guard + self-grep + the live integration proof. An end-to-end
  smoke (mock spawns) could be added but matches the project's "runners verified on-demand" posture.
- **The live metered workshop loop was not run** (see below) — so no committed `build/<key>` record
  exists yet; the loop's *logic* is fully covered by AB/AR + the live integration proof.

## Open concerns for human attention
1. **The metered creation run is the operator's billed step** (parallel to this ticket's own rule that
   the gate is separate/billed). To commit a unified-chain record: `npm run build:cottage` (metered) then
   `npm run build:cottage:repro`. I deliberately did not spend the subscription on a 6-round live loop in
   this autonomous pass; the deterministic spine is proven without it.
2. **Declarations vs seed geometry** — declarations come from the *recognized* program while the seed
   geometry is *generate-first's*; round-0 `before` conformance may carry baseline findings. The cage
   rolls back only **regressions**, so this never breaks the loop — but a reviewer should confirm the
   baseline is sane on the first real run (named in `design.md`/`structure.md`).
3. **`-build` record namespace** — the unified ledger writes under `workshop/<key>-build` to avoid
   clobbering the committed pattern-book ledger. When S-156 archives pattern-book, consider collapsing the
   namespace back to `workshop/<key>`.
4. **Spawn coupling to `generated-milestone.mjs --skip-gate`** — `build`'s generate-seed reuses the whole
   generate-first runner as a subprocess (incl. its determinism double-run + its own beside render). Clean
   and non-invasive, but it rewrites `generated/<key>/*` drafts (free under E-36) as a side effect. If that
   churn is unwanted, a future ticket could export the deterministic core for a write-free import.
5. **Out of scope, downstream** — S-156 archives the retired runners; S-157 adds the STRUCTURE.md
   staleness test + the topology guardrails. Both depend on this ticket and are not done here.

## Risk assessment
Low. Every loop/replay change is additive and gated on `seedArtifact`; the program-seed path and all
2138 tests are unchanged. The only behavior the team will see differ is the intended one: the live
`build` chain seeds from generate-first and refines surface, with the geometry levers reported
`unavailable`.
