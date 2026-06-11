# T-126-01 workshop-loop — Research

Phase artifact 1/6. Descriptive map of what exists, where, and how it connects. No solutions here.

## 1. The ticket in one line

Build the **workshop loop** (E-31 Rule 1): build → 4-azimuth renders → model self-critique →
sanctioned revision → pack conformance gates the round → repeat under a declared budget — fully
ledgered, byte-identical replay (Rule 5), and **structurally unable** to call the frozen judge
(the T-119 pattern). Proof run on an existing build.

## 2. Upstream state

- **S-124 (T-123/T-124) — landed.** The realization tools and the conformance gate exist.
- **S-125 (T-125-01) — NOT started** (ticket `phase: ready`, no `docs/active/work/T-125-01/`).
  There is **no committed building program** and no recognition prompt/schema. S-126 is declared
  *parallel with S-125, disjoint seams* (S-126.md:48): the loop runner must not own the
  recognition prompt/schema. Consequence: the proof run uses **a committed fixture build**, per
  the ticket's own fallback, and the "revisable object" contract must be minimal/local.
- **S-127 — downstream.** Owns the single frozen-gate convening; not this ticket.

## 3. Existing tools the loop composes (the story's claim "the tools exist" verified)

### 3.1 Realization (the model's hands, path 1)
- `src/pack/idiom-registry.mjs` — `IDIOM_REGISTRY` (frozen; 10 constructs + 5 passes),
  `getIdiom(name)` (:281, throws on unknown), `idiomNames()`. Construct generators are pure
  `spec → {cells:[{pos,block,state?}], ...meta}` (roof gable/hip/pyramid, arch, flat-head,
  stair/slab courses; dormer/chimney/jetty/plinth from `src/form/idiom-constructs.mjs`).
- `src/pack/idiom-card.mjs` — `idiomCardLayout(specs)` (:63) realizes a spec list onto a plot
  grid; `idiomCard({specs})` (:123) emits a full **schema-valid design artifact** (AJV-gated)
  from pure specs. `CARD_SPECS` (:31) is a committed synthetic spec set — the existing precedent
  for a fixture build assembled from registry idioms.
- `src/view/occupancy.mjs` — `occupancyFromCells(cells)` (:45), `artifactOccupancy(artifact)`
  (:103): artifact/cells → Occupancy (Map "x,y,z" → block + forms/states).

### 3.2 Conformance (the round gate)
- `src/pack/conformance.mjs` — `runConformance({occ, declarations}, pack)` (:209) →
  `{schema:"pack-conformance/v1", passed, checks:[{name, passed, findings[]}]}`. Six predicates:
  courses-even, symmetry-held, openings-rhythm, palette-in-pack, watertight, single-component.
  Pure; throws on unknown check. `declarations` = `{bands, symmetry?, openings?}`.
- `src/pack/style-pack.mjs` — `loadStylePack(path)` (:207) schema+semantic gate; `packs/rustic.json`
  carries `conformance.checks` + `proportions`. `packPolicy(pack)` (:225) derives zone policy.

### 3.3 The lens (the model's eyes)
- `src/config.mjs` — `MULTI_ANGLE_GATE` (:50, frozen): azimuths `["+x+z","+x-z","-x-z","-x+z"]`,
  gapBudget 2. `MODEL_TIERS` (:34): `{light:"claude-haiku-4-5", strong:"claude-opus-4-8"}`;
  `PHASE1_MODEL_ID`; `DEFAULT_TIER="strong"`.
- `src/view/multi-angle.mjs` — `ANGLES` (:30: +x+z→45°, +x-z→135°, -x-z→225°, -x+z→315°, elev 30),
  `renderViews(artifact, angles, {outDir, width, height, label})` (:77) → per-angle PNG via
  `render/src/render-tool.mjs:renderArtifact()` (headless GL, framed camera, stairs lens-guard).
  GL renders are **evidence, never pinned** (PNGs bypass the pin-guard everywhere today).

