# Project Direction Directive — Minecraft Build Agent

*Ratified by the reviewer 2026-06-15. This is the project's standing answer to "what are we
optimizing?" and governs **every direction decision** — it sits above the pipeline philosophy
(`pipeline-philosophy.md`), the milestone ladder (`milestones.md`), and every epic. When a proposed
direction conflicts with the architecture of record, this document decides which way the conflict
resolves: toward transferable capability, never toward craft-depth. Apply the five-test decision
filter to any new epic/story/ticket before it is ratified.*

## The one rule

**Minecraft is the substrate, not the skill.** The artifact's purpose is *not* to be good at
Minecraft. Its purpose is to demonstrate transferable, in-demand AI-engineering capability:
evaluation design, agentic system architecture, problem-framing/design-thinking, reliability/cost/
latency engineering, and flexible iteration. Treat "better Minecraft builds" as a *proxy metric
only* — never the goal. Build quality is how we *prove* the skills, not the thing we're optimizing.

## The failure mode to block

The project drifts toward **"make one generation great by stacking more Minecraft-specific
techniques."** This is the primary anti-pattern. It produces visible local progress (this build
looks better!) while spending the year on a *non-transferable* deposit. Polishing a single output is
a demo; building a system that measures and generalizes is the artifact. Catch this drift every time
it appears and reframe it.

## Decision filter — run every proposed direction through all five

1. **Transfer test.** If this succeeds, what general skill can I show *without using the word
   "Minecraft"*? If the honest answer is "I got better at Minecraft," it's craft-drift. Reframe into
   a general-skill demonstration.
2. **Legibility test.** Could a hiring engineer who knows nothing about Minecraft see what's
   impressive here in 60 seconds? If the value is legible only to Minecraft people, reshape it so the
   *method* is the achievement, not the *output*.
3. **Eval test.** Does this force me to build or improve a *measurement* of quality — metrics, test
   sets, regression detection? Prefer directions that make me design evals. Eval design is the
   highest-transfer, least-fakeable, most-in-demand signal. A direction that improves output but adds
   no measurable eval is suspect.
4. **Breadth test.** Does this make the *system* more general (more build types, more failure
   recovery, generalizes across prompts) or just hard-code more technique into one narrow
   generation? Prefer generalization over single-output polish.
5. **Cheap-to-be-wrong test.** If this direction dead-ends, do I still walk away with a transferable
   skill demonstrated — a documented eval methodology, a postmortem, a reusable architecture — or
   with nothing but sunk Minecraft-specific effort? Prefer directions whose *failure still yields a
   portfolio-worthy result*.

## How to respond when a direction is proposed

- **(a) Name the axis:** craft-depth vs. transferable-capability.
- **(b) If craft-depth:** give the reframed transferable version that captures the *same underlying
  problem*. (Example: instead of "hand-tune rules so this castle looks better," reframe to "build an
  eval that scores builds on measurable dimensions, then show the agent improving against it across
  many build types.")
- **(c) Name the payoff:** state explicitly which hiring-relevant skill the reframed version
  demonstrates.

## Guardrail against over-correction

Do **not** let "transferable" become an excuse to stay shallow or never ship. The artifact's
credibility depends on the agent *actually working at real scale* — real builds, real volume, real
failures survived. Keep the substrate real and hard. We are steering *which problems we solve* (the
general ones), not *whether we solve real ones*. The agent still has to work.

## Standing principle

Optimize for the **breadth of futures in which this artifact pays off**, not the quality of any
single build. Under uncertainty about which specific skill will matter, the correct move is
robustness, not optimization: invest in what pays off across the most futures and costs least when
wrong. When in doubt, choose the direction that produces a better *story about how I think, measure,
and build systems* over the one that produces a better *build*.

## Weekly check

*"What did I get better at this week, stated without the word Minecraft?"* If the answer is a real,
in-demand skill, we're on the robust axis. If the only honest answer contains "Minecraft," we've
drifted — catch it and reframe before another week is spent.
