# T-145-01 Research — facade-grammar-recognition

Descriptive map of the Stage-3 recognition path, the building-program contract, the multimodal
seam, the GLB render reality, and the conformance/pack-vocabulary machinery this ticket extends.
Sources are cited as `file:line`. No solutions here.

## 1. What the ticket asks (restated from the AC)

- A **facade-grammar extension** to the building program, schema-validated against the style pack:
  per-face rhythm (pilaster/stud spacing as period+phase or count), panel fields, quoins (corner
  runs), course lines (y-rows), eave overhang + per-storey jetty depth, openings on a rhythm. The
  pack sanctions admissible idioms/materials; **no per-building constants**.
- A **multimodal recognition step** (typed function on the subscription shim) reading concept +
  textured-GLB multi-angle renders at the gate azimuths, writing the grammar. Each face records its
  **evidence source** (concept vs textured-GLB); GLB rows tagged *spatial-layout evidence*. A
  conformance check proves **no material decision is sourced from the GLB** (material identity stays
  diegetic — the 2026-06-14 ratified narrowing).
- **Textured-GLB multi-angle renders** produced/reused at the gate azimuths; render seam recorded.
- **Honest fallback**: GLB-unreliable → front concept carries the grammar, back/sides idealised from
  the pack — a *named record state*, not a silent default.
- Tests: schema fixtures; a recognition fixture (recorded reply → parsed grammar) that replays
  byte-identically offline; reply-policy (T-114) on malformed; `npm test` green; `--repro`/`--offline`
  byte-identical; no per-building constants.

## 2. The recognition stage today (Stage 3)

**Producer (pure):** `src/recognition/prompt.mjs`.
- `packDigest(pack)` (`prompt.mjs:60`) renders palette roles + diegetic rationales, available roof
  idioms, wall-surface *passes* (treatments), and proportion bounds as prose.
- `sketchDigest(sketch)` (`prompt.mjs:39`) renders the measured form-sketch (footprint polygon,
  pitch class, eave fraction, storey candidates, symmetry).
- `recognitionRenderArgs({pack, sketch, schemaJson})` (`prompt.mjs:90`) → the BAML function inputs
  `{pack_digest, sketch_digest, schema_json}`.
- `parseProgramReply(text, {pack})` (`prompt.mjs:105`) is the `runReplyPolicy` `parse`: strip →
  `assertBuildingProgram` (AJV) → `validateProgramAgainstPack`. Any violation throws → reply is
  MALFORMED → SAME prompt re-asked (no corrective addendum — instrument byte-identity).

**Contract + semantic gate:** `src/recognition/program.mjs`.
- `parseBuildingProgram` / `assertBuildingProgram` (`program.mjs:63,78`): AJV2020 strict against
  `schema/building-program.schema.json`.
- `validateProgramAgainstPack(program, pack, {registry})` (`program.mjs:156`): roles ∈ palette,
  roof idiom ∈ `ROOF_LAYOUTS ∩ pack.idioms ∩ registry constructs`, pitchClass ∈ pack, storeyHeight
  in band, jetty needs storeys ≥ 2, treatment is a pack PASS, openings fit per-lane at min-spacing
  (`openingLanes`, `program.mjs:102`), dormers fit, masses single-component. **Every finding is a
  hard error** (the re-ask loop needs a verdict, not a warning).

**Compile + realize:** `src/recognition/compile.mjs` (`compileProgram`) → `src/workshop/program.mjs`
(`realizeProgram`, `program.mjs:180`) → schema-valid design artifact, **byte-identical** by
construction (E-31 Rule 5). Programs speak ROLES, never blocks; compiler resolves role → block, so
`palette-in-pack` cannot fail.

## 3. The building-program schema — what facade fields already exist

`schema/building-program.schema.json` (`additionalProperties:false` throughout). Per mass it already
carries **partial** facade structure:
- `walls.treatment` (a pack PASS idiom, recorded), `walls.ground/upper` roles, `walls.dressing`
  (quoins/jambs/heads role — *role only, no geometry*) (`schema:67-96`).
