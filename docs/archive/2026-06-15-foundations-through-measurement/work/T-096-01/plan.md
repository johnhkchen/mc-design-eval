# T-096-01 kit-extraction — Plan

Six implementation steps, each independently verifiable and atomically committable. `npm run
test:unit` must stay green after every step; the live model calls happen only in step 5.

## Step 1 — Vocabulary: builder + committed JSON

- Write `scripts/build-block-vocab.mjs` (createRequire → `palettes/` workspace's
  `minecraft-data`, pin 1.20.1, NON_SURVIVAL denylist copied with provenance comment, sorted
  bare names, `block-vocab/v1` envelope).
- Run it; commit `src/form/block-vocab.json`.
- **Verify**: JSON contains `oak_trapdoor`, `oak_fence`, `smooth_sandstone`, `lantern`,
  `spruce_door`; excludes `barrier`, `air`, `command_block`; count ≈ 950–1003; re-run is
  byte-identical (`git diff --exit-code`).
- Commit: `feat(E-26 T-096-01): committed survival block vocabulary from minecraft-data`.

## Step 2 — Pure core: parse + validate (`src/form/kit.mjs` + tests)

- Constants, `loadBlockVocab`, `derivedFormClass`, `bandRefsFromZoneRecord`, `buildKitPrompt`,
  `parseKit`, `assertKit`.
- Tests (`src/form/kit.test.mjs`):
  - vocab loads; trapdoor/fence/door/lantern are members (the E-21 dropped trio now survives
    `parseKit` — regression-pin with the actual cottage `dropped` entries as input).
  - hallucinated block (`marble_bricks`) → dropped `unknown-block`.
  - `derivedFormClass`: `stone_bricks`→cube, `oak_fence`→rail, `dark_oak_trapdoor`→fixture,
    `oak_fence_gate`→fixture, `iron_bars`→rail.
  - declared `cube` for a trapdoor → kept as fixture + `form-class-corrected` flag +
    `declaredFormClass` preserved.
  - whereUsed: `band0`/`roof` valid against an injected band list; `band9` → `unknown-where-ref`
    flag, entry kept; feature terms valid.
  - dedup `(block, role)`; missing confidence defaults to medium + flag; empty reply →
    `assertKit` throws.
  - `bandRefsFromZoneRecord`: real committed `zone-map/cottage.json` shape (inline fixture) →
    band names + roles, **no block IDs anywhere in promptBands**; non-readable record throws.
  - `buildKitPrompt` mentions every band name, the JSON contract keys, all three formClasses.
- **Verify**: `npm run test:unit` green.
- Commit: `feat(E-26 T-096-01): kit pure core — recognition schema, vocab validation, formClass ground-truth`.

## Step 3 — Pure core: value verification + overrides + diff (+ tests)

- `verifyKitValues`, `kitOverrides`, `diffKitVsMap`.
- Tests:
  - verified: synthetic swatch at the block's own table Lab → `verified`, ΔEw ≈ 0.
  - mismatch: swatch far from block Lab → `flagged-mismatch`, `flaggedForReview: true`, and —
    the AC #2 pin — **`block` is unchanged** (no silent snap).
  - `thin-sample` (cells < MIN_CELLS), `no-swatch` (absent from swatch map), `non-cube` ⇒
    `valueCheck.reason === "non-cube"` for fixture/rail.
  - `kitOverrides`: verified cube covering band1 whose band dominant is `white_terracotta` and
    kit block `smooth_sandstone` → override `{white_terracotta: "smooth_sandstone"}`; an
    UNVERIFIED (flagged) entry yields NO override; identity pair recorded, not emitted;
    roof covered via `whereUsed: ["roof"]`.
  - `diffKitVsMap`: correction row for the terracotta case; `recovered` contains a trapdoor
    entry absent from the old map.
- **Verify**: `npm run test:unit` green.
- Commit: `feat(E-26 T-096-01): kit value verification (flag, never snap) + band overrides + map diff`.

## Step 4 — Runner (`benchmarks/sculpture/kit-extract.mjs`) + npm script

- Registry (cottage, gatehouse), `--offline` / `--subject` flags, raw-record persistence,
  JSON extraction (fence-strip + brace-slice), swatch sampling, record + md writers.
- **Verify** (no live call): `node benchmarks/sculpture/kit-extract.mjs --offline` reports
  "no committed raw — skipping" for both subjects and exits 0; `npm run test:unit` green.
- Commit: `feat(E-26 T-096-01): kit-extract runner — pinned raw records, offline revalidation`.

## Step 5 — LIVE extraction + committed kit records (the proof)

- `npm run kit:extract` (strong tier via `claude -p` subscription; 2 multimodal calls).
- Inspect `kit/cottage.{json,md}`: AC #4 wants the viewer-visible ingredients — smooth
  sandstone (or the model's recognition recorded with rationale if it differs), stripped logs,
  planks, trapdoors, fences — and the `white_terracotta` correction visible in `diff`.
  Inspect `kit/gatehouse.*` (same untuned path).
- Re-run `--offline`: record (minus raw) reproduces byte-identically.
- If a reply is unparseable/empty: re-run once; if still bad, commit the raw + a flagged record
  and surface in review.md (collect-don't-throw at the sweep level).
- Commit: `feat(E-26 T-096-01): cottage+gatehouse kits — recognized ingredients, terracotta correction visible`.

## Step 6 — durable-skin wiring + full test pass

- `SUBJECTS.*.kitRecord`; `subK` composition at the renaming point; `zoneMap.kit` recorded.
- **Verify**: `npm run test:unit` full green (≈1084 + new); quick smoke that `buildSkin`
  composes overrides — covered by reading the committed kit record's `overrides` and asserting
  in code review (no GL needed; buildSkin is exercised live only by its runner, which is not in
  CI — note as a review.md concern if not run).
- Commit: `feat(E-26 T-096-01): recognition beats snap — kit overrides at the one renaming point`.

## Testing strategy summary

- **Unit (CI)**: all pure-core behavior (steps 2–3), including the three regression pins that
  encode the ACs — dropped-fixtures-now-survive, mismatch-flags-never-snaps,
  unverified-never-overrides.
- **Integration (manual, recorded)**: the live sweep (step 5) + offline byte-stability re-run.
- **Out of CI**: GL renders (none used here), the durable-skin live runner.

## Risks / contingencies

- Model names a non-1.20.1 block (e.g. newer wood): dropped loudly as `unknown-block`,
  surfaced in `dropped` — acceptable, reviewable.
- Model refuses bands / uses free-text whereUsed: flagged `unknown-where-ref`, kit still
  usable; overrides simply don't fire for unmatched bands.
- Swatch grid gives a kit-only block zero cells (it's a secondary material): `no-swatch` flag —
  expected for trim-class cubes; only band-dominant cubes need verification to drive overrides.
- The cottage roof dominant correction (memory: roof reads dark_oak_planks) may surface as a
  roof override — legitimate recognition output; record it, don't special-case.
