# T-173-01 — Review

**Outcome: the falsifiable claim landed in its primary success branch.** A materially-faithful matched
build (S-171, stone walls) scored **far above its wrong-style twin** — A-matched **28** ≫ B-arc **0**,
spread **28**, outside both the ±12 noise and the 2·NOISE=24 crater bar. **The crater separates for the
first time in the E-40 → E-41 → E-42 arc.** It is genuine but **fragile**, and no production source
changed; frozen instrument untouched; `npm test` 2249/0.

## What changed

### Modified (additive, default path byte-unchanged)
- `experiments/eval-alignment/corpus-referee.mjs` — two env gates:
  - `CRATER_BUILD` now `process.env.CRATER_BUILD ?? "builds/gatehouse/new-roof"` (the "one-line
    follow-up" T-170-02 named) — repoints the crater at any build dir without touching PROGRAM/conditions.
  - `CRATER_ONLY=1` runs Section A only (guards only crater assets; skips the corpus agreement + bake-off
    sections, their guard loops, and the E-39 baseline load; writes `{ skipped: "CRATER_ONLY" }`
    sentinels; guards the summary prints). Default unset → all three sections run exactly as before, so
    the committed E-40 / T-170-02 baselines stay reproducible.

### Created (drafts — none under `measurements/`, none in `npm test`)
- `builds/gatehouse/faithful/` — staged S-171 recognition build: `artifact.json` + 4 `view-{az}.png`
  **byte-copies** of the committed recognition build (renamed from `view-gatehouse-{az}`), `SOURCE.md`
  provenance. (`cmp`-verified identical; not a new render — no GL touched.)
- `experiments/eval-alignment/results/corpus-referee-faithful.json` — PRIMARY crater evidence (S-171).
- `experiments/eval-alignment/results/corpus-referee-roofcovering.json` — CONTRAST crater evidence
  (S-172).
- `docs/active/work/T-173-01/{research,design,structure,plan,progress,FINDINGS,review}.md` + the
  `crater-*.png` beside composites (PRIMARY in `T-173-01/`, CONTRAST in `T-173-01/contrast/`).

## Results (evidence: the two committed result JSONs)

| build | A | B-arc | B2 | C | A−B | verdict |
|-------|---|-------|----|---|-----|---------|
| E-40 baseline | 2 | 0 | 2 | 0 | 2 | collapsed |
| T-170-02 (typed kind) | 8 | 14 | 18 | 46 | −6 | no separation |
| **PRIMARY faithful (S-171)** | **28** | **0** | 20 | 8 | **+28** | **CRATERED** |
| CONTRAST roof-covering (S-172) | 40 | 24 | 4 | 34 | +16 | did not crater |

The separation mechanism (per-item `kind`/`styleClass` audit, vote 1): B-arc reliably earns **2**
`replace` (wrong-style) departments (ROOF+WALL) → floors to 0; A-matched earns **0–1** → clears the bar.
The CONTRAST build's basalt walls let B-arc earn only **1** `replace` → it stayed at 24 → no crater,
confirming **material faithfulness is the driver**. The beside render (`crater-matched.png`, Read &
inspected) shows the faithful build's **grey stone walls** beside the stone concept — and the residual
**dark_oak_planks prism roof** that still reads `replace` on some matched votes.

## Test coverage

- `npm test`: **2249 pass / 0 fail** (unchanged by this ticket — the harness is not imported by tests).
- **No new unit tests** — matches the no-test posture of the sibling `experiments/` harnesses (the change
  is two env reads + draft evidence). Correctness of the env gates verified by **four** GUARD_ONLY runs
  (default + faithful + roof-covering builds, all 7-asset clean exits) and by the default path staying
  byte-identical (the E-40/T-170-02 result files were never written — distinct `REFEREE_RESULTS`).

### Gaps (flagged)
- The harness remains un-unit-tested (established trade-off). Its correctness rests on the asset-guard
  and the persisted full-item `kind`/`styleClass` audit trail in the committed result JSONs.
- **VOTES=2 noise is the dominant uncertainty.** The "craters / doesn't" outcome hinges on B-arc earning
  2 vs 1 `replace` tags — a coin-flip at 2 votes (PRIMARY A votes 40/16; B2 votes 40/0). The *direction*
  (faithful build separates, basalt build doesn't) is the result; the magnitudes are ±noise.

## Open concerns for the human reviewer

1. **The crater separates, but fragile — read it honestly.** A−B=28 clears the bar, but A−B2=8 is inside
   noise (the gothic triangulation; one chapelle vote was anomalously 40), and the matched build still
   self-caps on the un-integrated prism roof (A vote 2 = 16). The headline is real; the qualifications
   are not soft-pedalled.
2. **`kindReliability` disagrees with the score direction on this run.** PRIMARY reads `NO CONTRAST`
   (−0.19) yet craters; CONTRAST reads `DISCRIMINATES` (+0.21) yet does not. The score separation rides
   on `replace`-count variance, not yet on a robust kind signal — a reason to confirm before promoting.
3. **The standing wall: no single fully-faithful build.** S-171 (stone walls) and S-172 (covering roof)
   live on different pipelines and were never integrated (T-172-01 scoped it out — `gableWallKeys`
   conformance gate + judge-pin rotation). The PRIMARY build is material-faithful with a residual prism
   roof; a fully-faithful build would clean the residual `replace` and likely separate more robustly.
   **The blocker moved from "no faithful build" (T-170-02) to "no single *fully*-faithful build."**
4. **Recommendation: PROMOTE-PENDING-CONFIRMATION** (was T-170-02 flat DO-NOT-PROMOTE). The term produced
   the within-family gradient — NOT re-calibrate, NOT a flat do-not-promote. Before freezing: confirm
   with **VOTES ≥ 4–6** and a **single fully-faithful build**. Both are build-side / creation-loop tasks,
   not term-scale re-calibration — itself the finding: the residual gate is the build, not the measure.

## AC checklist

- [x] **Faithful build scored vs (a) matched concept and (b) same-family wrong-style concept; spread vs
      ±12 and vs E-40 (2/0/2/0); renders beside both.** A=28 vs B-arc=0 (spread 28); B2/C reported;
      `crater-*.png` beside both concepts (PRIMARY + CONTRAST).
- [x] **Recorded honestly: does the crater separate? residual gate localized.** YES it separates
      (fragile); residual gate localized to the build (VOTES noise + no fully-faithful build), not term
      scale. Recommendation updated to PROMOTE-PENDING-CONFIRMATION with the evidence.
- [x] **`npm test` green; frozen instrument untouched.** 2249/0; nothing under `measurements/`; E-40 +
      T-170-02 baselines byte-unchanged.

## Anti-hedge note

A non-separation would have been a valid, precise localization (term scale vs build). Instead the claim
landed in its **primary success branch** — the first real crater of the arc — and I report both the
separation AND its fragility (one-`replace`-tag coin-flip, marginal gothic margin, residual prism-roof
self-cap, kind-metric disagreement, no fully-faithful build). Neither inflated into a clean win nor
softened into a partial one; both are auditable from the committed per-item trails.
