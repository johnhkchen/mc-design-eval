# Progress — T-004-02 single-shot-archetype

Implement phase. Status: **complete.** All plan steps landed; `npm test` 72/72
green (was 54; +18 new). Five commits on `main`.

## Completed steps → commits

| Step | What | Commit subject |
|------|------|----------------|
| 1 | `src/palette.mjs` + `src/palette.test.mjs` (loader + formatter) | `T-004-02: shared palette loader + prompt block formatter` |
| 2 | `src/briefs.mjs` (shared target + style briefs) | `T-004-02: shared target + style briefs (spec §8) data module` |
| 3+4a | `src/single-shot.mjs` (descriptor + prompt builder + attribution guard + live wrapper) + `src/single-shot.test.mjs` | `T-004-02: single-shot archetype — prompt builder, attribution guard, live wrapper` |
| 4b | `scripts/run-trial.mjs` rewired to the archetype | `T-004-02: run-trial CLI now drives the single-shot archetype` |
| 5 | `src/README.md` section | `T-004-02: document the single-shot archetype in src/README` |

## What was built (vs. structure.md)

- **`src/palette.mjs`** — `loadPalette(id)` (reads `palettes/<id>.json` by path;
  clear ENOENT → "unknown palette" error; no re-validation) and
  `formatPaletteBlocks(palette)` (group-by-group when `groups`, with an `other:`
  line for ungrouped blocks; flat comma list otherwise). `PALETTES_DIR` resolved
  via `import.meta.url` (the `artifact.mjs` idiom). 7 unit tests over the real
  shipped `industrial` palette.
- **`src/briefs.mjs`** — frozen `TARGET_BRIEFS` (house/path/landscape, keyed by the
  schema `target` enum) and `STYLE_BRIEFS` (industrial). Pure data.
- **`src/single-shot.mjs`** — `SINGLE_SHOT` descriptor (`id` imported from
  `config.DEFAULT_PROMPTING_METHOD_ID`); `buildSingleShotPrompt(spec) → { prompt,
  seedMetadata }` (spec validation; ordered, deterministic prompt sections;
  whitelist injected as binding constraint; all reproducibility metadata pinned);
  `assertAttribution(artifact)` (AC #4 guard); live `runSingleShotTrial(spec)`.
  11 unit tests.
- **`scripts/run-trial.mjs`** — now calls `runSingleShotTrial({ target:"house",
  paletteId:"industrial", style:"industrial", … })`; prints the attributed
  `prompting_method_id`. Live/metered, not in CI.
- **`src/README.md`** — "Single-shot archetype (T-004-02)" section.

## Deviations from the plan

1. **Live wrapper folded into step 3's commit (plan had it in step 4).** The plan
   sequenced `buildSingleShotPrompt`/`assertAttribution` (step 3) before the live
   `runSingleShotTrial` (step 4). In practice `runSingleShotTrial` is ~10 lines of
   thin glue over the same module's pure functions, so it shipped in the
   single-shot commit; the CLI rewire stayed a separate commit. Net commits: 5, as
   planned. Safe because importing `single-shot.mjs` does **not** load the SDK —
   `runTrial` → `requestDesignArtifact` only `import()`s the SDK *inside* the call,
   so the test suite imports the module without any metered path firing (verified:
   72/72 offline).

2. **No `path`/`landscape` trials, but their briefs shipped as data.** Per design
   D4, `TARGET_BRIEFS` carries all three spec-§8 targets (cheap, anticipates the
   3×3 matrix) while tests and the CLI exercise only `house` (the milestone target
   T-004-03 needs). Not a scope expansion — pure data, no new code paths.

## Verification performed

- `npm test` → **72/72** pass (palette 7 + single-shot 11 added; existing 54
  untouched). Offline, no SDK import, no network.
- `node --check` on `briefs.mjs` and the rewired `scripts/run-trial.mjs`.
- Confirmed `Object.keys(TARGET_BRIEFS)` = the schema `target` enum
  (house/path/landscape) and `STYLE_BRIEFS` = {industrial}.
- Did **not** run `npm run trial:run`: the optional SDK is installed, so a run
  would make a **live, billed** call (spec §4). The live leg is exercised by
  T-004-03 (the milestone), not here.

## Not done (out of scope, by design)

- Palette-adherence measurement (counting out-of-whitelist placements) — E-04.
- Render wiring / a viewable image — T-004-03 (converges this archetype + the
  render MCP tool).
- Additional styles or palettes — spec §12 left open; one ships.
