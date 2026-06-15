# T-037-04 — Research

Map of the codebase as it bears on this ticket. Descriptive, not prescriptive.

## What this ticket is

Epic E-13 / story **S-037** (the *scale study*). A **build ticket**: run the existing `vConcept`
sculpture pipeline on **"a pineapple"** at **scale 48** — the *large, high-resolution* build of the
**organic, patterned hero** — save all artifacts, and record a **fidelity-vs-concept** note framed for
the **16 / 32 / 48** comparison, plus a categorical judgment. It does **not** add or change pipeline
code — that was T-035-01 (`status: done`). It is one of four S-037 builds:
`T-037-01 moai@16` · `T-037-02 moai@48` · `T-037-03 pineapple@16` · `T-037-04 pineapple@48` (this).

The story's question: **how does build fidelity (relative to the concept) track resolution, and does
it differ for angular vs organic forms?** This ticket supplies the **organic-large** data point — the
counterpart to T-037-02's *angular-large* (moai@48). Its contrast partners are the *organic-mid*
(T-036-03, run 004, already built) and the *organic-small* (T-037-03, scale 16, running concurrently —
partial run dir `012` on disk at the time of writing). The framing inverts T-037-03's: where 16 asks
"how much is lost at low block count," 48 asks **"does *more* block budget let the organic form +
cross-hatch pattern approach the concept, or does the gap persist regardless of scale (the organic
ceiling)?"**

## The comparison anchors (already built / building)

`benchmarks/sculpture/runs/004-vConcept-a-pineapple/` — same subject string ("a pineapple"),
**scale 32** (the mid anchor), ticket T-036-03 (`summary.json` read this session):
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

`benchmarks/sculpture/runs/012-vConcept-a-pineapple/` — **scale 16** (T-037-03, the small end), in
flight at research time (only `design-doc.md`, `design-doc.prompt.txt`, `concept.png`,
`build.prompt.txt` present; **no** `artifact.json`/`summary.json` yet). Its `summary.json` (once
complete) is the small-end datum this read links into the triptych. The slug collides with run 004 and
this run; **seq + `summary.json.scale` disambiguate** (see below).

The pineapple is the **scale-study hero**: this scale-48 build closes the organic leg — run 004's
canonical scale-32 midpoint and run 012's scale-16 small end are the comparators.

## The directly analogous sibling (the format template + a load-bearing prior)

`T-037-02` (moai@48, run **011**) is the structural twin of this ticket — same scale, same scale-study
charter, **already complete** with a full set of phase artifacts. It established the operational pattern
this ticket reuses verbatim: reuse the runner with `--scale 48`, write a dedicated `fidelity-read.md`
with a **16/32/48 cross-scale table** and a categorical judgment in **both** vocabularies, cite the run
by **seq + explicit scale** (slug collision), and **never re-run for looks** (a coarse/abstract build
is the commissioned datum).

Its finding is a **direct prior for this build and must be tested, not assumed**: the moai *regressed*
at 48 — fidelity was **non-monotonic (32 > 16 > 48)**. Two mechanisms it documented: (1) **effort fell
as the canvas grew** — output tokens *decreased* monotonically with scale (16,752 → 14,273 → **7,272**)
and the scale-48 build used only **33 coarse fill ops**, spending the larger budget on *bulk* not
*carving* (it dropped the eye sockets + pukao that carried the read at 16/32); (2) **value drift scales
with flat area** — `gray_concrete` rendered near-black, and a bigger flat slab has proportionally less
relief to break it up. The open question here: does the *organic* pineapple behave the same way (extra
budget → bulkier barrel, cross-hatch still washed out, crown no finer), or does an organic form with a
*repeating surface pattern* actually benefit from more rows to render the lattice in?

## The pipeline (already built, T-035-01)

Two layers, cleanly split.

