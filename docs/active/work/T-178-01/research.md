# T-178-01 — Research

**Ticket:** crater re-run at VOTES≥4–6 on the T-177-01 *fully-faithful* gatehouse build. The measurement
payoff of E-44: convert T-173-01's **PROMOTE-PENDING-CONFIRMATION** into a confirmed (or refuted)
recommendation. Descriptive only — no solution here.

## The question, precisely

T-173-01 ran `corpus-referee.mjs` Section A (crater) at **VOTES=2** on a build that was *material*-faithful
(stone walls) but carried a **residual prism roof** (S-172's covering roof was never integrated). It got
**A-matched 28 ≫ B-arc 0** (spread 28, outside the 2·NOISE=24 bar) — the first separation in the
E-40→E-41→E-42 arc — but flagged it **fragile**: a 1-`replace`-tag coin-flip at VOTES=2, marginal vs the
gothic triangulation (A−B2=8, inside noise), and the matched build self-capping on its own prism roof.

T-173-01 named **two confounds** to remove before promoting:
1. **No single *fully*-faithful build** (stone walls + covering roof). → S-177 / T-177-01 delivered it.
2. **VOTES=2 variance is large** (matched scored 40/16 across two votes). → this ticket raises VOTES.

This ticket removes confound (2) on the build that removes confound (1).

## The harness — `experiments/eval-alignment/corpus-referee.mjs`

A **metered** diagnostic (NOT in `npm test`, NOT the frozen instrument). Section A (`runCrater`) is the only
relevant path; Sections B/C (corpus agreement, bake-off) are gated off by `CRATER_ONLY=1` (T-173-01 added
this). Key mechanics, all already wired:

- **`CRATER_BUILD`** (env, default `builds/gatehouse/new-roof`) — the build whose 4 azimuth renders are
  diagnosed. T-173-01 made it env-overridable. → point at `builds/gatehouse/faithful-covered`.
- **`CRATER_ONLY`** (env) — skip Sections B/C and their ~40 wasted model calls + their asset guard.
- **`VOTES`** — a **hardcoded `const VOTES = 2;`** (line 57). **The one knob this ticket must move** and it
  is not env-overridable today.
- **`NOISE = 12`** — the E-38 per-call noise band. Crater bar: `A−B > 2·NOISE = 24`.
- **`TIER = "strong"`** → `claude-opus-4-8` via `runTieredOp` (the `claude -p` headless shim).
- **Conditions** (`CRATER_CONDITIONS`, held FIXED — the PROGRAM is a synthetic stand-in, not a recognition
  output):
  - `A-matched` — rustic concept (gatehouse 015) + rustic pack. The build matches both.
  - `B-arc` — classical arch concept + guildhall pack. Same-family wrong-style.
  - `B2-chapelle` — gothic cathedral concept + guildhall pack (triangulates B-arc's palette confound).
  - `C-control` — classical concept + RUSTIC pack (isolates pack vs concept-image).
- **Per condition:** loops `VOTES` diagnoses, persists every vote's `score` + full item triple
  (`department/severity/present/missing/kind/styleClass`), and reports `scoreMean`.
- **Spreads:** `A−B`, `A−B2`, `A−C`, `C−B`. `cratered := (A−B) > 24`; `collapsed := A≤12 ∧ B≤12`.
- **`kindReliability`** — per-condition typed-`kind` distribution + `replaceContrast` (WRONG.replaceRate −
  MATCHED.replaceRate), reported *beside* the score, never folded in. T-173-01 noted it *disagreed* with the
  score direction (read NO CONTRAST −0.19 yet cratered) — a known caveat to re-check at higher votes.

## The scoring (frozen-adjacent, in `src/workshop/bakeoff-score.mjs` — do NOT change)

`styleFidelityScore`: each item adds a severity penalty; a **`wrong-style`** item (= `itemStyleClass`
returns wrong-style, driven by `kind:"replace"` / present+missing) forces `PENALTY.major + WRONG_STYLE.distance`
**and caps the whole score at `WRONG_STYLE.cap`**. So the score is dominated by the **count of `replace`
items**: `0` replace → high; `≥1` → capped; `≥2` → floored to 0. This is why T-173-01's separation rode on
B-arc reliably earning **2** `replace` departments (ROOF+WALL) while matched earned **0–1**. The std this
ticket reports is therefore really a measure of how stable that per-item `replace` count is across votes.

## The build under test — `builds/gatehouse/faithful-covered/` (T-177-01)

Delivered by `faithful-roof.mjs`: program-driven carve+cover. The solid 53%-of-build dark_oak prism became a
**16.8% hollow covering** (stone gable-end triangles + dark_oak stair/slab slope courses), walls read stone,
arched gate + slit windows preserved, `closureOf(eave ring y=19)=1.000`, no holes, no `unmapped` blocks. All
four `view-{±x±z}.png` present (GUARD_ONLY passes). T-177-01's honest caveat: at the *external silhouette*
the covering and prism are similar (both pitch-1 stepped gables); the win is structural+material. **Whether
the VLM judge now reads the roof as less of a `replace` is exactly this ticket's measurement.**

## Prior results on disk (the comparison baselines)

- `results/corpus-referee-faithful.json` — T-173-01 PRIMARY (material-faithful, prism roof): A=28 B=0 B2=20
  C=8; votes A=40/16, B=0/0, B2=40/0, C=0/16.
- `results/corpus-referee-roofcovering.json` — T-173-01 CONTRAST (covering roof, basalt walls): A=40 B=24
  → did not crater.
- `results/corpus-referee-kind.json` — T-170-02 (old build, typed kind): A=8 B=14 → matched < wrong.
- These are the rows the report's comparison table is built against. **None get overwritten** — this run
  writes a new `corpus-referee-faithful-covered.json`.

## Constraints / boundaries (from ticket + memory)

- **Recommend, do not freeze.** Do NOT edit anything under `measurements/` or the frozen scoring
  ([[recognition-not-reconstruction]] wall). If PROMOTE: *spell out* the guarded freeze step (file, pin) for
  the human; do not execute it.
- **Anti-hedge** ([[anti-hedge-falsifiable-commitment]]): a non-separation is a sharp, valuable localization
  (term *scale* vs build) — report it, don't soften into a partial win. Std across votes is mandatory.
- **Spend-limit / re-ask** ([[spend-limit-reply-failure-mode]]): no re-ask on malformed (a zero-token notice
  reply burns budget) — already the harness's policy; don't add retries.
- **`npm test` green; frozen instrument untouched.** The only code change is to a metered experiment harness.

## Assumptions surfaced

- The PROGRAM in `runCrater` is a synthetic stand-in (labelled as such) and is held FIXED across the arc — so
  this run is comparable to T-173-01's by construction. Changing it would break the comparison.
- VOTES=6 (4 conditions × 6 = 24 image-diagnose calls) is the explicit upper of the ticket's "≥4–6" lever;
  cost is ~3× T-173-01's 8 calls. Subscription-authenticated, so token spend not dollar spend, but real.
