# T-209-01 — Design: relief-tolerant closure metric

Decision grounded in `research.md` and four prototypes run against the **real** gatehouse build (seed →
`closeShell` → gable → `buildWallRelief`), not synthetic stand-ins.

## The decision

Change **only** `eaveRingClosure` (`src/view/wall-generate.mjs`). Two coordinated edits to the
program-footprint path:

1. **Census the wall plane BELOW the eave line.** Gather the registration/footprint columns over
   `[floor .. eaveY-1]` instead of `[floor .. eaveY]`. The full band stays available for the no-program
   fallback so its committed readings are byte-unchanged.
2. **±1 outward-proud tolerance** on the ring census: a ring column is *backed* if a wall cell sits **on**
   it, on a **declared-open** column (`openCols`), **or one step OUTWARD** (away from the footprint
   centroid). A genuine gap has nothing outward → not forgiven.

The coverage-floor gate and the fallback are **left exactly as they are**; edit (1) lets the wall cols
clear the floor on their own.

### Why these two, and what each buys

| | colonnade seed | closed | relieved (T-208) | reopened (mid-face) |
|---|---|---|---|---|
| today (full band) | 0.608 | 1.000 | **0.068** (fallback) | masked → ~1.0 |
| eave-excluded, proud OFF | 0.608 | 1.000 | **0.964** | 0.794 |
| eave-excluded, proud ON | 0.667 | 1.000 | 0.964 | 0.814 |
| want | <0.9 | — | ≥0.9 | <0.9 |

- **Eave-exclusion is load-bearing.** The gable roof is a solid prism whose base course at `y=eaveY` floods
  the band, which (a) dilutes `reg.coverage` to 0.27 < 0.5 → the proud-sensitive fallback fires → 0.068, and
  (b) backs every footprint column → masks reopens. Dropping that one row removes the flood: coverage
  recovers (the relieved build returns to the footprint path → 0.964 ≥ 0.9) **and** reopen sensitivity
  returns (the roof no longer backs the holes).
- **±1-outward-proud** delivers AC1's literal "wall-plane ±1 proud census, not only the exact ring." On this
  build it is neutral-to-margin (it doesn't change relieved 0.964, lifts the colonnade 0.608→0.667 and the
  reopen 0.794→0.814 — all still correctly classified). It exists so a proud quoin/plinth that displaces the
  wall plane outward by one is forgiven *only when a real outward cell is there*, never a bare gap.

All four AC fixtures pass with **both** tolerance settings — proud tolerance is a guarded margin, not a
load-bearing crutch (recorded honestly per anti-hedge).

## The distinguisher (proud-closed vs proud-open), made concrete

The ticket's distinguisher — "differ by interior fill / continuity, not the ring" — resolves to:

- A **closed** wall is continuous on the footprint ring **through the wall height below the eave**;
  `relief_walls` recolors the field **in place** (`recolorWallField` removes no cell) and only **adds**
  proud cells outside, so the wall plane still backs the ring.
- An **open** colonnade / reopened wall has columns with **no** cell anywhere `floor..eaveY-1` and **nothing
  outward** — neither the on-ring test nor the proud-outward test forgives them.

The roof's eave course (which backs *everything*) is the false "continuity" signal; excluding it is what
makes the distinguisher real.

## Options considered and rejected

**A. Take the footprint path regardless of coverage, keep the full band.** Relieved → 0.964 (good), but the
roof base course masks reopens (reopened reads ~1.0). Fails fixture 3. Rejected: the eave course must go.

**B. Census `[floor+1 .. eaveY-1]` (exclude the proud plinth too).** Relieved → **1.000** (more margin,
plinth no longer inflates the extent). Rejected as the default: it removes the floor course, needing a
"≥2 courses" guard for short/single-storey walls, and is a larger deviation from the committed band for a
0.036 margin gain. Kept as the **documented next lever** if 0.964's margin proves fragile.

**C. ±1-proud tolerance only, keep the full band (the ticket's literal prescription alone).** Fails: the
relieved build never reaches the footprint path (coverage 0.27 → fallback), so ±1-proud on the ring is
never consulted — it stays 0.068. This is the central research finding: the ticket's hypothesized mechanism
is insufficient without eave-exclusion. Documented in `research.md §5`.

**D. Lower / remove the coverage floor for the program path.** Tempting (a bad registration self-reports as
low closure), but it's a broad behavioral change to a gate other tests and `closeShell` depend on, and it
doesn't fix reopen-masking. Rejected in favor of the surgical eave-exclusion, which lets coverage recover
without touching the gate.

## Known limitation (surfaced, not hidden)

`registerRect` fits the program rect to `robustExtent(cols)` — it **scales to the data**. A **whole-face
removal** shrinks the extent by one (the 2% trim eats the surviving corners) and the ring re-registers a row
inward onto backed interior cells, so a *lost face* reads ~1.0. The metric detects **holes within a face**
(extent-preserving), not the loss of a face. Therefore:

- Fixture 3 is an **extent-preserving mid-face hole** (21 of a 27-wide face → 0.794/0.814), as `WG-CS12`
  already is.
- The T-208 batch form-integrity guard inherits the same reach: it catches a reopen only when closure
  craters, i.e. an extent-preserving hole. A full-face collapse is out of this metric's scope and is named
  as a residual for E-54's capstone, not silently assumed handled.

## Consumer impact (no other code changes)

`eaveRingClosure` is the single authority. `formReadyGate`, `acceptsRound`/`formCredit`, `acceptsBatch`
guard (0), `closeShell`'s internal report, and the runner all read the improved scalar automatically. The
**+20 dressed batch** survives because `closureBefore` (post-gable, 1.000) → `closureAfter` (post-relief,
0.964) are **both ≥ 0.9**, so the form-integrity guard no longer fires "batch reopened the form."

## Risk / falsification

- ±1-proud forgiving a real gap → the colonnade reads closed. **Guarded:** forgiveness requires a genuine
  outward cell; measured colonnade 0.667 < 0.9, reopen 0.814 < 0.9. If any fixture's margin proves thin,
  drop ±1-proud (eave-exclusion alone passes all four) — documented fallback.
- Existing WG-CS values shift outside tolerance → re-derive from the real fixtures and update the assertion
  with rationale (these are diagnostics on real builds, not frozen-instrument pins). Verify in `npm test`.
