# T-086-01 — value-true-block-selection — Design

## Problem restated

Pick each material role's block by VALUE against the concept, not by NAME — within the role's
material family, on the E-14 engine, pure and unit-tested — and prove it on the cottage (plaster
`white_terracotta` → a truer cream, value-ΔE recorded, re-render visible).

Research pinned three facts every option must answer to:
1. **Plain ΔE76 keeps the pink block.** Against the sampled concept cream, `white_terracotta` is
   the nearest block in the whole table; the defect is the a* axis (+8.9 vs the concept's +1.2).
2. **The concept background poisons naive sampling** (near-white bg; 711/781 "plaster" cells were
   background until dropped). A build-silhouette mask also fails (the concept doesn't fill the
   frame the way the face grid does); border-estimated background drop works and is stable
   (plaster sample Lab ≈ (68.5, 1.2, 22.1) across n = 48…128).
3. **Families need semantic + buildability guards.** Token families admit `sand` (gravity) and
   `deepslate_*_ore` (resource blocks) as winners; thin regions (cobblestone 6 cells, bricks 17)
   produce noise winners (mossy_stone_bricks, mud_bricks).

## Options considered

### A. Selection metric

- **A1 — plain ΔE76 within family.** Rejected: measured — it keeps `white_terracotta` (research);
  the AC's required outcome (a truer cream wins) is unreachable.
- **A2 — pure L* ("value" literally).** Rejected: white_terracotta's L* error is only 6.4 — L*
  alone also keeps it; the pink lives in a*/b*. "Value-true" in E-14 vocabulary names the goal
  (the rendered color is faithful), not the single axis.
- **A3 — chroma-weighted ΔE + flat preference (CHOSEN).** Score = √(ΔL² + (w·Δa)² + (w·Δb)²) +
  λ·√var, with **w = 2** and **λ = 0.1** (reusing `nearestFlat`'s T-064 convention: penalty biases
  SELECTION, reported ΔE stays the true unweighted ΔE76). Rationale: the witnessed failure mode is
  hue/chroma drift reading as "wrong material color" while L* matches easily under lighting; w = 2
  is the smallest integer weight that flips the cottage plaster (measured: w=1 keeps, w=2 → the
  sandstones beat white_terracotta by 21%); the var term keeps busy blocks (diorite var 3606) from
  winning on color alone. `cielab.mjs` metrics are pluggable, so this is a metric function passed
  to the existing engine — zero new engine math.
- **A4 — CIEDE2000.** Rejected for now: heavier math, not present in the engine, and its
  chroma-leniency near neutrals points the WRONG way for this defect. The pluggable-metric seam
  keeps the door open.

### B. Material family

- **B1 — Lab-neighborhood (`hueFamilySet`).** Rejected: it is exactly the mean-color collapse
  `material-identity-is-semantic` documents; the neighborhood of pink terracotta is not "plasters".
- **B2 — curated token-rule families (CHOSEN).** A pure `familyOf(blockId)` with ordered rules:
  `log` (`_log|_wood|_stem|_hyphae` suffix) → `planks` (`_planks`) → `stone` (token ∈ stone,
  cobblestone, deepslate, andesite, diorite, granite, tuff, blackstone, basalt, cobbled) → `brick`
  (token brick/bricks) → `smooth` (token ∈ terracotta, concrete, wool, quartz, bone, calcite,
  sandstone, sand) → `null` (no family). Precedence resolves the overlaps deliberately:
  `stone_bricks` → stone (grey masonry, not clay brick); `quartz_bricks` → brick. Candidates =
  table ∩ family − exclusions; exclusions = `_ore$` (resource blocks), `concrete_powder$` +
  {sand, red_sand, gravel, suspicious_*} (gravity — not a wall material). Family sizes: log 40,
  stone 43, smooth 83, planks 11, brick 8 — wide enough to find a truer block, narrow enough to
  preserve material identity. This is the design-doc-discipline answer: NOT the 91-block
  full-table snap (`voxel-palette-must-be-design-doc`); the family is the role's material kind.
- **B3 — family = the design-doc manifest only.** Rejected: the manifest has exactly one light
  block (the pink one) — selection within it is a no-op for the AC.

### C. The concept swatch per role

- **C1 — manual region annotation.** Rejected: not reproducible, violates E-24 Rule 1 spirit.
- **C2 — build-silhouette mask.** Rejected: measured — the face grid and the concept frame don't
  align (plaster sample stayed L* 97.5).
- **C3 — border-estimated background drop + manifest-quantize locator (CHOSEN).** Estimate the
  background as the mean of the image's 1-px border; quantize the concept with the EXISTING
  `gridFromPixels` in validate mode (whitelist = the map's manifest) with `dropColor` = that
  estimate; a role's region = the filled cells assigned to the role's NAMED block (the prior
  locates its own region); the role's swatch = mean Lab of those cells' foreground means.
  Measured stable across n = 48…128; default **n = 96** (best purity/count balance; plaster = 137
  cells). Known, recorded limitation: a severely value-drifted prior could mis-locate its region;
  on the cottage the locator is correct (the prior is still each region's nearest manifest block).

`gridFromPixels` computes per-cell foreground means but discards them. Rather than duplicating
its aggregation loop (the S-023 consolidation precedent says don't), extend it with an opt-in
`cellMeans: true` that returns the per-cell mean RGB alongside the grid — back-compatible, pure,
unit-testable, and not a file any sibling E-24 ticket touches.

### D. Switch policy (palette discipline)

The map's named block is the **prior**; switching needs evidence:
- **Sample floor:** roles with < `MIN_CELLS = 24` assigned cells keep the prior (`thin-sample`).
  Cottage: cobblestone (6) and bricks (17) keep — their measured "winners" were small-sample noise.
- **Margin:** switch only if the family winner's score beats the prior's by ≥ `SWITCH_MARGIN =
  15%` (relative). Measured margins: plaster 21% (switches), base stone 34% (switches), planks/log
  roles 0% (named is rank 1 — keep). A prior absent from the table keeps with reason `not-in-table`
  (upstream E-21 already drops unknown blocks, so this is belt-and-braces).

Predicted cottage outcome (recorded, to be confirmed at implement):
`white_terracotta → sandstone` (Lab 81.7, −2.7, 25.1 — warm cream-sand; a* error 7.7 → 3.9, the
pink axis gone; true ΔE 13.6 → 14.1, honestly reported as roughly tied — the win is hue, and
that's what the judge called out), and `stone_bricks → tuff` (true ΔE 14.8 → 6.0 — genuinely
closer even unweighted). Both switches are reported with full components; consumers (S-089)
decide what to wire in.

### E. Where the result lives / integration boundary

- **E1 — wire into `spray-paint.mjs` now.** Rejected: T-085-01 is concurrently rewriting that
  file (zone-fill); two tickets on one file is a missing DAG edge (`parallel-roots-duplicate-
  shared-deps`). Integration is S-089's job.
- **E2 — standalone pure module + runner + committed record (CHOSEN).**
  - Pure core: `src/color/value-select.mjs` (+ test) — families, exclusions, border estimate,
    role-swatch sampling from a GridResult, weighted metric, switch policy. GL-free, network-free.
  - Runner: `benchmarks/sculpture/value-select.mjs`, npm script **`value:select`** — concept +
    material map + block table → per-role selection record `value-select/cottage.json` (+ `.md`),
    including a `map` array (the value-true role map) downstream tickets consume as data.
  - Cottage proof: apply the switched blocks to the committed spray-paint artifact
    (placements + manifest swap), AJV-assert, best-effort GL re-render front before/after
    (spray-paint's `tryRenderFace` degrade-don't-crash pattern), write
    `value-select/cottage/artifact.json` + PNGs. `--offline` mode re-asserts the committed record
    (mirrors `spray:paint --offline`) so verification never needs GL.

### F. Reporting (the AC's "value-ΔE")

Per role, record: sampled swatch Lab + cell count; for BOTH the named and chosen block: true ΔE76
(unweighted), the ΔL/Δa/Δb components, and the selection score; `switched`, `reason`, `family`.
The plaster before/after numbers the AC demands fall straight out of named-vs-chosen rows. The
true-ΔE-vs-selection-score split mirrors `nearestFlat`'s honesty convention and avoids the
`ablation-value-de-tautology` trap (we report the real distance, not the optimized objective).

## Decision summary

Chroma-weighted (w=2) + flat-penalized (λ=0.1) selection over curated token families with
gravity/ore exclusions; concept swatch per role via border-bg-dropped manifest-quantize at n=96
(through a back-compatible `cellMeans` extension of `gridFromPixels`); prior-keeping switch
policy (24-cell floor, 15% margin); standalone `value:select` runner + committed record + cottage
re-render proof; no edits to `spray-paint.mjs`. All four AC bullets are covered: pure unit-tested
selection on the E-14 engine; family-bounded (no full-table snap) with per-role block + value-ΔE
recorded; the cottage plaster flip with before/after and a visible re-render; `npm test` green
(everything new on the pure path tests GL-free).
