# T-183-01 — Progress

## Done
- **Step 1 — schema** `schema/style-corpus.schema.json` (draft 2020-12, inline cellType/faithfulness
  enums, minItems 8). Parses; Ajv compiles.
- **Step 2 — loader** `src/workshop/style-corpus.mjs` mirroring `defect-corpus.mjs` (memoized Ajv2020,
  parse-returns-value, fail-fast load, semantic asserts incl. AC-shape coverage). Exports verified.
- **Step 3 — test** `src/workshop/style-corpus.test.mjs` (SC1–SC6: load/shape, enum membership,
  coverage, asset-existence, parse-value, coverage-rejection).
- **Step 4 — replay script** `experiments/eval-alignment/corpus-build.mjs` (asset guard, mutateMaterial,
  synth render, composeTwo beside-PNGs, manifest self-validate + write).

- **Step 4 verify** — `GUARD_ONLY=1` guard passes (26 reuse assets, 12 states).
- **Step 5 — run** — emitted `builds/gatehouse/faithful-covered-mid/` + 12 `corpus/beside/<id>.png` +
  `style-corpus.json` (self-validated before write). Summary: match 3 / same-pack-wrong-picture 3 /
  wrong-pack-right-picture 2 / cross 1 / hard-middle 3; subjects gatehouse, cottage, barn.
- **Step 6 — contestability inspection** — see Deviation 1. All 3 hard-middle states confirmed
  genuinely contestable on the render.
- **Step 7 — green** — `npm test` 2295 pass / 0 fail (incl. SC1–SC6); `git status --porcelain
  measurements/` empty (nothing frozen touched).
- **Step 8 — honest reporting** — manifest `notes` records: all 4 crux cell types constructible (none
  refused; the structural-confound risk is a production-pipeline property, not a corpus one), the
  single-rater limitation, and the per-hard-middle contestability calls.

## Deviations
1. **Hard-middle synth mutation refit (Step 6).** The first synth factor — `stone_bricks→cobblestone`
   on the walls — rendered **invisible** (grey-on-grey at render distance); it would have scored ~HIGH,
   mislabeling a "middle". Refit to a **visible-but-plausible** single factor: roof timber
   `dark_oak→spruce` (225 cells). Re-rendered, re-inspected: the spruce roof is clearly warmer/lighter
   than the match's dark-oak roof yet both are plausible wood-shingle roofs — genuinely rank-either-way.
   The two reuse middles (`gh-mid-gate` gaping gate, `ct-mid-plain` plainer walls) were verified against
   their raw build renders (not the stale defect-corpus notes) and are genuinely partial vs their match
   anchors. Recorded in the SOURCE.md + manifest notes (anti-hedge: the failed attempt is reported, not
   hidden).
