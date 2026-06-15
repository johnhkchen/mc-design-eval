# T-041-01 — Progress: value-matched-build

## Status: COMPLETE — all four ACs met, `npm test` green (348/348), two commits landed.

## Steps executed (against plan.md)

- **Step 1 — config id.** Added `VCONCEPT_SCULPTURE_METHOD_ID_V2 = "vconcept-sculpture.v2"` to
  `src/config.mjs` with the shared-prompt doc comment. ✔
- **Step 2 — pure module.** `src/color/value-build.mjs`: `VALUE_MATCHED_SCHEMA`,
  `toRealizedClusters` (accepts `[{block,lab}]` or an `extractPaletteFromImage` result),
  `distinctNames`, `anchorFor`, `snapArtifactToValueTrue`. Smoke-tested on the committed moai run:
  `gray_concrete` → `deepslate_bricks` (+5.5), snapped artifact `assertArtifact`s clean, input not
  mutated. ✔
- **Step 3 — tests.** `src/color/value-build.test.mjs`, groups A–G, 7 tests, all green. ✔
- **Step 4 — descriptor.** `VCONCEPT_SCULPTURE_V2` in `src/sculpture.mjs` (prompt shared with `.v1`,
  `composeSculptureBuildPrompt` unchanged); sculpture tests still green. ✔
- **Step 5 — commit 1.** `feat(E-14 T-041-01): snapArtifactToValueTrue — value-matched build path`. ✔
- **Step 6 — runner flag.** Additive `--value-match` on `benchmarks/sculpture/run.mjs`; the `.v1`
  artifact/render/turntable path is byte-unchanged. Wiring factored into `value-match-shared.mjs`
  (shared by the runner and the A/B). ✔
- **Step 7 — offline A/B + run.** `benchmarks/sculpture/value-match-ab.mjs` over
  moai/sword/pineapple (no model call; GL render confirmed available). Each run dir gained
  `artifact.value-matched.json`, `value-swaps.{json,md}`, `render-3q.value.png`; top-level
  `value-match-ab.md` written. ✔
- **Step 8 — full suite + commit 2.** `npm test` 348/348 green;
  `feat(E-14 T-041-01): value-matched A/B (moai+sword+pineapple) + runner flag`. ✔

## A/B results (the deliverable)

| subject | placements rewritten | headline swap | value shift |
|---|---|---|---|
| **moai** (001) | 35/35 | `gray_concrete` → `deepslate_bricks` | **+5.5** (drift cure) |
| **sword** (007) | 3/10 | `dark_oak_log` → `spruce_log`; `stone` → `polished_andesite` | −5 / +3.2 |
| **pineapple** (013) | 31/124 | `honey_block` → `hay_block`; `lime_concrete` → `melon` | −11.8 / −6.6 |

Renders saved next to the `.v1` stills; the visual A/B confirms the moai body lifts from flat dark
`gray_concrete` to textured `deepslate_bricks`, with accents taking the concept's realized
`copper_ore` character.

## Deviations from the plan

1. **Extracted a shared helper `value-match-shared.mjs`** (not in the original structure, which had the
   runner inline the logic). Reason: the runner (`--value-match`) and the offline A/B need identical
   extract→snap→write→render glue; duplicating it across two I/O files would drift. The helper keeps all
   real logic in the pure module and the two entrypoints thin. No behavioral change vs. the plan.
2. **`changed` semantics clarified.** A swap is "changed" when the placed value-true block differs from
   the model's **literal** name (so `honey_block`→`hay_block` counts as changed even though `hay_block`
   is also honey_block's value-honest resolution). This matches what `.v1` actually rendered (the literal
   block) vs `.v2`, which is what the A/B compares. Documented in the module + the swap report.
3. **No live `--value-match` run executed.** A live run is metered (model + Nano Banana). The flag is
   wired and unit-covered via the shared helper path; the A/B exercises the same extract→snap→render
   chain offline against committed runs, so the live path is validated end-to-end except the model call
   itself.

## Honest limitations surfaced (carried into review.md)

- **Palette collapse:** several distinct model blocks can snap onto one realized cluster (moai:
  `andesite`/`cobblestone_stairs`/`stone_bricks` → `copper_ore`), reducing material variety. `k`
  (cluster count) is a knob to widen the target set.
- **Under-correction:** the hue-anchor lifts to the nearest realized neutral, not necessarily the
  lighter realized *dominant* — the moai body gains +5.5, not the full gap to the L41 dominant. Honest,
  and the realized palette is printed so the residual is visible.
