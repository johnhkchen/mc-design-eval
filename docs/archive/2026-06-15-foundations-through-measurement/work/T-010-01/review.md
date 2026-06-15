# Review — T-010-01: detail lever B (contrast-preserving block-texture grain)

Handoff for a human reviewer. Summarizes the change, the artifacts, the test/verification status, and
— importantly — what is **not yet done** because the live metered trial is still running.

## TL;DR / status

- **Design + code change: complete and clean.** One prompt-diff in the revision seam swaps the detail
  *mechanism* from relief geometry to **patterned, contrast-preserving block-texture grain** — the
  distinct, corpus-endorsed mechanism S-006 did **not** use. `npm test` green (133/133).
- **Experimental verdict: NOT yet reached.** The generation-1 live run (018) was still in stage 2 of 3
  at the time this review was written; no `render.png`/`summary.json` exists yet, so no scores, no
  generation-2 run, no journal attempt-log entry, and no promote/discard decision have been made.
- **Several Acceptance Criteria remain open** (see "Open concerns / outstanding AC"). This ticket is
  code-complete but **experiment-incomplete**; a follow-up pass is required to close it honestly.

## What changed (the hypothesis)

`detail` is the lone Taj dimension stuck at *competent* (P15). S-006 (T-006-01) attacked it with a
**relief-geometry panel grammar** and it did **not** lift detail — run 016 came back `detail=competent`
with the judge calling the panels "drawn-on outlines … little actual relief depth" (the model nominally
follows a recess recipe but flattens it at flat Z). T-010-01 tries the orthogonal, corpus-endorsed
mechanism: **surface-texture grain** that reads as detail *without* needing the renderer to register
depth — designed around the v5 color crash (P9) that uniform grain caused.

**Hypothesis:** patterned variant-block grain (same hue family, arranged as coursing/quoining/banding)
registers as `detail` at flat Z, *provided* it stays contrast-preserving so it never collapses the
dominant/supporting/accent hierarchy.

## Files modified

- **`benchmarks/temple-facade/run.mjs`** — the only source edit. In `composeRefRevisionPrompt` (~line
  408), the single `Detail —` bullet was replaced with two bullets:
  1. *Detail via TEXTURE GRAIN (patterned)* — break every flat field (flanks, spandrels, plinth, window
     insets) with a **deliberate, patterned** grain from **texture variants of the field's own material
     family** (smooth/cut/chiselled courses, brick-vs-cut banding, quoined/checker motif, stair/slab
     string-grain); regular & legible, never random speckle; no plane >~6 left as one uniform block;
     `fill`/`box`/`line` runs; variants declared in `palette.manifest`.
  2. *Grain changes TEXTURE not HUE (anti-v5 color guard, hard)* — same color family per field; never
     lower contrast or smear toward monochrome; dominant stays dominant; **accents un-grained, single &
     saturated**; drop any grain that washes the palette out.
  - `git diff HEAD` = **+14 / −4**, confined to those two bullets. The one-plane / proportion /
    relief-depth / color-restore bullets are intact and ahead — exactly the detail *mechanism* changed.

### Baseline note (matters for attribution)
HEAD's committed champion is the **original 015 menu** ("NO LARGE FLAT FIELDS … recessed panels,
pilaster strips, string-courses, banding…"). S-006's recessed-panel grammar was an **uncommitted,
un-promoted** working-tree edit (gen-1 run 016 = `detail=competent`; gen-2 run 017 never completed). My
edit replaced that working-tree text, so the diff **vs the committed champion is clean: menu → texture
grain** — a single-mechanism A/B from the same 015 baseline S-006 was measured against. S-006's panel
grammar is therefore correctly retired (it never earned promotion).

## Files created (work artifacts — not shipped code)

- `docs/active/work/T-010-01/research.md` — seams, S-006's failed result, the corpus signal endorsing
  texture as the deliberate variable, constraints.
- `docs/active/work/T-010-01/design.md` — options A/B/C; chose C (texture grain) with rationale and the
  v5-crash risk register.
- `docs/active/work/T-010-01/structure.md` — file-level blueprint.
- `docs/active/work/T-010-01/plan.md` — 11 ordered steps; color as a co-equal gate.
- `docs/active/work/T-010-01/progress.md` — implementation tracker + A/B scoreboard (partly empty,
  pending run results).
- `docs/active/work/T-010-01/judge-round0.mjs` — copy of T-006-01's helper (scores any PNG via
  `judgeRender` median-of-3); used to judge round-0 once the run lands.
