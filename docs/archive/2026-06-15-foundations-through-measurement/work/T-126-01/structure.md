# T-126-01 workshop-loop — Structure

Phase artifact 3/6. Files, boundaries, interfaces, ordering. Code shape, not code.

## New package: `src/workshop/` (pure core — discovered by `src/**/*.test.mjs`)

### `src/workshop/program.mjs` — the revisable object + realization
- `WORKSHOP_PROGRAM_SCHEMA = "workshop-program/v1"`.
- Program shape (local contract, S-125-pluggable):
  `{schema, subject, pack:"rustic", budget:{rounds:int≥1}, declarations:{bands, symmetry?, openings?},
   elements:[{id, kind:"shell"|"idiom", idiom?, spec}]}`. Elements are ordered; later cells win
  (the expand rule).
- `parseWorkshopProgram(input)` → `{ok:true, program(frozen)} | {ok:false, errors[]}` — hand-rolled
  structural validation (a local seam, deliberately not a new committed JSON Schema: that contract
  belongs to S-125). `assertWorkshopProgram(input)` throws.
- `boxShell(spec)` → `{cells}` — the generic hollow-shell composer (no per-building code):
  `{footprint:{x0,x1,z0,z1}, y0, height, wallBlock, openings?:[{wall:"+x"|"-x"|"+z"|"-z",
   at:[u,y], w, h}], gables?:{ridgeAxis,"ridgeY",block}}`. True holes (openings simply not placed —
  the facade-recess-by-exclusion rule), floorless, optional triangular gable ends so a registry
  gable roof closes the top (generated-chain contract).
- `realizeProgram(program)` → `{artifact, cells, elements:[{id, kind, cellCount}]}` — shell via
  `boxShell`, idiom elements via `getIdiom(el.idiom).generate(el.spec)` (throws on unknown — the
  registry rule), artifact assembled exactly like `idiomCard()` (namespaced ids, sorted palette
  manifest, `metadata.trial_id:"workshop-<subject>"`, deterministic placement order). Optional
  `paint` placements appended by the caller (loop), not here.
- `applyParamAdjust(program, {elementId, params})` → new program, shallow-per-key spec merge;
  throws on unknown elementId (parser pre-validates against the program, so a live throw is a bug).

### `src/workshop/actions.mjs` — sanctioned action vocabulary + appliers
- `ACTION_NAMES = Object.freeze(["adjust-params", "spray-paint", "re-recognize"])` (`done` is a
  *decision*, not an action — lives in the reply contract).
- `parseAction(obj, {program, pack})` → validated frozen action or throw:
  - `adjust-params`: `{elementId ∈ program, params:object≠{}}`.
  - `spray-paint`: `{dir ∈ ORTHO_DIRS∪DIAG_DIRS, toBlock ∈ pack vocabulary, fromBlock?, bounds?:{min,max}}`.
  - `re-recognize`: `{elementId}` (vocabulary-valid; applier may be absent).
- `applyAction({program, occ}, action, {appliers = DEFAULT_APPLIERS})` →
  `{kind:"program", program} | {kind:"paint", placements} | {kind:"unavailable", reason}`.
- `sprayPaintApplier({occ, action, allowed})` → placements: `projectSurface(occ, action.dir)`,
  repaint cells whose bare block matches `fromBlock` (or any, if absent) within `bounds`,
  `{op:"voxel", pos:cell.voxel, block: namespaced(toBlock)}`; skips cells already `toBlock`.
  Deterministic; the E-23 canvas, model-free applier (judgement was in choosing the action).
- `DEFAULT_APPLIERS`: adjust-params + spray-paint wired; `re-recognize` **absent** → the loop
  records `action-unavailable` (S-125 plugs its applier in later; injectable seam).

### `src/workshop/critique.mjs` — the exchange contract (prompt + parser, pure)
- `WORKSHOP_REPLY_SCHEMA = "workshop-reply/v1"`; `ISSUE_SEVERITIES = ["minor","major"]`;
  `MAX_ISSUES = 6`.
- `buildWorkshopPrompt({program, pack, round, budget, liveActions, lastRound?})` → string: states
  the workshop role (improve the build toward the concept), lists images in order (concept, then
  the 4 azimuth renders by name), embeds the current program (elements + specs), the action
  vocabulary with which actions are live, last round's outcome (accepted/rolled-back + conformance
  delta) and demands one fenced JSON reply:
  `{critique:{issues:[{region, issue, severity}]}, decision:"revise"|"done", action?, rationale}`.
