# T-053-01 Design — glb-grounded-consolidation

Decide how to build the three-way head-to-head and the journal, grounded in the research.

## The decision in one line

A **pure offline consolidator** (`glb-grounded-ab.mjs`) reads the three upstream JSON artifacts and emits
`glb-grounded-ab.{md,json}`; the journal section in `design-learnings.md` and the `pr/assets/glb-grounded.md`
handoff are authored from those emitted numbers. No new model calls, no new renders.

## Option space for the head-to-head data source

### A. Re-run the three arms and re-measure into one script ❌
Re-voxelize, re-run both surgical loops, re-score. **Rejected:** burns metered model calls and GPU/voxel
time to reproduce numbers that already exist on disk, and risks nondeterministic drift from the committed
records. The dependency tickets already ran these *live* (records committed at ca96713 / b946cc2). A
consolidation re-measuring its inputs is not a consolidation.

### B. Hand-type the numbers into a markdown table ❌
Fast, but unreproducible and error-prone; if an upstream number is corrected the table silently rots. The
repo discipline (every `*-ab.md` has a generating `.mjs`) exists precisely to avoid this.

### C. Pure offline consolidator that reads the three upstream JSONs ✅ (chosen)
`glb-grounded-ab.mjs` imports/reads:
- `glb-formtarget-ab.json` → text→JSON-vs-GLB (`wholeObjectIoUBefore`) + Arm A loop verdict + per-region.
- `form-baseline.json` → text→JSON-vs-concept (the E-13 cross-reference, koi/heart rows).
- `glb-voxel/{koi,heart}/summary.json` → GLB-voxel-vs-GLB (`silhouetteIoU`).
- `glb-voxel-surgical.json` → synthesis-vs-GLB (`wholeObjectIoU{Before,After}`) + verdict + per-region.

It assembles per-subject rows, derives the categorical band, and emits `.md` + `.json`. Reproducible
(`node glb-grounded-ab.mjs` regenerates byte-stable output from committed inputs), honest (numbers trace to
their source files), and cheap. **This is the E-14/E-15 pattern applied one level up: a consolidator of
consolidators.**

## The table shape (chosen)

One row per subject × method, three methods, with the vs-GLB spine and the vs-concept cross-ref:

| subject | method | form IoU vs GLB | form IoU vs concept | categorical | Δ vs text→JSON |
|---|---|---|---|---|---|
| koi | text→JSON (E-13) | 0.472 | 0.481 | poor | — |
| koi | GLB-voxel (T-051) | 0.622 | — | fair | +0.150 |
| koi | GLB-voxel+surgical (T-052) | 0.614 | — | fair (regressed) | +0.142 |
| heart | text→JSON (E-13) | 0.456 | 0.347 | poor | — |
| heart | GLB-voxel (T-051) | 0.877 | — | strong | +0.421 |
| heart | GLB-voxel+surgical (T-052) | 0.877 | — | strong (held) | +0.421 |

- **vs-GLB** is the apples-to-apples 3-D form axis (exists for all three arms).
- **vs-concept** filled only where it was measured (text→JSON E-13); blank elsewhere, not faked.
- **categorical** = an IoU-derived band (documented thresholds) suffixed with the deterministic loop
  verdict for the two surgical arms (`held`/`improved`/`regressed`). Honest: the band is derived from the
  IoU, not an independent judge — stated in the JSON `note` and the md.

### Categorical band (decided, documented)
`< 0.50 → poor · 0.50–0.70 → fair · 0.70–0.85 → good · ≥ 0.85 → strong`. Chosen to be coarse enough that
small IoU noise doesn't flip a band, and to put the actual numbers in distinct bands (0.472/0.456 poor;
0.622 fair; 0.877 strong). It is a *reading aid*, not a new measurement — the IoU is the evidence.

## Why "judge categorical" is the deterministic verdict, not a new model judge

Considered running the E-13 fidelity judge fresh on all six renders to get an LLM categorical. **Rejected**
for the same reason as Option A: a consolidation should not manufacture new model evidence; E-15's
consolidation set the precedent of using the deterministic verdict. The residual ("a perceptual judge was
not re-run") is reported in the learnings, not hidden. If a future ticket wants a perceptual head-to-head,
that is a new trial, not this journal.

## The three answers the journal must give (with evidence, residual shown)

1. **Did the 3-D target move the E-15 loop on text→JSON?** *Partly — 1 of 2.* heart improved
   (0.456→0.462, the edit cleared the GLB gate); koi held (0.472→0.472, rolled back). Against E-15's flat
   concept (0/2 moved, the heart edit *regressed* and was rejected), the 3-D target is what gave the heart
   a per-region signal worth keeping. **The better target moved the loop where the flat one could not — on
   1 of 2 builds.**
2. **Did voxelization beat text→JSON on form?** *Yes, decisively.* vs the same GLB: koi +0.150
   (0.472→0.622), heart +0.421 (0.456→0.877). Voxelizing the image→3D mesh is a far larger form win than
   any surgical edit on a text→JSON build.
3. **Did surgical tweaks add capability on the voxel set, at what cost?** *No net whole-object gain.* koi
   cleaned one region locally (0.513→0.528, accepted) but the whole-object silhouette *regressed*
   (0.622→0.614); heart rolled back both regions (held 0.877). Cost: one `claude -p` LLM-edit call per
   `curve` region (koi 1 kept / 1 rolled, heart 0 / 2). The honest synthesis finding: **once voxelization
   captures the form, local single-view surgical edits have little headroom and can slightly hurt the
   whole-object silhouette** — the E-15 single-view ceiling persists even with a 3-D target and a voxel
   base.

**The residual** (stated, not hidden): GLB-voxel is not 1.0 (koi 0.622 — thin caudal fin voxelizes chunky;
single 3/4 view; rotation/axis not corrected; translation+scale normalized). Surgical can't reliably climb
whole-object single-view IoU. The metric is silhouette IoU — necessary, not sufficient.

## Journal + handoff (decided)

- `design-learnings.md` += `## E-16 GLB-grounded form — image→3D, grounded then refined (S-053, T-053-01)`,
  mirroring the E-15 section: a vs-GLB before/after table, the three answers, "where it didn't help / what
  it cost", a one-sentence close. Null/negative findings as results.
- `pr/assets/glb-grounded.md` += the E-12 beat: the **voxelization win is the headline** (heart 0.347
  concept → 0.877 GLB-voxel is the visual proof image→3D unlocks form), the surgical refinement is the
  honest "diminishing returns once grounded" footnote. Names real `glb-voxel/*` and `runs/*` renders.

## Risks / mitigations

- *Upstream JSON shape drift* → consolidator reads documented fields with existence checks; a missing file
  throws a clear error rather than emitting a half-table.
- *Number transcription error in the journal* → journal quotes the consolidator's emitted `.md`, which is
  machine-generated from source; cross-checked in Review.
- *Breaking npm test* → no `src/` change; verified green in Implement.
