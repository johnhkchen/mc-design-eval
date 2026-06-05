# T-036-07 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story S-036. A **build ticket**: run the existing `vConcept` sculpture pipeline on
**"a mushroom"** at **scale 32**, save all artifacts, and record a **fidelity-vs-concept** read plus a
categorical judgment. It adds or changes **no pipeline code** — that was T-035-01 (`status: done`).
This is one of eight sibling per-subject builds (T-036-01..08) that all `depends_on: [T-035-01]` and
exercise breadth of the same archetype across form types.

Form note from the ticket: **organic blob** (domed cap + stem) — explicitly flagged as
**Minecraft-native and forgiving**, expected to be a **reasonably faithful** build. On the fidelity
frontier the README frames (angular/monolithic = text-JSON's *best* case; smooth/organic = *worst*),
the mushroom sits in the **happy middle**: it is organic (no straight edges) like the heart (T-036-05)
and the pineapple (T-036-04), but unlike the heart it is **bilaterally near-symmetric, low-detail, and
forgiving** — a domed cap on a cylindrical stem is two simple solids of revolution. The ticket
explicitly positions it as the **"organic-but-easy" datapoint** between the angular subjects
(moai/sword/bow) and the hard-organic ones (heart/dancing man). One build (best-of = B).

A notable wrinkle specific to *this* subject: a mushroom is **doubly Minecraft-native** — its form is
voxel-forgiving *and* Minecraft ships literal mushroom block vocabulary (`red_mushroom_block`,
`brown_mushroom_block`, `mushroom_stem`) in `minecraft-data`. Whether the model reaches for those
on-the-nose blocks or builds the cap from terracotta/concrete is itself an interesting observation for
the fidelity read (it does not change the pipeline either way — block IDs are validated against
`minecraft-data` regardless).

## The pipeline (already built, T-035-01)

Two layers, cleanly split:

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"` (single-sourced from
  `src/config.mjs`, `VCONCEPT_SCULPTURE_METHOD_ID`).
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. `assertSculptureSpec` validates the
  `{subject, scale}` pair *before any metered work* (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` all `=scale` (a sculpture is bounded ~cubically
  by its longest edge).
- Framing constants: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (the hero still) and
  `TURNTABLE = {centerDeg 45, amplitudeDeg 40, frames 24, el 30, fov 45}` — a *front-arc rock*, never
  parading the imagined back.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. For this ticket the slug is **`a-mushroom`**
  (confirmed: `"a mushroom".toLowerCase().replace(/[^a-z0-9]+/g,"-")` → `a-mushroom`); `nextSeq()` will
  assign **`008`** (runs 001–007 already exist on disk).
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
  2.1.165), `GEMINI_API_KEY` (read by `src/nano-banana.mjs` from `process.env` or the gitignored
  `.env`, present), and headless GL (`render/`). Cannot run under `npm test`.
- **`baml_client/` is generated and present** — the concept stage imports it; no `baml:gen` needed.
- **Single-view limitation** (a property, not a bug): the build sees exactly ONE 3/4 view; back/far
  sides are the model's reconstruction. The rock turntable hides the imagined back by design. For a
  *near-symmetric solid of revolution* like a mushroom this matters **least** of the breadth set — the
  back hemisphere of a cap-on-stem is almost fully determined by the front, so back-invention is
  low-risk here (the opposite of the asymmetric heart).
- **Schema gate.** The build artifact must pass the live AJV schema or stage 3 throws. Block IDs come
  from `minecraft-data`; the moai smoke produced 0 unmapped blocks.

## Reference runs (prior data points)

- `runs/001-vConcept-moai` (scale 32): 35-op build = 3414 blocks, 0 unmapped, bounds
  `[-6,0,-5]..[6,31,7]`. ~$0.66, ~500s. The angular/monolithic *best* case.
- `runs/002-vConcept-a-dancing-man` (scale 32): 21 ops → 1073 blocks, 0 unmapped, bounds
  `[-12,0,-4]..[7,32,2]`. $0.4945, ~181s. Judged **recognizable (strong)** but *angle-fragile*.
- Runs 003 (a moai statue), 004 (a pineapple), 005 (a bow and arrow), 006 (an anatomically correct
  human heart), 007 (a sword) exist from sibling tickets.

The mushroom is predicted to land **at or near the top** of the organic subset on fidelity: a domed
cap + stem is the friendliest organic form a voxel grid can hold — broad, low-frequency curvature that
stair-steps gracefully, strong silhouette, near-symmetry that the single-view grounding captures well.
The build prompt's "SOLID and connected" guidance is a natural fit (a mushroom *is* one connected
mass). The expected risk is not recognizability but **finesse**: the cap's gentle dome may read as a
stepped cone/pyramid if the radius doesn't taper smoothly (memory: *voxel-onion-dome-and-bay-framing* —
a dome belly must overhang its base or it reads as a pyramid; the cap should overhang the stem).

## Relevant memories

- *prompt-vs-live-artifact-schema* — the build-prompt schema is looser than the live AJV gate; hence
  `metadata.target` is omitted and renders depend on conforming to the live schema.
- *concept-image-not-color-value-preview* — Nano Banana concept previews block **hue** but not
  **value**; a named block can render far darker than the concept showed. Relevant here: the classic
  *Amanita* red cap with white spots — if the model picks a deep `red_concrete`/`red_terracotta` the
  cap may render maroon rather than the bright concept red; worth checking.
- *voxel-onion-dome-and-bay-framing* — a dome belly must overhang its base or it reads as a pyramid.
  Directly applicable: the mushroom cap is a dome on a stem; if it doesn't overhang the stem it reads
  as a tree/lollipop or a stepped cone, losing the "mushroom" gestalt.
- *reference-grounds-craft-not-color* — color comes from the brief, craft from any reference; here
  there is no external reference image, only the model's imagined concept, so palette is self-sourced.

## Open questions for Design

- Does scale 32 give enough cap radius for the dome to **overhang the stem** and taper smoothly, or
  does it read as a cone/lollipop? The overhang is the single strongest "mushroom" cue.
- Does the model reach for literal `*_mushroom_block` vocabulary or build the cap from
  terracotta/concrete? Either is schema-valid; note which, as a craft observation.
- Recognizability cue: cap-overhang-on-stem silhouette is so iconic that even a crude build should read
  as "mushroom". The risk is *blandness* (a featureless dome) more than *illegibility* — does the
  concept add spots/gills/texture that survive voxelization?
- Confirm the "fidelity-vs-concept read" artifact and the categorical scale match the sibling
  convention (`faithful | recognizable | loose | failed`) so curation (T-038-01) can join all eight
  builds on one schema.
