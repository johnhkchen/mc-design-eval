# T-190-01 — THE CLIMB, THE GLANCE, AND THE NAMED CEILING

**The M1 capstone run on the gatehouse. The lift is real and glance-agreed through the gable; the ceiling is
sharp and surprising: the loop SEES the roof-colour gap, HAS the hand, PICKS it autonomously — and the
accept-gate ROLLS BACK the correct fix because its whole-build scalar disagrees with the glance.**

## The run (metered, `run.log` + `trajectory.json`)

Trend **`0 → 0 → 8 → 60 → 60`** (Δ **+60** reported; **~+52 real** — the gable; stop: **agent-done**).
VOTES=3 strong-tier DiagnoseBuild per build, margin 4, department-aware gate live.

| round | tool | score | gate | what the glance shows |
|---|---|---|---|---|
| 0 | (seed) | 0 | — | ragged dark box, stepped-pyramid top (`round-first-beside.png`) |
| 1 | `construct_walls` | 0→8 | **KEPT** (+8) | grey coursed-stone envelope + cobble quoins appears |
| 2 | `apply_gable_roof` | 8→**60** | **KEPT** (+52) | a clean two-slope **gable** crowns the walls → reads as a gatehouse (`round-best-beside.png`) |
| 3 | `recolor_roof` | 60→**48** | **ROLLED BACK** (regressed −12) | roof recolored to concept-true dark-grey `deepslate_tiles` (`round3-grey-rolledback-beside.png`) |

The agent then chose **done**: *"the worst remaining divergence is roof material/colour … only `recolor_roof`
addresses it — but `recolor_roof` was rolled back. No remaining tool targets roof colour."*

## The human-glance check (the judge — I looked at all three renders)

- **Concept:** a grey stone gatehouse with a **dark / charcoal** peaked gable roof and an arched gate.
- **Round 2 (KEPT, score 60):** grey walls + quoins + a **warm-BROWN** spruce gable roof. The form is right;
  the roof **value/hue is clearly wrong** vs the concept's dark roof.
- **Round 3 (ROLLED BACK, score 48):** identical grey walls + the same gable form, roof recolored to
  **dark charcoal** `deepslate_tiles`. **On the glance this is unmistakably CLOSER to the concept** — the
  roof now reads dark, matching the picture; only the WALL quoin contrast and the missing arch remain.

**The glance and the gate DISAGREE, decisively.** The glance says round 3 (grey) > round 2 (brown). The
scalar accept-gate scored round 3 *lower* (48 < 60) and rolled it back. By the project's own governing rule —
*"if a build passes the gate but fails the glance, the glance wins"* — **here the build fails the GATE but
passes the GLANCE, so the gate is wrong.**

## Why the gate is wrong here (mechanism, from the recorded `deptMajors`)

The trajectory records per-department major counts across the rejected step:

- **Before `recolor_roof` (round 2 kept):** `deptMajors = {ROOF: 1}` — the *only* major is the brown-vs-grey
  roof colour. Everything else is minor.
- **After `recolor_roof` (round 3):** `deptMajors = {WALL: 1, OPENING: 1}` — **the ROOF major is GONE
  (1→0)**: the hand cleared exactly what it targeted. But the judge, with the roof no longer the worst thing,
  **promoted two pre-existing items** (the cobble rubble-quoin contrast; the missing arched gate) from minor
  to major. Those walls/openings **did not change** — `recolor_roof` only touches y ≥ eave.

So the whole-build scalar fell 60→48 not because anything got worse, but because **the judge's attention
shifted to the next real divergence** (T-189 §3, confirmed live) **plus vote noise** (the grey votes were
52/40/48 vs the brown 60/60/52 — overlapping bands; the medians differ by more than the margin by luck of
the draw). −12 is **past the margin**, so `acceptsRound` rejected at the regression branch.

