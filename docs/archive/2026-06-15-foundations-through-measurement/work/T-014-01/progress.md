# Progress — T-014-01: consolidate-overnight-run

Live tracker for the Implement phase (the journal edits). Commits left to Lisa (repo convention).

## Steps (from plan.md)

| # | Step | State |
|---|------|-------|
| 1 | Re-read exact anchors for the 3 edit sites | ✅ banner insert pt + P12/P13/P14/P15 tails + file tail located, each unique |
| 2 | Edit 1 — `🌅 Morning brief` banner | ✅ inserted before the `⚠️ Measured correction (v1)` banner; `grep` → 1 |
| 3 | Edit 2a — P12 chain verdict (PROMOTE) | ✅ |
| 4 | Edit 2b — P13 chain verdict (PROMOTE) | ✅ |
| 5 | Edit 2c — P14 chain verdict (SCOPE) | ✅ |
| 6 | Edit 2d — P15 chain verdict (REINFORCE + levers DISCARDED) | ✅ `grep "Chain verdict (T-014-01)"` → 4 verdicts + 1 cross-ref = 5 |
| 7 | Edit 3 — `### Consolidation · 2026-06-05` tail entry | ✅ `grep` → 1 |
| 8 | `npm test` | ✅ 133/133 |
| 9 | Reproducibility sweep — cited run IDs resolve | ✅ all 12 (008/014/016/017/019/020/021/022/023/024/025/026) have `summary.json` |
| 10 | `git diff --stat` scope | ✅ `design-learnings.md` only tracked file changed; `judge.baml`/`task.mjs` untouched |
| 11 | progress.md | ✅ this file |
| 12 | review.md | ⏳ next |

## Deviation from plan (material — affected the verdict)

**The two knob A/Bs (persona S-013, effort S-009) COMPLETED *during* this consolidation.** When Research
ran, both were half-done: persona had only the OFF arm (023); effort had only DEFAULT (024). The T-013
review.md (written earlier, when run 023 was still *stalled*) recorded the persona experiment as unfinished
and predicted the ON arm would be "run 024" — both stale.

Actual sequence observed this session:
- A prior session's background job finished the **persona-ON** arm → **run 025** (render strong 3/3,
  `detail=strong`). The OFF arm (023) had also completed (render strong 3/3, `detail=competent`).
- A live process was mid-pipeline running the **effort-HIGH** arm → **run 026** (`--effort high`). I **waited
  ~13 min** for it to finish rather than record effort as "never ran" (which would have been false). It
  landed: render strong 3/3, `detail=strong`; +31% wall-clock, +$0.43 vs DEFAULT (024).

**Consequence for the consolidation:** the design.md / structure.md drafts (authored at Research-time) framed
both knobs as "INCOMPLETE → inconclusive-because-unfinished." The terminal reality is **complete-but-no-
credible-effect**: each knob flipped *only* `detail` competent→strong — a single-dimension single-step move on
the P15 boundary-noisy dimension, with both treatment arms emitting more output. Two independent knobs
producing the identical flip = the noise signature, not two levers. The journal records this true terminal
verdict (neither adopted), not the stale "incomplete" framing. This is the honest finding the ticket's
honesty AC demands — and it is *stronger* evidence than "incomplete" would have been (it rules the knobs out
on the merits, lean-noise, rather than leaving them open).

**No new trials were run by me.** Runs 025/026 were launched by prior sessions/background jobs (the S-013 /
S-009 tickets' own Implement work); I only waited for them to finish and read their `summary.json`. No
re-judge was performed (no champion tie). Champion unchanged.

## Files touched

- `docs/knowledge/design-learnings.md` — +473/−4 vs HEAD (the bulk is the night's prior uncommitted journal
  entries already in the tree; **my T-014-01 additions are the 🌅 banner + 4 chain verdicts + the
  consolidation entry**, ~70 lines).
- `docs/active/work/T-014-01/{research,design,structure,plan,progress,review}.md` — work artifacts.
- Nothing else. Rubric/brief frozen and untouched.
