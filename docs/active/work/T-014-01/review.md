# Review — T-014-01: consolidate-overnight-run

**Handoff for human review. Lisa detects this file and handles phase/status transitions — do not edit the
ticket frontmatter.**

> **Headline: consolidation complete; champion UNCHANGED; the night was a *confirmation* night, not a
> tuning night.** P12/P13 generalized cleanly to four new references; detail did not move; three levers were
> ruled out (relief panels, texture grain, and — on noisy n=1 — the persona/effort knobs). All four
> acceptance criteria met. `npm test` 133/133 green. The only file changed is the journal; no source, no
> rubric, no brief.

## What was done

This is a **synthesis ticket, not a trial** — a distillation of the overnight chain (S-006…S-009) into the
journal's load-bearing knowledge. No new trials were run (the one re-judge the ticket permits is only for a
champion tie; there was no promotion, so no tie). The work is three additive edits to
`docs/knowledge/design-learnings.md`:

1. **`🌅 Morning brief` banner** at the top of *Principles (distilled)* — champion config + categorical band,
   what moved / what didn't, renders to spot-check, and the single recommended next experiment.
2. **Four `Chain verdict (T-014-01)` lines**, one appended to each tested principle:
   - **P12** (color from brief) → **PROMOTE / reinforce** (4 off-domain confirmations; only the
     fully-polychrome reference remains untested).
   - **P13** (one connected plane) → **PROMOTE / reinforce** (held across pagoda/Gothic/single-arch/stacked-
     eaves; detachment hazard un-exercised on 021/022).
   - **P14** (2nd-pass double-edge) → **SCOPE** (reference-dependent coin-flip; "keep the better round" fix
     now strongly indicated and symmetric).
   - **P15** (detail holdout) → **REINFORCED; both detail levers DISCARDED**.
3. **A dated `### Consolidation · 2026-06-05` attempt-log entry** capturing the runs with no standalone entry
   (016/017 detail levers; 023/024/025/026 knob A/Bs), with full A/B tables and the reproducibility pointer.

## The night's findings (what the verdicts rest on)

- **Detail levers — both DISCARDED (the hard negative).** S-006 relief panels (run 016): `detail` stayed
  competent. S-010 texture grain (run 017): `detail` stayed competent **and** `proportion` regressed
  strong→competent. Neither met the pre-registered robust-lift bar (T-006/T-010); champion unchanged.
- **Generalization (already journaled in full; verdicts distilled here).** 019 Hōryū-ji, 020 Sainte-Chapelle,
  021 Arc, 022 mausoleum — P12 held all four (4th–7th confirmations), P13 held all four, P14 mixed (regressed
  on 020, held/lifted on 019/021/022). Detail stayed competent everywhere (021's render "lift" is whack-a-mole
  + P15 boundary noise).
- **Knob A/Bs — both COMPLETED during this session, both NO credible effect.** Persona-ON (025) and
  effort-HIGH (026) each flipped **only `detail` competent→strong** vs their controls (023/024), nothing else
  moving, overall strong 3/3 on both arms. Two independent knobs producing the *identical* single-dimension
  flip on the one P15 boundary-noisy dimension — with both treatment arms emitting more output — is the
  signature of generation noise, not two levers. **Neither adopted.** Effort-HIGH additionally cost +31%
  wall-clock (+223s) and +$0.43 for that noisy flip.

## Champion config (recorded for the next chain — AC #2)

**Unchanged:** committed HEAD, `vRefRevise-designdoc`, the 015 "NO LARGE FLAT FIELDS" detail menu.
Categorical band (median-of-3): overall **strong (3/3)** · proportion **strong** · color **strong** ·
fidelity **strong** · **detail competent** (lone holdout). Exemplar render run 014 (Taj); re-confirmed
off-domain on 019/021/022.

## Files

**Modified (tracked):**
- `docs/knowledge/design-learnings.md` — +473/−4 vs HEAD. **Most of that delta is the night's prior
  uncommitted journal entries (runs 019–022) already in the working tree before this ticket**; the
  T-014-01-authored additions are the `🌅` banner + 4 chain verdicts + the consolidation entry (~70 lines).

