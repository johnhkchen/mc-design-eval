# T-209-01 — Research: relief-tolerant closure metric

Epic **E-54** / Story **S-209**. Make `eaveRingClosure` read a proud-dressed-but-closed wall as
**closed (≥0.9)** without letting an open colonnade read closed — so the T-208 +20 dressed batch stops
being rejected as a false reopen. Descriptive only; the decision is in `design.md`.

## 1. The metric and its consumers

`eaveRingClosure(occ, { floor, eaveY, openCols, program, coverageFloor })` lives in
`src/view/wall-generate.mjs:298`. It is the **single** form-readiness authority. Its scalar feeds:

- **`formReadyGate`** (`src/workshop/climb-gate.mjs:118`) — a DETAIL tool is eligible only when
  `closure ≥ FORM_READY_CLOSURE` (0.9).
- **`acceptsRound` / `formCredit`** (climb-gate) — form-move keep/rollback is decided on closure alone.
- **`acceptsBatch` guard (0)** (climb-gate:379) — the T-208 form-integrity guard: a batch that takes
  `closureBefore ≥ 0.9` to `closureAfter < 0.9` is rejected as "batch reopened the form".
- **`closeShell`** (wall-generate:368,404) — reports its own `closureBefore/After` *through the same
  function*, so the gate and the hand never disagree.
- **the runner** `experiments/eval-alignment/picture-climb.mjs` (lines 701, 747, 841) — computes
  `closureBefore/After` for every move and for the batch, always via `eaveRingClosure`.

So a fix localized to `eaveRingClosure` propagates to every consumer with **no other code change**.

## 2. How the metric works today (two paths)

1. Gather wall-band columns `cols` = every `"x,z"` with a cell at `floor ≤ y ≤ eaveY`.
2. If `program.masses[].rect` exists, `registerRect(program.masses, cols)` fits the program rectangle to
   `robustExtent(cols)` and returns a perimeter `ring` + a `coverage` (fraction of `cols` within tol-1 of
   the ring).
3. **Footprint path** — if `reg.coverage ≥ coverageFloor (0.5)`: closure = `present/ring.size`, where a
   ring column is *present* if `cols.has(c)` or `openCols.has(c)`. Proud cells sit **off** the ring and are
   ignored → relief does not crater it.
4. **Fallback path** — no program, or `coverage < 0.5`: raw `closureOf(perimeterColumns(cols))` — the
   bbox-perimeter occupancy of the band cloud. This path **is** proud-sensitive.

## 3. Root cause (measured, not assumed)

The ticket frames the bug as "the footprint ring censuses the exact ring, a proud-dressed wall reads
off-ring = open." **That is not what happens.** I ran `docs/active/work/T-208-01/closure-probe.mjs` and a
diagnostic that prints `reg.coverage` and the chosen path:

```
                cols   reg.coverage   path        eaveRingClosure
closed          268     0.728         FOOTPRINT   1.000
after gable     702     0.279         FALLBACK    1.000   (closed by luck — filled blob)
after relief    816     0.265         FALLBACK    0.068   ← the collapse
```

The collapse is the **coverage-floor fallback**, not the footprint census:

- The **gable roof is a solid prism** ("roof is prism-on-box", memory). Its base course sits at `y = eaveY`
  and covers the **entire footprint interior**. That floods `cols` 268 → 702 *before any relief*.
- A perimeter `ring` over a filled blob has low `coverage` (most cols are interior, far from the ring) →
  `0.279 < 0.5` → the build drops to the **raw fallback**. It still read 1.000 only because the blob's
  bbox-perimeter was solid.
- `relief_walls` then adds a **sparse proud fringe** (plinth + 224 quoin cells) one step outside the blob,
  extending the bbox by 1 on every side. The raw `closureOf` now measures a larger perimeter that the
  sparse fringe barely backs → **0.068**.

If I force the **footprint** census on the relieved build (ignore the coverage floor), it already reads
**0.964 ≥ 0.9** — the proud cells genuinely sit off the registered ring. So the footprint census is *not*
the problem; **falling off it is.**

### Why the synthetic fixture hid this (the Notes warning, confirmed)

