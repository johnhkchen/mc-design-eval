# T-109-01 ridge-and-silhouette-fit — Progress

Tracking implementation against plan.md (8 steps).

- [x] Step 1 — enablers: normalizeSilhouette bbox override + exposedFaceMesh subset (70180f4)
- [x] Step 2 — roof-ridge-fit.mjs pure core + tests, 13/13 (62cd578)
- [x] Step 3 — generator cap tracking + swap ridge rungs (563724b); suite 1413 green
- [x] Step 4 — plane-terminate.mjs + tests, 8/8 (1acf1cf); suite 1421 green
- [x] Step 5 — silhouette-residual.mjs + tests, 10/10 (243123b)
- [x] Step 6 — runner wiring (roof-program.mjs) (ade2464); suite 1431 green
- [x] Step 7 — live runs gatehouse + cottage; --repro MATCHES (both), --offline OK (both);
      records + frames committed (1ef793c)
- [x] Step 8 — npm test green (validator + 1431 unit); render non-live suite 42/42; review.md

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
4. **Step 7 (measured live, AC-relevant)** — the gatehouse's two surviving protrusion candidates
   (res-0 53 cells, res-1 3 cells) are EXEMPT-SHOWN, not removed: the GLB apex line records a
   flat band at y 31.5 (length 26, rmse 0) — the gatehouse GLB genuinely carries mass at that
   level (tower-top band), so the AC's premise "they are not in the GLB" is refuted by
   measurement for the post-termination remnants. The ragged mass the judge called
   "chimney-like" was substantially the unfitted-plane overrun, which the seven terminations
   removed (−103 cells); the ridge-profile frames show the cleaned top. The removal mechanism is
   real and fires (synthetic suite proves removal + rollback paths); on this subject the honest
   outcome is exemption-with-evidence (Rule 1: never delete what the reference supports).

## Live outcomes (step 7)

- **cottage**: ACCEPTED `mass-0:end-fitted-voxel-pitch-ridge-fit` — the ridge-fit rung WON the
  ladder. Ridge intersect Δ vs record: −1.404 (main), −2.113 (cross) — the apex-shortfall now a
  measured number. Terminations 4/4 accepted (roof-1 −47/+6, roof-5 −23, roof-6 −4, roof-7 −4).
  Residual: res-0 (48 cells — the chimney + seat) exempt-shown at all 4 azimuths. Census 16→0,
  unmapped 0/10061, artifact sha 477399990e7c, fresh-process --repro MATCHES.
- **gatehouse**: ACCEPTED `mass-0:end-fitted-voxel-pitch-gable-ends` — ridge intersect invalid
  (named: y 26.397 below eave 26.5; as-built ridge stays), GLB apex line recorded (y 31.5,
  slope 0°, length 26, rmse 0). Terminations 7/7 accepted (roof-1 −55, roof-2 −15/+1, roof-3
  −15, roof-5 −9, roof-6 −4, roof-7 −2, roof-8 −3). Residual: res-0/res-1 exempt-shown (above).
  Census 18→2, unmapped 0/9379, artifact sha 6ed2580cff4c, --repro MATCHES.
