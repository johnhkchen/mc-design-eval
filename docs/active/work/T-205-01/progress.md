# T-205-01 — Progress: the M1 capstone re-climb

**Status: run complete, judged. Verdict — did NOT reach its picture; a precise SIXTH GAP is named (→ E-53).**
A complete result under the anti-hedge claim (the failure mode is led with). One source line added (the round
knob); `npm test` 2411/2411 green before and after; `measurements/` byte-clean; subscription shim only.

## Steps as executed (per plan.md)

- **Step 0 — round-budget knob** ✔ `picture-climb.mjs:78` now `const maxRounds = Number(process.env.CLIMB_MAX_ROUNDS) || CLIMB_DEFAULTS.maxRounds`. Parses; default-preserving.
- **Step 1 — baseline** ✔ `npm test` 2411/2411; `measurements/` clean (recorded).
- **Step 2 — GUARD_ONLY pre-flight** ✔ GL available, round-0 renders + beside written, zero spend.
- **Step 3 — metered climb** ✔ `CLIMB_MAX_ROUNDS=8 CLIMB_OUT=…/trajectory.json node …/picture-climb.mjs`,
  background, exit 0. `votesTimedOut: 0`, no abort, no hang. **Stopped at "stalled (3 rolled back)" — round 4
  of an 8 ceiling; the round budget was NOT the limiter** (the knob was a correct, unused precaution).
- **Step 4 — renders** ✔ `beside-first/best/final.png` (all = round-0; everything rolled back so the kept
  build is the seed). Plus three candidate glances (`cand-relief-r1`, `cand-rebuildarch-r2`,
  `cand-gable-pitch-r3`) to show whether the hands fired *visually*.
- **Step 5/6 — trajectory + glance** ✔ below.
- **Step 7 — invariants** ✔ `npm test` 2411/2411; `measurements/` clean.

## The trajectory verdict (`trajectory.json`, fully autonomous — every tool agent-picked)

`trend 0 → 0 → 0 → 0 → 0  (Δ +0)`; `stopReason: stalled (3 rolled back)`; `votesTimedOut: 0`;
`inventory.verdict {climbed:false, stalled:true, oscillated:false, actionableFrac:0}`;
`observedScoreSpread {min:0, max:8, allRoundVotes:[0×9]}`; `closureFirst 0.980 → closureLast 0.980`.

| r | pick (autonomous) | applied | gate | why |
|---|---|---|---|---|
| 0 | — (seed) | — | score **0** (votes 0/8/0) | seed already closed (closure 0.980); agent picks `relief_walls` |
| 1 | `relief_walls` | yes | **rolled back** "tie (0): no shrink" | recolor→stone_bricks + 215 proud quoins + plinth; `closureAfter=**1.0**` (no crater); but scored 0/0/0, WALL major not cleared |
| 2 | `rebuild_arch` | yes | **rolled back** "tie (0): no shrink" | `head=false` (bare rectangle, no spandrels) → coherence gate **refuted** → frame_arch fallback (too narrow); 0/0/0 |
| 3 | `apply_gable_roof` | yes | **rolled back** "tie (0): no shrink" | **pitch lever fired 1.68→1.34** (target 1.35); `closureAfter=1.0`; framing scale flag clear; still scored 0/0/0, ROOF major not cleared |

## What composed live (the wins — stated plainly)

- **T-202 (form metric invariant to proud detail) — TOOK LIVE.** `relief_walls` `closureAfter=1.000` (T-201
  cratered to 0.068 here); `apply_gable_roof` `closureAfter=1.000`. **`oscillated=false`** — the fifth gap's
  oscillation is gone. The metric no longer turns the gate against detail.
- **T-204 (pitch lever) — TOOK LIVE.** `[pitch-lever] ratio 1.68 → 1.34 via pitch 0.5 (target 1.35)`; r3
  framing `ridgeToEave 1.3, flagged:false`. The gable reads as a legible peaked roof at the right pitch on the
  glance (`cand-gable-pitch-r3.png`) — a clear visual win over T-201's 1.63 steep gable.
