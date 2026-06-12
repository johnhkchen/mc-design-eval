# T-133-01 measured-proportions — Design

## The decision in one line

A **pure measurement-to-program seam** (`applyMeasuredProportions(program, sketch, pack)`) rewrites
the *recognized building-program's existing dimensional parameters* from the sketch's measurements
and emits a per-parameter source ledger; a new model-free runner commits the measured program (with
sources), its seeded realization, renders, and before/after silhouette ratios at **new record
paths** — prior pins untouched.

## Options considered

### Where quantity enters

- **A (chosen): rewrite the building-program upstream of compile.** The seam consumes
  (program, sketch, pack) and returns a schema-valid building-program/v1 plus a sources record.
  Compile stays ratified-pure ("consumes exactly (program, pack)"); the committed measured program
  remains a closed replay input (program + pack → byte-identical artifact); every downstream stage
  (seed, realize, conformance, component plan) works unchanged.
- **B (rejected): extend the schema with explicit `dimensions` overrides consumed by compile**
  (e.g. `mass.eaveHeight`). Exact expressivity, but it changes the canonical lowering for *every*
  program, touches compile/validate/workshop contracts at once, and widens the model-reply surface
  (the VLM could author overrides — exactly the estimator we distrust). Blast radius unjustified
  when A expresses the two subjects' measurements within existing bounds (max eave 24 ≥ 19.3).
- **C (rejected): rewrite the compiled workshop-program (post-compile).** Breaks the "committed
  program is the closed replay input" property — the seed would no longer be a function of a
  committed building-program; declarations would need hand-patching in step.

### Where the sources live

- **Chosen: a wrapping record** `measured-program/v1`: `{schema, ticket, subject, pack, inputs
  {programSha, sketchSha}, program: <building-program/v1>, dimensions: [...], conflicts: [...]}` —
  one committed JSON carrying both the revised program and its provenance. building-program/v1 and
  its AJV schema stay byte-untouched (no new optional field for model replies to wander into); the
  AC's "the program records each dimension's source" is satisfied by the committed program record.