- `plinth {courses, role}` (`:98`), `jetty {walls[], beamRole, joistRole}` — **walls but no depth**
  (`:107`).
- `roof {idiom, ridgeAxis, pitchClass, fieldRole, trimRole, gableRole, dormers}` (`:118`).
- `openings[] {wall, kind, count, w, h, sill, head, headRole}` — **count exists, but no period/phase
  rhythm, and the faces the concept never shows are unaddressed** (`:156`).

**Absent (this ticket's gap):** per-face rhythm as period+phase, panel **fields** (infill regions
between frame members), **quoin corner-run** geometry (only a dressing role today), **course lines**
(y-rows), **eave overhang depth** + per-storey **jetty depth**, openings **on a rhythm** (phase),
and a **per-face evidence source**. Prior observation 15928: the schema's `additionalProperties:false`
means source-tracking cannot be bolted onto v1 without a schema change — any addition is a deliberate,
additive edit.

## 4. The multimodal model seam

- Transport: `src/sdk-binding.mjs` — `requestTextWithImage`/`requestDesignArtifactWithImage`
  (`:351`), `toImageBlock` (`:139`), `buildImageTurn` (`:172`) over `claude -p --input-format
  stream-json`. The runner owns the live call; pure modules never import transport.
- Tier: `src/model-tier.mjs` `resolveTier`/`runTieredOp`; `src/config.mjs` `MODEL_TIERS = {light:
  haiku-4-5, strong: opus-4-8}` (`config.mjs:34`), `DEFAULT_TIER="strong"`.
- BAML bridge: `src/baml/bridge.mjs` `bamlRender({fn,args,images})` / `bamlParse({fn,text})` spawn
  `tsx src/baml/bridge.mts`; **transport never happens in the bridge** — the caller takes the rendered
  `{prompt, images}` to the shim. Existing functions include `RecognizeBuildingProgram`.
- Reply policy (T-114): `src/form/judge-reply.mjs` `runReplyPolicy(ask, {parse, maxAttempts})`
  (`:100`), `MAX_REPLY_ATTEMPTS=3` (`:27`); `nextAction` returns `final|refuse|ask` — **no re-roll by
  construction**. `src/baml/reply-policy.mjs` is the async variant. Malformed ≠ verdict.

**Live recognition runner (reference pattern):** `benchmarks/sculpture/recognize.mjs`.
- `runLive` (`:114`): loads pack + sketch + concept PNG + sketch-sheet PNG, `bamlRender(fn:
  "RecognizeBuildingProgram")`, `requestTextWithImage` STRONG tier, `runReplyPolicy(parse:
  parseProgramReply)`, then compile→realize→conformance→**render evidence at the 4 gate azimuths**
  (`renderEvidence`, `:64`, via `src/view/multi-angle.mjs renderViews`), pin-guarded writes
  (`guardedWriteRecord`/`preflightPins`), records the full raw replies + the T-114 ledger.
- `runOffline` (`:219`): committed program → compile → realize → **byte-compare against committed
  artifact** + re-run conformance. No model, no writes. This is the `--offline` replay contract.

## 5. The GLB render reality (the load-bearing constraint)

- GLBs on disk: `benchmarks/sculpture/glb/{cottage,barn,church,…}.glb` (11 files). `cottage.glb`,
  `barn.glb`, `church.glb` are the E-35 subjects ([[trellis-glb-path-works]]).
- TRELLIS client: `benchmarks/sculpture/trellis-glb.mjs` `generateGlb(pngBytes)` → POST to
  `MODAL_ENDPOINT_URL` (gitignored `.env`); URL never printed; pre-spend `registration-smoke.json`
  gate. CLI does network I/O → needs `dangerouslyDisableSandbox: true`.
- **There is NO textured-GLB → PNG renderer.** Stated explicitly in `src/view/glb-splat.mjs:4-6`:
  "The repo has NO textured-GLB→PNG renderer (the GLB is only silhouette-rasterized or
  voxel-colour-sampled)." The GLB is consumed two ways:
  - silhouette rasterization (`src/form/glb-silhouette.mjs`, `glb-mesh.mjs` → triangles);
  - **voxel-colour sampling** (`glb-splat.mjs glbVoxelOccupancy({occupancy, surface, texture,
    palette})` `:29` → `sampleSurfaceColors` + `colorVoxelsToArtifact` → an Occupancy/artifact),
    the "splat method anticipated in E-23" the philosophy narrowing names.
