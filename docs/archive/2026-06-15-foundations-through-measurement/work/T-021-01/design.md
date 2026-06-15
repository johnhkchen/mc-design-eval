# T-021-01 — Design: canonical palette extraction

Decisions for the concept-image → canonical-block-palette extractor, each grounded in the research.
Format: **D-n — decision · rejected · why.**

## D-1 — Clustering algorithm: **median-cut in Lab** (not k-means)

**Chosen:** weighted **median-cut** over the foreground colors in Lab space, targeting K buckets.
**Rejected:** k-means (Lloyd's), k-means++.
**Why:** The ticket allows either ("median-cut or k-means in Lab"). The decider is the test idiom
(research §conventions): expectations must be **derived independently** and the suite is offline and
**deterministic**. k-means needs random seeding (`Math.random`) or a seeding heuristic, making the
output run-dependent and the test either brittle or forced to pin a seed. Median-cut is
**deterministic by construction** (recursively split the box with the most pixels along its longest
Lab axis at the population-weighted median) — same image always yields the same palette. It is also
the canonical map-art technique. K-means' marginal quality gain on flat architectural color fields
(few dominant hues, not photographic gradients) does not pay for the determinism loss. A future
`{ method: 'kmeans' }` option is left as a documented seam, not built.

**Weighting:** pre-aggregate foreground pixels into a **unique-color → count** map (collapses ~1M
pixels to the far smaller unique-color set), convert each unique color to Lab **once**, and run
median-cut on `{lab, rgb, count}` points. Cluster centroid = **count-weighted mean Lab** (and a
parallel weighted-mean rgb for the hex). Coverage = cluster count ÷ total foreground count. This is
both faster and the correct coverage semantics.

**Stop condition:** split until K buckets **or** no box is splittable (a box of one distinct color
has zero volume). So an image with only 4 distinct foreground colors yields 4 clusters even at K=12
— important for the synthetic test, where exact block colors give singleton boxes that map exactly.

## D-2 — Matching: add **`nearestLab(lab, palette, {metric})`** to `cielab.mjs`; centroids match in Lab

**Chosen:** add a thin `nearestLab` to the engine; refactor `nearest` to `srgbToLab` then delegate.
Match each centroid's **Lab** directly against the table.
**Rejected:** (a) round-trip the centroid's mean-rgb back through `nearest()` (double conversion);
(b) reimplement argmin inside the extractor.
**Why:** (a) re-converting a *mean* rgb to Lab is not equal to the *mean* Lab we already hold — a
small but pointless error, and the cluster was formed in Lab so it should match in Lab. (b) would
duplicate the engine's argmin/metric-plug logic. The clean move is the one **T-020's own review
pre-authorized** (open concern #3): a Lab-input sibling. It is purely **additive** — `nearest`'s
public contract is unchanged (it becomes `nearestLab(srgbToLab(rgb), …)`), existing 13 engine tests
stay valid, and the portability boundary holds (still zero project imports). This keeps a single
argmin implementation and a single place to later swap CIEDE2000.

## D-3 — Two modes via one optional `whitelist` param (discover vs validate)

**Chosen:** one function; `opts.whitelist?: string[]`. Absent → match against **all 305** table
blocks (discover). Present → match against **only** those blocks (validate a declared manifest).
**Rejected:** two separate functions; a `mode` enum.
**Why:** the modes differ *only* in the candidate palette handed to matching — same pipeline
otherwise. Filtering `table.blocks` to the whitelist set is the whole difference. A whitelisted name
**absent from the table** (e.g. a tinted block the table legitimately excludes) cannot be matched;
collect those into a returned `missing: string[]` and match against the rest rather than throwing —
the caller learns their manifest names an unmatchable block without losing the run. Empty
post-filter palette is a hard error (nothing to match against).

## D-4 — Background removal: parametric `dropColor` + `dropTolerance`, plus alpha

**Chosen:** drop a pixel if `alpha < alphaThreshold` **or** its RGB is within `dropTolerance`
(Euclidean, default ~24) of `dropColor` (default `[0,0,0]`). Both parametric; background-drop is
**on by default** (the ticket's "optionally ignore the pure-black background" — default-on, opt-out
by `dropColor: null`).
**Rejected:** exact `=== [0,0,0]`; ΔE-in-Lab threshold.
**Why:** the JPEGs prove the background is **near**-black, not exact (`[1,1,1]` measured) — an exact
test would leak the whole margin into the palette. Euclidean RGB distance is cheap, predictable, and
intuitive to tune in the same 0–255 space the user thinks in (vs an opaque Lab ΔE). Default 24
absorbs JPEG quantization noise around black without eating genuinely dark foreground at typical
facade brightness. **Documented collateral** (research): near-black *foreground* is also dropped;
acceptable because the locked stage-1 prompt bans dark backgrounds and mandates bright silhouettes,
and `dropColor: null` fully disables it for non-black-bg inputs.

## D-5 — Coverage is of the **foreground**; merge by block; sort by coverage desc

**Chosen:** `coveragePct = 100 × (block's merged pixel count) ÷ (total kept foreground count)`.
Centroids matching the same block id are merged: **summed** coverage, **count-weighted-mean**
repColor (so the dominant sub-cluster dominates the reported color), and the merged-repColor's ΔE to
the block recomputed via `deltaE`. Final array sorted by `coveragePct` desc, ties broken by block id
(stable, deterministic).
**Rejected:** coverage over the whole frame (the black margin would swamp it); keeping per-centroid
rows unmerged (ticket explicitly says merge); reporting min-ΔE of the merged set (less faithful than
recomputing from the merged repColor).
**Why:** matches the ticket ("merge centroids that map to the same block, summing coverage; sort by
coverage") and the research note that coverage must exclude the background to be meaningful.

## D-6 — Output contract: spec fields + cheap diagnostics

**Chosen:** each entry
```
{ block, repColor: { hex, rgb:[3], lab:[3] }, coveragePct,
  deltaE, blockColor: { hex, rgb:[3], lab:[3] } }
```
`repColor` = the **image** color that mapped here (merged centroid); `blockColor` = the matched
block's own table color; `deltaE` = match quality between them. Top-level result:
`{ palette: Entry[], description: string, foregroundPx, droppedPx, missing: string[], k, ... }`.
**Rejected:** bare `{block, repColor, coveragePct}` only.
**Why:** the ticket mandates `{block, repColor(hex+lab), coveragePct}` — all present. The extras are
**free** (already computed) and directly useful: `deltaE`/`blockColor` quantify the palette-vs-fidelity
tradeoff the research calls a "measurable design lever," and a reviewer of a worked example wants to
see *how close* gold_block was to the image gold. Mirrors T-020's "return the distance too, callers
read `.key`" philosophy. `repColor` carries both hex (human) and lab (machine), per the ticket's
"hex+lab."

## D-7 — Module split: dep-free core + decode shell + CLI

**Chosen:** three files.
1. `src/color/palette-extract.mjs` — the **core**. `extractPaletteFromPixels({width,height,data}, opts)`
   (pure: no I/O, no decode dep), `describePalette(result)` (pure), and `extractPaletteFromImage
   (path, opts)` which **lazily** sniffs magic bytes and imports `jpeg-js` (JPEG) or `pngjs` (PNG),
   then delegates to the pixel core. Median-cut + merge helpers live here (some exported for tests).
2. `scripts/extract-palette.mjs` — thin CLI over `extractPaletteFromImage`; flags `--k`,
   `--whitelist <ids|file>`, `--drop <hex>`, `--tol`, `--json`. Prints description + JSON.
3. `npm run palette:extract` alias.
**Rejected:** one monolith; decoding inside the core.
**Why:** keeping decode lazy and off the core preserves the established pattern (research:
`block-table.mjs` isolates asset deps) and lets the **synthetic-image test exercise the whole
pipeline on a raw RGBA buffer with zero decode dep / no committed binary fixture**. The CLI/`src`
split mirrors `build-block-table`. `jpeg-js` is added as a devDep alongside `pngjs` (research
verified it decodes the real concept JPEGs).

## D-8 — `K` default = 8, range guidance 6–12

**Chosen:** default `K = 8`. **Why:** mid of the ticket's 6–12; enough to separate a facade's
structure/accent/glazing/trim families without over-fragmenting flat fields into ΔE-indistinct
neighbors that then merge anyway. Tunable per call; the description reports the *effective* cluster
count (post-stop-condition) which may be < K.

## Test strategy (preview; detailed in plan)

Synthetic RGBA image built from **exact table block rgb values** (loaded from `block-lab-table.json`
in the test) in known pixel proportions, plus a near-black background region. Independent
expectation: those exact colors `nearestLab` to themselves → assert the palette **names those
blocks**, **coverage within tolerance**, **sorted by coverage**, **background excluded**, and that
two regions of the *same* block **merge**. Plus unit tests on median-cut determinism/stop-condition,
background drop, `nearestLab`, and `describePalette` formatting. Real-image run (taj-C) recorded in
`design-learnings.md` per AC.
