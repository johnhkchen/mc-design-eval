# GLB-grounded form — the E-16 three-way head-to-head (T-053-01)

E-15 measured the form gap against a **flat concept** and the cage refused to fake it. E-16 grounds the loop in a **real TRELLIS GLB** (image→3D) and asks three questions: does a 3-D *target* move the E-15 loop on text→JSON builds; does **voxelizing** the GLB beat text→JSON on form; do **surgical** tweaks on the voxel set add capability? This consolidates the three arms' committed records into one table. **Numbers are read from disk, not re-measured.**

**Headline:** voxelizing the image→3D mesh is the form win (koi +0.150, heart +0.421 vs text→JSON, against the same GLB). The 3-D target moved the text→JSON loop on **1 of 2** (heart); **surgical refinement on the already-grounded voxel set added no net whole-object gain** (koi regressed, heart held) — the honest diminishing-returns finding.

## The three-way — whole-object IoU vs the GLB target (E-13 concept as cross-ref)

| subject | method | IoU vs GLB | IoU vs concept | Δ vs text→JSON | categorical |
|---------|--------|:----------:|:--------------:|:--------------:|-------------|
| **koi** | text→JSON (E-13) | 0.472 | 0.481 | — | poor |
|  | GLB-voxel (T-051-01) | 0.622 | — | +0.150 | fair |
|  | GLB-voxel + surgical (T-052-01) | 0.614 | — | +0.142 | fair (regressed) |
| **heart** | text→JSON (E-13) | 0.456 | 0.347 | — | poor |
|  | GLB-voxel (T-051-01) | 0.877 | — | +0.421 | strong |
|  | GLB-voxel + surgical (T-052-01) | 0.877 | — | +0.421 | strong (held) |

Bands: poor < 0.50 · fair < 0.70 · good < 0.85 · strong ≥ 0.85 (an IoU reading aid; the surgical rows append the deterministic loop verdict). IoU-vs-concept is blank where it was not measured — not faked.

## The three answers (the headline, with evidence)

**1. Did the 3-D target move the E-15 loop on text→JSON builds?** Partly — the 3-D target moved the loop on 1 of 2, where the flat concept moved 0 of 2.

heart improved (0.456→0.462, edit accepted); koi held (0.472→0.472, rolled back). Against E-15's flat concept (0 of 2 moved; the heart edit regressed and was rejected), the 3-D target gave the heart a per-region signal worth keeping.

**2. Did voxelization beat text→JSON on form?** Yes, decisively. vs the same GLB: koi 0.472→0.622 (+0.15), heart 0.456→0.877 (+0.421). Voxelizing the image→3D mesh is a far larger form win than any surgical edit on a text→JSON build.

**3. Did surgical tweaks add capability, and at what cost?** No net whole-object gain. Once voxelization captures the form, local single-view surgical edits have little headroom and can slightly hurt the whole-object silhouette — the E-15 single-view ceiling persists even with a 3-D target and a voxel base.

- koi: whole-object 0.622→0.614 (regressed); 1 region cleaned locally but did not transfer to the whole silhouette
- heart: whole-object 0.877→0.877 (held); both regions rolled back
- cost: one claude -p LLM-edit call per `curve` region (koi 1 kept / 1 rolled, heart 0 / 2)

## The residual (shown, not hidden)

- GLB-voxel is not 1.0 — koi 0.622 (the thin caudal fin voxelizes chunky), heart 0.877 (closer). The metric is a single 3/4 view; rotation/axis is not corrected; translation+uniform scale are normalized out.
- Surgical revision cannot reliably climb a whole-object single-view IoU even with a 3-D target on a voxel base (koi regressed, heart held).
- Silhouette IoU is necessary, not sufficient — two shapes can share an outline. No fresh LLM perceptual judge was re-run in E-16; the categorical is the IoU band + the deterministic loop verdict.

## Per-subject detail

### koi — `glb/koi.glb` (E-13 run `009-vConcept-a-koi-fish`)
- **Arm A** (3-D target on text→JSON loop): region IoU 0.593→0.593, whole 0.472→0.472 — **held** (rolled back)
- **Synthesis** (surgical on voxel set): whole 0.622→0.614 — **regressed** (1 kept / 1 rolled)
  - llm-edit on `thick-fin / stair-stepping`: region 0.513→0.528 — accepted
  - relief on `flat-skin`: region 0.716→0.716 — rolled back

### heart — `glb/heart.glb` (E-13 run `006-vConcept-an-anatomically-correct-human-heart`)
- **Arm A** (3-D target on text→JSON loop): region IoU 0.449→0.456, whole 0.456→0.462 — **improved** (edit accepted)
- **Synthesis** (surgical on voxel set): whole 0.877→0.877 — **held** (0 kept / 2 rolled)
  - llm-edit on `almost-closed-arch`: region 0.566→0.566 — rolled back
  - relief on `flat-skin`: region 0.730→0.728 — rolled back

