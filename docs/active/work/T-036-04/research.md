# T-036-04 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story S-036. A **build/measurement ticket**: run the existing `vConcept` sculpture
pipeline on **"a bow and arrow"** at **scale 32**, save all artifacts, and record a
**fidelity-vs-concept** read plus a categorical judgment. It does **not** add or change pipeline
code — that was T-035-01 (`status: done`). It is one of eight sibling per-subject builds
(T-036-01..08), all depending on T-035-01, that exercise breadth of the same archetype.

Form note from the ticket: **thin/linear** — the **hardest** case. The arrow shaft is *near-sub-block*
(like the Golden-Gate cables of the facade era); expect the **largest** concept→voxel fidelity gap of
the whole S-036 set. The README's own "block-scale fidelity frontier" names *bow & arrow* explicitly
as the thin/linear largest-gap exemplar. The gap is the point: it is the clearest visual case for why
an image→3D model (TRELLIS, deferred) or a dedicated sculptor would beat text-JSON. One build
(best-of = B).

## The pipeline (already built, T-035-01) — unchanged here

Two layers, cleanly split (mirrors what the prior siblings used):

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"` (single-sourced from
  `src/config.mjs`, `VCONCEPT_SCULPTURE_METHOD_ID`).
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. `assertSculptureSpec({subject, scale})`
  validates *before any metered work* (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` all `=scale` (bounded ~cubically by longest edge).
- Framing constants: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (hero still) and
  `TURNTABLE = {centerDeg 45, amplitudeDeg 40, frames 24, el 30, fov 45}` — a front-arc *rock*, never
  parading the imagined back.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. For this ticket the slug is
  `a-bow-and-arrow`; `nextSeq()` will assign **`005`** (001 moai smoke, 002 dancing-man, 003
  moai-statue, 004 pineapple already on disk).
- `sculptureMetadata` / `metadataPinLines` — pins `trial_id`, `prompting_method_id`, `model_id`,
  `seed=17`, `server_state_id`. **`metadata.target` is deliberately omitted**: the live AJV schema
  enums `target` as `house|path|landscape`, so a subject term there fails the gate. The per-subject
  join key is `trial_id` (run id embeds the slug) + `summary.json`. (Memory:
  *prompt-vs-live-artifact-schema*.)
- Two prompt builders: `composeSculptureDesignDocPrompt({subject, scale})` (stage 1, imagined doc,
  no photo) and `composeSculptureBuildPrompt({subject, scale, designDoc, runId, model})` (stage 3,
  the 3-D build — explicitly "in the round, NOT a facade/relief/front plane"; states the single-view
  limitation to the model and asks for SOLID, connected masses with bridged thin parts).

### Live runner — `benchmarks/sculpture/run.mjs` (metered + GL; NOT in `npm test`)
Entry: `npm run bench:sculpture -- --subject "<term>" --scale <N> [--frames N] [--note "..."]`.
`runVConcept` chains three model stages, writes everything under `runs/<runId>/`:
1. **Stage 1 design doc** — `composeSculptureDesignDocPrompt` → `requestText` (claude `-p` shim,
   `src/sdk-binding.mjs`). Writes `design-doc.prompt.txt` + `design-doc.md`.
2. **Stage 2 concept image** — shells `benchmarks/sculpture/baml-concept.mts` (tsx), rendering BAML
   `SculptureConceptPrompt` (`baml_src/conceptart.baml`, separate from the frozen `FacadeConceptPrompt`)
   and piping it to **Nano Banana** (Gemini image, `src/nano-banana.mjs`). One 3/4 concept on solid
   black → `concept.png`.
3. **Stage 3 3-D build** — `composeSculptureBuildPrompt` → `requestDesignArtifactWithImage`
   (multimodal seam, schema-enforced via AJV). Grounded on the single `concept.png` → `artifact.json`.

Then render: `renderArtifact` (3/4 hero still → `render-3q.png`, `SCULPTURE_VIEW_3Q`) and a rock
turntable via `oscillateAzimuths` + `renderOrbit` (`render/src/orbit.mjs`) → `turntable/frame.NNN.png`.
Finally writes `transcript.jsonl`, `summary.json`, and regenerates the README gallery table/section.

## Boundaries & constraints

- **Live & metered.** Needs the `claude -p` subscription shim (`~/.local/bin/claude`, present),
  `GEMINI_API_KEY` (read by `src/nano-banana.mjs` from `process.env`/gitignored `.env`, present), and
  headless GL (`render/`). Cannot run under `npm test`.
- **`baml_client/` is generated and present** — the concept stage imports it; no `baml:gen` needed.
- **Single-view limitation** (a property, not a bug): the build sees exactly ONE 3/4 view; back/far
  sides are reconstruction. The rock turntable hides the imagined back by design.
- **Schema gate.** The build artifact must pass the live AJV schema or stage 3 throws. Prior runs
  produced 0 unmapped blocks; block IDs come from `minecraft-data`.

## Reference runs (the prior data points, hardest→easiest predicted order)

| run | subject | form | blocks | bounds (y max) | cost | note |
|-----|---------|------|--------|----------------|------|------|
| 001 | moai (smoke) | angular | 3414 | 31 | $0.66 | best-case monolith |
| 002 | a dancing man | articulated figure | 1073 | 32 | $0.49 | `recognizable`; angle-fragile |
| 003 | a moai statue | angular monolith | 2402 | 31 | — | T-036-02 (done) |
| 004 | a pineapple | patterned organic | — | — | — | T-036-03 (implement) |

The moai (angular/monolithic) is text-JSON's *best* case. **This ticket's bow and arrow is the
predicted *worst* case** — the opposite end of the frontier. The dancing-man sibling already showed a
key cross-subject signal (the fixed 3/4 hero azimuth is subject-dependent; thin cantilevered elements
present a weak silhouette at 45° and the turntable rescues the read). That signal is *directly
relevant* here: a bow's plane and an arrow's shaft are highly orientation-sensitive.

## Relevant memories

- *prompt-vs-live-artifact-schema* — build-prompt schema is looser than the live AJV gate; hence
  `metadata.target` is omitted and renders depend on conforming to the live schema.
- *reference-grounds-craft-not-color*, *3d-reference-vs-flat-facade* — facade-era craft notes; the
  3-D/flat tension matters here because a bow+arrow is naturally a near-planar arrangement at risk of
  reading as a relief rather than an object in the round.

## Open questions for Design

- A bowstring and an arrow shaft are each ~1 block thick. Will the build keep them as discrete thin
  runs (likely voxel-broken / dotted), thicken them into chunky bars (legible but no longer "thin"),
  or drop them entirely (bow stave survives, string/arrow lost)? The fidelity read must *explicitly*
  answer "did the arrow/string survive, and how chunky".
- A bow+arrow is a near-planar composition. Does the build present it as an object in the round, or
  collapse toward a flat relief — and does the fixed 45° hero still help or hurt (edge-on string vs
  broadside)? Anticipate citing a turntable frame as the rescuing/illustrative view, as 002 did.
- Where does the "fidelity-vs-concept read" artifact live so curation (T-038-01) can join it per
  subject? (Same answer as siblings: `fidelity-read.md` in this work dir, referencing run-dir images.)
