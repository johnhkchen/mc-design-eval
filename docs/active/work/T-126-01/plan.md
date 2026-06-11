# T-126-01 workshop-loop — Plan

Phase artifact 4/6. Steps are ordered, individually verifiable, and atomically committable.
Verification baseline: `npm test` (validate self-tests + `node --test "src/**/*.test.mjs"`) green
after every step. Current suite must pass before step 1 (record the count in progress.md).

## Step 1 — Pin-guard domain refusal (the structural foundation)
**Edit** `src/form/pin-guard.mjs`: add `GATE_RECORD_NAMESPACES`, pure `domainRefusal(domain, rel)`,
and `domain` param on `guardedWriteRecord` + `preflightPins` (refusal precedes tracked/rotate
logic; rotate/sanction never override; default `domain:null` keeps all nine existing writers
byte-for-byte unaffected).
**Edit** `src/form/pin-guard.test.mjs`: workshop-domain write to a gate-namespace rel throws with
and without `rotate`; preflight refuses the same; workshop-domain write to a non-gate rel behaves
exactly as today; null domain regression cases.
**Verify**: `npm test` green. **Commit**: `feat(E-31 T-126-01): pin-guard domain refusal — workshop writes can never touch gate records`.

## Step 2 — Program contract + realization (`src/workshop/program.mjs` + tests)
Write program parser/asserter, `boxShell`, `realizeProgram`, `applyParamAdjust` per structure.md.
Artifact assembly mirrors `idiomCard()` (namespaced ids, sorted manifest, fill+voxel ops) — verify
against `assertArtifact` in the test (import the live AJV gate; the prompt-vs-live-schema lesson).
**Tests**: rejection per malformed field; boxShell true holes/floorless/gable ends (cell-set
assertions on a small synthetic spec); realizeProgram double-run byte equality; unknown idiom
throws; applyParamAdjust merge + unknown-element throw.
**Verify**: targeted `node --test src/workshop/program.test.mjs`, then full suite.
**Commit**: `feat(E-31 T-126-01): workshop program — the revisable object + generic shell + realization`.

## Step 3 — Actions (`src/workshop/actions.mjs` + tests)
`ACTION_NAMES`, `parseAction` (program/pack-grounded validation), `sprayPaintApplier` over
`projectSurface`, `applyAction` with `DEFAULT_APPLIERS` (re-recognize absent → `unavailable`).
Pack vocabulary set built from `pack.palette[].block` ∪ `pack.decoration[].block` (same sets
`paletteInPackCheck` reads — keep one derivation, import/duplicate-check against conformance.mjs;
if conformance exposes no helper, derive locally with a test pinning agreement).
**Tests**: per structure.md (vocab rejections, dir classes incl. one diag, bounds filter,
fromBlock filter, determinism).
**Commit**: `feat(E-31 T-126-01): sanctioned actions — adjust-params, spray-paint applier, re-recognize seam (unwired)`.

## Step 4 — Critique contract (`src/workshop/critique.mjs` + tests)
Prompt builder + strict reply parser per structure.md. Parser throws on malformed (the
classifyReply contract); fenced-JSON extraction tolerant of prose around ONE fenced block only.
**Tests**: canonical accept; the rejection matrix; prompt content pins (live actions named, budget
stated, image order stated, JSON contract embedded).
**Commit**: `feat(E-31 T-126-01): workshop exchange contract — prompt + strict reply parser`.

## Step 5 — The loop core (`src/workshop/loop.mjs` + tests)
`conformanceScore`/`isRegression`, `runWorkshopLoop` per structure.md (seams injected; default
`conform` from `artifactOccupancy` + `runConformance`). Ledger assembled here; rounds carry raw
replies verbatim from the exchange seam (judge-reply entry shape).
**Tests** (synthetic exchange/render seams, scripted verdicts; default conform on a tiny program
with a real rustic-pack subset or a minimal inline pack): accept path (conformance improves —
seeded off-pack block painted to pack block); rollback path (action introduces a regression →
program unchanged, `accepted:false`, reason recorded); done; budget exhaustion; unavailable
action; exchange-refused; ledger invariants.
**Commit**: `feat(E-31 T-126-01): the workshop loop — conformance-caged, budgeted, ledgered rounds`.

