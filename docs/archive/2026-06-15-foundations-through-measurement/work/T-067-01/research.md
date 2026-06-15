# T-067-01 — Research: full-building archetype

Epic **E-20** breaks Phase-1's *facade-only* limit. Text→JSON can hand-narrate a front elevation but
can't hand-place a whole building (it overflows / narrates). The matured **GLB→voxel + surgical**
pipeline now places the bulk automatically from a real 3-D mesh. This ticket is the foundation: a new
**building** `vConcept` mode (design-doc + concept prompt) and its **TRELLIS GLB**, single subject /
single 3/4 view.

Descriptive only — what exists, where, how it connects, and the constraints the design must respect.

## The vConcept mode pattern (the thing to mirror)

`src/sculpture.mjs` is the canonical, PURE mode surface (E-13). It is SDK- and GL-free so the test glob
`src/**/*.test.mjs` exercises every line without billing a model or loading GL. Its shape:

- A frozen descriptor `VCONCEPT_SCULPTURE` whose `id` is single-sourced from `src/config.mjs`
  (`VCONCEPT_SCULPTURE_METHOD_ID = "vconcept-sculpture.v1"`). A `.v2` sibling exists that *shares the
  build prompt* and differs only by a post-build engine step — the precedent for versioning.
- Scale constants `SCALE_MIN=8 / SCALE_MAX=64 / DEFAULT_SCALE=32` and `assertSculptureSpec(spec)` which
  validates `{subject, scale}` BEFORE any metered work (throws `sculpture:` prefixed).
- `sculptureScaleCaps(scale) → {maxW,maxH,maxD}` — PURE per-axis caps (cubic: every axis = scale). This
  is the "scale wiring" the AC asks to unit-test.
- `runIdForSubject(seq, subject)` → `NNN-vConcept-<slug>` (filesystem-safe, lexically sortable).
- `sculptureMetadata({runId, model})` and `metadataPinLines(meta)` — the attribution pins. **Key
  constraint:** `metadata.target` is DELIBERATELY never set — in the live AJV schema it is an enum
  (`house|path|landscape`); a sculpture is none, so setting it FAILS the gate. The per-subject join key
  is the run id (embeds the slug) + `summary.json`. (See `[[prompt-vs-live-artifact-schema]]`.)
