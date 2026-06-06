---
id: E-18
title: surface-coherence-and-thin-form
type: epic
status: open
priority: high
depends_on: [E-16, E-17]
spec: "§1, §5, §6, §9"
stories: [S-058, S-059, S-060, S-061]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. The mature pipeline grounds form in an **image→3D mesh**: a `vConcept` concept image →
**TRELLIS GLB** → **voxelize** (`glbVoxelBuild`: GLB → occupancy → color → `DesignArtifact`) → render →
judge. The E-17 consolidation sweep (7 sculptural subjects up a ladder: text→JSON → glb-voxel →
+material-clean → +surgical) settled the big questions and left **exactly two gaps**, which this epic
attacks:

1. **Speckle (a surface problem).** The glb-voxel build wins decisively on *form* (avg +0.23 silhouette
   IoU), but its **materials are speckled**: each voxel samples the TRELLIS texture independently, so
   adjacent cells get scattered blocks. E-17's **material-clean** pass (R2 — extract a value-true palette
   from the GLB texture via the E-10 CIE-Lab technique, snap each voxel, light neighborhood smoothing)
   **narrowed but did not eliminate** it — the heart's R2 reads "coherent red with noise," not clean.
   Two specific symptoms, both observed and both worth special attention (a directive):
   - **Palette leakage** — the build pulls in **many blocks beyond the intended palette** (the same-hue
     E-11 expansion + per-voxel nearest-block over a loose/large palette let near-duplicate blocks creep
     in), so the material set is far bigger than the few colors the subject actually has.
   - **Gradients break down** — the GLB texture has **smooth gradients** (shading, color transitions);
     snapping each voxel *independently* turns a gradient into a *scatter* of many near-identical blocks
     (noise) instead of a clean **band or dither**. Gradients are where the speckle is worst.
   Silhouette IoU is blind to all of this, so it shows only on the speckle / palette-size / value-ΔE axis.
2. **Thin forms (a geometry problem, two-headed).** Thin/elongated subjects are the pipeline's weakest:
   - **bow & arrow** *has* a GLB but voxelizes worst (form IoU **0.473**, lowest of the 7) — thin members
     (the bowstave, the string, the arrow shaft) drop out or stair-step at a global voxel scale.
   - **sword** has **no GLB at all**: TRELLIS **500s on it across 4 attempts** (even after trimming the
     subject to fill the frame). Image→3D has a **hard thin-subject failure mode** — the mesh extraction
     crashes on the elongated blade. *Yet sword's text→JSON build was one of the better ones* ("faithful
     cruciform, near-faithful" — E-13). So for thin **angular** forms the pipeline choice **flips**:
     text→JSON serves them, image→3D cannot.

## Goal

Close both gaps and make the resulting picture honest:

- **Kill the speckle** — replace per-voxel snap-and-smooth with **material-region segmentation** under a
  **tight, fixed palette**: (a) confine the whole build to a small canonical palette (a handful of
  value-true blocks extracted from the texture) — **zero off-palette blocks**, distinct-block count ≈
  palette size, no same-hue leakage; (b) fill each contiguous region with one palette block; and (c) where
  a region carries a real **gradient**, render it as a **deliberate band or ordered dither** between two
  adjacent palette steps — never a per-voxel scatter. The proper "clean material regions," not
  salt-and-pepper, and gradients that read as gradients.
- **Preserve thin form** — a **thin-feature-aware voxelization**: detect thin members (local thickness /
  medial axis) and guarantee they survive (connectivity, no dropped components; finer effective resolution
  where thin), lifting the bow-and-arrow voxel build.
- **Map the boundary honestly** — document the **sword / thin-angular** result as a *finding*: image→3D
  (TRELLIS) cannot reconstruct thin angular forms, and text→JSON is their right path. The pipeline is
  **form-type-routed**: bulky/organic → image→3D; thin/angular → text→JSON.

## Why now / why this shape

- These are the **only two gaps E-17 left**, named with numbers (speckle on every voxel build; bow-arrow
  0.473; sword no-GLB). Closing them finishes the "image→3D, grounded then refined" story.
- **Mostly composition + one new idea each.** Speckle → segmentation over the existing value-true palette
  (E-10/E-14) + E-11 material; thin → an adaptive layer over the existing `voxelizeGlb`. Reuses the proven
  stack; net-new is the segmentation pass and the thin-feature detector.
- **The boundary is data, not failure.** Sword's image→3D limit + text→JSON win is a real "which path for
  which form" result — the same form-type-dependence theme as the scale findings.

## Scope

