# T-036-08 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story S-036. A **build ticket**: run the existing `vConcept` sculpture pipeline on
**"a koi fish"** at **scale 32**, save all artifacts, and record a **fidelity-vs-concept** read plus
a categorical judgment. It does **not** add or change pipeline code — that was T-035-01
(`status: done`). This is the **eighth and last** of the per-subject sibling builds (T-036-01..08)
that all depend on T-035-01 and exercise breadth of the same archetype.

Form note from the ticket: a **smooth organic curve** — a streamlined body with flowing fins and a
trailing tail. Curves and thin fins are the *hardest* case for a voxel grid (a block has no diagonal
or curved face), so a **large gap is expected**. This subject deliberately **anchors the
smooth-organic end** of the breadth spread, opposite the angular moai (001, the archetype's best
case). One build (best-of = B).

## The pipeline (already built, T-035-01)

Two layers, cleanly split.

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"` (single-sourced from
  `src/config.mjs`, `VCONCEPT_SCULPTURE_METHOD_ID`).
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. `assertSculptureSpec` validates the
  `{subject, scale}` pair *before any metered work* (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` all `=scale` (a sculpture is bounded ~cubically
  by its longest edge). A koi laid horizontally uses the x-budget for its length and little of y.
- Framing constants: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (hero still) and
  `TURNTABLE = {centerDeg 45, amplitudeDeg 40, frames 24, el 30, fov 45}` — a *front-arc rock*, never
  parading the imagined back.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. For this ticket the slug is `a-koi-fish`;
  `nextSeq()` will assign `009` (001 moai, 002 dancing-man, 003 moai-statue, 004 pineapple, 005
  bow-and-arrow, 006 heart, 007 sword, 008 mushroom already on disk).
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
  has the key — confirmed 2 hits), and headless GL (`render/`, deps present). Cannot run under
  `npm test`.
- **`baml_client/` is generated and present** — the concept stage imports it; no `baml:gen` needed.
- **Single-view limitation** (a property, not a bug): the build sees exactly ONE 3/4 view; back/far
  sides are the model's reconstruction. The rock turntable hides the imagined back by design. For a
  koi this matters moderately — a fish is roughly bilaterally symmetric, so the far flank is a fair
  mirror, but the *fin/tail* curvature is exactly what a single view fixes weakly.
- **Schema gate.** The build artifact must pass the live AJV schema or stage 3 throws. Prior runs
  produced 0 unmapped blocks; block IDs come from `minecraft-data`.

## Reference runs (the prior data points — the breadth spread this build completes)

- `001-vConcept-moai` (scale 32): 35-op build, 3414 blocks, 0 unmapped, ~$0.66. Angular monolith —
  text-JSON's *best* case, the spread's high anchor.
- `002-vConcept-a-dancing-man` (scale 32): 21 ops → 1073 blocks, judged `recognizable`; surfaced that
  the fixed 3/4 still azimuth is subject-dependent (a cantilevered limb shows its weakest silhouette
  at 45°).
- `005-vConcept-a-bow-and-arrow` (round/thin), `007-vConcept-a-sword` (planar/thin, judged
  `recognizable` — a flat blade voxelizes more gracefully than a round shaft). These map the
  *thin-object* axis; the sword finding was "models step rather than taper" thin tips.
- `004-vConcept-a-pineapple`, `008-vConcept-a-mushroom` — organic-but-chunky subjects; closer to the
  koi than the angular cases but still **solid, compact** bodies, where a koi adds **thin trailing
  fins and a swept tail** on top of a curved body.

A **koi fish is the spread's hardest case**: it combines (a) a smoothly curved, streamlined body
(no flat faces to map onto voxels), (b) thin, translucent, *trailing* fins, and (c) an arcing tail —
all features a block grid can only approximate by stepping. It anchors the smooth-organic / worst end
of the fidelity frontier, the deliberate counterweight to the moai. The expected outcome is a large,
recorded gap — that gap is the *measurement*, not a failure.

## Relevant memories

- *prompt-vs-live-artifact-schema* — build-prompt schema is looser than the live AJV gate; hence
  `metadata.target` is omitted and renders depend on conforming to the live schema.
- *concept-image-not-color-value-preview* — Nano Banana's concept previews hue but not tonal value; a
  named block can render far darker/lighter than the concept showed. Relevant here: a koi's
  white/orange/black mottling depends on which named blocks the build picks; the concept may
  misrepresent how those values read once rendered.
- *reference-grounds-craft-not-color* — less directly relevant (no reference image; concept is
  doc-only), but the craft/color split discipline still informs the read.

## Open questions for Design

- A koi's identity is its **curved streamlined body + flowing fins/tail**. At scale 32, the body will
  voxelize to a stepped lozenge and the fins to thin slabs or single-block-thick flags. Does enough of
  the silhouette (elongated body, dorsal + pectoral fins, swept tail, head/mouth) survive to read as a
  *fish* — and specifically a *koi* (the colour mottling) — versus a generic blocky blob? Hold scale
  fixed; let the read record the curve/fin loss in one line per AC#2.
- Orientation: horizontal (length along x, the natural fish pose, uses the 32 x-budget) vs an arced
  "swimming" pose. The doc/build stages decide; record what the model chose and whether the canonical
  45° still flatters or foreshortens the body and tail (cf. the dancing-man azimuth finding).
- What exactly is the "fidelity-vs-concept read" artifact, and where does it live so curation
  (T-038-01) can join it? (Answer carried from siblings: `fidelity-read.md` in this work dir, the
  per-subject join target.)
