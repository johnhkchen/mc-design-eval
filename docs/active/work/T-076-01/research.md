# T-076-01 Research — resemblance-gate

Map of the codebase for E-22 / S-076: the gate that measures whether the Minecraft build **looks like**
its fixed references (concept image + GLB mesh). Descriptive only — what exists, where, how it connects.

## The problem this ticket sits on top of

The old sign-off (E-15..E-20) hill-climbed proxy numbers — `speckle`, `distinct`, `IoU`, `valueDeltaE` —
that read near-perfect on the scale-64 gatehouse while the render was grey static (memory:
`render-aliasing-not-material-speckle`). T-075-01 fixed the **lens** (internal SSAA ×3 in `render.mjs`,
512² contract preserved; `docs/active/work/T-075-01/review.md`). This ticket adds the **gate** that scores
the real goal: visual resemblance to the immutable references.

**Binding rules (E-22, from the ticket):** references are immutable (Rule 1); the **triptych is the human
verdict**, proxy scores only explain it (Rule 2); judge prompt + thresholds fixed (Rule 5); reproduce
before claiming (Rule 6); name the gap, don't hide it (Rule 7).

## Reference inputs (immutable)

- **Concept image:** `benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png`
  (Nano-Banana 3/4 concept, black background). Approximately — not exactly — the 3/4 view.
- **GLB mesh:** `benchmarks/sculpture/glb/stone-gatehouse.glb` (TRELLIS, textured, **gitignored** — memory
  `trellis-glb-path-works`). The 3-D form reference.
- **Subject manifest:** the run's `artifact.json` carries the design-doc `palette.manifest`.

## The thing being judged (NOT a reference)

- **Chosen Minecraft build:** `benchmarks/sculpture/building/best/artifact.json` (== `scale-64/artifact.json`,
  the E-20 `pickBestScale` winner). Its committed render `building/scale-64/render-3q.png` predates the
  T-075-01 lens fix, so a fixed-lens re-render is the honest input (see runner, below).

## Form-fidelity machinery (reuse verbatim — AC #2 names these)

`src/form/form-fidelity.mjs` (pure, GL-free, RNG-free; tested in `*.test.mjs` under the root suite):
- `extractSilhouette(img, bgOpts) → {w,h,data:Uint8Array,fgCount,bbox}` — RGBA → foreground binary mask via
  E-10 `isBackground`. Presets: `RENDER_BG` (sky `#ADD8E6` ±24), `CONCEPT_BG` (black ±40).
- `normalizeSilhouette(mask,{grid,fit,coverageThreshold}) → G×G occupancy` — bbox-crop + resample,
  `fit:'aspect'` preserves proportion (default), `'stretch'` discards it.
- `iou(a,b)` / `regionIoU(a,b,region)` — IoU of equal-dim masks; both-empty → 1.
- `formFidelity(renderImg, conceptImg, opts)` — the orchestrator; `formFidelityFromPair(paths)` the only
  decode shell. Honesty ledger in the header: single 3/4 view, camera mismatch (render exact / concept
  approximate) depresses absolute IoU → **relative Δ is the signal**, silhouette ≠ form.

`src/form/glb-silhouette.mjs` (pure CPU rasterizer, GL-free):
- `loadMeshFromGlb(bytes) → {positions,indices,bounds,triCount}` (world-space, baked transforms).
- `rasterizeSilhouette(mesh,{view,width,height,region}) → {w,h,data,fgCount,bbox}` — **same mask shape as
  `extractSilhouette`**, so it drops straight into `normalizeSilhouette`/`iou`.
- `cameraForMeshBounds(bounds, view)` frames the mesh by its own AABB via `render/src/camera.mjs::framedCamera`.

The existing pattern that ties them (in `benchmarks/sculpture/building-build.mjs::judgeIoU`):
`decodeImage(renderPath) → extractSilhouette(·,RENDER_BG)` vs `loadMeshFromGlb → rasterizeSilhouette(·,{view:BUILDING_VIEW_3Q})`
→ `iou(normalizeSilhouette(r), normalizeSilhouette(g))`. **This is the form half of the perceptual scorer.**

## Color / palette machinery (reuse — AC #2 "via block-table.mjs Lab")

