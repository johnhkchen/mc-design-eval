# T-205-01 — Design: how to run the capstone so it can actually test its claim

One real decision dominates this run-and-judge ticket: **the round budget**. Everything else is the T-201
recipe re-applied. I lead with the decision because it determines whether the run is informative.

## The decision: give the climb room (a harness knob), don't run a known-truncating config

### The problem (from research)
At the frozen `maxRounds=5`, the climb cannot express all five productive moves the three fixes require
(`close_shell → apply_gable_roof → rebuild_arch → relief_walls → recolor_roof`) unless it makes them in five
rounds with **zero** rollbacks. T-201, on a shorter move-list (no rebuild), already burned a round on a
`carve_arch` rollback and hit the cap with `recolor_roof` unfired. Re-running at 5 rounds would, in the most
likely case, re-truncate before the roof recolour — making the run uninformative on the **roof colour claim**,
which is one third of the capstone. We would be re-confirming a T-201 artifact, not testing E-52.

### Options

**A — Run as-is at `maxRounds=5`, name the cap if it truncates.** Zero source change; maximally faithful to
"run-and-judge, no new hand." But it spends the full metered budget on a config we already know is likely to
truncate, and the most-probable outcome (roof unfired) tells us nothing new — it re-derives T-201. Rejected:
spends strong-tier votes to re-confirm a known truncation rather than test the fixes.

**B — Bump `CLIMB_DEFAULTS.maxRounds` to a larger value.** Touches the frozen creation-loop default; would
change `npm test` expectations around stopping behaviour and ripple into every future climb. Over-broad for a
single capstone run. Rejected: changes the instrument's default for everyone to serve one run.

**C — Add a minimal `CLIMB_MAX_ROUNDS` env override in the runner, default-preserving; run the capstone with a
larger budget.** One line: `const maxRounds = Number(process.env.CLIMB_MAX_ROUNDS) || CLIMB_DEFAULTS.maxRounds`.
Defaults to 5 → `npm test` and all existing behaviour byte-unchanged (the runner isn't in the suite anyway, and
`CLIMB_DEFAULTS.maxRounds` is never asserted — only `minRounds` is). It is a **harness/metered-budget knob, not
a new hand**: it adds no tool, no gate, no scoring change; it only lets the metered run play out long enough to
exercise hands that already exist. The ticket forbids *new hands*; a round-budget affordance is squarely a
"run" parameter, in the same family as `VOTES` and `CLIMB_OUT`. **Chosen.**

### Why C is honest, not a thumb on the scale
- It does not change what counts as a keep, a major, form-readiness, or a score — only how many rounds the
  agent gets to act. The agent still picks every tool autonomously; the gate still decides every keep.
- It cannot manufacture a pass: if the fixes don't compose, more rounds just means more rolled-back rounds and
  a named gap. It only removes a *structural* obstacle (the cap) that would otherwise mask the result.
- It is reversible and scoped: default is the frozen 5; only this capstone invocation sets the env var, and the
  trajectory records `maxRounds` so the budget is auditable.

### Budget chosen: `CLIMB_MAX_ROUNDS=8`
Five productive moves + slack for up to **two** rollbacks (T-201 had one). 8 also respects `stallK=2` /
`minRounds=3` — the climb still stops early on a 2-round no-accept streak, so 8 is a *ceiling*, not a forced
spend. Worst-case metered cost: round 0 + 8 rounds = 9 scored builds × 3 strong votes = **27** strong
`DiagnoseBuild` calls (vs T-201's 15) + ≤9 sonnet picks. Acceptable for the M1 capstone; the per-call 180 s
timeout bounds wall-clock and `stallK` will very likely stop it well before 8.

## The run recipe (unchanged from T-201, the proven path)

1. **Pre-flight, zero spend:** `GUARD_ONLY=1` — assert GL available, round-0 renders + beside written, exit
   clean. Plus the two zero-spend probes (`ROOF_MATERIAL_PROBE`, `REBUILD_ARCH_PROBE`) are already-evidenced by
   T-203/T-204; I rely on their committed logs rather than re-running them.
2. **Baseline invariants:** `npm test` green (record count); `git status measurements/` clean.
3. **Metered climb** (background, long): `CLIMB_MAX_ROUNDS=8
   CLIMB_OUT=docs/active/work/T-205-01/trajectory.json node …/picture-climb.mjs > climb.log 2>&1`.
4. **Collect glance evidence:** `beside-first.png` (round 0), `beside-best.png` (max-score round),
   `beside-final.png` (final kept) from `builds/gatehouse/picture-climb/`.
5. **Read trajectory** → answer the acceptance rubric (oscillation? arch/slate/pitch landed? round-by-round).
6. **Glance** `beside-final.png` vs concept on the calibrated-honesty register.
7. **Re-verify** `npm test` + `measurements/` clean. Commit work dir + the one-line runner knob.

## What the verdict must distinguish (anti-hedge — how it fails)
- **Reached its picture:** closed dressed walls + wide arched gate + dark gabled roof at right pitch + right
  orientation/scale, **without oscillating** (the form metric no longer turns the gate against the build). → M1
  landed on the gatehouse.
- **Fixes don't compose live** (one undoes another — e.g. the arch rebuild re-locks detail; or T-202 didn't
  fully take and it still oscillates). → named at full strength.
- **A precisely-named sixth gap** (interior/ROOM, missing kit material, proportion beyond pitch). → E-53.
  Any of these three is a complete result. The run is judged on the glance, scale/pitch on proportion not
  render pixels.

## Risk register (pre-decided)
- **All votes time out** → abort record, exit 2; infra/auth/spend signal, not a fix refutation. Report as such.
- **Climb still truncates at 8** (unlikely) → name the round budget as the limiter, report what fired.
- **`rebuild_arch` re-locks detail** (the feared S-202/S-203 coupling) → name it; T-203 showed it didn't on the
  probe (arch head sits below eave) but the live climb is the real test.
- **Roof recolour fires but reads wrong-value** → judge on the glance; T-204 census says value-true.
