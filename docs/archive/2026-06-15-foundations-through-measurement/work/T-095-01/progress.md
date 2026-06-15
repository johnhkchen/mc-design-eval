# T-095-01 challenge-milestone — Progress

- [x] Step 1 — material-map `--subject` filter + church row + one-time live pin (commit `church material map`)
- [x] Step 2 — challenge-milestone.mjs runner + scripts + gitignore (commit `challenge-milestone runner`)
- [x] Step 3 — live cottage + gatehouse milestones, records/frames committed (commit `cottage + gatehouse through the whole chain`)
- [x] Step 4 — church registry entry + first untuned run (commit `church through the untuned pipeline`)
- [x] Step 5 — generalization grep + handoff + design-learnings (commit `challenge-milestone handoff + design learnings`)
- [x] Step 6 — review.md

## Log
- (start) RDSPI artifacts written; no sibling session on this ticket.
- Step 1: church map generated once (cobblestone walls / stone_bricks quoins+base / dark_oak_planks
  roof / polished_andesite trim / black_stained_glass openings; near-tone preserved). Fixed a latent
  generic bug on the way: `generatedFrom.concept` was a two-subject ternary that would have stamped a
  3rd subject with the cottage path — now derived from the registry row.
- Step 3 **deviation (planned-for, plan §risks)**: first cottage run FAILed all 4 gate views with
  coverage 0 on exactly the kit-renamed bands — the T-093 gate predates T-096 and was **kit-blind**
  at its shipped-palette naming seam. Generic fix committed separately (kit overrides composed over
  the value-true substitution, allowed-guarded, threshold/azimuths/judge untouched); cottage re-run:
  3/4 judges called, 315° same-object. Gatehouse would have hit the same on deepslate_bricks.
- Step 3 results: cottage FAIL (45° coverage band1 0.399; 135°/225° drifted major form@roof; 315°
  same object), gatehouse FAIL (2× different-object + 2× drifted, form@roof+massing). Both chains
  double-run byte-equal, `--repro` reproduced, `--offline` green. Removed a redundant base-artifact
  copy for non-provisioned subjects before committing.
- Step 4 **deviation (generic, no church key)**: adding church to durable-skin SUBJECTS made the
  `zone:map` all-subjects sweep die on church's coverage throw — sweep now DEFERS a throwing subject
  (material-map precedent; `--subject <k>` still fails loudly; existing records regenerate
  byte-identical). Church run: provision 11,423 cells @48, shell CLOSED, skin REFUSED at T-088
  (band0 wall-field 0.33 < 0.5); diagnosed mechanism recorded (feature-assign gives
  corners/base/openings ~55% of the lower shell on the edge/opening-rich massing).
- Step 5: grep recorded (zero src/ hits; registry data only), handoff + journal committed,
  `npm test` 1156/1156 green throughout.
