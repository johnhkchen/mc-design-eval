# Design — T-011-01: ground-on-arc

Decisions (rationale + rejected alternatives), grounded in `research.md`. This is a **generalization**
run; the design work is **(A) which config is the champion**, **(B) the protocol that yields honest
P12/P13/detail verdicts on a single-opening massing**, and **(C) the pre-registered edit triggers** — not
new prompt engineering.

## Decision A — Champion = committed HEAD (015 menu); no revert needed

**Choice:** Run against HEAD's `composeRefRevisionPrompt` (the 015 "NO LARGE FLAT FIELDS" detail menu)
**as-is**. No `git checkout` required — the working tree is already clean vs HEAD.

**Why:** The ticket says "champion as-is; record any minimal diff." At session start
`git diff --stat HEAD -- benchmarks/temple-facade/run.mjs` is **empty** (verified). HEAD already encodes
the promoted champion: the 015 detail menu (L429–432), the P12 color-hold (L412–414, L433–436), and the
P13 one-plane block (L419–423). So "the champion as-is" needs no action — confirm cleanliness as a pre-run
gate; do not edit. (Same posture as T-008-01; unlike T-007-01 which had to revert an un-promoted edit.)

**Rejected — re-apply S-006 panel grammar or S-010 texture grain.** Out of scope: neither promoted; this
ticket tunes nothing. The detail dimension is *observed* here, not *tuned*. Re-applying S-006 would
contaminate the very flat-field read the ticket wants from the clean champion.

## Decision B — Protocol: champion as-is, A/B both rounds, three render-grounded verdicts

