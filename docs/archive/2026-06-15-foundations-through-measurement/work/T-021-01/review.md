# T-021-01 — Review: canonical palette extraction

## Summary

Implemented the **headline E-10 deliverable** (S-021): extract the canonical block palette a facade
concept image uses. Pipeline — decode (JPEG/PNG) → drop near-black background → cluster the
foreground in CIE-Lab (deterministic median-cut) → match each centroid to the nearest survival
full-cube block (S-019 table via the S-020 engine's new `nearestLab`) → merge centroids hitting the
same block (sum coverage) → ordered `{block, repColor(hex+lab), coveragePct, deltaE, blockColor}[]`
plus a one-line human description. Two modes share one pipeline: **discover** (all 305 blocks) and
**validate** (a provided whitelist). This is application point #1 of the CIE-Lab matcher — it grounds
an aspirational image to a real, palette-disciplined block set with **no 3-D work**. Four commits,
`aeeeeda`…`d8d8be8`.

## Files

| Path | Action | Purpose |
|------|--------|---------|
| `src/color/cielab.mjs` | modified | added `nearestLab(lab, palette, {metric})`; `nearest` now delegates (contract unchanged) |
| `src/color/cielab.test.mjs` | modified | +4 tests: Lab-input argmin, exact-entry ΔE 0, delegation equivalence, metric/validation |
| `src/color/palette-extract.mjs` | **created** (~290 ln) | pixel core + median-cut + merge + describe + lazy decode shell |
| `src/color/palette-extract.test.mjs` | **created** (~190 ln) | 12 tests: helpers, synthetic-image AC, merge, modes, edges |
| `scripts/extract-palette.mjs` | **created** | CLI: `--k --drop --tol --whitelist --json`, human table + JSON |
| `package.json` | modified | `jpeg-js` devDep + `palette:extract` script |
| `src/README.md` | modified | engine (`nearestLab`) + extractor sections |
| `docs/knowledge/design-learnings.md` | modified | taj-C worked example, both modes (AC #4) |

No deletions. `block-table.mjs`, `block-lab-table.json`, and all trial/prompt code untouched.

## Acceptance criteria — all met

- ✅ **Function/CLI** → ordered `{block, repColor(hex+lab), coveragePct}` + description.
  `extractPaletteFromPixels` / `extractPaletteFromImage` / `npm run palette:extract`; optional
  `whitelist`, `k`, `dropColor`/`dropTolerance`.
- ✅ **Lab clustering + S-020/S-019 matching + merge + bg exclusion.** Median-cut runs on Lab points;
  `nearestLab` matches against the table; `mergeByBlock` sums coverage of same-block centroids;
  background dropped before clustering and excluded from the coverage denominator.
- ✅ **Synthetic-image test, independent expectations.** Regions filled at *exact* table block colors
  in 40/30/20/10 proportions + a near-black band → palette names exactly those blocks, coverage
  equals the proportions (ΔE 0), sorted desc, background in `droppedPx` not the palette; a duplicate
  region proves merge (30+50→80%). Expectations computed from the proportions + table, never by
  pre-running the extractor.
- ✅ **Real image recorded.** `taj-C-flash.png` in `design-learnings.md` — discover (10 real blocks,
  mean ΔE 6.2) and validate-vs-neoclassical (mean ΔE 27), with the "blocks in this facade" read.
- ✅ **`npm test` green** — 182 (was 166; +16).

## Test coverage

- **Engine (`cielab.test.mjs`, 17):** `nearestLab` exact-match (ΔE 0), nearest-among-many, delegation
  equivalence (`nearest` === `nearestLab∘srgbToLab`), pluggable metric, empty/non-array throw. The
  `nearest` refactor is regression-guarded by a re-asserted existing case + the delegation test.
- **Extractor (`palette-extract.test.mjs`, 12):** `rgbToHex` (incl. clamp); `isBackground` (alpha
  gate, near-black tol boundary at radius 24, bright-kept, `dropColor:null` disables);
  `medianCutLab` determinism, stop-at-distinct-count, weighted 2-color split; `aggregateForeground`
  drop/tally; the synthetic-image AC; same-block **merge**; **whitelist** restriction + `missing`;
  all-background throw; empty-whitelist throw; `describePalette` shape.
- **Decode path** is deliberately **not** unit-tested (mirrors `block-table.test.mjs` keeping
  build-time/format deps off `npm test`); exercised manually via the CLI on real concept JPEGs and a
  byte-identical determinism re-run.

## Open concerns / known limitations

1. **Coverage is dyadic under median-cut — by construction, not a bug.** Population-halving splits
   make leaf coverages cluster near 1/8, 1/16…; coverage becomes a *dominance* signal only after the
   same-block **merge** (vivid in validate mode: 4 gold clusters → one `glowstone` row at 50%).
   Ordering-by-coverage still holds and the AC is met. Richer flat-field dominance weighting (k-means,
   or a mean / largest-gap split) is a **future lever** — the metric and (implicitly) the clusterer
   are pluggable seams, not yet alternate code. Documented in README + journal.
2. **Near-black foreground is collateral.** Background drop is a tolerance (RGB-radius 24 of
   `dropColor`, default black), so genuinely near-black foreground is also removed. Safe for the
   locked stage-1 concepts (prompt bans dark backgrounds, mandates bright silhouettes); `dropColor:
   null` / `--drop none` opts out. A future per-image background auto-detect (modal corner color)
   would generalize it.
3. **JPEG-only via `jpeg-js`; baseline only.** The concept `.png` files are in fact baseline JPEG;
   the magic-sniff handles JPEG + PNG and errors clearly on anything else. Progressive JPEG or other
   formats would need another decoder. New devDep `jpeg-js` (pure-JS, no native build), sibling to
   the existing `pngjs`.
4. **Match accuracy inherits S-019 choices.** Representative color is the texture **mean in sRGB**
   (not linear), and ΔE is **CIE76** — both the documented map-art defaults, both swappable later
   (the engine's `metric` seam; a dominant-color table rebuild). Worst observed single match was the
   black-void↔blue anti-alias halo (tinted_glass, ΔE 16) — an edge artifact, not a body color.
5. **`nearestLab` consolidation.** This ticket added `nearestLab` to `cielab.mjs` (pre-authorized by
   T-020 review #3) and consumes the S-019 table whose `srgbToLab` is still a transitional duplicate
   of the engine's. **S-023** remains the designated de-dupe; nothing new here regresses that plan —
   the extractor already imports conversion from `cielab.mjs`, not from `block-table.mjs`.

## Risk assessment

Low. The portability invariant (engine: zero project imports) is preserved and grep-verified; the
`nearest` refactor is mechanical and double-covered; the whole extractor pipeline is deterministic
(md5-stable) and unit-tested on synthetic buffers with independently-derived expectations. Decode is
the only impure edge and is isolated + lazy. No network, no SDK, no shared mutable state beyond the
read-only table loaded once at module scope.

## Verdict

**Ready for review/merge.** All ACs met, 182/182 green, the headline "blocks in this facade" artifact
is demonstrated on a real concept in both modes. Unblocks the rest of E-10 (S-022 image→grid reuses
this exact engine+table pairing; S-023 consolidates the duplicated conversion). Human attention worth
spending on: concern #1 (whether dyadic coverage is acceptable for downstream consumers, or S-022
wants a k-means option) and #2 (background strategy as inputs broaden beyond the black-field concepts).
