# T-099-01 opening-dressing — Progress

## Steps

- [x] **Step 1 — trapdoor facing convention pinned.** The committed card renders were too small to
  read; rendered a throwaway 4-trapdoor probe (`/tmp/t099-probe`, top view): an OPEN trapdoor's
  panel occupies the cell edge **opposite** its `facing` (north→south edge etc.). Therefore
  `SHUTTER_FACING = COMPASS` (facing = the wall's own outward compass), not the plan's
  "opposite" hypothesis. Verified by render; documented in the module header.
- [x] **Step 2 — pure core + tests → commit `feat(E-26 T-099-01): opening-dressing pure core…`.**
  `src/view/opening-dressing.mjs` + 17 tests, all green first run (suite 1182 → 1199).
- [x] **Step 3 — runner + wiring → commit `feat(E-26 T-099-01): dress-openings runner…`.**
  `benchmarks/sculpture/dress-openings.mjs`, npm `dress:cottage`, .gitignore stanza. Smoke: bad
  subject + premature `--offline` both error cleanly.
- [x] **Step 4 — live cottage run → commit `feat(E-26 T-099-01): cottage windows dressed…`.**
  Two honest gate failures drove core revisions (deviations below). Final ladder green:
  42 placements, 6/6 windows dressed (infill everywhere), 9/12 shutter sides (3 named
  `shutter-no-jamb` reductions), openings 0→6 with dressing, closure invariant 2602→2602 reached
  with 8 dressed cells, strays 9 bare → 0 composed, double-run identical, sha-stable across two
  live invocations (`316246890ce6…`), `--offline` exit 0. Renders eyeballed: the `left` (−x) face
  shows the shuttered, framed, fence-infilled windows; obliques are eave-shadowed (recorded).
- [x] **Step 5 — verification sweep.** `npm test` 1200/1200 (a sibling session is mid-flight on
  T-098 `placement-grammar.mjs` — not touched, not committed by this ticket). Working tree clean of
  T-099 strays.
- [x] **Step 6 — review.md.**

## Deviations from plan.md

1. **SHUTTER_FACING flipped from the hypothesis** (plan step 1 anticipated this; table-driven, one
   line + the tests assert via the table).
2. **Per-opening wall plane → per-cell pane resolution.** Run 1 placed fence at the modal perimeter
   depth — mid-air on the cottage's jettied walls while the real sealed pane stayed solid (only 2/6
   openings re-detected). The pane is now the first OCCUPIED cell along each aperture column
   (camera side), with the modal ring depth as the open-hole fallback. This also made shutters,
   lintel, sill, and lantern pane-relative.
3. **Shutter jamb = solid at the adjacent pane cell's depth** (not "first solid in the column"):
   restores the blocked-vs-no-jamb distinction the synthetic test pinned, and stops a far wall or a
   protrusion from posing as a jamb.
4. **Closure gate = non-regression under the SAME concept-declared regions.** The shipped skin
   never had a closure stage (baseline 2602 reached — recorded, not judged). First attempt composed
   the op's footprint regions into the closure allow-list, which *manufactured* honorary skin and
   synthesized +34 interior cells; the op regions now compose only into the stray-fixture
   allow-list (their designed purpose, D8). Dressing is exactly closure-invariant, which is the
   AC's real claim.
5. **Acceptance gate wording**: required = infill on every window + no non-geometric conflicts;
   `shutter-no-jamb` (the skin sealed three windows as floating panes at the bbox face with no wall
   around them) and empty lintel/sill bands are named geometry reductions, tolerated per the E-26
   honesty rule. A blocked shutter or missing treatment still fails. Plus a global "no shutters
   anywhere" backstop.
6. **Lintel/sill recolor the facade cell of each band column** (pane-relative, ±1), not a fixed
   plane; bands with zero solid cells get named `*-no-band-cells` conflicts.
7. **frameAngle = `left`** for the committed frames: the gate diagonals are rendered as recorded
   evidence, but at elevation 30 the eaves shadow the windows; the ortho −x face (all three windows
   fully shuttered) is the legible witness.

## Live-run truths recorded for review

- The raw cottage's only detectable openings are 3 through-windows seen from ±x (6 face-openings);
  **no door-kind opening exists anywhere** — the doorway is not a through-hole, so the cottage
  record carries the named `door: none-detected` honesty row (design D7). The op's door path is
  proven by synthetic tests instead.
- The durable skin had sealed ALL window panes (openings 0 before dressing) — the witnessed audit
  case confirmed in data, and now reversed: 0 → 6 dressed openings.
