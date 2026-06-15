# Progress — T-081-01 nxm-floorplan-infill

What landed, in plan order, with deviations called out.

## Done

- **Step 1–4 — `src/view/floorplan.mjs` (pure) + `floorplan.test.mjs`.** The generator geometry
  (`storeysFromRead`, `gridPartition`, `interiorColumnsAtY`, `roomOfColumn`), the plan + bulk placements
  (`generateFloorplan`, `applyFloorplan`), the plausibility gate (`gateFloorplan` + `openingsAlignShell`),
  and the metered seam (`buildFloorplanPrompt`, `parseFloorplanSpec`). 33 tests.
- **Step 5 — routing record.** `OP_ROUTING` gains `floorplan-author = strong` (authoring a generator);
  `model-tier.test.mjs` extended. `routingTableMarkdown()` picks it up.
- **Step 6 — `benchmarks/sculpture/floorplan-cottage.mjs` + `floorplan:cottage` script.** Loads the T-080
  hollow shell → structural read → renders plan+elevation → **strong-tier `floorplan-author`** (Opus, the
  only metered call) → pure generate → pure gate → `exteriorHeld` throw → before/after renders + report.
- **Live run.** Opus chose a `2×3` grid (`spruce_planks` floors, `stone_bricks` walls); **6 rooms/storey,
  433 placements, 12 doorways**; **gate PASS** (all six hard constraints) with the named residual; lattice
  `exteriorHeld` **true**; artifact **AJV VALID**.
- `npm test` **965 green** (was 932 at T-080; +33). Committed in two chunks (`pure core`, `runner + fix`).

## Deviations from the plan (documented, with rationale)

1. **The exterior-safety predicate is `isFillHidden` (10 cameras), not the 2-D-slice `interiorColumnsAtY`.**
   The plan assumed slice-enclosure (the room-air heuristic) was enough to keep the fill invisible. The
   first live run's `exteriorHeld` **threw** — correctly: on the real, irregular cottage a slice-enclosed
   cell can still be seen from above/below or obliquely. **Adding** mass is asymmetric to the carve's
   **removing** (which reveals nothing), so I added `orthoShadow`/`isOrthoHidden` (front-occlusion from the
   6 ortho cameras) and then `isDiagHidden`/`isFillHidden` (the 4 diagonal cameras too, protecting the 3/4
   resemblance view). Every placement is now gated by `isFillHidden`. `interiorColumnsAtY` stays as the
   exported room-air primitive (unit-tested), but it is the heuristic, not the guarantee. *(The runner's
   throw caught this before it could ship — the invariant did its job.)*

2. **Floors are a full slab + walls a divider cross, gated per-height — not locked to the floor-plane
   slice.** The first dense attempt locked the storey footprint to `interiorColumnsAtY(floorY+1)` (43 cols
   at y=1) and produced only 37 placements. Rooms are now read from a **mid-storey** slice and walls fill
   each height where safe → 433 placements, a real floorplan. Plan §generator updated in spirit; the public
   API is unchanged.

3. **"Before/after renders byte-identical" (plan Step 6 verify) is NOT achieved — and cannot be.** The
   benchmark renders are **perspective** (FOV) at slight elevation; off-center pixels see *through the
   shell's real door/window openings* into the new interior (the front camera looks down the front door).
   The **exterior SHELL surface is provably unchanged** (the 10-camera lattice digest — 0 ortho + 0 diag
   surface cells differ), but the perspective renders differ by **front 0.41% / top 0.056% / 3-Q 0.049%**
   of pixels, all interior-through-openings. Byte-identical renders are impossible for any non-trivial
   floorplan behind a front door. Recorded as the **named exterior-side residual** (Rule 7) in the report +
   review; the interior itself is gated by **plausibility**, not resemblance. The runner throws only on the
   formal lattice-digest failure (held true), which is the correct, achievable invariant.

## Not done (out of scope, by design)

- **Closing intended openings / sealing** — the strong-tier `seal-authoring` job (T-082 routing), upstream
  of hollowing, not this ticket.
- **Stairs between storeys** — reachability is gated **per storey** (the AC's "a path / doors connect
  them"); vertical circulation is a plausible next step, noted in review.
- **Re-compacting placements into `box`/`fill` primitives** — kept as explicit `voxel` ops (same accepted
  trade as the carve); the render is unaffected and the artifact re-validates.
