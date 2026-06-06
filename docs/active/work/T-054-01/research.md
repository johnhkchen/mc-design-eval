# T-054-01 — research: glb-voxel-breadth (E-17 rung R1)

Descriptive map of what exists for running the proven GLB-voxel build across all 7 E-13 subjects and
emitting the R1 form-IoU table. No solutions proposed here.

## 1. What this ticket is

E-17 is an **ablation sweep**: take the techniques E-09…E-16 proved on a 1–2 subject sample and re-run
each across the full sculptural subject set so each technique's contribution becomes legible. **R1** is the
first rung — the **GLB-voxel build**: voxelize a TRELLIS image→3D mesh into occupancy, color it value-true
from the mesh's own surface texture, compile a `DesignArtifact`, render it, and score its silhouette IoU
against the GLB. E-16 proved this is the decisive *form* win (koi +0.150, heart +0.421 IoU vs text→JSON)
but only on **koi + heart**. This ticket generalizes to **all 7 subjects that have GLBs**.

## 2. The proven path already exists (E-16)

The entire pipeline is implemented and committed. Nothing in the core needs to change.

### `src/form/glb-voxel-build.mjs` — the pure core (T-051-01)
- `glbVoxelBuild(glb, { scale, decodeTexture, palette, metadata, style })` → `Promise<DesignArtifact>`.
  Ties together: `voxelizeGlb` (occupancy) → `parseGlbColoredSurface` (vertices+uvs+baseColor) →
  injected `decodeTexture` (WebP→RGBA, the **only** impurity) → `sampleSurfaceColors` (per-cell nearest
  vertex → UV → texel) → `colorVoxelsToArtifact` (each cell → `{op:"voxel",pos,block}`, value-true via
  `nearestLab` over the 305-block Lab table).
- **Purity split** (load-bearing): everything except the injected `decodeTexture` is pure — no GL, no
  WebP, no GLB parse-with-codec, no network. WebP decode shells to a host tool (`dwebp`) supplied by the
  runner, kept OUT of `src/` and CI.
- The core does **not** validate; callers run the artifact through the AJV gate (`assertArtifact`,
  `src/artifact.mjs`) — the round-trip pattern.
- Coordinate map: `i→x`, `j→y` (ground at y=0), `k→z`, x/z centered (`x=i−⌊nx/2⌋`, `z=k−⌊nz/2⌋`).
- **Occupancy count == placements count**: `colorVoxelsToArtifact` emits exactly `occupancy.count`
  placements (one voxel per occupied cell). So the "occupancy count" the AC table wants is just
  `artifact.placements.length`.

### `benchmarks/sculpture/glb-voxel-run.mjs` — the E-16 runner (koi + heart only)
This is the template. It already does, per subject, exactly the per-subject AC of this ticket:
- reads `glb/<subj>.glb`, builds the artifact via `glbVoxelBuild` with a `dwebp`-backed `decodeTexture`,
  asserts the AJV gate, writes `glb-voxel/<subj>/artifact.json`;
- renders at `SCULPTURE_VIEW_3Q` to `render-3q.png` (lazy GL import of `render/src/render-tool.mjs`);
- scores **silhouette IoU vs the GLB's own silhouette** via `judgeIoU` (render silhouette
  `extractSilhouette`/`normalizeSilhouette`/`iou` from `form-fidelity.mjs` vs
  `rasterizeSilhouette(loadMeshFromGlb(glb), {view:SCULPTURE_VIEW_3Q})` from `glb-silhouette.mjs`);
- writes `glb-voxel/<subj>/summary.json` and rolls up a `glb-voxel/summary.md` table.
- **Hardcodes `subjects = ["koi","heart"]`.** The only structural gap vs this ticket.

The impure glue worth noting (it is the part not in `src/`):
- `decodeTexture({data,mimeType})`: PNG/JPEG → temp file → `decodeImage`; WebP → `dwebp in.webp -o out.png`
  → `decodeImage`. `dwebp` is installed at `/opt/homebrew/bin/dwebp` (confirmed).
- `judgeIoU(renderPath, glbBytes)`: the GL-free silhouette comparison described above.

