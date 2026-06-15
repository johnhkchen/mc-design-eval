# Design — T-083-01 hollow-cottage-milestone

Decide how to chain the four dependency cores into one milestone build, how to produce the cutaway, how to
report both gates, and what to hand to E-12. Grounded in `research.md`: the cores exist and are tested; the
design choices are about **composition order, the cutaway mechanism, and honesty**, not new algorithms.

## Decision 1 — one chained runner, in-process, on a single artifact

**Options.**
- **(A) Re-run the four existing runners in sequence**, each reading the previous one's committed artifact.
- **(B) One new runner that chains the cores in-process** (raw → paint → seal → carve → fill), writing one
  milestone artifact + one report.
- (C) A new pure "pipeline" module that composes the stage functions, plus a thin runner.

**Chosen: (B).** A single `benchmarks/sculpture/hollow-cottage-milestone.mjs` (`milestone:cottage`). Rationale:
- The milestone's whole point is "**one** build, end-to-end through the 2.5-D layer." Re-running four runners
  (A) produces four *different-provenance* artifacts (spray-paint works on raw; hollow/floorplan work on the
  T-084 sealed/T-080 hollow files) — the half-timber paint would **not** carry into the hollow+filled build.
  (B) threads the *painted* artifact through seal→carve→fill, so the final build is exterior-accurate AND
  hollow AND room-divided — which is the milestone.
- (C) over-abstracts: the stage functions are already pure and tested in their own modules; a pipeline wrapper
  adds a layer with no new guarantee. The runner is the impure edge by design (mirrors all four siblings).

The runner is **self-sufficient** (the sibling pattern): if a precondition file is absent it derives it
in-process; if the shim/GL/`dwebp` is unavailable it degrades to a recorded gap, never a crash.

## Decision 2 — stage order: paint **before** seal/carve/fill

**Chosen order:** raw → **spray-paint** (skin recolor) → **seal** (coherence holes) → **hollow carve** →
**floorplan fill**. Rationale (from research §"the chain"):
- Paint is geometry-safe, so painting first vs last is render-identical on the *exterior*. Painting **first**
  is correct because the carve/fill then operate on the final skin, and the single committed artifact is the
  fully-finished build (a reviewer opens one file and sees everything).
- Seal closes only **coherence holes**, not designed openings (`watertight:false` persists) — so the front
  door survives for the perspective glimpse and for door-aligned floorplan reasoning.
