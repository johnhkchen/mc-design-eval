# T-191-01 — REVIEW: the department-dominant override, falsified both ways

**Result:** the override **KEEPS** the glance-correct grey roof (live re-run: `recolor_roof` KEPT, the climb
then continued *past* the roof to walls, +32 — it was ROLLED BACK and the climb stalled in T-190) **AND
REJECTS** a genuinely-bad change (adversarial unit fixture). **Department-trust did NOT hold on its own — the
"no new major in a targeted dept" guard LEAKS** the added-minors case; it needed the **net (total-item)
tightening** the ticket anticipated, now in place and tested. Vote-noise is confirmed as a real co-lever (the
scalar floored at 0 this run where T-190 saw 60), but the override is robust to it *by design* — it reads the
department signal, not the scalar.

## Files changed (3 source + this work dir; frozen instrument untouched)

| File | Change |
|---|---|
| `src/workshop/climb-gate.mjs` | New pure `deptItemCounts(items)` → `{[dept]:{major,minor}}`. New private `departmentDominant({...})` (rule a/b/c). `acceptsRound` gains the override path **before** the regression reject + two optional params (`beforeDeptItems`,`afterDeptItems`); removed the now-subsumed T-190 tie-zone department leg; JSDoc updated. |
| `src/workshop/climb-gate.test.mjs` | Import `deptItemCounts`; CG11 4th case updated to the **intended** semantic break (regression+cleared→KEEP); new CG13 (`deptItemCounts`), CG14 (KEEP real grey roof on a Δ−12 regression), CG15 (REJECT adversarial via net guard + document the major-only leak), CG16 (no-clear → reject). |
| `experiments/eval-alignment/picture-climb.mjs` | Import + compute before/after `deptItemCounts` at the decision site; pass to the gate; record `deptItemsBefore/After` in the trajectory. |

## The rule (as shipped)

Keep a candidate over a whole-build scalar **regression** iff the applied tool **(a)** cleared a major in a
department it targets, **(b)** added no new major in any targeted dept, **(c)** grew no targeted dept's TOTAL
item count (major+minor). (a)+(b) is the T-190 `ceiling.md` rule; (c) is the net-minor tightening. Runs before
the regression branch, so it fires on regressions and ties; inert without department context (backward
compatible). The reason string is `<DEPT> cleared a major (department-dominant override)`.

## KEEP proof — TWO independent demonstrations

### 1. Deterministic unit (CG14), grounded in the *real recorded* T-190 round-3 counts
The exact T-190 shape — `recolor_roof` clears the ROOF major, the judge promotes pre-existing **UNtargeted**
WALL+OPENING majors, whole-build score 60→48 (Δ−12, **past margin**), ROOF total burden falls 2→1 — is now
**ACCEPTED**. Pre-T-191 this rolled back at the regression branch. This is the regression-path proof, run
deterministically (no spend, no vote-noise dependency).

### 2. Live metered re-run (`run.log` + `trajectory.json`, GL + LLM, VOTES=3 strong)
`CLIMB_OUT=docs/active/work/T-191-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`:

| round | tool | score | gate | dept signal |
|---|---|---|---|---|
| 1 | `apply_gable_roof` | 0→0 | KEPT (tie: coverage shrank) | whole-build nMajor 4→3 |
| 2 | `recolor_roof` | 0→0 | **KEPT (ROOF cleared a major — department-dominant override)** | ROOF `{2maj,1min}`→`{0maj,1min}` (total 3→1); judge promoted WALL `{0→2maj}` (untargeted) |
| 3 | `construct_walls` | 0→**32** | KEPT (improved +32) | WALL major 2→1 |

Agent then chose **done** (the remaining gap is the arched OPENING / dressed reveals — *no tool builds a
framed arch*; honest stop). Trend `0→0→0→0→32`, Δ+32, **climbed=true, oscillated=false, actionableFrac=1.0**
(every applied tool KEPT, zero roll-backs). Glance (`round2-grey-kept-beside.png`,
`round3-walls-beside.png`): the **dark/charcoal `deepslate_tiles` gable roof is retained** and reads close to
the concept's dark roof; walls then articulate with lighter dressed quoins on top. **The grey roof stuck and
the climb went past it** — the precise thing T-190 could not do.

## REJECT proof (mandatory) — the adversarial fixture

- **CG15:** a tool that clears the ROOF major **but adds 2 new ROOF minors in its own target** (ROOF
  `{1,0}`→`{0,2}`, total 1→2, score 60→48) is **REJECTED** by the net guard (c) → falls through to
  `regressed`. **And the same fixture WITHOUT item counts (major-only guard) is KEPT** — the documented leak.
  This is the falsification the ticket required: department-trust on majors alone is *unsafe*; the net guard
  is load-bearing, not decoration.
