# Roof-region diff findings (T-118-01, E-30 Rule 2: analysis before construction)

What the instrument (`roof-diff/*.json`, sheets `pr/assets/frames/roof-diff-*.png`) says, per
subject, about the regions behind the failing "form @ roof" verdicts — and the go/no-go for each
candidate refit. Numbers are from the committed records at the BEFORE state (commit `be5b8b3`).
Pixel counts are XOR mismatch on the cage's 128-grid, summed over the 4 gate azimuths;
profile deltas are cells (raw = same-frame aabb-aligned; eave-rel = each side anchored to its own
measured eave).

## Cottage

**Reconstructed** (roof share 62.5%, worst +x-z): mismatch is EXTRA-dominated at the roof —
ends 404ex/213mi, ridge 203ex/97mi, unpartitioned (chimney columns) 628ex/187mi.

- **Ridge height is RIGHT.** Build ridge 24 vs GLB per-slice apex 23.961 along the whole span
  (raw Δ +1.04, the constant aabb envelope). The record's `ridgeFit.apexLine = 26.484 (span
  [4,7])` is **the GLB chimney cluster, not the roof apex** — `fitRidgeLine` picks the highest
  contiguous cluster and the chimney wins. The committed apex evidence is protrusion-polluted
  (same instrument finding for the gatehouse, below). The accepted `-ridge-fit` rung (intersect
  22.596) did not lower the as-built ridge in the committed challenge artifact (built 24).
- **Gable-end verge tips are RIGHT.** lo −16 vs GLB roofEnd −16.5; hi 15 vs 15.5; cross-hi 12 vs
  12.5. The `ends` EXTRA px trace to the rake line sitting proud mid-slope (raw rake Δ +1.5…+2.6
  at cross coords −3…+4 on both rakes), i.e. **slope fatness**, not tip length. The refused
  `cross-lo` (buried interior end) is correct and stays refused.
- **Refit go/no-go:** ridge-raise rung NO (refuted); verge-tip refit NO (tips match); the
  faceRmse 1.541/1.116/1.038 worry the ticket named is GLB face-cluster noise, not a built
  defect. GO: fix `fitRidgeLine` protrusion pollution (evidence repair, below).

**Generated** (roof share 32.5%, worst +x-z): ridge 626mi/227ex, ends 502mi/339ex — MISSING-
dominated: the generated roof is too LOW. Raw profiles: main gable −0.96 constant; **cross gable
−3.445 constant** (build 18 vs GLB 22.445 along the full cross span — the red band at 225°/315°).
This is the one constructive ridge target the diff justifies, and it lives in the generated chain
(provision-fit → provision-generate → generated-milestone). **Deferred, named**: regenerating the
generated milestone would re-run its judge gate (no judge runs in S-118 — S-121 owns verdicts);
the rung belongs to the E-29 seam with S-121's re-judge. Recorded here as the standing target.

## Gatehouse

**Reconstructed** (roof share 57.3%, worst +x+z; the 315° regression subject): the dominant
signal at 315° is `unpartitioned` MISSING 403px — a continuous band of GLB mass ABOVE the build's
upper slope/wall line, in columns OUTSIDE the gable footprint (the side-wall parapet/crenellation
band; the T-111 "lumps are GLB-backed at y≈31.5" memory, now localized).

- **Ridge height is RIGHT.** Raw ridge Δ −0.32 over the central span (dips −1.1/−2.3 over two
  short spans). The recorded `apexLine = 31.5 (span 26, rmse 0)` exceeds every footprint-restricted
  per-slice GLB maximum (29.1–30.3) — it is the **parapet top, not the roof apex**: the same
  `fitRidgeLine` pollution as the cottage chimney.
- **The invalid intersect is a correct refusal, and resolving it would be WRONG.** It failed by
  0.103 (y 26.397 vs eaves 26.5); "resolving" it would build a ridge at 26.5 — 1.5 BELOW the
  as-built 28 that already tracks the GLB. The diff evidence names the impossibility: **no ridge
  refit** (the AC's resolve-or-name forks to name).
- The eave-relative profile is unusable here: `glbEave 30.317` sampled at the eave columns is the
  crenellation top (plan-view max), not the eave — recorded as an instrument honesty note.
- **What actually drives the 315° regression**: missing parapet/crenellation massing above the
  long walls — outside the roof program's gable vocabulary entirely (wall-top form, not roof
  form). Named for E-30/S-121 scoping; building parapets is not a roof-region refit.

**Generated** (roof share 19.3%): wall dominates (3764ex/4241mi) — the generated gatehouse misses
on massing well below the roof band; roof regions are secondary (slopes 548ex/270mi). No roof
refit justified ahead of the wall-band gap.

## Church

**Reconstructed** (roof share 53.2%, worst -x+z): `unpartitioned` 1240ex/339mi — the tower
(flat-cap fallback, honestly refused pyramid) plus nave-edge slope extras (slopes/ridge/ends all
EXTRA-only). The tower cap region is named by the fallback path, as designed. No new rung is
justified: the refused pyramid stays refused (the flat top IS the honest fallback; a pyramid rung
was already tried and refuted at T-112).

**Generated** (roof share 41.4%): the hip-cap tower tracks well (ridge rmse 1.145); the nave
gable's lo rake is badly uncovered/low (rake-lo rmse 10.573 — the GLB porch/apse mass at the lo
end the generated nave doesn't model; visible as unpartitioned 1342ex/1133mi). Massing, not a
fittable roof region. Named.

## Barn

Both paths SKIPPED, named in `roof-diff/barn-*.json`: no committed fit records or generated
artifacts on either path (the first-run bootstrap stalls upstream of the roof program — the
role-aware zone lens, T-117/S-117; this instrument picks barn up automatically once
`components/barn.json` + `roof/barn.json` or `generated/barn/*` exist).

## The justified refit wave (everything else above is named, not built)

1. **`fitRidgeLine` protrusion exclusion** (evidence repair, justified by two concrete
   pollutions): restrict apex-line sampling to the gable's footprint columns, excluding recorded
   protrusion-mass columns (the chimney/parapet clusters that currently win). Pure change +
   unit tests; `roof-program` re-run for cottage/gatehouse/church refreshes the recorded
   evidence; placements must stay byte-identical (apexLine is evidence-only — asserted at re-run).
2. **No constructive rungs**: cottage ridge-raise refuted, cottage verge-tip refuted, gatehouse
   intersect-resolution refuted — each named above with the diff numbers. The standing
   constructive targets (generated cottage cross-ridge −3.445; gatehouse parapet band; church
   porch mass) are recorded for S-121/E-29 scoping.

Instrument honesty notes carried into the records: nearest-cell attribution localizes, it does
not adjudicate; `glbEave` is a plan-view max and can catch taller structures behind the eave
(gatehouse); `unpartitioned` includes non-roof protrusions (cottage chimney) by construction.
