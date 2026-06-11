# T-109-01 ridge-and-silhouette-fit — Progress

Tracking implementation against plan.md (8 steps).

- [x] Step 1 — enablers: normalizeSilhouette bbox override + exposedFaceMesh subset (70180f4)
- [x] Step 2 — roof-ridge-fit.mjs pure core + tests, 13/13 (62cd578)
- [x] Step 3 — generator cap tracking + swap ridge rungs (563724b); suite 1413 green
- [x] Step 4 — plane-terminate.mjs + tests, 8/8 (1acf1cf); suite 1421 green
- [x] Step 5 — silhouette-residual.mjs + tests, 10/10
- [ ] Step 6 — runner wiring (roof-program.mjs)
- [ ] Step 7 — live runs gatehouse + cottage (+ --repro)
- [ ] Step 8 — full verification + review

## Deviations

1. **Step 3** — the ridge-fit flavor is emitted only when the intersection actually MOVES a ridge
   height; an identical/unfittable intersection collapses into the plain rung, which keeps its
   name and carries the findings (otherwise the flavor hijacked existing rung names through the
   dedup, breaking the T-108 ladder-name contract pinned by 5 tests). One pre-existing ladder
   test updated for the legitimately grown ladder (insane glb pitch now also moves the
   intersection → 3 rungs).
2. **Step 5 (design-relevant)** — residual aggregation revised from "remove ⇔ shown at NO
   azimuth" to "exempt ⇔ spill-free at EVERY azimuth; refuted at ≥1 → removal proposed under the
   cage". Measured cause: at 30° camera elevation the roof's top face projects as a band, hiding
   near-side warts inside the silhouette at one azimuth — interior pixels attest nothing, so the
   strict rule could never fire on the gatehouse lumps. design.md carries the full addendum.
   Removal judging uses the cage's declared iouTolerance (bbox renormalization makes a
   zero-tolerance floor flap when a removed mass defined the build bounds).
3. **Step 4 (minor)** — flat-plane fill bound = ceil(voxelFit.maxResidual) (the plane's own
   recorded residual spread) instead of a slab-top option; no kit coupling in the termination op.
