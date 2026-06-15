# Design — T-008-01: ground-on-sainte-chapelle

Decisions (rationale + rejected alternatives), grounded in `research.md`. This is a **generalization**
run; the design work is **(A) which config is the champion**, **(B) the protocol that yields an honest
P12 scoping verdict**, and **(C) how to handle the reference-premise discrepancy** the image surfaced —
not new prompt engineering.

## Decision A — Champion = committed HEAD (015 menu); no revert needed

**Choice:** Run against HEAD's `composeRefRevisionPrompt` (the 015 "NO LARGE FLAT FIELDS" detail menu)
**as-is**. No `git checkout` required — the working tree is already clean vs HEAD.

**Why:** The ticket says "prefer the champion config as-is." Unlike T-007-01 (which had S-010's
un-promoted texture-grain edit dirtying the tree and had to revert it), at this session's start
`git diff --stat HEAD -- benchmarks/temple-facade/run.mjs` is **empty**. HEAD already encodes the
promoted champion: the 015 detail menu, the P12 color-hold (L412–414, L433–436), and the P13 one-plane
block (L419–423). So "the champion as-is" needs no action. Confirm cleanliness as a pre-run gate; do not
edit.

**Rejected — re-apply S-006 panel grammar or S-010 texture grain.** Out of scope: neither promoted;
this ticket tunes nothing. The detail dimension is *observed* here, not *tuned*.

## Decision B — Protocol: champion as-is, A/B both rounds, scope the verdict

**Choice:** the fixed sequence
1. Confirm clean tree (Decision A); `npm test` green (done — 133/133).
2. One live `vRefRevise-designdoc --ref references/St_Chapelle.png` run (3 calls, ~15 min → run 020).
3. Judge **both** `round-0.png` (helper, median-of-3) **and** `render.png` (auto, median-of-3) — P14.
4. Read the **color verdict** (the load-bearing one) from the final render, plus the secondary reads:
   **proportion under verticality** (P13) and **detail on tracery** (S-006), grounded in what's visible.
5. Append a dated attempt-log entry: A/B per-dimension table + the **P12 scoping verdict** (neutral vs
   additive) + secondary observations.

**Why both rounds (P14):** the 2nd pass is double-edged — it *lifted* proportion on Taj run 014 but
*regressed* it on run 013 (detached columns). Judging round-0 vs render isolates whether anything is born
in the build or introduced by the revision. For color specifically: round-0 tells us what color the build
chose *before* the color-hold clause re-asserted; render tells us the final. If round-0 is already
strong-color and render is too, the color-hold clause did **nothing measurable** here — direct evidence
for P12-neutrality. That A/B *is* the P12 scoping experiment.

## Decision C — Resolve the reference-premise discrepancy by deferring to what the build reflects

