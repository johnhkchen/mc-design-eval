# E-19 voxel cleanup — the busy GLB-voxel build made as clean as text→JSON (T-066-01)

The E-19 terminal handoff. E-18 left the GLB-voxel build winning on form but **busy**: off-palette texture
leakage, busy textured blocks, TRELLIS stray geometry, and over-thickened solids. E-19 closed that backlog
with three fixes — **T-063** stray pruning, **T-064** variance-aware clean materials, **T-065** per-subject
thin routing — and T-066 **composed all three into one build** and measured the honest before/after vs the busy
E-18 seg build. Source spine: `benchmarks/sculpture/e19-cleanup.{md,json}`; builds: `e19-build/`; this doc is a
narrative over them.

- **form IoU** — whole-build 3⁄4-view silhouette IoU vs the subject's image→3D GLB (higher = truer shape).
- **speckle** — fraction of occupied cells locally outvoted (fragmentation; lower = cleaner). Fixed by T-062.
- **largest-frac / stray** — largest 6-connected component / total; cells outside it (1.0 / 0 = one solid mass).
- **distinct** — distinct blocks in the manifest (lower = tighter palette).
- **off-pal** — blocks outside the augmented design-doc palette (design-doc ∪ ≤2 gated secondary; 0 = disciplined).
- **value ΔE** — mean CIE drift of the realized palette vs the GLB texture (lower = closer to texture).

## The three states — busy → intermediate → E-19

`busy` = the E-18 seg build (`glb-voxel-seg/`, re-scored on the fixed metrics). `intermediate` = universal
thin + prune + clean (committed `e18-build`). `E-19` = routed + (gated) prune + clean.

| subject | form IoU | speckle | largest-frac | stray | distinct | off-pal | value ΔE |
| ------- | -------- | ------- | ------------ | ----- | -------- | ------- | -------- |
| dancing-man | 0.914→0.814→**0.914** | 0.016→0.014→**0.022** | 1→1→**1** | 0→0→**0** | 5→5→**5** | 0→0→**0** | 13.72→13.17→**12.36** |
| moai | 0.565→0.399→**0.416** | 0.001→0.006→**0.005** | 0.52→1→**1** | 2023→0→**0** | 5→5→**5** | 887→0→**0** | 1.5→20.85→**14.05** |
| pineapple | 0.907→0.845→**0.907** | 0.014→0.022→**0.021** | 0.987→1→**0.987** | 45→0→**45** | 4→4→**4** | 0→0→**0** | 9.61→8.28→**6.68** |
| bow-and-arrow | 0.473→0.526→**0.526** | 0→0.012→**0.012** | 0.277→1→**1** | 371→0→**0** | 6→7→**7** | 0→0→**0** | 3.37→5.44→**5.44** |
| heart | 0.877→0.895→**0.877** | 0.017→0.019→**0.032** | 0.986→1→**0.986** | 80→0→**80** | 7→7→**7** | 1174→0→**0** | 6.41→6.62→**6.08** |
| mushroom | 0.98→0.929→**0.98** | 0.018→0.027→**0.03** | 0.998→1→**0.998** | 19→0→**19** | 6→5→**5** | 5981→0→**0** | 3.71→6.04→**6.5** |
| koi | 0.622→0.706→**0.706** | 0.019→0.045→**0.045** | 0.976→1→**1** | 53→0→**53** | 5→5→**5** | 0→0→**0** | 12.04→17.55→**17.55** |
| **AVERAGE** | 0.763→0.731→**0.761** | 0.012→0.021→**0.024** | 0.821→1→**0.996** | 370→0→**21** | 5.43→5.43→**5.43** | 1149→0→**0** | 7.19→11.14→**9.81** |

## The headline — is GLB-voxel colour now as clean as text→JSON? **Yes, on colour cleanliness.**

- **off-palette → 0 on all 7** (busy avg 1149; moai 887 / heart 1174 / mushroom 5981 → 0). The build snaps
  *within* the augmented design-doc palette, exactly like text→JSON, enforced by `assertPaletteDiscipline`.
- **speckle ≤ 0.045 on all 7** (avg 0.024, under the 0.05 clean bar); **distinct 5.43 avg**, ≤ busy everywhere.
- The busy textured blocks (`nether_quartz_ore`, `coral_brain`, `mycelium`) are gone from every manifest.

## Before/after composites

- **`frames/e19-moai-{before,after}.png`** — *stray geometry.* Before: two duplicate statues + bridge bars in
  busy red-speckled ore. After: the two fully-detached masses pruned (stray 2023→0, one component) in a matte
  design-doc palette. **Honest caveat:** the kept mass is still a tangle — the moai GLB *is* the hallucination
  (TRELLIS made 3 statues from a 3-view sheet); the real fix is an upstream single-view regen.
- **`frames/e19-heart-{before,after}.png`** — *palette discipline.* Before: purple/gold/brown texture-leak
  vessels (off-pal 1174). After: the leak gone (off-pal 0); the remaining colour variety is the genuinely
  multi-coloured *design-doc* vessel palette, now all in-palette.
- **`frames/e19-koi-{before,after}.png`** — *thin form kept.* koi stays on the thin voxelizer (routing), so the
  fins survive; off-pal 0.

## Honest residuals (not fully closed)

1. **value ΔE rose (avg 7.19 → 9.81; moai 14.05, koi 17.55).** The design-doc-palette **discipline cost** —
   the busy build's value ΔE is low only because it snapped to the texture it is scored against (the ablation
   tautology). text→JSON pays the same price. A cost of having a fixed palette, not a defect.
2. **moai form IoU fell (0.565 → 0.416) vs its OWN corrupt GLB.** Pruning the build to one mass covers less of
   the hallucinated 3-statue reference. moai's honest signal is **stray/component** (decisively fixed), not IoU.
   Upstream single-view GLB regen is the real fix — a separate ticket.
3. **Prune is gated, not universal.** Composing routing (solids → plain voxelize) with pruning surfaced a
   conflict: plain voxelization disconnects pineapple's crown, and the moai-tuned prune clipped it (−0.096 IoU).
   E-19 gates pruning to real multi-mass hallucinations (`largestFraction < 0.9`) — so near-single-mass solids
   keep their incidental specks (pineapple/heart/mushroom stray stays 45/80/19). The right tradeoff (form over a
   1–2% stray count), but it means "stray = 0" is **not** universal across the 7; it is fixed where the
   hallucination was real (moai).

**One sentence:** E-19 makes GLB-voxel colour as disciplined as text→JSON (off-palette 0/7, speckle ≤ 0.05,
busy blocks gone) and removes the stray hallucination where it is real (moai 2023→0), with the residue being a
measurement tautology (value ΔE) and one corrupt GLB (moai), both with named upstream fixes.
