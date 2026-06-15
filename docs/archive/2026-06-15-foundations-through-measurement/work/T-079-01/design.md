# Design — T-079-01 spray-paint-materials

Decide the shape of the spray-paint judgement path, grounded in Research. The AC has six mechanisms:
(1) a **face-paint tool** (project a face, present build face beside the concept's same face, LLM
paints); (2) a **splat path** (auto-paint a per-cell material target — concept-image for the front,
textured-GLB for sides/roof); (3) the **enforced palette** ("4 cans" = manifest ∪ concept-justified
additions, off-palette structurally impossible); (4) **back-projection** (paint lands on the front-most
surface voxel; corner voxel takes concept-matching paint; occluded keeps fallback); (5) **per-face
accept-if-closer** (E-22 resemblance per face, P14-safe rollback); (6) the cottage front+side run
recording the plaster band restored. Pure cores unit-tested; the paint judgement is the metered call.

## The central decision: splat-first, LLM-refines — paint is a recolor placement

The whole point of `[[twodee-interaction-sector]]` is that the LLM does **not** place every cell. So
the pipeline is: **auto-splat a per-cell material target onto the face → back-project it to recolor
placements → let the LLM refine/judge → accept per-face only if it moves toward the concept.** The
splat does the bulk work; the metered call is one refinement/judgement per face, not 171 cell writes.

A **paint = an appended `{op:"voxel", pos, block}`** at a surface voxel's position (Research: expand
is last-write-wins, full replace; no air op). This makes paint **geometry-safe by construction** —
recolor only, never moves/adds/removes a voxel — and AJV-valid because it is just more placements.
The face-paint tool's output is a *list of recolor placements*, appended to the artifact.

## Mechanism 1+4 — `paintFace`: splat → back-project → recolor placements (PURE)