- The voxel renderer that DOES exist: `src/view/multi-angle.mjs` `renderViews(artifact, angles,
  opts)` (`:77`) renders a design artifact to PNG at named angles. Gate azimuths are
  `VIEW_ANGLES.diag` = `+x+z/+x-z/-x-z/-x+z` at 45/135/225/315°, `DIAG_ELEV` (`:31`), pinned in
  `config.mjs MULTI_ANGLE_GATE.azimuths` (`config.mjs:60`). So a *textured-GLB multi-angle render at
  the gate azimuths* is reachable only by voxelizing+colour-sampling the GLB into an artifact and
  feeding `renderViews` — there is no mesh-PBR path.

## 6. Conformance / pack-vocabulary enforcement

- `src/pack/conformance.mjs`: `REGULARITY_CHECK_NAMES` (courses-even, symmetry-held,
  openings-rhythm, palette-in-pack, watertight, single-component) + optional `proportion-vs-concept`;
  `runConformance({occ, declarations}, pack)` runs pack-listed checks. `openingsRhythmCheck`
  enforces edge-to-edge spacing in `[minSpacing,maxSpacing]`; `paletteInPackCheck` is the
  foreign-block detector (allowed = palette ∪ decoration).
- Pack vocabulary authority: one composition point ([[vocabulary-authority-one-composition-point]]).
  `packVocabulary(pack)` (`src/workshop/actions.mjs:34`) = Set(palette ∪ decoration) bare blocks.
- Style-pack schema `schema/style-pack.schema.json`: `idioms[]` (registry names + param defaults),
  `palette[]` (role→block, diegetic provenance), `proportions {storeyHeight, pitchClasses,
  openingRhythm}`, `decoration[]`, `conformance.checks[]`. `additionalProperties:false` at top — an
  additive pack field (e.g. articulation bounds) is a deliberate schema edit.

## 7. Recorded-reply fixture pattern (for the offline replay test)

BAML fixtures live at `src/baml/fixtures/{critique,vernacular,decompose}/` each as
`{inputs.json, prompt.txt, reply.txt, expected.json, ledger.json}`; `src/baml/fixtures.test.mjs`
replays them (render → prompt sha pin; parse `reply.txt` → `expected.json`). The recognition
`--offline` path (`recognize.mjs runOffline`) is the *artifact* replay; a *reply→grammar* fixture
(this ticket's AC) follows the BAML-fixture shape: a committed raw reply parsed by the seam's `parse`
must yield the committed grammar byte-identically, offline, no model.

## 8. Constraints & assumptions surfaced

- **Additive only.** Existing committed programs/artifacts must stay valid and `--repro`
  byte-identical ([[challenge-repro-drift-preexisting]], [[shared-file-commit-sweep]]) → any new
  schema field is OPTIONAL; absence is the legacy state.
- **No per-building constants** (E-25 Rule 3 self-grep in runners; numbers recognised or pack-carried).
- **Material identity stays diegetic** — the GLB render may inform *layout*, never a material slot;
  a conformance check must be able to *prove* this from the record (evidence tags).
- **Textured render = voxel-colour proxy**, not mesh PBR — the honest caveat the ticket and
  philosophy already name (layout evidence, not relief depth). [[trellis-facet-normals-lie]]:
  stair-stepped meshes mislead normal-vote roof reads — read smoothed top profiles, not facets.
- **Pin-guard discipline** ([[pin-guard-is-structural]]): record writers preflight + guard; rotation
  needs an explicit flag in the owning ticket.
- **Reply-policy seam** ([[judge-reply-policy-seam]], [[same-prompt-seam-handle-dont-reject]]):
  malformed ≠ verdict; bounded same-prompt re-asks; never copy the artifact-retry prompt mutation.
