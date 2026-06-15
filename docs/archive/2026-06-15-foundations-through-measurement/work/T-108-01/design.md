# T-108-01 gable-and-verge-fit — Design

## The problem, restated from the data

Two distinct defects at the gable ends, both visible in the committed records:

1. **The end position is the blob's, not a fit.** The gable footprint inherits the regularized
   blob's extent (`gablesFromRecord` unions plane extents + fillBetween). Cottage main gable:
   footprint z −16..15 vs gable walls at z = ±12 — a 3–4 cell overrun at both ends.
2. **Everything in the footprint is filled solid from bandFloor.** `generateRoof` has no wall
   envelope: columns past the gable wall fill bandFloor→surface, so the +z end is an 11-cell-tall
   solid cliff three cells past the wall — read by the judge as `massing @ upper storey gable ends`.
   There is no verge (thin overhanging rake course) and the eave courses run to the blob extent
   instead of terminating.

What a real gable end is: a **gable-face plane** (the triangle infill, solid), a **verge/rake
course** (a thin sheet overhanging the face by the fitted overhang, stepped stairs/full blocks),
and **eave terminations** (the eave course ends where the roof ends, with an open underside).

## Options considered

### A. End-face fit in mesh space + envelope-aware generator (CHOSEN)

Fit, per gable end (lo/hi along the ridge axis), three quantities from the GLB **in voxel space**
(mesh triangles transformed by the same `aabbAlignment(mesh.bounds, occ.bounds)` the decomposition
runner uses — reconstructed deterministically from committed bounds):

