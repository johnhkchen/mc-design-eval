# T-134-01 — steep-pitch-construct — Research

Phase artifact 1/6 (RDSPI). Descriptive only: what exists, where, how it connects.

## 1. The ticket in one line

The concepts' roofs read steep (~55–63°); the stair block's native slope is 45°; the ticket wants
one new brush through the registry door realizing pitch classes >45° (2:1 minimum, mixed
full-block/stair courses), composing with the roof family, passing conformance, realized on the
barn with before/after renders at the gate azimuths. No judge runs; replay byte-identical.

## 2. The demand evidence (why >45° is real)

- **The brief**: the barn's run directory is literally
  `runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-...` — "steep gabled
  roof" is in the commission sentence. The concept image's gable end visibly reads near 2:1
  (apex rise ≈ 2× half-span in image space; inspected directly this session).
- **The sketch reads 45°**: `benchmarks/sculpture/form-sketch/barn.json` → `pitch: { class:
  "pitched45", dominantTiltDeg: 45, riseCells: 11, runCells: 11, eaveLayer: 9, ridgeLayer: 20 }`.
  This is the known TRELLIS proportion-flattening case; E-33's honesty rule (epic, "Honesty"
  paragraph) says **the concept is the contract**, the sketch is fallback.
- **Both committed barn programs** (`benchmarks/sculpture/recognition/barn.program.json`,
  `barn--saltcrag.program.json`) carry `roof.pitchClass: 1` — recognized from the flattened sketch.
- T-133-01 (measured-proportions) has **not landed** (no `docs/active/work/T-133-01/`); the ticket
  anticipates this ("or the sketch directly"). The sketch itself does *not* demand >45°; the
  concept and brief do. This divergence must be recorded honestly in the realization record.

## 3. The roof realization chain (as built)

```
concept.png + conditioned sketch
  → recognize.mjs (LLM) → building-program/v1 (roof: {idiom, ridgeAxis, pitchClass, fieldRole, …})
  → src/recognition/program.mjs validate: roof.idiom ∈ ROOF_LAYOUTS ∩ pack.idioms ∩ registry
       constructs (program.mjs:192-202); pitchClass ∈ pack.proportions.pitchClasses
  → src/recognition/compile.mjs:200-230 — spec.pitch = m.roof.pitchClass verbatim; footprint
       expanded 1 cell past each eave edge; ridgeY = eaveY + max(1, round(pitch·⌊(perpSpan−1)/2⌋))
  → IDIOM_REGISTRY (src/pack/idiom-registry.mjs) — roofGableConstruct (lines 118-127) builds a
       2-sided gableRecord (lines 91-111, private to the registry file) and calls
  → generateRoof (src/view/roof-generate.mjs:191-259) — per-column heightfield (min-of-planes via
       roof-fit's evalSideHeight, capped at ridge.y, roundHalf-quantized), SOLID wedge from
       bandFloor up, stair tread on whole-step edges (facing uphill, half=bottom; T-097 CARD_ROWS
       vocabulary), slab on half-steps, full block elsewhere. capKeys mark the ridge cap course
       (T-109); `ends` (fitted verges) trim columns and mark sheet (surface-course-only) strips
       (T-108). Program gables are straight-only (cornerEligible=false; T-112 gating).
```

Key surfaces touching the pitch vocabulary:
- `src/pack/style-pack.mjs:173-176` — `REALIZABLE_PITCHES = new Set([0.5, 1, 2])`; error text:
  "outside the generator vocabulary (0.5 slab, 1 stair, 2 steep)". **Pitch 2 is already claimed**
  realizable by the pack validator — but see §4: nothing proves it.
- `packs/rustic.json:135` — `pitchClasses: [1]`. `packs/saltcrag.json:419` —
  `pitchClasses: [2, 1, 0.5]` (saltcrag *declares* steep; its README names "steep thatch").
- `src/recognition/prompt.mjs:74` and `src/factory/backlog.mjs:34` — prompts embed the pack's
  pitch classes ("your pitchClass MUST be one of these").
- `src/recognition/program.mjs:38-42` — `ROOF_LAYOUTS` has exactly `roof.gable`, `roof.hip`,
  `roof.pyramid`. (`roof.thatch` is registered but not program-routable — precedent that a roof
  brush can exist behind the door without ROOF_LAYOUTS wiring.)

