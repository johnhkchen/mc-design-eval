# Anti-Hedge Directive — Force Falsifiable Commitment

*Ratified by the reviewer 2026-06-15. Companion to `project-direction.md`; **overrides softer
guidance when they conflict.** Single purpose: stop the project from choosing directions that cannot
fail and therefore cannot impress. Every proposed epic/story/ticket must state the four mandatory
commitments below, and must lead with how it could fail.*

## The failure this blocks

Fluency in the rigor vocabulary — "aligned eval," "validated against human preference," "hardened
against gaming," "transferable," "robust" — used to pick directions that *sound* on-axis but are
built so they cannot produce an embarrassing result. **A plan with no failure condition is a hedge,
not a project.** Fluency in the framework is not exposure to a verdict.

### Tells of a hedge (reject on sight)

- A narrative writable *before* doing the work ("I discovered it was misaligned, validated it,
  hardened it" — tellable about any eval at any depth with any result).
- A validation fixture whose outcome is pre-guaranteed ("good build > deliberately bad build,"
  "child > us"). A test you know you'll pass is not a test.
- "Hardened against gaming" as a claim with no specific attack actually run.
- Any direction whose only acceptable outcome is success.

## Mandatory commitments — every direction states all four

1. **The falsifiable claim.** What specific, non-obvious prediction could turn out *wrong*? If you
   cannot name one, it's a hedge.
2. **The fixture that can fail.** What test case has a *genuinely uncertain* outcome? Prefer contested
   pairs, near-ties, cases where human rankers themselves disagree. Reject pre-guaranteed fixtures.
3. **The attack you will actually run.** The specific way you'll try to break/game it, with a
   commitment to report the result *even if embarrassing*. An unfixed failure honestly reported beats
   a clean sweep — it proves the testing was real.
4. **The embarrassing-result test.** If this produced a result that made us look bad, would we still
   hold something portfolio-worthy (a real finding, a documented limitation, a postmortem)? If not,
   it's a hedge.

## What "impressive" actually is

**Impressiveness is the residue of risked-and-survived falsification.** "It worked" is only worth
telling if "it might not have" was true. The disagreements, the attacks that succeeded, the cases
where the eval split from human judgment *are* the artifact, not blemishes on it. A result with no
reported failures was never tested.

## How to steer

- Toward directions that **could visibly fail and didn't.**
- Toward the **hard middle** (contested rankings, near-ties, ambiguous quality); away from the **easy
  ends** (obvious orderings).
- Toward **specific predictions, run and reported**; away from general narratives of rigor.
- When proposing a direction, **lead with how it could fail**, then what you'd learn either way.

## Guardrail (do not over-correct)

Risk for its own sake is not the goal — manufactured difficulty that demonstrates nothing is
craft-drift in a lab coat. The falsifiable claim must sit on a **transferable, in-demand skill** (eval
design, agent architecture, generalization, reliability), and the agent must still **work at real
scale.** Force real exposure on real problems — not hard-but-pointless tests.

## Standing test, applied to every decision

**"Could this direction have produced a result I'd rather not report? If no, it's a hedge — reject
it."** If a spine could be written up as a success *before the work is done*, it is not a project.
Send it back.
