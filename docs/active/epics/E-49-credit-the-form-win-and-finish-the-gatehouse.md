---
id: E-49
title: credit-the-form-win-and-finish-the-gatehouse
type: epic
status: open
priority: high
depends_on: [E-51]
spec: "§1, §7, §9"
stories: [S-199, S-200, S-201]
---

## Background (the fourth gap E-51 named — and it's an arbitration bug, not a missing hand)

**Milestone rung: M1 finish line, for real — "the gatehouse reaches *its* picture, mostly autonomously."**
E-51 built every piece the gatehouse needs and proved each one in isolation: the carve hand (T-194), the
wall-relief hand (T-195), the close-the-shell form hand + form-before-detail ordering gate (T-197), the
framing eyes (T-196), and a subprocess-timeout guard so the metered climb can't hang (T-198). Then T-198 ran
the **metered climb end-to-end** (12 opus diagnoses, fully autonomous, no hang) and **refuted the M1 claim —
precisely, and not where we expected.**

The build did **not** reach its picture, and the cause is **not** a missing hand or a blind eye (the framing
eyes read orientation + scale clean). It is a **gate-arbitration conflict between two mechanisms that are each
correct in isolation:**

- **The ordering gate (T-197)** demands `close_shell` *first* — and the agent obeyed it live, picking
  `close_shell` in round 0 and closing the shell (closureOf **0.615 → 1.000**).
- **The score-driven accept-gate (T-191/E-50)** then scored that closed shell a **tie** (16→16: a closed grey
  box reads no closer to the concept *at the diagnose-score's resolution* than an open one) and **rolled it
  back** ("no shrink").

So the accept-gate **rejects the very form-fix the ordering gate demands.** The shell never stays closed →
detail tools never unlock → the climb stalls at the open colonnade and the agent picks `done` honestly. The
renders make it visible: the **rolled-back** `close_shell` candidate is plainly *more building-like* (solid
closed walls) than the **kept** colonnade — the conflict, photographed.

This is the single thing standing between "the loop picks `close_shell` first" and "the gatehouse reaches its
picture." It is an **orchestration / credit-assignment** problem, the M1 finish, governed by
`docs/knowledge/project-direction.md` + `docs/knowledge/anti-hedge-directive.md`; frozen instrument untouched.

> **Scope change (2026-06-17):** E-49 was the *generalize-the-climb-across-subjects* (M3) stub. Generalization
> is **premature** — we have not finished M1 on even one subject. E-49 is repurposed to the M1-finish
> gate-arbitration fix; generalization moves to a **successor epic (E-52, future stub)**. One subject to its
> picture first ([[diverge-before-converge-experiment-freedom]] — don't pre-commit a generalization shape we
> can't see yet).

## The fix, in one sentence

**A form win must be credit-able.** The accept-gate must keep a tool that raises form-readiness (closure↑)
even when the whole-build picture-score ties or dips — exactly the way E-50's department-dominant override
already keeps a tool that clears a *department* major through a scalar regression. Closing the shell is a real
gain the picture-scalar is too coarse (and too noisy) to see; the gate must credit it on a **form signal**,
not the picture number.

## Stories

- **S-199 — credit-the-form-win accept-gate fix (the spine).** Extend the accept-gate so a genuine
  form-readiness gain (closureOf↑ toward the form-ready threshold) is **kept** even at a picture-score tie /
  regression — the form-analog of the E-50 department-dominant override. **Falsified both ways:** it must keep
  `close_shell` on the real T-198 tie AND reject a deliberately-bad "closing" move (one that floods the
  interior, regresses the roof, or adds a new major) — credit-for-form must not become a rubber stamp.
- **S-200 — de-noise the form decision (the co-lever T-198 named).** The form stage decided "tie" on the
  **0–76-swing picture scalar** (round-0 scored 0 in one run, 16 in another, same seed). A FORM move should be
  judged on a clean, deterministic **form signal** (closureOf), not the noisy picture vote — so a "tie" is a
  real tie, not vote noise. Also port the **balanced-brace `agentPick` parse fix** (T-198, latent crash on any
  two-object reply) to `autonomy-loop.mjs`, which shares the idiom.
- **S-201 — finish the gatehouse (the M1 capstone).** Re-run the metered gatehouse climb on the fixed +
  de-noised gate. Does `close_shell` now **stick** → detail tools unlock → the carve + relief hands (T-194/195)
  read against a closed wall → the build reach **its** picture on the glance (closed dressed walls, arched
  gate, dark gabled roof, right orientation/scale), mostly autonomously? Or is there a **fifth gap** — name it
  at full strength. Depends on S-199 + S-200.

## How this epic can fail (state it up front — anti-hedge)

- **Credit-for-form becomes a rubber stamp.** The new term keeps a "closing" move that is actually bad
  (floods the interior, buries the roof, regresses a real major). Then the fix is refuted as specified and
  needs a tighter guard (the E-50 net-minor lesson: department-trust was only safe *with* the net check).
- **The shell closes but the climb still doesn't reach its picture** — `close_shell` sticks, detail unlocks,
  but carve/relief still don't read, or a **fifth gap** appears (roof pitch/material — the E-50 named residual,
  or scale). Then M1 on the gatehouse is genuinely harder than the hands+gate, and that residual is the input
  to the generalization epic.
- **The form signal and the picture signal disagree in the wrong direction** — a closureOf↑ that the *glance*
  says is worse (e.g. a closed box that hides a feature the concept shows open). Then "credit form" is too
  blunt and needs to be glance-checked, not just closure-checked.
- **Scope creep into generalization.** This epic finishes the *gatehouse*. Generalizing across subjects is
  E-52. One subject to its picture first.

## Done when

The accept-gate credits a genuine form win (keeps `close_shell` through a picture-score tie, proven on the
real T-198 trajectory) and rejects a deliberately-bad closing move (falsified both ways); the form stage
decides on a clean form signal, not the noisy scalar; and a re-run metered gatehouse climb **closes the shell,
unlocks detail, and reaches its picture on the glance** — mostly autonomously — **or** the fifth gap is named
at full strength as the clean input to the generalization epic (E-52). Frozen instrument untouched;
subscription shim only.
