# T-021-01 — Plan: implementation steps

Ordered, independently-verifiable steps. Each ends green and is committable. Verification command
in every step. Baseline before starting: `npm test` = **166 tests green**.

## Step 1 — Engine: add `nearestLab`, refactor `nearest` to delegate

**Files:** `src/color/cielab.mjs`, `src/color/cielab.test.mjs`.
- Add `export function nearestLab(targetLab, palette, { metric = deltaE76 } = {})` holding the
  argmin scan + non-empty-array validation. Rewrite `nearest` as `return nearestLab(srgbToLab(rgb),
  palette, opts)`.
- Tests: `nearestLab` picks correct key for a Lab target equal to an entry's lab (ΔE 0); picks
  nearest among ≥3 entries; honors injected `metric`; throws on empty/non-array. Re-assert one
  existing `nearest` case still passes (delegation didn't change behavior).
**Verify:** `node --test src/color/cielab.test.mjs` green; `grep -n "import" src/color/cielab.mjs`
shows only comments (boundary intact). `npm test` still green.
**Commit:** `feat(E-10): nearestLab Lab-input matcher; nearest delegates (T-021-01)`.

## Step 2 — Core module: pure pixel pipeline (no decode yet)

**File:** `src/color/palette-extract.mjs` (create).
- Header comment (boundaries, near-black caveat). Imports: `nearestLab, deltaE, srgbToLab` from
  `./cielab.mjs`; `loadBlockTable` from `./block-table.mjs`. `const TABLE = loadBlockTable()`.
- Implement `DEFAULTS`, `rgbToHex`, `isBackground`, `aggregateForeground`, `medianCutLab`
  (+ `boxStats`), `matchClusters`, `mergeByBlock`, `resolvePalette`, `extractPaletteFromPixels`,
  `describePalette`. Export the helpers Group A/D will test.
- No `jpeg-js`/`pngjs`/`fs` import in this part — keep the core decode-free.
**Verify:** `node -e "import('./src/color/palette-extract.mjs').then(m=>console.log(Object.keys(m)))"`
lists the exports without error. (No test yet — next step.)
**Commit:** folded into Step 3's commit (core + its test land together).

## Step 3 — Core tests: helpers + synthetic-image AC

**File:** `src/color/palette-extract.test.mjs` (create).
- Group A helper tests (rgbToHex, isBackground cases, medianCutLab determinism + stop-condition +
  a known split).
- Group C synthetic-image AC test: load table, pick `gold_block`/`lapis_block`/`redstone_block`/
  `quartz_block`, build an RGBA buffer with those exact rgb in 40/30/20/10 foreground proportions +
  a near-black band; assert named blocks, coverage ±tolerance, sorted desc, background excluded,
  merge of a duplicated-block region.
- Group D: whitelist restricts + `missing`; empty palette throws; `describePalette` shape.
- **Independent expectations:** computed from proportions + table, never by pre-running the extractor.
**Verify:** `node --test src/color/palette-extract.test.mjs` green; `npm test` green (now ~180+).
**Commit:** `feat(E-10): canonical palette extractor core + tests (T-021-01)`.

## Step 4 — Decode shell + CLI + package wiring

**Files:** `src/color/palette-extract.mjs` (add `extractPaletteFromImage`),
`scripts/extract-palette.mjs` (create), `package.json` (modify).
- `extractPaletteFromImage(path, opts)`: `readFileSync`, sniff magic (`FF D8`→jpeg-js, PNG sig→pngjs,
  both lazy `import`), normalize `{width,height,data}`, delegate to the pixel core.
- CLI: arg parse (`--k`, `--drop`, `--tol`, `--whitelist`, `--json`, positional image); print
  description + compact table, or JSON. Whitelist file → read `.blocks`.
- `package.json`: confirm `jpeg-js` devDep present; add `"palette:extract"` script.
**Verify:** `node scripts/extract-palette.mjs benchmarks/temple-facade/concepts/taj-C-flash.png`
prints a sane palette (real blocks, coverage sums ~100%, ΔE small). `npm test` green (decode path
isn't on the test path, so no regression).
**Commit:** `feat(E-10): palette-extract JPEG/PNG decode + CLI (T-021-01)`.

## Step 5 — Worked example + docs (AC #4)

**Files:** `docs/knowledge/design-learnings.md` (append a worked-example block), `src/README.md`
(document the extractor in the color section).
- Run the CLI on **taj-C-flash.png** (discover mode) and capture the palette + description; paste a
  trimmed table into `design-learnings.md` under an E-10 worked-example heading, with a one-line read
  of "blocks in this facade" and the command used. Optionally a second run with a palette whitelist
  to show validate mode.
- README: a short subsection — what the extractor does, the two modes, the CLI command, the
  near-black-bg caveat, and the `nearestLab` engine addition.
**Verify:** `npm test` green; re-running the CLI reproduces the recorded palette (determinism check).
**Commit:** `docs(E-10): record taj-C palette worked example + extractor docs (T-021-01)`.

## Step 6 — Review

Write `review.md`: files changed, AC checklist, test coverage + gaps, open concerns (near-black
collateral, JPEG-only-via-jpeg-js, mean-in-sRGB inheritance from S-019, k-means seam unbuilt,
`nearestLab` consolidation note for S-023). No code.

## Testing strategy (summary)

- **Unit, deterministic, offline:** all logic is exercised on synthetic RGBA buffers + the committed
  table — **no binary image fixture committed**, no decode dep on the test path (mirrors
  `block-table.test.mjs` keeping asset deps off `npm test`).
- **AC #3** = Group C synthetic-image test (known regions → expected blocks, coverage tol, ordering,
  bg excluded), expectations derived independently.
- **AC #4** = real `taj-C` run recorded in the journal (manual, like `build-block-table`'s manual
  build path); the determinism re-run is the check.
- **Engine regression:** `nearest` delegation covered by re-asserting an existing case; boundary by
  grep.

## Risk register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Median-cut over-merges near-ΔE blocks on a real image, palette looks thin | med | report `effectiveClusters` + `deltaE`; `--k` tunable; it's a worked example, not a metric |
| Near-black foreground silently dropped | low | documented; `dropColor:null` opt-out; stage-1 prompt bans dark bg |
| `jpeg-js` mis-decodes a non-baseline JPEG | low | concept JPEGs are baseline (verified); magic-byte sniff errors clearly on unknown formats |
| Refactor of `nearest` subtly changes behavior | low | delegation is mechanical; existing engine tests + an added re-assert guard it |
| Coverage rounding makes the synthetic test brittle | med | assert coverage within a tolerance band, not exact equality; order/name assertions exact |
