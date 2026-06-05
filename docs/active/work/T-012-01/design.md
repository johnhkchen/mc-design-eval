# Design — T-012-01: ground-on-mausoleum

Decisions (rationale + rejected alternatives), grounded in `research.md`. This is a **cumulative-progress
measurement** run; the design work is **(A) which config is the champion**, **(B) a protocol that yields an
honest 008-vs-now comparison across a rubric change**, **(C) how to read P12 under a first-ever mildly
colorful reference**, **(D) how to read the detail headline against 008's named failures**, and **(E) the
pre-registered edit triggers** — not new prompt engineering.

## Decision A — Champion = committed HEAD (015 menu); no revert needed

**Choice:** Run against HEAD's `composeRefRevisionPrompt` (the 015 "NO LARGE FLAT FIELDS" detail menu)
**as-is**. No `git checkout` required — the working tree is already clean vs HEAD.

**Why:** The ticket says "Champion as-is; record any minimal diff." At session start
`git diff --stat HEAD -- benchmarks/temple-facade/run.mjs` is **empty** (verified). HEAD already encodes the
promoted champion: the 015 detail menu (L429), the P12 color-hold, and the P13 one-plane block. So "the
champion as-is" needs no action — confirm cleanliness as a pre-run gate; do not edit. (Same posture as
T-008-01/T-011-01; unlike T-007-01 which had to revert an un-promoted edit.)

**Rejected — re-apply S-006 panel grammar or S-010 texture grain.** Out of scope: neither promoted; this
ticket tunes nothing. The detail dimension is *observed* here, not *tuned*. Re-applying S-006 would
contaminate the very flat-field/cumulative read the ticket wants from the clean champion.

## Decision B — Protocol: champion as-is, A/B both rounds, and a failure-named 008-vs-now comparison

**Choice:** the fixed sequence
1. Confirm clean tree (Decision A); `npm test` green (done — 133/133).
2. One live `vRefRevise-designdoc --ref references/sys_mausoleum.JPG` run (3 calls, ~10–15 min → run 022).
3. Judge **both** `round-0.png` (helper, median-of-3) **and** `render.png` (auto, median-of-3) — P14.
4. Read the reads from the renders, cross-checked against judge `notes`.
5. Append a dated attempt-log entry: A/B per-dimension table + the **008-vs-now comparison** + P12/P13
   held/failed verdicts.

**The 008-vs-now comparison must be done honestly across the rubric change.** 008 was scored on the v1
numeric mean (overall 4/5); the current run is v2 categorical. **A numeric→categorical equation is
invalid** (research §three-reads). So the comparison is built on **two legs that survive the rubric
change**:
- **Leg 1 — failure-named (rubric-independent).** Run 008's v1 judge named two concrete defects: *"the
  columned portico is shallow"* (relief depth) and *"the wide blank base register feels under-detailed"*
  (flat field). These are **structural facts about the render**, readable on the 022 render regardless of
  scoring scale. The headline cumulative result = **did the accumulated pipeline fix those two defects?**
- **Leg 2 — categorical-on-its-own-terms.** Report 022's categorical scores as the *current* instrument's
  reading, and state plainly that they sit on a different scale than 008's 4/5 — comparable to runs 010–021
  (v2), *not* to 008. Resist the temptation to say "008 was 4/5 ≈ strong"; instead say what *each* rubric
  could and could not resolve (v1 saturated at 4, noise ≈0.4; v2 names the lagging dimension).

**Why both rounds (P14):** the 2nd pass is a coin-flip — it *lifted* proportion on Taj 014, *held* every
dimension on Hōryū-ji 019, and *regressed* proportion+fidelity on Sainte-Chapelle 020. 008 had **no 2nd
pass at all**, so the round-0→render A/B here is doubly informative: it isolates the revision's effect *and*
shows whether adding a 2nd pass (a technique 008 lacked) is part of the cumulative gain or a wash on this
reference.

## Decision C — P12 read: the first MILDLY-COLORFUL reference (a new condition, not a 5th pale point)

**Observation (from research):** every prior P12 stress was a *pale* reference (white/timber/pale-stone/
cream). The mausoleum is the **first genuinely two-tone** reference: a **saturated cobalt-blue roof + white
stone + gold tablets**. And uniquely, under v1 run 008 — *before* P12 existed — the model **derived the
palette from the photo** ("blue-white-gold") and that scored **color 4/5**, because the reference happened
to already be colorful. So this is the closest the chain has come to the long-sought *agreement* case
(reference and brief both want color), though only **partial** agreement: blue+white is a restrained cool
two-hue scheme, not the brief's full dominant/supporting/accent polychrome.

**Choice:** Read P12 on this **mild-agreement** condition explicitly, as a distinct point from the four
pale conflict cases. Two sub-questions the render answers:
- Did the craft/color split still route color from the **brief** (an invented dominant/supporting/accent
  scheme), or did the model lean on the reference's own blue+white (the 008 behavior)?
- If the build *is* colorful, is it the brief's scheme or just the reference's blue+white re-derived? The
  judge `notes` distinguish "a disciplined dominant/supporting/accent harmony" from "a single cool family"
  (the 013 ceiling) — use that to tell agreement-by-design from reference-capture.

