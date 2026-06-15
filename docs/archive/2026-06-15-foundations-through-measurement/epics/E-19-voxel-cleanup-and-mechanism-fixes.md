---
id: E-19
title: voxel-cleanup-and-mechanism-fixes
type: epic
status: open
priority: high
depends_on: [E-16, E-17, E-18]
spec: "§1, §5, §6, §9"
stories: [S-062, S-063, S-064, S-065, S-066]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. Two build paths exist: **text→JSON** (the model emits voxel placements directly — clean,
deliberate, *few* coherent regions of intended blocks) and **GLB-voxel** (E-16/17/18: voxelize a TRELLIS
image→3D mesh, color each cell from the GLB's baseColor texture). GLB-voxel wins decisively on **form**,
but side-by-side its **color/material reads visibly worse than text→JSON's clean palette**: speckle, stray
voxels, and busy texture. **This epic regains the text→JSON cleanliness on the GLB-voxel path** — without
SAM (deferred; SAM-3D is for region-level textures *later*), staying on TRELLIS.

**Two grounding facts (verified, not assumed):**
- The E-18 palette fix *is* live: the build snaps within the **design-doc manifest** (the few blocks the
  model chose), not the full 305-block table — heart went 91→7 distinct blocks. Good.
- But cleanliness is **still inadequate**, for reasons documented by the prior tickets' own `review.md`
  "Open concerns" — issues the agents **found and flipped past without fixing**. This epic clears them.

**The real, documented, unfixed issues (the cleanup backlog):**
1. **Gated secondary never reaches the final build (verified bug).** The integrate runner
   (`benchmarks/sculpture/e18-remeasure.mjs:187`) passes `palette: prim` (primary design-doc only) while
   its own rationale claims "augmented" — so the ≤2 gated secondary blocks (T-058-03, meant to cut drift)
   are computed but **never placed**. Either wire `aug` in, or the secondary work is dead.
2. **Gradients scatter on non-cardinal axes** (`material-segment.mjs` `gradientAxis` — T-058-01 review
   concern #3). Banding assumes a cardinal i/j/k axis; a diagonal gradient (rounded organic surfaces:
   heart chest, koi body) fragments into salt-and-pepper. Needs a PCA/true-axis band.
3. **Texture-busy blocks pollute the palette.** The block→Lab table scores each block by its **mean**
   color, so high-texture-variance blocks (`dead_brain_coral_block`, `nether_quartz_ore`, `mycelium`) win
   a mean-ΔE fit yet add *visual* noise back (visible on the heart). text→JSON stayed clean by using flat
   solid blocks (concrete/terracotta/wool). Penalize/exclude high-variance blocks.
4. **`minRegion` absorbs legitimate detail** (T-058-01 concern #1): the speck-absorb threshold (12 cells)
   eats real small features (mushroom cap spots) along with noise. Needs to distinguish noise from intent.
5. **Stray voxels / disconnected geometry** (T-060/T-061 notes: moai shows ≥3 components). TRELLIS can
   reconstruct extra masses + hallucinated connectors (the moai's duplicate statues + bridging bars). No
   pruning exists. A no-SAM fix: keep the principal connected component(s), drop small floating islands.
6. **Speckle metric is boundary-sensitive / coverage-blind** (`material-clean.mjs` `speckleScore` —
   T-058-01 concern #4): it counts every face-adjacent differing pair, so an *intentional* material edge
   reads as "speckle" and the metric rewards "paint it all one block." It can't tell noise from a clean
   boundary — so we can't trust it to score cleanliness.
7. **Thin preservation applied universally** (T-061 concern #4, a stated-but-unwired design debt): the
   combined build runs `voxelizeGlbThin` on all 7, over-thickening the 3 already-solid forms (dancing-man
   form IoU −0.10) and ~2× occupancy. The form-type routing rule is *named* but not *wired*.

(Note: a sub-agent sweep also reported a `glb-voxel-seg.mjs` ReferenceError and an "integrate uses no
palette / texture-median-cut fallback" — **both checked and FALSE**; not in scope. The list above is the
verified set.)

## Goal

Make the GLB-voxel build's color/material **as clean as text→JSON** and **free of stray geometry**, and
fix the mechanisms that produced the mess — measured honestly. Concretely: clean coherent material regions
(no speckle), a tight palette of *flat* blocks (no busy textures), gradients that band cleanly on their
true axis, the gated secondary actually placed, no floating/duplicate geometry, thin-preservation only
where it helps, and a cleanliness metric that doesn't lie.

## Scope

**In:** (a) **cleanliness metrics** — a stray-voxel / disconnected-component count, and a fix to
`speckleScore` so intentional boundaries don't count as noise; (b) **stray-voxel & component pruning**
(keep principal component(s), drop floating islands — kills the moai's extra masses/connectors) + the
`prim`→`aug` integrate fix; (c) **clean-color materials** — texture-variance-aware palette (exclude/penalize
busy blocks → flat blocks like text→JSON), PCA/true-axis gradient banding, `minRegion` retune that keeps
legitimate detail; (d) **per-subject thin-routing** (wire the named rule: thin/organic → thin-preserve,
solid → skip); (e) **re-measure + consolidation** vs the busy E-18 builds, journaled, E-12 handoff.

**Out:** SAM / instance segmentation (deferred — SAM-3D for region textures later); changing the
image→3D backend off TRELLIS; the rubric/brief (immutable); new subjects (the 7 with GLBs); the sword
boundary (settled — text→JSON's domain).

## Candidate stories & DAG (overnight chain — gated, journaled, on main)

```
S-062 cleanliness metrics ─┬─▶ S-063 stray-voxel pruning (+aug fix) ─┐
   (measure noise + strays;  ├─▶ S-064 clean-color materials ────────┤
    fix the lying metric)    └─▶ S-065 per-subject thin-routing ──────┴─▶ S-066 re-measure + consolidate
```

- **S-062 — cleanliness-metrics.** You can't clean what you can't measure. Add a **stray-voxel /
  disconnected-component** metric (count + largest-component fraction) and **fix `speckleScore`** so an
  intentional material boundary (a region edge) isn't counted as speckle — separate *fragmentation* (bad)
  from *clean boundaries* (good). Pure, unit-tested. The honest scoreboard the fixes hill-climb.
- **S-063 — stray-voxel-pruning (+ the secondary-palette fix).** A no-SAM artifact cleanup: compute
  connected components of the occupancy, **keep the principal component(s)** (and any above a size floor),
  **drop small floating islands** — removing the moai's duplicate statues + hallucinated connecting bars
  and general debris. Also fix the verified bug: the integrate/combined build must pass the **augmented**
  palette (`aug`), so the gated secondary blocks are actually placed. Measured by S-062's stray metric.
- **S-064 — clean-color-materials.** Regain text→JSON's clean color: (1) **texture-variance-aware
  palette** — score each candidate block by its texture variance and **prefer flat solid blocks**,
  excluding busy ones (coral/ore/mycelium) from the design-doc snap *and* the gated secondary; (2)
  **PCA/true-axis gradient banding** so diagonal gradients band cleanly instead of scattering; (3)
  **`minRegion` retune** that absorbs noise without eating legitimate small detail. Measured by the fixed
  speckle metric + visual before/after.
- **S-065 — per-subject-thin-routing.** Wire the named-but-unwired rule: enable `voxelizeGlbThin` only for
  **thin** subjects (bow-and-arrow, koi), use plain `voxelizeGlb` for **solid/bulky** ones (heart,
  mushroom, pineapple, moai, dancing-man) — stop the universal over-thickening (dancing-man −0.10) and the
  ~2× occupancy on subjects that don't need it.
- **S-066 — cleanup-consolidation.** Rebuild all 7 with the fixes; re-score (form IoU + the fixed speckle
  + stray-voxel count + distinct/off-palette + value ΔE) **vs the busy E-18 builds**; a before/after visual
  (heart/koi/moai) showing the JSON-grade cleanliness regained; journal section; E-12 handoff.

## Definition of done

- The GLB-voxel builds read **as clean as text→JSON** on color/material: the fixed speckle metric drops
  materially, the palette is **flat blocks only** (no busy-texture blocks), gradients band cleanly.
- **Stray geometry is gone**: the moai loses its duplicate masses/connectors (largest-component fraction
  ≈ 1, or the few legitimate parts retained); a committed stray-voxel count, before/after.
- The **gated secondary is actually placed** in the final build (verified: `aug` wired in).
- **Thin-preservation is routed** per subject (no over-thickening of solids); form IoU recovers on the 3
  regressed subjects.
- `npm test` green; a before/after consolidation + journal + E-12 handoff.

## Orchestration notes (for the autonomous overnight run)

- **Gated DAG, metric-first then 3 parallel fixes then consolidate, on main, journaled** — the proven
  E-16/17/18 shape. Two threads (`max_threads=2`): the fixes fan out after the metrics.
- **GL-free where it counts.** Component pruning, the variance-aware palette, gradient banding, `minRegion`,
  and the metrics are **pure/deterministic** — built and unit-tested on synthetic voxel sets (no GL, no
  GLB); only final renders need GL, behind the existing seam. Texture-variance per block is computed from
  the committed `minecraft-assets` textures (offline).
- **Act on the backlog, don't re-document it.** Each "Open concern" above has a home in a story; the
  consolidation must confirm each is *closed* (or honestly explain why not), not just re-measured.
- **No SAM, stay on TRELLIS.** Stray geometry is handled geometrically (component pruning), not by
  re-segmenting the input. SAM-3D enters later for region-level textures.
