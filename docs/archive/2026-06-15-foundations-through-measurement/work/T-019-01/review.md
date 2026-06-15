# T-019-01 — Review: block→Lab color table

Handoff document. What changed, what's tested, what to watch.

## What changed

**New files**
- `src/color/block-table.mjs` — the builder module. Pure helpers (`srgbToLab`, `meanOpaqueRgb`,
  `isFullCubeParent`, `classifyBlock`, `pickFace`, `EXCLUDE_BLOCKS`) + build-time I/O
  (`resolveAssets`, `buildBlockTable`) + runtime accessor (`loadBlockTable`, `TABLE_PATH`).
- `scripts/build-block-table.mjs` — CLI behind `npm run build:block-table`.
- `src/color/block-lab-table.json` — the committed output: 305 blocks, 455 documented exclusions.
- `src/color/block-table.test.mjs` — 18 unit tests (3 groups).

**Modified files**
- `package.json` — `minecraft-assets ^1.17.0` + `pngjs ^7.0.0` in **devDependencies**;
  `build:block-table` script. `package-lock.json` updated by `npm install`.
- `src/README.md` — "Color layer (E-10)" section (regeneration, dep boundary, version note).

**Untouched on purpose:** the ticket frontmatter (Lisa advances phases); other tickets'
in-flight files and the `T-020-01/` work dir (parallel work — not staged in my commit).

## Acceptance criteria — status

| AC | Status | Evidence |
|----|--------|----------|
| `minecraft-assets` added + loadable (CJS gotcha worked around) | ✅ | devDep; loaded via default-import → `.directory` → read JSON/PNGs by path (no internal require graph) |
| Cached block→Lab table for full-cube survival blocks, `{block,rgb,lab}` | ✅ | `block-lab-table.json`, 305 entries (also carries `texture` provenance) |
| Biome-tinted + non-full-cube excluded, documented which | ✅ | cube-parent filter + tint signal + denylist; every drop in `excluded[]` with a reason (455) |
| Unit tests on known blocks, derived independently | ✅ | gold warm/yellow, coal+blackstone near-black, quartz near-white, lapis blue, redstone red — thresholds from color theory, asserted on the committed table; conversion ref values asserted on the CIELAB definition |
| Regenerable by a documented command; bulky assets gitignored | ✅ | `npm run build:block-table`; the bulky textures live in gitignored `node_modules/`; the 113 KB table is committed (like `palettes/*.json`) |
| `npm test` green | ✅ | 166/166 pass (155 pre-existing + 11 new test cases across 18 `test()` blocks) |

## Test coverage

- **Group A (conversion)** — white→L\*≈100, black→L\*≈0, grey→neutral a\*/b\*, blue→strong −b\*,
  red→strong +a\*. Validates `srgbToLab` against the CIELAB definition, not the builder.
- **Group B (pixels + classification)** — `meanOpaqueRgb` ignores transparent pixels, returns
  null when fully transparent, slices the first animation frame, averages correctly;
  `isFullCubeParent`/`classifyBlock`/`pickFace` exercised on synthetic models.
- **Group C (committed table)** — provenance (1.20.1→1.20.2), the six known-block color reads,
  full structural invariants (rgb 0..255 ints, 3-number lab) over **all 305 entries**, and the
  absence of tinted/non-cube blocks with documented exclusions.

**Gaps (intentional):** the test path never invokes `buildBlockTable` and never touches
`minecraft-assets`/`pngjs` — by design (keeps build-time asset deps off the test/runtime path).
The builder is exercised manually (Steps 4–5) and validated transitively by Group C asserting on
its committed output. CI does not regenerate the table; regeneration is a developer command.

## Open concerns / known limitations

1. **`srgbToLab` is duplicated** with S-020's forthcoming `src/color/cielab.mjs`. Intentional —
   T-019/T-020 are parallel `depends_on: []` tickets. Flagged in the module header and the README
   for **S-023** to consolidate. Downstream code should import conversion from `cielab.mjs`, not
   from this module.
2. **"Survival-obtainable" is approximate.** It is `full-cube ∧ ¬tinted ∧ ¬denylisted`, not a
   loot/crafting-graph proof (no `minecraft-data` at the root). A few non-craftable full cubes
   may slip through, and the denylist is hand-maintained (~12 entries). The *real* obtainability
   gate is downstream: S-021's palette manifest whitelist. Acceptable per the research framing.
3. **Mean is taken in sRGB space**, not linearized space — the documented standard map-art
   choice, but a known minor bias on high-variance textures. Noted as a future lever (dominant-
   color / linear-space averaging) if a build's colors read off; CIE76 ΔE is similarly the
   documented starting point, swappable later.
4. **Version drift.** The table is pinned to the effective `1.20.2` dataset that
   `minecraft-assets@1.17` resolves for `"1.20.1"`. If the asset package is upgraded, rerun
   `npm run build:block-table` and re-review the known-block reads.
5. **`spawner`/`infested_*`** are explicitly denylisted; if a future palette legitimately wants
   them, remove from `EXCLUDE_BLOCKS` and regenerate.

## Recommendation

Ready for downstream consumption. S-020 (color engine) and S-021 (palette extraction) can import
`loadBlockTable()` / the JSON now; the `{block, rgb, lab}` contract is stable. The one piece of
deliberate tech debt (duplicated conversion) is owned by S-023.