- **gable-face plane** — area-weighted mean ridge-axis coordinate of end-facing triangles
  (|normal·dir| ≥ cos 25°, the `glbFitForPlane` default) in the roof band (y ≥ gable bandFloor),
  within the gable's plan window; **fit error = area-weighted RMSE** of those triangles about the
  plane (AC a's recorded error).
- **wall plane below the band** — same selection with y < bandFloor, outermost cluster (within one
  voxel of the extreme vertex — quantization unit, not a tuned constant).
- **roof end (verge tip)** — extreme vertex coordinate of roof-band triangles in the window.

Then **anchor positions to voxel reality and take only differentials from the GLB** (the E-27
sourcing principle; aabb-affine absolute offsets are unreliable):

```
faceCoord  = wallSlab.value + round(glbFace − glbWall)     # gable-face plane, as-built-anchored
endCoord   = faceCoord + round(glbRoofEnd − glbFace)       # verge tip = face + fitted overhang
```

Sanity gate, purely geometric (no constants): `wallSlab.value ≤ faceCoord ≤ endCoord ≤ as-built
footprint end` — the blob contains the truth (voxelization spreads outward) and the wall bounds it
from inside. Any violation, a missing wall slab, or no measurable triangles → that end is **not
fitted**: named finding, as-built end stays (E-28 Rule 2 — never an invented shape).

Generator: columns beyond `endCoord` are **not generated** (but still carved — see below); columns
in `(faceCoord, endCoord]` get **sheet fill** (the surface course only: stair/slab/full at the
surface, open underside — the verge and the eave-corner termination fall out of the same rule);
columns ≤ `faceCoord` keep the solid wedge (the gable-end triangle infill is the wedge's end face,
now standing exactly on the fitted face plane).

Cage integration: the end-fitted gables become **new leading rungs of the existing attempt ladder**
(end-fitted × {as-fitted, voxel-pitch} × {hips-as-detected, gable-ends}), with the current four
rungs kept verbatim as the fallback tail. The cage (IoU vs GLB at 4 azimuths, closure no-regress,
chimney protect) arbitrates, exactly the T-104 mechanism; all rungs rejected → input stands.

### B. Measure ends from ortho GLB silhouettes (REJECTED)

`rasterizeSilhouette` at `left/right/front/back` then invert the camera projection to recover voxel
coordinates. Indirect (projection + raster quantization on top of alignment error), and the existing
precedent (`glbFitForPlane`) already fits in mesh-triangle space. Nothing it measures that A doesn't.

### C. Carve-to-wall-plane without a GLB fit (REJECTED as primary; survives as the sanity floor)

Trim ends to `wallSlabs.value` + a fixed 1-cell verge. Simple, but the overhang would be an invented
constant, not a fit — violates Rule 2 and the AC's "fit error recorded". The wall slab does serve as
the **anchor and inner bound** in A, and "as-built ends" remains the ladder's honest fallback.

### D. Per-voxel patching of the blob ends (REJECTED)

Editing the residue directly violates E-28 Rule 3 ("construction, not patching") and re-opens the
E-15 lesson (surgical edits can't hill-climb silhouettes).

## Decisions and their grounds

1. **New pure module `src/form/roof-end-fit.mjs`** rather than growing `roof-fit.mjs`:
   roof-fit is deliberately record-space (no mesh, no alignment); end fitting consumes the mesh.
   Same boundary the codebase already draws between `component-decompose` and `component-glb-fit`.
2. **Carve set ≠ generate set.** Today `judgeVariant` carves `gen.heights` keys ≡ footprint (the
   generator fills every footprint column). With trimmed ends the blob past `endCoord` must still
   be carved or the residue stays. The swap will carve the **sane gables' untrimmed
   `footprint.cols`** (identical set for legacy rungs — a no-op there) and generate the trimmed
   set. The roof-band census runs over the carve set, so vanished residue is measured.
3. **Sheet fill only in the end-overhang strip, not on the slope-side eaves.** The slope-side eave
   fill is 1–2 cells deep, passes at 135°/225°, and converting it to sheet would add full-block
   census exposure across every eave line (risking the declared spike budget) for a region the
   verdicts don't name. The named offenses — gable ends, verges, eave/verge corner terminations —
   all live in the end strips. Scope discipline; S-109 owns ridge/upper-edge work.
4. **Census budget stays a formula**: verge tip courses end in cells with 4 exposed faces by
   construction (open underside + open outward face), exactly like ridge-line ends. Budget becomes
   `6·gables + 2·fittedEnds` — geometric, declared, shared across subjects; recorded in the run.
5. **Ladder ordering**: end-fitted rungs first (they are the better-fitted hypothesis), legacy tail
   unchanged, dedup by an extended shape key (pitch + hip + ends). Gatehouse's committed accept
   (`voxel-pitch-gable-ends`) remains reachable as the tail; if an end-fitted rung now wins, that
   is the cage doing its job. Hip-demanded (unsuppressed) ends are not end-fitted — a hip end is a
   sloped plane, not a face; suppressed-hip ends are eligible (the gatehouse case the ticket names).
6. **45° joins the runner's evidence angles** (`EVIDENCE_ANGLES` gains `+x+z`): the AC requires
   before/after at 45° and 315°; today the runner only renders 135/225/315. Frame copies for the
   epic sheet at 45° and 315° (`roof-<s>-end{45,315}-{before,after}.png`).
7. **Material of the gable triangle stays the roof field block.** Material identity is the skin
   seam's job (E-26 component-fed skin; the 45° material-zoning *minor* is not this ticket). The
   massing/form majors are geometry — this ticket's lane.
8. **`form @ roof across the whole top` (45°) is only partially addressable here**: the west-wing
   planes (roof-1/5/6/7) are unfitted regions whose regularized mass stays by design — S-109's
   silhouette-residual pass owns them. This ticket addresses the main + cross gables' ends. Named
   so the milestone doesn't over-expect.
9. **Determinism unchanged**: end fit is pure (mesh + record + alignment in, gables out); the
   runner's double-run/byte-identity, `--repro`, `--offline` conventions carry over; the record
   schema gains `endFit` fields (additive — offline re-assert logic untouched).
10. **No re-judging**: only `roof:cottage` / `roof:gatehouse` run here. Reconstructed records keep
    their T-107 verdicts; pin drift is the chain's loud, expected signal when T-111 re-runs.

## Risks, named

- **aabb-affine scale error** along the ridge axis (~3% on cottage z: scale 32.001 over 32 cells)
  is second-order across 1–4-cell differentials — and the cage IoU + the geometric sanity bound
  cap the damage; worst case a rung is rejected and the as-built end stands, named.
- **Decimated end faces**: a TRELLIS gable end can be 2 triangles; the normal-gated selection with
  `minTriangles 1` (a face plane is well-posed from one triangle's plane, unlike a gradient fit)
  plus the sanity bound keeps this honest. If selection is empty → not fitted, named.
- **Cross-gable ends bury into the main wedge** (cottage cross gable ends at x −1 inside the
  building): per-column MAX composition already handles burial; an end fit that lands inside
  another gable's mass simply changes nothing visible — fit recorded, geometry composed.
- **Spike-budget regression on gatehouse** (hips suppressed → both ends eligible): budget formula
  extension is declared; `--repro`-style verification plus the live census in the run record
  proves it before commit.

## What Design hands to Structure

New: `src/form/roof-end-fit.mjs` (+ test). Modified: `src/view/roof-generate.mjs` (ends-aware
fill), `src/view/roof-swap.mjs` (carve set, ladder rungs, budget data, record fields),
`benchmarks/sculpture/roof-program.mjs` (alignment + end fit wiring, evidence angles, record/md,
acceptance budget), their tests. Re-run `roof:cottage`, `roof:gatehouse`; commit records + evidence.
