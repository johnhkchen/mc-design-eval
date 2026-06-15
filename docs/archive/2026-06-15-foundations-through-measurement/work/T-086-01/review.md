# T-086-01 — value-true-block-selection — Review

Handoff summary: what changed, how it's covered, what a human should look at.

## What changed (4 commits on main)

**Created**
- `src/color/value-select.mjs` — the pure selection core (E-14 engine composition). Semantic
  material families via ordered token rules (log → planks → stone → brick → smooth) with
  buildability exclusions (`*_ore`, gravity blocks); chroma-weighted metric
  √(ΔL² + (2·Δa)² + (2·Δb)²) composed with T-064's flat preference through `nearestFlat`'s
  pluggable-metric seam (zero new engine math); border-background estimation + role-swatch
  sampling from a validate-mode GridResult; switch policy that keeps the E-21 map's named block
  as the prior (24-cell sample floor, 15% relative margin). Reported ΔE is always the TRUE
  unweighted ΔE76 with {dL,da,db} components — the selection objective is recorded separately so
  the record can't launder the objective as the result.
- `src/color/value-select.test.mjs` — 14 tests (see coverage).
- `benchmarks/sculpture/value-select.mjs` + `value:select` npm script — impure wiring: decode →
  sample → select → substitute switched blocks onto the spray-paint cottage build (AJV-asserted)
  → best-effort GL front renders → durable record. `--offline` re-asserts the committed record
  with no GL/decode.
- `benchmarks/sculpture/value-select/cottage.{json,md}` + `cottage/artifact.json` — the
  committed record + the recolored build (renders gitignored, regenerable).

**Modified**
- `src/color/image-grid.mjs` — opt-in `cellMeans: true` on `gridFromPixels` returns the per-cell
  foreground means matching previously discarded; default result shape unchanged (tested).
- `package.json` (the `value:select` script), `.gitignore` (`value-select/**/*.png`).

**Deliberately NOT touched:** `spray-paint.mjs` (T-085-01 is rewiring it concurrently — the DAG
boundary held; S-089 consumes this ticket's record as data), the E-21 material-map records (the
prior stays immutable), `cielab.mjs` (reuse boundary intact).

## The cottage result (AC #3)

`white_terracotta → sandstone`: **a\* drift 7.76 → −3.85** — the pink axis the judge named
(`palette@upper`) is eliminated; true ΔE 13.59 → 14.02 (honestly ~tied — the win is hue, not
total distance; recorded as such per E-24 Rule 5). 4683 placements recolored; the front
before/after renders show the upper storey flip pink → warm cream (visually confirmed in this
session). Bonus switch the engine surfaced: `stone_bricks → tuff` (true ΔE 11.6 → 6.06 —
genuinely closer even unweighted). Kept faithfully: spruce_planks (ΔE 1.62), dark_oak_planks
(0.23), dark_oak_log; cobblestone + bricks kept on thin-sample (6/17 cells < 24 floor).

## Acceptance criteria

- **AC1 value-true selection per role, E-14 engine, pure, unit-tested** — ✅ (`value-select.mjs`,
  built on `nearestFlat`/`deltaE76`/`loadBlockTable`; 14 unit tests, GL/network-free).
- **AC2 palette discipline + recorded ΔE** — ✅ family-bounded (never the full-table snap; the
  cottage build's manifest stays at 6 blocks, only substituted in place), per-role chosen block +
  value-ΔE/components in `rows` of the record.
- **AC3 cottage plaster → truer cream, before/after ΔE, visible re-render** — ✅ (above).
- **AC4 `npm test` green** — ✅ 1005/1005 (was 989 before this ticket; +16).

## Test coverage

- Families/precedence (stone_bricks→stone, quartz_bricks→brick, suffix forms), exclusions,
  committed-table pool membership, metric (w=1 ≡ ΔE76; hand-computed w=2 case), border estimate,
  sampler (mean-Lab math, missing-cellMeans throw), the full decision matrix (switched /
  prior-is-best / below-margin / thin-sample / no-sample / not-in-table / no-family), map-level
  join, and two cottage-shaped tests pinned against the COMMITTED table (the plaster flip and the
  planks/log keeps) — these double as regression canaries if the block table is ever rebuilt.
- Gaps (accepted): the runner itself is untested (repo convention — impure wiring, verified by
  the live run + `--offline` assert); `estimateBorderColor`/sampling on a real PNG runs only in
  the live path (decode is the already-tested palette-extract seam).

## Open concerns (for a human eye)

1. **True ΔE for the plaster got marginally worse (13.59 → 14.02).** The chroma-weighted
   objective is a DESIGN CHOICE (hue drift reads as "wrong material"; L* error hides under
   lighting). The record keeps both numbers honest, but if a reviewer disagrees with w=2 the
   constant is single-sourced (`CHROMA_WEIGHT`).
2. **stone_bricks → tuff is an unrequested switch** — correct under the metric (33% margin, ΔE
   genuinely halves) and visible in the after-render (darker, browner base, closer to the
   concept), but the E-21 rationale praised stone_bricks' "dressed ashlar" TEXTURE; tuff is
   flatter. Material-identity-vs-color tension; S-089 decides what to wire in.
3. **Locator circularity (recorded limitation):** a role's region is located by its NAMED block
   being the region's nearest manifest block. It held on the cottage; a prior drifted badly
   enough to mis-locate would corrupt its own swatch. A zone-based locator (T-085's structural
   zones) would be sturdier — natural S-089 follow-up.
4. **Thin-sample roles (cobblestone, bricks) are unvalidated**, not validated-as-good: 6/17
   cells. The floor keeps the prior; the record says so. The chimney-cap bricks judgement is
   effectively deferred.
5. **`var` (texture variance) reuse**: the flat penalty assumes block-table `var` is present;
   blocks without it score unpenalized (engine back-compat behavior, inherited deliberately).

## Verification for a reviewer

```
npm test                          # 1005/1005
npm run value:select -- --offline # CONFIRMED, exit 0 (no GL needed)
npm run value:select              # full reproduction incl. renders (needs headless GL)
```
Then eyeball `benchmarks/sculpture/value-select/cottage/view-front-{before,after}.png`.