## Step 6 — Replay + offline (`src/workshop/replay.mjs` + tests)
`serializeArtifact` (canonical text — the loop/runner must emit final artifacts through it too;
wire loop.mjs to use it), `replayLedger`, `offlineAssert` per structure.md.
**Tests**: synthetic loop run → replay byte-identity; tamper matrix (flip accepted, edit recorded
placement, drop a round, inflate askCount) each caught by `offlineAssert`.
**Commit**: `feat(E-31 T-126-01): replay + offline re-assert — the build reproduces from program + ledger`.

## Step 7 — Runner, fixture program, isolation pin, scripts
- `benchmarks/sculpture/workshop.mjs` per structure.md. Image content blocks: copy the exact
  shape the multi-angle runner feeds `requestTextWithImage` (read it first; reuse, don't invent).
  Renders per round into `workshop/<subject>/round-N/` (gitignored area — confirm
  benchmarks/sculpture subdir PNG gitignore pattern covers `workshop/`, else extend .gitignore).
- `benchmarks/sculpture/workshop/fixture/program.json` — authored data per structure.md (rustic
  shell + roof.gable + plinth + chimney; seeded off-pack wall band + low ridgeY; bands/openings
  declarations). Sanity-check locally: realize + default conform → `palette-in-pack` FAILS before
  any revision (the improvement headroom is real), artifact passes `assertArtifact`.
- `src/workshop/isolation.test.mjs` — the DENY scan over `src/workshop/*` + the runner file +
  the pin-guard refusal assertion (structure.md token list verbatim).
- `src/model-tier.mjs` routing row + its test; `package.json` three scripts.
**Verify**: full `npm test`; `node benchmarks/sculpture/workshop.mjs --subject fixture --offline`
fails politely (no committed ledger yet — expected, exit 1 with a clear message).
**Commit**: `feat(E-31 T-126-01): workshop runner + fixture program + structural judge isolation`.

## Step 8 — Proof run (live spend), replay, evidence
1. Preflight check: pins untracked (first derivation — guard writes freely; no `--rotate-pins`).
2. `npm run workshop:fixture` — live: claude shim, strong tier, ≤4 rounds. Expected arc: model
   names the off-pack band and/or the flat roof from the renders; ≥1 accepted round improves the
   conformance score (the seeded `palette-in-pack` failure is the measurable metric).
3. `npm run workshop:replay` → byte-identical, exit 0. `npm run workshop:offline` → exit 0.
4. Evidence: before/after frames copied to `pr/assets/frames/`; `<subject>.md` digest includes the
   round table (critique → action → conformance delta → accepted) and render references.
5. Commit ledger + final artifact + md + frames:
   `feat(E-31 T-126-01): workshop proof run — <n> rounds, conformance <before>→<after>, replay byte-identical`.
**Contingencies** (record, don't improvise silently): shim unavailable/transport failure →
exchange-refused ledger is still a valid committed record of the attempt, but the AC needs a full
cycle — retry; model never picks a useful action within budget → keep the honest ledger, examine
the prompt for grounding gaps, ONE prompt revision is allowed before the proof run is committed
(prompts are workshop-side, not frozen instrument) — note it in progress.md.

## Step 9 — Review artifact
`docs/active/work/T-126-01/review.md`: files, test coverage map, AC walk-through, open concerns
(re-recognize unwired pending S-125; fixture-only proof pending S-125 first drafts; prompt
calibration N=1). RDSPI artifacts committed per house convention
(`docs(E-31 T-126-01): RDSPI artifacts`).

## Testing strategy summary
- **Unit (pure, no GL/model)**: every `src/workshop/*` module; pin-guard domain; tamper matrix on
  offline asserts; isolation DENY scan. These run in CI via `npm test`.
- **Integration (deterministic, no spend)**: `--replay` and `--offline` against the committed
  ledger — the named npm runs are themselves the regression harness.
- **Live (spend, once)**: the step-8 proof run; its outputs become committed fixtures for the
  deterministic paths.
- **Out of scope**: judging build quality (S-127), recognition (S-125), GL byte assertions (never).

## Risks
- `requestTextWithImage` content-block shape — mitigated by copying the multi-angle runner's usage.
- Model critique grounding (sees defects?) — seeded defects chosen to be visually loud
  (off-palette block; roof pitch), concept is the committed cottage concept the models have read
  well before (E-21/E-26 rationales).
- Conformance `declarations` drift after adjust-params (static declarations vs moved geometry) —
  fixture's adjustable parameter (ridgeY) does not move any declared band/opening; documented
  limitation in review.md.
- Token size of program in prompt — fixture program is small (~6 elements); fine for N=1.
