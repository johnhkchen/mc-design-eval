# T-172-01 — FINDINGS

**The falsifiable claim held.** A covering-over-envelope roof + multi-ridge-per-mass makes the roof
read as a roof (not a plank mountain) and gives the cottage its two perpendicular gables, with no
wall-track closure regression. Each named failure mode either did not occur or was handled by a
reported fallback.

## Census — the prism is gone (AC #1)

Roof-field material (`spruce_planks` / `spruce_stairs` / `spruce_slab`) as a fraction of the whole
build, solid prism → covering (offline, `roofMaterialFraction`, no GL/model needed):

| subject   | solid prism | covering | Δ        | roof cells (cov / solid) | ridges |
|-----------|-------------|----------|----------|--------------------------|--------|
| cottage   | **77.7 %**  | **38.1 %** | −39.6 pp | 885 / 4 680              | 2      |
| barn      | **74.3 %**  | **26.2 %** | −48.1 pp | 1 560 / 8 736            | 1      |
| gatehouse | **60.9 %**  | **15.7 %** | −45.2 pp | 1 067 / 5 292            | 1*     |

\* gatehouse fell back to a single-bbox gable (registration ambiguous — see below).

Every subject drops from a roof-dominated prism (~61–78 %) to a covering well under the ticket's
~72 % bar. The whole-build cell count collapses too (e.g. barn 11 758 → 4 759) because the wedge
interior is now hollow air.

## Multi-ridge (AC #2)

- **cottage** — `registerRect` cov=0.94, axis=identity (not ambiguous). Two gables built from the
  recognition program: `main` ridge=z@21, `wing` ridge=x@21 — **two perpendicular gables**, composed
  by `generateRoof` with a valley at the intersection. `beside-cottage.png`: an L-plan gabled cottage
  beside the Tudor concept; the cross-gable reads in the oblique views. The plank mountain is gone.
- **barn** — single mass, ridge=x@24, cov=0.81 identity. `beside-barn.png`: one clean spruce gable
  over the stone walls beside the steep-gabled tithe-barn concept.
- **gatehouse** — `registerRect` flagged **AMBIGUOUS** (near-square footprint, scale 1.73/1.67, axis
  near-tie). Per the design, this is the falsifiable claim's "per-mass ridges don't register" branch:
  the runner logged it and fell back to a single-bbox covering gable. The prism is still killed
  (60.9 % → 15.7 %); multi-ridge was simply not applicable to a single near-square mass anyway.

## Closure — no wall-track regression (AC #3)

`closureOf` of the kept wall-band ring (computed from the eave-layer columns):

| subject   | closureOf | note |
|-----------|-----------|------|
| cottage   | 0.452     | the cottage shell as carved; unchanged by the roof |
| barn      | 0.701     | sparse colonnade (the S-160 `barn--saltcrag` envelope gap — a WALL seam) |
| gatehouse | 0.615     | unchanged by the roof |

The roof construction **never touches the wall cells** (the carve keeps `y ≤ eave` verbatim; the
covering only authors `y > eave` roof/gable-end cells). So these closure numbers are properties of the
*input* shells, not of this change — there is **no closure regression** by construction, and the unit
test `"covering preserves gable-end walls + footprint closure"` pins the footprint perimeter invariant
exactly. The barn's 0.70 is the pre-existing envelope gap owned by the wall track (S-160), reported
honestly, not introduced here.

## Watertightness (the named steep-roof risk)

The riser-seal covering depth (`coverFloor = clamp(minNbrTop+1, floor, top)`) is watertight at every
pitch by construction; the unit test `"covering pitch 2 stays watertight: every riser is sealed (no
daylight column)"` proves it independently of the implementation. In the renders the slopes read
solid; the only open surfaces are the eave/verge undersides (the declared `sheet` exclusion — an
overhang is *supposed* to be open beneath). No reopened narrow-roof coverage seam was observed at the
tested pitch (1).

## What did NOT move (reported, not papered over)

- **The metered crater is NOT in this ticket.** Scoring is gated behind `--score`; I did not spend
  model tokens. Whether the faithful, now-non-prism build separates matched ≫ wrong-style is
  **T-173-01**. This ticket delivers the roof form + the census/closure proof, nothing about the score.
- **The `compile.mjs::roofBlocks` prism is a separate seam.** The *faithful recognition* gatehouse
  (`recognition/gatehouse.artifact.json`, T-171) is a `dark_oak_planks` prism via `roofBlocks`, NOT
  `generateRoof` — it goes solid because the model picked a roof field outside the pack's stair-course
  family (a family-resolution problem). The ticket named `roof-generate.mjs`; that prism is killed.
  Wiring `generateRoof`'s covering into the compile/realize path additionally trips the
  not-yet-`gableWallKeys`-aware conformance gate (T-150-01 review) and needs a judge-pin rotation —
  out of this ticket's scope, **reported as a remaining seam** (see review.md handoffs). T-173-01
  should decide whether to repoint the referee at the `roof-covering` build (which uses the fixed
  `generateRoof`) vs the `roofBlocks` recognition build.
