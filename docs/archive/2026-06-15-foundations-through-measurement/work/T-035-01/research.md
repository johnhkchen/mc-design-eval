# T-035-01 — Research

vConcept **sculpture mode**: term → finalized design doc → 3/4 concept image → freestanding
3-D `DesignArtifact` → 3/4 still + rock turntable. Descriptive map of what exists and where.

## The proven pipeline this reuses (E-09 facade lineage)

The facade work already wires every stage this ticket needs — only the *subject framing* is
facade-specific. The orchestration lives in `benchmarks/temple-facade/run.mjs` (a dispatch table
`APPROACHES[name](task, ctx)`), NOT in `src/`. Each approach composes plain-JS prompt strings,
drives the metered seam, renders, judges, and writes a `runs/<NNN-approach>/` dir + README gallery.

Stage ladder, with the exact reusable seam for each:

1. **Design doc (text).** `composeDesignDocPrompt(task)` / `composeReferenceDesignDocPrompt(task)`
   (run.mjs:141, :369) → `requestText` / `requestTextWithImage` (sdk-binding). Plain markdown out,
   written to `design-doc.md`. Palette discipline is *prompted*, not code-enforced, in the doc
   stage (color-theory section, "map each to a concrete Minecraft block").
2. **Concept image (E-09, separate from run.mjs approaches).** `benchmarks/temple-facade/baml-concept.mts`
   (tsx shell-out): `b.request.FacadeConceptPrompt(designDoc, targetBlocks, attached)` renders the
   prompt TEXT (b.parse never called for images), extracts message text, then
   `generateImage({prompt, images, model})` → Nano Banana (Gemini) → PNG. The BAML fn is
   `baml_src/conceptart.baml:7`; its prompt is hard-coded to "Minecraft TEMPLE FACADE: a head-on
   FRONT ELEVATION". **No run.mjs approach currently chains the concept image into the build** — the
   facade approaches go doc→build directly. This ticket is the first to wire concept→build.
3. **3-D build (multimodal, grounded on an image).** `requestDesignArtifactWithImage({prompt, images,
   model, effort, system, onMessage})` (sdk-binding.mjs:351) — `claude -p` stream-json, schema-
   enforced via `withSchemaInstruction`, returns `{artifact, raw}` already schema-validated. The
   facade build prompts (`composeHighResBuildPrompt` run.mjs:263, `BuildTempleFacade` BAML
   facade.baml:54) are saturated with facade assumptions: "Orientation: the facade FACES +Z … relief
   recedes into −Z … Model only the front and its relief", "A FACADE IS ONE CONNECTED PLANE". These
   must NOT carry into sculpture mode.
4. **Render.** `renderArtifact(artifact, {outPath, view, strict})` (render/src/render-tool.mjs:48) is
   the one artifact→PNG seam; `view` is a partial over `DEFAULT_VIEW` (camera.mjs:20 — azimuth 45,
   elevation 35, fov 75, margin 1.18). The facade benchmark forces a head-on still via
   `TEMPLE_FACADE_TASK.view = {azimuthDeg:0, elevationDeg:0, fov:40}` (task.mjs:22).

## Render / turntable rig (render/, NOT src/render/)

- `renderArtifact(artifact, opts)` — fresh world every call (stateless), so N frames = N calls.
- `renderOrbit(artifact, opts)` (render/src/orbit.mjs:126) — N-frame sweep; `view.azimuthDeg` is set
  per frame, everything else fixed (bounding-SPHERE fit ⇒ rotation-independent). Accepts an explicit
  `opts.azimuths` array to drive any path; writes `frame.NNN.png` (zero-padded, lexical==sweep order)
  under `defaultOrbitDir(trial_id)` = gitignored `render/out/orbit/<id>/`.
