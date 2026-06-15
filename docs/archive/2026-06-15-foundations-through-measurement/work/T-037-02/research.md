# T-037-02 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story **S-037** (the *scale study*). A **build ticket**: run the existing `vConcept`
sculpture pipeline on **"a moai statue"** at **scale 48** — the *large, high-resolution* build of the
angular hero — save all artifacts, and record a **fidelity-vs-concept** note framed for the
**16 / 32 / 48** comparison, plus a categorical judgment. It does **not** add or change pipeline code —
that was T-035-01 (`status: done`). It is one of four S-037 builds:
`T-037-01 moai@16` · `T-037-02 moai@48` · `T-037-03 pineapple@16` · `T-037-04 pineapple@48`.

The story's question: **how does build fidelity (relative to the concept) track resolution, and does
it differ for angular vs organic forms?** This ticket supplies the *angular-large* data point. Its
contrast partners are the *angular-mid* (T-036-02, run 003, already built) and the *angular-small*
(T-037-01, scale 16, running concurrently — partial run dir `010` on disk at the time of writing).
The framing inverts T-037-01's: where 16 asks "how much is lost at low block count," 48 asks
**"does *more* block budget close the gap to the concept for an angular form, or does it plateau?"**

## The comparison anchors (already built / building)

`benchmarks/sculpture/runs/003-vConcept-a-moai-statue/` — same subject string ("a moai statue"),
**scale 32** (the mid anchor):
- **2402 blocks**, 0 unmapped, schema-valid; bounds `[-5,0,-4]..[5,31,6]` → 11(x) × 32(y) × 11(z).
- Cost $0.568; tokens 20379 in / 14273 out; duration ~392 s; 24-frame rock turntable.
- Judged (project `Category` enum) **form Strong, overall Competent** — "form / proportion /
  silhouette / topknot / plinth transferred faithfully; an unmistakable moai," with the noted drift
  being *value* not form (`gray_concrete` rendered darker than the concept, and recesses fragmented
  the face into a busier, tiki-leaning read). (See T-036-02 work dir + memory
  *concept-image-not-color-value-preview*.)

`benchmarks/sculpture/runs/010-vConcept-a-moai-statue/` — **scale 16** (T-037-01, the small end),
in flight at research time (only `design-doc.md`, `concept.png`, `build.prompt.txt` present; no
`artifact.json`/`summary.json` yet). Its `summary.json` (once complete) is the small-end datum this
read links into the triptych. The slug collides with run 003 and this run; **seq + `summary.json.scale`
disambiguate** (see below).

The original smoke `001-vConcept-moai` (scale 32, subject "moai") is a *different* subject string
(3414 blocks) — **not** the apples-to-apples anchor. The correct mid comparator is **run 003**
(identical subject, scale 32).

## The pipeline (already built, T-035-01)

