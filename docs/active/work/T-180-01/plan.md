# T-180-01 — Plan

Evidence-only spike. Steps are ordered so each is independently verifiable; the deliverable is `AUDIT.md` +
the locus decision. No code, no new votes, nothing under `measurements/`.

## Step 1 — Extract the matched-build items (reproducibility)

Write `extract-audit.mjs` (read-only): load `corpus-referee-faithful-covered.json`, walk
`crater.conditions["0"].votes[].items[]`, print per vote `department | kind | styleClass | present⇢missing`.
**Verify:** the printed item count and per-vote scores match `run-votes6.log` (`[0,4,20,28,28,0]`) and the
T-178-01 FINDINGS pattern (WALL replace 6/6, OPENING replace 6/6, ROOF replace 3/6). Done in Research's
spot-checks; this step makes it a committed, re-runnable artifact.

## Step 2 — Build the ground-truth join

Tabulate, from `artifact.json` census + `gatehouse.program.json` roles + `rustic.json` role→block, what each
element's **faithful** material is vs what the build **has**:
- WALL field: expected stone_bricks (program `wall.dressing`) — build has 1106 stone_bricks → **match**.
- WALL quoins: expected cobblestone (program `wall.field.ground`) — build has 4 cobblestone → **contrast
  absent** (within-style detail).
- OPENING: expected arch + dark_oak_log frame + spruce_door — build has bare hole, 4 dark_oak_log, no door →
  **dressing absent** (additive).
- ROOF: build dark_oak (210 stairs+15 planks) vs concept grey-stepped → **genuine wrong-material**.
- SLITS: expected dark_oak_trapdoor shutter + spruce_fence infill — build bare → **additive**.
**Verify:** every census number is reproducible from the artifact (Research already ran the census).

## Step 3 — Classify each replace item R or S

Apply the design.md rule (same-family test) to every `replace`/`wrong-style` item across the 6 votes. For
each: quote `kind`/`styleClass`/`present`/`missing`, state the build's actual block at that element vs the
faithful target, give the call (R or S) and the one-line reason. Use the dark-oak roof as the anchor (must
land S). **Verify:** the roof items classify S; WALL classifies R; counts sum to the replace totals in
`kindReliability.perCondition["A-matched"]` (replace=16 of 21 items).

## Step 4 — Tally + locus decision

Per-department R/S counts; the overall decision (BOTH). Write the dark-oak-roof argument (concept-conditioning
alone can't lift matched under a binary cap → S required; WALL is a genuine mis-read → R required). State the
falsifiable-claim outcome (split is BOTH, not all-R / all-S / ambiguous-everywhere) and the entanglement /
breadth caveats. **Verify:** the decision is consistent with `replaceContrast = −0.20` (matched skews
`replace` *as much as* wrong twins → the tag does not discriminate → consistent with "the reading over-fires
+ the cap floors").

## Step 5 — Write AUDIT.md

Assemble Steps 1–4 into `AUDIT.md` per the structure.md blueprint.

## Step 6 — Verify + commit

- `node docs/active/work/T-180-01/extract-audit.mjs` runs clean and prints the expected counts.
- `npm test` green (baseline 0 fail; no code changed → confirmation).
- `git status` shows only `docs/active/work/T-180-01/**` (+ the ticket frontmatter Lisa advances) — nothing
  under `measurements/`, `src/`, `baml_src/`, `packs/`.
- Commit the work artifacts.

## Testing strategy

No unit tests are added — this ticket changes no code (the AC explicitly forbids a fix here). The
verification is **reproducibility**: the extraction script regenerates the audit inputs from committed JSON,
and the scoring reconstruction (already shown in Research: `[0,4,20,28,28,0]`) proves the mechanism read is
correct. `npm test` is the regression guard that nothing was inadvertently changed. The *new* scoring unit
tests belong to **S-181**, where the fix lands — calling them out here would be scope creep.

## Risks / deviations

- **`expected` not persisted** (Research constraint): handled by substituting the program/pack roles as the
  "expected" ground truth; noted in AUDIT.md. Does not block any call.
- **Entanglement (WALL/OPENING carry both R and S signal):** handled by the primary+aggravator scheme; the
  honest read is "BOTH," which is the actionable answer for S-181 regardless.
</content>
