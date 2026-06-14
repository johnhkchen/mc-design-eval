# T-146-01 — Progress

Status: **all four ACs implemented; three commits landed; suite green except one sibling-caused
failure (FX-R1) owned by T-145-01.**

## Commits
1. `b3a2d7d` feat(T-146-01): shared surface-relief op — proud emission, recess-by-exclusion,
   no-regress harness. (`src/view/surface-relief.mjs`, `src/view/surface-relief.test.mjs` SR1–SR9 + the
   four phase artifacts.)
2. `2609a08` feat(T-146-01): reliefProfile — 2.5-D read of proud/recessed structure from per-cell
   depth. (`src/view/surface-grid.mjs` + its test group, SR10 added to the relief test.)
3. `6c11ab8` feat(T-146-01): register surface.relief brush + preview card; door tripwire guards it.
   (`src/pack/idiom-registry.mjs`, `src/pack/brush-door.conformance.test.mjs`,
   `src/pack/brush-contract.test.mjs` count 23→24.)

## What was built vs. the plan
Followed the plan exactly (Step 1 op+harness, Step 2 read, Step 3 door). One in-step deviation, as the
plan anticipated: **SR6's "blocked ray" sub-assertion was dropped.** Rationale (documented here per the
RDSPI deviation rule): an obstacle placed in front of an exterior wall *becomes* the front-most skin and
is itself relieved, so the `break`-on-occupied guard cannot fire from a true exterior skin cell at the
first outward step (a skin cell is front-most by definition → its o=1 outward neighbour is empty). The
guard is kept in the code (correct for pathological multi-mass cases, and it matches clinker's "lap
already cast (or another mass) — skip"), but the unit test now proves the behaviour it *can*:
`depth ≥ 2` emits a contiguous z=−1..−depth run. Idempotence (the real re-run no-op) is proven by SR4
via the material-identity skip (clinker's actual idempotency mechanism), not the break.

## AC status
- **AC1 shared op through the door** — DONE. `surfaceRelief(occ, opts)` generalises clinker's
  proud-emission (faces × rhythm {column|row, every, span, phase} × depth × material), recess by
  exclusion (no air op; `report.fieldCells` makes the recess observable), PURE, byte-stable (sorted
  cell iteration), idempotent (material-skip + break-on-occupied). Registered as `surface.relief`
  (`kind:"pass"`) in the registry door; added to the brush-door `TECHNIQUES` allowlist. Proven by
  SR1–SR8 + the registry/conformance/contract tests.
- **AC2 in-plane silhouette preserved + no-regress harness gate** — DONE. By construction: relief is
  emitted only in front of existing exterior cells, so it collapses on the relieved face's own ortho
  axis. `reliefNoRegress(occBefore, placements, {faces})` is the gate (exported for S-148 reuse): it
  proves the own-face elevation mask AND `maskProportions` byte-identical, and whole-build
  `ridgeToEave`/`roofShare` byte-identical; the perpendicular plan-aspect widening is recorded in
  `expectedWidening` as honest visible relief. SR3 (rake containment) + SR9 (the gate).
- **AC3 2.5-D reads relief + documented construction-stage** — DONE. `reliefProfile(grid)` in
  `surface-grid.mjs` consumes the per-cell `depth` the projection already records, classifies
  proud/flush/recessed vs the modal wall plane, works on ortho + diagonal grids. Header + module docs
  state relief is a CONSTRUCTION-stage capability, never a workshop paint air-op (the no-air-op rule
  stands for paint). Proven by the surface-grid relief group + SR10.
- **AC4 preview card, tests, green, repro byte-identical, no per-building constants** — DONE.
  `surface.relief` preview card (pilaster strips proud of a flush field) renders through
  `brush-catalog`/`brush-preview` (meta-tests green). 13 new unit tests (SR1–SR10) + 3 surface-grid
  relief tests + count bump. `RELIEF_DEFAULTS` is the only frozen default (depth 1, span 1, phase 0);
  `every` is always caller-supplied — no subject tuning. Byte-identity verified: `workshop:replay`
  BYTE-IDENTICAL, `workshop:offline` re-asserted clean, `patternbook:repro` cottage+barn reproduce
  byte-identically.

## Verification log
- `node --test src/view/surface-relief.test.mjs` → 10/10.
- `node --test src/view/surface-grid.test.mjs` → 13/13.
- `node --test src/pack/idiom-registry.test.mjs src/pack/brush-door.conformance.test.mjs` → 16/16.
- `node --test src/pack/brush-preview.test.mjs src/pack/brush-catalog.test.mjs` → 12/12.
- `npm test` → 2067/2068 pass; the lone failure is **FX-R1** (see below).
- `npm run workshop:replay` / `workshop:offline` / `patternbook:repro` → all byte-identical.

## The FX-R1 failure is NOT this ticket's (handoff to T-145-01 / S-149)
`FX-R1 recognition render is byte-identical to the committed live records (cottage, barn)` fails because
the working tree carries the **concurrent T-145-01 thread's UNCOMMITTED changes**:
`schema/building-program.schema.json` (+96 lines: a `facade` grammar block, tagged "T-145-01, E-35"),
`schema/style-pack.schema.json`, `src/recognition/program.mjs`, and untracked
`src/recognition/facade-grammar.mjs` / `facade-render.mjs` / fixtures. That schema block flows into the
recognition prompt's `schema_json` and drifts the cottage/barn `promptSha256`.

Evidence it is not mine ([[shared-file-commit-sweep]], [[ticket-double-dispatch]]):
1. At `b903216` (pre-my-work, clean tree) FX-R1 PASSES.
2. A before/after render diff shows the ONLY change is the `facade` schema block (T-145-01-tagged).
3. My three commits never touch `schema/building-program.schema.json`; my registry addition does NOT
   alter the recognition prompt — `surface.relief` is not in `packs/rustic.json`, so `packDigest`'s
   pack-gated `passes` line is byte-unchanged, and `schema_json` is a static file load for my work.

Action taken: **none on the recognition pins.** Re-pinning the cottage/barn `promptSha256` belongs to
T-145-01 (and S-149, the terminal re-skin + re-verdict that owns all E-35 judge/record runs) —
re-pinning another ticket's owned record here would be a [[pin-guard-is-structural]] violation. The
brush-count assertion (23→24) WAS mine and is fixed in commit 3.

## Open items → Review
- FX-R1 to be re-pinned by T-145-01/S-149 once the facade schema lands (not a defect in this work).
- No production runner calls `surface.relief` yet — wiring relief into a build/skin chain is S-147
  (articulation brushes) / S-149 (re-skin), per the E-35 DAG. This ticket ships the op + read + gate.
