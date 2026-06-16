# T-173-01 — Design

Decide what "the faithful build" is, what to measure, and how — grounded in Research. The hard input:
**no single build is both materially faithful (S-171) and roof-form faithful (S-172).**

## The decision space

### What counts as "faithful" for the crater question?
The E-40/T-170-02 over-cap was driven by **material** `replace` tags (the matched build's basalt walls
read as wrong-style even vs the stone concept). The crater separation depends on whether the *matched*
condition escapes the cap. So the axis that matters for THIS measurement is **material** faithfulness —
which is precisely what S-171's recognition build fixes (stone walls, `nWrongStyle=0`, self-concept
2→42). The roof prism is a *form* divergence that (a) the judge tags `add`/absent, not `replace`, and
(b) is the **same constant** in both the matched and wrong-style conditions (same build, swapped
concept), so it cannot differentially separate them.

### Option 1 — Measure the recognition build (S-171). **CHOSEN as PRIMARY.**
Point the crater at `benchmarks/sculpture/recognition` (stone walls, prism roof). It is the only build
that fixes the material axis the over-cap keyed on.
- **Pro:** directly tests the falsifiable claim — does a *materially* faithful matched build escape the
  cap that floored the old build? Self-concept already says it reads as matched (42, nWrongStyle=0).
- **Con:** roof is still a 53 % dark_oak_planks prism → not the *full* S-171+S-172 build; the roof
  divergence will surface as `add` majors in every condition (constant, non-separating).

### Option 2 — Measure the roof-covering build (S-172). **CHOSEN as CONTRAST.**
Point the crater at `builds/gatehouse/roof-covering` (covering roof, basalt walls).
- **Pro:** triangulates the axis — if this *re-floors* on MATCHED, it confirms material (not roof-form)
  is what the term keys on; if it separates, roof-form matters too.
- **Con:** walls are materially wrong (77 % basalt) → expected to cap MATCHED. Not "the faithful build";
  it is the control that proves *which* faithfulness axis drives the crater.

### Option 3 — Assemble a true S-171+S-172 build (stone walls + covering roof). **REJECTED (scope/risk).**
Graft S-172's covering onto S-171's stone envelope into one artifact, render, measure.
- **Rejected because:** the two builds are on **different pipelines** with different footprints
  (recognition 2 287 placements / workshop-realized vs generate-first 4 635 / GLB-voxel) — not cell-for-
  cell mergeable. Re-running the recognition `compile/realize` with `generateRoof` covering instead of
  `roofBlocks` is exactly the path T-172-01 FINDINGS scoped OUT (trips the `gableWallKeys` conformance
  gate + needs a judge-pin rotation). A hand-grafted artifact would also need a fresh GL render
  (fragile). Doing it here would silently expand T-173-01 into the integration ticket E-42 deferred.
- **This rejection is itself a reported result** — the anti-hedge "faithfulness couldn't be (fully)
  reached → the *build pipeline* is the standing wall" branch is *partially true for the combined axis*,
  and we name it plainly rather than fake a single faithful build.

### Option 4 — Re-pin PROGRAM to the recognition program. **REJECTED.**
Use `recognition/gatehouse.program.json` as the diagnose `programBlock` instead of the synthetic stand-in.
- **Rejected because:** it changes a second variable. The recognition program is the model's own faithful
  *reading* of the build; injecting it would bias the matched score upward (the program would describe
  exactly what is built). Holding `PROGRAM` fixed at the T-170-02 synthetic stand-in keeps the **build
  renders as the sole changed variable**, making A_faithful directly comparable to A_old=8. The synthetic
  program ("stone walls / steep gable / arched gate") is generic-accurate for the stone build anyway.

## Chosen approach

Measure **both** Option 1 (primary) and Option 2 (contrast), holding `PROGRAM` + concepts + conditions
fixed, changing only `CRATER_BUILD`:

1. **PRIMARY** — recognition build → `corpus-referee-faithful.json`. Answers AC #1 (faithful matched vs
   wrong-style; spread vs ±12 and vs E-40 2/0/2/0 and T-170-02 8/14/18/46).
2. **CONTRAST** — roof-covering build → `corpus-referee-roofcovering.json`. Triangulates the axis.

Both with `CRATER_ONLY=1` (skip agreement + bake-off — out of scope, and ~40 wasted calls each) and
`REFEREE_OUT_DIR=docs/active/work/T-173-01`.

### Harness changes (minimal, additive — the "one-line follow-up" T-170-02 named)
- `CRATER_BUILD` becomes env-overridable: `process.env.CRATER_BUILD ?? "builds/gatehouse/new-roof"`.
  Default unchanged → E-40/T-170-02 reproducibility preserved.
- `CRATER_ONLY` env gate: when set, run only Section A and guard only the crater assets (skip the corpus
  pair/single guard loops + the agreement/bake-off sections). Keeps the existing default path identical.
- No other harness logic touched. `PROGRAM`, conditions, scoring, output schema all unchanged.

### Render staging (no GL)
The recognition renders are `view-gatehouse-{az}.png` (non-standard infix). Stage them + the artifact
into `builds/gatehouse/faithful/view-{az}.png` (standard names) by copy, so `CRATER_BUILD` points at a
clean dir without teaching the harness a render-prefix. The roof-covering build already uses standard
names → no staging.

## Why this lands the falsifiable claim honestly

- If **PRIMARY separates** (A ≫ B, outside ±12): the term works on a *materially* faithful build — the
  crater the E-40/T-170-02 fixture could never show. We report it, with the honest caveat that the roof
  prism (form axis) is unfixed and a *fully* faithful single build was not assembled (Option 3 deferred).
- If **PRIMARY does not separate**: localize precisely — is MATCHED still capped (term *scale* gate, hand
  back to re-calibration) or did WRONG fail to cap (under-penalty)? The CONTRAST run disambiguates the
  axis.
- The **CONTRAST** (roof-covering, basalt walls) is predicted to re-floor MATCHED; if it does, it is the
  clean proof that material — not roof-form — is what the term keys on, and that S-171 is the build that
  matters. If it *also* separates, roof-form carries signal too.

Whichever way it lands is the result. We do not soften a non-separation into a partial win, and we do not
fake a combined build to manufacture a crater.
