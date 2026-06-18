# T-211-01 — Progress: the capstone re-climb, run and judged

**Epic E-54 / Story S-211.** Run-and-judge, no source change. Result led with how it failed (anti-hedge):
**the kept build is an M1 near-miss → the pre-committed stop-line fires.** The two landed fixes (T-209 closure,
T-210 centered gate) both **worked as specified**; the miss has a precise, *mechanistic* cause that is neither
of them. Details below.

## Step 0 — pre-flight ✅
- `git status --short measurements/ src/ experiments/` empty (clean tree).
- `ANTHROPIC_API_KEY` unset (subscription shim).
- `npm test` **2438/2438 green** (baseline = close-out value; no source changed).
- Seed / program / concept assets all present.

## Step 1 — metered climb (batch on) ✅
```
CLIMB_MAX_ROUNDS=8 CLIMB_BATCH_SIZE=4 CLIMB_OUT=…/T-211-01/trajectory.json \
  node experiments/eval-alignment/picture-climb.mjs 2> …/T-211-01/climb.log
```
Exited **0** (clean; no T-198 abort). `votesTimedOut=0` (judge healthy all run). Fully autonomous — **zero
manual intervention.** Metered cost: 6 scored rounds × 3 strong-tier votes + agent picks (~few min wall-clock).

## Step 2 — trajectory facts (deterministic)

```
trend: 0 → 0 → 0 → 0 → 8 → 8 → 8   (Δ +8; stop: stalled (2 rolled back))
shell closure: 0.667 → 1.000 (form-ready ≥ 0.9), STAYED 1.000 every subsequent round
```

| r | pick | score | votes | closure | verdict |
|---|---|---|---|---|---|
| 0 | (seed) | 0 | 0/0/0 | 0.667 | open colonnade — **T-209: reads OPEN, correctly** |
| 1 | close_shell | 0→0 | 0/0/0 | 0.667→**1.000** | KEPT (form-credit) |
| 2 | **batch**[apply_gable_roof] | 0→0 | 0/12/0 | 1.000 | ROLLED BACK (compound tie at floor) |
| 3 | construct_walls | 0→**8** | 8/8/8 | 1.000 | **KEPT (+8)** — closed wall envelope + skin + quoins |
| 4 | rebuild_arch | 8→8 | **8/0/48** | 1.000 | ROLLED BACK (median tie — *one vote saw 48*) |
| 5 | frame_arch | 8→0 | 8/0/0 | 1.000 | ROLLED BACK (regressed) |

- **Kept build = round 3** (construct_walls): score **8**, closure **1.000** (stayed closed). The plateau.
- **Was the dressed batch kept?** **No.** The batch escape stacked only **one** pick (apply_gable_roof) in
  round 2 — the agent's next pick was `construct_walls`, a form move (`closureDecidedMove`) that *ends* a detail
  batch by design — so the "compound" was a single gable, tied at the floor (median 0), rolled back. The
  relief + centered-arch + roof **compound that T-208 reached (+20) did not recur.**
- **Did it leave 0?** Yes — `0→8`, `climbed`. But via a single **form** move (construct_walls), not the dressed
  detail compound.
- **Did the form stay closed?** **Yes — 1.000 every round after close_shell. No collapse.** This is T-209
  working: relief/dressing never triggered the old 1.000→0.068 false-reopen (relief_walls was never reached, and
  construct_walls's closed envelope held).

## Step 3 — the glance (the judge that wins) — renders in the work dir

- `beside-first.png` (round 0): dark **hollow open colonnade** — pillars, no walls, no roof. Score 0. ✓ matches.
- `beside-kept.png` (round 3, the KEPT build): a **closed dark-grey box** with light corner quoins and a
  **stepped/terraced pyramidal dark cap** — **no visible arched gate, no clean gable, boxy (too-tall)
  proportion, dark not pale stone.**
- `beside-arch-rolledback.png` (round 4, ROLLED BACK): the same box **with a clean centered arched gateway
  carved in** — `centeredByConstruction=true faceW=30 span=[-3,4] gate ok=true coherent`. **This is T-210
  working** — the gate is centered on the face by construction. One judge scored this build **48**; the median
  (8/0/48) discarded it.

**Glance verdict vs concept — NOT M1.** Against the four criteria:
- closed walls ✓ · corner quoins ✓ · **centered arched gate ✗** (built correctly in r4, rolled back) ·
  **dark *gabled* roof ✗** (stepped pyramid cap; gable rolled back r2) · **right proportion ✗** (boxy/too-tall) ·
  pale dressed stone ✗ (reads dark grey).

A stranger would **not** recognize the kept build as the concept's gatehouse — it reads as a dark closed box
with a stepped cap and no gate. **M1 near-miss.**

## Step 4 — the mechanistic cause (precise residual, full strength)

**The batch escape only fires at the score floor (`coldStartFloor`: `score ≤ scoreFloor=0`).** The sequence:
1. `close_shell` closed the form (score still 0 → on the floor).
2. The *first* detail batch (round 2) stacked only the gable (next pick was the form move construct_walls →
   batch ends) → single-pick "compound" tied at floor → rolled back.
3. `construct_walls` (round 3) went through the **per-move form-credit path** and scored **+8** → **the build
   left the score floor.**
4. **Off the floor, `coldStartFloor` is now false → the batch escape disengages.** rebuild_arch (the centered
   arch, one vote **48**), frame_arch, and (had it been reached) relief_walls all fell back to the **per-move
   median gate** — the exact median-gradient problem T-207/T-208 documented. The median rolled the +48 centered
   arch back as a "tie (no shrink)."

So neither landed fix failed: **T-209 held** (form closed and stayed closed; no false reopen — the bug that
rejected T-208's +20 batch is gone) and **T-210 held** (the gate centered by construction, coherent, +48 from
one judge). The build still misses because **a single form move lifted the score off the floor before the
dressing could compound, re-binding the per-move median-gradient problem** that the batch escape only suppresses
*at* the floor. The binding constraint is, once again, **the MEASURE (the per-move median gate), not the build.**

## Step 5 — reproducibility gate
Per design decision 3: this is a **clear miss** (obvious residual: no gate, stepped cap, boxy, dark). A second
run is **not** taken — re-rolling to chase a number is the hedge the stop-line forbids. The miss is **robust**:
its cause is a deterministic structural mechanism (escape disengages off the floor), not score noise. Verdict
complete on one run.

## Step 6 — invariants ✅
`npm test` 2438/2438 green · `measurements/` byte-clean before+after · `git diff src/ experiments/` empty (no
source changed) · subscription shim only (`ANTHROPIC_API_KEY` unset whole run) · frozen judge untouched.

## Deviation from plan
None procedural. The substantive finding deviates from the *hypothesis* (the dressed batch was expected to be
kept; instead a form move lifted the build off the floor first and the dressing fell to the per-move gate). This
is the AC's first failure branch — recorded at full strength, not patched. → `review.md` invokes the stop-line.