- `src/color/block-table.mjs`: `loadBlockTable(path=TABLE_PATH) → {blocks:[{block,texture,rgb,lab,var}],…}`
  loads the committed `src/color/block-lab-table.json` (no asset deps, runtime-safe). `srgbToLab(rgb)`.
- `src/color/cielab.mjs`: `srgbToLab`, `deltaE76`/`deltaE`, `nearestLab(targetLab, palette,{metric})`,
  `nearestFlat`, `nearest(rgb,palette)`. All pure.
- `src/color/palette-extract.mjs`: `decodeImage(path) → {width,height,data}` (lazy, isolated decode shell);
  `aggregateForeground(img,opts)`, `medianCutLab(points,k)`, `extractPaletteFromPixels(img,opts)`,
  `isBackground`. The pure pixel→palette path (E-10).

So the build's **dominant block colors → Lab** comes from its `artifact.placements` block IDs joined to the
block-lab table; the concept/build **per-region colors** come from `decodeImage` + a coarse grid + Lab.
Snapping render/concept cell colors to the nearest block-table Lab keeps both sides in the block vocabulary
(`nearestLab`) and yields a block-name-per-zone map for diagnostics.

## Metered multimodal judge seam (reuse — AC #3)

- `src/sdk-binding.mjs` is the model seam. `requestTextWithImage({prompt, images, model, …}) → {text, raw}`
  spawns `claude -p --output-format stream-json --verbose --input-format stream-json`, builds a user turn via
  `buildImageTurn(prompt, images)` (text + base64 image blocks), serializes via `serializeStreamJsonInput`.
  **This is the metered call** — never exercised by `npm test` (spec §4).
- `stripToJson(text)` (exported, **pure**, unit-tested in `sdk-binding.test.mjs`) strips ```json fences and
  slices the outermost `{…}` — the parse primitive for a JSON verdict.
- Precedent: `benchmarks/temple-facade/judge.mjs` (`judgeRender`) samples N, median-aggregates a categorical
  enum; it shells to a BAML stage. We do **not** need BAML — a fixed prompt + `requestTextWithImage` +
  `stripToJson` + a hand-rolled enum validator is lighter and keeps parse logic pure/testable.

## Render + triptych I/O (impure shell)

- `render/src/render-tool.mjs::renderArtifact(artifact,{outPath,view}) → {path,bytes,…}` re-renders a build
  at a view (GL). Used by `building-build.mjs`. The fixed lens (T-075-01 SSAA) is now the default.
- `render/src/headless-canvas.mjs::encodeRgbaToPng(rgba,w,h)` (node-canvas, synchronous) — the PNG encoder
  for the assembled triptych. node-canvas can also draw panel labels (impure cosmetic).
- `src/building.mjs`: `BUILDING_VIEW_3Q = {azimuthDeg:45, elevationDeg:30, fov:45}` (frozen) — the shared lens.

## Conventions & boundaries

- **Pure core in `src/**`** runs under the root `npm test` glob (`src/**/*.test.mjs`); must never pull GL,
  a host tool, network, `Date`/random. Impure runners live in `benchmarks/**` (not unit-tested), expose an
  `--offline` re-derivation path, and own GL/file/host-tool/model edges. (`building-build.mjs` is the model.)
- Schema-tagged JSON outputs (`schema: "x/v1"`) for downstream version-checks; floats rounded for stability.
- Cross-package imports `benchmarks → render → src` are already established (`building-build.mjs`).

## Constraints / assumptions surfaced

1. The GLB is gitignored → the live runner must guard its absence (as `building-build.mjs` does) and the
   `--offline` path must work from committed PNGs/JSON for CI/reproduction.
2. Concept is *approximately* 3/4; absolute IoU and per-zone ΔE are depressed by camera mismatch — the
   honest reading is the relative/categorical signal, not the absolute (inherited E-13/E-14 caveat).
3. The perceptual scorer must be pure/GL-free/unit-tested; the runner (re-render + metered judge) is impure.
4. Material **zoning** needs 2-D positions; the artifact has no projection, so zoning is read from render
   pixels (the build's actual appearance), snapped to block-table Lab — a rough zoning proxy, explicitly
   diagnostic (Rule 2), not the verdict.
