# glb-grounded.md — "image→3D, grounded then refined" (E-16 / S-053)

E-15 closed with an honest stall: the surgical form loop, measured against a **flat Nano-Banana concept**,
was too blunt for local edits to climb — and said so. E-16 lands the lever E-15 named: a real **TRELLIS
GLB** (image→3D) as the target. The result is the cleanest beat in the form arc, because the win is large,
*deterministic*, and needs no per-region model loop at all.

All renders are **real prismarine-viewer voxels**.

## The number — three-way, whole-object silhouette IoU vs the GLB target

| subject | text→JSON (E-13) | **GLB-voxel** | GLB-voxel + surgical | Δ (voxel − text→JSON) |
|---|---:|---:|---:|---:|
| **heart** | 0.456 | **0.877** | 0.877 | **+0.421** |
| **koi** | 0.472 | **0.622** | 0.614 | **+0.150** |

Source: `benchmarks/sculpture/glb-grounded-ab.{md,json}` (the consolidator over the three arms' committed
records). vs-GLB is the apples-to-apples axis; the E-13 concept cross-ref (heart 0.347, koi 0.481) is in
the full table.

## The hero pair — the form win, on screen

The headline is **text→JSON → GLB-voxel**: grounding the geometry in an image→3D reconstruction is what
unlocks form.

- **heart** (the strongest read): `runs/006-vConcept-an-anatomically-correct-human-heart/render-3q.png`
  (text→JSON, IoU 0.456 vs GLB — the open arch, the proportion drift) →
  `glb-voxel/heart/render-3q.png` (GLB-voxel, **0.877** — the chambers and great vessels land). Caption:
  *"text→JSON guesses the shape; voxelizing the image→3D mesh builds it — 0.46 → 0.88."*
- **koi** (the honest one): `runs/009-vConcept-a-koi-fish/render-3q.png` (0.472) →
  `glb-voxel/koi/render-3q.png` (**0.622**). The body and S-curve recover; the thin caudal fin voxelizes
  chunky, so the win is large but not total — *fair*, not *strong*. Caption: *"+0.15 of real form, and the
  honest residual a single 3/4 view still can't see."*

## The footnote — surgical refinement, the honest diminishing return

`glb-voxel-surgical/koi/before.png` → `glb-voxel-surgical/koi/after.png`. On a build that already scores
0.622, the E-15 surgical loop cleaned **one** region locally (the chunky fin, region IoU 0.513 → 0.528,
*accepted*) — but the whole-object silhouette **regressed** (0.622 → 0.614): the local clean didn't
transfer. The heart's two regions both **rolled back** (held 0.877). The cage held (it refused every
non-improving edit); it just had little headroom to add. The honest caption: *"once the form is grounded,
there's little left for a local edit to win — and the cage won't fake one."*

## The Arm-A aside (optional, for the method-curious)

The 3-D target also moved the *text→JSON* surgical loop where E-15's flat concept couldn't:
`glb-formtarget-ab/heart/before.png` → `glb-formtarget-ab/heart/proposed.png` — the heart edit cleared the
GLB gate and was **kept** (0.456 → 0.462), versus E-15's flat concept which *rejected* a regressing edit
(0 of 2). A better target makes a real, if small, difference.

## Suggested E-12 beat

The **heart text→JSON → GLB-voxel** pair with **0.46 → 0.88** burned in, captioned *"image→3D grounds the
form."* Then one line of honesty: *the surgical loop on top adds almost nothing once grounded (koi
regressed, heart held) — the win is the grounding, not the polish.* The beat is the **measured arc**
(flat-concept stall → 3-D grounding → diminishing-returns polish), not a fabricated climb.
