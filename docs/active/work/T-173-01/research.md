# T-173-01 — Research

Epic **E-42** / Story **S-173**. The payoff measurement of the E-40 → E-41 → E-42 arc: re-run the
corpus-referee crater on a *faithful* build (S-171 material faithfulness + S-172 constructed roof) and
record whether matched ≫ wrong-style finally separates. Descriptive only — what exists, where, how it
connects.

## The measurement harness

`experiments/eval-alignment/corpus-referee.mjs` (the referee). Three sections, one result doc; metered;
**not** in `npm test`. Only **Section A — CRATER** is in this ticket's scope (AC #1 is purely
matched-vs-wrong on the gatehouse build; agreement + bake-off use the corpus, not the gatehouse).

Crater mechanics (lines 118–159):
- `CRATER_BUILD` is **hardcoded** to `builds/gatehouse/new-roof` (line 119). The renders consumed are
  `${CRATER_BUILD}/view-{az}.png` for the 4 `MULTI_ANGLE_GATE.azimuths` (`+x+z +x-z -x-z -x+z`) and
  `view-+x+z.png` for the beside composite.
- `PROGRAM` (lines 67–70) is a **synthetic** fixed gatehouse program (stone walls / steep gable / arched
  gate). It only fills the textual `programBlock` in the diagnose prompt; it is NOT a recognition output
  (labelled a stand-in). Shared across all three sections.
- `CRATER_CONDITIONS` (lines 120–125): **A-matched** (rustic concept + rustic pack), **B-arc** (classical
  arch + guildhall pack), **B2-chapelle** (gothic + guildhall pack), **C-control** (classical concept +
  RUSTIC pack — isolates pack vs concept-image).
- Per condition: `VOTES=2` diagnose calls → `styleFidelityScore`; `scoreMean` rounded. `NOISE=12`.
  `cratered = (A−B) > 2·NOISE`. `collapsed = A≤12 && B≤12` (the over-penalty floor signature).
- Output env-gated (T-170-02): `REFEREE_OUT_DIR` (beside-PNGs) and `REFEREE_RESULTS` (JSON). Defaults
  point at the committed E-40 baseline — must override both so the faithful run does not clobber it.

## The score (what "separates" means mechanically)

`src/workshop/bakeoff-score.mjs`:
- `itemStyleClass(item)` (line 61): with E-41 typed `kind` — `replace ⇒ "wrong-style"`, `add ⇒ "absent"`,
  `remove ⇒ "match"`; fallback on present/missing when `kind` is null.
- `styleFidelityScore` (line 152): each `"wrong-style"` item adds `major + distance` penalty AND, if any
  exist, **caps** the score at `WRONG_STYLE.cap`. `"absent"`/`"match"` items take the ordinary severity
  penalty (no cap).

**So the crater separates iff** the WRONG concepts make the judge tag the build's rustic features as
`replace` (wrong-style → cap → low) while the MATCHED concept yields only `add` (missing-detail → no cap
→ high). The E-40/T-170-02 failure was that the *matched* condition ALSO capped, because the old build's
walls were materially wrong (basalt) → `replace` even vs the stone concept.

## The baselines this run compares against

- **E-40** (`results/corpus-referee.json`, committed): A/B/B2/C = **2 / 0 / 2 / 0**, `collapsed=true`. The
  over-cap floor — both matched and wrong floored.
- **T-170-02 / E-41** (`results/corpus-referee-kind.json`): **8 / 14 / 18 / 46**, `collapsed=false`,
  `cratered=false`. Typed `kind` removed the over-cap (control 0→46) but the crater still did not
  *separate* — because the held-fixed `new-roof` build is itself material-wrong (MATCHED `replaceRate`
  0.71 > WRONG 0.40). T-170-02 explicitly handed the residual to E-42: *make the build faithful, then
  re-run here.* It even named the re-run command and called the `CRATER_BUILD` repoint a "one-line
  follow-up, noted not done here."

## The candidate faithful builds (the central decision input)

Block census (this ticket, offline):

| build | walls | roof | faithful? |
|-------|-------|------|-----------|
| `builds/gatehouse/new-roof` (current CRATER_BUILD, OLD) | 35.8 % polished_basalt | 52.8 % spruce_planks prism | neither |
| `benchmarks/sculpture/recognition/gatehouse.*` (**S-171**) | **46.5 % stone_bricks** (polished_basalt gone) | 53.1 % dark_oak_planks **prism** | **material ✓**, roof-form ✗ |
| `builds/gatehouse/roof-covering` (**S-172**) | 77.1 % polished_basalt | 15.1 % spruce_stairs **covering** (prism killed) | material ✗, roof-form ✓ |

**Key finding, surfaced before any spend:** *no single existing build is both materially faithful AND
roof-form faithful.* S-171 (T-171-01) and S-172 (T-172-01) fixed the two axes on **two different
pipelines** — S-171 on the workshop/recognition path (`compile→realize`, `roofBlocks`), S-172 on the
generate-first / GLB-voxel path (`generateRoof` covering). They were never integrated into one artifact.
T-172-01 FINDINGS states wiring `generateRoof`'s covering into the recognition `compile/realize` path
"trips the not-yet-`gableWallKeys`-aware conformance gate and needs a judge-pin rotation — out of this
ticket's scope," and explicitly leaves to T-173-01 the decision of *which build to repoint the referee
at.*

## Render assets (no GL needed)

Both candidate builds are **already rendered** — measuring existing PNGs, so this ticket needs **no GL
render**:
- recognition: `benchmarks/sculpture/recognition/view-gatehouse-{az}.png` (4 azimuths, Jun 16 09:13) —
  note the non-standard `gatehouse-` infix.
- roof-covering: `builds/gatehouse/roof-covering/view-{az}.png` (standard names).
- All crater concept assets present (rustic concept, arc-A-flash, chapelle-A-flash).

## Material-faithfulness axis is the E-40/T-170-02 driver

The over-cap T-170-02 localized was `replaceRate` (material `replace` tags) on the old build — i.e. the
*material* axis. S-171's recognition build is the build that fixes exactly that axis: stone_bricks walls,
`polished_basalt` gone, self-concept already lifted **2 → 42** with `nWrongStyle=0` (read as *matched*,
not wrong-style). The roof prism that remains is a *form* divergence (T-171 review: the residual majors
are `add`/absent missing-detail items, not material `replace`).

## Constraints / assumptions

- Frozen instrument (`measurements/**`) untouched; `npm test` must stay green. The change is additive to
  an `experiments/` harness + new draft evidence, matching the no-test posture of the sibling harnesses.
- Spend is authorized by the ticket (the re-run IS the deliverable). Guard-before-spend is the
  established pattern (`GUARD_ONLY=1`).
- Holding `PROGRAM` + concepts + conditions FIXED and changing only the build renders is the cleanest
  controlled comparison against the T-170-02 baseline (same everything, faithful build vs old build).