- **The hands fire and visibly improve the build.** `cand-relief-r1.png`: paler stone-brick field + proud
  quoins (vs the seed's flat dark walls). `cand-gable-pitch-r3.png`: a closed brown gable. The agent's picks
  were all sound and autonomous.

## What did NOT compose live

- **T-203 (wide arch rebuild) — did NOT compose.** On the live seed, `rebuild_arch` produced
  `head=false — no arch head built (bare rectangle, no spandrels above the spring)`; the arch-aware coherence
  gate (T-203's own fix) correctly refuted it → fell back to `frame_arch` (too narrow). The T-203
  `REBUILD_ARCH_PROBE` reported `head=true` on its fixture; the actual seed geometry differs, so the arch head
  does not build. **The arch is still absent.**
- **`recolor_roof` never reached** — the climb stalled at round 4 (not the 8-round cap), so the slate-colour
  move was not exercised live. (The applied gable is brown; slate recolour untested this run.)

## The SIXTH GAP (named at full strength → E-53): the measure has no gradient on a far-from-picture seed

The decisive finding. With the geometry blockers removed, the **binding** constraint is now the measure:

1. **Whole-build picture score floors at 0; the department diagnosis is frozen.** Seed and all three
   candidates score exactly `0/0/0` with an **identical** 4-major verdict (WALL/ROOF/OPENING/ROOM), re-emitted
   verbatim every round — even contradicting the render: it calls the r3 *closed brown gable* "an irregular
   terraced/stepped dark mass… does not read as a gable." So (a) the scalar has no gradient and (b) the
   **department-dominant override (T-191), the climb's designed escape from the 0-floor, is starved** — it
   needs a major reported *cleared* (`deptMajorsAfter < before`), and the judge never clears one. Every move →
   "tie (0): no shrink" → rollback → stall. This is the E-44/E-45/E-46 "the gate is the measure, not the
   build" thread, now the **binding** constraint for the gatehouse climb.

2. **Coupled: seed/metric divergence (a T-202 trade-off).** The seed (`generated/gatehouse/artifact.json`,
   **unchanged since Jun 11**) renders as a dark, ragged, terraced "ruined box" with deep gaps and an open top
   (`beside-final.png`) — the VLM's "open hollow shell… reads as unfinished/ruined box." Yet `eaveRingClosure`
   now reads it **0.980** (form-ready), where T-201 read the **same seed 0.615** (open colonnade). The cause is
   T-202's `robustExtent`/proud-trim: trimming the outer 5% of band columns removes the oscillation (its
   goal — achieved) but **also trims away the genuine raggedness**, so the form gate believes the ruin is
   closed and the agent never picks `close_shell`. The hands then decorate a base that reads as a ruin, which
   no single department fix can lift off 0. Form metric and glance now disagree — in the *opposite* direction
   from T-201 (metric over-reads closure instead of under-reading it).

## Glance verdict (`beside-final.png` vs concept)

**Did not reach its picture.** The kept build is the seed: a dark, ragged, terraced ruined box — nothing like
the concept's clean stone gatehouse with a peaked gable and an arched gate. Closed-by-metric ✗ (the glance
reads ragged/open), arched gate ✗, slate roof ✗, gable ✗ (only on the rejected candidate). The improving
hands were all rolled back by a gradient-less measure.

## Autonomy & metered cost

- **100% autonomous** — every pick agent-chosen (`relief_walls → rebuild_arch → apply_gable_roof`), each with
  sound reasoning; the limiter was the measure, not the agent's judgement.
- **Cost:** tier `strong` (`claude-opus-4-8`), `VOTES=3`. Scored builds: round 0 + r1,r2,r3 = **4 × 3 = 12**
  strong `DiagnoseBuild` calls + **4** sonnet picks. `votesTimedOut: 0`; no abort; no hang. Stopped well under
  the 8-round ceiling.

## Deviations from plan

- **The round-budget knob proved unnecessary** (the climb stalled at round 4, not the cap). It is a correct,
  harmless precaution kept for auditability/future runs; it did not affect this outcome. Its value: it *ruled
  out* the T-201 round-cap as the explanation, isolating the measure as the true limiter.
- Otherwise the run executed exactly as planned; the stall is a **result**, not a process deviation.
