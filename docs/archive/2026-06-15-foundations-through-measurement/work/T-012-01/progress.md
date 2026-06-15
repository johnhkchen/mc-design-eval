# Progress — T-012-01: ground-on-mausoleum

Live tracker for the Implement phase. Run = **022-vRefRevise-designdoc** (Sun Yat-sen Mausoleum,
cumulative-progress on the founding-grounding reference).

## Step status

| # | Step | Status |
|---|------|--------|
| 1 | Confirm champion config (tree clean, no revert) | ✅ done — `git diff --stat HEAD -- run.mjs` empty |
| 2 | Tests green (pre-run gate) | ✅ done — 133/133 |
| 3 | Live trial (3 calls → run 022) | ✅ done — render.png + summary.json present |
| 4 | Judge round-0 (A/B control) | ✅ done — helper copied + run |
| 5 | Read verdicts from both renders | ✅ done — see scoreboard + reads below |
| 6 | Conditional minimal edit | ⬛ not triggered — neither color nor proportion trigger fired |
| 7 | Journal attempt-log entry (deliverable) | ✅ done — run-022 entry appended; P12 scope extended |
| 8 | progress.md + review.md | 🔄 this file; review.md next |

## Final A/B scoreboard (median-of-3, both rounds, all samples unanimous 3/3)

| dim | round-0 (build) | render (2nd pass) |
|-----|-----------------|-------------------|
| proportion | strong | strong |
| color | strong | strong |
| detail | competent | competent |
| fidelity | strong | strong |
| **overall** | **strong (3/3)** | **strong (3/3)** |

Run cost/size: 11,325 blocks, 32,038/42,093 tok, **$1.41**, 640s. The 2nd pass **held every dimension**
(no lift, no regression — like run 019, unlike the 020 regression) and added framed base panels, pilaster
strips, upturned gold roof-corner brackets, and a stronger string-course (real articulation inside
`detail=competent`).

## 008-vs-now comparison (the headline — two rubric-independent legs)

The rubrics are **incommensurable**: run 008 = v1 numeric mean (proportion 4 / color 4 / detail 3 /
fidelity 4 / **overall 4**, "same band as v4", noise ≈0.4); run 022 = v2 categorical. **No numeric→
categorical equation.**

- **Leg 1 — failure-named (rubric-independent).** Run 008's v1 judge named *"the columned portico is
  shallow"* and *"the wide blank base register feels under-detailed."* Run 022 **improved both, without
  fully resolving either**: the base register is now panelled (framed recesses + string-course + stair
  surround vs 008's plain wall) and the portals are framed recessed niches, **but** the judge still reads
  *"the wall plane and base are large flat fields with shallow, drawn-on relief rather than carved depth."*
  → technique moved the named defects from *absent* to *present-but-shallow*; it did **not** break the
  flat-field/relief-depth ceiling (the P15 holdout).
- **Leg 2 — categorical on its own terms.** Run 022 = **overall strong (3/3) both rounds** — same band as
  the best Taj (014) and Hōryū-ji (019) runs, with `detail` named as the sole gap to exceptional (which the
  v1 4/5 could only hint at). The nameable cumulative gain: **color became a disciplined dominant/
  supporting/accent harmony**, proportion a coherent base→body→crown, the base got articulated — while
  detail stayed the holdout 008 already had.

## The three reads

- **P12 — HELD; the chain's FIRST mildly-colorful / partial-agreement reference.** Two-tone reference
  (cobalt roof + white + gold); brief and image broadly agree on "be colorful." Stage-1 doc: *"The
  reference hands me one true color — that cobalt roof — and I commit to it boldly rather than collapsing to
  its white walls."* `color=strong` both rounds (blue↔gold↔vermilion scheme). **Near-neutral here** (the
  reference already hands you color — pre-P12 run 008 also scored color 4 off this photo) **but still
  protective** (kept the model off the white-collapse of the white-granite material). First partial
  evidence on the long-open colorful-reference / neutrality side of P12.
- **P13 — HELD.** Double-eaved stacked roof folded into a coherent two-tier crown; battered wing-walls →
  engaged base/body; nothing detached in either round; proportion strong through the 2nd pass (inverse of
  013/017/020). Covers stacked roof eaves + engaged buttresses.
- **Detail — competent both rounds (P15 holdout, expected; NOT a trigger).** Roof richly articulated; base
  improved by the 2nd pass; broad white wall fields still read flat. The same lagging dimension 008 had.

## Decisions / deviations

- **No prompt edit** — neither pre-registered trigger fired (color brief-driven, nothing detached; detail
  flat-field is the fenced P15 holdout). Tree left clean on the champion. **No deviation from the plan.**
- `npm test` **133/133 green** at pre-run gate and re-confirmed after the run (no code change to guard, but
  the AC gate is cheap).
- Note: a concurrent lisa thread appended the run-021 (Arc) attempt-log entry + extended P12's scope to
  four pale references while this run executed; the 022 entry appends cleanly after it and the P12 scope
  note now also carries run 022's partial-converse evidence.