**Choice:** the fixed sequence
1. Confirm clean tree (Decision A); `npm test` green (done — 133/133).
2. One live `vRefRevise-designdoc --ref references/arc_de_triomph.JPG` run (3 calls, ~10–15 min → run 021).
3. Judge **both** `round-0.png` (helper, median-of-3) **and** `render.png` (auto, median-of-3) — P14.
4. Read three verdicts from the renders, cross-checked against judge `notes`:
   - **P13 / proportion on one giant arch** (the ticket's first read): did the single-opening massing get
     a coherent silhouette + bay rhythm, or go top-heavy / hollow? Did the 2nd pass hold or regress it?
   - **P12 / color** (load-bearing, low-variance): did color come from the brief, not the cream stone?
   - **Detail on the attic/spandrel flat fields** (the sharp test): did the detail clause put layered
     relief into the broad attic band and spandrels, or did they render as inert blank walls?
5. Append a dated attempt-log entry: A/B per-dimension table + held/failed verdicts for **P12 & P13 on
   this massing** + an explicit answer on **whether the detail lever resolved the attic/spandrel fields**.

**Why both rounds (P14):** the 2nd pass is a coin-flip — it *lifted* proportion on Taj 014, *held* every
dimension on Hōryū-ji 019, and *regressed* proportion+fidelity on Sainte-Chapelle 020 (traded a recessed
portal for a flat slab). Judging round-0 vs render isolates whether a feature is born in the build or
introduced/destroyed by the revision. For the **detail** read specifically, the A/B says whether the
revision's "NO LARGE FLAT FIELDS" clause *added* relief to the attic/spandrels between rounds or left them
flat — the direct measurement of the ticket's headline question.

## Decision C — The single-arch massing reframes the P13 read (not a detachment test)

**Observation (from research):** every prior P13 stress had genuinely freestanding parts to (mis)translate
— Taj minarets (lateral), Hōryū-ji pagoda (vertical). The Arc has **none**: it is already one connected
block pierced by one opening. So the P13 *detachment* failure mode is **near-absent** here by construction.

**Choice:** Read P13 on this massing as the ticket frames it — "does *one giant arch* still receive
coherent bay rhythm / proportion" — i.e. a **proportion-coherence** read on an unusual silhouette, not a
detachment read. A "held" verdict means: the single opening is proportioned (arch springs/imposts placed
sensibly, attic not top-heavy, pier-to-void ratio readable), masses stay bonded (trivially true), and the
2nd pass doesn't wreck it. A "failed" verdict would be a top-heavy attic, a hollow/oversized void, or the
2nd pass detaching the cornice/attic into a floating cap. State explicitly that the *detachment* mode was
not exercised (no standalone parts), so P13's headline generalization claim is **lightly** tested here;
the *proportion-on-novel-massing* claim is what this run actually probes.

**Rejected — score P13 "failed to generalize" if no detachment is observed.** That would misread the
absence of a hazard as a null result. The honest read names *which* aspect of P13 this massing tests.

## Decision D — Detail is the PRIMARY qualitative target here (inverting the usual caveat)

**Choice:** Treat the **attic/spandrel flat-field** question as the run's sharpest read, while still
applying the P15 noise caveat to the *categorical `detail` score*. The score is one boundary-noisy sample;
but the *qualitative* question — "are the broad attic and spandrel fields articulated or blank?" — is
answerable from a single render by direct inspection (it is a structural fact about the build, not a
borderline category flip). So: report the `detail` category with the P15 caveat, but give a **confident,
render-grounded yes/no** on whether the attic/spandrels carry relief, because that is observable.

**Why:** the ticket's AC #2 explicitly demands "whether the detail lever resolved the attic/spandrel flat
fields." That is a yes/no about visible articulation, not a claim about the noisy category boundary. The
Arc is the ideal probe because its *correct* surface is mostly smooth ashlar with concentrated relief —
the exact pattern P15 says the generic "NO LARGE FLAT FIELDS" menu under-delivers on. Expectation (a
hypothesis to confirm/refute, not a foregone conclusion): consistent with runs 014–020, the flat fields
likely **persist** — but the Arc may also *help* the model, because here flat ashlar is period-correct, so
a "mostly smooth with relief panels" build could read as faithful even if `detail` stays competent.

**Rejected — average two generations to de-noise `detail`.** Cost/time (~$2, ~15 min) not justified: the
qualitative attic/spandrel read is single-render-answerable, and a second `detail` category would only
confirm the known boundary noise (T-006/T-010 already characterized that). Single generation suffices.

## Decision E — Edit-only-if-a-principle-visibly-fails (pre-registered triggers)

**Choice:** Default to **no prompt edit** (generalization run). Pre-register the only conditions that would
justify a *minimal* generalizing change, decided **from the render before** any edit:

- **Color trigger (P12):** render reads monochrome/grey/cream-washed — the limestone captured the build
  despite the color-hold clause. *Minimal fix shape (only if triggered):* extend the color-hold bullet
  (L433–436) to name the **cream/limestone** capture mode (it already names "white"). No structural
  rewrite. (Note: P12 held off white/timber/pale-stone in 014/019/020 — a trigger here would be surprising.)
- **Proportion trigger (P13):** the single-arch massing produced a top-heavy attic, a hollow oversized
  void, or the 2nd pass detached the cornice/attic into a floating cap. *Minimal fix shape:* generalize
  the one-plane wording (L419–423) to name a **heavy attic/cornice as engaged relief, not a detached cap**.
  No structural rewrite.
- **Detail:** a flat-field persistence is the **known P15 holdout**, NOT a trigger — it is the expected
  result the experiment is measuring, not a generalization failure to patch. Do not edit the detail clause
  off one run; that is a tuning action reserved for the S-006/S-010 detail-lever tickets, which gate on
  ≥2-generation robustness (per the promotion-gate tightening). Record the flat-field outcome; don't fix.

If a trigger fires and a minimal edit is made: **record the diff** in the journal, re-run `npm test` (must
stay green), note it (AC #3). If neither fires, the principles **generalized** — record that with
render-grounded evidence (not a silent pass). **A re-run to validate any edit is optional** (AC require
recording the diff + green tests, not a second metered run).

**Why pre-register:** prevents post-hoc rationalizing a "fix" into a clean generalization result — and
explicitly fences the detail dimension *out* of the trigger set so the holdout isn't mistaken for a bug.

## What is explicitly NOT changed

`task.mjs` (brief/seed/view), `judge.*` (rubric), the AJV schema, `src/config.mjs` (model pin),
`composeReferenceDesignDocPrompt` (stage-1 doc), `composeHighResBuildPrompt` (round-0 control), and —
unless a pre-registered trigger fires — `composeRefRevisionPrompt`/`run.mjs`. There is **no guaranteed
code action** this ticket (tree already clean); the only conditional one is a single-bullet generalizing
edit if the color or proportion trigger fires (detail is fenced out).

## Success definition

Not "the build scores strong" (that's the instrument's job). Success = a **trustworthy, render-grounded
verdict** on all three reads: P12 (color from brief on a 4th pale ref), P13 (proportion on a single-arch
massing, with the detachment mode correctly noted as un-exercised), and — the headline — **whether the
detail lever filled the attic/spandrel flat fields**. Both rounds judged, the journal entry written
(scoping any principle the result warrants), and tests green. A correctly-scoped "detail still failed on
the flat fields" is a **successful** generalization result, not a failed run.