## 4. What pitch >1 emits today (empirical probe, this session)

`roofGableConstruct` accepts any pitch > 0 (gate at idiom-registry.mjs:123). Probed on a 9×7
footprint, ridge along x, profile at mid-ridge:

- **pitch=1**: tops `y0 stair, y1 stair, y2 stair, ridge y3 planks` — the proven 45° course.
- **pitch=2**: tops `y0 stair, y2 stair, y4 stair, ridge y6 planks` — stair tread atop every
  slope column, one exposed full-block riser between treads. **This is the canonical Minecraft
  2:1 mixed full-block/stair family, already emitted by the legacy whole-step-edge rule**
  (roof-generate.mjs:212: `at(d) <= h-1` is satisfied by a 2-drop; :213 uphill `>= h+1` by a
  2-rise).
- **pitch=3**: same shape with two exposed risers per tread (3:1, ~71.6°).
- **pitch=1.5**: irregular alternation `stair, slab, stair, slab` (roundHalf lands half the
  columns on half-steps) — a serrated mix, not a recognized stepping family.

So the mechanism exists but is **unnamed, untested, and ungated**: zero tests exercise a program
roof at pitch ≠ 1 (only `roof-generate.test.mjs:85` uses pitch 2 — for a *hip-fit* record, and
`roof-fit.test.mjs:282` for a fitted hip pitch); no preview card shows it (both `gable-ridge-*`
card specs omit pitch → default 1); no construct declares which classes are realizable vs
refused; pitch 1.5 silently emits the serrated mix (an approximation, exactly what the AC
forbids).

## 5. The registry door (what a brush must carry) — T-128 contract

`IDIOM_REGISTRY` (idiom-registry.mjs:225+) is the only door (`brush-door.conformance.test.mjs`
enforces). Every entry: `kind` ("construct" → uniform spec→{cells,…}), `generate`, `source`,
`tests` (file must exist and name the brush), `composition` (`CONSTRUCT_IO` = consumes ["spec"],
emits ["cells"]), `preview.card` → committed `IDIOM_CARD_SPECS` ids (src/pack/idiom-card.mjs:31+),
`paramsSchema` (style-level properties only, nothing required). Freshest door example:
`roof.thatch` (T-132): module `src/view/roof-thatch.mjs` (pure, fail-loud, byte-stable, full-cube
emission, exported MIN constant), tests `src/view/roof-thatch.test.mjs` (TH1–TH7: identity
invariants, refusal gates, byte-stability, determinism), card spec id `"thatch"`, SYNTH_SPECS
entry in `idiom-registry.test.mjs:25`, catalog regenerated (`npm run brush:catalog` →
`benchmarks/sculpture/brush-catalog/`), brush-count baseline updated **19 → 22 with growth-history
comment** (T-132; next growth → 23). Catalog coverage pin: `catalogCoverage()` asserts every
registered brush plots.

Registry growth side-effects (all landed T-132, reusable verbatim): `registryDigest()`
(brush-catalog.mjs:170) feeds formation `registry_state`; offline formation replay re-derives
ownedNames from the **registry-as-recorded** (`ownedNamesFromRegistryDigest`, formation.mjs:406)
so committed factory records survive registry growth. Adding a brush is a *known-safe* operation
with a checklist; the failure modes are already journaled.

## 6. Composition partners on steep courses (AC #2)

- **Ridge caps**: `capKeys` marks columns whose surface equals roundHalf(ridge.y)
  (roof-generate.mjs:166, 253-256). compile's ridgeY formula keeps cap alignment for both span
  parities at pitch 1; parity behavior at pitch 2/3 is untested.
- **Verges**: a gable carrying `ends` trims past the verge tip and marks sheet columns
  (surface-course-only, open underside) — roofHeightfield:158-159. Untested at pitch >1.
- **Gable ends**: solid wedge infill fills to the ridge for free (file header, roof-generate.mjs:8).
  The *program* path realizes gable-end **walls** via compile (masses), the roof's own end faces
  are the wedge's solid cross-section. Untested at pitch >1.
