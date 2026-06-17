# T-179-01 — Progress

## Done

- **Step 1 — profile derivations + unit tests (committed).** `deriveRakingVerge(occ, {ridgeAxis,eaveY,ridgeY})`
  (top-cell-per-across of each gable-end slice → the rake) and `deriveArchHead(aperture)` (crown air per
  opening column → the voussoir curve) added to `src/view/treatment-grammar.mjs`, both pure +
  JSON-round-trippable. Tests TG21–TG25 (rake on ridge-x/ridge-z/flat-shed; arch head arch/flat).
- **Step 2 — verge rewired to the rake (committed).** `composeRoofTreatment`'s verge layer now keys
  `surface.relief` to the 3-D rake-cell set on the gable-end faces (was the 2-D column set = the heavy band).
  The `leak` field is gone; the layer reports `profile:"raking", rakeCells, curve, resolves:"..."`. **TG16
  rewritten** from *asserts-the-leak-exists* to *asserts-the-rake-is-crisp* (verge cells < full gable-end
  band; `curve===true`; no `leak`).
- **Step 3 — voussoir head recolor (committed).** `composeTreatment`'s opening layer gains optional
  `spec.edges.opening.voussoir`: when set + the dressing seam injected, `archHeadPlacements` recolors the arch
  wedge stones along the crown curve (depth probed against `occ` within the aperture region — recolor of
  existing solids, no air op). Flat openings carry no `isArch` ⇒ no-op. Test TG26 (injected stub).
- T-176-01's witness runner leak line updated to report the resolved rake profile (the old `leak` print was
  stale).
- **`npm test` green: 2283 pass / 0 fail** (was 2277; +6 TG21–TG26). Grammar file: 26/26.

## Remaining

- **Step 4 — witness render (in progress).** New runner `experiments/eval-alignment/treatment-verge-voussoir-beside.mjs`:
  load the faithful gatehouse, source the spec (+ `roof.edge`, `edges.opening.voussoir`), compose wall →
  roof(rake) → voussoir head, render the −x gable elevation beside the concept, assert closure. Output →
  `docs/active/work/T-179-01/verge-voussoir-beside.png` + `gatehouse.vergehead.treatment.json`. Glance call
  recorded in FINDINGS.
- **Step 5 — FINDINGS + review.**

## Deviations from plan

- Steps 1–3 committed as a batch after a single full-suite green rather than three separate commits — the
  three edits are one cohesive module change (the profile primitive + its two consumers) and the suite is the
  shared gate. The verge rewire (step 2) needed `ctx.ridgeAxis` (not a bare `ridgeAxis`) — fixed.
- The voussoir world-space recolor lives in `composeTreatment` (not only the runner) so AC1's "same
  compositor" is literal; depth is probed inline against `occ` (no new injection), keeping the module pure.
