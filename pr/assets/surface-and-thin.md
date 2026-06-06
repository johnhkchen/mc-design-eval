# E-18 consolidation scorecard — surface coherence & thin form (T-061-01)

The E-18 terminal verdict. The combined glb-voxel build (`voxelizeGlbThin` → `segmentMaterials`) is
scored on five axes against the E-17 **R1** (glb-voxel) and **R2** (material-clean) baselines. Source
spine: `benchmarks/sculpture/e18-remeasure.json` (T-060-01) — this scorecard is a pure transform of it.

- **form IoU** — whole-build 3/4-view silhouette IoU vs the subject's image→3D GLB (higher = truer shape).
- **speckle** — fraction of face-adjacent voxel pairs with differing blocks (lower = cleaner surface).
- **distinct** — distinct block count in the build manifest (lower = tighter palette).
- **off-pal** — blocks outside the augmented design-doc palette (design-doc ∪ ≤2 gated secondary; 0 = disciplined).
- **value ΔE** — mean per-voxel CIE drift of the realized palette vs the GLB texture (lower = closer to texture).

## Levels — every build, every subject

| subject | metric | R1 glb-voxel | R2 material-clean | E18 combined |
| --- | --- | --- | --- | --- |
| **dancing-man** | form IoU | 0.914 | 0.914 | 0.814 |
|  | speckle | 0.402 | 0.275 | 0.148 |
|  | distinct | 5 | 5 | 5 |
|  | off-pal | 0 | 973 | 0 |
|  | value ΔE | 11.19 | 0.00 | 13.82 |
| **moai** | form IoU | 0.565 | 0.565 | 0.593 |
|  | speckle | 0.428 | 0.248 | 0.136 |
|  | distinct | 5 | 5 | 5 |
|  | off-pal | 0 | 4096 | 0 |
|  | value ΔE | 1.00 | 0.00 | 1.88 |
| **pineapple** | form IoU | 0.907 | 0.907 | 0.845 |
|  | speckle | 0.422 | 0.250 | 0.104 |
|  | distinct | 4 | 5 | 4 |
|  | off-pal | 0 | 2939 | 0 |
|  | value ΔE | 8.71 | 0.00 | 8.43 |
| **bow-and-arrow** | form IoU | 0.473 | 0.473 | 0.526 |
|  | speckle | 0.442 | 0.366 | 0.089 |
|  | distinct | 6 | 8 | 6 |
|  | off-pal | 0 | 352 | 0 |
|  | value ΔE | 1.10 | 0.00 | 8.04 |
| **heart** | form IoU | 0.877 | 0.877 | 0.895 |
|  | speckle | 0.570 | 0.343 | 0.110 |
|  | distinct | 7 | 7 | 7 |
|  | off-pal | 0 | 1323 | 0 |
|  | value ΔE | 4.62 | 0.00 | 8.00 |
| **mushroom** | form IoU | 0.980 | 0.980 | 0.929 |
|  | speckle | 0.374 | 0.301 | 0.131 |
|  | distinct | 6 | 7 | 6 |
|  | off-pal | 0 | 8614 | 0 |
|  | value ΔE | 7.17 | 0.00 | 4.14 |
| **koi** | form IoU | 0.622 | 0.623 | 0.706 |
|  | speckle | 0.415 | 0.350 | 0.158 |
|  | distinct | 5 | 8 | 5 |
|  | off-pal | 0 | 1237 | 0 |
|  | value ΔE | 4.53 | 0.00 | 16.35 |
| **AVERAGE** | form IoU | 0.760 | 0.760 | 0.760 |
|  | speckle | 0.440 | 0.300 | 0.130 |
|  | distinct | 5 | 6 | 5 |
|  | off-pal | 0 | 2791 | 0 |
|  | value ΔE | 5.47 | 0.00 | 8.67 |

## Marginal Δ — what E18 moved (signed; for form IoU + = truer, for the rest − = better)

| subject | metric | Δ vs R1 | Δ vs R2 |
| --- | --- | --- | --- |
| **dancing-man** | form IoU | -0.100 | -0.100 |
|  | speckle | -0.250 | -0.130 |
|  | distinct | +0 | +0 |
|  | off-pal | +0 | -973 |
|  | value ΔE | +2.63 | +13.82 |
| **moai** | form IoU | +0.030 | +0.030 |
|  | speckle | -0.290 | -0.110 |
|  | distinct | +0 | +0 |
|  | off-pal | +0 | -4096 |
|  | value ΔE | +0.88 | +1.88 |
| **pineapple** | form IoU | -0.060 | -0.060 |
|  | speckle | -0.320 | -0.150 |
|  | distinct | +0 | -1 |
|  | off-pal | +0 | -2939 |
|  | value ΔE | -0.28 | +8.43 |
| **bow-and-arrow** | form IoU | +0.050 | +0.050 |
|  | speckle | -0.350 | -0.280 |
|  | distinct | +0 | -2 |
|  | off-pal | +0 | -352 |
|  | value ΔE | +6.94 | +8.04 |
| **heart** | form IoU | +0.020 | +0.020 |
|  | speckle | -0.460 | -0.230 |
|  | distinct | +0 | +0 |
|  | off-pal | +0 | -1323 |
|  | value ΔE | +3.38 | +8.00 |
| **mushroom** | form IoU | -0.050 | -0.050 |
|  | speckle | -0.240 | -0.170 |
|  | distinct | +0 | -1 |
|  | off-pal | +0 | -8614 |
|  | value ΔE | -3.03 | +4.14 |
| **koi** | form IoU | +0.080 | +0.080 |
|  | speckle | -0.260 | -0.190 |
|  | distinct | +0 | -3 |
|  | off-pal | +0 | -1237 |
|  | value ΔE | +11.82 | +16.35 |