`WG-CS11`/`WG-CS6` use `closedGatehouse()` — a **bare ring, no roof**. Its `cols` are only the perimeter,
so `coverage` stays high, the build never leaves the footprint path, and relief reads ≥0.9. The bug needs a
**roof flooding the band** to push onto the fallback — exactly the case the bare-ring fixture omits. This
is the Notes' "the synthetic fixture is how the proud-relief collapse slipped through T-202."

## 4. The second, deeper finding — the roof masks reopens

Excluding the roof's eave course is necessary for a *second* reason. With the full band `[floor..eaveY]`,
the roof base course backs **every** footprint column, so a **genuinely reopened wall reads 1.000** (the
holes are below the eave; the roof line above them still backs the ring). Measured: dropping a face from
the closed shell and re-gabling reads **1.000** on the footprint path. The roof line makes the full-band
footprint census blind to reopens.

Censusing **below the eave line** fixes both: it removes the flood (coverage recovers, the relieved build
returns to the footprint path) *and* restores reopen sensitivity (the roof no longer backs the holes).

Measured, censusing `[floor+1 .. eaveY-1]` and registering the ring from that same sub-band:

```
fixture            closure
seed (colonnade)   0.608   < 0.9   ✓ (T-206 invariant held)
closed             1.000
gabled             1.000
relieved (T-208)   1.000   ≥ 0.9   ✓ (the +20 dressed batch)
reopened (mid-face)~0.84-0.90 < 0.9 ✓ (extent-preserved hole)
```

## 5. The ±1-proud question (the ticket's prescribed mechanism)

AC1 asks for a "wall-plane **±1 proud** census." Measured against the evidence:

- The relieved build already reads **0.964 (eave-excluded) / 1.000 (eave+plinth-excluded)** with **no**
  proud tolerance — the wall cells (relief recolors **in place**, removing none — `recolorWallField`,
  wall-relief.mjs:42) still back the footprint ring; proud cells are off-ring.
- A ±1 *outward* tolerance (a ring column counts if a cell sits one step **away from the footprint
  centroid**) nudges relieved 0.964 → ~1.0 by forgiving the 4 proud-quoin corners — a margin gain.
- The same tolerance lifts the **colonnade** 0.608 → 0.667 (still < 0.9) and could lift a small reopen
  toward 0.9 — the failure mode AC names ("forgives a real ±1 gap"). The safe form forgives **only a
  genuine outward cell** (a true gap has nothing outward → unaffected).

So eave-exclusion is the **load-bearing** fix; ±1-outward-proud is a bounded margin add-on, safe only if it
forgives outward cells exclusively. The design weighs keeping it (honors AC1 literally) vs. dropping it
(simplest, widest reopen margin).

## 6. The registration limitation (must be surfaced honestly)

`registerRect` fits the program rect to `robustExtent(cols)` — it **scales to the data**. Consequences:

- A **mid-face hole** (corners/flanks hold the extent) → ring unchanged → hole reads open. ✓ detectable.
- A **whole-face removal** → the 2% `robustExtent` trim eats the few surviving corner cols → extent shrinks
  by 1 → the ring re-registers one row inward onto backed interior cells → **hole vanishes, reads ~1.0.**

So the metric detects *holes within a face*, not *the loss of a face*. Fixture 3 ("genuinely-reopened
closed shell") must therefore be an **extent-preserving mid-face hole** (as `WG-CS12` already is), and the
design must state plainly that full-face collapse is outside this metric's reach (the T-208 batch guard's
reopen catch likewise relies on closure cratering, which only happens on extent-preserving holes).

## 7. Constraints / invariants to hold (WG-CS suite, wall-generate.test.mjs)

- **WG-CS10**: colonnade seed ≈ 0.608 (< 0.9).  **WG-CS12**: reopened bare ring ≈ 0.839 (< 0.9).
- **WG-CS6/CS11**: relief on a closed (bare) shell ≥ 0.9.  **WG-CS8/CS1**: no-program fallback = raw band
  perimeter (1, 0.7917, …).  **WG-CS13**: metric == `closeShell.closureBefore` (agreement).
- **WG-CS9**: `openCols` forgives the declared aperture, not other holes (no double-count).
- Fixtures must be **real builds** (gatehouse seed + real `buildWallRelief` geometry), not synthetic
  one-segment drops (the Notes' explicit caution).
- Frozen instrument untouched; PURE (no GL/LLM/IO); `npm test` green.
