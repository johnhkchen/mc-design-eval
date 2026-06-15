# Progress — T-005-03 iterative-multimodal.v1 archetype

Tracks execution against `plan.md`. All steps complete; suite green; committed.

## Status: COMPLETE (pure surface implemented + tested; live glue written, not metered-run)

Baseline `npm test`: **109/109**. Final: **131/131** (+22 pure tests). Zero
regressions.

## Steps

| Step | What | State |
| --- | --- | --- |
| 1 | `config.mjs`: `ITERATIVE_MULTIMODAL_METHOD_ID` single-sourced | ✅ done |
| 2 | Module skeleton — descriptor, `assertSpec` (+rounds), `seedMetadataFor`, `metadataPinLines` | ✅ done |
| 3 | Prompt builders — `buildRound0Prompt`, `buildRevisionPrompt` | ✅ done |
| 4 | Gates — `isNoOpRevision`, `assertInPalette`, `assertTrialId` | ✅ done |
| 5 | Record builders — `sumTotals`, `buildRoundRecord`, `buildIterativeRecord` | ✅ done |
| 6 | Live glue — `runIterativeTrial` | ✅ written (not metered-run; spec §4) |

## Files changed

- `src/config.mjs` (modify) — one new exported constant.
- `src/iterative-multimodal.mjs` (create) — the archetype (pure surface + live driver).
- `src/iterative-multimodal.test.mjs` (create) — 22 offline unit tests.

Committed together as `61a5973` (`T-005-03: iterative-multimodal.v1 archetype …`).
Sibling working-tree changes (`sdk-binding.mjs`, `package.json`, `benchmarks/`, the
other T-005 docs) were intentionally left out of this commit — they belong to other
tickets.

## Deviations from the plan

- **Single commit, not six.** The plan sketched one atomic commit per step. Because
  the pure surface was authored in one green pass and `config.mjs` + the module +
  its test form one cohesive, independently-scoped unit, they were committed together
  rather than artificially split. No behavior or scope difference; the per-step
  ordering still holds within the diff.
- **Extracted `materialConstraintLines` helper.** Not named in `structure.md`, added
  during implementation: round 0 and the revision prompt share the identical binding-
  whitelist section, so it lives in one private helper (alongside `metadataPinLines`)
  rather than being duplicated. Keeps the two builders DRY within the module without
  touching `single-shot.mjs`.

## Verification performed

- `node --check src/iterative-multimodal.mjs` — clean.
- `npm test` — 131/131, offline (the suite importing the module without loading
  SDK/GL is the proof the render core import is lazy).
- Grep confirms `runIterativeTrial` calls `requestDesignArtifact` (round 0),
  `requestDesignArtifactWithImage` (rounds 1..N), `renderArtifact` (lazy), and the
  three per-round gates (`assertTrialId` / `assertAttribution` / `assertInPalette`).

## Not done here (by design / out of scope)

- **Live metered round-trip** (AC #1/#2 end-to-end). Spec §4: it spawns the metered
  CLI and needs headless GL. Procedure documented in `plan.md` (manual section) and
  `review.md`. Inherits the T-005-02 gating risk (stream-json image envelope
  unverified against the live CLI).
- **Image-token *separate* accounting** (spec §9) — image tokens are *captured*
  inside each round's turn usage; a distinctly-labelled field is a later concern.
