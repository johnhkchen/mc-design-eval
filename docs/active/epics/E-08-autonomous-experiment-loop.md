---
id: E-08
title: autonomous-experiment-loop
type: epic
status: open
priority: high
depends_on: [E-03, E-04]
spec: "§7, §9, §11"
stories: [S-006, S-007, S-008, S-009]
---

## Goal

Turn the manual `run.mjs --approach` → hand-judge → hand-journal cycle into a **repeatable overnight
instrument** by riding the **lisa loop**: a sequential chain of *experiment* stories — **one
run-the-test ticket per story**, gated so they execute one at a time — each of which forms a hypothesis,
edits the prompts to test it, runs the trial, judges it with the categorical rubric (E-04), and records
the **diff + per-dimension result** into `docs/knowledge/design-learnings.md`. The journal is the record;
lisa is the driver; the chain is the loop.

## Why it matters

The Phase-1 research question is *which techniques achieve each jump in quality* (§1, §7). We have been
answering it **by hand** — every reference-grounding / craft-color-split / one-plane finding was a manual
run, a manual render read, and a manual journal edit. That does not scale and is not reproducible. The
categorical judge (E-04) is now a trustworthy-enough arbiter to close the loop: form a hypothesis →
change the prompt → judge → keep it if it robustly wins → **record the diff and why**. This epic is the
engine that *discovers* improved techniques; **E-06 is the fair fixed matrix that then compares them**.
E-08 produces the techniques; E-06 measures them.

## How it runs (the mechanism)

- **Driver = the lisa loop.** Each experiment is a story with a single **run-the-test ticket**. lisa runs
  the full six-phase RDSPI cycle on the ticket: Research/Design = form the hypothesis and decide the
  exact prompt change; Implement = make the edit, run the trial(s), judge, and append the journal entry;
  Review = summarize. No custom loop driver or scheduler is built.
- **Sequencing = the DAG.** All run-the-test tickets are **gated sequentially** (`depends_on` chains
  ticket N on ticket N−1), so despite `max_threads = 2` the trials run **one at a time** — matching the
  serial ~28-min trial cost and the rate-limit serialization (P8). Each ticket inherits the champion
  state (committed prompts + journal) left by the one before it, so the chain hill-climbs.
- **Record = the journal, with diffs.** Every ticket appends an attempt-log entry capturing the **prompt
  diff it made**, the **A/B categorical scores** (round-0 vs post-revision, both judged), and a verdict
  (promote / scope / discard). The committed prompt state + the journal entry together *are* the champion
  record — no separate datastore.

## Scope

**In:**
- A documented **run-the-test ticket convention** every experiment story follows: A/B-judge **both
  rounds** (P14), use the **categorical rubric** as the arbiter, and append a journal entry with the
  **diff + per-dimension result + verdict**. Champion = run 014 to start.
- **Powerful experimentation, accountable by record.** A ticket may make a *substantive* change (not a
  fenced one-clause edit) — restructure a prompt, add a pass, swap a lever — because the safeguard is
  **traceability, not restriction**: the diff is recorded in the journal and committed, so any change is
  attributable and revertible. The rubric and the brief stay immutable (they are the measuring stick).
- **Cost-shaping so the night goes wide.** Prefer the cheapest trial *shape* that answers the question:
  `round-0-only` when the revision isn't under test, a frozen design-doc reused across build-variant
  trials, and a 1-sample screen before the full 3-sample judge. Target ~2 experiments/hour.
- The **inaugural chain** (stories S-006…S-009): a detail-articulation lever, generalization on two new
  references (Hōryū-ji, Sainte-Chapelle), and an `--effort` A/B.

**Out:**
- **Pairwise / Elo metric — explicitly not pursued.** Elo needs a pool of judges (a crowd) we will not
  have; we are not putting builds in front of the public. The **categorical rubric is the arbiter**, full
  stop. The `strong → exceptional` jump, if it needs finer resolution, will be sought another way (richer
  rubric anchors, per-dimension sub-criteria) — not Elo.
- The **fair fixed 3×3 matrix** + quality-per-token writeup — that is E-06; E-08 *feeds* it the promoted
  techniques, it does not replace it.
- Model sweep (E-07); the rating UI (E-05).

## Inaugural chain (sequential — each is one run-the-test ticket)

```
S-006 (detail lever) ─> S-007 (Hōryū-ji) ─> S-008 (Sainte-Chapelle) ─> S-009 (--effort A/B)
   T-006-01          ─>    T-007-01      ─>      T-008-01           ─>      T-009-01
```

- **S-006 — detail-articulation lever** (champion = Taj 014): crack the one lagging dimension. Hypothesis:
  a dedicated detail treatment lifts `detail` competent→strong without regressing the rest. May promote a
  new champion that the rest of the chain inherits.
- **S-007 — Hōryū-ji generalization** (`references/horyu_ji.JPG`): the hardest P13 test — a vertical,
  multi-tier **wooden pagoda**, massing utterly unlike the Taj. Do "borrow rhythm, not standalone parts"
  and the craft/color split hold when the reference *is* a tower and the palette is dark timber?
- **S-008 — Sainte-Chapelle generalization** (`references/St_Chapelle.png`): a Gothic, **polychrome
  stained-glass** front where the reference's color *agrees* with the brief. Does the craft/color split
  become a near-no-op (P12 is reference-conditional), or still help?
- **S-009 — `--effort` A/B** (champion): the untested deliberation knob on `claude -p` — does higher
  reasoning effort buy detail/proportion for free? Cheapest lever, runs last.

## Definition of done

- The chain runs **unattended overnight** under the lisa loop, executing each gated run-the-test ticket in
  turn with **zero unrecoverable halts** (a narrated/crashed/invalid trial is logged and the ticket still
  closes with its finding).
- Every experiment leaves a **journal attempt-log entry** with its prompt diff, A/B categorical scores,
  and verdict — reproducible from the committed state.
- The champion is carried forward through the chain by committed prompts + journal, never promoted on
  within-band judge noise (require a full-category lift, no regression on other dimensions).
- A morning human spot-check of the retained renders confirms the judge's verdicts did not drift from
  human taste (the judge is fitness, not ground truth).

## Notes

- **Reward-hacking the judge** is the residual risk now that Elo is off the table: the loop could climb
  toward builds the rubric likes but a human would not. Mitigations: rubric/brief immutability, renders
  retained for the morning spot-check, and re-reading the judge's *notes* (not just the category) for
  signs it is rewarding the wrong thing.
- **One hypothesis per ticket** is the load-bearing discipline; a ticket that changes three things at once
  teaches nothing. The run-the-test convention should make that explicit.
- **Relationship to E-03/E-06:** E-03 owns the trial runner + baseline archetypes; E-08 is the autonomous
  optimization over prompt variants on top of it; E-06 is the fair comparison of the results. Promoted
  champions from E-08 are candidate archetypes for E-06.