**The problem (from research):** the ticket frames Sainte-Chapelle as the *agreement* case ("already
colorful"), but the provided image is the **grey-limestone exterior** — the polychrome glass is interior
and not salient in the photo. So the clean "reference agrees with brief on color" condition the ticket
assumes may not actually be presented to the model.

**Choice:** Do **not** swap the image, doctor the brief, or pre-judge which condition this is. Run the
champion on the image as given, then **classify the condition from the stage-1 design doc + the render**:

- **Path 1 — model read the image as colorful** (imputed the famous glass / rose polychromy): this is the
  ticket's intended *agreement* case. If `color = strong`, P12 was a near-no-op → **scope P12 to the
  conflict condition** (confirmed as the ticket hypothesized).
- **Path 2 — model read the image as monochrome stone** (the literal exterior): this is effectively a
  *second conflict-condition* data point. If `color = strong` anyway, that is **even stronger** evidence
  for the brief-as-color-source mechanism (color held off a pale reference, as on the Taj) — but it does
  NOT support "P12 is neutral because the reference agreed"; instead it supports "P12 (color from brief)
  is **robust and load-bearing** across pale references." The verdict must say which.
- **Path 3 — `color` came out competent/weak:** P12 failed to deliver here; record and scope the failure
  (the condition under which color does/doesn't reach strong), per AC #3.

**Why defer:** the honest experiment reads the *mechanism actually exercised*, not the label the ticket
pre-assigned. The stage-1 `design-doc.md` (already written by the time we judge) states the palette the
model committed to and whether it called the reference colorful or pale — that disambiguates Path 1 vs 2
directly. This turns a premise error into a sharper result: we learn whether color-strength here comes
from *agreement* (P12 idle) or from *the brief overriding a pale exterior* (P12 active and robust).

**Rejected — substitute an interior/polychrome Sainte-Chapelle image** to honor the ticket's framing.
That would be silently rewriting the experiment to match a hypothesis; the ref is part of the frozen
test setup the ticket named by path. Flag the discrepancy in the journal instead (transparency over
convenience).

## Decision D — Edit-only-if-a-principle-visibly-fails (pre-registered triggers)

**Choice:** Default to **no prompt edit** (generalization run). Pre-register the only conditions that
would justify a *minimal* generalizing change, decided **from the render before** any edit:

- **Color trigger (P12):** render reads monochrome/grey/washed-out — the stone exterior captured the
  build despite the color-hold clause. *Minimal fix shape (only if triggered):* extend the existing
  color-hold bullet (L433–436) to name the **grey-stone/limestone** capture mode explicitly, as it
  already names "white". No structural rewrite.
- **Proportion trigger (P13/verticality):** the tall Gothic massing produced a top-heavy/toppling or
  detached-pinnacle silhouette — verticality broke proportion or the one-plane rule. *Minimal fix shape:*
  generalize the one-plane wording (L419–423) to name **pinnacles/spires/buttresses** as engaged relief
  (as it already names "corner towers/minarets"). No structural rewrite.

If a trigger fires and a minimal edit is made: **record the diff** in the journal, re-run `npm test` (must
stay green), note it (AC #3). If neither fires, the principles **generalized** — record that with
render-grounded evidence (not a silent pass). **A re-run to validate any edit is optional** (AC require
recording the diff + green tests, not a second metered run).

**Why pre-register:** prevents post-hoc rationalizing a "fix" into a clean generalization result.

**Rejected — proactively add Gothic-specific language before seeing the render.** That is tuning to the
reference; it destroys the generalization signal. Rejected.

## Decision E — Single generation, with the detail caveat applied to reads

**Choice:** One generation. Read **color (P12)** and **proportion (P13)** as load-bearing (categorical,
structural, low-variance); treat the single **`detail`** score (the S-006 tracery transfer read) with the
P15 noise caveat — note the direction, don't over-credit/penalize one flip.

**Why:** the AC require a P12 scoping verdict + secondary observations, not a detail-lever robustness
claim (that was T-006/T-010's job). Color and proportion are stable single-render reads; detail is the
known boundary-noisy dimension. A second generation costs ~$2/~15 min for marginal confirmation of an
already-categorical read. If round-0 vs render disagree sharply on a structural dimension in a way that
looks like noise rather than the known revision dynamic, that is flagged as a confound, not averaged.

**Rejected — 2 generations.** Cost/time not justified by the AC; structural reads are stable.

## What is explicitly NOT changed

`task.mjs` (brief/seed/view), `judge.*` (rubric), the AJV schema, `src/config.mjs` (model pin),
`composeReferenceDesignDocPrompt` (stage-1 doc), `composeHighResBuildPrompt` (round-0 control), and —
unless a pre-registered trigger fires — `composeRefRevisionPrompt`/`run.mjs`. There is **no guaranteed
code action** this ticket (tree already clean); the only conditional one is a single-bullet generalizing
edit if a trigger fires.

## Success definition

Not "the build scores strong" (that's the instrument's job). Success = a **trustworthy, render-grounded
verdict** on whether P12 is **neutral here vs additive**, with the reference-premise discrepancy
transparently resolved (which condition was actually exercised), both rounds judged, proportion/detail
secondary observations recorded, the journal entry written (scoping P12 if supported), and tests green.
A correctly-scoped "P12 was neutral" — or a correctly-scoped "P12 stayed load-bearing because the image
was actually pale" — are **both successful** outcomes.
