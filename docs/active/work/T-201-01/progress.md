# T-201-01 — Progress

Run-and-judge, executed per `plan.md`. No source changes. The metered gatehouse climb ran clean (exit 0, no
abort, `votesTimedOut: 0`).

## Steps as executed

- **Step 0 (pre-flight, zero spend)** ✔ — `GUARD_ONLY=1` smoke: GL available, round-0 renders written, clean.
- **Step 1 (baseline)** ✔ — `npm test` **2397/2397** green; `git status measurements/` clean.
- **Step 2 (metered climb)** ✔ — `CLIMB_OUT=docs/active/work/T-201-01/trajectory.json node
  experiments/eval-alignment/picture-climb.mjs > climb.log 2>&1`. Ran to the round cap (`maxRounds=5`),
  exit 0. No deviation from plan.
- **Step 3 (renders)** ✔ — `beside-first.png` (round 0), `beside-best.png` = `beside-final.png` (round 4, the
  kept build, score 32 = the max).
- **Step 4 (trajectory read)** ✔ — below.
- **Step 5 (glance)** ✔ — `beside-final.png` inspected vs concept; verdict below.
- **Step 6 (re-verify)** — `npm test` + `measurements/` re-checked at commit (review.md).

## The autonomous-sequencing verdict (from `trajectory.json`, fully autonomous — every tool agent-picked)

| Question | Answer | Evidence |
|---|---|---|
| Agent picks `close_shell` on the open form? | **Yes** | r0 `pick.tool=close_shell` at closure 0.615 (told "open colonnade") |
| Does `close_shell` **stick** (not roll back)? | **YES — the fix took live** | r1 `accept=true`, `reason="closure +0.385 (0.615→1.000) form-credit"` on a picture **tie (0→0)**. The exact T-198 deadlock is broken. |
| Closure ≥ 0.9 and detail **unlocks**? | **Yes** | r1 `closureAfter=1.000`; r2/r3/r4 detail picks applied (not `blocked`) |
| Agent picks carve + relief? | **Yes (both)** | r3 `carve_arch`, r4 `relief_walls` — both autonomous |
| WALL majors clear? | **Yes** | r1 WALL 2→1, r4 WALL 2→0 (`deptMajorsBefore {OPENING:1,WALL:2}` → `after {OPENING:1,ROOF:1}`); relief_walls +20, KEPT |
| OPENING majors clear? | **No** | r3 `carve_arch` ROLLED BACK (`regressed -12`): ragged carve (notched columns 3,4,8,9), coherence gate correctly rejected → reverted to frame-only; "passage too narrow for an arch head — needs a wider opening (a rebuild)". OPENING stays `eyesOnly`. |

Trend `0 → 0 → 0 → 12 → 12 → 32 → 32` (Δ **+32**); `stopReason: round cap`; `votesTimedOut: 0`;
`inventory.verdict {climbed:true, oscillated:true, actionableFrac:0.6}`.

## The fifth gap (named at full strength → E-52): detail geometry collapses the form metric

The decisive new finding the colonnade hid. After `relief_walls` (r4), `closureAfter` fell **1.000 → 0.068**
and `closureLast = 0.068` — yet relief's own `recessClosureGuard` reported **"closure held"** and the wall
shell is physically intact. Cause (confirmed by reading `eaveRingClosure`, `src/view/wall-generate.mjs:275`):
the metric collects **every** band column `(x,z)` in `[floor, eaveY]` into the perimeter. `relief_walls` stands
**proud cobblestone quoins (224) + a plinth course (106)** *outside* the wall plane — exactly the geometry that
makes the wall read as construction. Those proud columns expand the sampled ring → `closureOf` collapses.

Downstream, this turned the climb's own gate against it: r5 the agent was told "closure 0.07 — open colonnade"
and **correctly re-picked `close_shell`** — but it **no-op'd** (`footprint registration below trust floor,
cov 0.26 < 0.5` — the proud columns also confused `registerRect`). On a longer climb this oscillates
(detail → metric says "re-opened" → close_shell no-op → detail …). **The form-readiness metric is not
invariant to proud detail geometry; form measurement and detail construction collide.** This is the "live
sequencing failure" the ticket anticipated, and it is the input to E-52.

## Residuals confirmed live (known, not new)

- **OPENING — arched gate unreachable by `carve_arch`.** The 1-wide passage yields a ragged carve the
  coherence gate rightly refutes; the true wide arched gate needs a *rebuild* to a wide opening, not a carve.
  (Already named E-49/E-52; confirmed live.)
- **ROOF material + pitch (the E-50 residual).** The roof stayed **brown** (spruce timber): the agent's r5
  terminal pick was `recolor_roof`, but `maxRounds=5` cut the climb before it executed. The wider eyes
  flagged **SCALE: ridgeToEave 1.6316 vs 1.35 (major)** — the gable is too tall/steep vs the concept. Both are
  the E-50 named roof residual, now confirmed by the live framing eyes.

## Glance verdict (`beside-final.png` vs concept)

**Did not reach its picture — fifth gap named (a complete result per the anti-hedge claim).** The build is a
**recognizable closed grey-stone gabled gatehouse mass** with a pale dressed-stone field and **proud corner
quoins** — relief reads as *construction*, the proof the colonnade hid, and a real step up from the open
colonnade. But the concept's **defining arched gate is absent**, the **roof is brown not dark slate**, and the
**roof is too steep/overhung**. Closed-walls ✔, orientation ✔ (eyes quiet), dressed stone ✔; arched gate ✗,
roof colour ✗, roof proportion ✗.

## Deviations

None. The run executed exactly as planned; the only surprise is the substantive closure-collapse finding,
which is a *result*, not a process deviation.
