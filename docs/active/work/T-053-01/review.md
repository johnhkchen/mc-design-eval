# T-053-01 Review — glb-grounded-consolidation (E-16 terminal)

Handoff doc. What changed, how it was verified, and the open concerns a human reviewer should weigh.

## What this ticket is

The **terminal consolidation** of epic E-16. Not a trial — it reads the committed records of the three
E-16 arms (T-049-01 Arm A, T-051-01 Arm B, T-052-01 synthesis) and collects them into one honest
three-way head-to-head for koi + heart, journals the answers, and hands E-12 the beat. Same discipline as
the E-14 (T-042-01) and E-15 (T-047-01) consolidations: a measured before/after, residual shown not hidden.

## Files changed

| file | change | what |
|---|---|---|
| `benchmarks/sculpture/glb-grounded-ab.mjs` | **created** (~290 lines w/ comments) | pure offline consolidator; reads 4 upstream JSONs; emits `.md`+`.json`; exports `band`/`buildModel`; main-guarded |
| `benchmarks/sculpture/glb-grounded-ab.json` | **created** (generated) | machine-readable head-to-head: per-subject method rows + epic-level answers + residual; schema `glb-grounded-ab/v1` |
| `benchmarks/sculpture/glb-grounded-ab.md` | **created** (generated) | human-readable table + 3 answers + residual + per-subject detail |
| `docs/knowledge/design-learnings.md` | **appended** (~55 lines) | `## E-16 GLB-grounded form` terminal section |
| `pr/assets/glb-grounded.md` | **created** (~60 lines) | E-12 handoff beat |

No `src/` files touched. Three commits (consolidator / journal / handoff) + this RDSPI commit.

## The result (the substance)

Three-way, whole-object silhouette IoU **vs the GLB target** (the only axis all three arms share):

| subject | text→JSON | GLB-voxel | GLB-voxel+surgical |
|---|---:|---:|---:|
| koi | 0.472 | 0.622 (+0.150) | 0.614 (regressed) |
| heart | 0.456 | 0.877 (+0.421) | 0.877 (held) |

**The three E-16 questions, answered:**
1. **3-D target on the text→JSON loop:** moved **1 of 2** (heart improved 0.456→0.462, kept; koi held) —
   versus E-15's flat concept at 0 of 2. A better target helps, modestly.
2. **Voxelization vs text→JSON:** **decisive win** (+0.150 koi, +0.421 heart). The real lever.
3. **Surgical on the voxel set:** **no net whole-object gain** (koi regressed despite one accepted local
   region clean; heart held). Cost: one `claude -p` call per `curve` region. Diminishing returns once
   grounded.

## Verification

- **Numbers trace to source** (hand cross-check, each cell):
  - text→JSON-vs-GLB koi 0.472 / heart 0.456 ← `glb-formtarget-ab.json` `wholeObjectIoUBefore`.
  - GLB-voxel koi 0.622 / heart 0.877 ← `glb-voxel/{koi,heart}/summary.json` `silhouetteIoU`.
  - surgical koi 0.614 / heart 0.877 ← `glb-voxel-surgical.json` `wholeObjectIoUAfter`.
  - concept koi 0.481 / heart 0.347 ← `form-baseline.json` `iou`.
  - verdicts (held/improved/regressed) copied verbatim from the upstream records.
- **Reproducible:** `node benchmarks/sculpture/glb-grounded-ab.mjs` twice → byte-identical `.md`+`.json`.
- **Import-safe:** `import()` of the consolidator runs no writes (main-guard verified).
- **`npm test`: 514/514 green** + artifact validation. No `src/` change, so no regression surface.

## Acceptance criteria

- [x] Three-way head-to-head for koi + heart (text→JSON vs GLB-voxel vs GLB-voxel+surgical) with form IoU
      (vs GLB target; vs concept cross-ref where measured) and a categorical, in one before/after table
      → `benchmarks/sculpture/glb-grounded-ab.{md,json}`.
- [x] `design-learnings.md` gains a **GLB-grounded form (E-16)** section answering, with evidence, all
      three questions + the residual; null/negative findings reported as results.
- [x] E-12 handoff (`pr/assets/glb-grounded.md`): best renders (the heart hero pair) + the "image→3D,
      grounded and refined" beat.
- [x] Honest; `npm test` green.

## Open concerns / limitations (for the human reviewer)

1. **The categorical is not an independent perceptual judge.** It is an IoU-derived band + the
   deterministic loop verdict. This is a deliberate decision (matching the E-15 consolidation; a fresh
   judge would manufacture new model evidence in a consolidation). If a reviewer wants a perceptual
   head-to-head, that is a **new trial**, not this journal. Stated in the artifact `note` and the learnings.
2. **n = 2 (koi, heart).** Both subjects are the two E-13 form *failures* the epic targeted — the win is
   measured on the hardest cases, but the sample is small. Generalization is not claimed.
3. **The IoU axis is single-view silhouette.** Necessary, not sufficient (two shapes can share an
   outline); rotation/axis not corrected; translation+uniform scale normalized out. The koi 0.622 *fair*
   band carries a real residual the metric can't see (the chunky caudal fin). Carried, not hidden.
4. **text→JSON-vs-GLB uses Arm A's `wholeObjectIoUBefore`** as the un-edited text→JSON build's score
   against the GLB. This is the correct number (the E-13 build, pre-edit, vs the GLB), but it is sourced
   from the Arm A harness rather than a standalone text→JSON-vs-GLB measurement. The provenance is
   documented in the consolidator's `generatedFrom`/`note`.
5. **GLBs are gitignored** (large); the consolidator reads only the small JSON summaries, so re-running it
   does not require the meshes. The PR-handoff renders are committed PNGs (verified on disk).

## Bottom line

E-16 is answered honestly: **grounding the geometry in an image→3D GLB (voxelization) is the decisive form
win**; a 3-D target nudges the surgical loop where a flat concept couldn't (1 of 2); and surgical polish on
an already-grounded build adds no net whole-object gain. The path to form is the grounding, not the polish
— and the cage that won't fake a win still holds. The consolidation is reproducible and the residual is on
the page.