- Rejected: schema-extending an optional provenance block (same reply-surface concern as B);
  sidecar `.sources.json` (two files that can drift; the record form is the house idiom —
  recognition's `record.json` wraps receipts the same way).

### Where the new records live

- **Chosen: `benchmarks/sculpture/measured/<runKey>.*`** mirroring `recognition/`
  (`<runKey>.program.json`, `.artifact.json`, `.record.json`, `.md`, `view-<runKey>-<angle>.png`),
  runKey pack-namespaced via the existing `packNs`. Satisfies AC 4 (new programs are new records;
  `recognition/*.program.json` and `workshop/*/program.json` byte-compares keep passing).
- Rejected: overwriting the chain seed under `--rotate-pins` — a re-roll of the workshop
  ledger/final/plan/record pins, judge-baseline churn, and S-138's job, not this ticket's.
  Wiring the measured seam *into* pattern-book behind a flag — same rotation problem; the chain
  adoption belongs to S-136/S-138 (recorded as handoff).

## Per-parameter resolution rules (the seam's contract)

All measured values are converted to **registry blocks** first
(`factor = registryScale / sampleScale`; `*Blocks` fields are pre-converted, cell fields are not).
Every dimensional parameter gets a ledger entry `{mass, parameter, source: "measured"|"fallback",
measured, used, residual?, note}`. Sketch-wins on conflict; conflicts recorded with both values.

1. **Footprint extents/aspect** (`rect.w/d`, per axis): scale every mass-rect *endpoint* by
   `target/bboxExtent` per axis (endpoint scaling keeps shared edges between touching masses
   aligned), round, re-derive w/d (min 3, schema clamp 64). Targets: `planDims × factor`, rounded.
   Barn: 48×24 → 48×26. Cottage bbox 26×28 → 27×32. After scaling, the seam re-checks opening-lane
   feasibility (program.mjs check 6) and mass connectivity; if either breaks on an axis, that axis
   **falls back to the recognized extent, recorded** (`source: "fallback"`, note naming the reason).
2. **Eave height** (`storeys × storeyHeight`): target `proportions.eaveBlocks`. Search all
   schema-valid factorizations (storeys 1..4 × storeyHeight 2..6) minimizing `|n×sh − eave|`;
   ties prefer (a) storeyHeight inside the pack band, (b) storeys nearest recognition's, (c) fewer
   storeys. Barn 10 → 2×5 (exact; recognition said 3×3=9 — conflict recorded). Cottage 19.3 → 4×5=20
   (recognition said 2×4=8 — conflict recorded). The pack band is **not** a clamp (S-133 demotes
   pack proportions to the fallback tier); a band excursion (sh=5) is recorded as a conflict
   resolved sketch-wins. Storey count is treated as part of the eave *quantity* (its only
   geometric meaning is the eave and the ground-course line); recognition's qualitative naming —
   roles, idioms, openings, treatments, ridgeAxis — is untouched.
3. **Pitch** (`roof.pitchClass`): measured ratio `tan(dominantTiltDeg°)` (per-mass pitch where the
   sketch names a matching mass, else the building read), snapped to the **nearest pack pitch
   class** (classes are rise/run ratios). Source stays `"measured"`; the snap residual is recorded.
   Rustic [1]: cottage 0.71→1, barn 1.0→1 — no change *for this pack*, honestly recorded; the
   vocabulary widening is S-134's.
4. **Ridge height**: not a schema parameter — derived by compile from (eave, pitch, span), all now
   measured. The ledger records the implied ridge vs `heightBlocks` as a derived check entry.
5. **Mass mapping**: sketch primary masses (role `"primary"`) only. Exactly one primary (both
   subjects) → building-wide measurements apply to every program mass. Multiple primaries →
   greedy bbox-overlap match (converted to blocks); unmatched program masses take the building
   read. Recorded in the ledger (`mass: "*"` vs per-id).
6. **Fallbacks**: any parameter the sketch cannot measure (field absent/null) keeps the program's
   value with `source: "fallback"` naming the missing measurement. Zero silent defaults: the ledger
   enumerates every dimensional parameter of every mass — a unit test asserts completeness.

## Validation posture for measured programs

The output must pass `assertBuildingProgram` (hard schema) and compile/realize/conformance.
`validateProgramAgainstPack` is the *model-reply* gate; the seam runs it and **tolerates exactly
the findings its own conflict ledger predicts** (storeyHeight-band excursions recorded
sketch-wins); any other finding throws. The reply gates themselves are untouched — VLM replies are
still band-gated.

## The runner and its records

`benchmarks/sculpture/measured-proportions.mjs` — subjects from the durable-skin registry
(recognize predicate), no subject keys in source (self-grep embedded), `--subject|--all`,
`--pack` (default rustic), `--ticket` (default T-133-01), `--rotate-pins`, `--repro`/`--offline`.

- **live**: sha-receipt sketch → re-parse committed recognition program through the live gates →
  `applyMeasuredProportions` → `seedWorkshopProgram` (conformance must pass; the chain's
  refuse-to-spend posture) → ratios → renders (evidence-only, absence recorded never fatal) →
  pin-guarded writes of program/artifact/record/md.
- **before/after ratios** (standalone, per E-33 Rule 2 names): ridge:eave, roof share of elevation
  ((ridge−eave)/ridge), footprint aspect (long/short) — computed from compiled geometry (roof
  element `eaveY/ridgeY`, shell footprints): **before** = the committed chain seed
  (`workshop/<runKey>/program.json`), **after** = the measured seed, **target** = the sketch's own
  numbers. Recorded in `record.json`. Not S-135's render-vs-concept gate metric (parallel-roots
  discipline) — a record-scoped diagnostic.
- **--repro/--offline**: fully deterministic re-derivation (no model anywhere on this path, no GL,
  no writes): recompute measured program + seed + artifact + ratios from committed inputs,
  byte-compare each, exit-coded; missing committed records → skip (recognize.mjs precedent).
  `--offline` = `--repro` (there is no ledger/reply layer here; both flags accepted per AC).

npm scripts: `measured:cottage`, `measured:barn`, `measured:repro`, `measured:offline`
(node invoked directly — the flag-swallowing lesson).

## What was rejected, and residual risks

- Rendering the *before* artifacts afresh: unnecessary — recognition/workshop views are already
  committed evidence; we render only the measured seed.
- Proportionally rescaling opening sills/sizes to the taller walls: out of scope (openings are not
  in the ticket's dimensional list); the cottage's openings will crowd the lower wall — recorded
  as a known limitation for S-136's levers.
- Risk: cottage at 4 storeys × 5 changes the ground-course line (y 0..4) and jetty line (y 5) —
  acceptable; the stone-ground/timber-upper identity is preserved, proportions change as intended.
- Risk: rustic pitch cannot move (single class) — the ticket's pitch deliverable for rustic is the
  honest residual record; massing is the visible change. Named in review.