Two layers, cleanly split.

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"`.
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. **Scale 48 is well within range**
  (≤ 64). `assertSculptureSpec` validates `{subject, scale}` *before any metered work*
  (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` all `= scale`. **At scale 48 the build is bounded
  ~48³** — 1.5× the linear resolution and **~3.4× the volume budget** of the scale-32 anchor, and
  ~27× the volume of the scale-16 sibling. This is the crux of the *large* end: the moai's face
  features (brow, eye sockets, nose, mouth) and topknot have *far more* blocks to resolve in — the
  question is whether the model spends that budget on fidelity (finer carving, subtler profile) or on
  bulk (a bigger but no-more-faithful monolith), and whether value drift worsens with more surface.
- Framing constants are scale-independent: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (hero still)
  and `TURNTABLE = {centerDeg 45, amplitudeDeg 40, frames 24, el 30, fov 45}` (front-arc rock). The
  renderer fits the camera to the build's bounds, so a larger build still *fills the frame* — scale
  affects *block resolution*, not apparent size in the still. So 16/32/48 stills are directly
  comparable on detail, not size.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. Slug here is `a-moai-statue`; `nextSeq()`
  reads the runs dir at invocation. With 010 on disk (and possibly more by sibling races), this run
  will be **≥ 011**. The run id does **not** encode scale, so this run's dir collides *by slug* with
  runs 003 and 010 — distinguished by seq prefix + `summary.json.scale`. (See Design/Structure.)
- `metadata.target` deliberately omitted (live AJV enum is `house|path|landscape`); join key is
  `trial_id`/run id + `summary.json`. (Memory: *prompt-vs-live-artifact-schema*.)
- Prompt builders `composeSculptureDesignDocPrompt({subject, scale})` and
  `composeSculptureBuildPrompt({subject, scale, designDoc, runId, model})` both **take `scale`** and
  thread it into the budget guidance, so the scale-48 doc/build are told the larger budget.

### Live runner — `benchmarks/sculpture/run.mjs` (metered + GL; NOT in `npm test`)
Entry: `npm run bench:sculpture -- --subject "<term>" --scale <N> [--frames N] [--note "..."]`.
`parseArgs` defaults `scale = DEFAULT_SCALE (32)`, `frames = TURNTABLE.frames (24)`. `runVConcept`
chains: stage 1 design doc (`requestText`, claude `-p` shim) → stage 2 concept image (shells to
`baml-concept.mts` → Nano Banana / Gemini `pro`) → stage 3 3-D build
(`requestDesignArtifactWithImage`, AJV-enforced). Then `renderArtifact` (3/4 still) + `renderOrbit` +
`oscillateAzimuths` (rock turntable), then `transcript.jsonl`, `summary.json`, README regen.

## Boundaries & constraints

- **Live & metered.** Needs the `claude -p` shim (`~/.local/bin/claude`, present), `GEMINI_API_KEY`
  (`.env`, present), headless GL (`render/`). Cannot run under `npm test`.
- **`baml_client/` generated and present**; concept stage imports it; no `baml:gen` needed.
- **Single-view limitation** — the build sees ONE 3/4 concept; back/sides are reconstruction. For a
  moai (front-dominant, near-symmetric, monolithic) this risk is low — its identity is the front face.
  At scale 48 the *back* gets more blocks too, but the model still has no back reference; watch for an
  over-elaborated or blank rear in the turntable.
- **Schema gate** — stage 3 throws on a malformed artifact; clean exit ⇒ schema-valid.
- **Concept value drift** (memory *concept-image-not-color-value-preview*) bit the scale-32 moai
  (`gray_concrete` darker than shown). Likely to recur — possibly *more visible* over the larger
  surface. Note in the read, do not "fix" the palette.
- **Cost/time scale up.** ~3.4× the volume of scale 32 ⇒ expect more build ops/tokens, more render
  work (larger voxel world), longer wall time than run 003's ~392 s. Budget a generous timeout.

## Relevant memories

- *prompt-vs-live-artifact-schema* — `metadata.target` omitted; renders depend on the live schema.
- *concept-image-not-color-value-preview* — concept previews hue, not tonal value; the scale-32 moai
  already drifted darker. Directly relevant: the same stone palette is re-evaluated here at more
  surface area, where value drift may read stronger.

## Open questions for Design

- Does **more budget close the gap** for the angular form, or plateau? I.e. is scale-48 *more*
  faithful than scale-32 (finer brow/nose/mouth, cleaner profile), the *same* (form already saturated
  at 32, extra blocks just bulk), or *worse* (more surface = busier face / more recess fragmentation /
  stronger value drift)? This is S-037's large-end thesis and the read must answer it against the
  observed pixels, not predict it.
- How should the read **name and link** the comparison so T-038-01 curation can assemble the 16/32/48
  triptych, given the run id slug collides with runs 003 and 010 and does not encode scale?
- What is the categorical vocabulary? Siblings split: T-036-01/04/06 used
  `faithful|recognizable|loose|failed`; T-036-02 (the anchor) used the project `Category` enum
  (`Weak|Competent|Strong|Exceptional`). The read should be comparable to the anchor — report both
  (lead with the four-bucket scale, map to the enum).
