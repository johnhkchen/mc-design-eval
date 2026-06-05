# Progress — T-006-01

## Step 1 — Lever applied ✅
Edited `composeRefRevisionPrompt` in `benchmarks/temple-facade/run.mjs`: the single
`Detail — NO LARGE FLAT FIELDS` menu bullet → a mandatory recessed-panel + string-course
**grammar** (relief-only, palette held), plus an explicit anti-material-grain guard fencing off
the v5 color crash. Exactly one bullet region in one function changed; build prompt
(`composeHighResBuildPrompt`) deliberately left unchanged so `round-0` stays the control.

**Diff (before → after):**
- BEFORE: "any wall plane wider than ~6 blocks must carry layered relief — recessed panels,
  pilaster strips, string-courses, banding, or inset ornament … treat any blank field as
  unfinished." (a menu/exhortation)
- AFTER: a numbered recipe applied to EACH named offender (flanks, spandrels, base/plinth,
  window insets): (1) recess 1-2 into -Z by exclusion, (2) frame the sunken panel with pilaster
  strips + top/bottom string-courses (stair/slab stepped), (3) a continuous horizontal
  string-course every ~6-8 rows; "no plane wider than ~6 may remain a single flat surface";
  built with fill/box/line + stair/slab state. PLUS a second bullet: detail from RELIEF not new
  colors — same palette at varied Z, no 2-3-related-block grain (collapses color hierarchy);
  hold the dominant/supporting/accent scheme.

## Step 2 — Tests green ✅
`npm test` → 133 pass, 0 fail. No `baml:gen` needed (no `.baml` touched).

## Step 3/4 — Generation 1 (run 016) ✅
`vRefRevise-designdoc` Taj. 17,710 blocks, $1.99, 131→112 ops.
- **render** (auto, median-of-3): prop strong / color strong / **detail competent** / fidelity
  strong / overall strong.
- **round-0** (helper, median-of-3): prop strong / color strong / **detail competent** /
  fidelity strong / overall strong.
- **A/B verdict for gen 1: detail did NOT move (competent → competent).** The lever visibly
  fired — the render's flanks gained framed recessed panels (blue plus-motifs) + gold string
  courses vs round-0's plainer flanks — but the articulation did not cross the category
  boundary. Judge round-0 notes: "each flank is a large flat orange field … the relief doesn't
  carry across the whole surface, and that empty field is an obvious, namable improvement."
- Gen-1 render detail = competent already FAILS the AC promotion rule ("detail rises a full
  category to strong").

## Step 5 — Generation 2 (run 017) — running for the 2-generation robustness record.

## A/B scoreboard (to fill in)

| gen | run id | round | proportion | color | detail | fidelity | overall |
|-----|--------|-------|-----------|-------|--------|----------|---------|
| baseline 014 | 014 | render | strong | strong | competent | strong | strong |
| baseline 015 | 015 | render | strong | strong | strong* | strong | strong |
| 1 | 016 | round-0 | | | | | |
| 1 | 016 | render | | | | | |
| 2 | 017 | round-0 | | | | | |
| 2 | 017 | render | | | | | |

*015 detail=strong was boundary-noise (notes prose said competent).
</content>
