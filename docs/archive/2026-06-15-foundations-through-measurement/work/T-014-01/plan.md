# Plan — T-014-01: consolidate-overnight-run

Ordered, independently-verifiable steps. The "implementation" is editing one markdown file
(`design-learnings.md`); the "tests" are grep-for-tag, `npm test`, and run-ID resolvability.

## Testing strategy

- **No unit tests** — this ticket changes documentation, not source. The relevant regression guard is that
  `npm test` stays **133/133** (it must, since no source file changes).
- **Edit-landed checks:** after each edit, grep for the inserted tag string to confirm it is present and
  unique. Six insertions total (1 banner + 4 verdicts + 1 entry).
- **Reproducibility check (AC #4):** every run ID cited in the brief/entry (014, 016, 017, 019, 020, 021,
  022, 023, 024, 025) must resolve to a real `benchmarks/temple-facade/runs/<id>-*/summary.json`. The two
  "missing" arms (effort HIGH, persona ON-scored) are cited *as absent*, which is the honest record.
- **Immutability check:** `git diff --stat` after edits shows `design-learnings.md` as the **only** repo file
  changed by this ticket (plus the untracked work-dir artifacts); `judge.baml` and `task.mjs` untouched.

## Steps

| # | Step | Verify |
|---|------|--------|
| 1 | **Re-read the exact anchor lines** for the three edit sites in `design-learnings.md` (banner insert point; the four principle tails; the file tail). | Anchors located, each unique. |
| 2 | **Edit 1 — insert the `🌅 Morning brief` banner** at the top of the current-state banner stack (before `⚠️ Measured correction (v1)`). | `grep "🌅 Morning brief"` → 1 hit. |
| 3 | **Edit 2a — P12 chain verdict** line appended. | `grep "Chain verdict (T-014-01)"` count rises to 1. |
| 4 | **Edit 2b — P13 chain verdict** line appended. | count → 2. |
| 5 | **Edit 2c — P14 chain verdict** line appended. | count → 3. |
| 6 | **Edit 2d — P15 chain verdict** line appended. | count → 4. |
| 7 | **Edit 3 — append the `### Consolidation · 2026-06-05` tail entry** (champion block, discarded detail levers, gen-run pointers, inconclusive knobs, why-no-standalone-entries, net+next). | `grep "### Consolidation ·"` → 1 hit. |
| 8 | **`npm test`** | 133/133 green. |
| 9 | **Reproducibility sweep** — confirm each cited run ID has a `summary.json` (and that 025 has none / no effort-HIGH dir exists, matching the "incomplete" claims). | All present-as-claimed. |
| 10 | **`git diff --stat`** — `design-learnings.md` is the only tracked file changed by this ticket. | Confirmed. |
| 11 | **Write `progress.md`** (live tracker of edits 1–3 + deviations). | File exists. |
| 12 | **Write `review.md`** (handoff: what changed, coverage, open concerns, critical issues). | File exists. |

## Atomicity / commit notes

- Per the repo convention observed across T-006…T-013 (work artifacts and run dirs are left uncommitted in
  the shared-branch tree; **Lisa commits**), this ticket does **not** self-commit. The journal edit + work
  artifacts are left in the tree for Lisa.
- Each edit (2–7) is independently revertable; if any anchor fails to match, fall back to a wider unique
  context window rather than a fuzzy match.

## Risks & mitigations

- **Anchor collision** (a tail sentence not unique): mitigated by including enough trailing context in the
  `old_string`; verified unique in Structure.
- **Over-writing prior scores:** mitigated by the additive-only invariant — every edit *appends*, none
  rewrites an existing score string. Step 10's diff review confirms only additions.
- **Dishonest smoothing:** explicitly guarded — the discarded levers and inconclusive knobs each get an
  unambiguous negative label (DISCARDED / INCONCLUSIVE), per the ticket's honesty AC.
- **Scope creep into re-running trials:** out of bounds; the champion is unchanged so no re-judge/tie-break
  is performed.

## Definition of done (maps to AC)

- AC #1 (principles marked promote/scope/discard, one-line grounded reason): Edits 2a–2d. ✔ when 4 verdicts.
- AC #2 (champion config recorded with categorical scores): banner block (Edit 1) + tail entry (Edit 3). ✔
- AC #3 (morning brief: moved / didn't / renders to spot-check / single next experiment): banner (Edit 1). ✔
- AC #4 (no rubric/brief edit; `npm test` green; reproducible from cited run IDs): Steps 8–10. ✔
