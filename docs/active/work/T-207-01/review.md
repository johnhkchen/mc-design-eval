# T-207-01 Review — reclimb-on-corrected-form-metric-and-glance-verdict

**Epic E-53 / Story S-207.** The test of the hypothesis. Re-run the metered gatehouse climb on the T-206
footprint form-metric and judge it on the glance. Run-and-judge: **no new hand, no source change.** The
handoff for a human reviewer.

## Outcome in one line

**The form fix worked perfectly — `close_shell` fired first, the shell closed (0.608→1.000) and STAYED closed
through every detail round — but the build still stalls flat at 0, because geometrically-correct, visibly-
improving detail (a width-7 voussoir wide arched gate, a dark slate roof) scores 0 on the median picture
judge and rolls back. This is the GOOD failure: the S-208 detail-credit gap is now real, isolated, and
evidence-backed — NOT a form artifact like T-205.**

The falsifiable claim's **branch 2** (stall at 0 *on a genuinely closed form*) is the result. M1 did not land
on the gatehouse; the bottleneck is now definitively the judge gradient / detail-credit, with the form
removed as a confound.

## What changed (files)

- **No change** under `src/`, `experiments/`, `packs/`, `benchmarks/`, `measurements/`. This ticket runs the
  T-206 fix (already committed: `43dcc27`, `c7f8355`) and judges it.
- **`docs/active/work/T-207-01/`** — RDSPI artifacts (`research/design/structure/plan/progress/review.md`),
  `trajectory.json` (schema `picture-climb/v1`), `climb.log`, three glance renders
  (`beside-first/best/final.png`).
- **NOT mine, left untouched:** `src/workshop/climb-gate.mjs` + `.test.mjs` carry uncommitted edits from a
  **concurrent sibling thread** (S-208, mtimes during my run). I did not touch or stage them
  ([[ticket-double-dispatch]], [[shared-file-commit-sweep]]). Committing is left to Lisa.

## The trajectory read (every claim cited to a field)

`closureFirst 0.6078 → closureLast 1.000` · `trend 0→0→0→0→0→0` · `stopReason "stalled (2 rolled back)"` ·
`allRoundVotes [0×7, 44, 0×4]` · `votesTimedOut 0` · `actedOn [WALL,ROOF]` · `eyesOnly [OPENING]` ·
`framingResidual []`.

- **The T-206 fix is LIVE.** Seed `closure = 0.608` (OPEN) where T-205 read the *same seed* 0.980. The agent
  was told "open colonnade … close_shell must fire first" and picked it — round 0, autonomously.
