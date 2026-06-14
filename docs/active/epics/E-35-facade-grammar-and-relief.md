---
id: E-35
title: facade-grammar-and-relief
type: epic
status: open
priority: high
depends_on: [E-34]
spec: "§1, §5, §6, §9"
stories: [S-145, S-146, S-147, S-148, S-149, S-150]
---

## Background (read this first — self-contained)

**Milestone rung: M1, the texture finish — "the house looks like its picture" in *surface*, the way
E-34 finished it in *proportion*.** E-34 straightened the ruler so `ridge:eave` is trustworthy; this
epic closes the other half of the glance. The M3 town composer (a street that belongs together)
multiplies whatever the surface gets wrong: a street of flat, mono-fill boxes reads as a row of
sheds, not a village. Same logic as E-34 — *fix the instrument and the brushes before town.*

**The evidence (2026-06-14 review).** Put the two latest builds beside their concepts:

- **Barn** (the project's *first composite PASS*, T-143-01) — concept: stone walls of cobble infill
  framed by smooth-stone pilasters, brick quoins at the corners, a stone plinth, a steep
  timber-shingle roof with a ridge line and a vented gable. The build that PASSED: a flat brown
  roof-tent on near-blank pale walls. No pilaster rhythm, no infill, no plinth relief, no ridge.
- **Cottage** (run 014 concept) — a Tudor half-timber: stone plinth ground storey, a *jettied* upper
  storey of cream plaster panels split by regular dark timber studs, deep overhanging eaves, a
  cross-gable with dormers, shuttered mullioned windows, a stone-and-brick chimney. The build: a flat
  pink box, plain gable, stub chimney, a one-block grey strip at the base.

**The headline: the frozen instrument passes a build the glance rejects on texture.** The gate (Stage
6) measures silhouette proportion, block-resemblance, and kit-presence — and is *blind* to the two
things that make the concept read: surface **grammar** (repeating motifs — studs, infill, pilasters,
quoins, courses, openings on a rhythm) and **relief** (blocks stepping proud/recessed of the wall
plane). Our walls are flat single-block planes; the concept's walls have rhythm and depth. That gap
*is* the difference between "Minecraft box" and "looks like the picture."

## Where this lives in the pipeline (documented — `docs/knowledge/pipeline-philosophy.md`)

The defect is split across three stages, and one of them structurally cannot help today:

1. **Stage 3 — Design (recognition).** The building program is *supposed* to carry the grammar
   ("openings on a rhythm; jettied timber-frame upper; stone plinth" — philosophy §Stage 3). Today
   the recognized program under-specifies it: it names bands and dominants, not the *rhythm* (stud
   spacing), the *fields* (infill between frame), the *corners* (quoins), the *overhang* (eave/jetty
   depth), or per-face placement on the faces the concept never shows.
2. **Stage 4 — Construction (brushes).** The articulation idioms are **missing**
   (`src/pack/idiom-registry.mjs`, 18 brushes). There is no `pilaster`, `quoin`, `infill-panel`, or
   `eave-overhang`; `jetty`/`dormer` constructs exist (`src/form/idiom-constructs.mjs`) but are *not
   wired into the program path* ("dormer/jetty/plinth not at all"). The one relief idiom that ships,
   **`clinker`** (`src/view/clinker.mjs`), is the existence proof: it emits courses that "sit PROUD
   of the wall plane … in front of EXISTING zone wall cells … no board can protrude past the rake
   line — by construction. Neither surface.fill (flat recolor) nor timber-frame can produce the lap."
3. **Stage 5 — The workshop (2.5-D spray-paint).** The E-23 interaction layer hands the model a
   per-face projection (`src/view/surface-grid.mjs`) and lets it paint — but **paint is recolor,
   never geometry**: `face-paint.mjs` is explicit, "PAINT IS A RECOLOR, NOT A MOVE … There is NO air
   op." `zone-fill.mjs` assigns **one dominant block per structural zone** (band0/band1/roof × sides)
   with keep-rules for secondaries — a color splat, not a pattern. So the workshop *cannot add
   relief*; it can only recolor a flat box.

**The crux.** Skinning is *recolor-on-fixed-geometry*, and the geometry is a voxelized smooth GLB
shell — a box. **Recoloring a box can never produce a pilaster proud of its infill or an overhanging
eave.** Relief must be authored as *construction* (add proud geometry on the shell; recess a field by
*not* fronting it — [[facade-recess-by-exclusion]], the no-air-op rule), exactly as `clinker` and
`jetty` already do. This is the recognition→idealization principle: build *more regular* than the
reference, with relief that is the generator's native output, not recovered from mesh noise.

## The textured GLB — how it fits, and the rule it narrows (DECISION needed; see Rule 4)

The user's direction: *use the fact that the GLB is textured; view it from various angles; apply the
tools we've built.* This sits against a ratified rule (philosophy §Stage 2): **"The mesh is evidence,
never substrate; its textures are never read."** That rule exists for one reason — *material
identity*: optics provably cannot separate brick from cobble, and TRELLIS textures are non-diegetic
amalgam. It is a rule about **deciding materials by colour**, and it stays in force: palette remains
diegetic, from the brief ([[reference-grounds-craft-not-color]]).

The proposed use is **orthogonal**: render the textured GLB at the *same angle* as each projected
face and read it for **spatial grammar** — *where* the studs/openings/pilasters/courses fall, and the
rhythm — on the faces the single concept view never shows (back, sides, roof). This is the **splat
method already anticipated in E-23** ([[twodee-interaction-sector]]: "Concept splat for the front;
textured-GLB splat for sides/roof the concept never shows"). It feeds *recognition* (Stage 3), not
material choice. So the rule is **narrowed, not overturned**: textures may inform *spatial
articulation layout*, never *material identity*. The philosophy invites exactly this — "challenge
specific stages with evidence." (Honest caveat: TRELLIS bakes detail as texture on a near-smooth
mesh, so the GLB gives *layout/rhythm evidence*, not measurable relief depth — depth is synthesised
by the brushes, idealised, never fit to the mesh.)

## Goal

**Walls show the concept's rhythm and depth — and the instrument requires them — so a flat box can no
longer pass.** Prove it on the two subjects the epic was built from.

```
FACADE-GRAMMAR RECOGNITION   the program carries per-face rhythm, fields, quoins, overhang, openings —
                             read from concept + textured-GLB angles (spatial only, never material)
RELIEF BY CONSTRUCTION        a shared op for proud/recessed surface geometry on the shell, generalised
                             from clinker/jetty; recess-by-exclusion, in-plane silhouette preserved
ARTICULATION BRUSHES          pilaster, quoin, infill-panel, eave-overhang; jetty/dormer wired into
                             the program path — each a registry brush with tests + preview card
RELIEF-AWARE GATE             a precondition/lens that SEES rhythm + relief; the flat mono-fill box
                             that passed today fails when the concept is articulated (identity-class)
RE-SKIN + RE-VERDICT          cottage (the half-timber poster child) + barn back through the loop;
                             the epic's only judge runs; does the texture gap close at the glance?
```

## Rules of engagement (binding)

1. **Relief is construction, never paint.** Surface geometry is added by constructs/passes that emit
   *in front of existing shell cells* (the `clinker` precedent) and recess *by exclusion* (no air op,
   [[facade-recess-by-exclusion]]); the in-plane silhouette is preserved by construction so the E-34
   ruler still reads true and the silhouette gate cannot regress. PURE modules (no GL/IO/Date/random),
   byte-stable placement order, idempotent on their own output — same charter as `clinker`.
2. **Brushes reach the workshop only through the registry door** ([[brush-door-export-not-allowlist]],
   E-32): new idioms land in `IDIOM_REGISTRY` with `composition`, `tests`, and a `preview` card;
   never widen an allowlist. New idioms decompose as backlog work-items (Stage F) where that fits.
3. **Grammar is per-STYLE and per-CONCEPT, never per-building constants.** Stud spacing, pilaster
   rhythm, overhang depth are recognised from the concept/GLB or carried by the pack — no magic
   numbers tuned to one subject. Palette stays diegetic (from the brief); the textured GLB is read
   for *spatial layout only*, recorded as such on every row that consumes it.
4. **The gate change follows identity-class discipline** (T-095/T-101/T-110/T-137/T-144 precedent):
   monotone proof (every committed verdict re-derives unchanged or is reported beside, never silently
   moved), both arithmetics where a threshold changes, the frozen judge contract (prompts, azimuths,
   severity grain) unmoved — the relief lens is a *precondition or aggregation*, not a re-judge.
   **DECISION — RATIFIED 2026-06-14:** the textured-GLB-for-spatial-grammar narrowing of the §Stage 2
   "textures never read" rule (material identity stays optics-free) is now standing architecture,
   recorded in `docs/knowledge/pipeline-philosophy.md` §Stage 2 and `design-learnings.md`. Every
   recognition row that consumes the textured GLB records it as *spatial-layout evidence*, never
   material; palette stays diegetic, from the brief.
5. **Inherited in full:** workshop/ruler mode split (the terminal story owns the epic's only judge
   runs); replay reproducibility (`--repro`/`--offline` byte-identical); reply policy (T-114);
   pin-guard with preflight (T-119, rotations only in the owning ticket, retired pins named); the
   `claude -p` subscription shim for all model calls, light tier via per-task `--model` for scoped
   detectors, never the metered API; run on main; `npm test` green.

## Candidate stories & DAG

```
S-145 facade-grammar-recognition ─┐
S-146 relief-by-construction ──▶ S-147 articulation-brushes ─┼─▶ S-149 re-skin-reverdict (terminal)
S-148 relief-aware-gate ──────────────────────────────────────┘
S-147 articulation-brushes ──▶ S-150 realistic-construction-gable-and-roof
```

*Added after the first live loop (2026-06-14): the deterministic E-35 slice shipped green but the
machine was left switched off (no real subject carries a facade; builds still flat) — **S-149 gains a
second ticket T-149-02** (live facade build + the band0 coverage unblock the cottage re-verdict
surfaced). And a construction-model defect distinct from surface texture: the roof is plotted as a
**solid triangular prism of roof material dropped on a wall box** (`roof-generate.mjs:271-281`), the
gable-end triangle reads as planks instead of the concept's stone (the declared `gableRole` is never
consumed), and there is no eave/verge overhang — **S-150** fixes the generator to build the way
construction works (wall envelope incl. gable ends, then roof covering as an overhanging skin), barn
as the proving subject.*

