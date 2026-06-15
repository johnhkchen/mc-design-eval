# T-021-01 — Structure: file-level blueprint

The shape of the code, not the code. Five touch points: one engine addition, one new core module,
one new CLI, one new test suite, plus `package.json` + README + journal edits.

## Change inventory

| Path | Action | Purpose |
|------|--------|---------|
| `src/color/cielab.mjs` | **modify** | add `nearestLab(lab, palette, {metric})`; `nearest` delegates |
| `src/color/cielab.test.mjs` | **modify** | add `nearestLab` tests (Lab-input argmin, identity, metric plug) |
| `src/color/palette-extract.mjs` | **create** | the extractor: pixel core + median-cut + merge + decode shell + describe |
| `src/color/palette-extract.test.mjs` | **create** | synthetic-image AC test + helper unit tests |
| `scripts/extract-palette.mjs` | **create** | CLI over `extractPaletteFromImage` |
| `package.json` | **modify** | `jpeg-js` devDep (added in research) + `palette:extract` script |
| `src/README.md` | **modify** | document the extractor in the color-layer section |
| `docs/knowledge/design-learnings.md` | **modify** | record the taj-C worked-example palette (AC #4) |

No deletions. No change to `block-table.mjs`, `block-lab-table.json`, or any trial/prompt code.

## `src/color/cielab.mjs` (modify) — the one engine addition

Refactor so argmin lives in `nearestLab`; `nearest` becomes a thin sRGB-converting wrapper. Public
contract of `nearest` is **byte-for-byte unchanged** (same return `{key,deltaE,lab}`).

```
/** Find the palette entry whose Lab is nearest `targetLab` (argmin ΔE). */
export function nearestLab(targetLab, palette, { metric = deltaE76 } = {}) {
  // validate non-empty array; linear scan argmin over palette[i].lab; return {key,deltaE,lab}
}

/** Nearest by sRGB target — converts then delegates. (unchanged signature/return) */
export function nearest(rgb, palette, opts) {
  return nearestLab(srgbToLab(rgb), palette, opts);
}
```
- Validation (non-empty array) moves into `nearestLab` so both entry points are guarded.
- No new imports. Boundary intact (zero project/Minecraft imports). JSDoc avoids the `*/` hazard
  (T-020 review #4) — write "L\*a\*b\*" not "a\*/b\*" in block comments.

## `src/color/palette-extract.mjs` (create) — core module

Header comment: ticket/epic ref; the dep boundary (pure pixel core; decode lazy-imports jpeg-js/pngjs;
matching via `cielab.mjs` `nearestLab`, table via `block-table.mjs` `loadBlockTable`); the
near-black-background caveat. Imports: `nearestLab`, `deltaE`, `srgbToLab` from `./cielab.mjs`;
`loadBlockTable` from `./block-table.mjs`; `node:fs` only inside the decode helper.

**Constants / defaults**
```
DEFAULTS = { k: 8, dropColor: [0,0,0], dropTolerance: 24, alphaThreshold: 128 }
```

**Pure helpers (several exported for tests)**
- `rgbToHex([r,g,b]) -> "#rrggbb"`
- `isBackground(r,g,b,a, {dropColor, dropTolerance, alphaThreshold}) -> bool`
  α gate **or** Euclidean-RGB within tolerance of dropColor (skipped when `dropColor` is null).
- `aggregateForeground({width,height,data}, opts) -> { points:[{rgb,lab,count}], foregroundPx, droppedPx }`
  walk RGBA; skip background; tally unique colors in a `Map` keyed by packed rgb; convert each
  unique color to Lab once via `srgbToLab`.
- `medianCutLab(points, k) -> clusters[]` where cluster = `{ points[], count, lab:[3], rgb:[3] }`
  (count-weighted means). Deterministic: repeatedly pick the splittable box with the largest count
  (tie → largest Lab range), split along its longest Lab axis at the weighted median; stop at k or
  when no box has ≥2 distinct Lab points. A `boxStats(points)` inner computes ranges + weighted means.
- `matchClusters(clusters, palette) -> [{cluster, key, blockLab, deltaE}]` via `nearestLab`.
- `mergeByBlock(matched, totalFg) -> Entry[]` sum counts per block id; count-weighted-mean repColor
  (hex+rgb+lab); `deltaE = deltaE(repLab, blockLab)`; `coveragePct = 100*count/totalFg` (rounded 1dp);
  sort by coveragePct desc, then block id asc.

**Public API**
```
export function extractPaletteFromPixels({width,height,data}, opts = {}) -> {
  palette: Entry[], description: string, k, effectiveClusters,
  foregroundPx, droppedPx, totalPx, missing: string[]
}
```
Steps: resolve opts over DEFAULTS → resolve candidate palette (table or whitelist subset; collect
`missing`; throw if empty) → `aggregateForeground` → `medianCutLab` → `matchClusters` →
`mergeByBlock` → `description = describePalette(...)`. Throws if no foreground pixels survive.

```
export function describePalette(result) -> string
```
One line, e.g. `"8 blocks over 96% fg: gold_block 41%, quartz_block 27%, polished_deepslate 14%, …
(mean ΔE 6.2)"`. Pure, deterministic.

```
export async function extractPaletteFromImage(path, opts = {}) -> result
```
`readFileSync(path)` → sniff magic bytes (`FF D8` JPEG → lazy `import('jpeg-js')`,
`89 50 4E 47` PNG → lazy `import('pngjs')`) → normalize to `{width,height,data}` →
`extractPaletteFromPixels`. Throws a clear error on unknown magic.

**Candidate-palette resolution** (`resolvePalette(whitelist)`):
- no whitelist → `table.blocks.map(b => ({key:b.block, lab:b.lab, rgb:b.rgb}))`.
- whitelist → filter table by name; `missing` = requested names not in table; throw if result empty.
  (Loaded once at module scope: `const TABLE = loadBlockTable()`.)

## `src/color/palette-extract.test.mjs` (create)

`node:test` + `node:assert/strict`. Mirrors `block-table.test.mjs` grouping + the inline `png()`
helper idiom. **Independent expectations** built from the committed table.

- **Group A — pure helpers:** `rgbToHex`; `isBackground` (exact black, near-black within tol, bright
  kept, alpha gate, `dropColor:null` disables); `medianCutLab` determinism (same input twice →
  identical) + stop-condition (4 unique colors, k=8 → 4 clusters) + a known 2-color split.
- **Group B — `nearestLab`** (in the cielab suite, not here) — see that file.
- **Group C — synthetic image AC:** build a `width×height` RGBA buffer from **exact table rgb** of
  ~4 well-separated blocks (e.g. `gold_block`, `lapis_block`, `redstone_block`, `quartz_block`,
  read via `loadBlockTable`) in deliberate proportions (e.g. 40/30/20/10 of foreground) + a
  near-black background band. Assert: palette **names exactly those blocks**; `coveragePct`
  within ±tolerance of intended; **sorted desc**; background **excluded** (`foregroundPx` = sum of
  colored regions, black band in `droppedPx`); a second region of an **already-present** block
  **merges** (one row, summed coverage). Expectations are computed from the proportions and the
  table — never by calling the extractor first.
- **Group D — modes/edges:** whitelist restricts matches to the subset + reports `missing` for a
  bogus id; empty post-filter palette throws; `describePalette` output shape (regex/contains).

## `scripts/extract-palette.mjs` (create)

Shebang; usage banner mirroring `build-block-table.mjs`. Parse `--k <n>`, `--drop <#hex|none>`,
`--tol <n>`, `--whitelist <id,id,… | path.json>`, `--json`, positional `<image>`. Call
`extractPaletteFromImage`. Default output: the `description` line + a compact table (block /
coverage% / ΔE / repColor hex). `--json` → full result as JSON. Whitelist file support: if the arg
is a path to a `palettes/*.json`, read its `.blocks`.

## `package.json` (modify)

- `devDependencies`: `"jpeg-js": "^0.4.4"` (already installed in research). `pngjs` already present.
- `scripts`: `"palette:extract": "node scripts/extract-palette.mjs"`.

## Ordering (why this sequence)

1. `cielab.mjs` `nearestLab` + its tests — foundation the core matches with; keep engine green first.
2. `palette-extract.mjs` core (pixel path + helpers) — the testable heart.
3. `palette-extract.test.mjs` — lock the core before the decode shell.
4. decode shell in the same module + `scripts/extract-palette.mjs` + `package.json` script.
5. Run CLI on `taj-C-flash.png`; paste palette into `design-learnings.md`; update `src/README.md`.
6. Full `npm test`; commit.

## Interfaces touched, contracts preserved

- `nearest(rgb, palette, opts)` — return value and signature unchanged (delegates to `nearestLab`).
- `loadBlockTable()` / `block-lab-table.json` — read-only consumer; no change.
- `cielab.mjs` portability invariant — preserved (no new imports; grep-verifiable).
