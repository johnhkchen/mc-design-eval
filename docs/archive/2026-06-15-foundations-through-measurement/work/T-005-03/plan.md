# Plan — T-005-03 iterative-multimodal.v1 archetype

Ordered, independently-verifiable steps. Each pure step ends green on `npm test` and
is an atomic commit. The live glue step is verified by the pure surface plus a
documented manual round-trip (spec §4: live calls are metered, out of `npm test`).

Baseline: **109/109** green. Target: **109 + ~30** new pure tests green; zero
regressions.

## Step 1 — single-source the archetype id (`config.mjs`)

Add `export const ITERATIVE_MULTIMODAL_METHOD_ID = "iterative-multimodal.v1";`
beside `DEFAULT_PROMPTING_METHOD_ID`, with a one-line jsdoc.

**Verify:** `npm test` still 109/109 (pure-data module, no behavior). Commit:
`T-005-03: single-source the iterative-multimodal archetype id`.

## Step 2 — module skeleton: descriptor, assertSpec, identity seed

Create `src/iterative-multimodal.mjs` with the house-style header, the pure imports,
`ITERATIVE_MULTIMODAL`, `assertSpec` (single-shot's checks + `rounds` positive-int
when present), `seedMetadataFor`, and the private `metadataPinLines`.

Create `src/iterative-multimodal.test.mjs`: descriptor tests (id =
`iterative-multimodal.v1`, version 1, defaultRounds 3) and `assertSpec` tests
(valid spec passes; bad target/style, empty paletteId/trialId/serverStateId,
non-integer seed each throw; `rounds: 0` / `-1` / `2.5` / `"3"` throw; omitted
`rounds` passes).

**Verify:** `npm test` green, ~10 new tests. The suite importing the module is proof
no SDK/GL loads. Commit: `T-005-03: iterative-multimodal descriptor + spec guard`.

## Step 3 — prompt builders

Add `buildRound0Prompt(spec)` and `buildRevisionPrompt(spec, round)` (both pure,
returning `{ prompt, seedMetadata }`), reusing `seedMetadataFor` /
`metadataPinLines` / `formatPaletteBlocks`.

Tests:
- round-0: injects the whole `neoclassical` whitelist; carries `TARGET_BRIEFS.house.
  headline` + `STYLE_BRIEFS.neoclassical.brief` + palette description; pins every
  metadata field incl. `prompting_method_id = iterative-multimodal.v1`; matches
  `/draft/` and `/revise/` and does **NOT** match `/no revision/`; byte-identical on
  re-run; a `model` override appears in prompt + `seedMetadata`.
- revision: matches each of `columns`, `entablature`, `pediment`, `steps`, and a
  window-rhythm phrase; re-injects the whitelist; re-pins `trial_id` +
  `prompting_method_id`; matches `/COMPLETE/`; `buildRevisionPrompt(spec,1)` and
  `(spec,2)` differ only by the revision-counter header (assert equality after
  stripping that line); byte-identical on re-run for a fixed round.

**Verify:** `npm test` green, ~12 new tests. Commit: `T-005-03: round-0 + versioned
revision prompt builders`.

## Step 4 — gates: no-op, palette adherence, trial-id stability

Add `isNoOpRevision(prev, next)`, `assertInPalette(artifact, palette)`,
`assertTrialId(artifact, trialId)`.

Tests:
- `isNoOpRevision`: identical `{placements,style}` ⇒ true; a changed placement coord/
  block ⇒ false; metadata-only or `palette.manifest`-only difference ⇒ true (build
  unchanged); a `null`/`undefined` operand ⇒ false.
- `assertInPalette`: an artifact whose placements + manifest use only `neoclassical`
  blocks (namespaced) passes; an off-palette `minecraft:slime_block` placement throws
  naming the block; a `manifest` entry outside the whitelist throws; a `palette_id`
  ≠ the palette's id throws; bare-vs-`minecraft:` normalization handled.
- `assertTrialId`: equal passes; unequal/missing throws.

