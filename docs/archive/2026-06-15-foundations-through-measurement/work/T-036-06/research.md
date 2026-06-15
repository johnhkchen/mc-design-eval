# T-036-06 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story S-036. A **build ticket**: run the existing `vConcept` sculpture pipeline on
**"a sword"** at **scale 32**, save all artifacts, and record a **fidelity-vs-concept** read plus a
categorical judgment. It does **not** add or change pipeline code — that was T-035-01
(`status: done`). This is one of eight sibling per-subject builds (T-036-01..08) that all depend on
T-035-01 and exercise breadth of the same archetype.

Form note from the ticket: an **iconic thin object**. The blade is thin but **flat/planar** — easier
than the round arrow (T-036-05) because a planar form maps cleanly onto a voxel slab; the hilt/guard
give cross-axis structure. Expectation: reads recognizably **with some thinning loss** (a sword's
identity survives chunky proportions as long as the long blade + perpendicular crossguard + pommel
silhouette is preserved). One build (best-of = B).

## The pipeline (already built, T-035-01)

Two layers, cleanly split.

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"` (single-sourced from
  `src/config.mjs`, `VCONCEPT_SCULPTURE_METHOD_ID`).
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. `assertSculptureSpec` validates the
  `{subject, scale}` pair *before any metered work* (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` all `=scale` (a sculpture is bounded ~cubically
  by its longest edge).
- Framing constants: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (hero still) and
  `TURNTABLE = {centerDeg 45, amplitudeDeg 40, frames 24, el 30, fov 45}` — a *front-arc rock*, never
  parading the imagined back.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. For this ticket the slug is `a-sword`;
  `nextSeq()` will assign `006` (001 moai, 002 dancing-man, 003 moai-statue, 004 pineapple, 005
  bow-and-arrow already on disk).
- `sculptureMetadata` / `metadataPinLines` — pins `trial_id`, `prompting_method_id`, `model_id`,
  `seed=17`, `server_state_id`. **`metadata.target` is deliberately omitted**: in the live AJV schema
  `target` is an enum `house|path|landscape`, so a subject term there fails the gate. The per-subject
  join key is `trial_id` (run id embeds the slug) + `summary.json`. (See memory:
  *prompt-vs-live-artifact-schema*.)
- Two prompt builders: `composeSculptureDesignDocPrompt({subject, scale})` (stage 1, imagined doc, no
  photo) and `composeSculptureBuildPrompt({subject, scale, designDoc, runId, model})` (stage 3, the
  3-D build — explicitly "in the round, NOT a facade/relief/front plane", states the single-view
  limitation to the model and pushes SOLID + connected geometry).

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
Finally writes `transcript.jsonl`, `summary.json`, and regenerates the README gallery table.

## Boundaries & constraints

- **Live & metered.** Needs the `claude -p` subscription shim (`~/.local/bin/claude`, present),
  `GEMINI_API_KEY` (read by `src/nano-banana.mjs` from `process.env` or the gitignored `.env`, which
  has the key), and headless GL (`render/`). Cannot run under `npm test`.
- **`baml_client/` is generated and present** — the concept stage imports it; no `baml:gen` needed.
- **Single-view limitation** (a property, not a bug): the build sees exactly ONE 3/4 view; back/far
  sides are the model's reconstruction. The rock turntable hides the imagined back by design. For a
  sword this matters little — a blade is near-symmetric front/back, so the reconstruction risk is low
  relative to the dancing-man figure.
- **Schema gate.** The build artifact must pass the live AJV schema or stage 3 throws. Prior runs
  produced 0 unmapped blocks; block IDs come from `minecraft-data`.

## Reference runs (the prior data points)

- `001-vConcept-moai` (scale 32): 35-op build, 3414 blocks, 0 unmapped, ~$0.66. Angular monolith —
  text-JSON's *best* case.
- `002-vConcept-a-dancing-man` (scale 32): 21 ops → 1073 blocks, $0.49, ~181 s. Articulated figure,
  judged `recognizable`; surfaced the finding that the fixed 3/4 still azimuth is subject-dependent
  (a cantilevered limb can present its weakest silhouette at 45°).
- `004-vConcept-a-pineapple`, `005-vConcept-a-bow-and-arrow`: sibling builds (organic / round-thin).

A sword sits between the moai and the arrow on the fidelity frontier: thinner than the moai, but its
thin dimension is a **flat plane** (blade) rather than a round shaft, so it voxelizes more gracefully
than the arrow. The crossguard + pommel are bold, blocky masses that anchor recognizability.

## Relevant memories

- *prompt-vs-live-artifact-schema* — build-prompt schema is looser than the live AJV gate; hence
  `metadata.target` is omitted and renders depend on conforming to the live schema.
- *concept-image-not-color-value-preview* — Nano Banana's concept previews hue but not tonal value; a
  named block (e.g. a gray/iron blade) can render far darker/lighter than the concept showed. Relevant
  here: a steel blade's metallic value is exactly the kind of thing the concept may misrepresent.
- *reference-grounds-craft-not-color* — less directly relevant (no reference image; concept is
  doc-only), but the craft/color split discipline still informs the read.

## Open questions for Design

- A blade is the iconic thin axis. At scale 32, is the blade given enough length (most of 32) and a
  readable thinness (likely 2–4 blocks) to read as a blade and not a plank? The build prompt already
  pushes SOLID/connected geometry, which suits a sword (one continuous piece). Hold scale fixed and
  let the read note any thinning loss.
- Orientation: a sword can be built point-up (vertical, tallest silhouette, uses the 32 y-budget) or
  laid diagonally. The doc/build stages decide; record what the model chose and whether the canonical
  45° still flatters or flattens it (cf. the dancing-man azimuth finding).
- What exactly is the "fidelity-vs-concept read" artifact, and where does it live so curation
  (T-038-01) can join it? (Answer carried from siblings: `fidelity-read.md` in this work dir.)
