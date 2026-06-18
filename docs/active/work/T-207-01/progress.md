# T-207-01 Progress — the metered re-climb (run log)

## Status: run complete, judged. Branch 2 — stall at 0 on a GENUINELY CLOSED form (→ S-208).

## What ran (per the plan)

- **Step 1 pre-flight (zero spend):** `git status measurements/` empty; `ANTHROPIC_API_KEY` unset
  (subscription shim); `GUARD_ONLY=1 …picture-climb.mjs` → `assets present; GL available` → clean exit.
- **Step 2 metered climb:** `CLIMB_MAX_ROUNDS=8 CLIMB_OUT=docs/active/work/T-207-01/trajectory.json node
  experiments/eval-alignment/picture-climb.mjs 2> …/climb.log`. Exit **0**. No hang, no abort.
- **Step 3 glances copied:** `beside-first.png` (round-0 seed), `beside-best.png` (round-3 wide-arch rebuild —
  the visual best, the only non-zero vote), `beside-final.png` (round-2 — the final KEPT build).
- **Step 6 invariants (after):** `measurements/` clean; `npm test` **2426/2426 green**; no T-207 source diff.

## The trajectory (every claim cited)

```
closureFirst 0.6078 (OPEN)  →  closureLast 1.000   formReady 0.9   votesTimedOut 0
trend 0→0→0→0→0→0   stopReason "stalled (2 rolled back)"   verdict climbed=false stalled=true oscillated=false
allRoundVotes [0,0,0,0,0,0,0,44,0,0,0,0]   actedOn WALL,ROOF   eyesOnly OPENING   framingResidual []
```

| R | pick | accepted | closure | scoreAfter | gate reason | majorsBefore→After |
|---|---|---|---|---|---|---|
| 0 | close_shell | (seed) | 0.608 | 0 [0/0/0] | — | WALL1 ROOF1 OPENING1 |
| 1 | **close_shell** | **KEPT** | 0.608→**1.000** | 0 [0/0/0] | closure +0.392 **form-credit** | unchanged |
| 2 | **apply_gable_roof** | **KEPT** | 1.000→1.000 | 0 [0/0/0] | tie (0): coverage shrank | OPENING **1→2** (gable added a major) |
| 3 | rebuild_arch | ROLLED BACK | 1.000→1.000 | 0 **[0/44/0]** | tie (0): no shrink | unchanged |
| 4 | recolor_roof | ROLLED BACK | 1.000→1.000 | 0 [0/0/0] | tie (0): no shrink | unchanged |

## The four acceptance questions — answered

1. **close_shell picked first?** YES, autonomously (R0 reason: *"closure 0.61 … open colonnade … close_shell
   must fire first"*). The T-206 fix is live: the seed reads **0.608 OPEN**, not T-205's 0.980.
2. **Closure reached ≥ 0.9 and STAYED?** YES. `close_shell` 0.608→**1.000** (KEPT on form-credit, not the
   picture vote). Every later round's `closure`/`closureAfter` = **1.000**. `closureLast = 1.000`. The shell
   genuinely closed and stayed closed through all detail rounds. **This is the precondition T-205 never met.**
3. **Did detail compound / any major clear?** PARTIAL geometry, **NO major cleared**. `apply_gable_roof` KEPT
   (a form move, on coverage). `rebuild_arch` **passed the coherence gate** (`ok=true, head=true, single=true,
   passage=true, closure=true` — the T-203 fix working LIVE on a closed form; T-205 got `head=false`) and built
   a **width-7 curved-voussoir wide arched gate**, yet scored **0/44/0 → median 0** and rolled back.
   `recolor_roof` landed **deepslate_tiles slate** (untested in T-205, which stalled before it), scored 0,
   rolled back. **No `deptMajorsAfter[d] < deptMajorsBefore[d]` on any round** — the department-dominant
   override (T-191) was starved again; R2's gable even *added* an OPENING major (1→2).
4. **Glance vs concept.** Did NOT reach its picture (M1 not landed) but every hand visibly works:
   - seed = ragged open dark "ruin"; R3 = clean closed box + peaked gable + **visible wide arched gate**
     (the defining gatehouse feature); R4 = clean closed box + **dark slate gable** (close to the concept roof).
   - The kept final build (R2) is a closed box with a **brown** gable and **no arch** — because the judge rolled
     back the arch (R3) and the slate (R4) one at a time. The picture-perfect build (closed+gable+arch+slate)
     was never assembled into one kept state. Scale/pitch read fine (pitch-lever 1.63→1.32, target 1.35;
     `framingResidual []`).

## Autonomy & metered cost

- **100% autonomous.** Every pick agent-chosen and well-reasoned (close_shell → gable → rebuild_arch →
  recolor_roof). The limiter was the **judge/gate**, not the agent. Only **5 rounds** ran (stallK=2 fired at R4)
  — `CLIMB_MAX_ROUNDS=8` was never the binding limit.
- **Cost:** tier `strong` (`claude-opus-4-8`), `VOTES=3`. **15** strong `DiagnoseBuild` calls (R0 seed + R1–R4
  candidates, 5 × 3) + **5** sonnet picks. `votesTimedOut: 0`; no abort; subscription shim only.

## Deviations from the plan

- **None to my steps.** A **concurrent sibling Lisa thread** (almost certainly S-208 detail-credit) edited
  `src/workshop/climb-gate.mjs` + `.test.mjs` (mtimes 00:13/00:14, *during* my run; +161 lines, +10 tests).
  These are **NOT** T-207-01 work (a run-and-judge ticket touches no source) — left untouched, not committed
  ([[ticket-double-dispatch]], [[shared-file-commit-sweep]]). `npm test` is green *with* them, so the sibling
  is at a green checkpoint; my invariant (suite green, instrument clean) holds regardless.
- "best" glance = round-3 (the rolled-back wide-arch candidate). No KEPT round scored above 0, so the visual
  best is a candidate, not a kept state — noted honestly.