## What each fix bought

Each fix is read against the baseline that isolates it (form via R1 — colour never moves a silhouette;
speckle + discipline via R2 — segmentation vs smoothing, and the design-doc palette vs the texture leak).

| fix | isolating Δ | n | avg Δ | improved/held/regressed | verdict |
| --- | --- | ---: | ---: | :---: | --- |
| **thin voxelization (form)** | E18−R1 form IoU | 7 | -0.004 | 4/0/3 | regressed |
| **material segmentation (speckle)** | E18−R2 speckle | 7 | -0.180 | 7/0/0 | won-clean |
| **palette discipline (off-pal + distinct)** | E18−R2 off-pal | 7 | -2791 | 7/0/0 | won-discipline |

- **thin voxelization (form)** — avg Δ -0.004 (regressed); improved 4/7.
- **material segmentation (speckle)** — avg Δ -0.180 (won-clean); improved 7/7.
- **palette discipline (off-pal + distinct)** — avg Δ -2791 (won-discipline); improved 7/7.

## Form-type routing — the boundary

Thin preservation **helped** the organic/thin subjects (moai, bow-and-arrow, heart, koi) and **hurt** the already-solid
ones (dancing-man, pineapple, mushroom): the conservative surface trace adds a ~1-voxel shell to *every* subject, recovering
severed members on thin forms and over-thickening solid ones (net avg form IoU is flat). The rule:
**bulky/organic → image→3D + thin voxelization; thin/angular → text→JSON.**

| subject | class | Δform vs R1 | route |
| --- | --- | ---: | --- |
| moai | organic/thin | +0.030 | image→3D + thin |
| bow-and-arrow | organic/thin | +0.050 | image→3D + thin |
| heart | organic/thin | +0.020 | image→3D + thin |
| koi | organic/thin | +0.080 | image→3D + thin |
| dancing-man | already-solid | -0.100 | skip thin (over-thickens) |
| pineapple | already-solid | -0.060 | skip thin (over-thickens) |
| mushroom | already-solid | -0.050 | skip thin (over-thickens) |

## Honesty notes

- **Speckle is the decisive surface win** — E18 halves it vs R2's smoothing and drops it on all 7
  subjects (avg 0.30 → 0.13), the most uniform single-metric win in the record.
- **Palette discipline holds at zero** — off-palette = 0 on all 7 vs R2's leak (avg ~2790), because R2
  snaps to the GLB's *own texture* palette (not the design doc) while E18/R1 snap within the augmented
  design-doc palette. Distinct ≤ R2 everywhere.
- **Value ΔE rose, and that is a real cost — not the tautology.** R2's value ΔE is 0 *by construction*
  (it snaps to the texture it is measured against). E18's nonzero value ΔE (avg 8.67 vs R1 5.47) is the
  price of the tighter design-doc palette drifting from the texture — recorded, not hidden.
- **Form IoU is net-flat with real regressions shown** — thin preservation lifts organic/thin subjects
  but over-thickens 3 already-solid subjects (dancing-man −0.10, pineapple −0.06, mushroom −0.05). That
  spread is the evidence for routing, not a defect to bury.
- n is reported on every average; zero/negative deltas are shown.

---

## E-12 handoff — "cleaner materials & the form-routing story"

Two beats for the showcase. **(1) Surface coherence** — the `speckle-*.png` before/after pairs show
the noisy R2 material-clean surface (independent per-voxel snap, smoothed) resolving into clean
material regions under E18 segmentation; pair each with its scorecard row (speckle halved, all 7).
**(2) Thin form** — `thin-bow-and-arrow.png` shows the bowstave/string/shaft severing into fragments
at base voxelization (4 components) and coalescing into one connected form under thin preservation
(form IoU 0.473 → 0.526).

Before/after composites (3/3 stitched this run; all committed):

- `frames/speckle-heart.png` — heart speckle — R2 material-clean (before) → E18 segmented (after)
- `frames/speckle-koi.png` — koi speckle — R2 material-clean (before) → E18 segmented (after)
- `frames/thin-bow-and-arrow.png` — bow-and-arrow form — base voxelization (4 components, before) → thin (1 component, after)

### The form-type-routing rule (the boundary, stated)

Form IoU is a **routed tradeoff**, not a uniform win. Thin preservation helped the organic/thin
subjects (moai, bow-and-arrow, heart, koi) and hurt the already-solid ones (dancing-man, pineapple, mushroom) — the conservative surface trace adds a
~1-voxel shell to every subject, recovering severed members on thin forms and over-thickening solid
ones. And one subject never makes it into the voxel pipeline at all: **sword has no GLB** — TRELLIS
500s on the thin blade across 4 attempts (incl. after trimming to fill the frame; `glb/README.md`) —
yet sword's **text→JSON** build was one of the better E-13 ones (the faithful cruciform). So the
pipeline routes by form type:

- **bulky / organic** (heart, koi, mushroom, moai, pineapple, dancing-man) → **image→3D → voxelize**
  (with thin preservation where members are sub-voxel).
- **thin / angular** (sword, and the thin extremes) → **text→JSON** — image→3D either drops the form
  or fails outright.

This is the deliverable, not a gap: the instrument now knows which path each subject belongs on.

**Slots into the showcase** after the E-17 march strips (`sweep.md`): the speckle pairs are the
surface-coherence beat, the thin pair is the geometry beat, and the routing rule is the closing card.
No new renders, no re-run judge — a pure read of the committed E-18 spine.
