# T-036-03 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story S-036. A **build ticket**: run the existing `vConcept` sculpture pipeline on
**"a pineapple"** at **scale 32**, save all artifacts, and record a **fidelity-vs-concept** read
plus a categorical judgment. It does **not** add or change pipeline code — that was T-035-01
(`status: done`). It is one of eight sibling per-subject builds (T-036-01..08), all depending on
T-035-01, that exercise breadth of the same archetype. Two siblings are already done/in-flight:
T-036-01 "a dancing man" (`done`, run `002`), T-036-02 "a moai statue" (`implement`, run `003`).

Form note from the ticket: a **patterned organic** body (diamond cross-hatch skin) **+ a spiky
crown** — it tests two things at once: (a) whether *surface pattern/texture* survives block scale,
and (b) a *rounded* body (vs the moai's flat-faceted monolith). **Moderate fidelity expected** —
the pineapple sits in the *middle* of the predicted frontier (angular-best → organic-worst), unlike
the moai (best case) or the dancing man (articulated-figure stress case). Extra role: this is the
**scale-study hero** — S-037 (T-037-*) rebuilds the same subject at 16 and 48, so *this* scale-32
run is the canonical midpoint those will be compared against. One build (best-of = **B**, i.e. a
single generation, no best-of-N selection).

## The pipeline (already built, T-035-01 — unchanged here)

Two layers, cleanly split:

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`, 10 tests)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"` (single-sourced from
  `src/config.mjs`, `VCONCEPT_SCULPTURE_METHOD_ID`).
- Bounds `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`; `assertSculptureSpec({subject, scale})`
  validates *before any metered work* (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW,maxH,maxD}` all `=scale` (a sculpture is bounded ~cubically by
  its longest edge) — the "scale wiring".
- Framing: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (hero still); `TURNTABLE = {centerDeg 45,
  amplitudeDeg 40, frames 24, el 30, fov 45}` — a *front-arc rock*, never parading the imagined back.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. Here slug = `a-pineapple`; `nextSeq()`
  assigns **`004`** (001 moai, 002 dancing-man, 003 moai-statue exist) → `004-vConcept-a-pineapple`.
- `sculptureMetadata`/`metadataPinLines` pin `trial_id`, `prompting_method_id`, `model_id`,
  `seed=17`, `server_state_id`. **`metadata.target` is omitted on purpose**: in the live AJV schema
  `target` is an enum `house|path|landscape`, so a subject term there fails the gate; the per-subject
  join key is `trial_id` + `summary.json` (memory: *prompt-vs-live-artifact-schema*).
- Prompt builders: `composeSculptureDesignDocPrompt({subject, scale})` (stage 1, imagined doc, no
  photo) and `composeSculptureBuildPrompt({subject, scale, designDoc, runId, model})` (stage 3, the
  3-D build — explicitly "in the round, NOT a facade/relief/front plane", states the single-view
  limit to the model, asks to keep the object solid/connected unless the subject truly has gaps).

### Live runner — `benchmarks/sculpture/run.mjs` (metered + GL; NOT in `npm test`)
Entry: `npm run bench:sculpture -- --subject "<term>" --scale <N> [--frames N] [--note "..."]`.
`runVConcept` chains three model stages and writes everything under `runs/<runId>/`:
1. **Stage 1 design doc** — `requestText` (claude `-p` shim, `src/sdk-binding.mjs`) →
   `design-doc.prompt.txt` + `design-doc.md`.
2. **Stage 2 concept image** — shells to `benchmarks/sculpture/baml-concept.mts` (tsx), which renders
   the BAML `SculptureConceptPrompt` (`baml_src/conceptart.baml`, separate from the frozen
   `FacadeConceptPrompt`) to text and pipes it to **Nano Banana** (Gemini `pro`, `src/nano-banana.mjs`).
   One 3/4 concept on solid black → `concept.png`.
3. **Stage 3 3-D build** — `composeSculptureBuildPrompt` → `requestDesignArtifactWithImage`
   (multimodal seam, AJV-enforced), grounded on the single `concept.png` → `artifact.json`.

Then render: `renderArtifact` (3/4 still → `render-3q.png`, `SCULPTURE_VIEW_3Q`) + a rock turntable
via `oscillateAzimuths` + `renderOrbit` (`render/src/orbit.mjs`) → `turntable/frame.NNN.png`. Finally
`transcript.jsonl`, `summary.json`, and the README gallery regenerate.

## Boundaries & constraints (verified this session)

- **Pre-flight green:** `npm run test:unit` = **312 pass / 0 fail**; `GEMINI_API_KEY` present in `.env`;
  claude `-p` shim at `~/.local/bin/claude`; `baml_client/` present; `render/` GL **available**.
- **Live & metered** — cannot run under `npm test`; it is the integration test of the archetype on a
  new subject.
- **Single-view limitation** (a property, not a bug): the build sees ONE 3/4 view; back/far sides are
  the model's reconstruction. The rock turntable hides the imagined back by design.
- **Schema gate:** stage 3 throws unless the artifact passes the live AJV schema; a clean exit *is* the
  schema-valid assertion. Block IDs come from `minecraft-data`.

## Prior data points (the breadth context this run extends)

- `001-vConcept-moai` (scale 32): 35 ops → 3414 blocks, 0 unmapped; angular/monolithic = text-JSON's
  *best* case. Cost ~$0.66.
- `002-vConcept-a-dancing-man` (scale 32): 21 ops → 1073 blocks, 0 unmapped; categorical
  **`recognizable` (strong)**; finding: the fixed 45° hero still can be an *unflattering* angle for a
  subject whose signature is off-axis (the cantilevered kick). Cost ~$0.49.
- `003-vConcept-a-moai-statue` (T-036-02, in-flight) — second moai phrasing.

The pineapple is the first **patterned/rounded organic** in the set — neither angular-best nor
figure-worst. Its risks are specific: the **diamond cross-hatch skin** is sub-form surface detail
that may flatten to plain color blocks, and the **spiky crown** is a cluster of thin elements (the
same voxel-breakup risk the dancing man's limbs showed).

## Relevant memories

- *prompt-vs-live-artifact-schema* — build-prompt schema looser than the live AJV gate; hence
  `metadata.target` omitted and renders depend on conforming to the live schema.
- *reference-grounds-craft-not-color* — facade-era split of craft vs color; here color/pattern come
  from the imagined doc (no reference photo), so the cross-hatch is the model's invention to render.

## Open questions for Design

- Does the concept stage's "block-scale detail ONLY / no sub-block ornament" guard *help or hurt* a
  pineapple, whose identity partly lives in a fine cross-hatch? Likely it forces a bold diamond
  banding — record whether that reads as "pineapple skin" or merely as a striped barrel.
- The spiky crown is thin/clustered — will it read as fronds or collapse to a green block cap? This is
  the texture+spike test the ticket names; record it, don't engineer around it.
- Where does the fidelity read live, and what is the categorical scale, so curation (T-038-01) and the
  scale study (S-037) can join on it deterministically?
