# T-193-01 — DESIGN: how to run the completion climb and judge it on the glance

The code is built. The design question is **how to run the capstone and read it honestly**, not what to
build. Three real decisions: (1) what exactly to run; (2) how the glance verdict is rendered and judged;
(3) how to record autonomy + residual without hedging.

## Decision 1 — run the live metered climb to completion, once, unsteered

**Chosen:** `CLIMB_OUT=docs/active/work/T-193-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`
— the full metered loop, agent-driven picks, no manual intervention, to its own stop (`agent-done` / `stall`
/ `maxRounds`).

**Why:** The ticket *is* this run (AC-1: "Completion climb run on the gatehouse"). The anti-hedge directive
requires the attack be actually run and reported — not asserted from the T-192 free-GL glance. This is the
**first run with all three S-192 hands in the MENU**, so it is the first chance for the loop to climb *past*
the T-191 `construct_walls` plateau into OPENING/eave territory under its own steam.

**Rejected — re-use the T-191 trajectory + the T-192 free glance and call it done.** That is the hedge: it
never puts the new hands in front of the live agent, so it cannot answer "does it reach its picture under the
loop's own steam." T-192 itself flagged the metered run as the missing corroboration. Refused.

**Rejected — bump VOTES or add a noise-aware scalar first.** Tempting (the scalar floored at 0 in T-191), but
that is the standing co-lever explicitly out of S-193 scope (T-191 open concern #2), and changing the
instrument before the capstone run muddies the result. The glance — not the scalar — is the judge by AC
design, so a noisy scalar does not block the verdict. Run as-is; report the noise.

**Rejected — re-roll if the votes come up unlucky.** That is exactly the dishonesty the anti-hedge memory
forbids ("attack actually run + reported; embarrassing-result-still-worthy"). One run, reported as-is.
If it plateaus, that plateau IS the finding (→ E-49).

## Decision 2 — the glance is the per-round beside-concept render; judged by me, against the concept

**Chosen:** the runner already writes `builds/gatehouse/picture-climb/round-{n}/beside-concept.png` every
round. After the run I **Read** the concept, the round-0 (first), the highest-scoring (best), and the final
beside renders, and write a glance verdict: for each E-48 divergence (roof colour, arch, quoin contrast,
banding) — **gone / partial / residual**, judged by eye against the concept, not by the scalar.

**Why:** AC-2 makes the human glance the judge and the picture-critique only the steering proxy. The
beside-concept sheet is purpose-built for this (the build and the concept side by side at one azimuth).
Reading first/best/final covers the AC's "first / best / final" artifact requirement directly.

**Rejected — trust `styleFidelityScore` / the trajectory verdict as the pass signal.** The score is
vote-noisy (0–76 same build) and the project's governing rule is "if a build passes the gate but fails the
glance, the glance wins" (milestones). The number is reported as evidence, never as the verdict.

**Copy the chosen beside PNGs into the work dir** (first/best/final) so the AC artifacts live beside the
trajectory, independent of the volatile `builds/` scratch dir.

## Decision 3 — record autonomy and the residual at full strength

**Chosen:** the four honest outcomes the ticket enumerates, decided from the actual run:
- **reached-its-picture** — all four divergences gone/partial on the glance, agent stopped on its own.
- **plateau short** — a hand wasn't built or a rebuild the loop can't reach; **name it for E-49**.
- **gate-kept-a-bad-change** — a KEPT round the glance rejects → S-191 override leaked, back to it.
- **autonomy cost** — count every human intervention (restarts, manual picks). Target zero; report truth.

**Why:** AC-3/AC-4 demand exactly this, "at full strength." The residual is the **input to E-49**, so naming
it precisely is the deliverable, not a footnote. The wide arched gate (widen=air-op→rebuild) and scale are
the already-predicted residuals; the run confirms or extends them.

## What this design explicitly does NOT do
- No source changes (frozen instrument untouched; the runner carries every lever). Only `CLIMB_OUT` (env).
- No instrument tuning (votes, margin, noise) — out of scope, named as the standing co-lever.
- No re-runs for a prettier number. One run, reported as-is.
- No new hand. If the run reveals a missing lever, that is an **E-49 finding**, recorded — not built here.

## Risks and how the design absorbs them
- **Vote-noise floors the scalar** → glance is the judge (Decision 2); the override is noise-robust by
  construction (reads dept counts). Report the noise spread from the trajectory.
- **The shim/agent errors mid-run** → that is a real autonomy cost; record it (Decision 3), do not silently
  restart-and-hide. A single restart after an infra error (not a steering nudge) is permissible and counted.
- **The run is long/expensive** → up to 5 rounds × VOTES=3 strong diagnoses + agent picks; bounded by
  `maxRounds`. Acceptable for the capstone. Run in the background, monitor, capture the full log.
- **frame_arch only frames the 1-wide slot** → known; if the agent picks it, the per-opening record names the
  widen→E-49 residual. That is a finding, not a failure of the run.
