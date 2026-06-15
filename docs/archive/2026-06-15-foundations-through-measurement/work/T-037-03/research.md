# T-037-03 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story **S-037** (the *scale study*). A **build ticket**: run the existing `vConcept`
sculpture pipeline on **"a pineapple"** at **scale 16** — the *small, low-resolution* build of the
**organic, patterned hero** — save all artifacts, and record a **fidelity-vs-concept** note framed for
the **16 / 32 / 48** comparison, plus a categorical judgment. It does **not** add or change pipeline
code — that was T-035-01 (`status: done`). It is one of four S-037 builds:
`T-037-01 moai@16` · `T-037-02 moai@48` · `T-037-03 pineapple@16` (this) · `T-037-04 pineapple@48`.

The story's question: **how does build fidelity (relative to the concept) track resolution, and does
it differ for angular vs organic forms?** This ticket supplies the **organic-small** data point — the
counterpart to T-037-01's *angular-small* (moai@16). Its contrast partners are the *organic-mid*
(T-036-03, already built, run 004) and *organic-large* (T-037-04, scale 48).

## The comparison anchor (already built)

`benchmarks/sculpture/runs/004-vConcept-a-pineapple/` — same subject string ("a pineapple"),
**scale 32**, ticket T-036-03 (`summary.json` read this session):
- **213 ops → 3314 blocks**, 0 unmapped, schema-valid; bounds `[-8,0,-8]..[8,31,8]` →
  17(x) × 32(y) × 17(z), symmetric rounded body, height = scale.
- Cost **$0.9905** (20931 in / 31040 out tok); concept 17.9 s; wall ~382 s.
- Judged **`recognizable`** (`f|r|l|f` vocab) — "faithful form and palette, unmistakably a pineapple";
  the **cross-hatch diamond skin only partially survives** (orange_terracotta on yellow_terracotta is
  near-identical in hue *and value*, so the lattice nearly vanishes; what reads is horizontal
  segmentation banding instead), while the **spiky frond crown** and **rounded ovoid body** both
  succeed. This **matched the ticket's "moderate fidelity expected"** — the patterned-organic form
  sits in the *middle* of the frontier (angular-best → figure-worst). (See `T-036-03/fidelity-read.md`
  + memory *concept-image-not-color-value-preview*.)

The pineapple is the **scale-study hero**: this scale-16 build is measured *against* run 004's
canonical scale-32 midpoint, and T-037-04 will supply the scale-48 end.

## The directly analogous sibling (the format template)

`T-037-01` (moai@16) is the structural twin of this ticket — same scale, same scale-study charter,
already complete (runs `010` @16, with `011` the moai@48). It established the operational pattern this
ticket reuses verbatim: reuse the runner with `--scale 16`, write a dedicated `fidelity-read.md` with a
**scale-16-vs-32 cross-scale subsection** and a categorical judgment in **both** vocabularies, cite the
run by **seq + explicit scale** (slug collision), and **never re-run for looks** (a coarse-but-valid
build is the commissioned datum). Its key finding: the angular moai **degraded gracefully** —
`recognizable`/`Competent`, form before finish. This ticket tests whether the *organic* form does the
same, or whether (as run 004 predicted) the cross-hatch disappears and the thin crown collapses.

## The pipeline (already built, T-035-01)