### 3.4 The model seam (subscription shim + tiers + reply policy)
- `src/sdk-binding.mjs` — the single metered seam, spawns `claude -p --output-format stream-json
  --verbose`. `requestText({prompt, model, system, onMessage})` (:460) and
  `requestTextWithImage({prompt, images, ...})` (:478) — images as content blocks via
  `--input-format stream-json`. Raw stream messages observable via `onMessage`;
  `serializeTranscript`/`tallyUsage` precedents in `src/trial.mjs` (:72–:107).
- `src/model-tier.mjs` — `runTieredOp({tier, prompt, images, system, invoke})` (:57) routes
  through `SHIM_INVOKERS` (:26 — requestText/requestTextWithImage; never the metered API; a
  source-guard test enforces it). `ROUTING_RUBRIC` (:69): cross-view judgement / authoring →
  **strong**; one-view scoped detector over a bounded candidate set → **light**.
- `src/form/judge-reply.mjs` — `runReplyPolicy(ask, {parse, maxAttempts, seed})` (:100):
  bounded same-prompt re-asks for malformed replies, full `replies[]` ledger entries
  `{attempt, parsed, rawReply(≤400ch), parseError?, transport?, usage, source}`.
  `MAX_REPLY_ATTEMPTS=3`. This is the committed ledger pattern for raw model replies
  (memory: never copy the prompt-mutating artifact retry to judge-style seams).

### 3.5 Spray-paint (the model's hands, path 2 — E-23)
- `src/view/surface-grid.mjs` — `projectSurface(occ, dir)`; ortho/45° only (`resolveDir` throws
  on oblique). `src/view/face-paint.mjs` — `paintFace(occ, dir, targetGrid, {allowed, zoneOf,
  allowedByZone, skip})` (:67) → `{placements:[{op:"voxel",pos,block}], painted, offPalette,
  zoneRejected,...}`; `mergePaints` (:104); `applyPaint(artifact, placements)` (:130, append —
  expand is last-writer-wins). Run rule precedent (memory): gaps in kept lines adopt the kept
  block; isolates skipped.

### 3.6 Judge isolation enforcement precedents (T-119 + DENY-scan)
- `src/form/pin-guard.mjs` — `decidePinWrite` (:46, pure), `preflightPins({pins, rotate, intent})`
  (:71, throws `PinGuardError` BEFORE any spend), `guardedWriteRecord({root, rel, content,
  rotate, sanction})` (:106, fail-closed: tracked+different → refuse), `ROTATE_FLAG="--rotate-pins"`,
  `loadTrackedSet` (git ls-files; null → fail-closed "all tracked"). Nine existing pin-writers
  route every committed JSON/md through it.
- **Structural seam tests**: DENY-list source scans, e.g. `src/revise/form-edit.test.mjs` (~:260)
  asserts the module source matches none of `[/render/, /sdk-binding/, ...]`;
  `src/revise/loop.test.mjs` group LE enforces no-top-level-GL. This is the house pattern for
  "the seam is absent" — string-scan of module source + import graph, unit-tested.
- **The frozen judge lives at**: pure core `src/form/multi-angle-gate.mjs`
  (`parseMultiAngleVerdict` :85, `aggregateMultiAngle` :142) + metered runner
  `benchmarks/sculpture/multi-angle-gate.mjs` (`judgeThroughPolicy` ~:206). Gate records (pins):
  `benchmarks/sculpture/multi-angle/<subject>-<label>.json|.md`. E-26 runners reach the judge by
  **spawning the gate runner as a child process** (`spawnGate`, styled-milestone.mjs:180).

### 3.7 Prior loop shapes
- **E-15** `src/revise/loop.mjs` — `reviseLoop` (:61): fixed region walk, accept-if-improved else
  roll back, locked regions, structural termination (`maxIterations`, `perRegion`), per-iteration
  `trace[]`, injectable seams (score/diagnose/observe/tweakFor), `converged` = list exhausted not
  cap hit. Known limits (memory): per-region single-view hill-climb can lower whole-object IoU;
  LLM block-level edits overflow context at 50k+ blocks — the E-31 pivot answers with
  task-matched views + program-level actions, not block edits.
