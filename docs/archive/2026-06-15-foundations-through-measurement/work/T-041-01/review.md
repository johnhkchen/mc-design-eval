# T-041-01 — Review: value-matched-build

Handoff for a human reviewer. Story S-041, epic E-14 — the **build end** of the concept-build palette
co-design loop. Wires the T-039-01 value-honest contract into the live build so placement hits the
concept's **value**, not just its name.

## What changed

**Commit 1 — `feat(E-14 T-041-01): snapArtifactToValueTrue — value-matched build path`**
- `src/config.mjs` (M) — added `VCONCEPT_SCULPTURE_METHOD_ID_V2 = "vconcept-sculpture.v2"`.
- `src/color/value-build.mjs` (NEW, ~150 lines) — the deliverable. `snapArtifactToValueTrue(artifact,
  realized, opts)`: per distinct model-named block, **hue-anchor** (`resolveValueTruePalette([name])`)
  → **nearest realized cluster** (`nearestLab`) → adopt that cluster's **value-true block**; rewrite
  every `placement.block`, rebuild `palette.manifest` (first-seen), optionally stamp the `.v2` method
  id. Pure, GL-free, network-free; never mutates the input (`structuredClone`). Exports
  `VALUE_MATCHED_SCHEMA`.
- `src/color/value-build.test.mjs` (NEW) — 7 tests, groups A–G.
- `src/sculpture.mjs` (M) — `VCONCEPT_SCULPTURE_V2` descriptor; **build prompt unchanged** (model owns
  form + where).

**Commit 2 — `feat(E-14 T-041-01): value-matched A/B (moai+sword+pineapple) + runner flag`**
- `benchmarks/sculpture/run.mjs` (M) — additive `--value-match` flag (default off); `.v1`
  artifact/render/turntable path byte-unchanged; on the flag, writes `.v2` sidecars + renders
  `render-3q.value.png` + a `valueMatch` block in `summary.json`.
- `benchmarks/sculpture/value-match-shared.mjs` (NEW) — extract→snap→write(+optional render) glue
  shared by the runner and the A/B.
- `benchmarks/sculpture/value-match-ab.mjs` (NEW) — offline A/B over committed runs (no model call).
- Per-run sidecars (NEW) for 001-moai / 007-sword / 013-pineapple: `artifact.value-matched.json`,
  `value-swaps.{json,md}`, `render-3q.value.png`; plus top-level `value-match-ab.md`.

## Acceptance criteria — status

- **AC1 — snap to value-true via `nearestLab` against the S-039 contract + realized palette from
  `extractPaletteFromImage`, additive to an untouched `.v1`** ✔. The snap routes each block through
  `resolveValueTruePalette` (the S-039 contract) and `nearestLab` over the extracted realized palette.
  `.v1` files verified byte-unchanged (git shows only new untracked sidecars + the additive flag).
- **AC2 — A/B for ≥3 subjects (moai+sword+pineapple): `.v1` vs value-matched render + per-region
  swap** ✔. `value-match-ab.md` + each run's `value-swaps.md`/`render-3q.value.png`.
- **AC3 — moai value-drift explicitly addressed, or regressions shown honestly** ✔. `gray_concrete`
  (L24.3) → `deepslate_bricks` (L29.8), **+5.5**; the collapse of `andesite`/`cobblestone_stairs`/
  `stone_bricks` onto `copper_ore` and the modest (not maximal) lift are reported, not hidden.
- **AC4 — renders saved; `npm test` green** ✔. Three `.value.png` saved; `npm test` 348/348.

## Test coverage

- **Unit (the pure block-choice logic):** groups A (rewrite + manifest rebuild + counts), B (dark→light
  value lift), C (non-table name `honey_block` snaps to a real block), D (input-shape flexibility),
  E (determinism + **input not mutated** + methodId stamps clone only), F (empty/no-name errors),
  G (numeric/real-id swap rows + **snapped artifact re-validates against the canonical AJV schema**).
- **Integration (offline, executed):** the A/B ran the full extract→snap→render chain on three real
  committed runs; GL renders succeeded; the moai visual A/B confirms the value cure.
- **Gaps (intentional, per AC):** (a) the **live** `--value-match` run is not executed here (metered
  model + Nano Banana) — the flag shares the unit-covered helper path and the A/B exercises the same
  chain offline. (b) The extractor and renderer are exercised but not re-unit-tested (they are E-10 /
  render-harness code with their own suites; this ticket adds no math to them).

## Open concerns / known limitations (for a human)

1. **Palette collapse — the main quality tradeoff.** When the concept's realized palette has fewer
   distinct clusters than the model's manifest, several model blocks snap to one realized block (moai
   mid-grays → `copper_ore`), which can read as surface noise where the model wanted a clean field. The
   `k` cluster-count knob widens the target set; a future refinement could cap one-to-many collapse or
   prefer distinct targets. Not a blocker — it is reported per-run.
2. **Under-correction by design.** Hue-anchor matches a block to its *nearest* realized cluster, not the
   realized *dominant*; the moai body lifts +5.5, not the full gap to the L41 dominant. This is the
   honest, ordering-independent choice (coverage-rank alignment was rejected as fragile — see design.md).
   The realized palette is printed so the residual gap is visible.
3. **No placement↔pixel mapping** (the fundamental limit). A 3-D placement cannot be matched to a 2-D
   concept *region*; association goes through the block name's value-honest color. This is the standing
   image→3D gap deferred in E-13; the dominant-palette bridge is the best available signal.
4. **`changed` vs literal name.** A swap is "changed" relative to the model's literal block id, so
   `honey_block`→`hay_block` counts even though `hay_block` is honey_block's value-honest resolution —
   because `.v1` renders the literal `honey_block` and `.v2` renders `hay_block`. Correct for the A/B,
   but worth knowing when reading `changedPlacements`.

## Handoff to S-042

`snapArtifactToValueTrue` + `value-swaps.json` (with `realizedUsed`, `changedPlacements`, per-block ΔE)
are the inputs S-042's co-design A/B + ΔE gate consume. The `.v2` artifacts are schema-valid and
render-ready for the E-12 best-of handoff.
