# T-035-01 — Design

Decide *where* the sculpture mode lives and *how* each stage is generalized, grounded in the
Research map. The pipeline shape is fixed by the ticket; the design choices are placement,
concept-prompt transport, scale wiring, and turntable framing.

## Decision 1 — Code home: pure builders in `src/sculpture.mjs`, live runner in `benchmarks/sculpture/`

**Options.**
- (A) Add a `vConcept` approach into `benchmarks/temple-facade/run.mjs`. Rejected: that benchmark's
  `task` is a fixed temple facade with a head-on view; subject is a CLI param here, and mixing a
  freestanding-object approach into a facade-only runner muddies both. The README gallery would mix
  facades and sculptures.
- (B) Everything inline in a new `benchmarks/sculpture/run.mjs` (mirrors temple-facade, prompts
  inline). Rejected on its own: the ticket *requires* the new pure logic (scale wiring) to be unit-
  tested, and `npm test` only globs `src/**/*.test.mjs` — inline benchmark prompts are untested.
- (C, CHOSEN) **Split like the `src/` archetypes:** PURE builders + descriptor + spec/scale logic in
  `src/sculpture.mjs` (reached by the test glob), and the ONE live/metered/GL runner in
  `benchmarks/sculpture/run.mjs` importing them. This matches `single-shot.mjs` /
  `iterative-multimodal.mjs` (pure surface tested; thin live runner not tested) AND the
  `benchmarks/<task>/run.mjs` run-dir convention. Best of both, and it satisfies "reuse, don't fork":
  the runner reuses `requestText`, `requestDesignArtifactWithImage`, `generateImage`, `renderArtifact`,
  `renderOrbit`, `oscillateAzimuths`, `loadPalette/formatPaletteBlocks` verbatim.

## Decision 2 — Concept prompt: a new BAML `SculptureConceptPrompt` (not a plain JS string)

The ticket offers "new BAML fn, or generalize `FacadeConceptPrompt`". The concept-art prompt is the
one stage already owned by BAML (`conceptart.baml` + the `baml-concept.mts` extraction machinery via
`b.request.*` → Nano Banana). **Add a sibling `SculptureConceptPrompt(design_doc, target_blocks,
attached)`** rather than overloading `FacadeConceptPrompt` with a mode flag — keeps the facade
prompt frozen (its E-09 runs stay reproducible) and gives the sculpture its own versioned text:
"concept art of a Minecraft-block **[subject]** as a single isolated object, **3/4 view**, on solid
black, block-scale detail for a ~`target_blocks`-block build". `baml-cli 0.222.0` runs, so
`npm run baml:gen` regenerates the checked-in client. The *subject* is threaded into the design-doc
(stage 1) and the concept prompt's framing via the doc text; the BAML fn keeps the same generic
signature as the facade one (doc + block budget + attachment), so the tsx runner is a near-copy.

Rejected alt: emit the concept prompt as a plain JS template in `src/sculpture.mjs`. Simpler (no
regen) but breaks the established "concept-art prompt is BAML-versioned" architecture and the
ticket's primary suggestion. The design-doc and build prompts DO stay plain JS (matching the facade
benchmark, where only concept+build-via-BAML use BAML and doc/build prompts are inline JS) — but the
sculpture *build* uses the JSON-schema seam (`requestDesignArtifactWithImage`), not BAML, because we
need image grounding, which `BuildTempleFacade`/`baml-build.mts` does not do.

## Decision 3 — Object-oriented build prompt (the core generalization)

`composeSculptureBuildPrompt({subject, scale, designDoc, runId})` deliberately INVERTS every facade
assumption:
- Occupy full **x/y/z** as a freestanding mass centered on a local origin; ground at y=0; it is a
  *sculpture in the round*, not a front elevation. NO "FACES +Z", NO "relief into −Z", NO "model only
  the front", NO "connected plane".
- Ground on the attached 3/4 concept image (the model SEES the intended object) and realize the
  finalized design doc (form, proportion, palette, motifs).
- **Single-view limitation, stated in-prompt:** "The concept shows ONE 3/4 view; the back and far
  sides are not depicted — infer them as a plausible, symmetric continuation of the visible form. They
  are your reconstruction from a single view (a known limit of this mode)." This both guides the model
  and is the artifact-level documentation of the limit.
- Scale caps interpolated from `sculptureScaleCaps(scale)` (Decision 4). Palette via the doc; declare
  `palette.manifest`.

## Decision 4 — `--scale` wiring as the unit-tested pure logic

`sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` (PURE). A freestanding object is bounded ~cubically
by its largest dimension; map `scale` (target longest edge in blocks) to per-axis caps with modest
headroom so the model has room without unbounded sprawl: caps = `scale` on each axis, with the build
prompt told the *target* longest edge is `scale`. `assertSculptureSpec({subject, scale})` validates a
non-empty subject and an integer scale within `[SCALE_MIN, SCALE_MAX] = [8, 64]` (8 = below this no
form survives voxelization; 64 = render/token sanity). These are tiny, fully deterministic, and are
the natural home for the AC's "new pure logic … unit-tested" requirement: tests assert caps scale
monotonically, bounds are enforced, and the value flows into the doc/concept/build prompt strings.

## Decision 5 — Render: 3/4 still + front-arc **rock** turntable (not a 360 spin)

The object has a real but *imagined* back, so the honest hero motion stays in the front hemisphere:
- 3/4 still: `renderArtifact(artifact, {view: SCULPTURE_VIEW_3Q})` with `{azimuthDeg:45,
  elevationDeg:30, fov:45}` — the canonical three-quarter corner, slightly lower than DEFAULT_VIEW's
  35° so a tabletop object reads.
- Turntable: `renderOrbit(artifact, {frames, azimuths: oscillateAzimuths(frames, {centerDeg:45,
  amplitudeDeg:40}), view:{elevationDeg:30, fov:45}, outDir, baseName})` — rocks 5°→85°, centered on
  the same 3/4 the still uses, never swinging to the weak imagined back. This reuses the *exact* rig
  already shipped (orbit.mjs) and the lesson from E-12's oscillation work. The runner optionally
  encodes an mp4 if ffmpeg is present (best-effort, via orbit-clip's pattern), else leaves the PNGs.

Rejected: full `orbitAzimuths` 360° spin — it would parade the imagined/uncertain back as if it were
designed, contradicting the documented single-view limit.

## Decision 6 — Run-dir + provenance (mirror temple-facade)

`benchmarks/sculpture/runs/<NNN-vConcept-<subject>>/` holds: `design-doc.prompt.txt`, `design-doc.md`,
`concept.prompt.txt`(chars), `concept.png`, `build.prompt.txt`, `artifact.json`, `render-3q.png`,
`turntable/frame.NNN.png` (+ optional `turntable.mp4`), `summary.json`, `transcript.jsonl`, and a
regenerated `README.md` gallery. method-id `vconcept-sculpture.v1` (single-sourced in config.mjs).
No judge stage (E-13 curation T-038-01 owns scoring); keep the runner focused on producing the
artifact + views.

## What is explicitly NOT done

No image→3D (TRELLIS) — the single-view limit is documented, not closed. No multi-subject batch loop
(downstream tickets call the runner per subject). No changes to facade code, the schema, or the live
seam — only additive: `src/sculpture.mjs(+test)`, `baml_src/conceptart.baml` (+regen),
`benchmarks/sculpture/*`, one `config.mjs` constant, one `package.json` script.