**Verify:** `npm test` green, ~9 new tests. Commit: `T-005-03: palette-adherence,
no-op, and trial-id gates`.

## Step 5 — record builders

Add private `sumTotals(rounds)`, `buildRoundRecord(...)`, `buildIterativeRecord(...)`.

Tests (using `tallyUsage`-shaped message/result stand-ins, like `trial.test.mjs`):
- `buildRoundRecord`: text round → `{ round:0, mode:"text", status, usage:{turns,
  totals} }`, no `render`/`image`; multimodal round given a `RenderReport`-shaped
  object → carries `render` (a `renderSummary` with **no absolute path**) + `image`.
- `buildIterativeRecord`: identity pulled from the (final) artifact's metadata +
  `schema_version`; `archetype` block carries id/version/`rounds_configured`/
  `rounds_run`/`stopped_reason`; `usage.totals` equals the per-round sum; `status`
  from the last round; `finished_at` echoes the passed param (deterministic).

**Verify:** `npm test` green, ~7 new tests. Commit: `T-005-03: per-round + iterative
trial record builders`.

## Step 6 — live glue `runIterativeTrial`

Add the live function per `structure.md`'s flow: lazy-import `renderArtifact`;
round-0 text call; rounds 1..N render → `requestDesignArtifactWithImage`; the three
gates per round; per-round + final store writes; assemble + return the record. No
new unit tests (it spawns the metered CLI + needs GL — spec §4); its logic is the
already-tested pure surface.

**Verify:**
- `npm test` still green (the module's pure tests still run; importing the live fn
  does not load GL/SDK because the import is lazy).
- `node --check src/iterative-multimodal.mjs` (syntax).
- A grep confirms `runIterativeTrial` calls `requestDesignArtifact` (round 0),
  `requestDesignArtifactWithImage` (rounds), and each of the three gate functions.

Commit: `T-005-03: runIterativeTrial live loop (render → see → revise)`.

## Testing strategy summary

| Surface | How verified |
| --- | --- |
| descriptor, assertSpec | unit (offline) |
| buildRound0Prompt, buildRevisionPrompt | unit — content regex + determinism |
| isNoOpRevision, assertInPalette, assertTrialId | unit — pass/throw cases |
| buildRoundRecord, buildIterativeRecord | unit — shape + sum + identity, `finishedAt` param |
| runIterativeTrial | NOT unit-tested (spec §4); `node --check` + the pure surface + a documented live round-trip |

## Manual live verification (post-implementation, metered — documented, not run by CI)

A human runs one trial to confirm AC #1/#2 end to end (inherits the T-005-02 AC #2
gating round-trip):
```
node -e "import('./src/iterative-multimodal.mjs').then(m => m.runIterativeTrial({
  target:'house', paletteId:'neoclassical', style:'neoclassical',
  trialId:'phase1-house-iter-0001', seed:7, serverStateId:'flat-creative-superflat.v1',
  rounds:2 }).then(r => console.log(r.dir, r.record.archetype)))"
```
Confirm: `trials/phase1-house-iter-0001/` holds `artifact.json`,
`artifact-round{0,1,2}.json`, `*-rev{1,2}.png`, `transcript.jsonl`, `trial.json`;
each round's artifact is schema-valid + in-palette + attributed; the revision turns'
`input_tokens` jump (image tokens); the model's text references what is visible in
the render (AC #2). If the CLI rejects the stream-json image envelope, take the
T-005-02 `--mcp-config` fallback (a seam change, not an archetype change).

## Risks & mitigations

- **Stream-json image envelope unverified live (inherited).** Mitigation: documented
  fallback; flagged in `review.md`; does not block the artifact set.
- **No-op false-positive/negative.** Mitigation: compares only build-determining
  `{placements,style}`, deterministic; default 3 rounds bounds cost regardless.
- **Off-palette model output.** Mitigation: `assertInPalette` fails the round loudly
  (AC #3) rather than logging a bad row.
- **Attribution drift across rounds.** Mitigation: every round re-pins identity and
  is guarded by `assertAttribution` + `assertTrialId` before logging (AC #4).
