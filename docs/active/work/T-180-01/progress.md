# T-180-01 — Progress

## Done

- **Step 1 — extractor.** `extract-audit.mjs` written (read-only). Runs clean; prints A-matched items per
  vote + build census. Counts match `kindReliability.perCondition["A-matched"]`: **replace=16, add=5,
  nItems=21**.
- **Step 2 — ground-truth join.** Built from `artifact.json` census (1106 stone_bricks, 210 dark_oak_stairs
  +15 dark_oak_planks, 4 dark_oak_log, 4 cobblestone) + `gatehouse.program.json` roles + `rustic.json`
  role→block. Recorded in AUDIT.md "Ground truth" table.
- **Step 3 — classification.** All 16 `replace` items classified: WALL 6→**R**, OPENING-gable 6→**S**,
  OPENING-slit 1→**S**, ROOF 3→**S**. Dark-oak roof lands S (anchor check passed).
- **Step 4 — locus decision.** **BOTH.** R required (WALL is a genuine mis-read of faithful grey stone); S
  required (legitimate dark-oak ROOF:replace still floors under the binary cap). Argument written.
- **Step 5 — AUDIT.md** written (the deliverable) per the structure.md blueprint.
- **Step 6 — verify.** Scoring reconstruction reproduces `[0,4,20,28,28,0]` from the votes' kind/severity
  (mechanism read confirmed). `npm test` green (0 fail). `git status` scoped to
  `docs/active/work/T-180-01/**`.

## Key findings (handed to S-181)

- R/S split ≈ **6 / 10** → both loci active. Not all-R, not all-S.
- The binding floor is the **forced 32-per-`replace`** penalty (PENALTY.major 20 + WRONG_STYLE.distance 12),
  severity-blind; `cap=40` is secondary. S-181's graded term must soften the per-replace forced-major, not
  only the cap.
- The judge's `kind` is **unstable across votes** for the same element (ROOF: replace v1/v2/v6 ↔ add
  v3/v4/v5) — corroborates `replaceContrast = −0.20` (weak discriminator).
- Judge contract under-specifies: no "right-base-material + missing-detail → `add`" rule. Feeds the R fix.

## Deviations from plan

- None material. `expected` strings absent from the results JSON (anticipated in Research/Plan) — substituted
  program+pack roles as the faithful target; no call depended on the missing field.

## Not done (correctly out of scope)

- No code/schema change; no new votes; no `measurements/` touch. The scoring/judge fix + its unit tests are
  **S-181**. The two-sided crater re-run is **S-182**.
</content>
