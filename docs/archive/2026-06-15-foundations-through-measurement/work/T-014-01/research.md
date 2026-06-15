# Research — T-014-01: consolidate-overnight-run

Descriptive map of the night's experiment chain and the journal it must distill. No solutions here —
just what exists, where, and what state it is in. This is **not a trial**; it is a synthesis pass over
the run dirs and `design-learnings.md`.

## What this ticket is

E-08 / S-014 / spec §9, §11. Terminal link, gated on `T-009-01` so it runs after every experiment in the
overnight chain. The job (from the ticket): read each attempt-log entry the night added; for each
principle tested, decide **promote / scope / discard** with a one-line reason grounded in the entries;
update the **champion note**; write the **morning brief**. No new trials (one optional re-judge to break a
champion tie — not needed here, see below). No rubric/brief edits. Be honest about falsified levers.

## The chain (dependency order, all `status: done`)

Reconstructed from `depends_on` across `docs/active/tickets/`:

```
S-006 detail-lever-A ──▶ S-010 detail-lever-B ──▶ S-007 Hōryū-ji ──▶ S-008 Sainte-Chapelle
   ──▶ S-011 Arc ──▶ S-012 mausoleum ──▶ S-013 persona A/B ──▶ S-009 effort A/B ──▶ S-014 (this)
```

Two **tuning** experiments (detail levers), four **generalization** runs (new references), two **knob**
A/Bs (persona, effort), then consolidation.

## Run inventory (`benchmarks/temple-facade/runs/`)

| run | ticket | what | overall (round-0 / render) | state |
|-----|--------|------|----------------------------|-------|
| 016 | S-006 | detail lever A: relief panels | strong 3/3; **detail competent** | scored; **not committed** |
| 017 | S-010 | detail lever B: texture grain | render strong; **proportion strong→competent**, detail competent | scored; **reverted** |
| 019 | S-007 | Hōryū-ji (pagoda, timber) | strong 3/3 / strong 3/3 | journaled |
| 020 | S-008 | Sainte-Chapelle (pale Gothic) | **strong 3/3 / competent** (P14 regress) | journaled |
| 021 | S-011 | Arc de Triomphe (single arch) | strong / strong 3/3; **detail competent→strong** | journaled |
| 022 | S-012 | Sun Yat-sen mausoleum (two-tone) | strong 3/3 / strong 3/3 | journaled |
| 023 | S-013 | persona A/B **OFF** | strong 3/3 (render) | **complete** |
| 024 | S-009 | effort A/B **DEFAULT** | strong 3/3 (render) | **complete** |
| 025 | S-013 | persona A/B **ON** | — | **INCOMPLETE: round-0 built, never rendered/scored, no `summary.json`** |
| (—) | S-009 | effort A/B **HIGH** | — | **NEVER RUN** |

Scores verified directly from each `summary.json`. Runs 019–022 already have full attempt-log entries in
`design-learnings.md`. Runs 016/017 are documented only *inline* inside the run-019 entry's
"inherited-champion note" — no dedicated entries. Runs 023/024/025 are **not journaled at all**.

## State of the journal (`docs/knowledge/design-learnings.md`)

- **Principles (distilled)** — top banners (🏆 current state, ⚠️ detail-noise caveat, 🎯 rubric) + P1–P15.
  P11–P15 are the load-bearing reference-grounding principles. P12/P13/P14/P15 are the ones the night
  stress-tested. Each already carries scope text through run 022.
- **Attempt log (newest last)** — entries through run 022. Missing: 016, 017, 023, 024, 025.
- No champion-config block exists as a standalone artifact; the champion is described prose-style inside the
  run-019 "inherited-champion note" (= committed HEAD, the 015 "NO LARGE FLAT FIELDS" menu).

## The principles under test this chain

- **P12** (color from brief, not the reference): tested by all four generalization runs (019/020/021/022).
- **P13** (a facade is ONE connected plane; borrow rhythm, not 3-D standalone parts): same four runs.
- **P14** (the 2nd pass is double-edged; judge both rounds): same four runs + the detail-lever runs.
- **P15** (detail is the lone holdout; flat-field whack-a-mole): the two detail levers + every gen run.
- **Two knobs** (persona `--system-prompt`, `--effort`): S-013 / S-009 — *incompletely* tested.

## Key facts established by reading the sources

1. **No lever promoted this chain.** Both detail experiments were non-promotions (016 detail stayed
   competent; 017 regressed proportion). Champion is unchanged from the committed 015 menu.
2. **The two knob A/Bs are both half-done.** Each has its *control* arm complete and landing at the
   champion's expected strong 3/3 (023 OFF, 024 DEFAULT), but the *treatment* arm is missing (025 ON never
   finished; effort HIGH never launched). Neither can yield a verdict — both are **inconclusive**.
3. **Wiring did land** (uncommitted, in the working tree): `--system-prompt`/`system` param (T-013) and
   `--effort` (T-009) are both plumbed through `src/sdk-binding.mjs` + `run.mjs`, additive and inert by
   default (`if (system)` / `if (effort)` guards). `git diff --stat HEAD` shows the two files modified.
4. **The T-013 review.md is stale on one point:** it was written when run 023 was *stalled* at the
   design-doc stage and predicted the ON arm would be "run 024." In reality 023 *completed* as the OFF arm
   (strong 3/3), 024 became the *effort* DEFAULT arm, and 025 became the persona ON arm (which then did not
   finish). The consolidation must use the **actual** run states, not that review's predictions.
5. **`npm test` is 133/133 green** right now (verified this session).

## Constraints / boundaries

- **Immutable:** `baml_src/judge.baml` (rubric), `benchmarks/temple-facade/task.mjs` (brief). Do not edit.
- **No new trials.** The one permitted re-judge is only to break a *champion tie*; there is no tie (no
  promotion), so no re-judge is warranted.
- The only file this ticket *changes* is `docs/knowledge/design-learnings.md` (Principles verdicts +
  champion note + morning brief). Everything else is read-only synthesis.
- Honesty AC: the two unfinished knob experiments and the two failed detail levers are **real findings** and
  must be recorded as such, not smoothed into a "successful night" narrative.

## Open question this research surfaces (for Design)

Where do the champion note and morning brief belong — a new top banner (read-first) vs a dated tail entry
(the log is "newest last")? And: do the un-journaled runs (016/017/023/024/025) need their own entries, or
does a single consolidation entry that cites them suffice for "reproducible from the cited run IDs"?