### Pure surface — `src/sculpture.mjs` (SDK/GL-free, unit-tested in `src/sculpture.test.mjs`)
- `VCONCEPT_SCULPTURE` — frozen descriptor; `id = "vconcept-sculpture.v1"` (single-sourced from
  `src/config.mjs`, `VCONCEPT_SCULPTURE_METHOD_ID`).
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. **Scale 48 is well within range** (≤ 64).
  `assertSculptureSpec({subject, scale})` validates *before any metered work* (throws `sculpture: …`).
- `sculptureScaleCaps(scale)` → `{maxW, maxH, maxD}` all `= scale`. **At scale 48 the build is bounded
  ~48³** — 1.5× the linear resolution and **~3.4× the volume budget** of the scale-32 anchor
  (run 004's 3314 blocks), and ~27× the volume of the scale-16 sibling. This is the crux of the *large*
  end: the pineapple's two named stressors — the **diamond cross-hatch skin** and the **thin spiky
  crown** — have *far more* blocks to resolve in. The question is whether the model spends that budget on
  the pattern/crown (finer lattice, more individuated fronds) or on bulk (a bigger but no-more-faithful
  barrel), and whether value drift (orange-on-yellow) worsens with more surface.
- Framing constants are scale-independent: `SCULPTURE_VIEW_3Q = {az 45, el 30, fov 45}` (hero still)
  and `TURNTABLE = {centerDeg 45, amplitudeDeg 40, frames 24, el 30, fov 45}` (front-arc rock). The
  renderer fits the camera to the build's bounds, so a larger build still *fills the frame* — scale
  affects *block resolution*, not apparent size in the still. So 16/32/48 stills are directly
  comparable on detail, not size.
- `runIdForSubject(seq, subject)` → `"NNN-vConcept-<slug>"`. Slug here is `a-pineapple`; `nextSeq()`
  reads the runs dir at invocation. With **012 the highest on disk** (the in-flight scale-16 sibling),
  this run will be **≥ 013**. The run id does **not** encode scale, so this run's dir collides *by slug*
  with run 004 (scale 32) *and* run 012 (scale 16) — **three** rows with the same slug, distinguished by
  seq prefix + `summary.json.scale`. (Same disambiguation T-037-02 used for the moai's 003/010/011.)
- `metadata.target` deliberately omitted (live AJV enum is `house|path|landscape`); join key is
  `trial_id`/run id + `summary.json`. (Memory: *prompt-vs-live-artifact-schema*.)
- Prompt builders `composeSculptureDesignDocPrompt({subject, scale})` and
  `composeSculptureBuildPrompt({subject, scale, designDoc, runId, model})` both **take `scale`** and
  thread it into the budget guidance, so the scale-48 doc/build are told the larger budget.

### Live runner — `benchmarks/sculpture/run.mjs` (metered + GL; NOT in `npm test`)
Entry: `npm run bench:sculpture -- --subject "<term>" --scale <N> [--frames N] [--note "..."]`.
`parseArgs` defaults `scale = DEFAULT_SCALE (32)`, `frames = TURNTABLE.frames (24)`. `runVConcept`
chains: stage 1 design doc (`requestText`, claude `-p` shim) → stage 2 concept image (shells to
`baml-concept.mts` → Nano Banana / Gemini `pro`, BAML `SculptureConceptPrompt` in
`baml_src/conceptart.baml`) → stage 3 3-D build (`requestDesignArtifactWithImage`, AJV-enforced,
grounded on the single `concept.png`). Then `renderArtifact` (3/4 still) + `renderOrbit` +
`oscillateAzimuths` (rock turntable), then `transcript.jsonl`, `summary.json`, README regen.

## Boundaries & constraints (verified this session)

- **Live & metered.** Needs the `claude -p` shim (`~/.local/bin/claude`, present), `GEMINI_API_KEY`
  (`.env`, present), headless GL (`render/`). Cannot run under `npm test`; it is the integration test of
  the archetype at the large scale. `baml_client/` generated and present; no `baml:gen` needed.
- **Single-view limitation** — the build sees ONE 3/4 concept; back/sides are reconstruction. For a
  pineapple (near-radially-symmetric ovoid + radiating crown) this risk is **low** — it reads alike from
  most azimuths, the right call for a fruit in the round. At scale 48 the back gets more blocks too, but
  no back reference; watch for an over-elaborated or blank rear in the turntable.
- **Schema gate** — stage 3 throws on a malformed artifact; clean exit ⇒ schema-valid.
- **Concept value/contrast drift** (memory *concept-image-not-color-value-preview*) already bit the
  scale-32 pineapple — the orange diamonds washed out against yellow in *both* hue and value. At scale 48
  there are *more rows* for the lattice (could help the pattern register) but more flat surface for the
  drift to dominate (could hurt, per the moai@48 finding). Note in the read; do **not** "fix" the palette.
- **Fixed-azimuth lottery** — run 004 found the 45° hero shows a **corner** (worst angle for a
  cardinal-face pattern); the cross-hatch read best near-frontal (`frame.018`, az ≈ 5°). Expect to cite
  a cardinal turntable frame here too. (Azimuth lesson: dancing-man 002 / bow-and-arrow T-036-04 /
  moai@48 011.)

## Prior data points (the scale + breadth context this run extends)

- **004 pineapple @32** (organic anchor): 213 ops → 3314 blocks; `recognizable`; cross-hatch partial
  (washed), crown + body succeed; $0.99; ~382 s.
- **012 pineapple @16** (T-037-03, the small end): in flight; doc + concept present, no summary yet.
- **011 moai @48** (T-037-02, the angular-large twin): 33 ops → 6283 blocks; **`loose`→`failed`/`Weak`**;
  non-monotonic regression (effort *fell*, value drift dominated); $0.40; ~135 s.
- **010 moai @16 / 003 moai @32**: 732 / 2402 blocks; both `recognizable`/`Competent`.

These suggest **token/cost does not scale monotonically with `scale`**, and at the large end the model
may *under-spend* the budget. Record this run's ops/tokens/cost against run 004's 213 ops / $0.99 — a
*drop* in ops at 48 (as the moai showed) would be the organic echo of the moai's regression mechanism.

## Relevant memories

- *prompt-vs-live-artifact-schema* — `metadata.target` omitted; renders depend on the live schema.
- *concept-image-not-color-value-preview* — concept previews hue, not tonal value; the scale-32
  pineapple's orange-on-yellow diamonds already washed out. Directly relevant: the same palette
  re-evaluated here over *more* surface area.
- *reference-grounds-craft-not-color* — no reference photo here; the cross-hatch is the model's
  invention to render from the imagined doc.
- *scale-study-cost-and-slug-collision* — lower scale is NOT cheaper; same-subject runs collide by slug
  (join on seq+scale); angular form degrades gracefully (form before finish). This ticket tests the
  *organic* analogue at the *large* end.

## Open questions for Design

- Does **more budget close the gap** for the organic form, or plateau / regress (the moai@48 outcome)?
  I.e. is scale-48 *more* faithful than scale-32 (finer diamond lattice that finally reads, more
  individuated fronds, smoother ovoid), the *same* (form already saturated at 32, extra blocks just
  bulk), or *worse* (model under-spends like the moai, value drift dominates a bigger surface)? This is
  S-037's organic large-end thesis and the read must answer it against the observed pixels, not predict it.
- Does the **cross-hatch finally survive** at 48 (more rows to register the lattice) or stay washed
  (it's a *value/hue* problem, not a *resolution* problem — in which case scale won't fix it: the
  "organic ceiling")?
- How should the read **name and link** the comparison so T-038-01 curation can assemble the 16/32/48
  triptych, given the run id slug collides with runs 004 and 012 and does not encode scale?
- What is the categorical vocabulary? The read should be comparable to **run 004's `recognizable`** and
  to the moai legs' `Category` enum — report both, as T-037-02/03 did.