**Created (work artifacts, `docs/active/work/T-014-01/`):**
- `research.md`, `design.md`, `structure.md`, `plan.md`, `progress.md`, `review.md` — RDSPI artifacts.

**Deleted:** none. **Run dirs / `summary.json` / rubric (`judge.baml`) / brief (`task.mjs`):** untouched —
verified by `git diff --stat HEAD`.

## Test coverage

- `npm test` → **133/133 pass** (verified post-edit). This ticket changes documentation only; no source path
  is touched, so the suite is a regression guard, not a positive test of new behavior. No code coverage gap
  is introduced by this ticket.
- **Reproducibility (AC #4):** every run ID cited in the brief/entry (008/014/016/017/019/020/021/022/023/
  024/025/026) resolves to a real `summary.json`; all scores in the consolidation entry are read directly
  from those files. Verified by an explicit resolvability sweep.
- **Immutability (AC #4):** `git diff --stat HEAD` confirms `design-learnings.md` is the only tracked file
  changed; `baml_src/judge.baml` and `benchmarks/temple-facade/task.mjs` show no diff.

## Open concerns / TODOs

1. **The knob A/Bs are honest at n=1 but not statistically settled.** Both knobs flipped only `detail`, the
   P15-noisy dimension. The verdict (no credible effect, lean noise, not adopted) is the correct *pre-
   registered* call, but a **confirmer with N>1 per arm** is the only way to fully separate a small real
   effect from noise. Recorded as "lean noise / confirmer needed," not as a hard "no effect." If anyone wants
   to chase it, the cheapest design is round-0 attribution on the four existing renders before spending on new
   generations.
2. **The persona/effort wiring is uncommitted in the working tree** (`src/sdk-binding.mjs`, `run.mjs`). It is
   additive and inert by default (`if (system)` / `if (effort)` guards), so it does not alter the champion —
   but it is real, untested-by-unit-test code awaiting Lisa's commit decision. Flagged in the consolidation
   entry, not changed by this ticket.
3. **The T-013 review.md is now stale** on the run-numbering (it predicted the persona-ON arm would be "run
   024" while run 023 was stalled; reality: 023=OFF completed, 024=effort-DEFAULT, 025=persona-ON). This
   consolidation supersedes it with the actual terminal state; the T-013 review is left as-is (historical
   record) but should not be read as the final word on that experiment.
4. **One un-fixed identity hazard carried forward (not in scope here):** the run-019 cross-form finial
   (a Latin-cross crown on an East-Asian massing). Filed in the 019 entry as a *crowning-motif fidelity*
   candidate lever; not actioned — noted so it isn't lost.

## Critical issues to surface for human review

- **No champion change, by design.** If a reviewer expected the night to *advance* the champion, the honest
  answer is it did not — every lever tested was a non-promotion or a noisy null. The value delivered is
  *confirmation* (P12/P13 generalize) + *three ruled-out dead ends*, which correctly focuses the next move on
  the one real gap (detail).
- **The single recommended next experiment is a whole-facade fenced ornament pass** (P15 cure) — a detail-only
  revision auditing every plane wider than ~6 blocks. This is the consolidation's main forward signal; the
  morning-brief banner states it. Cheap follow-ons: the "judge-both-rounds-keep-the-better" P14 fix, and an
  N>1 confirmer for the knobs if their detail flip is judged worth chasing.
- **Honesty check (the ticket's explicit AC):** the two failed detail levers and the two no-credible-effect
  knobs are recorded as such, with scores, not smoothed into a success narrative. The P14 020 regression and
  the whack-a-mole nature of 021's detail "lift" are likewise stated plainly.

## Rollback

`git checkout HEAD -- docs/knowledge/design-learnings.md` reverts the journal — but note that also discards
the night's prior uncommitted entries (runs 019–022), so a surgical revert would instead remove only the
`🌅` banner, the 4 `Chain verdict (T-014-01)` lines, and the `### Consolidation · 2026-06-05` entry. The work
artifacts under `docs/active/work/T-014-01/` are durable evidence of the synthesis.
