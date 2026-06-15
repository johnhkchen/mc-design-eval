# T-136-01 geometry-levers — Plan

Each step is independently verifiable and commits atomically. `npm test` (node --test over
`src/**/*.test.mjs`) is the bar at every step; the suite baseline is green (~1949 tests).
Sibling sessions are live on T-134/T-135 — before each commit, re-check `git log --oneline -3`
and never amend (the T-133/T-134 interleave lesson).

## Step 1 — the pure levers: `src/workshop/geometry.mjs` (+ tests)

Write `GEOMETRY_PARAM_KEYS`, `resolveMass`, `applyGeometryAdjust`, `substituteMass`,
`prunePaint`, `ratioGuard` per structure.md. Test fixture: a minimal 2-mass building program
(hand-built, in-pack against a synthetic pack literal — the measured-program.test.mjs pattern;
no subject names).

Tests (geometry.test.mjs):
- G1 eaveHeight lever: `{eaveHeight: 16}` on a storeys-2×4 mass factorizes (4×4), recompiles,
  shell height + roof eaveY/ridgeY + bands move together; budget preserved.
- G2 width/depth lever resizes rect, origin fixed; ridge rise re-derives.
- G3 pitchClass off the pack vocabulary throws (message names the vocabulary).
- G4 detaching a mass (width shrink past touching) throws via connectivity finding.
- G5 eaveHeight + storeys together throws (exclusivity).
- G6 `substituteMass` swaps a whole mass and recompiles; off-vocabulary fragment throws.
- G7 `prunePaint` keeps positions still realized, drops orphans, reports counts.
- G8 `ratioGuard`: improvement passes, lateral passes, strict worsening rejects, null targets
  vacuous-passes.
- G9 `resolveMass`: mass id direct; element id `main-roof` → `main`; longest-match when one
  mass id prefixes another; unknown → null.
- G10 determinism: same inputs → byte-identical serialized program (JSON.stringify compare).

Verify: `node --test src/workshop/geometry.test.mjs`, then full suite. Commit.

## Step 2 — action grounding: `actions.mjs` (+ tests)

`parseAction` ctx `{program, pack, source?}`: adjust-params dual grounding (element → legacy;
source mass → geometry vocabulary, numeric checks, exclusivity); re-recognize accepts mass ids.
`DEFAULT_APPLIERS["adjust-params"]` routes the geometry form (`action.massId` present) through
`applyGeometryAdjust` using ctx `{source, pack, budget}`; absent source → unavailable.

Tests: dual grounding both ways; geometry key vocabulary rejection message lists
GEOMETRY_PARAM_KEYS; applier returns `{kind:"geometry", program, source}`; sourceless ctx keeps
today's behavior byte-for-byte (existing tests unchanged = the regression proof). Commit.

## Step 3 — loop threading: `loop.mjs` (+ tests)

`source` opt, applier ctx, `await applyAction`, geometry/recognize candidate handling
(prunePaint → conform → isRegression → ratioGuard), ledger `source`/`targets` roots, applied
payloads. Rollback reasons: conformance regression keeps the existing string; ratio rejection
uses `ratio-guard: <metric> <before>→<after> vs target <t>`.

Tests (loop.test.mjs additions, synthetic exchange seam as today):
- L1 geometry round accepted: ledger applied.kind "geometry", source advanced, ratios improved.
- L2 ratio-guard rollback: conformance lateral but ratios strictly worse → rolled back, reason
  recorded, program/source unchanged.
- L3 paint pruning: accepted paint then accepted geometry shrink → pruned count recorded, final
  artifact has no orphaned paint voxel.
- L4 injected re-recognize applier (async) returning `{kind:"recognize", mass, replies,
  askCount}` → accepted round carries fragment + raw replies; unavailable when not injected
  (existing AP2 behavior preserved).
- L5 sourceless run on the existing fixtures: ledger byte-identical to pre-change expectations
  (no `source` key, no behavior shift).

Commit.