### `benchmarks/sculpture/glb-voxel-surgical.mjs` (T-052-01) — the most recent precedent
Establishes the harness conventions this ticket should mirror: a `main()` behind an
`import.meta.url === file://${process.argv[1]}` guard (side-effect-free import), GLB/asset-absent =
**skip not error**, a durable `.json` + `.md` summary committed while renders are gitignored, and **reuse
of pure `src/` exports** rather than cloning logic (it imports `formVerdictOf`, citing the
`parallel-roots-duplicate-shared-deps` DRY lesson). It keeps its **own impure GL glue local** — the
established split: reuse pure src/ logic, each harness owns its render/host glue.

## 3. The 7 subjects, runs, and GLBs (all present)

`benchmarks/sculpture/glb/` holds 7 valid TRELLIS GLBs (gitignored binaries; `glb/README.md` is the
durable manifest). Confirmed on disk: `bow-and-arrow, dancing-man, heart, koi, moai, mushroom, pineapple`.

| run | subject | GLB |
|-----|---------|-----|
| `002-dancing-man` | dancing man | `glb/dancing-man.glb` |
| `003-moai-statue` | moai | `glb/moai.glb` |
| `004-pineapple` | pineapple | `glb/pineapple.glb` |
| `005-bow-and-arrow` | bow & arrow | `glb/bow-and-arrow.glb` |
| `006-heart` | heart | `glb/heart.glb` |
| `008-mushroom` | mushroom | `glb/mushroom.glb` |
| `009-koi-fish` | koi | `glb/koi.glb` |

**`007-sword` is excluded** — TRELLIS HTTP 500'd on the thin blade across 3 attempts (a thin-subject
failure mode mirroring text→JSON foreshortening). Documented in `glb/README.md`, the E-17 epic, S-054,
and project memory. The sweep is 7 subjects, not 8.

## 4. Existing E-16 outputs (the 2 subjects already done)
`benchmarks/sculpture/glb-voxel/` already holds committed `koi/` and `heart/` with `artifact.json` +
`summary.json` (and gitignored `render-3q.png`), plus `summary.md`:
- koi: scale 32, 2164 blocks, manifest 71, **silhouetteIoU 0.622**, 12.6s.
- heart: scale 32, 5840 blocks, manifest 91, **silhouetteIoU 0.877**, 20.5s.
These are the same numbers the surgical harness reads as `buildBaselineIoU`. Re-running koi/heart through
the breadth sweep should reproduce these (deterministic: voxelization, nearest-vertex sampling, and
`nearestLab` are all deterministic; the only variability is GL rasterization rounding, which IoU rounds to
3 dp).

## 5. Test / CI boundary
- `npm test` = `validate-artifact` self-test + `node --test "src/**/*.test.mjs"` (39 test files).
- The test glob is **`src/**` only** — benchmark-local tests are NOT picked up. So any new pure logic that
  must be in the suite has to live under `src/`. The pure voxel/color core is already covered by
  `src/form/glb-voxel-build.test.mjs` (synthetic occupancy + synthetic colors → AJV round-trip) and
  `src/form/glb-voxelize.test.mjs`. AC #4 ("pure voxel/color logic stays unit-tested; no new GL in the
  suite") is about *preserving* that boundary, not necessarily adding tests.

## 6. Gitignore
`.gitignore` already ignores `benchmarks/sculpture/glb-voxel/**/render-3q.png` and `glb/*.glb`. New
per-subject `render-3q.png` files are covered automatically. `artifact.json`, `summary.json`, and the new
`r1.{md,json}` are **durable / committed** (matches how koi/heart artifact.json are committed).

## 7. Constraints & assumptions
- Scale: default 32 (`DEFAULT_SCALE`), valid range [8,64]. Mirror E-16's scale-32 so the 2 reused
  subjects' numbers stay comparable.
- All 7 GLBs have a baseColor WebP texture (2 textures each per `glb/README.md`); `glbVoxelBuild` throws
  if `surface.baseColor` is missing — not expected for any of the 7.
- AC #3 (regenerate a missing GLB via `trellis-glb.mjs`, needs `.env MODAL_ENDPOINT_URL`, never printed):
  all 7 GLBs are present, so regeneration is a no-op safety branch — but the runner must still detect an
  absent GLB and note it rather than crash.
- Render is GL (headless Chromium/headless-gl via `render/src/render-tool.mjs`); proven to work on this
  machine (koi/heart outputs exist). Runtime ~12–20s/subject ⇒ ~2 min for the 7-subject sweep.
- The form IoU is a single 3/4 view silhouette — `silhouette ≠ volume`; normalization removes
  translation + uniform scale but not rotation/axis. Adequate as a relative form signal (the metric E-16
  used), not an absolute fidelity claim.
