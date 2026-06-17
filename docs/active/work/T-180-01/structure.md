# T-180-01 — Structure

This ticket produces **no code and no schema change**. It is an evidence audit; the "structure" is the shape
of the deliverable artifacts and the (read-only) inputs they join. Nothing under `measurements/` is touched;
nothing under `src/` is modified.

## Files CREATED (all under `docs/active/work/T-180-01/`)

- `research.md` — evidence + mechanism map (done).
- `design.md` — the R/S classification rule + the decision (done).
- `structure.md` — this file.
- `plan.md` — ordered steps + verification.
- `progress.md` — execution log.
- **`AUDIT.md`** — **the deliverable.** The per-item R/S audit table, per-department counts, the locus
  decision, the caveats. This is what S-181 reads.
- **`extract-audit.mjs`** *(optional, small)* — a read-only Node script that loads
  `corpus-referee-faithful-covered.json` and prints the matched-build items grouped per vote with their
  `kind/styleClass/department/present/missing`, so `AUDIT.md`'s table is regenerable, not hand-transcribed.
  Pure read; no writes; not wired into any test or pipeline.

## Files MODIFIED / DELETED

- None. (No `src/`, no `baml_src/`, no `packs/`, no `measurements/`, no test files.)

## Read-only inputs the deliverable joins

1. `experiments/eval-alignment/results/corpus-referee-faithful-covered.json` → `crater.conditions["0"]`
   (A-matched), `.votes[i].items[]` → `{department, severity, present, missing, kind, styleClass}`.
2. `builds/gatehouse/faithful-covered/artifact.json` → `placements[]` block census (the "present" ground
   truth: what blocks the build actually has).
3. `benchmarks/sculpture/recognition/gatehouse.program.json` → per-mass `walls`/`openings`/`roof` roles
   (the "expected" ground truth, since `expected` strings are not persisted in the results JSON).
4. `packs/rustic.json` → role→block map (resolves the program roles to concrete blocks for the same-family
   test: `wall.dressing`→stone_bricks, `wall.field.ground`→cobblestone, `frame.timber`→dark_oak_log,
   `door.main`→spruce_door, `roof.trim`→dark_oak_planks).

## AUDIT.md internal organization (the blueprint)

```
# T-180-01 — AUDIT: matched-build replace tags, R vs S
## Method            (the rule from design.md, 1 paragraph + the same-family test)
## Ground truth      (build census vs program/pack table — the join that grounds every call)
## Per-item table    (24 items across 6 votes; cols: vote, dept, kind, styleClass, present⇢missing(short), call R/S, why)
## Counts            (per department: replace count, R count, S count; totals)
## The locus decision (BOTH; the dark-oak-roof anchor argument; what S-181 must do)
## Caveats / anti-hedge (entanglement reported; expected-not-persisted; one-subject breadth; falsifiable-claim outcome)
```

## Ordering constraints

- `extract-audit.mjs` (if written) runs before `AUDIT.md`'s table is finalized (it feeds the table).
- `AUDIT.md` depends on the census + program join being stated first (the "Ground truth" section is the
  evidence base every per-item call cites).
- `npm test` is the final gate (must remain green; no code changed, so it is a confirmation, not a risk).

## Public interface / boundaries

None changed. `itemStyleClass`, `styleFidelityScore`, `kindReliability`, `DiagnoseBuild` are **read and
cited**, not altered. The R/S decision is the output that *scopes* S-181's edits to those exact functions —
T-180-01 draws the boundary; it does not cross it.
</content>
