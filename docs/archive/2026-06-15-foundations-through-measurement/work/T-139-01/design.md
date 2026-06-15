# T-139-01 Design — skirt-aware eave reference

Decision grounded in the Research evidence and **prototyped against the real committed artifacts
this session** (cottage, barn, barn--saltcrag) plus the synthetic fixtures.

## The shape of the problem

A row can be wider than the dominant wall body for three reasons:
1. **Eave overhang** — high in the silhouette, the top of the walls (the barn's 1-row 28 course
   above 26-wide walls). **Keep** — it IS the eave.
2. **Wall body itself is the widest layer** — the normal house; the eave course equals the wall
   width (`gableHouse`/`triangle`: eave course 10/12 = wall width). **Keep** — nothing to strip.
3. **Plinth / water-table course** — *low* in the silhouette, wider than BOTH the walls above and
   the eave course (the cottage's 29 over 28-wide walls at yFromBottom 3–4). **Strip** — it must
   not anchor the eave.

The separating signal is **position**: a plinth lives near the base; an eave overhang lives high.
A rule that ignores position cannot tell them apart.

## Options considered

### Option A — Structural run-count (dominant extent = the k-th widest row). REJECTED.
Anchor the eave on `refExtent` = the widest extent that spans at least `ceil(minRunFrac × fgRows)`
rows; a 2-row plinth doesn't qualify, the wall body does. Clean, one parameter, no position prior.
**Rejected on measured evidence:** the barn's x-view eave is a *legitimate 1-row overhang* (extent
28, one row, above 26-wide walls). A run-count demotes it identically to a plinth — measured barn
`refExtent 28→26`, which **moves the barn's eaveRow and breaks the AC #2 byte-identity** on the
named skirt-free check. Run-length cannot distinguish a high eave from a low plinth. Fatal.

### Option B — Explicit "wider than the wall column above it". PARTIAL.
For each row, compare to the row(s) directly above; flag a row that protrudes past its immediate
neighbour above. Closer to the AC wording, but: (a) noisy — a single antialiased pixel step trips
it anywhere in the silhouette, including mid-roof; (b) still needs a position guard, else the
barn's eave overhang (wider than the roof course above it) is flagged. Folds into Option C once a
position prior is added; B alone is under-constrained.

### Option C — Bottom-region skirt strip (CHOSEN).
A **skirt** is a row that is (i) inside the **bottom `skirtBandFrac` of the silhouette height**,
AND (ii) **strictly wider than the body above that region** by more than the eave tolerance band.
The eave anchors on the body width, never on a skirt row.

```
extents[], maxExtent, fgRows as today
firstFg, lastFg = first/last foreground row   (lastFg === groundRow)
H        = lastFg − firstFg + 1
bandRows = floor(skirtBandFrac × H)
bottomStart = lastFg − bandRows + 1            // inclusive
bodyMax  = max extent over rows [firstFg .. bottomStart−1]   // the body ABOVE the region
skirt(y) = bottomStart > firstFg               // there is a body to compare against
           && y >= bottomStart                 // inside the bottom region
           && extents[y] > bodyMax             // strictly wider than the body
           && extents[y] >= bodyMax / eaveWidthFrac   // beyond the eave tolerance band (AA guard)
refExtent = anySkirt ? bodyMax : maxExtent     // == maxExtent for every skirt-free mask
eaveRow  = topmost row with extents[y] >= eaveWidthFrac × refExtent  AND NOT skirt(y)
ridgeRow = topmost row with extents[y] >= ridgeMinWidthFrac × maxExtent   // UNCHANGED, global max
```

**Why each piece:**
- **Bottom-region prior (`skirtBandFrac`)** is the *only* new free constant. It encodes the
  architectural universal "plinths/water-tables live in the lowest fifth of an elevation" — exactly
  the same class of declared, subject-blind prior as `eaveWidthFrac 0.98`. It is what makes the
  barn's high eave overhang safe (it sits above the region → counts as body, not skirt).
- **Protrusion threshold reuses `eaveWidthFrac`**, not a new constant: a skirt must poke *beyond the
  body's own eave-tolerance band* (`bodyMax / 0.98 ≈ bodyMax × 1.0204`). This is the inverse of the
  eave band — symmetric, principled, and it absorbs 1-pixel antialiasing on concept-side masks (a
  101-vs-100 px step is inside the band → not a skirt). **Net new parameters: one.**
- **Ridge + `maxExtent` reporting stay on the GLOBAL max.** The ticket scope is the eave; the ridge
  protrusion guard (T-118) is unrelated and already correct. Leaving it untouched makes the
  monotone proof stronger — for the cottage the ridge line is *also* byte-identical; only the
  eave moves.
- **`refExtent === maxExtent` for every skirt-free mask** ⇒ identical eave line ⇒ AC #2 by
  construction. Setting `skirtBandFrac = 0` (an opt) collapses the bottom region to nothing →
  recovers the **legacy ruler exactly** — the "both rulers, side by side" knob and the mechanism of
  the monotone proof.

## Prototype results (measured this session, not estimated)

| subject        | view | OLD eaveH/ridge | NEW eaveH/ridge | refExtent | skirt | verdict |
|----------------|------|-----------------|-----------------|-----------|-------|---------|
| cottage        | x    | 4 / 3           | 21 / 3          | 28        | true  | corrected |
| cottage        | z    | 4 / 6           | 12 / 6          | 27        | true  | corrected |
| **barn**       | x,z  | 12,25           | 12,25           | 28,48     | false | **IDENTICAL** |
| barn--saltcrag | x,z  | 12,25           | 12,25           | 28,48     | false | **IDENTICAL** |
| gableHouse z   |      | 5 / —           | 5 / —           | 10        | false | **IDENTICAL** |
| triangleOnBox  |      | 5 / —           | 5 / —           | 12        | false | **IDENTICAL** |

Assembled ratios: **cottage 5.5 / 0.8182 → 1.8333 / 0.4545** (the corrected ≈1.7/0.45 family);
**barn & barn--saltcrag unchanged at 2.1667 / 0.5385 / aspect 1.7143**.

## Chosen parameter

`skirtBandFrac = 0.2` — the cottage plinth sits at 16% of the elevation height; 0.2 is the lowest
round fifth that contains a sill-height water-table course without reaching wall mid-height. Frozen,
declared in `PROPORTION_DEFAULTS`, documented in `packs/README.md`. **Not subject-conditional** — no
`if subject` anywhere; it is a width-vs-height prior applied to every mask uniformly.

## Rejected alternatives (recorded, AC #1/#4)

- **Raise `eaveWidthFrac` toward 1.0** — would not help: the plinth rows clear *any* fraction of
  their own (maximal) extent; the problem is the *reference*, not the band width.
- **Subtract a fixed plinth height (e.g. "ignore the bottom 2 rows")** — a per-building constant,
  forbidden by AC #1; also wrong for skirt-free builds.
- **Option A run-count** — breaks the barn (measured). Documented above.
- **Detect the plinth from the program/material seam** (it's a different role than the wall) — couples
  a pure silhouette metric to program semantics; violates "one rule, two substrates" (the concept
  silhouette has no program). Rejected.

## Known limitation (for Review)

A **continuous bottom taper** (ziggurat/stepped pyramid, monotonically widening to the base) trips
the skirt test on its bottom `skirtBandFrac` rows (measured: ziggurat eaveH 0→1). No committed mask
is such a form; the bounded region caps the shift; the realistic house space (eave course ≥ wall
width) is provably safe. Documented, not repaired — out of this ticket's scope.
