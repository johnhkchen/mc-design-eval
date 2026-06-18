# T-211-01 — Design: how to run the capstone climb and judge it

**Epic E-54 / Story S-211.** Decide the run parameters, the verdict procedure, and the reproducibility
discipline. Grounded in the research: the fixes (T-209/T-210) are already on the source path, so this ticket is
*operational*, not constructive. The design space is "how to run it and how to judge it honestly," not "what
code to write."

## Decision 1 — run parameters: mirror T-208's escape run, extend the round budget

**Chosen:** `CLIMB_BATCH_SIZE=4 CLIMB_MAX_ROUNDS=8`, `CLIMB_OUT=docs/active/work/T-211-01/trajectory.json`,
`2> docs/active/work/T-211-01/climb.log`. Subscription shim (`ANTHROPIC_API_KEY` unset).

- **Why batch=4:** this is the T-208 escape size that produced the +20 dressed compound. The capstone tests the
  *same* mechanism with the metric fix in place — changing the batch size would confound "did the fix work" with
  "did a different batch help." Hold it at 4.
- **Why maxRounds=8:** T-208 used 8; gives the climb room for close_shell (form) → a detail batch → possibly a
  second batch (roof recolor / pitch) after the first is kept. The default 5 is reserved for byte-identical
  comparison runs; this is an explicit escape run, so 8 is consistent with T-208.
- **Rejected — batch=2 or 6:** 2 may not supply enough gradient (T-207's per-move stall); 6 risks stacking moves
  whose compound is harder to attribute. 4 is the proven value; the capstone is not the place to re-tune it.

## Decision 2 — verdict procedure: trajectory facts first, then the glance, then the stop-line

A three-part verdict, in this order (matching the AC and the anti-hedge "lead with how it fails"):

1. **Trajectory facts (deterministic, from `trajectory.json` + `climb.log`):** Was the dressed batch (relief +
   centered arch + roof) **KEPT**? On a **stayed-closed** form (`closureAfter ≥ 0.9`, `closureLast ≥ 0.9`)? Did
   the build **leave 0** and reach a plateau? Round-by-round picks + the kept-build composition + autonomy
   (any manual intervention? — none expected) + metered cost (rounds × votes, wall-clock, `votesTimedOut`).
2. **Human-glance check (the judge that wins):** the kept build's beside-concept render vs `concept.png`.
   M1 = a stranger recognizes the concept's gatehouse: **closed dressed walls + centered arched gate + dark
   gabled roof + right proportion.** If not M1, name the **precise residual at full strength** (e.g. "walls
   dressed and closed, gate centered, but roof still brown not slate" / "boxy proportion").
3. **The stop-line, invoked explicitly:** win or lose, state that this is the last gatehouse fix-and-climb.
   If **not M1**, the review states the next epic is the **step-back** — *can the picture-climb architecture
   finish any single subject to M1, and if not what changes* — NOT a seventh gatehouse fix.

## Decision 3 — reproducibility: one run to verdict, a second only if the first is M1-or-ambiguous

Score variance is itself a falsification branch ("M1 one run, near-miss the next → judge can't certify M1 →
stop-line fires"). The honest discipline:

- **Run once.** Read the trajectory + glance.
- **If the first run clearly misses** (brown roof / grey walls / boxy, residual obvious): that *is* the result.
  A near-miss reported at full strength is complete; no second run is needed to "confirm a miss" (re-running to
  chase a better number is exactly the hedge the stop-line forbids). Invoke the stop-line.
- **If the first run lands or is near the M1 line:** a single run cannot *certify* M1 against the variance
  branch. Then a **second confirming run** (same params) is warranted to check the verdict is reproducible — if
  it flips, the honest output is "the judge can't certify M1," which also fires the stop-line.
- **Rejected — always two runs:** wasteful and, on a clear miss, performative. **Rejected — never confirm:** a
  single lucky M1 read would be uncertifiable. The rule keys on the first read.

This matches the epic's framing exactly: the verdict is the deliverable, and an unreproducible verdict is itself
a stop-line trigger, not a reason to keep rolling dice.

## Decision 4 — evidence capture: copy first / best / final beside sheets into the work dir

The runner writes per-round `builds/gatehouse/picture-climb/round-N/beside-concept.png`. After the run:

- **first** = round-0 seed beside (`beside-first.png`) — the bare colonnade baseline.
- **best/kept** = the round where the kept batch landed (`beside-kept.png` or `beside-best.png`) — the build the
  glance verdict judges.
- **final** = the last round's beside (`beside-final.png`) — the plateau the climb stopped at.

Copy these into `docs/active/work/T-211-01/` so the evidence is self-contained (the `builds/` tree is a
regenerable draft). If first==final (no progress), say so rather than fabricating three distinct sheets.

## Decision 5 — no source change unless the run proves a defect

The expectation is **zero source edits** — the fixes are landed; this run exercises them end-to-end. The
allowed exceptions, each a *finding* under the stop-line, not a silent fix:

- **T-209 invariant leaked** (the relief-tolerant metric mis-kept a *genuinely-open* batch): → back to S-209,
  recorded as the finding; do not patch it inside the capstone.
- **T-210 centering conflict** (double opening / ragged edge on the live build): → recorded; the centered-gate
  ticket's open concern (`filled=0` because `close_shell` pre-seals the slot) is re-checked against the actual
  run order.

Any genuinely operational glue (e.g. an evidence-copy step, a re-render of the kept build beside the concept
using the existing `REBUILD_ARCH_PROBE`/`renderBesideConcept` path with zero spend) is fine — it touches no
instrument and no judge.

## What this design explicitly does NOT do

- Does not add a new climb hand (the ticket says so — "adds no new hand").
- Does not tune the judge, the score floor, or the closure threshold (those are T-206/T-209 territory; touching
  them here would confound the capstone).
- Does not touch `measurements/` or the frozen `DiagnoseBuild`/`styleFidelityScore`.
- Does not, on a miss, propose a gatehouse fix — the stop-line forbids it.

## Risk register (carried from the epic's "how this epic can fail")

| Risk | Detection | Response |
|---|---|---|
| Kept dressed build still misses the glance (brown/grey/boxy) | glance vs concept | **stop-line fires**; record residual; next epic = step-back |
| Relief-tolerance mis-keeps a genuinely-open batch | trajectory: a batch kept with `closureAfter<0.9` or a visibly-open glance | finding → back to S-209 |
| Centering produces double opening / ragged edge | glance + the rebuild log line (`residual/filled`) | finding → T-210 open concern re-check |
| Score variance → unreproducible verdict | second confirming run flips | "judge can't certify M1" → **stop-line fires** |
| Climb hangs / all votes time out | `RoundAbortedError`, non-zero exit, `votesTimedOut` | T-198 guard already handles; report it |