- **Dormers**: compile (compile.mjs:231-258) seats dormer specs at `eaveY+1` on the wall plane —
  cheeks must embed in the main roof's solid courses; known quirks journaled (1×1 aperture to
  protect the ridge connection; eave-seated dormers flood — dormer-construct sealing memory).
  A *steeper* main roof has more solid mass behind the wall plane at dormer height, so embedding
  should improve, but nothing tests it.
- **Conformance courses-even**: `coursesEvenCheck` (src/pack/conformance.mjs:50-79) judges
  y-courses single-material per declared band unless `mixed: true`; declarations come from the
  compiled workshop program (`workshopProgram.declarations`, seed.mjs:108-111 — every cell of a
  `roof.*` element censuses as roof, per the T-106 consumption-plan comment). At pitch 1 roof
  courses already mix stairs+field, so the roof band's declaration already tolerates the mix;
  at pitch 2 the per-course composition changes (riser-only courses are pure field; tread courses
  mix) — needs an explicit test that the check still passes.

## 7. The barn realization & render tooling (AC #3)

- Subjects registry: `durable-skin.mjs` SUBJECTS — barn def at :229 (concept path, glb, scale 48).
- Committed chain artifacts: `recognition/barn[--saltcrag].{program,artifact,record,prompt,replies}`,
  `workshop/barn[--saltcrag]/final-artifact.json`, multi-angle records + 4-view sheets.
- Pure seeding: `seedWorkshopProgram({program, pack, budget})` (src/workshop/seed.mjs:103-114) —
  compile → realize → conformance, deterministic, no LLM. This is the no-spend path to a barn
  build.
- Evidence-runner precedent: `benchmarks/sculpture/roof-program.mjs` (E-27/28 roof-as-program) —
  impure wiring only; pure core run twice, sha256-compared; `--repro`/`--offline` re-prove;
  best-effort GL renders; before/after frames to `pr/assets/frames/roof-<subj>-{before,after}.png`;
  durable record `roof/<subj>.{json,md}`. Gate azimuths: `MULTI_ANGLE_GATE.azimuths =
  ["+x+z","+x-z","-x-z","-x+z"]` (45/135/225/315°, elevation 30°) in src/config.mjs.
- **Stairs lens**: roof-program.mjs's header note ("viewer meshes NO stair block") is stale —
  T-107 resolved it (on-disk prismarine-viewer patch + postinstall + lens-guard tripwire).
  Stairs render. Re-verify at render time, never bump prismarine-viewer casually.
- Renders are evidence, never decision inputs (reproducibility excludes GL from decisions).

## 8. Constraints & assumptions carried into Design

1. Registry-only growth; brush count 22 → 23 through the door; catalog + card regenerated.
2. Pure construct: no GL/IO/Date/random; fail-loud; byte-stable order; `unmapped` empty (program
   gables emit straight-only stairs — already-proven states).
3. A refusal is a **named finding** (thrown with the class named), never an approximation —
   pitch 1.5's current silent serration is the anti-pattern to close.
4. No judge runs anywhere in this ticket; recognition is not re-run; committed
   programs/records/pins are never rewritten (pin-guard discipline).
5. Pack and prompt surfaces are sensitive: prompts embed pack pitch classes; formation/recognition
   records pin prompt SHAs. Any pack edit risks repro drift — to be weighed in Design.
6. `npm test` currently green at ~1924 tests (T-132 close); suite must stay green.
7. Same-ticket concurrency checked: no sibling work dir, no T-134 commits; clear.

## 9. Open questions for Design

- New named construct (e.g. `roof.gable.steep`) vs gating steep classes inside `roof.gable` —
  the AC's "brush count grows through the door" points at a new entry; what does it delegate to?
- Which classes are realizable ({2}? {2,3}?) and which refused (1.5, 2.5, ≤1)? What does
  `REALIZABLE_PITCHES` (style-pack validator) become, and is touching packs in-scope?
- Program-chain routing (ROOF_LAYOUTS + pack.idioms wiring) now, or deferred to S-133/S-136 with
  an element-level roof swap as the barn evidence path (the roof-program.mjs precedent)?
- Where does `gableRecord` live so a new module can reuse it without an import cycle
  (idiom-registry.mjs ← module ← roof-generate.mjs)?
