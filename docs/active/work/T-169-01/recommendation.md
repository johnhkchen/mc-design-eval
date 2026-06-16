# T-169-01 — Promotion recommendation for the style-distance term (E-40/S-168)

**Recommendation: DO NOT PROMOTE. RE-CALIBRATE first.** The frozen instrument is untouched by this
ticket and must stay so until the prerequisite below lands and this referee is re-run.

## The decision in one line

The style-distance term, as built, **over-penalizes the close (matched) style to the floor** on live
Layer A output — a clean build scores 2/100 against its own concept — so it cannot be the basis of a
measurement the frozen instrument trusts. This is precisely the claim's named DO-NOT-PROMOTE branch.

## The evidence (from `results/corpus-referee.json`, FINDINGS.md)

1. **Crater COLLAPSED, did not separate.** matched A=2, wrong B=0, B2=2, C=0 — all floored, spread
   A−B=2 inside the ±12 noise. The term ties everything at ~0 just as the E-39 scalar tied everything
   at ~50. No within-family gradient.
2. **Corpus agreement is collapsed-noise ordering.** Easy pairs 3/4 by ordering, but only one pair
   (gatehouse-vs-chapelle, margin +16) separates beyond noise; the other margins are ±2–4, and
   `cottage-vs-arc` **inverts** the human label (matched 0 < wrong 2). The contested middle is empty by
   construction (corpus excludes it) — untestable here.
3. **Root cause, mechanical and certain.** `itemStyleClass` classes an item `"wrong-style"` when
   `present` and `missing` are both non-empty. Live Layer A populates **both for every divergent
   department in every condition** (nWrongStyle = 3–5 of 3–5 items, matched included). So the cap fires
   on matched builds. This is BO11's pinned F1 boundary as the dominant case, not an edge.

## What promotion would require (the prerequisite, not this ticket)

The fix is **not** a constant tune (lowering `WRONG_STYLE.cap`/`distance` cannot separate matched from
wrong when *both* sets of items class wrong-style) and **not** a string heuristic (AC-forbidden,
brittle). It is the **typed `kind` discriminator** already filed as T-168-01's `schema-feedback.md`:

- Add `CritiqueItem.kind: "add" | "replace" | "remove"` to `baml_src/department.baml` and teach the
  DiagnoseBuild prompt to tag each item (`replace` = wrong material present; `add` = right style, detail
  not yet built; `remove` = foreign element to delete).
- The scoring core is **already wired** for it: `itemStyleClass` short-circuits on `kind` before the
  structural read (BO8 pins this), so only true `replace` items will cap once the tag is emitted. No
  `bakeoff-score.mjs` change is needed when the tag lands.
- That edit re-pins the `DiagnoseBuild` prompt golden ⇒ it is an **owning E-39 ticket** (prompt-golden
  re-pin discipline), not a change made here.

## The path forward (ordered)

1. **E-39 ticket:** land `CritiqueItem.kind` in `department.baml` + the prompt tagging + re-pin the
   golden. (Pre-staged by `schema-feedback.md`.)
2. **Re-run this referee** (`npm run corpus-referee`) unchanged — it reads `kind` through
   `itemStyleClass` automatically. Check: does the matched condition now stay high (only `replace` items
   cap) while the wrong-style condition still craters?
3. **Only if the crater is then real AND agrees with the human** (matched ≫ wrong on the easy pairs,
   no inversion) → a **separate, re-pinned promotion ticket** moves the term toward the frozen
   instrument. Not before.

## Scope notes

- **Bake-off (AC #3) is a separate verdict, not a promotion gate for this term.** split 6/8 > fused 5/8
  ("SPLIT WINS") reverses E-39's fused-wins now that ≥8 states give the comparison power — but the
  style-distance term does not touch dispatch. This belongs to the E-39 claim-1 thread; flagged, not
  bundled into the promotion decision.
- **Frozen instrument untouched.** No `measurements/**` edit, no gate-vocabulary change. This ticket
  delivered a referee and a recommendation, exactly as scoped.
- **The embarrassing result is the deliverable.** A green that hid the collapse or spun the 3/4 ordering
  as success would be the anti-hedge violation the project exists to avoid. The term failed in a
  specific, fixable way; naming that is the value.
