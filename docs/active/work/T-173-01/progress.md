# T-173-01 — Progress

## Done (all plan steps)

- **Step 1 — harness env gates.** `corpus-referee.mjs`: `CRATER_BUILD` env-overridable (default
  unchanged); `CRATER_ONLY` gate skips the corpus guard loops + agreement/bake-off + E-39 baseline load,
  writes skip sentinels, guards only the crater verdict prints. Default path byte-unchanged. ✓ `node
  --check` parses.
- **Step 2 — guard default build, crater-only.** `GUARD_ONLY=1 CRATER_ONLY=1` → 7 assets, no corpus
  demand, clean exit. ✓
- **Step 3 — staged S-171 faithful build.** `builds/gatehouse/faithful/`: `artifact.json` + 4
  `view-{az}.png` byte-copies of the committed recognition build (renamed from `view-gatehouse-{az}`),
  `SOURCE.md` provenance. ✓ `cmp` confirms byte-identity.
- **Step 4 — guard faithful + roof-covering.** Both → 7 assets, clean exit. ✓
- **Step 5 — `npm test`.** 2249 pass / 0 fail. ✓ Committed Steps 1–4 (`feat(T-173-01): CRATER_BUILD/
  CRATER_ONLY env gates + staged faithful build`).
- **Step 6 — PRIMARY crater run (spend).** faithful build → `results/corpus-referee-faithful.json`.
  **A=28 B=0 B2=20 C=8 → CRATERED** (A−B=28 > 24). beside PNGs in `T-173-01/`.
- **Step 7 — CONTRAST crater run (spend).** roof-covering build →
  `results/corpus-referee-roofcovering.json`. **A=40 B=24 B2=4 C=34 → DID NOT CRATER** (A−B=16 < 24).
- **Step 8 — FINDINGS.** `FINDINGS.md` written: spread table vs E-40 (2/0/2/0) and T-170-02
  (8/14/18/46); per-item `replace`-count audit; axis triangulation (material faithfulness is the driver,
  noise caveat); standing wall (no single fully-faithful build); recommendation
  **PROMOTE-PENDING-CONFIRMATION**.
- **Step 9 — tests/commit/review.** `npm test` re-confirmed green; evidence committed; `review.md`
  written.

## Result in one line

The crater **separates** on the materially-faithful build (A 28 ≫ B-arc 0) — the first separation in the
arc — but fragile (VOTES=2 one-`replace`-tag coin-flip; marginal vs gothic; matched still self-caps on
the un-integrated prism roof). Material faithfulness is the driver; the covering-roof-only build does not
separate.

## Deviations from plan

- None material. Ran the CONTRAST beside-PNGs into `T-173-01/contrast/` (planned) to avoid the PRIMARY
  PNGs being overwritten. Both result JSONs land in `experiments/.../results/` (creation-loop evidence,
  not pin-guarded), per the T-170-02 precedent.

## Spend

16 diagnose calls total (2 builds × 4 conditions × VOTES=2). Guard-before-spend on every run; the E-40
and T-170-02 baseline result files were never written (distinct `REFEREE_RESULTS` targets).
