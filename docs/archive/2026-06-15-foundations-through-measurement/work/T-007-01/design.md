# Design — T-007-01: ground-on-horyuji

Decisions (with rationale and rejected alternatives), grounded in `research.md`. This is a
*generalization* run; the central design choices are **(A) which config counts as "the champion"**
and **(B) the experimental protocol that produces an honest P12/P13 verdict** — not new prompt
engineering.

## Decision A — Inherited champion = committed HEAD (the 015 menu), not the working-tree edit

**Choice:** Run against the **committed champion** (HEAD's `composeRefRevisionPrompt`, the 015 "NO
LARGE FLAT FIELDS" detail menu). Before launching, revert the un-promoted texture-grain working-tree
edit (`git checkout HEAD -- benchmarks/temple-facade/run.mjs`).

**Why:**
- The ticket says "inherits whatever **champion** the two detail experiments left" and "prefer to run
  the **champion config as-is**." A *champion* is a **promoted** config. Neither detail experiment
  promoted: S-006's panel grammar was never committed; S-010's texture grain (the dirty WT edit at
  session start) produced **run 017 = proportion regressed strong→competent, detail still competent** —
  a regression, not a lift, with **no promotion journal entry**. T-010-01's own `review.md` names the
  non-promotion revert target as the **015 menu (HEAD)**. So the honest champion is HEAD.
- The choice is **immaterial to the two principles under test.** The P13 one-plane block (~L419) and
  the P12 color-hold block (~L443) are byte-identical between the menu and texture-grain variants; the
  only diff is the *detail* bullet. Reverting cannot bias the P12/P13 read — it just makes "the
  champion config as-is" unambiguous and keeps the generalization comparable to the 014/015 baseline
  that earned `strong`.

**Rejected — run with the dirty working tree as-is.** Tempting (least action), but it would label an
*un-promoted, regressed* experimental edit as "the champion" and muddy attribution against the 014/015
baseline. The detail dimension would then be confounded by an in-flight detail experiment on a brief
that is explicitly *not* a detail-tuning run. Rejected for honesty + comparability.

**Rejected — re-apply texture grain deliberately.** Out of scope: this ticket tunes nothing; T-010-01
owns that lever and did not promote it.

## Decision B — Protocol: champion as-is, A/B both rounds, verdict per principle

**Choice:** the fixed sequence
1. Revert to champion (Decision A); `npm test` green.
2. One live `vRefRevise-designdoc --ref references/horyu_ji.JPG` run (3 calls, ~15 min).
3. Judge **both** `round-0.png` (helper, median-of-3) **and** `render.png` (auto, median-of-3) — P14.
4. Read **P12** (colorful? did the timber palette leak?) and **P13** (one connected plane? did the
   tower/tiers detach or float?) **from the final render**, grounded in what is visible.
5. Append a dated attempt-log entry: A/B per-dimension table + **held/failed** verdict for each
   principle; if failed, **scope** it (state the condition under which it holds/doesn't).

**Why both rounds (P14):** the reference-compared 2nd pass is double-edged — it *lifted* proportion on
Taj run 014 but *regressed* it on run 013 (detached minarets) and on run 017. With a 3-D vertical
reference, the 2nd pass is the **most likely place P13 breaks** (it is where the model compares to the
freestanding tower). Judging round-0 vs render isolates whether any detachment is born in the build or
introduced by the revision — essential to *scoping* P13 rather than passing/failing it blindly.

## Decision C — Edit-only-if-a-principle-visibly-fails (and the pre-registered trigger)

**Choice:** Default to **no prompt edit.** Pre-register the *only* conditions that would justify a
*minimal* generalizing change, decided **from the render before** any edit:

- **P13 trigger:** the render shows detached/floating masses — a literal pagoda tower sitting apart
  from the hall, sky between stacked tiers, or tiers reading as separate boxes rather than one
  stepped elevation. *Minimal fix shape* (only if triggered): one clause generalizing the existing
  one-plane language from "corner towers/minarets" to "**stacked tiers / a tower mass**" — tiers are
  setbacks of one connected plane, not stacked free boxes. No structural rewrite.
- **P12 trigger:** the render reads monochrome/brown/grey/white — the timber palette captured the
  build despite the craft/color split. *Minimal fix shape* (only if triggered): tighten the existing
  color-hold bullet to name the *timber* failure mode explicitly (as P12 already does for "white").

If a trigger fires and a minimal edit is made: **record the diff in the journal**, re-run `npm test`
(must stay green), and — per AC #3 — note it. If neither fires, the principles **generalized**; record
that with render-grounded evidence (not a silent pass).

**Why pre-register:** prevents post-hoc rationalizing a "fix" into a clean generalization result. The
ticket explicitly warns this is not a tuning run.

**Rejected — proactively add pagoda-specific language before seeing the render.** That would be tuning
to the reference and would destroy the generalization signal (we would no longer be testing whether the
*champion* generalizes). Rejected.

## Decision D — Single generation, with the detail caveat applied to reads

**Choice:** One generation (not the 2-generation robustness protocol of T-010-01). Read **P12/P13**
(categorical, structural) as load-bearing; treat any single **`detail`** score with the P15 noise
caveat (do not over-credit/penalize one flip).

**Why:** the ticket's AC require a P12/P13 verdict, not a detail-lever robustness claim — detail
robustness was T-010-01's job. P12 (colorful vs leaked) and P13 (one plane vs detached) are
**structural, low-variance** reads that a single high-quality render answers reliably; they don't flip
generation-to-generation the way the detail boundary does. A second generation would cost ~$2 and ~15
min for marginal confirmation of an already-categorical read. If round-0 vs render *disagree* sharply
on proportion in a way that looks like noise rather than the known revision dynamic, that will be
flagged as a confound in the journal rather than silently averaged.

**Rejected — 2 generations.** Cost/time not justified by the AC; structural reads are stable. (If the
result is genuinely ambiguous, the journal will say so and recommend a confirmer rather than fabricate
certainty.)

## What is explicitly NOT changed

`task.mjs` (brief/seed/view), `judge.*` (rubric), the AJV schema, `src/config.mjs` (model pin),
`composeHighResBuildPrompt` (round-0 control), and — unless a P12/P13 trigger fires — `run.mjs`. The
only guaranteed code action is the **revert to champion** (Decision A), which restores HEAD and leaves
the tree clean.

## Success definition for this ticket

Not "the build scores strong" (that is the instrument's job). Success = a **trustworthy, render-grounded
verdict** on whether P12 and P13 generalize to a vertical wooden-pagoda reference, with both rounds
judged, the journal entry written (scoping any failure), and tests green. A *failure to generalize*
that is correctly scoped is a **successful** outcome of this ticket.