- Carve before fill: the floorplan needs the **hollow** shell (T-081's precondition).

**Rejected:** paint last (after fill). It would require re-deriving the skin surface from the carved/filled
build and risks the paint touching a newly-exposed interior cell; painting the intact skin first is cleaner.

## Decision 3 — the cutaway is a render-only section via flatten-by-exclusion

AC #2 needs a from-below/cutaway that **shows the hollow interior and the N×M floorplan**.

**Options.**
- (A) **Perspective-through-the-door** only (free; already happens — T-081 residual). Rejected as the
  *primary*: shows one room, not the grid; not a clear section.
- (B) **Render-only section copy**: clip the final artifact with a plane, render the clipped copy. The real
  build is untouched.
- (C) A new GL near-plane clip in the renderer. Rejected: invasive renderer change for a presentation need.

**Chosen: (B), with two sections** (and (A) kept as a free bonus perspective):
- **`cutaway-plan`** — remove the roof (cells with `y` above the top-storey ceiling), render from **`top`** →
  the N×M grid of the upper storey, read from above. This is the clearest "shows the N×M floorplan."
- **`cutaway-section`** — remove the front half (cells with `z ≥ z_mid`), render from **`threeQuarter`** →
  stacked floors at the storey lines + grid walls, in cross-section, showing the hollow.
- **`from-below`** — the **`bottom`** ortho angle on the real (unclipped) build, for completeness (AC names
  "from-below"); honestly labelled (it sees the underside of the y=0 floor — a section is what reveals rooms).

**Mechanism.** The clip is exactly `carveArtifact(artifact, removeSet)` (shipped, tested) where `removeSet`
is every occupancy key failing the clip predicate. The only NEW pure piece is computing that set from a
plane. → new tiny module **`src/view/cutaway.mjs`**: `sectionKeys(occ, {axis, keep, side})` (pure,
deterministic, unit-tested), and the runner calls `carveArtifact(filled, sectionKeys(...))` for a
render-only copy. **Rule-3 honesty:** the section copy is never committed as the build; only its PNG is, and
the report states it is a render-only section. The **real** final artifact carries the `exteriorHeld` proof.

## Decision 4 — both gates in one report, each with a named residual

- **Exterior resemblance** (judgement path, craft side of the line): reuse `faceResemblance` + `acceptIfCloser`
  (T-079). Score the **+z front face** of the *grey-drift* build vs the *painted* build, both against the
  concept. Report `before → after`. **Named residual:** the E-22 cottage verdict was `drifted` with the gap =
  *material zoning @ upper-story walls*; spray-paint targets exactly that band, so the honest residual should
  now be **off the face** (e.g. side/roof has no concept reference — T-079's by-construction gap), satisfying
  the AC's "drifted with the face no longer the gap." If the gate is GL-blind, the splat *is* the concept
  truth (recorded as such, P14-safe), and the plaster `8 → ~315` count is the deterministic evidence.
- **Interior plausibility** (program path crossing into design, design side of the line): `gateFloorplan` —
  six hard constraints + the `openings-align` named residual (steered, not geometrically verified).

The report makes the **gate-switch explicit**: resemblance governs the exterior (there *is* a reference);
plausibility governs the interior (there is *none* — "break into rooms" is invention). This is the E-23
thesis, recorded as data, not just prose.

## Decision 5 — the metered ops are both tiers (the model-scoped AC)

The chain fires exactly two metered calls, one per tier — proving "ops model-scoped" on the milestone build:
- **light** (`claude-haiku-4-5`): the **hollowable-mass** detector over the 3-Q view (confirms carveable
  mass / flags seal blockers) — drives the carve's region/inset.
- **strong** (`PHASE1_MODEL_ID`): the **floorplan-author** over plan+elevation (the design reasoning) —
  steers the `FloorplanSpec`.

Spray-paint's splat path is deterministic (`--refine` stays off — it is the one metered call *not* needed to
make the milestone). Both calls go through `runTieredOp` with the routing table already pinned (T-082); the
report echoes `{op, tier, model, usage}` per call. Each degrades to a deterministic fallback (2×2 spec /
geometric mark) if the shim is down, so the *structure* of the run is provable offline.

## Decision 6 — E-12 handoff + design-learnings

- `pr/assets/cottage-face-before.png` / `-after.png` (the spray-paint front faces — grey-stone → half-timber),
  `pr/assets/cottage-multi-angle.png` (a montage of front/diag/3-Q via `magick montage`, the repo's existing
  tool), `pr/assets/cottage-cutaway.png` (plan + section), and a narrative `pr/assets/hollow-cottage.md`
  (pattern: `beyond-facade.md`).
- `docs/knowledge/design-learnings.md` gains a **## 2.5-D interaction sector (E-23)** section: view-matched-
  to-task; two paths (program vs judgement); the gate-switch (resemblance ↔ plausibility) at the craft→design
  line; the right-sized-model results + the scoping rubric; and where it over/under-reaches (the named
  residuals: the side-face by-construction gate, the steered `openings-align`, no stair, the perspective-
  through-door render delta).

## What is explicitly NOT done (scope guard)

No renderer change; no stair / vertical circulation; no geometric opening-alignment verification (depth pass —
future); no re-compaction of the flattened artifact into `box`/`fill` ops; no scoring/rating layer (E-04/05).
The milestone **integrates and reports**; it does not invent new capability.
