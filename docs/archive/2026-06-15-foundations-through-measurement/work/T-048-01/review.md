# T-048-01 — Review (handoff)

## What this ticket delivers

A pure, GL-free **GLB → binary silhouette rasterizer** — the projection primitive E-16's GLB form
target (T-049-01) will call to turn a TRELLIS mesh into the *target silhouette* the E-15 surgical
loop hill-climbs against, replacing the too-blunt flat concept PNG. It parses GLB geometry, frames
it with the **same camera the build render uses**, and fills triangles into a binary mask —
whole-object and per-3-D-region — with a mask shape that drops straight into the existing
`form-fidelity` IoU pipeline.

## Files changed

| File | Δ | Summary |
|---|---|---|
| `src/form/glb-silhouette.mjs` | **new (+~360)** | Pure core (parse, transform-bake, project, rasterize) + `import.meta` CLI (fs + pngjs, lazy) |
| `src/form/glb-silhouette.test.mjs` | **new (+~240)** | 8 offline unit tests (synthetic cube + hand-built tiny GLB) |
| `.gitignore` | **+4** | Ignore `benchmarks/sculpture/glb/silhouette/` (derived PNGs) |

No existing file was modified beyond `.gitignore`. The module is purely additive — nothing imports
it yet, so there is no caller-contract risk. Committed as `e1a2037`.

## Acceptance criteria — status

- **AC #1 — pure GL-free module, whole + per-region, deterministic:** ✅
  `rasterizeSilhouette(mesh, {view, region})`; imports only `framedCamera` + `SCULPTURE_VIEW_3Q`;
  no GL/THREE/network. Determinism asserted (test F, byte-identical runs).
- **AC #2 — unit tests on a synthetic cube, offline (no 5 MB GLB):** ✅ all 8 tests in-memory.
- **AC #3 — real koi.glb → sanity PNG, eyeballed:** ✅ `koi-3q.png` reads as a koi outline
  (143,664 tris, coverage 0.118). PNG is gitignored; the run command is in `progress.md`.
- **AC #4 — `npm test` green:** ✅ 464 pass (456 prior + 8 new), 0 fail.

## Test coverage assessment

**Covered:** GLB binary parse (magic/chunk/JSON), accessor read (FLOAT VEC3, USHORT SCALAR,
byteOffset/stride paths), node-transform-aware merge, AABB, camera framing of a continuous box,
the behind-camera `w ≤ 0` guard, the extractSilhouette-compatible mask shape, a known axis-down
square + fill ratio, determinism, per-region restrict, and disjoint-region empty. Error paths
(bad magic, missing POSITION) are asserted.

**Gaps / not automated (intentional):**
1. **Real-mesh projection is eyeballed, not asserted** (AC #3 is a visual gate; automating it
   would require checking the 5 MB asset in, which AC #2 forbids). The koi PNG reading as a koi is
   the proof that node transforms + projection orientation are correct end-to-end.
2. **Node-transform bake is tested indirectly** (test A2 asserts the camera adapter follows a
   shifted AABB rather than re-encoding a rotated GLB). The TRS/quaternion math has no direct
   unit assertion on a known rotation — the koi's correct orientation is the live evidence. *If a
   reviewer wants belt-and-suspenders, a direct `mat4FromTRS(quat 90° about Y)` → expected-vector
   assertion is a cheap add.*
3. **Interleaved `byteStride` buffers** are coded for but not hit by the tiny-GLB fixture (which is
   tightly packed). TRELLIS output is non-interleaved, so this is untested-but-defensive.
4. **`fit:'aspect'`/normalization interplay** with the real metric is out of scope here (it lives
   in `form-fidelity`); this ticket only produces the raw mask.

## Known limitations (by design, not defects)

- **Silhouette ≠ form, single 3/4 view, camera match only up to normalization** — the honesty
  ledger in the module header; inherited from the E-13/E-14/E-15 lineage. Absolute IoU is
  depressed by GLB-vs-build coordinate-space mismatch; the loop reads the *relative* Δ, and
  normalization removes translation + uniform scale.
- **No backface culling** is a deliberate choice (a silhouette is the union of all faces), not an
  omission.
- **Minor interior holes** in the koi silhouette are genuine fin/body view-gaps in the mesh, not a
  fill error. If T-049-01 finds they hurt the IoU signal, a morphological close (dilate→erode) on
  the mask is the natural follow-up — deliberately *not* added here to keep the primitive honest
  and unopinionated.
- **Per-region = projected-rect clip**, not per-triangle region membership (the contract the
  `form-target.mjs` seam docblock names: "masked to R's projected bounds"). Faithful to the 2-D
  rect the downstream `regionIoU` consumes.

## Forward contract for T-049-01 (the next ticket)

`rasterizeSilhouette(...).{ w, h, data, fgCount, bbox }` **equals** `extractSilhouette`'s shape on
purpose. So `glbFormTarget` can: `loadMeshFromGlb` once → `rasterizeSilhouette(mesh, {region})`
for the target → `normalizeSilhouette` both target and render → `iou`/`regionIoU`. The loop's
`observe`/`diagnose`/accept gate need **zero** changes — exactly the seam invariant
`form-target.mjs` promises.

## Flags for a human reviewer

- **None blocking.** The one judgement call worth a glance: the **node-transform bake** correctness
  rests on the koi PNG eyeball (gap #2). It looks right (upright, correctly proportioned koi). If
  you want it nailed down before T-049-01 leans on it, add the direct quaternion→matrix assertion
  noted above — ~10 lines, no new fixtures.
- **Concurrency:** a sibling thread (T-050-01) adds `glb-mesh.mjs`/`glb-voxelize.mjs` on this
  branch; this ticket left them untouched. No shared-file edits.
