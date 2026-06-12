# T-134-01 — steep-pitch-construct — Design

Phase artifact 2/6. Options weighed against the research map; decisions with rationale.

## D1. What is the brush? — a named adapter over the proven core

**Chosen: new construct `roof.gable.steep` delegating to `gableRecord` + `generateRoof`.**

Research §4 showed the steep mechanism *already exists* in `generateRoof`: at integer pitch ≥ 2
the legacy whole-step-edge rule emits exactly the canonical mixed full-block/stair family (stair
tread atop every slope column, pitch−1 exposed full risers between treads). What's missing is the
*contract*: a name, a declared class vocabulary, refusals, proof, and a card. So the brush is a
thin adapter that owns the contract and delegates emission to the single source of truth.

- **Option A (chosen)** — `roof.gable.steep`: validates the steep spec (declared classes, named
  refusals, stepping-aligned ridge), builds the same 2-sided `gableRecord`, calls `generateRoof`,
  then **asserts the steep invariant** on the output (every non-cap slope column tops with a
  straight stair tread facing uphill; risers = pitch−1) — state-correct by construction *and*
  by post-check. Registry grows 22 → 23 through the door (AC #1).
- **Option B (rejected)** — widen `roof.gable`'s contract to own steep classes: no door growth
  (AC explicitly wants the brush count to grow), and it buries the realizable/refused declaration
  inside an existing brush whose committed uses are all pitch ≤ 1.
- **Option C (rejected)** — standalone emission loop (thatch-style own geometry): duplicates
  `generateRoof`'s stepped-wedge/cap/sheet logic, forking the one definition the cage, censuses,
  and ridge lessons (T-108/109/112) all hang off. "One definition shared" is a standing lesson
  (gableSurfaceHeight comment, roof-generate.mjs:66-68).

## D2. Class vocabulary — realizable {2, 3}, everything else refused by name

- **Realizable: pitch class 2 (2:1, ≈63.4°) and 3 (3:1, ≈71.6°).** Both verified to emit the
  clean stair+riser stepping (research §4 probe). 2:1 is the AC's named minimum and matches the
  barn concept's ≈2:1 gable end; 3:1 comes free from the same construction and gives style packs
  a tower/spire-adjacent class.
- **Refused, named (thrown, never approximated):**
  - non-integer classes > 1 (1.5, 2.5, …): the half-step quantization emits an irregular
    slab/stair serration (probed) — not a stepping family; refusal message names the class, the
    reason ("slab-serrated courses are refused by construction"), and the realizable set.
  - classes ≤ 1: not steep — the message points at `roof.gable` (1) / its slab class (0.5).
  - classes > 3: a >3:1 face reads as a wall, not a roof; refused with the same named shape
    (bound revisable by a future ticket — it's one frozen constant).
  - **steep hip / steep pyramid: not offered** (this brush is gable-only; declared in the module
    header and the refusal data). Hip corner states at multi-rise steps are unproven vocabulary.
- The declaration is **exported data**: `STEEP_PITCH_CLASSES = Object.freeze([2, 3])` plus the
  refusal reasons, and `paramsSchema.pitch = { enum: [2, 3] }` so the registry digest itself
  carries the vocabulary (packs/factory prompts read params from the digest).
- **Ridge must land on the stepping**: require `(ridgeY − eaveY) % pitch === 0` (named refusal
  otherwise). compile's formula `eaveY + round(pitch·⌊(perpSpan−1)/2⌋)` always satisfies this for
  integer pitch. An off-stepping ridge would silently flatten the last course into a pitch break
  — exactly the "approximation" the AC forbids. (This is deliberately *stricter* than
  `roof.gable`'s ridge-as-cap semantic; the steep read is the brush's whole identity.)

## D3. `roof.gable` is tightened to its proven domain

`roofGableConstruct` currently accepts any pitch > 0 and silently emits the unproven steep/serrated
shapes. With the named brush in place, keeping that second, silent door open contradicts "a
refusal is a named finding". **Tighten `roof.gable` to pitch ≤ 1** (gate + paramsSchema
`maximum: 1`), refusal message naming `roof.gable.steep`. Replay-safe: every committed program,
card spec, and replay path uses pitch ≤ 1 (research §4); only `roof-fit.test.mjs`/
`roof-generate.test.mjs` touch pitch 2 and they construct gable *records* directly, not this
construct. `roof.hip`/`roof.pyramid` are left untouched this ticket (steep hip is declared
not-offered; mutating two more sibling contracts widens blast radius for no AC) — recorded as a
known seam in review.

## D4. Where the code lives — own module, one shared record builder

`src/view/roof-steep.mjs` (module) + `src/view/roof-steep.test.mjs` (proof), the thatch/T-132
door precedent. To reuse the gable record without an import cycle
(idiom-registry → roof-steep → idiom-registry ✗), **extract `gableRecord` (and its `colsOf`
helper) from idiom-registry.mjs into roof-generate.mjs** and re-import it in the registry —
a pure move; emission stays byte-identical (existing registry tests prove it). roof-generate
imports only roof-fit, so the graph stays acyclic:
`roof-fit ← roof-generate ← {roof-steep, idiom-registry}`.

Registry entry mirrors the siblings: kind construct, `generate: roofSteepGableConstruct`,
`source: "src/view/roof-steep.mjs"`, `tests: "src/view/roof-steep.test.mjs"`, CONSTRUCT_IO,
`preview.card` ids (D6), paramsSchema `{ pitch: {enum:[2,3]}, blocks: BLOCKS_FRAGMENT }`.

## D5. Program-surface wiring — minimal now, demand-side later

- **`ROOF_LAYOUTS` gains `"roof.gable.steep": { ridge: true, gableEnds: true }`** — one data row
  making the brush program-routable the moment a re-seeded program (S-133) demands it. compile's
  idiom-keyed branches treat it exactly as gable (`allEaves` false, ridge required); `roofBlocks`
  behavior verified at implement.
- **No pack edits.** Pack JSON feeds recognition/factory prompts; editing committed packs risks
  prompt-SHA/repro drift for committed records (research §8.5). saltcrag already *declares* pitch
  class 2 — adoption of the idiom name into `pack.idioms` is a style decision owned by
  S-133/S-136 alongside re-recognition.
- **No compile routing logic** (e.g. auto-promoting `roof.gable`+pitch 2 → steep): with D3's
  tightening, a future program that demands class 2 must *name* `roof.gable.steep` — identity
  from language, explicit in the program, validated by the existing idiom gates. S-133 owns
  re-seeding.
- **`REALIZABLE_PITCHES` (style-pack validator) becomes `{0.5, 1, 2, 3}`**, message updated to
  name the steep family and brush. This validates pack *declarations* (saltcrag's `2` finally has
  a proven realization; `3` becomes declarable); it touches validator code, not pack data — no
  prompt surface.

## D6. Preview card + catalog

Three committed `IDIOM_CARD_SPECS` entries (both axes at the signature class, plus the 3:1):
- `gable-steep-z`: footprint 7×6, ridgeAxis z, pitch 2, ridgeY = 6 (span 7 → half 3).
- `gable-steep-x`: the transpose (orientation visible on the card, the dormer precedent).
- `gable-steep-3`: pitch 3 on a 5-span (ridgeY = 6) — the steeper class is *seen*, not implied.
ROOF_BLOCKS (spruce) like the gable cards. SYNTH_SPECS gains the minimal realization spec.
`npm run brush:catalog` regenerated and committed; brush-count baseline 22 → 23 with the growth
history comment extended (the T-132 precedent verbatim). Formation offline replay is protected by
registry-as-recorded (`ownedNamesFromRegistryDigest`, landed T-132) — re-run its tests to prove.

## D7. Composition proofs (AC #2)

Unit tests (in roof-steep.test.mjs unless noted), exhaustive over orientation where states vary:
1. **Orientation matrix**: ridgeAxis {x,z} × class {2,3} × span parity {odd,even} — column tops
   monotone ±pitch; every non-cap slope column tops with `{facing: uphill, half: bottom,
   shape: straight}` (all four facings exercised across the matrix); riser exposure = pitch−1;
   `unmapped`-safe states only (straight treads — already-pinned CARD_ROWS vocabulary).
2. **Ridge caps**: capKeys = one cell per ridge column (odd span), the 2-wide cap (even span);
   cap course is full blocks / the declared cap, never a tread.
3. **Verges**: a steep gable carrying fitted `ends` trims past the verge tip and the overhang
   strip stays surface-course-only (sheet), open underside — at pitch 2.
4. **Gable ends**: the wedge cross-section at the footprint bounds is solid to the ridge (no
   holes a gable-end wall would need to patch).
5. **Dormer on steep** (composition test beside the dormer's own): realize a steep main roof +
   compile-shaped dormer spec (wall-plane front, 1×1 light — the journaled quirks); assert dormer
   cheeks/ridge embed in solid wedge mass and the aperture stays sealed-niche (no orphan, no
   flood).
6. **Courses-even**: `coursesEvenCheck` over the steep emission with chain-shaped declarations
   (roof band, mixed vocabulary incl. stairs) **passes**; also asserted live on the barn evidence
   run's conformance verdict (D8).

## D8. The barn realization (AC #3) — program-level re-seed, evidence runner

**Chosen: new impure evidence runner `benchmarks/sculpture/steep-pitch.mjs`** (npm `steep:barn`,
`steep:barn:saltcrag`), the roof-program.mjs precedent (impure wiring only; pure core twice,
sha256-compared; --repro/--offline; renders are evidence).

- **Before** = `seedWorkshopProgram(committed program, pack)` — the committed barn program
  (pitchClass 1) through the unchanged seam. No LLM, no judge.
- **After** = the same program with only the roof patched in memory —
  `roof.idiom: "roof.gable.steep", pitchClass: 2` — through the *same*
  `seedWorkshopProgram`. compile recomputes ridgeY, gable-end infill, declarations, and the
  conformance verdict consistently (no element surgery, no derived-geometry drift). The barn has
  no chimney/dormers, so no ridge-coupled siblings move.
- **Rejected**: element-level roof swap on the compiled output — must hand-recompute every
  ridgeY-derived element (gable triangles, declarations bands) and can drift from the lowering;
  the program-level patch exercises the real seam end-to-end.
- **Pin discipline**: committed programs/records are read, never written; outputs land in new
  paths (`benchmarks/sculpture/steep-pitch/<subj>.{json,md}` + artifacts) + frames
  `pr/assets/frames/steep-<subj>-{before,after}.png` (4-view sheets at the gate azimuths
  45/135/225/315°, elevation 30 — MULTI_ANGLE_GATE config; render helper reused from the
  multi-angle/recognition tooling).
- **Subjects**: rustic `barn` (the M1 subject; "the barn" of the AC) **and** `barn--saltcrag`
  (the style whose pack already declares class 2). Both records committed.
- **Honest demand record** (research §2): record states the demand chain — brief says "steep
  gabled roof", concept gable end reads ≈2:1, the mesh-derived sketch says 45° (TRELLIS
  flattening; concept-is-the-contract per E-33 honesty rule), T-133 not landed. The record names
  pitchClass 2 as concept-demanded, sketch-divergent.
- **No judge runs**: conformance + silhouette steepening are read from renders/records by humans;
  the frozen gate stays with S-138.

## D9. Risks & mitigations

- **A pinned test enumerates ROOF_LAYOUTS / the registry count / REALIZABLE_PITCHES message** —
  expected; update the *tests* (baseline-with-history precedent), never committed records.
- **Stairs lens**: verify the T-107 prismarine-viewer patch is active before trusting renders
  (lens-guard tripwire exists); renders are evidence only.
- **GL availability**: renders are best-effort per the runner convention; the AC needs committed
  frames, so a GL failure is a stop-and-report, not a silent skip.
- **`roofBlocks`/compile idiom keying**: if any compile branch string-matches `"roof.gable"`
  exactly, the new idiom name must be added there — checked at implement (structure lists the
  grep).
- **Formation digest growth**: covered by registry-as-recorded replay (T-132); its tests re-run.
