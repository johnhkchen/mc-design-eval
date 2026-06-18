# T-211-01 — Review: capstone verdict + the stop-line, invoked

**Epic E-54 / Story S-211. The capstone and the stop-line.** Handoff for a human reviewer. **One line:** the
metered re-climb ran clean and autonomous; both landed fixes (T-209 relief-tolerant closure, T-210 centered
gate) **worked exactly as specified**; the **kept build is an M1 near-miss**, so the **pre-committed E-54
stop-line FIRES** — the next epic is the **step-back**, not a seventh gatehouse fix. The cause is precise and
mechanistic: a single form move lifts the build off the score floor before the dressing can compound, re-binding
the per-move median-gradient problem the batch escape only suppresses *at* the floor. The binding constraint is,
one final time, **the MEASURE, not the build.**

## What changed

**No source.** This is a run-and-judge ticket; the fixes it exercises were landed in T-209/T-210.

| Path | Type | Content |
|---|---|---|
| `docs/active/work/T-211-01/research.md…plan.md` | artifacts | RDSPI front matter |
| `docs/active/work/T-211-01/trajectory.json` | run output | per-round picks, scores, closure, batch composition, final record |
| `docs/active/work/T-211-01/climb.log` | run output | round-by-round log; `votesTimedOut=0`; clean exit |
| `docs/active/work/T-211-01/beside-first.png` | evidence | round-0 seed (open colonnade) |
| `docs/active/work/T-211-01/beside-kept.png` | evidence | round-3 KEPT build (the glance subject) |
| `docs/active/work/T-211-01/beside-arch-rolledback.png` | evidence | round-4 centered arch (rolled back; T-210 working) |
| `docs/active/work/T-211-01/progress.md`, `review.md` | artifacts | the verdict |

`src/`, `experiments/`, `measurements/` byte-unchanged. Committed in one evidence commit (`c5ac408`).

## The verdict against the falsifiable claim (anti-hedge — led with how it fails)

The claim: the re-climb *keeps the dressed build* and it *passes the glance as M1*. **Result: the dressed build
was NOT kept, and the kept build is a near-miss.** Branch by branch:

- ❌ **"keeps the dressed build (relief + centered arch + slate roof compounded)":** **No.** The kept build is
  round-3 `construct_walls` (score 8): a closed dark-grey box with quoins and a *stepped pyramidal cap*. The
  centered arch (r4) and the gable (r2) were both rolled back; relief_walls was never reached. The +20-class
  dressed compound T-208 produced **did not recur**, because the climb took a different path (a form move lifted
  it off the floor first — see mechanism).
- ❌ **"passes the glance as M1":** **No.** vs the concept (pale dressed stone gatehouse, dark peaked gable,
  centered arched gateway, compact proportion), the kept build has **closed walls ✓, quoins ✓**, but **no
  centered gate, no gable (stepped cap), boxy/too-tall proportion, dark-not-pale stone.** A stranger would not
  recognize it as the concept's gatehouse. **M1 near-miss.**
- ✅ **NOT the "relief-tolerant metric mis-keeps a genuinely-open batch" failure (S-209 did not leak):** form
  closed at round 1 and **stayed 1.000 every subsequent round.** No false reopen. The 1.000→0.068 collapse that
  rejected T-208's +20 batch **is gone.** T-209 holds.
- ✅ **NOT the "score variance → unreproducible verdict" failure (in the sense that fires uncertainty):** the
  miss is **deterministic and structural** (the escape disengages off the floor), not noise. The verdict is
  reproducible by construction; no second run needed (taking one would be the hedge the stop-line forbids). The
  one place variance *does* appear — the centered arch's `8/0/48` votes — is itself the diagnosis, not the
  verdict: the median (a deterministic operator) discards the high vote.

## The precise residual, at full strength (the central finding)

**The cold-start batch escape only fires at the score floor (`coldStartFloor`: `score ≤ scoreFloor = 0`).** The
run's path defeated it without any fix failing:

1. `close_shell` closed the form (score still 0 — on the floor). **T-209 fine.**
2. The first detail batch stacked only the gable (the next pick, `construct_walls`, is a form move that ends a
   detail batch by design) → single-pick tie at the floor → rolled back.
3. `construct_walls` scored **+8** through the per-move **form-credit** path → **the build left the floor.**
4. **Off the floor, the batch escape is inert.** The centered arch (`rebuild_arch`, one judge **48**), then
   `frame_arch`, fell back to the **per-move median gate** — the exact median-gradient problem T-207/T-208
   named — and were rolled back as ties/regressions. The build that looks *most* like the concept
   (`beside-arch-rolledback.png`, the centered arch) was **discarded by the median.**

