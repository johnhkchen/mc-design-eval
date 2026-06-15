# T-039-01 — Progress: value-true-palette-snap

## Status: complete

All four acceptance criteria met; `npm test` green (327 tests, 0 fail); committed as `33894f5`.

## Steps executed (per plan.md)

### Step 1 — module `src/color/value-palette.mjs` ✅
Implemented exactly as Structure specified: lazy-memoized `candidatesOnce()` (full table via
`resolvePalette()` + `byName` Map + stemmed-`tokenIndex`); pure helpers `normalizeName`, `hexToRgb`,
`toRgbHint`, `stemTokens`, `toEntries`, `deriveProxyRgb`, `makeCard`; and
`resolveValueTruePalette(input, opts)`. Resolve order: direct table hit → passthrough (snapped:false,
ΔE 0); else hint-or-name-derived proxy → `nearestLab` snap; else actionable throw.
Smoke check confirmed a 3-row card for `["minecraft:gray_concrete","oak_stairs","gold_leaf"]`.

### Step 2 — tests `src/color/value-palette.test.mjs` ✅
15 tests across groups A–G (passthrough, snap, hinted snap, determinism/dedupe, input unions/errors,
value-honesty contract, exported helpers). `node --test` on the file: 15/15 pass.

### Step 3 — full suite + commit ✅
`npm test` (artifact self-test/validate + `node --test "src/**/*.test.mjs"`): **327 pass, 0 fail**.
`reuse-boundary.test.mjs` still green — `cielab.mjs` untouched. Both files + all six work artifacts
committed in `33894f5`.

## Deviations from plan / design

1. **`gold_leaf` snaps to `gold_ore`, not `gold_block`** (design.md/plan.md predicted `gold_block`).
   The deterministic tiebreak is *max shared tokens → fewest total tokens → shortest name → lexico*.
   `gold_block` and `gold_ore` both share `{gold}` and both have 2 tokens, so the **shortest-name**
   rule selects `gold_ore` (8 chars < 10). Both are real, survival, full-cube blocks, so the AC
   ("snap to the nearest real full-cube block, deterministic, flag + original name") is satisfied. I
   pinned the *actual* deterministic targets (`oak_stairs`→`oak_log`, `gold_leaf`→`gold_ore`) in the
   tests rather than the prediction, so determinism is locked to real behavior. This exposes the
   known coarseness of the name-token fallback (see Review); the precise path is a color hint.

2. **No other deviations.** Inputs, output contract, boundary, and determinism are exactly as designed.

## Verification log

- `node -e` smoke: card shapes + snapped flags correct.
- `node --test src/color/value-palette.test.mjs` → 15/15.
- `npm test` → 327/327.
- Imports audited: only `./cielab.mjs` and `./palette-extract.mjs` — no Minecraft/GL/network deps.

## What the next stories inherit

`resolveValueTruePalette` + `VALUE_TRUE_SCHEMA` + `hexToRgb` are exported and ready. The `card`
carries `block`/`hex`/`rgb` for S-040's swatch grid and `block`/`value`/`lab` for S-041's
build-target snap; `snappedCount` is a ready health signal for S-042's ΔE gate.
