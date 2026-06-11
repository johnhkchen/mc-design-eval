# T-129-01 baml-design-functions — Plan

Phase: Plan. Each step commits atomically and is verified before the next. Spend is metered:
exactly two live model calls (step 7), pin-guard preflight before each, nothing else live.

## Step 1 — BAML sources + codegen wired (commit: `feat(E-32 T-129-01): four design functions in baml_src`)
1. Write `baml_src/recognition.baml`, `critique.baml`, `vernacular.baml`, `decompose.baml`
   (classes + templates per structure.md; templates transplanted verbatim from
   `buildRecognitionPrompt` / `buildWorkshopPrompt`).
2. Resolve the `AdjustParams.params` map typing against the generator (try
   `map<string, int | float | bool | string>`; fall back per design D4.2 and record).
3. `npm run baml:gen` green; `git status` confirms `baml_client/` stays untracked.
4. `package.json`: add `pretest`, `baml:mint`. `npm test` still green (pretest now regenerates).
**Verify:** codegen exits 0; `npm test` green; no diff under `baml_src/{judge,facade,conceptart,
review,revise,materialcorrect,materialmap,clients,generators}.baml`.

## Step 2 — The bridge + transport/judge guards (commit: `feat(E-32 T-129-01): one bridge, render+parse, never transport`)
1. `src/baml/bridge.mts` (batch protocol, dummy-key guard, dispatch over the four functions).
2. `src/baml/bridge.mjs` (spawn wrapper: `bamlBatch`/`bamlRender`/`bamlParse`).
3. `src/baml/transport-guard.test.mjs` (bridge source guard; repo metered-key grep; AC3 judge
   isolation greps).
4. Smoke by hand: render `AuthorMaterialStory` with a dummy brief; confirm `{prompt}` comes back
   and no network/key involved.
**Verify:** `npm test` green; transport-guard test fails if a `b.<Fn>(` call or a stray
`baml_client` import is planted (negative check done locally, not committed).

## Step 3 — Recognition migration, byte-identical (commit: `feat(E-32 T-129-01): recognition prompt is a BAML function — sha-pinned to the committed records`)
1. Add `recognitionRenderArgs` to `src/recognition/prompt.mjs`.
2. Iterate `recognition.baml` template until rendered sha256 equals the committed
   `promptSha256` for BOTH cottage and barn (driver: a scratch invocation of `bamlBatch`;
   the fixture test then pins it).
3. Migrate `recognize.mjs` to `bamlRender`; retire `buildRecognitionPrompt`.
4. `src/baml/fixtures.test.mjs` (first cases): recognition render-sha pins; `b.parse` over
   committed `rawTexts` accepted replies == committed `program.json` (normalized); malformed
   specimen (barn attempt-2 prose reply) rejects.
**Verify:** `npm run recognize:offline` — byte-identical, conformance PASS, exit 0; `npm test`
green; grep: `buildRecognitionPrompt` referenced nowhere.

## Step 4 — Critique contract migration, golden-pinned (commit: `feat(E-32 T-129-01): workshop critique prompt is a BAML function — golden-pinned A/B`)
1. **Before touching the builder:** capture `prompt.golden.txt` + `inputs.json` from
   `buildWorkshopPrompt` over the critique.test synthetic fixtures; commit them with this step.
2. Add `critiqueRenderArgs` to `critique.mjs`; iterate `critique.baml` until bridge render ==
   golden bytes; then retire `buildWorkshopPrompt`.
3. Loop seam: `loop.mjs` passes round ctx to `exchange`; port `loop.test.mjs` +
   `critique.test.mjs` B-group; extend `isolation.test.mjs` ISO4 with baml tokens.
4. Fixture cases: critique golden render pin; `b.parse` over `reply-revise.txt`/`reply-done.txt`
   == expected; malformed (multi-fence) rejects.
**Verify:** `npm test` green (all workshop suites); `npm run workshop:replay` and
`npm run workshop:offline` byte-identical/clean (no live calls).

## Step 5 — Workshop runner migration (commit: `feat(E-32 T-129-01): workshop runner asks through the bridge`)
*Sibling-aware (design D9): re-read `benchmarks/sculpture/workshop.mjs` first; if T-127-01 hunks
are uncommitted in it, hold this step until they land (do steps 6–7 meanwhile), then apply.*
1. Exchange closure: `critiqueRenderArgs(ctx)` → `bamlRender` → `runTieredOp` → existing policy.
2. Stage ONLY this file's T-129 hunks; commit alone.
**Verify:** `npm run workshop:replay` + `workshop:offline` still green (replay path does not
execute the exchange — proves committed records re-verify); `node --check` the runner; grep:
no prompt prose in runner.

## Step 6 — Mint runner (commit folded into step 7's)
1. `registryDigest()` in `src/pack/brush-catalog.mjs` (or reuse an existing export if found).
2. `scripts/mint-baml-fixture.mjs` per structure.md (preflight pins → render → `requestText` →
   policy → fixture files).

## Step 7 — Live fixtures for the two new functions (commit: `feat(E-32 T-129-01): vernacular + decompose minted through the shim — the transport proof`)
1. `npm run baml:mint -- --fn vernacular` then `--fn decompose` (2 strong-tier subscription
   calls; budget 3 re-asks each, same-prompt; ledgered).
2. Add their fixture cases to `fixtures.test.mjs` (render-stability pin + parse pin + malformed
   specimen).
**Verify:** ledgers committed with usage + full raws + promptSha256; `npm test` green.
**Contingency:** if a reply never parses within budget, the ledger is still committed (honesty),
the prompt/schema is revised, and a re-mint is a NEW ledger (no overwrite without rotation).

## Step 8 — Proof sweep + Review (commit: `docs(E-32 T-129-01): RDSPI artifacts + proofs`)
1. Grep records into `docs/active/work/T-129-01/` (review.md §proofs): retired builders, judge
   path baml-free, metered-key surface, `baml_client` single-importer.
2. Full `npm test`; `npm run recognize:offline`; `npm run workshop:replay`; `workshop:offline`.
3. `progress.md` finalized; `review.md` written.

## Test strategy summary
- **Unit (pure, no spawn):** `critiqueRenderArgs`/`recognitionRenderArgs` pins (ported B-group);
  loop ctx contract; isolation extensions.
- **Fixture (one tsx spawn per test file):** render byte/sha pins ×4 functions; `b.parse` ×6
  committed replies; malformed rejection ×4.
- **Guards (read-only):** transport + judge isolation greps as executable tests, not one-off
  shell output.
- **Integration (no live):** `recognize:offline`, `workshop:replay`, `workshop:offline` — the
  AC4 behavior-preservation evidence.
- **Live (2 calls):** fixture minting = the AC2 transport proof, T-114-ledgered.

## Contingencies
- Template can't reach byte-identity (BAML trims/dedents irreducibly): fall back to pinning a
  canonical normalization (documented delta, e.g. trailing-newline) and rotate the two
  recognition prompt.md/replies.json pins ONLY with `--rotate-pins` under this ticket — last
  resort, recorded prominently. (Not expected: facade templates preserved interior whitespace.)
- Codegen rejects the params map union: permissive fallback class per design D4.2.
- T-127-01 still dirty at step 5: reorder (5 after 7) — the plan already permits it.
