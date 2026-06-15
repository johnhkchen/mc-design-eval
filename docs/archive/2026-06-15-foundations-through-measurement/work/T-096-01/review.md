# T-096-01 kit-extraction — Review

## What changed

Six commits on `main`:

| commit | change |
|---|---|
| `53a9a2c` | `scripts/build-block-vocab.mjs` (new) + `src/form/block-vocab.json` (new, committed) — 978 survival-placeable 1.20.1 blocks from `minecraft-data` via the palettes workspace; byte-stable re-runs |
| `75819e8` | `src/form/kit.mjs` (new, pure core) + `src/form/kit.test.mjs` (new) — kit parse/validate, formClass ground-truthing, band refs, prompt, value verification, overrides, diff |
| `48df686` | `benchmarks/sculpture/kit-extract.mjs` (new runner) + `package.json` (`kit:extract`, `build:block-vocab` scripts) |
| `e5c6929` | pure-core fixes from live data: shared-shading ΔL offset, `flagged-candidate` visibility, band-specificity ranking |
| `76c4472` | `benchmarks/sculpture/kit/{cottage,gatehouse}.{json,raw.json,md}` (new, committed) + RDSPI artifacts |
| `f23f0f0` | `benchmarks/sculpture/durable-skin.mjs` (modified: `kitRecord` registry data + `subK` composition + record field) + regenerated `durable-skin/` records |

## Acceptance criteria — status

1. **Kit schema + extractor** ✓ — strong tier through the `claude -p` subscription shim
   (`requestTextWithImage`, `MODEL_TIERS.strong`; the metered SDK is never imported on this
   path). Entries `{block, role, formClass: cube|fixture|rail, whereUsed, confidence}` validated
   against the committed minecraft-data vocabulary; `kit/<subj>.md` is the line-by-line
   human-reviewable artifact beside the concept.
2. **Value verification** ✓ — cube swatches vs concept regions in chroma-weighted CIE-Lab
   (reuses `value-select.mjs` metrics + `block-table.mjs` Lab rows). Mismatch ⇒
   `flagged-mismatch` + `flaggedForReview: true`, block NEVER rewritten (regression-pinned in
   tests). Extractor-declared unidentifiable surfaces carry the recorded
   `fallback: {mode: "color-snap"}`.
3. **Builds on the T-092 band profile** ✓ — `bandRefsFromZoneRecord` consumes the committed
   zone-map/v1 record (refuses prior-fallback records; never re-derives); `buildSkin` composes
   the kit's verified overrides over the value-true snap at the single renaming point
   (recognition beats snap), with the value-select and zone-map agreement assertions untouched
   and passing live.
4. **Cottage proof** ✓ — 7 ingredients, 0 dropped: `smooth_sandstone` REPLACES
   `white_terracotta` (ships, band1 78% final coverage); `spruce_trapdoor`, `spruce_door`,
   `lantern` recovered (the exact rows E-21's full-cube validator dropped); timber framing
   recognized as `spruce_planks` — differs from the ticket's "stripped logs" expectation and is
   recorded with its visual rationale (the AC's "or the LLM's recognition, recorded with
   rationale" clause); window fence/lattice declared `unidentified` honestly (model could not
   distinguish iron_bars / wood lattice / shadow) with the recorded fallback. Diff vs the old
   7-role map is in `kit/cottage.json` (`corrections` + `recovered`).
5. **Gatehouse + green tests** ✓ — same untuned path, zero subject-specific code (registry
   data only): roof recognized `deepslate_bricks` (ships), `stone_brick_stairs` recovered.
   Pinning: verbatim raw replies committed; `--offline` reproduces both records
   byte-identically (checksum-verified). `npm test` green: **1129/1129**.

## Test coverage

- 24 new unit tests in `src/form/kit.test.mjs` covering: vocabulary membership (incl. the
  E-21-dropped-fixtures regression pin), formClass derivation + correction, whereUsed/band-ref
  validation, dedup/confidence defaults, anti-anchoring (no block IDs reach the prompt),
  verification verdicts (verified / flagged-mismatch / thin-sample / no-swatch / non-cube),
  the shared-shading offset (and that it cannot rescue a hue mismatch), flag-never-snap,
  verified-only shipping, band-specificity ranking, ships-aware diff visibility.
- Integration evidence (manual, recorded): live extraction both subjects; offline byte-stability;
  live `skin:cottage`/`skin:gatehouse` end-to-end with all terminal gates passing and
  double-run reproducibility.
- **Gap**: `buildSkin`'s kit composition has no unit test (the function is a benchmark-side
  orchestrator outside the `src/**` test glob, exercised by its runner — consistent with how
  T-092's wiring landed, but a thin pure helper + test could harden it later).

## Open concerns for a human reviewer

1. **Roof override `dark_oak_planks → spruce_planks` (cottage).** The kit's spruce_planks entry
   covers roof+band1+trim; T-093 found the cottage roof reads dark (dark_oak_planks dominant in
   the zone map). The concept's roof FIELD is plausibly the lighter plank with dark eave edging
   — the model's rationale says exactly that — but this override changes the shipped roof and
   deserves an eyeball against `kit/cottage.md` + the new `durable-skin/cottage/view-final-*`
   renders. It may help or hurt the T-093 oblique gate; that gate should be re-run (follow-up,
   not part of this ticket).
2. **Shared-shading offset is a judgment call.** `verifyKitValues` removes the median swatch−
   block ΔL (≥3 cube samples) before the verdict, on the documented "concept previews hue, not
   value" property; without it the cottage's global ~−14 L* shading flagged all four cubes.
   `rawDeltaE` is recorded per entry and the offset (+sample count) in `params` — but the gate
   constant (16 ΔEw) and the offset mechanism were calibrated against this very data; treat
   verification as reviewer evidence, not ground truth (the known whitelist-quantization
   circularity is noted in design.md §4).
3. **Gatehouse roof `deepslate_bricks` vs `deepslate_tiles`** — verified and shipped, but tiles
   vs bricks is a fine-grained texture call from one image; same eyeball recommendation.
4. **Fixtures/rails are extracted but not yet placed** — `spruce_trapdoor`/`spruce_door`/
   `lantern`/`stone_brick_stairs` live in the kit with `whereUsed` but nothing consumes them
   yet; that is E-26's dressed-openings story, by design out of scope here.
5. **Sibling-session note**: `runs/016-…church/concept-checklist.md` showed local modifications
   during this session (T-094 in flight) — not touched, not committed by this ticket.

## Known limitations / TODOs

- The vocabulary pins 1.20.1; a version bump requires `npm run build:block-vocab` (byte-stable,
  provenance recorded in the JSON).
- `kitOverrides` resolves band dominants only; secondaries (e.g. the cobblestone quoins) are
  never overridden — intentional scope, noted for E-26 follow-ups.
- Multi-angle gate records (T-093) now describe the PRE-kit skins; re-running `gate:multi`
  against the regenerated artifacts is the natural next measurement.