- **The form genuinely closed and stayed.** `close_shell` 0.608→**1.000**, KEPT on **form-credit** (closure
  alone — the T-199/T-200 form-move routing removes the noisy picture vote from a wall-shell move). Rounds
  2–4 all read `closure 1.000`. The named residual (T-206 concern #1, closed+relief 0.9375) never bit —
  relief was never kept, and the gable/arch/recolor stayed at 1.000.
- **Every detail hand works geometrically.** `apply_gable_roof` KEPT (pitch-lever 1.63→1.32, target 1.35).
  `rebuild_arch` **passed the arch-aware coherence gate** (`ok=true [single passage head]=true`, width 7,
  curved voussoir) — the T-203 fix that got `head=false` on T-205's *open* seed now succeeds on the *closed*
  form. `recolor_roof` landed `deepslate_tiles` slate (T-205 stalled before reaching it).
- **But the judge has no gradient.** All five scored builds → median **0**. The wide-arch build drew the only
  non-zero vote in the whole run (**44**, one of three) — proof the judge *can* see the improvement, washed
  out by the median. Both detail hands rolled back on `tie (0): no shrink`.
- **No major ever cleared.** `deptMajorsAfter` never drops below `deptMajorsBefore`; R2's gable even *added*
  an OPENING major (1→2). The department-dominant override (T-191) — the designed escape from the 0-floor —
  is **starved** (it needs a major reported *cleared*; none is). Same E-44/45/46 "gate is the measure"
  thread, now binding on a CLOSED gatehouse.

## The glance (gate vs glance doctrine — the glance wins)

- `beside-first.png` (seed): a ragged, open, dark "ruined box" — an open colonnade.
- `beside-best.png` (round-3, rebuild_arch): a clean **closed box + peaked gable + visible wide arched gate** —
  the defining gatehouse feature, dramatically closer to the concept. Rolled back by the median (scored 0/44/0).
- `beside-final.png` (round-2, the KEPT build): closed box, **brown** gable, **no arch** — what the climb kept
  after rolling back the arch (R3) and the slate (R4) individually.

The picture-perfect build (closed + gable + **arch** + **slate**) exists piecewise across R2/R3/R4 but was
never assembled into one *kept* state, because the judge rejects each detail move on its own. That is the
S-208 gap in one sentence.

## Autonomy & metered cost

- **100% autonomous** — every pick agent-chosen, well-reasoned; the limiter was the measure, not the agent.
- Only **5 rounds** ran (stallK=2 at R4) → `CLIMB_MAX_ROUNDS=8` was never binding (the budget is not the
  confound — the gradient is).
- **Cost:** tier `strong` (`claude-opus-4-8`), `VOTES=3` → **15** strong `DiagnoseBuild` + **5** sonnet picks.
  `votesTimedOut 0`; no hang (T-198 180 s/call guard held); subscription shim only.

## Test coverage & invariants

- `npm test` → **2426/2426 green** (the T-206 metric is unit-covered by `wall-generate.test.mjs` WG-CS10–14;
  the +10 over T-206's 2416 are the sibling S-208 thread's, also green).
- `git status measurements/` **clean** before and after — **frozen instrument untouched**.
- Subscription shim only (`ANTHROPIC_API_KEY` unset); GUARD_ONLY pre-flight clean; no abort.
- **Coverage gap (honest):** this ticket adds **no regression test** — like T-205, the finding is a
  *measurement* defect (median judge insensitivity at the 0-floor + a starved override), not a localized code
  bug with a clean failing fixture. The clean fixture for S-208 is *already here*: the round-3 wide-arch build
  (scores 0/44/0 vs the seed's 0/0/0) is a pair the judge should rank apart and does not.

## Critical issues for the human reviewer

1. **M1 is NOT met on the gatehouse — but the diagnosis is now clean.** The form fix (T-206) did exactly its
   job: it removed the form as a confound. T-205 stalled because the form never closed (a form artifact); T-207
   stalls with the form genuinely closed (closure 1.000 throughout). The binding constraint is **isolated** to
   detail-credit / judge gradient.
2. **The single 44 vote is the key signal.** The wide-arch build is the only build the picture judge scored
   above 0, on one of three votes. The judge *can* perceive the improvement; median-of-3 with two 0s discards
   it. S-208 needs **accept-signal de-noising** (the falsifiable claim's named variance branch) AND/OR a
   detail-credit path that does not require a *median* improvement on a gradient-less 0-floor.
3. **The override starvation is the deeper bug.** No major ever clears even when a major's defining feature is
   built correctly (the wide arch for OPENING, slate for ROOF). The department-dominant override cannot fire
   because the judge never *reports* a major cleared. S-208 should target the **report→credit** path, not
   another construction hand (every hand already works).
4. **Concurrent sibling edits to `climb-gate.mjs`.** Uncommitted source from the S-208 thread is in the tree.
   Do not attribute it to T-207. Lisa's commit must not let one thread sweep the other's hunks.

## Verdict

**Branch 2 confirmed.** The form-readiness fix alone restores the *form* (close_shell first, shell closed and
stayed, hands all work geometrically) but **not the picture** — the build stalls at 0 on a genuinely closed
form. This is the precise, evidence-backed, *independent* finding S-207 was meant to produce: the S-208
detail-credit gap is real, and it is a **measurement** gap (median judge insensitivity + starved override),
not a build gap. E-53 does not close here; it hands S-208 a clean work-list whose top item is the judge's
gradient / accept-signal, with the round-3 wide-arch build (0/44/0) as the characterization fixture.