- **S-145 — facade-grammar-recognition.** Stage 3 emits a *facade-grammar* program: per-face rhythm
  (stud/pilaster spacing), panel fields (infill between frame), quoins at corners, course lines, eave
  overhang + per-storey jetty depth, openings on a rhythm — schema-validated against the pack. Reads
  concept + textured-GLB multi-angle renders for *spatial layout* on unseen faces (never material;
  the splat method, [[twodee-interaction-sector]]). Light tier for scoped per-face detectors; strong
  for the design judgement. Records which evidence (concept vs GLB) sourced each face.
- **S-146 — relief-by-construction.** The crux capability: a shared, tested surface-relief op that
  emits proud cells in front of existing shell cells and recesses fields by exclusion, generalised
  from `clinker`/`jetty`; in-plane silhouette preserved by construction (proven against the E-34
  proportion + silhouette gates: no regression). The 2.5-D layer gains a *read* of relief (depth was
  always recorded — `surface-grid.mjs`; now it is consumed), not a paint-time air op.
- **S-147 — articulation-brushes.** The missing idioms as registry brushes (tests + preview cards):
  `pilaster` (proud vertical strip on a rhythm), `quoin` (corner stepped accent), `infill-panel`
  (repeating stud+panel within a field — the thing `timber-frame` stops short of), `eave-overhang`
  (soffit extension at the roofline); plus wiring the existing `jetty`/`dormer` constructs into the
  program path. Built on S-146's relief op.
