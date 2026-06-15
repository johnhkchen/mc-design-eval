# T-021-01 — Progress (Implement)

Plan executed in 4 commits (the core + its test landed together, as the plan anticipated). Baseline
166 tests → **182 green** (+16). No deviations from the design; one in-flight refinement (split
criterion) noted below.

## Steps completed

| Step | Commit | Result |
|------|--------|--------|
| 1 — `nearestLab` + `nearest` delegates | `aeeeeda` | engine 13→17 tests; boundary grep clean (zero project imports) |
| 2+3 — extractor core + tests | `92abd37` | `palette-extract.mjs` + 12-test suite; synthetic-image AC green |
| 4 — decode shell + CLI + `palette:extract` | `07d66e3` | JPEG/PNG magic-sniff decode; CLI runs on real `taj-C` |
| 5 — worked example + docs | `d8d8be8` | `design-learnings.md` E-10 example; `src/README.md` engine+extractor sections |
| 6 — review | (this artifact set) | `review.md` |

## Deviation from plan (1, documented)

**Split-selection criterion changed mid-Step-4.** The plan's median-cut selected the box with the
largest *count*. First real-image run showed coverage pinned at a near-uniform ~12.5% — population
median-cut equalizes cluster populations. Changed selection to largest **count × longest-axis-range**
so a large *flat* color field stays one cluster (better color representativeness) while heterogeneous
regions subdivide. **Discovery during the change:** the near-uniformity is *intrinsic* to the median
split halving population at every cut — it is dyadic regardless of selection, and only becomes a
dominance signal after the same-block **merge**. The criterion change is still a strict improvement
(resolves color-spread, not population depth) and left all synthetic tests green (exact colors are
zero-volume singletons, unaffected). Both facts are recorded in `design-learnings.md` and `review.md`.

## Verification performed

- `node --test` per-file at each step; `npm test` 182/182 after Steps 1, 3, 4, 5.
- Boundary: `grep import src/color/cielab.mjs` → comments only (portability invariant held).
- Real-image runs: `taj-C` discover (mean ΔE 6.2, 10 real blocks) and validate-vs-neoclassical
  (mean ΔE 27, `missing` lists 21 non-cube ids) — both sane.
- **Determinism:** two `--json` runs on `taj-C` are byte-identical (md5 match).

## Acceptance criteria — status

- ✅ Function/CLI takes image (+ optional whitelist, K, drop-color) → ordered `{block, repColor, coveragePct}` + description.
- ✅ Clustering in Lab; matching via S-020 `nearestLab` + S-019 table; same-block centroids merged with summed coverage; background excluded.
- ✅ Synthetic-image test with known regions/proportions → expected blocks, coverage within tolerance, ordered by coverage; expectations independent of the extractor.
- ✅ Run on a real `concepts/` image + recorded in `design-learnings.md` (taj-C, both modes).
- ✅ `npm test` green (182).
