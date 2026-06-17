# T-180-01 — Review

## What this ticket was

A **diagnostic spike** (E-45 / S-180): on already-committed T-178-01 evidence, classify every matched-build
`replace` tag as **R** (Layer A mis-reads a faithful element as wrong-style) or **S** (Layer A reads right
but the binary single-`replace` cap floors an otherwise-faithful build), to scope S-181's fix. No code fix,
no new metered votes.

## The verdict

**BOTH loci are active.** R/S split ≈ **6 / 10** across 16 `replace` items:

| Department | replace | R | S |
|---|---|---|---|
| WALL | 6 | **6** | 0 |
| OPENING (gable) | 6 | 0 | **6** |
| OPENING (slit) | 1 | 0 | **1** |
| ROOF | 3 | 0 | **3** |

- **WALL = R:** build wall is `stone_bricks` = the concept's field material (program `wall.dressing`); both
  concept and build are grey stone. Tagging it `wrong-style`/`replace` is a mis-read — the missing cobble
  **quoin** contrast should be `add` (recoverable), not `replace` (capping).
- **OPENING-gable & ROOF = S:** genuine divergences, correctly read. The build truly lacks the arch + dark_oak
  frame + spruce_door, and the roof is genuinely brown dark_oak vs the concept's grey. The defect is that the
  **binary cap** floors a build whose only real faults are these.
- **The dark-oak roof is the load-bearing anchor:** even a perfectly concept-conditional judge *must* tag
  ROOF:replace (brown ≠ grey), so R alone cannot lift matched while the cap stays binary → **S (graded cap)
  is mandatory; R (concept-conditional tag) is also mandatory because WALL is a real mis-read.**

## Files

Created (all under `docs/active/work/T-180-01/`): `research.md`, `design.md`, `structure.md`, `plan.md`,
`progress.md`, `AUDIT.md` (the deliverable), `extract-audit.mjs` (read-only reproducer), `review.md`.
**Modified / deleted: none** — no `src/`, no `baml_src/`, no `packs/`, no `measurements/`.

## Evidence quality / how it was verified

- **Reproducible extraction:** `node docs/active/work/T-180-01/extract-audit.mjs` regenerates the per-vote
  item table + build census from committed JSON. Counts match the run's `kindReliability` (replace=16,
  add=5, nItems=21) and `run-votes6.log`.
- **Mechanism confirmed:** feeding the 6 votes' `kind`/`severity` into the actual `styleFidelityScore` math
  reproduces the observed `[0,4,20,28,28,0]` exactly — so the read of *why* it floors (forced 32-per-replace,
  cap=40 secondary) is grounded in code, not inferred.
- **Ground truth join:** every R/S call cites the artifact census vs the program/pack roles, not free-text
  keyword matching (which bakeoff-score.mjs forbids).
- `npm test` green (2283 pass, 0 fail). `measurements/` untouched. Committed at `5a44226`.

## Test coverage

No unit tests added — **correct for this ticket**: it changes no code (AC forbids a fix here). Verification is
reproducibility + the scoring reconstruction + `npm test` as a no-regression guard. The new scoring unit
tests (faithful-except-one vs wrong-in-all) belong to **S-181**, where the fix lands.

## What S-181 should take from this

1. **Do both fixes.** Concept-conditional `replace` tagging in `DiagnoseBuild` (so a right-base-material,
   missing-detail element → `add`, not `replace`) **and** replace the binary cap with a graded
   style-distance in `styleFidelityScore`.
2. **Soften the per-replace forced-major, not only `cap=40`.** The binding floor is the **32-per-`replace`**
   (`PENALTY.major 20 + WRONG_STYLE.distance 12`), severity-blind. Lowering only the cap won't separate.
3. **The judge contract under-specifies.** `baml_src/department.baml` has no "right base material + missing
   detail → `add`" rule. The R fix is a prompt clause; **diff the prompt and re-pin the golden deliberately**
   ([[recognition-prompt-embeds-program-schema]]) — a schema/prompt edit drifts the recognition promptSha.
4. **Use the dark-oak roof as the graded-cap fixture** (genuine one-element divergence that must score
   moderate, not floored).

## Open concerns / limitations (flag for human attention)

- **Breadth.** One subject, one matched concept, two wrong twins. This is a precise *localization*, not a
  population result. A labeled multi-state corpus is the real promotion bar (standing E-40 owed item) — S-182
  must name this caveat in its PROMOTE recommendation; a clean two-sided crater here is **necessary, not
  sufficient**.
- **Entanglement.** OPENING-gable and the v6 slit carry both an R-component (overstated `wrong-style`) and an
  S-component (additive divergence). Classed S-primary with the R aggravator noted — honest, but it means the
  6/10 split should be read as "both, intertwined," not two disjoint bug classes.
- **`kind` instability.** The same ROOF divergence is tagged `replace` in 3 votes and `add` in 3 — the judge
  is non-deterministic at the tag level (corroborates `replaceContrast = −0.20`). S-181's concept-conditional
  prompt should aim to *stabilize* this, and S-182 should watch the per-vote `kind` spread, not just the mean.
- **`expected` not persisted** in the results JSON. Substituted program+pack roles; no call depended on it,
  but if S-181 wants `expected` in the audit trail it should persist it in `corpus-referee.mjs` output.

## Anti-hedge note

The falsifiable claim ("tags split cleanly R vs S") resolved to **BOTH**, the epic's leading hypothesis —
reported as confirmed-on-evidence, not softened, and with the partial-ambiguity (entangled OPENING tags)
named rather than hidden. The embarrassing branches (all-R refuting the scoring path; all-S meaning the judge
reads fine) were both checked and excluded.
</content>