Two layers, cleanly split.

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"` (single-sourced from
  `src/config.mjs`, `VCONCEPT_SCULPTURE_METHOD_ID`).
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. **Scale 16 is well within range** (≥8).
  `assertSculptureSpec({subject, scale})` validates *before any metered work* (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` all `= scale`. **At scale 16 the build is bounded
  ~16³** — about half the linear resolution and **~⅛ the volume budget** of the scale-32 anchor
  (run 004's 3314 blocks). This is the crux of the study: the pineapple's two named stressors — the
  **diamond cross-hatch skin** and the **thin spiky crown** — must read in *far fewer* blocks.
- Framing constants are scale-independent: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (hero still)
  and `TURNTABLE = {centerDeg 45, amplitudeDeg 40, frames 24, el 30, fov 45}` (front-arc rock). The
  renderer fits the camera to the build's bounds, so a smaller build still fills the frame — scale
  affects *block resolution*, not apparent size in the still.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. Slug here is `a-pineapple`; `nextSeq()`
  currently points at **012** (011 is the highest on disk). The run id does **not** encode scale, so
  this run's dir (`NNN-vConcept-a-pineapple`) will collide *by slug* with run 004 (scale 32) — they are
  distinguished by seq prefix + `summary.json.scale`. (Same disambiguation T-037-01 used for the moai.)
- `metadata.target` deliberately omitted (live AJV enum is `house|path|landscape`); join key is
  `trial_id`/run id + `summary.json`. (Memory: *prompt-vs-live-artifact-schema*.)
- Prompt builders `composeSculptureDesignDocPrompt({subject, scale})` and
  `composeSculptureBuildPrompt({subject, scale, designDoc, runId, model})` both **take `scale`** and
  thread it into the budget guidance, so the scale-16 doc/build are told the smaller budget.

### Live runner — `benchmarks/sculpture/run.mjs` (metered + GL; NOT in `npm test`)
Entry: `npm run bench:sculpture -- --subject "<term>" --scale <N> [--frames N] [--note "..."]`.
`runVConcept` chains: stage 1 design doc (`requestText`, claude `-p` shim) → stage 2 concept image
(shells to `baml-concept.mts` → Nano Banana / Gemini `pro`, BAML `SculptureConceptPrompt` in
`baml_src/conceptart.baml`) → stage 3 3-D build (`requestDesignArtifactWithImage`, AJV-enforced,
grounded on the single `concept.png`). Then `renderArtifact` (3/4 still) + `renderOrbit` +
`oscillateAzimuths` (rock turntable), then `transcript.jsonl`, `summary.json`, README regen.

## Boundaries & constraints (verified this session)

- **Pre-flight green:** claude `-p` shim present (`~/.local/bin/claude`), `GEMINI_API_KEY` in `.env`,
  `baml_client/` present, `render/` GL available. `npm run test:unit` baseline run (see progress.md).
- **Live & metered.** Cannot run under `npm test`; it is the integration test of the archetype at a new
  scale. `baml_client/` generated and present; no `baml:gen` needed.
- **Single-view limitation** — the build sees ONE 3/4 concept; back/sides are reconstruction. For a
  pineapple (near-radially-symmetric ovoid + radiating crown) this risk is **low** — it reads alike
  from most azimuths, the right call for a fruit in the round.
- **Schema gate** — stage 3 throws on a malformed artifact; clean exit ⇒ schema-valid.
- **Concept value/contrast drift** (memory *concept-image-not-color-value-preview*) already bit the
  scale-32 pineapple — the orange diamonds washed out against yellow. Likely to **worsen** at scale 16
  (fewer rows for the lattice). Note in the read, do **not** "fix" the palette.

## Prior data points (the scale + breadth context this run extends)

- **004 pineapple @32** (anchor): 213 ops → 3314 blocks; `recognizable`; cross-hatch partial, crown +
  body succeed; $0.99.
- **010 moai @16** (T-037-01, the analogue): 37 ops → 732 blocks; `recognizable`/`Competent`;
  graceful degradation, form before finish; $0.6314. Note: cost did **not** fall with scale vs @32.
- **011 moai @48** (T-037-02): 6283 blocks; $0.40 (fewer output tokens — bulk fills are op-cheap).

These three suggest **token/cost does not scale monotonically with `scale`**; record this run's cost
against run 004's $0.99 as another datum.

## Relevant memories

- *prompt-vs-live-artifact-schema* — `metadata.target` omitted; renders depend on the live schema.
- *concept-image-not-color-value-preview* — concept previews hue, not tonal value; the scale-32
  pineapple's orange-on-yellow diamonds already washed out. Directly relevant: the same palette
  re-evaluated here, with *less* room to register at scale 16.
- *reference-grounds-craft-not-color* — no reference photo here; the cross-hatch is the model's
  invention to render from the imagined doc.

## Open questions for Design

- At ~⅛ the volume budget, does the **cross-hatch skin** disappear entirely (collapsing to a plain or
  banded barrel) and does the **thin frond crown** collapse to a green cap — i.e. is run 004's
  scale-16 prediction borne out? Where exactly does the organic form's fidelity drop between 16 and 32,
  and is that drop *steeper* than the angular moai's (which held form at 16)?
- How should the read **name and link** the comparison so T-038-01 curation can assemble the 16/32/48
  triptych, given the run id slug collides with run 004 and does not encode scale?
- What is the categorical vocabulary? Sibling builds split: most used
  `faithful|recognizable|loose|failed`; the moai anchor (T-036-02) used the project `Category` enum.
  The read should be comparable to **run 004's `recognizable`** — report both, as T-037-01 did.