- **S-148 — relief-aware-gate.** The frozen instrument gains a relief/rhythm precondition or lens so
  a flat mono-fill wall fails when the concept carries articulation — calibrated from committed
  verdicts (the flat barn that PASSED is the anti-anchor; an articulated build must pass). Identity
  class: aggregation/precondition only, both arithmetics, judge contract unmoved. Parallel; proven in
  S-149.
- **S-149 — re-skin-reverdict (terminal).** Cottage (mandatory — the half-timber poster child) and
  barn back through the full loop with grammar recognition + relief brushes live; **this story owns
  the epic's only judge runs**; verdicts vs the committed E-34 baselines under the relief-aware gate
  with the legacy arithmetic beside; sheets beside concepts. The question: with grammar + relief +
  an instrument that requires them, does the texture gap close at the glance? *(Second ticket
  T-149-02, added after the first loop: the live facade build was never run — switch the machine on,
  and unblock the cottage's band0 coverage reject first.)*
- **S-150 — realistic-construction-gable-and-roof.** The construction-model defect, distinct from
  surface texture: the roof is a *solid triangular prism of roof material dropped on a wall box*
  (`roof-generate.mjs:271-281`), so the gable-end triangle reads as planks where the concept shows
  stone (the declared `gableRole` is never consumed) and there is no eave/verge overhang. Build the
  way construction works — **wall envelope first (incl. gable-end walls), then a roof covering as an
  overhanging skin** — barn as the proving subject; deterministic re-run + sheet, no judge run.

## Definition of done

- The program carries per-face facade grammar; records name the evidence (concept vs textured-GLB)
  per face; material identity stays optics-free (the narrowed rule, ratified in design-learnings + the
  philosophy doc).
- Relief lands by construction (proud + recess-by-exclusion); the in-plane silhouette is provably
  unchanged (E-34 ruler + silhouette gate: no regression); the new idioms ship through the registry
  door with tests + preview cards.
- The relief-aware gate fails the flat box where the concept is articulated and passes the
  articulated build; both arithmetics reported; the frozen judge contract unmoved; committed verdicts
  re-derive or are reported beside, never silently moved.
- The re-verdict recorded honestly vs baselines; sheets beside concepts; journal + E-12; `npm test`
  green; replay byte-identical everywhere.

## Orchestration notes

- S-145 (recognition) / S-146 (relief op) / S-148 (gate) are mutually independent seams (program
  vocabulary + multimodal read / construction op / gate aggregation) — parallel. S-147 (brushes)
  follows S-146 (needs the relief op). S-149 is terminal and owns the only judge runs.
- **Honesty.** If recognition off the textured GLB proves unreliable on the unseen faces (amalgam
  texture, baked-flat relief), the finding is recorded and the front-face concept carries the grammar
  with the back/sides idealised from the pack — *recorded, not forced*. If an articulated cottage
  still doesn't read at the glance, that is the finding, and it scopes the next rung before M3.
- **The one decision in flight** is Rule 4's narrowing of "textures never read" (spatial-only),
  already directed by the reviewer 2026-06-14 — to be *ratified in writing* (design-learnings +
  philosophy doc), the discipline this project applies to every architecture change.