- `parseWorkshopReply(text, {program, pack})` → frozen reply or **throw** (judge-reply's
  `classifyReply` catches; bounded re-asks). Rules: `decision:"revise"` requires a valid `action`
  (via `parseAction`); `decision:"done"` forbids one; issues ≤ MAX_ISSUES, vocab-checked.

### `src/workshop/loop.mjs` — the round state machine (pure control flow, injectable seams)
- `WORKSHOP_LEDGER_SCHEMA = "workshop-ledger/v1"`; `LOOP_DEFAULTS = Object.freeze({rounds: 4})`.
- `conformanceScore(report)` → `{passed:int, findings:int}`;
  `isRegression(before, after)` → bool — lexicographic `(passed, -findings)` strictly worse.
- `runWorkshopLoop({program, pack, seams, budget?})` →
  `{ledger, program, artifact, placementsTrail}`:
  - Seams: `exchange({prompt, images:descriptors, round})` → `{verdict, replies, askCount}`
    (runner: runReplyPolicy over runTieredOp; tests: synthetic) ·
    `render({artifact, round})` → `[{angle, path}] | null` (runner: renderViews; tests: null) ·
    `conform({artifact})` (default: `artifactOccupancy` + `runConformance` with
    `program.declarations` — pure, importable here).
  - Per round: realize current program (+ accumulated accepted paint placements) → render
    (evidence) → exchange → on `done` stop; on `revise` apply action → candidate artifact →
    conform → `isRegression` ⇒ roll back (program/paint unchanged), else accept → ledger entry
    `{round, renders, replies, critique, decision, action, applied, conformance:{before, after,
    accepted, reason}}` → next round until `done`/budget.
  - `verdict:null` from the exchange (reply policy exhausted) → round recorded
    `exchange-refused`, loop stops (`outcome:"exchange-refused"`): malformed ≠ silently retried
    beyond bounds (the judge-reply seam rule, applied to the workshop's own exchange).
  - Ledger: header `{schema, subject, pack:{path, sha256}, program(seed), budget, tier,
    instrument:{azimuths, width, height}}` + `rounds[]` + `final:{outcome:"done"|
    "budget-exhausted"|"exchange-refused", rounds, conformance}`.
  - **No imports of** sdk-binding/model-tier/multi-angle-gate/render here — exchange and render
    arrive injected; the only impure thing the core ever touches is what the runner hands it.

### `src/workshop/replay.mjs` — Rule 5
- `serializeArtifact(artifact)` → canonical JSON text (single definition; runner and replay both
  use it — byte identity is equality of THIS function's output).
- `replayLedger({ledger})` → `{artifact, program}` — seed program from the ledger header; apply
  each **accepted** round's recorded action (adjust-params → `applyParamAdjust` + re-realize;
  spray-paint → recorded `applied.placements` appended); no model, no GL, no occupancy recompute
  needed beyond realize.
- `offlineAssert({ledger, finalArtifactText, pack})` → `{ok, problems[]}` — schema/header checks,
  budget bounds (`rounds.length ≤ budget`), reply-policy invariants (askCount ≤ MAX_REPLY_ATTEMPTS,
  parsed-verdict rounds carry an action xor done), conformance entries re-scored consistently,
  replay byte-equality vs `finalArtifactText`, final conformance re-run equals recorded.

### Tests (`src/workshop/*.test.mjs`, node:test, pure — no GL/model)
- `program.test.mjs` — parse/assert (good + each rejection), boxShell (holes are holes, floorless,
  gable ends), realizeProgram determinism (double-run byte-equal artifacts), applyParamAdjust.
- `actions.test.mjs` — parseAction vocab + rejections; sprayPaintApplier on synthetic occupancy
  (dir resolution, fromBlock filter, bounds, off-vocab toBlock rejected, idempotent on repaint).
- `critique.test.mjs` — prompt mentions live actions + budget; parser accepts the canonical reply,
  rejects: bad decision, revise-without-action, done-with-action, off-vocab severity/action,
  unfenced/malformed JSON (throws).
- `loop.test.mjs` — synthetic exchange seams: improving action accepted; regressing action rolled
  back (program unchanged, recorded); done stops; budget exhausts; unavailable action recorded;
  exchange-refused stops; ledger invariants (every round has replies, conformance both sides).
- `replay.test.mjs` — loop (synthetic) → ledger → replayLedger reproduces the loop's final
  artifact byte-identically; offlineAssert passes on it and fails on each tampered variant
  (flipped accepted flag, edited placement, trimmed round).
- `isolation.test.mjs` — **the structural judge-isolation pin**: reads the source of every
  `src/workshop/*.mjs` AND `benchmarks/sculpture/workshop.mjs`; asserts zero matches for the
  precise judge-seam tokens `["multi-angle-gate", "gate-instrument", "spawnGate",
  "judgeThroughPolicy", "aggregateMultiAngle", "parseMultiAngleVerdict",
  "benchmarks/sculpture/multi-angle/"]` (precise strings, not `/judge/` — judge-reply.mjs is the
  sanctioned reply policy); asserts the loop core has no top-level sdk-binding/render imports
  (E-15 LE pattern); asserts pin-guard refusal: `guardedWriteRecord({domain:"workshop",
  rel:"benchmarks/sculpture/multi-angle/x.json", rotate:true})` THROWS.

## Modified files

### `src/form/pin-guard.mjs` (additive — T-119 module owns refusals)
- `export const GATE_RECORD_NAMESPACES = Object.freeze(["benchmarks/sculpture/multi-angle/"])`.
- `export function domainRefusal(domain, rel)` → reason string | null (pure: `"workshop"` +
  rel inside a gate namespace → reason; everything else null).
- `guardedWriteRecord({..., domain = null})` and `preflightPins({..., domain = null})`: a domain
  refusal throws `PinGuardError` **before** tracked/rotate logic — rotate and sanction do NOT
  override it. No behavior change for the nine existing call sites (domain defaults null).
- `src/form/pin-guard.test.mjs`: add domain cases (refuses with/without rotate; null domain
  untouched; non-gate rel under workshop domain writes normally).

### `src/model-tier.mjs`
- Additive routing row: `{op: "workshop-critique", tier: "strong", rationale: "cross-view
  judgement + authoring a revision action — the rubric's strong side"}`. Update its test if the
  table is pinned.

### `package.json`
- `"workshop:fixture": "node benchmarks/sculpture/workshop.mjs --subject fixture"`
- `"workshop:replay": "node benchmarks/sculpture/workshop.mjs --subject fixture --replay"`
- `"workshop:offline": "node benchmarks/sculpture/workshop.mjs --subject fixture --offline"`

## New impure runner + fixture data

### `benchmarks/sculpture/workshop.mjs`
- House conventions: ROOT/HERE/OUT_DIR(`workshop/`), `argOf` flags `--subject` (default `fixture`),
  `--replay`, `--offline`, `--rotate-pins`. SUBJECTS registry (data, no per-building code):
  `fixture → {program: "benchmarks/sculpture/workshop/fixture/program.json",
  concept: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png", pack: "packs/rustic.json"}`.
- Live path: load pack (`loadStylePack`) + program (`assertWorkshopProgram`); **preflight** the three
  pins (`workshop/<subject>.json`, `.md`, `workshop/<subject>/final-artifact.json`) with
  `domain:"workshop"` BEFORE any model call; wire seams — `render` via `renderViews(artifact,
  MULTI_ANGLE_GATE.azimuths, {outDir: OUT_DIR/<subject>/round-N})`, `exchange` via
  `runReplyPolicy(ask, {parse: parseWorkshopReply…})` where `ask` = `runTieredOp({tier:"strong",
  prompt, images})` (image content blocks built the way the multi-angle runner builds them);
  run loop; write ledger/md/final-artifact via `guardedWriteRecord(domain:"workshop")`; copy
  first/last-round renders to `pr/assets/frames/workshop-<subject>-{before,after}.png` (evidence).
- `--replay`: read committed ledger + final artifact → `replayLedger` → byte-compare → exit 0/1.
  No GL, no model. `--offline`: `offlineAssert` → exit 0/1.

### `benchmarks/sculpture/workshop/fixture/program.json` (committed authored data)
Rustic-cottage shell judged against the committed cottage concept: shell (cobblestone ground
band/oak walls per pack roles, door + 2 windows as true holes, gable ends), registry `roof.gable`,
`plinth`, `chimney`. **Seeded defects** (the proof-run material): one wall band uses an off-pack
block (visible; trips `palette-in-pack` → spray-paint fixes it) and the roof `ridgeY` set too low
(flat-ish roof vs the concept's pitched gable → adjust-params fixes it). `declarations.bands` +
`openings` included so all six rustic conformance checks run.

## Ordering
1. pin-guard domain refusal (+tests) — the structural foundation, additive, independently green.
2. program.mjs (+tests) → 3. actions.mjs (+tests) → 4. critique.mjs (+tests) → 5. loop.mjs
   (+tests) → 6. replay.mjs (+tests) → 7. isolation.test.mjs (needs runner file present — lands
   with 8). 8. runner + fixture program + npm scripts + model-tier row. 9. Proof run (live spend,
   after preflight) + `--replay` + `--offline` verification; commit ledger + evidence. Each
   numbered group is an atomic commit candidate (some merge in Plan).
