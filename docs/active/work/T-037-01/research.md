# T-037-01 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story **S-037** (the *scale study*). A **build ticket**: run the existing `vConcept`
sculpture pipeline on **"a moai statue"** at **scale 16** — the *small, low-resolution* build of the
angular hero — save all artifacts, and record a **fidelity-vs-concept** note framed for the
**16 / 32 / 48** comparison, plus a categorical judgment. It does **not** add or change pipeline code —
that was T-035-01 (`status: done`). It is one of four S-037 builds:
`T-037-01 moai@16` · `T-037-02 moai@48` · `T-037-03 pineapple@16` · `T-037-04 pineapple@48`.

The story's question: **how does build fidelity (relative to the concept) track resolution, and does
it differ for angular vs organic forms?** This ticket supplies the *angular-small* data point. Its
contrast partners are the *angular-mid* (T-036-02, already built) and *angular-large* (T-037-02).

## The comparison anchor (already built)

`benchmarks/sculpture/runs/003-vConcept-a-moai-statue/` — same subject string ("a moai statue"),
**scale 32**:
- **2402 blocks**, 0 unmapped, schema-valid; bounds `[-5,0,-4]..[5,31,6]` → 11(x) × 32(y) × 11(z).
- Cost $0.568; judged (project `Category` enum) **form Strong, overall Competent** — "form /
  proportion / silhouette / topknot / plinth transferred faithfully; an unmistakable moai," with the
  noted drift being *value* not form (`gray_concrete` rendered darker than the concept, and recesses
  fragmented the face into a busier, tiki-leaning read). (See T-036-02 work dir + memory
  *concept-image-not-color-value-preview*.)

The original smoke `001-vConcept-moai` (scale 32, subject "moai") is a *different* subject string
(3414 blocks) — **not** the apples-to-apples anchor. The correct mid-scale comparator for this study
is **run 003** (identical subject, scale 32). The large end (scale 48) is T-037-02, not yet built.

## The pipeline (already built, T-035-01)

Two layers, cleanly split.

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"`.
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. **Scale 16 is well within range** (≥8).
  `assertSculptureSpec` validates `{subject, scale}` *before any metered work* (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` all `= scale`. **At scale 16 the build is bounded
  ~16³** — about half the linear resolution and **~⅛ the volume budget** of the scale-32 anchor. This
  is the crux of the study: the moai's face features (brow, eyes, nose, mouth) and topknot must read in
  *far fewer* blocks.
- Framing constants are scale-independent: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (hero still)
  and `TURNTABLE = {centerDeg 45, amplitudeDeg 40, frames 24, el 30, fov 45}` (front-arc rock). The
  renderer fits the camera to the build's bounds, so a smaller build still fills the frame — scale
  affects *block resolution*, not apparent size in the still.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. Slug here is `a-moai-statue`; `nextSeq()`
  currently points at **010** (009 is the highest on disk). The run id does **not** encode scale, so
  this run's dir (`NNN-vConcept-a-moai-statue`) will collide *by slug* with run 003 — they are
  distinguished by seq prefix + `summary.json.scale`. (See Design/Structure for how the read names it.)
- `metadata.target` deliberately omitted (live AJV enum is `house|path|landscape`); join key is
  `trial_id`/run id + `summary.json`. (Memory: *prompt-vs-live-artifact-schema*.)
- Prompt builders `composeSculptureDesignDocPrompt({subject, scale})` and
  `composeSculptureBuildPrompt({subject, scale, designDoc, runId, model})` both **take `scale`** and
  thread it into the budget guidance, so the scale-16 doc/build are told the smaller budget.

### Live runner — `benchmarks/sculpture/run.mjs` (metered + GL; NOT in `npm test`)
Entry: `npm run bench:sculpture -- --subject "<term>" --scale <N> [--frames N] [--note "..."]`.
`runVConcept` chains: stage 1 design doc (`requestText`, claude `-p` shim) → stage 2 concept image
(shells to `baml-concept.mts` → Nano Banana / Gemini `pro`) → stage 3 3-D build
(`requestDesignArtifactWithImage`, AJV-enforced). Then `renderArtifact` (3/4 still) + `renderOrbit` +
`oscillateAzimuths` (rock turntable), then `transcript.jsonl`, `summary.json`, README regen.

## Boundaries & constraints

- **Live & metered.** Needs the `claude -p` shim (`~/.local/bin/claude`, present), `GEMINI_API_KEY`
  (`.env`, present), headless GL (`render/`). Cannot run under `npm test`.
- **`baml_client/` generated and present**; concept stage imports it; no `baml:gen` needed.
- **Single-view limitation** — the build sees ONE 3/4 concept; back/sides are reconstruction. For a
  moai (front-dominant, near-symmetric, monolithic) this risk is low — its identity is the front face.
- **Schema gate** — stage 3 throws on a malformed artifact; clean exit ⇒ schema-valid.
- **Concept value drift** (memory *concept-image-not-color-value-preview*) bit the scale-32 moai
  (`gray_concrete` darker than shown). Likely to recur — note in the read, do not "fix" the palette.

## Relevant memories

- *prompt-vs-live-artifact-schema* — `metadata.target` omitted; renders depend on the live schema.
- *concept-image-not-color-value-preview* — concept previews hue, not tonal value; the scale-32 moai
  already drifted darker. Directly relevant: the same stone palette will be re-evaluated here.

## Open questions for Design

- At ~⅛ the volume budget, does the moai's **face** still resolve (brow/eye-sockets/nose/mouth), or do
  features merge into a smooth block-head — i.e. is the angular form's predicted *graceful degradation*
  borne out, and where exactly does fidelity start to drop between 16 and 32?
- How should the read **name and link** the comparison so T-038-01 curation can assemble the 16/32/48
  triptych, given the run id slug collides with run 003 and does not encode scale?
- What is the categorical vocabulary? Siblings split: T-036-01/04/06 used
  `faithful|recognizable|loose|failed`; T-036-02 (the anchor) used the project `Category` enum
  (`Weak|Competent|Strong|Exceptional`). The read should be comparable to the anchor.
