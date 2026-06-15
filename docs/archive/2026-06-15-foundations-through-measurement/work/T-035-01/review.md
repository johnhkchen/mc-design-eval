# T-035-01 — Review

vConcept **sculpture mode** (E-13 / S-035): term → freestanding 3-D voxel object → 3/4 still +
rock turntable. Handoff summary for a human reviewer.

## What changed

### New code
- **`src/sculpture.mjs`** (PURE, the unit-tested surface). Descriptor `VCONCEPT_SCULPTURE`
  (id single-sourced from config), bounds/defaults/view/turntable constants, `assertSculptureSpec`,
  `sculptureScaleCaps` (the AC "scale wiring"), `runIdForSubject`, `sculptureMetadata`,
  `metadataPinLines`, and the two prompt builders `composeSculptureDesignDocPrompt` /
  `composeSculptureBuildPrompt`. SDK/GL-free (imports only `config.mjs`).
- **`src/sculpture.test.mjs`** — 10 unit tests over the pure surface.
- **`benchmarks/sculpture/run.mjs`** — the LIVE `--subject/--scale` entry point. One `vConcept`
  approach: imagined design doc (`requestText`) → one 3/4 concept image (`baml-concept.mts` →
  Nano Banana) → 3-D build grounded on that single view (`requestDesignArtifactWithImage`) → 3/4
  still (`renderArtifact`, `SCULPTURE_VIEW_3Q`) + rock turntable (`renderOrbit` +
  `oscillateAzimuths`). Writes a run dir + `summary.json` + regenerates the README gallery.
- **`benchmarks/sculpture/baml-concept.mts`** — concept-image tsx runner (doc-only), sibling of the
  facade one, calling `b.request.SculptureConceptPrompt`.
- **`benchmarks/sculpture/README.md`** (+ RUNS gallery, Known-limitations) and **`.gitignore`**.
- **`benchmarks/sculpture/runs/001-vConcept-moai/`** — the committed AC#1 smoke (reference run).

### Modified
- **`baml_src/conceptart.baml`** — added `SculptureConceptPrompt(design_doc, target_blocks,
  attached)`. The facade fn is untouched (its E-09 runs stay reproducible). `baml_client/` is
  gitignored and regenerated via `npm run baml:gen` — **a reviewer must run that once** before the
  concept stage works (the source-of-truth is `baml_src`).
- **`src/config.mjs`** — `VCONCEPT_SCULPTURE_METHOD_ID = "vconcept-sculpture.v1"`.
- **`package.json`** — `bench:sculpture` script.

### Commits
1. `feat(sculpture): vConcept sculpture pure builders + scale wiring (unit-tested)` — config +
   `src/sculpture.mjs(+test)` + RDSPI docs.
2. `feat(sculpture): vConcept sculpture runner + BAML concept fn + moai smoke` — BAML fn, runner,
   concept tsx, README/.gitignore/script, the committed smoke run.

## Acceptance criteria — status

- **AC1 end-to-end from a term (`--subject "moai" --scale 32`).** ✅ Smoked live. doc (2109 ch) →
  concept image (Nano Banana, 21s) → 35-op build = **3414 blocks, 0 unmapped, schema-VALID** → 3/4
  `render-3q.png` + 8-frame rock turntable. The render reads as a moai (head, brow, red pukao, stone
  base) at 3/4 — a freestanding object, not a facade.
- **AC2 object-oriented prompts; `--scale` honored.** ✅ The concept fn (3/4 isolated object) and the
  build prompt (full x/y/z, "in the round", explicit "NOT a facade/relief/front plane") carry no
  facade orientation. Unit tests assert the facade-orientation tokens are ABSENT and x/y/z present.
  `--scale` flows into doc/concept/build; the smoke's build bounds reach y=31 for scale 32.
- **AC3 single-view limitation documented.** ✅ Stated in the build prompt (to the model), asserted by
  a unit test, and documented in `benchmarks/sculpture/README.md` (the case for image→3D / TRELLIS,
  and why the turntable rocks only the front hemisphere).
- **AC4 tests green; new pure logic unit-tested.** ✅ `npm test` = **312 pass / 0 fail** (302 baseline
  + 10). Scale wiring, spec validation, and prompt invariants are all covered.

## Test coverage & gaps

- **Well covered (unit):** `assertSculptureSpec` (accept + 6 reject cases), `sculptureScaleCaps`
  (monotonic, positive ints, bounds), `runIdForSubject`, `sculptureMetadata` (no `target`),
  `metadataPinLines`, both prompt builders (subject/scale/caps present; facade tokens absent;
  single-view limit present; metadata pins present).
- **Covered once (live smoke, not in CI):** the full pipeline + schema validity + render + turntable.
  Like `bench:temple-facade`, the live runner is intentionally NOT in `npm test` (metered + Gemini +
  GL). Its decision logic is the pure functions, which are tested.
- **Gaps / not tested:**
  - `run.mjs` glue (arg parsing beyond the no-arg usage path, `runBamlConcept` spawn, README
    regen) and `baml-concept.mts` have no unit tests — they mirror proven facade equivalents and are
    exercised by the smoke, but a future refactor could regress them silently.
  - Only ONE subject/scale was smoked. The 7 other E-13 subjects (T-036-*) and the scale sweep
    (T-037-*) will exercise breadth; the fidelity frontier (angular vs thin vs organic) is a
    prediction, not yet measured.
  - No automated check that the concept image is doc-only/object-shaped — it is a Nano Banana output.

## Open concerns / notes for the reviewer

1. **`baml:gen` is a required build step.** `baml_client/` is gitignored; a fresh checkout must run
   `npm run baml:gen` before `bench:sculpture` (the concept stage imports `SculptureConceptPrompt`).
   `npm test` does NOT need it (the pure tests don't import the client).
2. **`metadata.target` deliberately unset.** Caught by the smoke: the live schema's `target` is an
   enum (`house|path|landscape`), so a subject term there fails AJV. The subject join key is
   `trial_id` (run id embeds the slug) + `summary.json`. Downstream curation (T-038-01) must join on
   those, not on `metadata.target`. (Instance of the known prompt-vs-live-schema gap.)
3. **Fidelity is moderate, by design for a v1.** The moai came out monochrome-leaning ("Monochrome-
   with-warm-crown monolith" — the model's chosen style) at 35 ops / 3414 blocks. The pipeline is
   sound; per-subject quality is the downstream builds' concern, not this archetype ticket's.
4. **Committed a 531 KB `concept.png`** as the reference-run evidence (transcript + turntable frames
   are gitignored). If the repo should stay lean, the root `.gitignore` could later add
   `benchmarks/sculpture/runs/` (as it does for temple-facade) to stop committing future runs.
5. **Rock vs full spin.** The turntable rocks ±40° about the 3/4 azimuth, never showing the imagined
   back — a deliberate honesty choice tied to the single-view limit, not a rig limitation
   (`renderOrbit` supports a full 360° spin if a future ticket wants it).

## Verdict
All four ACs met; `npm test` green at 312; the pipeline is proven end-to-end on a real subject with a
schema-valid artifact and recognizable renders. Additive only — no facade/schema/seam code changed.
Ready for the E-13 downstream build tickets to call `bench:sculpture --subject … --scale …`.
