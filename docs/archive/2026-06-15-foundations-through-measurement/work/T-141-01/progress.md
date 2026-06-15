# Progress — T-141-01 rustic-headroom

## Status: implementation complete, full suite green (2020/2020)

## Steps executed (vs plan.md)

- **Step 0 baseline** — confirmed clean: `npm test` 2018/2018 green at HEAD (stash-verified all 6
  later failures were caused by my change, none pre-existing).
- **Step 1 pack rows** — `packs/rustic.json` `proportions`: `storeyHeight.max 4→5`,
  `pitchClasses [1]→[1,2]`. `pack:validate` green.
- **Step 2 provenance** — `wealthClass` gained the tall-hall storey-column line; `roofingEconomy`
  gained the class-2 steep-pitch line. `pack:validate` still green.
- **Step 3 lever tests** (`src/workshop/geometry.test.mjs`):
  - G3 message `\[1\]`→`\[1, 2\]` (rustic now forbids class 3, not class 2).
  - G3c rewritten: rustic `pitchClass:2` now **lands** across the steep door (was the honest refusal).
  - **G3e** new: cottage wall-raise `eaveHeight:10` → `storeys 2 × storeyHeight 5`, shell rose to 10.
  - **G3f** new: `storeyHeight:6` throws naming the **pack band `[3, 5]`** (schema admits 6 → pack binds).
  - G3b / G3d untouched (saltcrag regression guard).
- **Step 4 gate test + comment**:
  - `program.test.mjs:110` off-pitch mutation `2→3`; the storeyHeight-band test (`:142`) `5→6`.
  - `compile.test.mjs:150` stale comment updated (rustic now declares `[1, 2]`).

## Deviation from plan — the deterministic-derivation blast radius (documented)

The plan anticipated only the lever tests would move. The full suite surfaced **6 failures**, all
**deterministic derivations of the rustic pack** (the recognition prompt and the pack summary embed
the proportion rows verbatim — `prompt.mjs:73-74`, `backlog.mjs:packSummary`). None is a judge
verdict. Each was regenerated to track the pack, NOT hand-faked:

| Failure | Root | Fix |
|---|---|---|
| MP7 band-excursion | factorEave band `{3,4}→{3,5}` | raised the test eave (23.3→sh6) so a band excursion still occurs |
| render-args / S2 | pack_digest / critique block embed `pitchClasses` | literal `[1]`→`[1,2]` |
| B12 packSummary | decompose fixture mirrors `packSummary(rustic)` | regenerated `decompose/inputs.json` style_summary |
| FX decompose (render+sha) | prompt rebuilt from new inputs | regenerated `decompose/prompt.txt` + `ledger.json` sha |
| FX-R1 cottage/barn | recognition prompt embeds proportions | regenerated `promptSha256` in `{cottage,barn}.replies.json` |
| formation-replay | `comparePacks(draft, rustic)` sees new rows | regenerated `rustic-rederived/comparison.json` (README byte-identical) |

Regenerated programmatically via the production functions (`recognitionRenderArgs`, `packSummary`,
`comparePacks`, `bamlBatch` render mode — local, no model call). Every fixture diff is minimal:
SHA-only in the replies/ledger; one Proportions line in the decompose summary; the proportions block
in the comparison. **Verified untouched: `saltcrag.json`, `proportion-baselines.json`, the patternbook
gate records, the proportion-milestone** — the T-143-owned re-verdict surface.

## Verification ledger
- `npm run pack:validate` → `rustic: schema OK, semantic OK (0 findings)`.
- `node --test` on every touched test file → green individually.
- `npm test` → **2020/2020** (baseline 2018 + G3e + G3f).
- Diff scope: 13 files (1 pack data, 6 regenerated fixtures, 6 test files). No runner/chain/judge/pin
  command invoked.

## Remaining
- Commit (Step 6) — one atomic commit on `main` (Lisa lock-serialized).
- review.md (Review phase).
