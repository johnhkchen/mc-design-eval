# T-019-01 — Plan: ordered, verifiable steps

Each step is independently checkable and commit-sized. Verification command in **bold**.

## Step 1 — Add deps + npm script, install

- `package.json`: add `minecraft-assets ^1.17.0`, `pngjs ^7.0.0` to `devDependencies`; add
  `"build:block-table": "node scripts/build-block-table.mjs"` to `scripts`.
- Run `npm install`.
- **Verify:** `node -e "import('pngjs').then(m=>console.log(typeof m.PNG))"` → `function`;
  `node -e "import('minecraft-assets').then(m=>console.log(m.default('1.20.1').version))"` →
  `1.20.2`.
- Commit: `chore(E-10): add minecraft-assets + pngjs (build-time) for block→Lab table`.

## Step 2 — Pure color math: `srgbToLab` (+ internals)

- Implement in `src/color/block-table.mjs`: `srgbChannelToLinear`, `linearRgbToXyz`, `xyzToLab`,
  exported `srgbToLab([r,g,b]) -> [L,a,b]` (round Lab to 3 dp). Header doc comment incl. the
  S-023 dedupe note.
- **Verify (informal):** `node -e` spot-check white `[255,255,255]`→`[100,~0,~0]`, black→`[0,…]`,
  blue `[0,0,255]`→ strongly negative b\*.
- Commit: `feat(E-10): sRGB→CIE-Lab conversion for block table (T-019-01)`.

## Step 3 — Pixel + face + classify helpers

- Implement `meanOpaqueRgb(png, threshold=128)` with first-frame slicing and >0 fallback;
  `isFullCubeParent`; `EXCLUDE_BLOCKS`; `pickFace(model)`; `classifyBlock(name, model)`.
- **Verify (informal):** unit-style `node -e` on a synthetic png object (e.g. a 2×2 RGBA buffer,
  half transparent) → mean ignores transparent pixels; an 16×32 fake → only top 16 rows counted.
- (Committed together with Step 2 or as part of Step 4 module completion.)

## Step 4 — Asset I/O + builder + loader

- Implement `resolveAssets`, `buildBlockTable`, `loadBlockTable`. Lazy `import('pngjs')` inside
  the decode path. Deterministic sort by block name.
- **Verify:** `node -e "import('./src/color/block-table.mjs').then(async m=>{const t=await
  m.buildBlockTable(); console.log(t.version, t.blocks.length, t.excluded.length);
  console.log(t.blocks.find(b=>b.block==='gold_block'));})"` → version `1.20.2`, ~300 blocks,
  gold_block present with warm rgb/lab.
- Commit: `feat(E-10): block→Lab table builder over minecraft-assets (T-019-01)`.

## Step 5 — CLI + generate the committed table

- `scripts/build-block-table.mjs`: parse `--version`/`--out`, call `buildBlockTable`, write
  pretty JSON to `src/color/block-lab-table.json`, print summary.
- Run `npm run build:block-table`.
- **Verify:** file exists; `node -e "import('./src/color/block-table.mjs').then(m=>{const
  t=m.loadBlockTable(); console.log(t.blocks.length, !!t.blocks.find(b=>b.block==='quartz_block'),
  t.blocks.find(b=>b.block==='oak_leaves'));})"` → count > 250, quartz present, leaves `undefined`.
- Commit: `feat(E-10): generate committed block-lab-table.json (T-019-01)`.

## Step 6 — Tests

Write `src/color/block-table.test.mjs`:

- **Group A — conversion reference values** (independent of builder/table):
  - `srgbToLab([255,255,255])` → L within `[99,100.5]`, |a|<1, |b|<1.
  - `srgbToLab([0,0,0])` → L within `[0,1]`.
  - `srgbToLab([128,128,128])` → |a|<1.5, |b|<1.5 (neutral grey).
  - `srgbToLab([0,0,255])` → b\* < −50 (blue is strongly −b\*), L\* in a sane mid range.
  - `srgbToLab([255,0,0])` → a\* > 50 (red is strongly +a\*).
- **Group B — `meanOpaqueRgb` behavior** (synthetic inputs):
  - 2×1 px, one opaque red + one transparent → returns `[255,0,0]`.
  - all-transparent 2×2 → returns `null` (or the >0 fallback path returns null when truly 0α).
  - animated strip: 1×3 with distinct rows, width=1 → only row 0 counted.
- **Group C — committed table sanity** (`loadBlockTable()`):
  - `gold_block`: b\* > 20 (yellow), L\* in `[55,90]` (mid-bright).
  - `coal_block` and `blackstone`: L\* < 30 (near-black).
  - `quartz_block`: L\* > 80 (near-white).
  - `lapis_block`: b\* < −10 (blue).
  - `redstone_block`: a\* > 20 (red).
  - structural: every entry has integer rgb in 0..255 and 3-number lab; `oak_stairs`,
    `oak_slab`, `oak_leaves`, `grass_block` are **absent** from `blocks`; `excluded[]` is
    non-empty and documents at least `oak_leaves`.
- **Verify:** `npm run test:unit` green, then **`npm test`** green (full suite incl. validators).
- Commit: `test(E-10): block→Lab table unit suite (T-019-01)`.

## Step 7 — Docs/regeneration note + final green

- Add a short "## Regenerating the block→Lab table" note to `src/README.md` (or a one-liner near
  the module) documenting `npm run build:block-table` and the 1.20.1→1.20.2 resolution.
- **Verify:** **`npm test`** green; `git status` clean except intended files.
- Commit: `docs(E-10): document block-table regeneration (T-019-01)`.

## Testing strategy summary

- **Unit, offline, deterministic** — no SDK, no network. Group A/B need no assets (pure +
  synthetic); Group C reads only the committed JSON. The builder (`buildBlockTable`) is exercised
  manually in Steps 4–5 and implicitly validated by Group C asserting on its committed output —
  satisfying "tests derive expectations independently of the builder" (semantic color thresholds,
  not builder re-runs).
- **No integration test** is warranted: the only external surface is read-only asset files at
  build time, validated by the produced table. Re-running the builder in CI would re-introduce
  the asset dep into the test path, which D2/structure explicitly forbid.

## Risks & mitigations

- *pngjs/minecraft-assets install fails offline* → network confirmed available (research). If it
  regresses, fall back to reading `render/node_modules` assets path, but AC requires the root dep.
- *A `cube`-parent block has no `side`/usable face* → `pickFace` returns null → recorded in
  `excluded`, never crashes the build.
- *Mean-in-sRGB color bias* → accepted, documented as the standard map-art choice; future lever.
- *`srgbToLab` duplication with S-020* → intentional (parallel tickets); flagged for S-023.