- **CG16:** a genuinely-bad change that clears no targeted major (ROOF `1→1`, regressed) does not fire the
  override → rejected as a plain regression.

## The two AC questions, answered honestly

**Did department-trust hold, or did it need tightening?** It **needed tightening.** The major-only guard
(a+b) — the rule as first named in T-190 — leaks the "cleared a major, added minors in its own target" case
(proven by CG15's no-item-counts assertion). The shipped guard adds (c), the net total-item check, which
rejects it while still keeping a major→fewer-or-equal-total improvement (incl. a major→minor swap). So the
trade "scalar-trust → department-trust" is only safe **with** the net guard.

**Is vote-noise reduction also needed? (the bands)** **Yes, as a co-lever for the SCALAR — though the
override is deliberately insulated from it.** Observed votes this run: rounds 0–2 all `0/0/0`; round 3 walls
`40/32/12` (median 32). T-190 saw the same gable builds at brown `60/60/52` / grey `52/40/48`. So the *same*
build scored 60 in one run and 0 in another — the 0–76 swing T-187 measured, live. Consequence: the literal
AC phrasing "the trend continues **past 60**" did **not** reproduce, because the scalar itself floored at 0
this run; the run peaked at 32. **But the structural claim held in full:** the override kept the roof and the
climb proceeded past it, *because the override reads the department major/minor counts, not the noisy
scalar.* The override fired on a tie-at-0 here rather than the regression-from-60 of T-190 — the regression
path is the deterministic CG14. Net: vote-noise reduction (more votes / a noise-aware scalar) would make the
SCALAR trend legible and is the natural next co-lever; it is **not** required for the override's keep/reject
decision, which is now noise-robust.

## Test coverage

- `climb-gate.test.mjs`: 16 tests (CG1–CG16) pass. New/changed: CG13 (`deptItemCounts`), CG14 (KEEP
  regression), CG15 (REJECT adversarial + leak doc), CG16 (no-clear reject), CG11.4 (intended break).
- `npm test`: **2326 pass, 0 fail.** No frozen-instrument file changed.
- `GUARD_ONLY=1` runner: wiring + render seam clean, zero spend (pre-flight before the metered run).
- **Gap:** the live metered run is non-deterministic and not in `npm test` (by design — it is GL+LLM). Its
  keep/reject is corroborating; the *deterministic* keep/reject lives in CG14/CG15/CG16, grounded in the real
  recorded counts.

## Open concerns / handoff

1. **The override fired on a tie this run, not the regression it was built for** — only because vote-noise
   moved the scalar floor to 0. The regression path is unit-proven (CG14) but did not get a *live* regression
   demonstration this run. A re-run on a luckier vote draw (or with more votes) would likely show the
   regression-from-60 keep live; not required for correctness.
2. **Vote-noise on the scalar is unaddressed** (out of this ticket's scope). It is the standing co-lever:
   the scalar trend is illegible run-to-run; the override sidesteps it but a legible scalar would help the
   agent and the human read progress. Candidate: VOTES↑ or a noise-aware median. See
   [[diverge-before-converge-experiment-freedom]].
3. **The climb now stops at the arched OPENING** (no tool builds a framed arch / dressed reveals) — this is
   the next real gap, the S-192 hands (arch on both passages, wall-relief, banding). The override unblocked
   exactly what it promised: the loop can now climb *past* the roof. **S-192/S-193 are unblocked.**
4. `builds/gatehouse/picture-climb/round-4/` is a stale leftover from a prior T-190 run (11:16); this run
   wrote round-0..3 (15:28–15:36). Not committed; harmless.

## Verdict against the falsifiable claim

The claim — *keeps the grey roof AND rejects a genuinely-bad change* — **holds, with the honesty the
anti-hedge directive demands:**
- ✅ **KEEP:** grey roof kept (live + CG14); climb continued past the roof to walls (+32), all-accepts.
- ✅ **REJECT:** adversarial fixture rejected (CG15), no-clear rejected (CG16).
- ⚠️ **The guard LEAKED on majors-only and had to be tightened to net-minor** — reported, tested, shipped
  (CG15 documents both states). Department-trust is safe *only* with the net guard.
- ⚠️ **Vote-noise is real and the literal "past 60" trend did not reproduce** (scalar floored at 0 this run);
  the override is noise-robust by construction, and noise reduction is named as the standing co-lever.