So the dressing never compounded because a *form* move credited first and lifted the score off the floor, where
the escape lives. **Neither T-209 nor T-210 failed** — both did their job (closure stayed truthful; the gate
centered, coherent, and drew a 48). The build misses because the **measure** (the per-move median gate) still
rolls back the very moves that would land the picture, and the one escape from it is scoped to the floor.

## The stop-line — INVOKED (pre-committed, reviewer-ratified)

> The E-54 re-climb's KEPT build does **not** pass the glance as M1. **Per the pre-committed stop-line, we stop
> adding gatehouse epics.** This was the sixth-plus epic on one house (E-48→E-54); the recurring binding
> constraint has been the *measure*, not the build, and this run shows it one final time at full strength.

**The next epic is NOT a seventh gatehouse fix.** It is the **step-back to the structural question the arc has
been circling:** *can the picture-climb architecture finish any single subject to M1 — and if not, what
changes?* Named, not buried. Concretely, the evidence points the step-back at the **measure**, not the
gatehouse:

- The per-move median gate rolls back individually-correct picture moves (the +48 centered arch); the batch
  escape that beats it is scoped to the score floor and **disengages the moment any move credits off 0.** The
  structural question is whether the climb's *acceptance rule* (per-move median + floor-only batch) can ever
  carry a full dressing compound to the kept build on *any* subject — or whether it needs a different gradient
  (e.g. batch-while-improving, not batch-only-at-floor; or a non-median aggregator that doesn't discard a strong
  minority read).

A near-miss with this precise a residual is a **complete, publishable result** (the anti-hedge close): the
positive sub-claims proven (form stays closed, gate centers by construction), the headline claim falsified
honestly, and the cause isolated to a named seam in the *measure*. It does **not** license another gatehouse
patch.

## Test coverage

- **`npm test` 2438/2438 green** before and after — this ticket adds no source and no test (run-and-judge).
- **The decision logic exercised is unit-tested upstream:** `acceptsBatch` form-integrity + no-rubber-stamp
  (`climb-gate.test.mjs`, T-208 CG-B2/B8/B4), `eaveRingClosure` relief tolerance + colonnade-open invariant
  (`wall-generate.test.mjs`, T-209 WG-CS15–19), `centerOnFace`/`inheritedSlotResidual` (`aperture-carve.test.mjs`,
  T-210 CF1–6).
- **The metered run is integration evidence, reproducible by replay** (trajectory + renders), not in the suite
  — per repo convention for the metered runner (T-201/T-205/T-207/T-208).

### Gaps / not covered
- The **mechanism finding** (escape disengages off the floor → median re-binds) is shown by *this one run's*
  trajectory, not a deterministic unit test. It is consistent with T-207 (per-move stall) and T-208 (floor-only
  escape), so it is well-corroborated, but a unit test asserting "a +N-vote minority move is rolled back by the
  median off the floor" would harden it for the step-back epic. Flagged for that epic, not built here (it would
  be measure-design work, which the stop-line defers to the reviewer's step-back decision).

## Open concerns / handoff

1. **Stop-line is live — reviewer decision required.** Do not open a seventh gatehouse epic. The next epic is
   the step-back; the evidence aims it at the climb's **acceptance rule / gradient** (median gate + floor-only
   batch), the seam that rolled back the centered arch and the gable.
2. **The fixes are good and should stay.** T-209 (closure stays truthful through dressing) and T-210 (gate
   centers by construction) both demonstrably work in this run and are not implicated in the miss. The
   step-back builds on them, it does not revisit them.
3. **`beside-arch-rolledback.png` is the artifact to look at.** It is the closest-to-concept build the climb
   produced — and it was discarded by the median. That single image is the case for the step-back.
4. **No instrument touched.** `measurements/` byte-clean; frozen judge unchanged; subscription shim only;
   `CLIMB_BATCH_SIZE` opt-in, so the frozen comparison runs are unperturbed.

## Bottom line

The capstone did its job as a **decision instrument**: it ran the fixed pipeline end-to-end, autonomously, and
returned a clean, reproducible verdict — **M1 not landed**, with the residual isolated to the per-move median
gate / floor-scoped batch escape (the *measure*), not to either landed fix and not to the build's closure or
gate placement. **The pre-committed stop-line fires; the gatehouse-patch sequence ends here; the next epic is
the step-back to whether the picture-climb's acceptance rule can finish any subject to M1.**