- Two PURE prompt builders: `composeSculptureDesignDocPrompt({subject,scale})` (Stage-1 imagined design
  doc, markdown, no reference photo) and `composeSculptureBuildPrompt({subject,scale,designDoc,runId,
  model})` (Stage-3 build prompt, grounded on the attached concept image). Both INVERT every facade
  assumption (in the round, full x/y/z, no front elevation / relief) and both state the **single-view
  limitation** to the model (the back/far side are the model's reconstruction from one 3/4 view).

`src/sculpture.test.mjs` (144 lines) is the unit-test pattern: a `FACADE_TOKENS` list that must NOT leak
into the prompts, plus assertions that subject/scale flow through, the run-id/metadata pins are correct,
`target` is never set, and the single-view limitation is documented.

## The concept prompt (BAML) and its transport

`baml_src/conceptart.baml` holds the versioned concept-art TEXT prompts. Three functions today:
`FacadeConceptPrompt` (head-on front elevation), `SculptureConceptPrompt` (3/4 freestanding object),
`SculptureConceptPromptV2` (palette-aware). Each is kept SEPARATE so older prompts stay frozen / runs
stay reproducible. All share the transport: BAML renders only the TEXT via `b.request.<Fn>(...)`;
`b.parse` is never called (image output isn't a BAML parse target). The composed text is extracted and
handed to **Nano Banana** (Gemini) which generates the image.

`baml_client/` is the GENERATED TypeScript client (checked in). Adding a BAML function requires
regenerating: `npm run baml:gen` (`baml-cli generate --from baml_src`); **baml-cli 0.222.0 is installed
and works.** `b.request.<NewFn>` is only available after regen.

`benchmarks/sculpture/baml-concept.mts` is the tsx shim run as a child process: reads a JSON job on
stdin `{designDocPath, images, targetBlocks, model, outPath, variant, paletteSwatches}`, selects the
BAML fn by `variant` (`v1`→`SculptureConceptPrompt`, `v2`→`SculptureConceptPromptV2`), extracts the
prompt text, calls `generateImage` (`src/nano-banana.mjs`, models `NANO_BANANA_PRO =
"gemini-3-pro-image-preview"` / `_FLASH`), writes the PNG to `outPath`, prints a result record.

## The benchmark runner (live / metered / GL)

`benchmarks/sculpture/run.mjs` is the one live seam: parses `--subject/--scale/--frames/--note/--model/
--effort/--value-match`, validates the spec, picks `nextSeq()` from `runs/`, builds `runId`, then runs
the three stages — design doc (`requestText`), concept image (`runBamlConcept` child), 3-D build
(`requestDesignArtifactWithImage`, schema-enforced). It renders a 3/4 hero still (`SCULPTURE_VIEW_3Q`)
and a front-arc rock turntable (`oscillateAzimuths` over the front hemisphere), writes
`artifact.json/summary.json/transcript.jsonl`, and regenerates the README gallery from `summary.json`s.
Wording lives in `src/sculpture.mjs`; this file is I/O + live seam + render + provenance only.

`package.json` script: `bench:sculpture → node benchmarks/sculpture/run.mjs`. Tests:
`test:unit = node --test "src/**/*.test.mjs"` — so any new unit test MUST live under `src/`.

## TRELLIS GLB provisioning + the GLB manifest

`benchmarks/sculpture/trellis-glb.mjs`: `generateGlb(pngBytes, opts) → GLB bytes` POSTs
`{image(b64), decimation_target=150000, texture_size=1024, seed=42}` to `MODAL_ENDPOINT_URL` (read from
the gitignored `.env`; **never printed**). `inspectGlb(buf)` validates only the 12-byte header
(magic/version/length). CLI: `node trellis-glb.mjs <in.png> <out.glb>` (warns cold start can take a few
minutes). **Known thin-subject failure mode**: the sword fails TRELLIS with HTTP 500 (3 attempts) — an
elongated/thin form. A building is *bulky-angular*, the favorable class, but this must be verified
honestly (see `[[image-to-3d-thin-subject-limit]]`).

`benchmarks/sculpture/glb/README.md` is the durable GLB manifest (the `.glb` binaries are gitignored,
~5 MB each). It tabulates `file | subject | source concept | verts | tris | size`, notes "valid binary
glTF v2, 1 mesh / 1 primitive, 2 textures, 1 material," and documents the sword exclusion as a finding.
7 subject GLBs exist on disk. This is THE canonical GLB store that downstream E-20 stories (S-068
high-res voxel build) consume.

## Geometry validation + single-mass check (already available)

`src/form/glb-mesh.mjs` is the shared, PURE, dependency-free glTF parser:
- `parseGlbMesh(glb) → {positions:Float64Array (9/tri), triangleCount, bounds:{min,max}}` — world-space
  triangle soup; node transforms + indices already applied. `triangleCount` gives the tri count; vertex
  count comes from the POSITION accessor. Throws `GlbParseError` on malformed input.
- `parseGlbColoredSurface(glb)` — per-vertex positions/UVs + baseColor texture bytes (handles TRELLIS's
  WebP-under-`EXT_texture_webp` textures). Used by the GLB-voxel color stage.

For the **single-mass check** (AC #4): `src/form/glb-voxelize.mjs` `voxelizeGlb(glb,{scale})` →
occupancy, and `src/form/voxel-components.mjs` (just added in T-062-01) / `src/form/glb-thin.mjs`
`connectedComponents(occupancy,{connectivity}) → {count, sizes[]}` count connected components. ≈1
principal component (modulo legitimately separate parts) confirms a single building, not the moai's
duplicate-mass mess. (See `[[moai-glb-3-components]]` lesson via the contact-sheet hallucination.)

## The single-subject / single-view hard constraint (the load-bearing lesson)

The moai's duplicate-mass / hallucinated-connector failure came from feeding TRELLIS a **multi-view
contact sheet** — it reconstructed multiple statues bridged by bars. A *building* contact sheet would be
worse: multiple buildings + invented connectors. The concept MUST be **ONE complete building in ONE 3/4
view** — a hard, explicit constraint in the concept prompt (no turnaround, no contact sheet, no
elevation grid). This is the single most important new clause distinguishing the building prompt from
the sculpture one, and it is the most testable.

## Constraints & assumptions for the design phase

- New unit tests must live under `src/` (test glob). Pure prompt/mode logic only — no GL/SDK in tests.
- `metadata.target` must remain unset (AJV enum). Building is not `house|path|landscape` in that enum
  sense usable here; carry identity via run id + summary, exactly like sculpture.
- Adding a BAML fn requires `npm run baml:gen` and committing the regenerated `baml_client/` delta.
- Sculpture reproducibility: do not mutate the sculpture prompts or the default runner path. A building
  runner integration must leave `--mode sculpture` (default) byte-identical.
- Live steps (concept image, TRELLIS GLB) need `.env` sourced (`GEMINI_API_KEY`, `MODAL_ENDPOINT_URL`
  are present in `.env` but not in the ambient process env). They are metered + network-dependent.
- A building is geometrically NOT cubic (footprint vs height), but the sculpture's cubic
  longest-edge cap is a safe, testable starting envelope; the prompt names the longest dimension.
