---
id: E-08
title: autonomous-experiment-loop
type: epic
status: open
priority: high
depends_on: [E-03, E-04]
spec: "§7, §9, §11"
stories: []
---

## Goal

Turn the manual `run.mjs --approach` → hand-judge → hand-journal cycle into a **repeatable, autonomous
instrument**: a self-running, self-judging, self-consolidating experiment loop that hill-climbs build
quality across one-variable trials, promotes a champion config by a robustness gate, and writes its
findings back into `docs/knowledge/design-learnings.md` as durable principles — unattended, overnight.

## Why it matters

The Phase-1 research question is *which techniques achieve each jump in quality* (§1, §7). We have been
answering it **by hand** — every reference-grounding / craft-color-split / one-plane finding was a
manual run, a manual render read, and a manual journal edit. That does not scale and is not
reproducible. The categorical judge (E-04) is now a trustworthy-enough arbiter to close the loop:
generate a variant → judge it → keep it if it robustly wins → record why. This epic is the engine that
*discovers* the improved archetypes; **E-06 is the fair fixed matrix that then compares them**. E-08
produces the techniques; E-06 measures them.

## Scope

**In:**
- **Experiment manifest** — a declarative queue where each entry is *one hypothesis*: the single
  variable under test (a prompt clause, a flag, a reference), the predicted dimension + direction, and
  the trial *shape* (`round-0-only` | `full-pipeline` | `judge-only`) so cost matches the question.
- **Champion record + promotion/robustness gate** — track the current best config (seeded at run 014);
  a challenger is promoted only on *margin*: a full-category lift on the targeted dimension, **unanimous
  (3/3)**, with **no regression** on the others, A/B-judged against **both rounds** (encodes P14/P10
  learnings). Within-band wobble never promotes.
- **Cost-shaped, two-tier judging** — 1-sample *screen* → 3-sample *finalize* only for screen-passers;
  reuse a frozen design-doc across build-variant trials; `round-0-only` where the revision isn't under
  test. This is what makes ~2 experiments/hour (≈16 overnight) feasible against the serial ~28-min
  full-pipeline cost and the rate-limit serialization (P8).
- **Autonomous loop driver** — serial execution, wake-on-completion, **failure-tolerant** (a
  narrated/crashed/invalid trial logs and is skipped, never halts the loop), rate-limit aware, with a
  hard budget cap (max trials / max wall-clock).
- **Self-consolidation agent** — after each promotion (and at end-of-batch): append the attempt log,
  promote/scope the tested principles by the robustness gate, update the champion record, and emit a
  **morning brief** (what moved, what didn't, renders to spot-check, recommended next).
- **Safety harness** — runs on a dedicated branch; an allowlist fences *which* prompt regions the loop
  may edit (e.g. detail/ornament clauses), and it may **not** edit the rubric or the brief; every render
  is retained for a human morning spot-check (the judge is fitness, not ground truth).

**Out:**
- The **fair fixed 3×3 matrix** and the quality-per-token writeup — that is E-06; E-08 *feeds* it the
  promoted archetypes, it does not replace it.
- **Pairwise / Elo** metric — the categorical judge can drive `competent → strong` autonomously, but
  `strong → exceptional` needs finer resolution (P15). Until that lands the loop's ceiling is *strong*;
  the pairwise metric is a sibling instrument (E-04 extension), a dependency for a later E-08 iteration,
  not in this scope.
- Model sweep (E-07); the rating UI (E-05).

## Candidate stories

- **Experiment manifest + one-variable trial spec** (queue format; hypothesis/variable/predicted-dim/
  shape; loader that `run.mjs` consumes).
- **Champion record + promotion/robustness gate** (A/B both rounds; margin + unanimity + no-regression).
- **Cost-shaped two-tier judging** (screen→finalize; frozen design-doc reuse; round-0-only mode).
- **Autonomous loop driver** (serial, wake-on-completion, failure-tolerant, budget cap; lisa-loop /
  `ScheduleWakeup` driver — to be confirmed; design is driver-agnostic).
- **Self-consolidation agent** (attempt-log append, principle promote/scope, champion update, morning
  brief).
- **Safety harness** (branch isolation, prompt-edit allowlist, rubric/brief immutability, render
  retention).
- **Inaugural overnight run** — the first execution: a *wide* one-variable sweep across the open levers
  (detail articulation, P12/P13 generalization on 2–3 new references, `--effort` A/B, the P11 constraint
  audit as the deterministic slot 0), proving the loop end-to-end and banking real findings.

## Definition of done

- The loop runs **unattended overnight**, executing N one-variable experiments serially within a wall-
  clock/trial budget, with **zero unrecoverable halts** (failures skipped and logged).
- It maintains a **champion** across the run by the robustness gate, never promoting on noise.
- By morning it has: (a) appended attributable results to the attempt log, (b) promoted or scoped the
  principles it tested, (c) updated the champion record, (d) produced a morning brief + retained renders
  for human review — all reproducible from the trial records and the manifest.

## Notes / open questions

- **Reward-hacking the judge** is the central risk: the loop could climb toward builds the judge likes
  but a human would not. Mitigations: judge immutability, render retention for morning spot-check, and a
  periodic human-vs-judge agreement check. If they diverge, the metric — not the loop — is the bug.
- **One variable per trial** is the load-bearing discipline; the manifest format must make multi-variable
  trials hard to express by accident (autonomous loops thrash otherwise).
- **Relationship to E-03/E-06:** E-03 owns the trial runner + the three *baseline* archetypes; E-08 owns
  the *autonomous optimization* over prompt variants on top of it; E-06 owns the *fair comparison* of the
  results. Promoted champions from E-08 are candidate archetypes for E-06.
- **Driver:** lisa loop vs a runner + `ScheduleWakeup` self-pacing is an implementation detail to settle
  in the driver story; the manifest/gate/consolidation design does not depend on the choice.
