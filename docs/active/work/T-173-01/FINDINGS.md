# T-173-01 — FINDINGS

**Does the crater separate? YES — for the first time in the E-40 → E-41 → E-42 arc, the materially-
faithful build separates from its wrong-style twin (A-matched 28 ≫ B-arc 0, spread 28, well outside the
±12 noise and the 2·NOISE=24 crater bar).** It is a *genuine but fragile* separation: it is carried by
the wrong-style conditions capping on the stone build, the margin is marginal vs the gothic
triangulation, VOTES=2 noise is large, and the matched build itself still earns residual `replace`
tags. The honest recommendation moves from T-170-02's flat DO-NOT-PROMOTE to **PROMOTE-PENDING-
CONFIRMATION** — the term produced the within-family gradient; confirm robustness (higher votes, a single
fully-faithful build) before freezing it.

## The spread table (the headline, AC #1)

| build | A-matched | B-arc | B2-chapelle | C-control | A−B | crater? |
|-------|-----------|-------|-------------|-----------|-----|---------|
| **E-40 baseline** (old build) | 2 | 0 | 2 | 0 | 2 | collapsed (both floored) |
| **T-170-02** (old build, typed kind) | 8 | 14 | 18 | 46 | −6 | no (matched < wrong) |
| **PRIMARY — faithful S-171** (stone walls) | **28** | **0** | 20 | 8 | **+28** | **CRATERED** |
| CONTRAST — roof-covering S-172 (basalt walls) | 40 | 24 | 4 | 34 | +16 | did not crater |

`NOISE=12`; crater bar `A−B > 24`. PRIMARY A−B = 28 clears it; A−B2 = 8 does **not** (the gothic
triangulation stays inside noise — one chapelle vote scored an anomalous 40). PRIMARY votes:
A=40/16, B=0/0, B2=40/0, C=0/16 — the run-to-run spread is large at VOTES=2.

## What actually drives the separation (the per-item audit trail)

The score caps on the **count of `replace` (wrong-style) items**, not on a smooth distance. From the
committed `corpus-referee-faithful.json` item trail (vote 1):

- **A-matched (faithful):** `OPENING:add/absent, WALL:replace/wrong-style` — **1** wrong-style → score
  40 (vote 2 earned 2 → 16). The stone build is *materially* faithful but **not clean**: the WALL
  occasionally reads `replace`, and the residual dark_oak_planks **prism roof** (S-172 not integrated
  here) reads `replace` on some votes. So matched is itself partly capped.
- **B-arc (classical arch concept):** `ROOF:replace, WALL:replace` — **2** wrong-style, consistently →
  floored to **0/0**. The rustic stone build reads as two wrong-style departments against a classical
  concept. *This is the term working as designed.*
- **B2-chapelle (gothic):** 1 replace on vote 1 (→ 40) but 2 on vote 2 (→ 0); the noise that keeps A−B2
  inside the band.
- **C-control (classical concept + rustic pack):** 8 — low, as a control should be; the classical
  concept does not match the stone build.

**So the crater is real and mechanistically clean: the wrong-style concept (B-arc) reliably earns 2
`replace` departments and floors; the matched concept earns 0–1 and clears the bar.** The separation is
*the term penalizing the rustic build as wrong-style against a classical concept* — the within-family
gradient the arc was chasing.

## Axis triangulation — material faithfulness is the driver (with a noise caveat)

The CONTRAST build (S-172 roof-covering: covering roof, but 77 % polished_basalt **walls** — materially
wrong) **did not crater** (A=40, B=24, spread 16 < 24). It fails for the predicted reason — a materially-
wrong build cannot reliably push the wrong-style conditions down: on these votes B-arc earned only **1**
`replace` (ROOF) and stayed at 24. So:

- **Material faithfulness (S-171, stone walls) is what lets the wrong conditions floor → the crater.**
  The covering roof alone (S-172) does not separate; the stone walls do.
- **But the margin between "craters" and "doesn't" is one `replace` tag** (B-arc earning 2 vs 1), which
  is a VOTES=2 coin-flip. The `kindReliability` metric even *disagrees with the score direction*: PRIMARY
  reads `NO CONTRAST` (−0.19) yet craters; CONTRAST reads `DISCRIMINATES` (+0.21) yet does not. The score
  separation here rides on `replace`-count variance, not yet on a robust kind signal.

## The standing wall (named plainly, not softened)

**There is no single build that is both materially faithful AND roof-form faithful.** S-171 (stone
walls) and S-172 (covering roof) were fixed on **two different pipelines** (workshop/recognition
`compile→realize` vs generate-first GLB-voxel) and were never integrated into one artifact. T-172-01
scoped the integration out (wiring `generateRoof` covering into the recognition path trips the
`gableWallKeys` conformance gate + needs a judge-pin rotation). So:

- The PRIMARY "faithful" build is **material-faithful with a residual prism roof** — that prism is
  exactly the WALL/ROOF `replace` that depresses A-matched to 28 and one vote to 16.
- A *fully* faithful build (stone walls + covering roof) would plausibly clean those residual `replace`
  tags, lift matched, and separate more robustly. **That integration is the remaining build-side wall**
  — the blocker moved from T-170-02's "no faithful build at all" to "no single *fully*-faithful build."

## Recommendation — PROMOTE-PENDING-CONFIRMATION

Updated with this evidence (was T-170-02 flat DO-NOT-PROMOTE):

- **NOT re-calibrate.** The term is not over-penalizing the close style here — it produced a real crater
  (A 28 ≫ B 0). The E-40 over-penalty is gone; the term works in direction.
- **NOT an unconditional promote.** The separation is fragile: marginal vs the gothic triangulation
  (spread 8, inside noise), VOTES=2 variance is large (A 40/16), the matched build still earns residual
  `replace` from the un-integrated prism roof, and the `kindReliability` metric disagrees with the score
  direction on this run.
- **PROMOTE-PENDING-CONFIRMATION:** the direction is validated — the first separation in the arc. Before
  freezing the term, confirm robustness with (1) **VOTES ≥ 4–6** to tighten the means and verify A−B
  clears 2·NOISE consistently, and (2) a **single fully-faithful build** (S-171 walls + S-172 covering
  integrated) so the matched condition stops self-capping on the prism roof. Both are **creation-loop /
  build-side** tasks, not term-scale re-calibration — which is itself the finding: the residual gate is
  the *build*, not the measure.

## Anti-hedge note

The claim landed in its **primary success branch**: a materially-faithful matched build *did* score far
above its wrong-style twin (B-arc), spread 28 outside ±12 — the crater the E-39/E-40 fixture could never
show because every prior "matched" build was itself unfaithful. I did **not** soften the qualifications:
the separation is fragile (one-`replace`-tag coin-flip at VOTES=2), marginal vs the gothic
triangulation, the matched build is not clean (residual prism-roof `replace`), the kind metric disagrees
with the score direction, and no single *fully*-faithful build exists. Both the crater AND its fragility
are auditable from the committed per-item `kind`/`styleClass` trails in
`results/corpus-referee-faithful.json` and `corpus-referee-roofcovering.json`.