## Step 4 — replay + offline: `replay.mjs` (+ tests)

`replayLedger({ledger, pack})` kinds geometry (re-derive) / recognize (recorded fragment), paint
pruning at acceptance points, pack-required error. `offlineAssert` gains `pack` (or derives via
the existing `conform` closure + a `replayedDeclarations` path): final conformance re-check uses
replayed declarations; recognize rounds need non-empty `applied.replies`, askCount ≤ bound.

Tests:
- R1 the AC integration case: run a synthetic loop with one accepted geometry round → replay
  from the ledger → `serializeArtifact` byte-equal to the loop's final artifact.
- R2 recognize round replays from the recorded fragment without any model.
- R3 ledger with geometry rounds + no pack → throws naming the requirement.
- R4 offlineAssert flags a recognize round missing raw replies; passes the good ledger.
- R5 legacy ledgers (committed cottage/barn/fixture shapes) still replay with no pack arg —
  regression-proof against the committed records' shapes (load the real committed cottage
  ledger read-only in the test, as the repo's fixture tests do, or mirror its shape).

Commit.

## Step 5 — the re-recognize exchange contract: `rerecognize.mjs` + BAML + routing

`rerecognizeRenderArgs`, `parseMassReply`; `baml_src/rerecognize.baml` (ReRecognizeMass);
OP_ROUTING += `workshop-rerecognize` (check for a pinned scoping-rationale regen — model-tier
tests will say). Tests: render args deterministic + digests reused; parseMassReply gates
(malformed JSON, off-vocabulary role, schema violation → throws with the finding text; valid
fragment returns substituted program). If the BAML fixture harness requires a golden for new
functions, mint it via `scripts/mint-baml-fixture.mjs`. Commit.

## Step 6 — prompt surface: `critique.mjs` + `critique.baml`

`source_block` param (masses JSON + ratio rows + lever vocabulary line), action-line docs.
Tests: source block renders ratios + mass ids; sourceless `critiqueRenderArgs` output is
byte-identical to today (golden byte-pin proof — the critique fixture test must stay green
without re-minting; if the template change alters sourceless bytes, re-mint the golden and say
so in progress.md). Commit.

## Step 7 — the proof runner: `geometry-levers.mjs` + isolation + scripts

Runner per structure.md (live/--replay/--offline), `levers/` paths, pin-guard preflight, ISO1
list += runner, npm scripts. Tests: isolation suite green (ISO1 token scan over the new runner);
a smoke unit for `leverRels` namespacing. Full `npm test` green. Commit.

## Step 8 — the cottage proof (live spend) + records

`npm run levers:cottage` (live: GL renders + strong-tier critique rounds + possibly
re-recognize). Then `levers:cottage:replay` and `levers:cottage:offline` must exit 0.
Outcomes recorded in the run record + digest md, whichever branch the model takes:
- model aims a geometry lever → accepted revision, ratios row shows movement toward 1.4145;
- model still doesn't → the recorded capability finding (the AC's honest branch).
Budget: the committed seed's 6 rounds; spend ≈ 6 critique exchanges (+ bounded re-asks). If the
shim hits a spend limit (zero-token notice replies), probe with a minimal `claude -p` before
re-spending (memory lesson). Commit records + progress.

## Step 9 — review artifact

review.md: changes, test coverage, AC receipts, open concerns (T-135 guard handoff, barn run,
chain adoption of levers under S-138). No ticket frontmatter edits.

## Testing strategy summary

- Unit: every new pure function (geometry, rerecognize, critique args) — node:test, no GL/model.
- Integration: loop→ledger→replay byte-equality with geometry + recognize rounds (Step 4 R1/R2
  satisfy AC1's "integration case proves a geometry revision round-trips through replay").
- Isolation: ISO1/ISO3/ISO4 extended over all new action code (AC4).
- Live evidence: Step 8 (AC3); deterministic verification via replay/offline exit codes.
- Regression: sourceless byte-identity tests at every seam (actions, loop, critique, replay).
