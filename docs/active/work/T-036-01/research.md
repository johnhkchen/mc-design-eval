# T-036-01 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story S-036. A **build ticket**: run the existing `vConcept` sculpture pipeline on
**"a dancing man"** at **scale 32**, save all artifacts, and record a **fidelity-vs-concept** read
plus a categorical judgment. It does **not** add or change pipeline code — that was T-035-01
(`status: done`). This ticket is one of eight sibling per-subject builds (T-036-01..08) that all
depend on T-035-01 and exercise breadth of the same archetype.

Form note from the ticket: an **articulated figure** (pose, limbs) is the *hard* case for blocky
voxels — expect a stiff but recognizable figure. This is deliberately a stress case for the figure
form type, sitting at the smooth/articulated end of the fidelity frontier the README names.

## The pipeline (already built, T-035-01)

Two layers, cleanly split:

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"` (single-sourced from
  `src/config.mjs:46`, `VCONCEPT_SCULPTURE_METHOD_ID`).
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. `assertSculptureSpec` validates the
  `{subject, scale}` pair *before any metered work* (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` all `=scale` (a sculpture is bounded ~cubically
  by its longest edge). This is the "scale wiring" the AC asks be unit-tested.
- Framing constants: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (the hero still) and
  `TURNTABLE = {centerDeg 45, amplitudeDeg 40, frames 24, el 30, fov 45}` — a *front-arc rock*, never
  parading the imagined back.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. For this ticket the slug is
  `a-dancing-man`; `nextSeq()` will assign `002` (moai used `001`).
- `sculptureMetadata` / `metadataPinLines` — pins `trial_id`, `prompting_method_id`, `model_id`,
  `seed=17`, `server_state_id`. **`metadata.target` is deliberately omitted**: in the live AJV
  schema `target` is an enum `house|path|landscape`, so a subject term there fails the gate. The
  per-subject join key is `trial_id` (run id embeds the slug) + `summary.json`. (See memory:
  *prompt-vs-live-artifact-schema*.)
- Two prompt builders: `composeSculptureDesignDocPrompt({subject, scale})` (stage 1, imagined doc,
  no photo) and `composeSculptureBuildPrompt({subject, scale, designDoc, runId, model})` (stage 3,
  the 3-D build — explicitly "in the round, NOT a facade/relief/front plane", states the single-view
  limitation to the model).

### Live runner — `benchmarks/sculpture/run.mjs` (metered + GL; NOT in `npm test`)
Entry: `npm run bench:sculpture -- --subject "<term>" --scale <N> [--frames N] [--note "..."]`.
`runVConcept` chains three model stages and writes everything under `runs/<runId>/`:
1. **Stage 1 design doc** — `composeSculptureDesignDocPrompt` → `requestText` (claude `-p` shim,
   `src/sdk-binding.mjs`). Writes `design-doc.prompt.txt` + `design-doc.md`.
2. **Stage 2 concept image** — shells out to `benchmarks/sculpture/baml-concept.mts` (tsx), which
   renders the BAML `SculptureConceptPrompt` (`baml_src/conceptart.baml:60`, separate from the frozen
   `FacadeConceptPrompt`) to text and pipes it to **Nano Banana** (Gemini `pro`, `src/nano-banana.mjs`).
   One 3/4 concept on solid black → `concept.png`.
3. **Stage 3 3-D build** — `composeSculptureBuildPrompt` → `requestDesignArtifactWithImage`
   (multimodal seam, schema-enforced via AJV). Grounded on the single `concept.png`. → `artifact.json`.

Then render: `renderArtifact` (3/4 hero still → `render-3q.png`, `SCULPTURE_VIEW_3Q`) and a rock
turntable via `oscillateAzimuths` + `renderOrbit` (`render/src/orbit.mjs`) → `turntable/frame.NNN.png`.
Finally writes `transcript.jsonl`, `summary.json`, and regenerates the README gallery table.

## Boundaries & constraints

- **Live & metered.** Needs the `claude -p` subscription shim (`/Users/johnchen/.local/bin/claude`,
  present), `GEMINI_API_KEY` (read by `src/nano-banana.mjs` from `process.env` or the gitignored
  `.env`, which is present), and headless GL (`render/`). It cannot run under `npm test`.
- **`baml_client/` is generated and present** — the concept stage imports it; no `baml:gen` needed
  this session.
- **Single-view limitation** (a property, not a bug): the build sees exactly ONE 3/4 view; back/far
  sides are the model's reconstruction. The rock turntable hides the imagined back by design.
- **Schema gate.** The build artifact must pass the live AJV schema or stage 3 throws. The moai smoke
  produced 0 unmapped blocks; block IDs come from `minecraft-data`.

## Reference run (the only prior data point)

`runs/001-vConcept-moai/` (scale 32): doc 2109 ch → concept (Gemini pro, 21s) → 35-op build = 3414
blocks, 0 unmapped, schema-valid, bounds `[-6,0,-5]..[6,31,7]` (y reaches 31 for scale 32). Cost
$0.66, 20578/18096 tok, ~500s wall. The moai (angular/monolithic) is text-JSON's *best* case; this
ticket's dancing man is near the *opposite* (articulated figure) end of the predicted frontier.

## Relevant memories

- *prompt-vs-live-artifact-schema* — the build-prompt schema is looser than the live AJV gate;
  hence `metadata.target` is omitted and renders depend on conforming to the live schema.
- *facade-recess-by-exclusion*, *voxel-onion-dome-and-bay-framing* — facade-era craft notes; less
  directly relevant to a freestanding figure but inform "design bold at block scale".

## Open questions for Design

- A human figure mid-dance has thin limbs and a dynamic pose — both at risk of voxel breakup and of
  the single-view back-reconstruction looking incoherent. Does the default scale 32 give enough
  blocks for limbs to read, or does the figure need the connectedness guidance the build prompt
  already carries to avoid detached parts?
- What exactly is the "fidelity-vs-concept read" artifact, and where does it live so curation
  (T-038-01) can join it?