**This is exactly where the department-aware tie-break I built this ticket falls short — honestly reported.**
The credit it adds (*"a tool that cleared a major in a department it targets is kept on a within-margin
tie"*) is sitting on the right data (`ROOF: 1→0`) but is **gated behind the tie zone**, and a *past-margin*
regression never enters that zone. The tie-break is necessary and correct (it would fire if the scalar were
merely flat); the run proves it is **insufficient** — the failure is one notch more severe than a tie.

## The ceiling, named precisely

**The loop's eyes, hand, and agent all work; its RULER does not.** The binding constraint is no longer a
missing hand (S-189 built it) nor the agent's judgment (it picked `recolor_roof` correctly and unprompted).
It is the **accept signal**: the whole-build `styleFidelityScore` measures attention-shift + vote-noise, so a
fix that genuinely clears its target department reads as a whole-build regression and is rolled back.

**What no hand fixes (the remaining concept gaps, → E-49 scope):**
- **The arched gate** (OPENING, now promoted to major) — no hand builds a timber arch surround.
- **The WALL quoin / value contrast** — `construct_walls` skinned it but the judge still wants more
  rubble-quoin contrast; no finer wall-relief hand.
- **The light eave/verge banding course** (minor) — no trim hand.

These are the next hands. But the **first** thing E-49 / the S-190 accept-gate follow-up must fix is the
**ruler**, not a hand: the climb cannot keep a glance-confirmed fix until the accept signal follows the
glance.

## The precise next fix (named, NOT implemented unvalidated)

Let the **department-cleared-a-major** signal override a whole-build scalar regression **when** the tool
cleared a major in a department it targets **and introduced no new major in any department it targets** (the
regression is then provably attention-shift to *untargeted* departments — here ROOF cleared, the new majors
are WALL+OPENING, which `recolor_roof` does not touch). That single rule would have KEPT the grey roof.

It is **left for its own ticket** deliberately: it trades scalar-trust for department-trust, and the
major/minor labels are themselves noisy, so it needs falsification on a subject where department-dominance
would wrongly keep a *bad* change (does the "no new major in a targeted department" guard hold?). One
glance on one subject licenses *naming* the fix, not shipping a gate-policy change. That validation is
E-49 / the S-190 accept-gate follow-up.

## Autonomy accounting (the M1→M4 honesty)

- **Fully autonomous at run time:** the loop rendered, critiqued, the agent picked each tool unprompted, the
  gate decided, with **zero human intervention during the run**. The agent's picks were all correct,
  including the unprompted, correct choice of `recolor_roof` for the roof-colour gap and the honest `done`.
- **Human-authored, not human-steered:** the hands (S-189), the gate + restraint (S-188), and the
  department-aware signal (this ticket) were built by hand before the run. The run used them; it did not
  need a human to nudge any round.
- **So:** the climb to a recognizable gabled gatehouse (+52) is an honest, unattended, picture-driven lift.
  The plateau at the roof colour is **not** an autonomy failure (the loop did everything right) — it is a
  **ruler** failure: the autonomous loop's own accept-gate rejected the autonomous, correct fix.

## Verdict against the falsifiable claim

The claim — *monotone-ish lift, glance agrees, mostly autonomous* — **half-holds, and fails in the most
instructive way the ticket named:**
- ✅ **Lift, autonomous, glance-agreed** through round 2: box → gabled gatehouse (+52), unattended.
- ❌ **Plateau** at the roof colour — but *not* because a hand is missing (it exists and was picked); because
  the **accept-gate's gradient disagrees with the glance** and rolls back the correct fix. This is the
  ticket's explicitly-named failure mode (*"the human glance disagrees with the critique's 'improvement' →
  the gradient still isn't the glance → E-47 family"*), now demonstrated **at the accept-gate** with live
  render evidence, not merely measured.

A named plateau with a precise "what's missing" is a complete result. The "what's missing" here is sharp:
**make the accept signal follow the glance** (department-dominant override of attention-shift regression),
then the loop will climb past the roof colour under its own steam.