- **E-26 settle** (styled-milestone.mjs:128–175): fixpoint re-run bounded at 4 iterations,
  `trail[]` of per-round deltas, non-convergence throws.

### 3.8 Runner + replay conventions
- ROOT/HERE/OUT_DIR pattern; `argOf(flag)` CLI parsing; flags `--subject`, `--offline`, `--repro`,
  `--rotate-pins`; npm scripts `{runner}:{subject}` (args need `--` — memory: flag swallowing).
- `--offline` = re-assert committed record without renders/model calls (multi-angle-gate.mjs:268
  is the richest example: schema, contract, ledger bounds, byte-equality). `--repro` = fresh
  deterministic re-run, byte-compare, skip GL+judge. Byte-identity = JSON string equality
  (stable serialization), not hashes. `Date.now`/randomness excluded from committed records.
- World: `render/src/world.mjs:buildWorldFromVoxels` (:94), `buildWorldFromArtifact` (:131) over
  `src/expand.mjs:expandArtifact` (deterministic, order-stable).
- Tests: `node --test "src/**/*.test.mjs"` — **only `src/` is discovered**; runners in
  `benchmarks/` stay thin over pure `src/` cores (fixture-card/idiom-card precedent).
- Concept images live per subject, e.g. `benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png`
  (referenced from `generated/cottage.json: inputs.concept`).

## 4. Committed builds available for the proof run

- `benchmarks/sculpture/generated/{cottage,barn,church,gatehouse}.json` — generated-milestone
  artifacts (full builds, kit/zone-map lineage, gate records already exist for them).
- `benchmarks/sculpture/styled/*` — E-26 styled milestones (same subjects).
- `benchmarks/sculpture/idiom-card/card.json` — pure registry-realized artifact (no model lineage).
- None of these is program-backed (no idiom-instance parameter set behind them), which bears
  directly on which sanctioned actions are exercisable on each (parameter-adjust needs a program;
  spray-paint works on any artifact).

## 5. Constraints and assumptions surfaced

1. **Disjoint seam vs S-125**: the recognition prompt/schema belongs to T-125. The loop needs a
   *revisable object* now; whatever local program contract it uses must not preempt S-125's.
2. **Judge isolation is structural**: no code path from the workshop to
   `multi-angle-gate.mjs` (either file) — unit-tested absence/THROW; plus pin-guard refusal of
   workshop writes into `benchmarks/sculpture/multi-angle/`. Today `guardedWriteRecord` has no
   path-class refusal — refusal is tracked-content-based; a workshop-specific refusal is new.
3. **Replay without model calls**: every model output that influences the build must be in the
   committed ledger with enough recorded data to re-apply deterministically.
4. **Tiering per E-23**: self-critique is cross-view judgement → strong tier; any scoped one-view
   detector the loop adds → light tier (`ROUTING_RUBRIC` is frozen and documented).
5. **No per-building code**: subjects enter as data (registry/CLI), enforced by the existing
   building-name grep (T-125 AC notes its limits — it matches comments; memory).
6. **Conformance gate inputs**: `runConformance` needs `declarations` (bands/symmetry/openings) —
   the fixture (or program) must carry/derive these for the no-regress round gate.
7. **GL renders are non-deterministic across machines** (memory: reproducibility excludes GL from
   decisions): renders are evidence; the round gate and replay must gate on deterministic data only.
8. **Same-ticket concurrency**: checked 2026-06-11 ~13:00 PDT — no T-126-01 work dir, no sibling
   commits; proceeding.

## 6. Open questions carried to Design

- What exactly is the revisable object for the fixture proof run (artifact-only vs minimal
  program-of-specs), and which sanctioned actions does it unlock?
- Where the loop core lives (`src/` for test discovery) vs the metered runner (`benchmarks/`).
- Ledger schema: one file vs per-round; how raw replies, actions, conformance results, and render
  references compose; what replay consumes.
- How "measurable improvement" is evidenced without the judge (conformance metric and/or named
  visual defect with before/after renders).
