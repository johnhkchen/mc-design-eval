# T-053-01 Research — glb-grounded-consolidation (E-16 terminal)

Descriptive map of what the three E-16 arms produced and where the numbers live. This ticket is a
**consolidation/journal**, not a new trial: it reads the artifacts the dependency tickets already wrote
and collects them into one honest head-to-head. No new model calls are required.

## What E-16 asked (three measured questions)

1. **Arm A (T-049-01)** — does a 3-D *target* unlock the E-15 surgical form loop on **text→JSON** builds?
   (Re-run the E-15 koi/heart loop with `glbFormTarget` instead of the flat `conceptFormTarget`.)
2. **Arm B (T-051-01)** — is the **voxelizer's form** better than text→JSON? (Voxelize the real GLB →
   color → DesignArtifact → render → silhouette IoU vs the GLB's own silhouette.)
3. **Synthesis (T-052-01)** — is **GLB-voxel + surgical region tweaks** the capable combination? (Run the
   E-15 loop on the T-051-01 voxel builds with the target = the same GLB each was voxelized from.)

This ticket answers all three with the residual shown, same discipline as the E-14 (value, T-042-01) and
E-15 (form, T-047-01) consolidations.

## Where the measured numbers live (all on disk, all real renders)

### text→JSON baseline (E-13)
- `benchmarks/sculpture/form-baseline.{md,json}` — whole-object silhouette IoU **vs the concept**, the
  E-15 "before". koi **0.481**, heart **0.347**. Mean over the 13-build set 0.479.
- `benchmarks/sculpture/runs/{009-…-koi-fish,006-…-human-heart}/` — the E-13 builds themselves:
  `artifact.json`, `render-3q.png`, `concept.png`, `summary.json`. Both scale 32, opus-4-8, vConcept.

### Arm A — text→JSON with the 3-D target (T-049-01)
- `benchmarks/sculpture/glb-formtarget-ab.{md,json}` — the SAME surgical loop as `form-revise-ab`, only
  the target swapped to `glbFormTarget` (real TRELLIS mesh). Reports both a **whole-object IoU vs the
  GLB** and a **true per-region IoU** (the flat concept could not give a per-region target).
  - koi: whole **0.472→0.472** (region 0.593→0.593, rolled-back) — **held**.
  - heart: whole **0.456→0.462** (region 0.449→0.456, accepted) — **improved**.
  - E-13 concept-target IoU carried as cross-reference (koi 0.481, heart 0.347).
- Renders: `glb-formtarget-ab/{koi,heart}/{before,proposed,after,crop}.png`.

### Arm B — GLB-voxel build (T-051-01)
- `benchmarks/sculpture/glb-voxel/summary.md` + `{koi,heart}/summary.json` — voxelized build's silhouette
  IoU **vs its own GLB**. koi **0.622** (2164 blocks, 71-block manifest), heart **0.877** (5840 blocks).
- Renders: `glb-voxel/{koi,heart}/render-3q.png` + `artifact.json`.

### Synthesis — GLB-voxel + surgical (T-052-01)
- `benchmarks/sculpture/glb-voxel-surgical/glb-voxel-surgical.{md,json}` — E-15 loop on the voxel builds,
  target = the source GLB. Two regions per subject (one LLM `curve` edit, one procedural `relief`).
  - koi: whole **0.622→0.614** — **regressed** (region 0 cleaned 0.513→0.528 *accepted*, but the local
    clean did not transfer to the whole-object silhouette; region 1 rolled back). P14 held.
  - heart: whole **0.877→0.877** — **held** (both regions rolled back). P14 held.
- Renders: `glb-voxel-surgical/{koi,heart}/{before,after,proposed-*,crop-*}.png`.

## The comparability problem (the crux of the consolidation)

The three arms do **not** all measure against the same reference:
- text→JSON E-13 baseline IoU is **vs the concept** (Nano-Banana flat image).
- Arm A reports **vs the GLB** (and carries the concept number as cross-ref).
- Arm B and the synthesis report **vs the GLB** (the build's own source mesh).

A clean head-to-head needs one common reference. The **vs-GLB** number exists for all three arms:
- text→JSON vs GLB = Arm A's `wholeObjectIoUBefore` (the un-edited E-13 build scored against the GLB):
  koi **0.472**, heart **0.456**.
- GLB-voxel vs GLB = Arm B's `silhouetteIoU`: koi 0.622, heart 0.877.
- GLB-voxel+surgical vs GLB = synthesis `wholeObjectIoUAfter`: koi 0.614, heart 0.877.

So **vs-GLB is the apples-to-apples spine** of the table; **vs-concept** (koi 0.481, heart 0.347) is
carried as the E-13 comparability cross-reference the AC asks for. This is the honest way to put all three
on one axis without re-running anything.

## The "judge categorical" question

No arm ran a fresh LLM perceptual judge on koi/heart in E-16 (the E-13 fidelity judge is the last model
judgement on these subjects; the surgical arms use a **deterministic** categorical verdict
`improved | held | regressed`). The E-15 consolidation (the template, T-047-01) used that deterministic
verdict as its categorical and did **not** spin up a new judge. This ticket follows that precedent: the
categorical column is the deterministic loop verdict, plus an **IoU-derived form band** (documented
thresholds, explicitly not an independent judge). Spending metered model calls to re-judge during a
consolidation would add cost and nondeterminism for no new evidence — flagged as honest residual, not
hidden.

## Conventions to match (from the E-14 / E-15 consolidations)

- Each `benchmarks/sculpture/*-ab.{md,json}` has a generating `.mjs`; the consolidator should be
  **reproducible offline** (read the three upstream JSONs, emit the table — no model calls, no renders).
- `docs/knowledge/design-learnings.md` gains a terminal epic section (the E-14 section is at L1458, E-15 at
  L1514) with a before/after table, an honest headline, "where it didn't help / what it cost", and a
  one-sentence close.
- `pr/assets/` handoff is a short markdown beat naming real render files (cf. `form-revise.md`,
  `value-true.md`) — the "image→3D, grounded and refined" story for E-12.

## Constraints

- `npm test` runs only `src/**/*.test.mjs` (+ artifact validation). This ticket touches `benchmarks/`,
  `docs/`, `pr/` — not `src/` — so tests stay green; the obligation is "don't break src", verified at end.
- GLBs are gitignored (large); the consolidator must read the small JSON summaries, not the meshes.
- Honesty mandate (AC): null/negative findings are results. koi-regressed and 2-of-2 / mixed rollbacks are
  the finding, not failures to bury.
