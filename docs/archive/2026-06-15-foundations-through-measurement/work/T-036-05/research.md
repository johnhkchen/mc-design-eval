# T-036-05 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story S-036. A **build ticket**: run the existing `vConcept` sculpture pipeline on
**"an anatomically correct human heart"** at **scale 32**, save all artifacts, and record a
**fidelity-vs-concept** read plus a categorical judgment. It adds or changes **no pipeline code** —
that was T-035-01 (`status: done`). This is one of eight sibling per-subject builds (T-036-01..08)
that all `depends_on: [T-035-01]` and exercise breadth of the same archetype across form types.

Form note from the ticket: **organic anatomy** (chambers, great vessels) — smooth, lobed,
asymmetric. The ticket itself flags this as **a hard organic-curve case, large gap expected**. On the
fidelity frontier the README frames (angular/monolithic = text-JSON's *best* case; smooth/organic =
*worst*), this subject sits at or near the **worst** end — the deliberate hard counterpoint to the
moai (T-036-02). The dancing man (T-036-01) was the figure stress case; the heart is the *curved
organic mass* stress case: no straight edges, no symmetry plane to lean on, lobed chambers and tubular
vessels that voxelize into stair-stepped blobs.

## The pipeline (already built, T-035-01)

Two layers, cleanly split:

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"` (single-sourced from
  `src/config.mjs`, `VCONCEPT_SCULPTURE_METHOD_ID`).
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. `assertSculptureSpec` validates the
  `{subject, scale}` pair *before any metered work* (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` all `=scale` (a sculpture is bounded ~cubically
  by its longest edge). This is the "scale wiring" the AC asks be unit-tested.
- Framing constants: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (the hero still) and
  `TURNTABLE = {centerDeg 45, amplitudeDeg 40, frames 24, el 30, fov 45}` — a *front-arc rock*, never
  parading the imagined back.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. For this ticket the slug is
  `an-anatomically-correct-human-heart`; `nextSeq()` will assign `006` (runs 001–005 already exist).
- `sculptureMetadata` / `metadataPinLines` — pins `trial_id`, `prompting_method_id`, `model_id`,
  `seed=17`, `server_state_id`. **`metadata.target` is deliberately omitted**: in the live AJV schema
  `target` is an enum `house|path|landscape`, so a subject term there fails the gate. The per-subject
  join key is `trial_id` (run id embeds the slug) + `summary.json`. (Memory:
  *prompt-vs-live-artifact-schema*.)
- Two prompt builders: `composeSculptureDesignDocPrompt({subject, scale})` (stage 1, imagined doc,
  no photo) and `composeSculptureBuildPrompt({subject, scale, designDoc, runId, model})` (stage 3,
  the 3-D build — explicitly "in the round, NOT a facade/relief/front plane", states the single-view
  limitation to the model, asks for a SOLID connected object).

### Live runner — `benchmarks/sculpture/run.mjs` (metered + GL; NOT in `npm test`)
Entry: `npm run bench:sculpture -- --subject "<term>" --scale <N> [--frames N] [--note "..."]`.
`runVConcept` chains three model stages and writes everything under `runs/<runId>/`:
1. **Stage 1 design doc** — `composeSculptureDesignDocPrompt` → `requestText` (claude `-p` shim,
   `src/sdk-binding.mjs`). Writes `design-doc.prompt.txt` + `design-doc.md`.
2. **Stage 2 concept image** — shells out to `benchmarks/sculpture/baml-concept.mts` (tsx), which
   renders the BAML `SculptureConceptPrompt` (`baml_src/conceptart.baml`, separate from the frozen
   `FacadeConceptPrompt`) to text and pipes it to **Nano Banana** (Gemini `pro`,
   `src/nano-banana.mjs`). One 3/4 concept on solid black → `concept.png`.
3. **Stage 3 3-D build** — `composeSculptureBuildPrompt` → `requestDesignArtifactWithImage`
   (multimodal seam, schema-enforced via AJV). Grounded on the single `concept.png` → `artifact.json`.

Then render: `renderArtifact` (3/4 hero still → `render-3q.png`, `SCULPTURE_VIEW_3Q`) and a rock
turntable via `oscillateAzimuths` + `renderOrbit` (`render/src/orbit.mjs`) → `turntable/frame.NNN.png`.
Finally writes `transcript.jsonl`, `summary.json`, and regenerates the README gallery table. Seq is
assigned by `nextSeq()` (max existing + 1); `metadata` is written exactly as the model emitted it.

## Boundaries & constraints

- **Live & metered.** Needs the `claude -p` subscription shim (`~/.local/bin/claude`, present →
  version 2.1.165), `GEMINI_API_KEY` (read by `src/nano-banana.mjs` from `process.env` or the
  gitignored `.env`, present), and headless GL (`render/`). Cannot run under `npm test`.
- **`baml_client/` is generated and present** — the concept stage imports it; no `baml:gen` needed.
- **Single-view limitation** (a property, not a bug): the build sees exactly ONE 3/4 view; back/far
  sides are the model's reconstruction. The rock turntable hides the imagined back by design. For an
  *asymmetric* organic subject like a heart this matters more than for a near-symmetric one — the back
  hemisphere is pure invention.
- **Schema gate.** The build artifact must pass the live AJV schema or stage 3 throws. Block IDs come
  from `minecraft-data`; the moai smoke produced 0 unmapped blocks.

## Reference runs (prior data points)

- `runs/001-vConcept-moai` (scale 32): 35-op build = 3414 blocks, 0 unmapped, bounds
  `[-6,0,-5]..[6,31,7]`. $0.66, ~500s. The angular/monolithic *best* case.
- `runs/002-vConcept-a-dancing-man` (scale 32): 21 ops → 1073 blocks, 0 unmapped, bounds
  `[-12,0,-4]..[7,32,2]`. $0.4945, ~181s. Judged **recognizable (strong)** but *angle-fragile* (the
  fixed 45° still under-showed the cantilevered kick; a turntable frame rescued the read).
- Runs 003 (a moai statue), 004 (a pineapple), 005 (a bow and arrow) exist from sibling tickets.

The heart is predicted to land **below** all of these on fidelity: a smooth lobed organic mass with no
edges to lock onto and an asymmetry the single-view grounding can only partly capture.

## Relevant memories

- *prompt-vs-live-artifact-schema* — the build-prompt schema is looser than the live AJV gate; hence
  `metadata.target` is omitted and renders depend on conforming to the live schema.
- *concept-image-not-color-value-preview* — Nano Banana concept previews block **hue** but not
  **value**; a named block (e.g. `red_concrete`/`red_terracotta`) can render far darker than the
  concept showed. Directly relevant: a heart's signature is its **red**, and the concept may promise a
  brighter red than the chosen block renders. Worth checking in the fidelity read.
- *reference-grounds-craft-not-color* — color comes from the brief, craft from any reference; here
  there is no external reference image, only the model's imagined concept, so palette is self-sourced.

## Open questions for Design

- A heart has **no symmetry and no straight edges**. Does scale 32 give enough blocks for the lobed
  chambers + the great vessels (aorta, pulmonary trunk, venae cavae) to read as distinct masses, or do
  they merge into one undifferentiated red blob? The build prompt's "SOLID and connected" guidance
  helps mass coherence but does nothing for *curvature* — voxels stair-step.
- Recognizability cue: is it the **overall lobed silhouette + vessels at the top**, or the **color**,
  that will carry the read? If the vessels don't read, does it still say "heart" or just "red lump"?
- What exactly is the "fidelity-vs-concept read" artifact and the categorical scale — confirm it
  matches the sibling convention (`faithful | recognizable | loose | failed`) so curation (T-038-01)
  can join all eight builds on one schema.
