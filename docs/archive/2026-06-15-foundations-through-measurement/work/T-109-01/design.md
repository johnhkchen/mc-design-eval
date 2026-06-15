# T-109-01 ridge-and-silhouette-fit — Design

Three deliverables (ridge construction, upper-edge terminations, silhouette-residual pass), each
with options weighed against the research map. Governing doctrine: positions anchor as-built, the
GLB supplies differentials/arbitration (E-28 Rule 2); hypotheses are ladder rungs judged by the
cage, not tuned constants (T-104 mechanism); reuse the cage's checks, never re-implement (Rule 2).

## D1 — Ridge construction

### Options

**A. Absolute mesh-space ridge height** (aligned GLB apex y → ridge.y). Rejected: vertical
aabb-affine maps the mesh top onto the *blob's* top (spike-inflated occ.bounds) — the exact
absolute-offset unreliability the end-fit module documents (offsetDelta up to 4.4 cells).

**B. Pixel-space fit** (silhouette apex). Rejected: crosses two camera framings + normalization;
strictly more machinery than A for the same absolute-offset exposure.

**C. Plane-intersection ridge as a ladder hypothesis + mesh-space apex line as recorded fit
evidence.** Chosen. The gable's two side planes are already *fitted* (pitch glb-first under the
agreement gate; eave anchored as-built) — their intersection **constructs** the ridge height and
position from fitted parameters instead of inheriting the blob top (`p.ridge.y` mean, today's
source, and the known cottage "apex shortfall" inconsistency). Under glb-sourced pitches this IS
the GLB-fitted ridge in the project's own parameter-sourcing doctrine; under voxel pitches it is
the declared fallback flavor — and the ladder already carries both flavors. The cage arbitrates.
The mesh-space apex line (slice-cluster over `alignedTriangles` in the gable window) supplies the
AC's recorded fit: **height** (evidence value + delta vs both hypotheses), **direction** (slope of
the apex line along the ridge axis, ≈0 for a sane ridge — recorded in degrees), **length** (apex
cluster span; cross-checked against the end-fit's tip-to-tip span), **rmse** (cluster apex spread).
Mesh length/direction are span/slope *ratios* — robust under aabb alignment in a way absolute y is
not; height from the mesh is recorded as evidence, never applied absolutely.

### Construction (cap courses)

`generateRoof` already realizes the apex in the E-27 vocabulary (full course at integer ridge,
slab half-step at a half) — what is missing is that the ridge is *incidental* (per-column
heightfield top) rather than a declared construction. Change: the generator marks the **cap
region** — columns whose surface equals the owning gable's ridge.y, within the fitted span — and
emits it as a tracked cap course (`capKeys`, `counts.cap`; slab on halves exactly as today, states
unchanged, so the unmapped gate continues to prove every placement). Ridge-line straightness and
length already follow from construction: `gableSurfaceHeight` is constant along the ridge axis and
the T-108 end trim terminates the line at the fitted verge tips; the new fit makes the *height*
fitted too and the record makes the cap explicit. No new block shapes → no new lens risk.

### Ladder integration

New pure `src/form/roof-ridge-fit.mjs`:
- `ridgeFromPlanes(gable)` — intersection of the two fitted side planes: `y*`, position `v*`,
  residual; pure arithmetic on side params.
- `fitRidgeLine(gable, tris, opts)` — mesh-space apex cluster (slice per ridge-axis cell in the
  footprint window, band-floor-gated; highest 1.0-gap cluster, the end-fit `clustersAlong`
  pattern): `{height, slopeDeg, span, length, rmse, slices}`.
- `ridgeVariant(gables)` — gables with `ridge.y = roundHalf(y*)`, geometric sanity gates (above
  both eaves + 0.5; `v*` inside the run window — no constants); insane → unchanged + named
  finding. Non-mutating, like `pitchVariant`.

`swapRoof` prepends ridge-intersect flavors of each existing candidate (end-fitted and tail rungs
alike), dedup'd via `pitchKey` extended to include `ridge.y` — as-built-ridge rungs remain the
honest tail, so the worst case is exactly today's geometry. Ladder ≤ 2× current, deterministic,
every attempt recorded.

## D2 — Upper-edge terminations

The ragged "upper roof edges" live in the recorded planes `gablesFromRecord` leaves to the blob
(gatehouse: flat roof-2 area 151 + pitched fragments 28/14/9/9; cottage: flat roof-1 area 101 +
fragments). "Wall-top" edges on these subjects are the tower-top/parapet perimeters — i.e. the
flat planes' edges; "roof-meet" edges are where those regions meet the generated roof or walls.

### Options

**A. Extend the gable program to a second flat-cap generator** (carve + regenerate prisms).
Rejected: a near-duplicate of the swap for marginal gain; the flat plane's *fitted level* and
*extent* are already recorded — trim/fill in place suffices to regularize the edges.

**B. Whole-shell re-regularization with stronger morphology.** Rejected: identity-blind (the
radius that shaves gatehouse lumps eats the cottage chimney — the E-25 lesson), and it would
relitigate T-102's accepted shell.

**C. Per-plane trim-to-fitted-plane ops run through `regularizeShell`'s injectable step seam.**
Chosen. New pure `src/view/plane-terminate.mjs`:
- For each recorded roofPlane not consumed by an accepted gable: target surface =
  `planeHeightAt(voxelFit, x, z)` over the extent (the plane's own recorded fit — "the fitted
  planes" of the AC), quantized to halves.
- **flat planes**: remove solid cells above the plane; fill the top course to contiguity over the
  fill-between'd extent (straight edge lines by construction — the roof-fit footprint precedent);
  additions take the majority solid 6-neighbor block; a half-height plane tops with the family
  slab only if a kit family exists for the zone — otherwise full course (no invented ids).
- **pitched fragments**: trim above the plane only (no fill — an unpaired fragment's plane is
  weaker evidence; named asymmetry).
- Each plane = one `steps[].fn` entry in a single `regularizeShell` call on the post-swap
  occupancy → per-step IoU floors anchored to that input, closure no-regress, protect, trace,
  auto-rollback — the cage reused verbatim, zero new judge code (AC "cage-wrapped throughout").
- Protect during termination: caller protects (openings) **plus the residual-pass candidate
  cells** — protrusion arbitration belongs to D3 with its azimuth evidence; termination must not
  pre-empt it silently.

## D3 — Silhouette-residual pass

### The decision test

A candidate protruding mass is **shown** by the GLB at azimuth `a` iff its projected silhouette
spills 0 px outside the GLB's silhouette after a one-voxel dilation allowance. Removal is proposed
only for masses shown at **no** gate azimuth (the AC's wording, conservative by construction).

- Candidates: 26-connected components of (record protrusion-role mass cells — plan columns at
  y ≥ yRange[0], degenerate ranges guarded) ∪ (`protrudingStackRegion(occ)` cells). This is
  exactly the set `chimneyColumns` blanket-protects today — the pass *re-grounds that protection
  in the GLB* instead of trusting the record's identity guess.
- Mass silhouette: `exposedFaceMesh` gains a cell-filter + bounds override so the mass rasters
  under the **full occupancy's framing** (same camera as `voxelSilhouettes`); both the mass mask
  and the full voxel mask normalize with the *full* mask's bbox (additive `bbox` override on
  `normalizeSilhouette` — the mass must not be re-framed by its own tiny bbox).
- GLB side: `refSils[a]` normalized exactly as `silhouetteIoUs` does, then dilated by
  `ceil(grid / longSideCells)` grid px — **one voxel's worth**, a geometry-derived quantization
  allowance, not a tuned constant. spill = mass-fg px ∉ dilated GLB fg.
- Cottage chimney: in the GLB → spill 0 everywhere → exempt, evidence recorded. Gatehouse
  mass-1/2/3: protrude above the GLB roofline at every azimuth → spill > 0 at all four → removal
  proposed. ("Refit" beyond this — partial trims of partially-supported masses — is out: a mass
  shown anywhere stays as-built, named; matches the AC's exemption clause.)

### The removal, caged

Each unsupported mass is removed in deterministic order (component id), and the candidate is
judged with the cage's own three checks reused directly (`silhouetteIoUs` no-regress at every
azimuth vs the pass input, `closureCheck` no-regress, `protectViolations` for caller protects) —
the roof-swap precedent. Reject → rollback, named. Every decision logged with its per-azimuth
spill evidence: `{massId, cells, perAzimuth:{spillPx, spillFrac}, shownAt, removed, reasons}`.

### Ordering in the runner

component swaps (existing, chimney protection unchanged — T-108/T-110 working set untouched) →
**plane terminations** (candidates protected) → **silhouette residual** (candidates arbitrated) →
final census/renders/record. Rationale: terminations must not silently consume lumps that sit on
the very flat tops they level; the residual pass owns that call with azimuth evidence.

## Record, runner, evidence

- `roof-program/v1` kept with **additive** sections (`ridgeFit`, `terminations`, `residual`,
  `generated.counts.cap`, ladder rung names) — the only downstream consumer
  (`component-plan.mjs`) pins shas and reads `status`/`swap`, never the version string; additive
  is the non-breaking choice. Downstream chain re-runs are T-111's scope (no re-judging here).
- Renders: existing 4 gate azimuths stay; add a generic **ridge-profile frame** — the ortho named
  angle perpendicular to the dominant accepted gable's ridge axis (cottage AC view; derived from
  geometry, no subject constants); frames `roof-<subj>-ridge-{before,after}.png`.
- `assertAcceptance` budget unchanged (6/gable + 2/fitted end); the residual pass and terminations
  can only reduce the census — if live measurement disagrees, that is a named finding to bring
  back to design, not a constant to bend (Rule 6).
- Determinism: all new logic is pure; double-run byte-compare + `--repro`/`--offline` unchanged.

## Rejected alternatives (summary)

- GLB-gating `chimneyColumns` inside the swap: loses the byte-protect/re-seat semantics T-104
  shipped and buries removal evidence in carve counts; the post-swap pass keeps both honest.
- Absolute mesh-y ridge / pixel-space ridge: absolute-offset unreliability, doubled camera math.
- Flat-cap regenerate-and-swap: duplicate program; trim/fill under the existing cage suffices.
- Stronger whole-shell morphology: identity-blind, relitigates T-102.

## Implementation addendum (measured during Step 5 — supersedes D3's aggregation rule)

The original rule (remove ⇔ shown at NO azimuth) is unfalsifiable for the very masses it targets:
at the gate cameras' 30° elevation a roof's TOP FACE projects as a wide band, so a blob wart on
the camera-NEAR side hides *inside* the GLB silhouette at that azimuth (measured on the synthetic
scene: lump spill 0 at its near azimuth, 19–86 px at the other three). Interior pixels attest
nothing — a silhouette can only *refute*. Revised aggregation: **exempt ⇔ spill-free at every
azimuth** (a mass the GLB contains is spill-free everywhere, quantization absorbed by the
one-voxel dilation — the cottage chimney); **refuted at ≥1 azimuth → removal proposed**, still
under the full cage with per-azimuth evidence logged. The conservative direction is preserved by
the cage (a removal that regresses IoU/closure rolls back) rather than by the membership test.
Removal judging consumes the cage's declared `iouTolerance` (not the design's "tolerance-free"
floor): bbox renormalization shifts every mask when a removed mass defined the build's bounds, so
the strict floor would flap — same judged semantics as every other caged step.

## Risks

1. Strict spill=0 may flap on raster seams → if measured live, the remedy is widening the
   *declared geometric* allowance (e.g. dilation radius derivation), named in the record — never a
   per-subject epsilon.
2. Ridge-intersect rungs could all fail the cage on one subject → tail rungs preserve today's
   accepted geometry exactly (worst case = status quo, fitted-ridge findings recorded).
3. Terminations on cottage flat roof-1 (area 101) might fight the chimney base → chimney cells are
   in the protected candidate set during termination by design.
4. The cottage accepted rung is voxel-pitch — its intersect ridge is voxel-fitted; the GLB apex
   line is still recorded as the fit evidence (height delta named), satisfying "fit error
   recorded" without inventing an absolute GLB height.
