# T-048-01 — Plan: ordered, verifiable steps

Each step is independently verifiable; commits are atomic. Tests live in one file
(`glb-silhouette.test.mjs`) but are added incrementally alongside the code they cover.

## Step 1 — mat4 helpers + GLB binary parse

**Do.** Create `src/form/glb-silhouette.mjs` with the header docblock, constants
(`GLB_SILHOUETTE_SCHEMA`, `SILHOUETTE_DEFAULTS`, GLB magic/chunk constants), the mat4 helpers
(`mat4Identity`, `mat4Multiply`, `mat4FromTRS`, `mat4FromArray`, `transformPoint`), `parseGlb`,
the accessor reader, the scene walk (`eachMeshNode`), and `loadMeshFromGlb` (bakes node
transforms, merges all primitives, computes the float AABB `bounds`).

**Verify.** Add tests **B** (tiny-GLB round-trip: `triCount===12`, bounds = cube) and **H**
(bad magic throws; missing-POSITION throws). `node --test src/form/glb-silhouette.test.mjs` green.

**Commit.** `feat(E-16 T-048-01): GLB geometry parser + mat4 (node-transform bake)`

## Step 2 — camera adapter + projection

**Do.** Add `cameraForMeshBounds(bounds, view)` (the `max−1` adapter into `framedCamera`) and
`projectPoint(p, cam, w, h)` (gluLookAt view matrix built from `cam.eye/target/up`, vertical-FOV
perspective, screen mapping, `w = −zc`).

**Verify.** Add test **G**: a point clearly behind the eye → `w ≤ 0`; a point at the mesh center
projects near frame center. Green.

**Commit.** `feat(E-16 T-048-01): GL-free camera-matched projection`

## Step 3 — whole-object rasterizer

**Do.** Add `rasterizeSilhouette(mesh, opts)` (whole-object path: view merge, per-triangle
edge-function fill, winding-agnostic inside test, OR-union, behind-camera skip, degenerate skip,
final `fgCount`+`bbox`).

**Verify.** Add tests **A** (cube fixture helper), **C** (mask shape + non-empty + bbox in
frame), **D** (axis-down view → aspect ≈ 1, filled center row), **E** (determinism: two runs
byte-identical). Green.

**Commit.** `feat(E-16 T-048-01): triangle-fill silhouette rasterizer (whole-object)`

## Step 4 — per-region clip

**Do.** Add `projectedRegionRect(region, cam, w, h)` and wire `opts.region` into
`rasterizeSilhouette` (clip mask to the projected 2-D rect; recompute fgCount/bbox).

**Verify.** Add test **F** (right-half-x region → fgCount < whole, bbox right edge clipped;
off-object region → fgCount 0). Green.

**Commit.** `feat(E-16 T-048-01): per-region silhouette (3-D bbox → projected rect clip)`

## Step 5 — CLI + AC #3 koi sanity PNG

**Do.** Add the `import.meta`-guarded CLI (lazy `node:fs` + `pngjs`; default output
`benchmarks/sculpture/glb/silhouette/<name>-3q.png`). Ensure `.gitignore` covers the output dir
(the existing `benchmarks/sculpture/glb/*.glb` glob does **not** cover the `silhouette/` subdir
or `.png` — add `benchmarks/sculpture/glb/silhouette/` to `.gitignore`).

**Verify (manual, not in the suite).** Run
`node src/form/glb-silhouette.mjs benchmarks/sculpture/glb/koi.glb` (skip gracefully with a
logged note if the gitignored GLB is absent in this environment). Open the PNG; confirm it reads
as a koi outline (elongated body, tail, dorsal hump). Record the result + stats in `progress.md`.

**Commit.** `feat(E-16 T-048-01): glb-silhouette CLI + koi sanity PNG` (PNG itself stays
gitignored; the manifest/notes are committed).

## Step 6 — full suite + housekeeping

**Do.** `npm test` (AJV self-tests + full unit glob). Fix any regressions. Confirm no module-load
side effects leak fs/pngjs into the offline suite.

**Verify.** `npm test` green end-to-end. `git status` clean except intended files.

**Commit.** folded into Step 5 or a final `chore(E-16 T-048-01): npm test green` if needed.

---

## Testing strategy

- **Unit (automated, offline):** tests A–H above — the synthetic cube and a hand-built tiny GLB
  exercise parse, transform bake, projection, fill, determinism, per-region, and error paths
  with no GL, no network, no 5 MB asset. This is the AC #2 surface.
- **Integration (manual, one-shot):** the koi PNG (AC #3) — eyeball only, since it needs the
  gitignored asset and is a *visual* judgement, not an assertion. Documented in `progress.md`.
- **Regression:** `npm test` proves the new module does not perturb the existing 456-test suite
  (additive module, no shared-file edits).

## Verification criteria (maps to ACs)

| AC | Verified by |
|---|---|
| #1 pure GL-free module, whole + per-region, deterministic | Steps 1–4; tests C, D, E, F |
| #2 unit tests on synthetic cube; offline (no 5 MB GLB) | tests A–H, all in-memory |
| #3 real koi.glb → sanity PNG, eyeballed | Step 5 manual run + progress.md note |
| #4 `npm test` green | Step 6 |

## Risks & mitigations

- **Node transform convention (quat order / row-vs-column major).** Mitigate: test the bake on a
  known node matrix in the tiny GLB (or assert identity-node path first); the koi PNG is the real
  proof — if it's rotated, fix the matrix convention there.
- **THREE NDC mismatch.** Low impact (normalization tolerant); the koi eyeball is the gate.
- **Asset absent in the lisa/CI environment.** The GLB is gitignored — Step 5 logs-and-skips
  rather than failing the run; AC #3 is then satisfied on a developer machine where the asset
  exists, and the code path is still unit-covered via the tiny in-memory GLB.