- `orbitAzimuths(frames, {startDeg})` — even 360° spin. `oscillateAzimuths(frames, {centerDeg,
  amplitudeDeg})` (orbit.mjs:56) — seamless sine-eased front-arc ping-pong (the "rock"); both are
  PURE and already unit-tested in render/test/orbit.test.mjs.
- `orbit-cli.mjs` — CLI wrapper (`npm run render:orbit`, flags `--oscillate --amplitude --center
  --frames --elevation --fov --mp4/--gif`). Loads `artifact.json` from a path/dir.
- A 3/4 still is just `renderArtifact` with `{azimuthDeg:45, elevationDeg:~30}`; the rock turntable is
  `renderOrbit` with `azimuths = oscillateAzimuths(frames,{centerDeg:45,amplitudeDeg:~40})`. No new
  camera math is needed — the rig is already artifact-general (orbit.mjs header: "No facade/temple
  specifics live here").

## Existing src/ archetype pattern (the unit-test convention to match)

`src/single-shot.mjs` and `src/iterative-multimodal.mjs` are the template: a frozen **descriptor**
(`{id, version, label}`, id single-sourced from `src/config.mjs`), **PURE prompt builders** +
**spec validation** + **adherence gates**, then ONE thin live runner (`runIterativeTrial`) that is
explicitly NOT unit-tested (live/metered + GL). The pure surface is exercised by `src/*.test.mjs`,
which `npm test` globs (`node --test "src/**/*.test.mjs"`). Helpers worth reusing:
`assertInPalette` / `assertAttribution` (palette + method-id gates), `formatPaletteBlocks`,
`loadPalette` (palette.mjs), metadata-pin helpers. `config.mjs` holds `PHASE1_MODEL_ID =
"claude-opus-4-8"` and the method-id constants — a sculpture method-id belongs here.

## Artifact contract

`schema/design-artifact.schema.json` (AJV 2020-12, `discriminator:true`) is the single source;
`src/artifact.mjs` (`parseArtifact`, `compileValidator`) validates. Placement union: `voxel`(pos),
`line`(from/to, axis-aligned or equal-delta diagonal only), `box`(hollow), `fill`(solid). Metadata:
`trial_id`, `prompting_method_id`, `model_id`, `seed`, `server_state_id`, optional `target`,
`created_at`. The schema is geometry-agnostic — a freestanding 3-D object validates exactly like a
facade; nothing in the schema assumes +Z/relief. (Memory: the *build-prompt* schema description is
looser than the live AJV gate — conform to the live schema or renders fail.)

## BAML mechanics

`baml_src/*.baml` + generated `baml_client/` (checked in). `baml-cli 0.222.0` is installed and runs
(`npm run baml:gen` regenerates from `baml_src`). Concept/build prompts use `ClaudeStub` (never
called — `b.request.*` renders the prompt, harness pipes it through `claude -p`, `b.parse.*` SAP-
parses). Adding a `SculptureConceptPrompt` fn = edit `conceptart.baml` + regenerate + new tsx runner.

## Constraints, assumptions, prerequisites (verified this session)

- `GL_AVAILABLE === true`; `GEMINI_API_KEY` present in `.env`; `npm test` = **302 pass** baseline.
- Live smoke (AC #1) is metered (`claude -p`) + Gemini + GL — it cannot run under `npm test`; it is a
  manual run, exactly like `bench:temple-facade`.
- "Reuse, don't fork": the design-doc/build prompts in the facade benchmark are inline plain JS;
  sculpture's must be object-oriented, and the ticket requires the new pure logic (scale wiring) to be
  unit-tested — so the pure builders should live in `src/` where the test glob reaches them.
- The single-view limitation (back/sides imagined from one 3/4 view) is a *known* property to
  document, not a defect to fix — it is the standing case for image→3D (TRELLIS) deferred to E-13.
- E-13 downstream (T-036-*/T-037-*) consume this as `--subject "<term>" --scale <N>`; the entry point
  must take those two params and be subject-agnostic.
