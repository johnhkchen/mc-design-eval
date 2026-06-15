# T-160-04 Structure — file-level changes

The blueprint: which files change, the public interfaces, internal organization, ordering. Not code.

## Files touched

| File | Action | Why |
|---|---|---|
| `src/view/wall-generate.mjs` | **MODIFY** | Add `robustExtent`, `registerRect`, `coverageOf`; branch `constructWalls` to the registered ring when it out-covers the close ring. Export the new pures. |
| `src/view/wall-generate.test.mjs` | **MODIFY** | Add WG9–WG12: robust extent, registration ladder/axis, the WG1 straight-run companion (the AC's required test), multi-mass union preserves the L, no-regress on a dense ring. |
| `experiments/eval-alignment/autonomy-loop.mjs` | **MINIMAL / likely no-op** | Program is already passed into `constructWalls`; verify no change needed. If a flag is wanted to surface `ambiguous`, add it to the recorded round metadata only. |
| `docs/active/work/T-160-04/{progress.md,review.md}` | **CREATE** | RDSPI artifacts. |
| `docs/active/work/T-160-04/barn-walls-beside.png` (+ cottage/gatehouse) | **CREATE** | Witness renders (judge-free), if GL available. |

No deletions. `defect-eval.mjs`, `wall-skin.mjs`, `occupancy.mjs`, `roof-generate.mjs` **untouched**.

## New public surface in `wall-generate.mjs` (all PURE, exported for unit test)

### `robustExtent(cols, { pLo = 0.0, pHi = 1.0 } = {})`
- **In:** a `"x,z"` column set; optional percentile bounds.
- **Out:** `{ x0, x1, z0, z1, raw, robust, polluted }` where `raw` is the literal min/max bbox and the top
  fields are the percentile bbox. `polluted = true` when raw and robust differ by > 1 cell on any axis (the
  failure-mode-(a) flag). Default percentiles are the identity (raw) so existing behaviour is the base case;
  `constructWalls` calls it with a small trim (e.g. 0.02/0.98) to shed lone outlier posts.
- **How:** collect per-axis coordinate multiset; index at `floor(p*N)`/`ceil(...)`; deterministic sort.

### `coverageOf(ring, cols, tol = 1)`
- **In:** a candidate perimeter ring (`"x,z"` set), the actual wall-band columns, Manhattan tolerance.
- **Out:** fraction in `[0,1]` = |{ c ∈ cols : dist(c, ring) ≤ tol }| / |cols|. (Posts traced by the ring.)
- **How:** for each actual column, test membership of itself + its tol-ball against `ring`. No constants
  beyond `tol=1` (one voxel of adjacency — a unit, not a tuned knob).

### `registerRect(masses, cols, { trim = 0.02 } = {})`
- **In:** `program.masses` (array of `{rect:{x0,z0,w,d}}`), the wall-band column set.
- **Out:**
  ```
  {
    transform,           // (px,pz) -> {x:bx, z:bz}   affine: translate+scale+axisAssign
    ring,                // "x,z" set: union of each mass's transformed perimeter
    coverage,            // post-coverage of `ring` over `cols`
    axis,                // "identity" | "swap"
    scale: {sx, sz},     // per-axis (recorded; ~1 only if program units == voxel units)
    ambiguous,           // true => report, fall back to close path
    extent,              // the robustExtent used (carries `polluted`)
    reason,              // short human string for the record/log
  }
  ```
- **How (the ladder):**
  1. `ext = robustExtent(cols, {pLo:trim, pHi:1-trim})`.
  2. `pbb` = union bbox of all `masses[].rect` (program frame).
  3. For `axis ∈ {identity, swap}`: build `T` mapping `pbb → ext` (per-axis translate+scale; swap exchanges
     program-x↔build-x feed). `ring_axis = ∪ perimeterColumns(filledRect(T(mass.rect)))` over masses.
     `cov_axis = coverageOf(ring_axis, cols)`.
  4. Pick max `cov`; tie-break by min aspect error `|pw/pd − EX/EZ|`.
  5. `ambiguous = (bestCov < FLOOR) || (|cov_identity − cov_swap| < EPS && nearSquare(ext))`. `FLOOR`/`EPS`
     are **diagnostic** thresholds (they flip a *report* flag, never a per-subject selection) — documented
     as such to satisfy the self-grep discipline.
- **Determinism:** sorted iteration; integer rounding of transformed coords (round-half-up, fixed).

### `filledRect({x0,x1,z0,z1})` (private helper)
All `"x,z"` columns in the inclusive rectangle — the input to `perimeterColumns` so the ring is the FULL
clean bbox (closes straight runs), not the ragged occupancy.

## Change inside `constructWalls` (the branch)

Current step 2 (`F = cols ∪ close; ring = perimeter(F); bbox = bboxOf(F)`), replace with:

```
closeRing = perimeterColumns(cols ∪ closeColumns(cols, closeR))
reg = (program?.masses?.some(m => m.rect)) ? registerRect(program.masses, cols) : null
useReg = reg && !reg.ambiguous && coverageOf(reg.ring, cols) >= coverageOf(closeRing, cols)
ring = useReg ? reg.ring : closeRing
bbox = bboxOf(ring)            // faces/openings still index the chosen ring's bbox
```

- Steps 3 (solidify), 4 (opening rhythm), 5 (rebuild) are **unchanged** — they consume `ring`/`bbox`.
- The local-material fill (step 1's `localFill`) still applies per column; registered columns that had **no**
  occupancy under them fall back to `globalFill` (the modal band block) — so a newly-manufactured column
  still gets the build's dominant material, not `wallField`, unless the band was empty.
- `bbox` must come from the **chosen ring** (registered or close), not the old `F`, so the opening faces
  align to whichever envelope was built. This is the one subtle correctness point.

## Ordering of changes (so each step is independently verifiable)

1. Add `robustExtent` + `coverageOf` + tests (WG9). Pure, no behavioural change to `constructWalls`.
2. Add `registerRect` + `filledRect` + tests (WG10 ladder/axis, WG11 multi-mass L-union). Still no
   behavioural change.
3. Add the WG1 **straight-run companion** test (WG12) — currently it would *fail* (no registered path wired)
   → wire the `constructWalls` branch → it passes. This is the red→green that proves the AC.
4. Add a dense-ring **no-regress** test (registered ring == close ring on a full rect → identical output).
5. Verify loop is a no-op; run `npm run test:unit`; then the volume batch + barn witness render.

## Interfaces NOT changed

`constructWalls(occ, params)` signature is **unchanged** (program already flows in; new behaviour is
internal). `wallSkin`, `extractApertures`, `dressOpenings`, `roleBlock` callers in the loop are untouched.
The witness `walls-beside.mjs` inherits the new path through its existing `constructWalls` import.