`paintFace(occ, dir, target, { palette })` is the pure core. Steps:
1. `grid = projectSurface(occ, dir)` — the canvas (T-078).
2. For each filled cell `(u,v)` with a `target[v][u]` block (the splat's per-cell material), emit a
   recolor at the cell's stored `voxel` **iff** the target block ≠ the current block AND the target is
   in the enforced palette. Air/target-null cells are skipped (no air op).
3. Return `{ placements:[{op:"voxel", pos, block}], painted, skipped, offPalette }`.
Back-projection is the stored-voxel read (T-078 invariant) — **unambiguous because ortho/45°**.

**Corner-voxel precedence (AC #4).** A voxel on a shared edge is the front-most cell of *two* ortho
faces, so two `paintFace` passes can target the same `pos`. Decision: paint passes carry a **source
tag** (`concept` for the front, `glb` for sides) and a per-position **priority** — `concept` outranks
`glb`. `mergePaints(passes)` resolves collisions by priority (concept-matching wins), and a voxel that
no pass reaches **keeps its current block** (the colorimetric fallback from the E-21 build — we never
null it). This is the AC's "corner voxel visible from two faces takes the concept-matching paint;
occluded interior keeps the colorimetric fallback," realized as a pure merge over tagged passes.

**Rejected:** writing paint as a 2-D image and re-deriving voxels from a render — Research rules this
out (perspective inverse is ambiguous; that is exactly why T-078 scoped paint-back to ortho/45° and
stores the source voxel). We back-project off the stored voxel, never off pixels.

## Mechanism 2 — the two splat sources

**Front (concept splat).** The concept image *is* the front truth. Reuse T-078's
`quantizeToFace(conceptPath, frontGrid, { manifest })` verbatim — it already snaps within the manifest
(validate mode → `outOfPalette` 0). Its `GridResult.grid` is the per-cell target `paintFace` consumes.
Already built; this ticket only wires it.

**Sides/roof (textured-GLB splat).** The concept never shows these faces, so the textured GLB is the
truth. Research surfaced a hard constraint: **there is no textured-GLB→PNG renderer in the repo** (the
GLB is only silhouette-rasterized or voxel-color-sampled). Building a headless three.js GLTF
render-to-PNG pipeline is disproportionate to this ticket. **Decision: do the GLB splat in voxel
space** — `sampleSurfaceColors` + `colorVoxelsToArtifact` (snap to the manifest palette) already give
a **colour-true GLB-voxel occupancy**; projecting *that* occupancy through the SAME Path-P ortho `dir`
yields a per-cell material target that is **same-angle by construction** (both faces are the identical
ortho projection — no camera mismatch to quantize away). This *is* "render the textured GLB at the same
angle and grid-quantize to the face cell grid," done on the lattice instead of on pixels, and it
maximizes reuse of shipped, tested machinery.

- *Rejected:* a new headless GLTF renderer → PNG → `gridFromImage`. Correct in principle, but a
  multi-day GL build for a marginally different result; the voxel-space projection is cleaner and
  cell-exact. The seam (`splatTarget(source)` → a per-cell grid) keeps a PNG-render source pluggable
  later if a textured renderer ever lands.
- The GLB-voxel occupancy and the build occupancy may differ in extent/registration; the splat is
  **resampled onto the build face's `(n,m)`** (nearest cell) so it always lines up with the canvas.

## Mechanism 3 — the enforced palette (the "4 cans")

`allowedPalette(artifact)` = `bareList(artifact.palette.manifest)` ∪ **concept-justified additions**.
`paintFace` rejects any target block not in this set (`offPalette` counted, never placed) — off-palette
paint is **structurally impossible**, killing the 91-block bloat by construction
(`[[voxel-palette-must-be-design-doc]]`). The concept-justified-growth right (E-21): a concept material
the build is *missing* may be added back via an explicit `additions` list the caller passes (e.g.
`white_terracotta` is already in the manifest; a dropped `spruce_door` could be re-added). Additions
extend the allowed set *and* the artifact manifest together (so AJV stays consistent). This reuses the
`gridFromImage` `whitelist` mechanism for the splat and a `Set` membership test for the LLM's proposals.

## Mechanism 5 — per-face accept-if-closer (E-22 gate, P14-safe)

Mirror the `reviseLoop` accept contract (Research) but **per face**, with the E-22 resemblance
`zoneAgreement` as the score:
- `faceScore(artifact, dir, conceptFaceImg)` = render the BUILD at `dir` (`renderViews`, fixed lens) →
  `zoneAgreement(buildFaceImg, conceptFaceImg, blockTable)` → `score` in [0,1]. PURE scorer over
  already-decoded images (the GL render is the impure edge).
- `before = faceScore(art, dir)`; apply the face's merged paint → `candidate`; `after =
  faceScore(candidate, dir)`; **accept iff `after > before + epsilon` else roll back** (P14-safe — a
  paint that doesn't move the face toward the concept is discarded, exactly the loop's gate). The
  accepted face's paint is committed; the next face starts from the committed artifact.
- This is a *thin per-face loop*, not the full region machinery — one splat + one optional LLM refine
  + one gate per face is far lighter than `reviseLoop`'s per-region tweak search, and the faces are
  the natural lock unit. **Rejected:** bending `reviseLoop`'s 3-D region bbox onto 2-D faces — the
  region abstraction is voxel-bbox-shaped; faces are projection-shaped; forcing the fit obscures both.

## Mechanism — the LLM refine/judge (the metered call)

After the splat (and before the gate), the LLM is shown the **build face beside the concept's same
face** (two images, `requestTextWithImage` or the BAML bridge idiom from `material-correct.mjs`) plus
the enforced palette and the current per-cell target, and asked to **refine** the splat (correct
obvious mis-zonings — e.g. confirm the plaster band, fix a stray) — *not* place every cell. Its reply
is a small set of cell overrides constrained to the allowed palette. This is the **one metered call
per face**; everything else (splat, back-project, gate) is deterministic. The refine is optional —
the splat+gate runs without it for the offline/test path, so the metered call is isolated to the
runner, never in `npm test`.

## Why this shape (summary of rejected alternatives)

- *LLM places every cell:* rejected — defeats the splat-first thesis; the splat does the bulk, the LLM
  refines (`[[twodee-interaction-sector]]`).
- *Paint via air/recess ops:* rejected — no air op (`[[facade-recess-by-exclusion]]`); recolor only.
- *Read paint back off a render:* rejected — ambiguous perspective inverse; back-project off the stored
  voxel (T-078).
- *New textured-GLB→PNG renderer:* rejected — disproportionate; voxel-space Path-P projection is
  same-angle by construction and reuses shipped code.
- *Reuse `reviseLoop` regions for faces:* rejected — region bbox ≠ face projection; a lean per-face
  gate mirrors the same accept-if-closer contract without the impedance mismatch.
</content>