**In:** the **material-region-segmentation** pass (tight fixed palette + connected-region fill + gradient
banding/dither over value-true voxels → clean materials; metrics: distinct-block / off-palette /
speckle, before/after, ×7); **thin-feature-preserving voxelization** (thin-member
detection + connectivity/adaptive-scale → bow-and-arrow et al., form-IoU before/after); **integrate +
re-measure** (both passes combined across the 7 subjects, updated rung metrics: form IoU + speckle +
value ΔE); **consolidation** (the scorecard delta, the **sword/thin-angular boundary finding**,
form-type-routing, journal, E-12 handoff).

**Out:** recovering a sword GLB (TRELLIS hard-fails — documented, not chased; a future fal.ai-TRELLIS
backend is noted, not built); a fresh perceptual judge re-run (the metrics are silhouette IoU + speckle +
value ΔE, as in E-16/E-17); the rubric/brief (immutable); new subjects (the 7 E-13 GLBs + sword as the
thin stress case).

## Candidate stories & DAG (overnight chain — gated, journaled, on main)

```
S-058 material-region-segmentation ─┐
   (kill the speckle, ×7)           ├─▶ S-060 integrate + re-measure ─▶ S-061 consolidation + thin boundary
S-059 thin-feature voxelization ────┘     (both passes, ×7, metrics)      (scorecard delta + form-routing
   (lift bow-and-arrow's form)                                             finding + journal + E-12)
```

- **S-058 — material-region-segmentation (the speckle fix).** Under a **tight fixed palette** (a handful
  of value-true blocks; **zero off-palette leakage**, distinct-block count ≈ palette size), **segment
  contiguous same-material regions** (region-grow / connected components by Lab ΔE in 3-D surface space)
  and **fill each region with one palette block**; where a region carries a **gradient**, render it as a
  **deliberate band / ordered dither** between adjacent palette steps, never a per-voxel scatter. Removes
  salt-and-pepper *and* fixes gradients/palette-bloat. Metrics: **distinct-block count, off-palette count
  (target 0), speckle (neighborhood-disagreement) rate**, before/after, ×7. Pure logic unit-tested.
- **S-059 — thin-feature-preserving-voxelization (the thin fix).** An adaptive layer over `voxelizeGlb`:
  detect **thin members** (local thickness below a threshold / medial axis) and ensure they **survive** —
  guaranteed connectivity (no severed/dropped thin components), finer effective resolution where thin (or
  a per-subject scale bump). Lift **bow-and-arrow** (0.473) and any thin parts (koi fins). Form IoU
  before/after. Pure logic unit-tested.
- **S-060 — integrate-and-remeasure.** Combine both — **segmentation over the thin-preserved voxel build**
  — across the 7 subjects; re-run the rung metrics (form IoU vs GLB, **speckle**, value ΔE) → an updated
  table vs the E-17 R1/R2 baseline.
- **S-061 — consolidation-and-thin-boundary.** The **scorecard delta** (did speckle drop? did
  bow-and-arrow's form rise? any regressions?), the **sword / thin-angular boundary** finding
  (image→3D can't; text→JSON is its path → the pipeline is **form-type-routed**), the journal section, and
  the E-12 handoff (cleaner materials + the form-routing story).

## Definition of done

- The **speckle metric drops** materially on the glb-voxel builds (segmentation beats E-17's R2
  smoothing), shown before/after on ≥the noisy subjects (heart, koi), form IoU not harmed.
- **Bow-and-arrow's form IoU rises** with thin-feature preservation (or, honestly, the limit is shown and
  explained); thin members are **connected, not dropped**.
- The **sword/thin-angular boundary** is documented as a finding with the form-type-routing rule
  (image→3D for bulky/organic; text→JSON for thin/angular), not a silent gap.
- One updated scorecard + journal section + E-12 handoff; `npm test` green.

## Orchestration notes (for the autonomous overnight run)

- **Gated DAG, two parallel roots (S-058 / S-059), on main, journaled** — the proven E-16/E-17 shape.
- **GL-free where it counts.** Region segmentation, thin-member detection, and metric collection are
  **pure/deterministic** — built and unit-tested on synthetic voxel sets/meshes (no GL, no 5 MB GLB in the
  suite); only final renders need GL, behind the existing seam.
- **Local data only.** Reads the 7 gitignored GLBs (`glb/*.glb`) + the E-17 glb-voxel builds. **No
  network** — sword's GLB is not pursued (TRELLIS hard-fails; documented). A subject's GLB regen, if ever
  needed, is `trellis-glb.mjs` (`.env` `MODAL_ENDPOINT_URL`, never printed).
- **Honesty.** A pass that doesn't help (thin preservation may have a ceiling; segmentation may over-merge
  fine detail) is a real result — report the trade, don't hide it. The sword boundary is content.