- `docs/active/work/T-010-01/review.md` — this file.

## Files NOT touched (frozen, as required)

`task.mjs` (brief), `judge.baml` / `judge.mjs` (rubric), `baml_src/facade.baml` (unused by this approach
— would no-op), the AJV schema, `src/config.mjs` (model pin), and `composeHighResBuildPrompt` (round-0
kept as the within-run control).

## Files deleted

None.

## Test coverage

- **Automated (`npm test`): 133 pass / 0 fail.** This is the only automated gate and it only guards that
  the harness still validates artifacts — a prompt-string edit has no unit test of its own and touches
  no schema/contract. No `baml:gen` needed (no `.baml` changed). Adequate for the code change; it does
  **not** and cannot evaluate the hypothesis.
- **Experimental (the real test) — INCOMPLETE.** The hypothesis is verified by the frozen categorical
  judge (median-of-3) across 4 renders (2 generations × {round-0, render}), plus the 015-baseline
  comparison. At review time only **run 018 was in flight (stage 2 of 3)**; zero of those judgements
  exist yet. The A/B scoreboard in `progress.md` is therefore unfilled below the baseline rows.

## Open concerns / outstanding Acceptance Criteria

The following AC items are **not yet satisfied** and must be completed once run 018 finishes:

1. **Both rounds scored, 2 generations (AC #2, #5).** Judge `render.png` (auto) and `round-0.png`
   (helper) for run 018; then run generation 2 (019) and judge both rounds. Fill the `progress.md`
   scoreboard. Robustness gate: do **not** credit a single noisy `detail=strong`.
2. **Promotion decision (AC #4).** Apply the rule honestly: promote **iff** `detail` rises a full
   category to *strong* with **no regression on proportion/color/fidelity** (color is the v5 tripwire)
   and overall ≥ *strong*, robustly. Else revert and record the negative result.
3. **Revert target if not promoting (AC #4).** Restore the bullet to the **015 menu** (HEAD), *not* to
   S-006's panel grammar — S-006 did not promote, so the menu is the correct champion to leave on disk.
4. **Journal attempt-log entry (AC #3) — NOT YET WRITTEN.** Append a dated entry to
   `docs/knowledge/design-learnings.md` with: the prompt diff, the per-generation A/B scores, the
   015-baseline texture comparison, judge notes, the verdict, and — the headline AC — the **explicit
   S-006 (relief panels) vs S-010 (texture grain) mechanism comparison** (which articulates better and
   why). Refine P15 / the measurement caveat only as the result warrants.

## Critical issues to surface for human review

- **C1 — Verdict pending; ticket is experiment-incomplete.** The substantive deliverable (a judged A/B
  and a recorded verdict + journal entry) does not exist yet because the metered runs are long
  (~15–18 min each) and run 018 had not produced a render at review time. Treat this review as a
  checkpoint, not a closeout. The remaining work is steps 5–11 of `plan.md`.
- **C2 — Two concurrent `run.mjs` processes observed.** At review time there were **two** live
  `vRefRevise-designdoc --ref taj_mahal.png` node processes (PIDs ~62798 with no `--note`, and ~73952 =
  this ticket's launch). Both read the *current* working-tree prompt, so both are testing the texture
  lever — but they auto-number run dirs independently and may collide or double-spend. A human should
  confirm only the intended run(s) survive and that run 018 (and any sibling) correspond to this lever.
  The stray `--note`-less process may be a leftover T-006-01 background launch that never exited.
- **C3 — Color is the make-or-break dimension here, unlike S-006.** S-006's relief lever could not crash
  color; this texture lever can (v5 precedent: 4→2.67). The anti-v5 guard is in the prompt, but the
  promotion gate must reject *any* color regression even if `detail` lifts. If color crashes, that is a
  valid, informative negative result (it would retire the texture hypothesis and re-point the loop at
  structured-I/O relief) — record it, don't discard it silently.
- **C4 — Down-chain dependency.** S-010 gates T-007-01 (Hōryū-ji) and the rest of the E-08 chain, which
  inherit "the better of the two detail treatments." Those runs should not start until this verdict is
  recorded, or they may inherit an unvalidated champion.

## Bottom line

The code change is correct, minimal, well-attributed, and test-green; the design is the right *distinct*
mechanism with a clear comparison framing to S-006. **The experiment itself is unfinished** — the live
trial results, the promotion verdict, and the journal attempt-log entry remain to be produced once run
018 completes. A reviewer should expect a follow-up pass (plan.md steps 5–11) before this ticket is
genuinely done.