**Why this matters for P12's scope:** P15-era P12 is confirmed "load-bearing across THREE pale palettes;
neutral-under-a-colorful-reference still UNTESTED" (run 020 net). The mausoleum is the **first chance to
probe the colorful-reference side of P12** — even partially. A "held" here (color from brief, strong)
extends P12's confirmed range to a non-pale reference; an observation that the model simply re-used the
blue+white is *also* informative (it would suggest P12 is a no-op when the reference already satisfies the
brief — the long-open neutrality question, finally getting partial evidence).

**Rejected — treat the mausoleum as just a 5th pale reference.** It is not pale; mislabeling it would waste
the chain's first colorful-reference data point and misreport P12's tested range.

## Decision D — Detail read: the headline is 008's two NAMED failures, scored against the holdout

**Choice:** Make the **008-named defects** (shallow portico, blank base register) the run's sharpest
*qualitative* read, while still applying the P15 noise caveat to the *categorical `detail` score*. The
mausoleum's big white battered wing-walls and the wide wall band over the arches are the literal "blank
base register" 008 flagged — so the render directly answers: do those broad white fields now carry layered
relief (banding, dougong courses, framed panels, dentils), or do they read as inert ashlar like 008's?
And is the portico/arched-portal zone given real recessed depth, fixing 008's "shallow"?

**Why:** AC #2 demands the 008-vs-now comparison, and the most defensible cumulative claim is on the two
defects 008's *own* judge named — those are structural facts, single-render-answerable, immune to the
rubric change. Report the `detail` category with the P15 caveat (one boundary-noisy generation), but give a
**confident render-grounded yes/no** on whether the wing-walls/base register are articulated, because that
is observable. **Expectation (a hypothesis, not a foregone conclusion):** consistent with runs 014–021,
`detail` likely stays `competent` (the holdout persists) — but the *specific* 008 defects may still be
visibly improved (deeper portal recess, some entablature banding) even if the category doesn't flip, which
is exactly the cumulative-progress nuance the ticket wants.

**Rejected — average two generations to de-noise `detail`.** Cost/time (~$2, ~15 min) not justified: the
qualitative wing-wall/base-register read is single-render-answerable, and a second `detail` category would
only re-confirm known boundary noise. Single generation suffices.

## Decision E — Edit-only-if-a-principle-visibly-fails (pre-registered triggers)

**Choice:** Default to **no prompt edit** (measurement run). Pre-register the only conditions that would
justify a *minimal* generalizing change, decided **from the render before** any edit:

- **Color trigger (P12):** render reads monochrome/grey OR the build simply re-uses the reference's
  blue+white with no brief-driven scheme (color captured by the reference despite the color-hold clause).
  *Minimal fix shape (only if triggered):* extend the color-hold bullet to name that **even a reference
  that is *already* colorful is a craft anchor, not a palette mandate** — the brief's scheme still leads.
  (Note: P12 held off four references; a trigger here would be a genuinely new failure mode — reference
  *capture under agreement* — worth recording carefully.)
- **Proportion trigger (P13):** the double-eaved roof detached a tier, the battered wing-walls floated free
  of the body, or the 2nd pass detached the cornice/roof into a floating cap. *Minimal fix shape:*
  generalize the one-plane wording to name **stacked roof tiers and engaged buttress-walls as bonded, not
  detached** (the wording already covers stacked tiers from the Hōryū-ji generalization — likely no edit).
- **Detail:** flat-field persistence on the wing-walls is the **known P15 holdout**, NOT a trigger — it is
  the expected result the experiment is measuring. Do not edit the detail clause off one run; that is a
  tuning action reserved for the S-006/S-010 detail-lever tickets (≥2-generation gate). Record the
  flat-field outcome; don't fix.

If a trigger fires and a minimal edit is made: **record the diff** in the journal, re-run `npm test` (must
stay green), note it (AC #3). If neither fires, the principles **held** on this reference — record that with
render-grounded evidence. **A re-run to validate any edit is optional** (AC require recording the diff +
green tests, not a second metered run).

**Why pre-register:** prevents post-hoc rationalizing a "fix" into a clean result — and explicitly fences
the detail dimension *out* of the trigger set so the holdout isn't mistaken for a bug.

## What is explicitly NOT changed

`task.mjs` (brief/seed/view), `judge.*` (rubric), the AJV schema, `src/config.mjs` (model pin),
`composeReferenceDesignDocPrompt` (stage-1 doc), `composeHighResBuildPrompt` (round-0 control), and —
unless a pre-registered trigger fires — `composeRefRevisionPrompt`/`run.mjs`. There is **no guaranteed code
action** this ticket (tree already clean); the only conditional one is a single-bullet generalizing edit if
the color or proportion trigger fires (detail is fenced out).

## Success definition

Not "the build scores strong" (that's the instrument's job). Success = a **trustworthy 008-vs-now
cumulative-progress verdict** built on the two rubric-independent legs (did the pipeline fix 008's named
shallow-portico + blank-base-register defects; what the current categorical instrument reads, on its own
scale), **plus** an honest P12 read on the chain's first mildly-colorful reference and a P13 read on the
stacked-roof/battered-wing massing. Both rounds judged, the journal entry written (scoping any principle the
result warrants), and tests green. A correctly-scoped "detail still failed on the wing-walls" is a
**successful** measurement, not a failed run.
