# T-160-04 Progress

Baseline: `npm run test:unit` **2184/2184 green** (Step 0).

## Status
- [x] Step 1 — `robustExtent` + `coverageOf` + WG9/9b
- [x] Step 2 — `registerRect` + `filledRect` + WG10/10b/10c/11
- [x] Step 3 — `constructWalls` branch + `closureOf` + WG11b/WG12/WG13
- [x] Step 4 — loop no-op confirmed (program already passed; comment added)
- [x] Step 5 — barn witness render + no-regress check
- [ ] Step 6 — review.md (in progress)

## Log
- Step 0: baseline recorded, 2184 tests.
- Step 1-3: added `robustExtent`, `coverageOf`, `registerRect`, `filledRect`, `closureOf` to
  `wall-generate.mjs`; branched `constructWalls` to the registered ring. +9 tests (WG9–WG13). Suite 2193 green.
- **DEVIATION from plan (important):** the selection metric is **`closureOf` (perimeter watertightness),
  NOT post-coverage.** Real-shell smoke exposed that the close ring is built FROM the posts, so its
  post-coverage is always ≈1.0 (it traces them) even when it is a gappy colonnade — coverage never picks the
  registered path. `closureOf` measures whether the perimeter forms a complete rectangle: barn close=0.701
  (colonnade) vs reg=1.000 (watertight) → registered wins; dense shells already closed → tie → keep Option
  B. `registerRect` still RANKS its axis ladder by coverage (that part of the AC is unchanged); only the
  registered-vs-close DECISION uses closure. Documented in the brush comment and review.
- Step 4: loop's `construct_walls` already passes `program` → registered path is live with no loop edit;
  added a clarifying comment. Smoke: barn long wall 48/48 columns solid; `wallSkin` did not throw.
- Step 5: rendered `barn-registered-beside.png`, `barn-closeonly-beside.png` (before/after),
  `cottage-registered-beside.png`, `gatehouse-registered-beside.png`. Barn straight runs close (quantitative
  closure 0.701→1.0; visually modest at oblique angle since close already solidified present columns).
  Cottage solid envelope + timber contrast, gatehouse clean stone ring — no regression.
- Registration fit quality (real shells): barn axis=identity cov=0.81 scale=(0.98,1.04) not-ambiguous
  not-polluted; cottage axis=identity cov=0.93 scale=(0.88,1.04). Failure mode (a) did NOT occur (no
  pollution); (b) did NOT occur (both fit unambiguously); (c) — barn closed at the unit/geometry level.
