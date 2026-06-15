# Structure — T-005-03 iterative-multimodal.v1 archetype

The blueprint: file-level changes, public interfaces, internal organization, and
ordering. Not code — the shape of the code. Grounded in `design.md`.

## Files

| File | Change | Why |
| --- | --- | --- |
| `src/config.mjs` | **modify** | Add `ITERATIVE_MULTIMODAL_METHOD_ID` so the archetype id has exactly one spelling (mirrors `DEFAULT_PROMPTING_METHOD_ID`). |
| `src/iterative-multimodal.mjs` | **create** | The archetype: pure descriptor + builders + bookkeeping + gates, and the one live `runIterativeTrial`. |
| `src/iterative-multimodal.test.mjs` | **create** | Offline unit suite for the pure surface. Never calls the live fn; never loads SDK/GL. |
| `docs/active/work/T-005-03/*` | **create** | RDSPI artifacts (this set). |

No edits to `single-shot.mjs`, `smoke-trial.mjs`, `trial.mjs`, `sdk-binding.mjs`,
`render-tool.mjs`, `palette.mjs`, `briefs.mjs`, `artifact.mjs`, or any schema. The
archetype reuses their exported surfaces only.

## `src/config.mjs` (modify)

Add one frozen constant beside `DEFAULT_PROMPTING_METHOD_ID`:

```
/** The iterative-multimodal archetype id (spec §7 archetype 3). Single-sourced so
 *  every logged trial has one spelling and Phase-2 sweeps stay greppable. */
export const ITERATIVE_MULTIMODAL_METHOD_ID = "iterative-multimodal.v1";
```

Nothing else changes; `SAFE_TRIAL_OPTIONS` / `FORBIDDEN_TOOLS` are untouched (the
loop runs tool-free).

## `src/iterative-multimodal.mjs` (create)

Header comment in the house style: states it is a NAMED, VERSIONED archetype layered
on the seam (not the single-call runner), the pure/live split, the lazy GL import,
and that the live fn is not `npm test`-exercised (spec §4).

### Imports (all pure — no SDK, no GL at module load)
- `mkdirSync`, `writeFileSync`, `readFileSync` from `node:fs`; `join`, `basename`
  from `node:path`.
- `requestDesignArtifact`, `requestDesignArtifactWithImage` from `./sdk-binding.mjs`.
- `tallyUsage`, `serializeTranscript` from `./trial.mjs`.
- `derivePath`, `renderSummary` from `./render-tool.mjs`.
- `assertAttribution` from `./single-shot.mjs` (reused, archetype-parameterized).
- `loadPalette`, `formatPaletteBlocks` from `./palette.mjs`.
- `TARGET_BRIEFS`, `STYLE_BRIEFS` from `./briefs.mjs`.
- `PHASE1_MODEL_ID`, `ITERATIVE_MULTIMODAL_METHOD_ID` from `./config.mjs`.
- (`renderArtifact` is **not** imported here — lazy `await import` inside the live fn.)

### Public exports

```
// Descriptor — the versioned identity (AC #4). defaultRounds is the configurable
// stop count (AC #2).
export const ITERATIVE_MULTIMODAL = Object.freeze({
  id: ITERATIVE_MULTIMODAL_METHOD_ID,   // "iterative-multimodal.v1"
  version: 1,
  defaultRounds: 3,
  label: "Iterative multimodal (render → see → revise, N rounds)",
});

// @typedef TrialSpec — single-shot's TrialSpec plus optional `rounds` (positive int).

export function assertSpec(spec): void            // target/style/palette/trialId/seed/server + rounds
export function seedMetadataFor(spec): Metadata   // identity pinned to THIS archetype (shared by both builders)
export function buildRound0Prompt(spec): { prompt, seedMetadata }
export function buildRevisionPrompt(spec, round): { prompt, seedMetadata }
export function isNoOpRevision(prev, next): boolean
export function assertInPalette(artifact, palette): void   // AC #3 palette gate
export function assertTrialId(artifact, trialId): void     // join-key stability (AC #4)
export function buildRoundRecord({ round, mode, messages, raw, render?, image? }): object
export function buildIterativeRecord({ artifact, rounds, roundsConfigured, stoppedReason, finishedAt }): object
export async function runIterativeTrial(spec): Promise<{ record, artifact, dir, rounds }>  // LIVE
```

### Internal organization (top → bottom)

1. **Descriptor** `ITERATIVE_MULTIMODAL`.
2. **`assertSpec`** — same field checks as single-shot's `assertSpec` (target ∈
   `TARGET_BRIEFS`, style ∈ `STYLE_BRIEFS`, non-empty `paletteId`/`trialId`/
   `serverStateId`, integer `seed`) **plus**: if `rounds` is present it must be a
   positive integer. Error messages prefixed `iterative-multimodal:`.
3. **`seedMetadataFor(spec)`** — builds the `Metadata` object (`trial_id`,
   `prompting_method_id = ITERATIVE_MULTIMODAL.id`, `model_id`, `seed`,
   `server_state_id`, `target`, optional `created_at`). One place both builders pull
   identity from, so round 0 and revisions cannot disagree.
4. **`metadataPinLines(meta)`** (module-private helper) — the `- metadata.x = "…"`
   prompt lines from a `Metadata`, shared by both builders (DRY within the module).
5. **`buildRound0Prompt(spec)`** — sections: opening ("initial draft of an iterative
   design you will revise from renders — commit to a coherent whole, you will refine
   it") → Target (`TARGET_BRIEFS[target].headline` + `.brief`) → Style
   (`STYLE_BRIEFS[style]` + `palette.description`) → **Material constraint (binding)**
   (`formatPaletteBlocks`) → namespacing + palette record → required metadata pins →
   style record. Deterministic; returns `{ prompt, seedMetadata }`.
6. **`buildRevisionPrompt(spec, round)`** — sections: revision header ("revision
   `round` of an iterative design") → the fixed versioned instruction (see render,
   improve realism/proportion/depth + the neoclassical detail list, stay strictly in
   palette, emit COMPLETE artifact) → binding palette re-injected → metadata re-pins
   (same identity) → style record reminder. Returns `{ prompt, seedMetadata }`. The
   instruction text is identical across rounds (only the header counter varies).
7. **`isNoOpRevision(prev, next)`** — `JSON.stringify({placements,style})` deep-equal
   (canonical, order-sensitive). Guards null/missing operands → not a no-op.
8. **`assertInPalette(artifact, palette)`** — build `Set` of bare whitelist ids;
   for each placement collect `block`, strip `^minecraft:`, assert ∈ set; assert
   `manifest ⊆ set`; assert `palette.palette_id === palette.id`. Throw located error
   listing offenders.
9. **`assertTrialId(artifact, trialId)`** — throw unless
   `artifact.metadata.trial_id === trialId`.
10. **`buildRoundRecord(...)`** — `{ round, mode, status: raw.subtype ?? "unknown",
    usage: tallyUsage(messages, raw) }`, plus `render` (via `renderSummary`, path
    dropped) and `image` when supplied. Pure.
11. **`buildIterativeRecord(...)`** — identity from `artifact.metadata` +
    `schema_version`; `archetype: { id, version, rounds_configured, rounds_run:
    rounds.length - 1, stopped_reason }`; `rounds`; `usage: { totals: sum of each
    round's usage.totals }` via a private `sumTotals`; `status: last round status`;
    `finished_at`. Pure (`finishedAt` is a param).
12. **`runIterativeTrial(spec)`** — LIVE glue (see flow below).

### `runIterativeTrial` flow (the only impure function)

```
assertSpec(spec)
rounds   = spec.rounds ?? ITERATIVE_MULTIMODAL.defaultRounds
palette  = loadPalette(spec.paletteId)
outDir   = spec.outDir ?? "trials";  dir = join(outDir, spec.trialId);  mkdirSync(dir,{recursive})
{ renderArtifact } = await import("../render/src/render-tool.mjs")   // lazy GL

allMessages = []; roundRecords = []; stoppedReason = "rounds"

// Round 0 — text path
{ prompt } = buildRound0Prompt(spec)
m0=[]; { artifact:cur, raw:raw0 } = await requestDesignArtifact({ prompt, model: spec.model,
        onMessage: m => (m0.push(m), allMessages.push(m)) })
assertTrialId(cur, spec.trialId); assertAttribution(cur, ITERATIVE_MULTIMODAL); assertInPalette(cur, palette)
writeFileSync(dir/artifact-round0.json, cur)
roundRecords.push(buildRoundRecord({ round:0, mode:"text", messages:m0, raw:raw0 }))

// Rounds 1..N — multimodal path
for (r = 1; r <= rounds; r++) {
  imgPath = derivePath(dir, spec.trialId, r)
  report  = await renderArtifact(cur, { outPath: imgPath })
  png     = readFileSync(report.path)
  { prompt } = buildRevisionPrompt(spec, r)
  mk=[]; { artifact:next, raw:rawk } = await requestDesignArtifactWithImage({ prompt, images:[png],
          model: spec.model, onMessage: m => (mk.push(m), allMessages.push(m)) })
  assertTrialId(next, spec.trialId); assertAttribution(next, ITERATIVE_MULTIMODAL); assertInPalette(next, palette)
  writeFileSync(dir/artifact-round<r>.json, next)
  roundRecords.push(buildRoundRecord({ round:r, mode:"multimodal", messages:mk, raw:rawk,
                                       render: report, image: basename(imgPath) }))
  noop = isNoOpRevision(cur, next)
  cur  = next
  if (noop) { stoppedReason = "noop"; break }   // last artifact is final
}

// Final store
writeFileSync(dir/artifact.json, cur)
writeFileSync(dir/transcript.jsonl, serializeTranscript(allMessages))
record = buildIterativeRecord({ artifact: cur, rounds: roundRecords, roundsConfigured: rounds,
                               stoppedReason, finishedAt: new Date().toISOString() })
writeFileSync(dir/trial.json, record)
return { record, artifact: cur, dir, rounds: roundRecords }
```

Note `buildRoundRecord` takes a `RenderReport` and calls `renderSummary` itself (so
the path-drop happens in one place); round 0 passes no render.

## `src/iterative-multimodal.test.mjs` (create)

Mirrors `single-shot.test.mjs`. Fixtures: a `HOUSE_SPEC` (target=house,
paletteId=neoclassical, style=neoclassical, trialId, seed, serverStateId); the real
shipped `neoclassical` palette via `loadPalette`. Groups:
- **descriptor** — id is the single-sourced `iterative-multimodal.v1`, version 1,
  defaultRounds 3.
- **assertSpec** — accepts valid; rejects bad target/style/empty strings/non-int
  seed; rejects `rounds` 0, negative, or non-integer; accepts omitted `rounds`.
- **buildRound0Prompt** — injects whole whitelist; carries target headline + neo
  style brief + palette description; pins all metadata incl.
  `prompting_method_id = iterative-multimodal.v1`; says "revise"/"draft" (NOT "no
  revision"); deterministic (byte-identical); model override flows through.
- **buildRevisionPrompt** — carries the detail vocabulary (columns, entablature,
  pediment, steps, window rhythm); re-injects the whitelist; re-pins identity +
  trial_id; says "COMPLETE"; instruction text identical across rounds except the
  counter header; deterministic.
- **isNoOpRevision** — identical placements+style ⇒ true; changed placement ⇒ false;
  metadata-only/manifest-only churn ⇒ true; null operand ⇒ false.
- **assertInPalette** — passes an in-palette artifact (built from neoclassical
  blocks); throws naming an off-palette block; throws on manifest⊄whitelist; throws
  on palette_id mismatch; tolerates `minecraft:` prefix normalization.
- **assertTrialId** — passes on match; throws on mismatch/missing.
- **buildRoundRecord / buildIterativeRecord** — round record carries mode + tallied
  usage + (when given) render summary with no absolute path; iterative record sums
  per-round totals, reports rounds_run/stopped_reason, pulls identity from the
  artifact; `finishedAt` echoed (deterministic).

`runIterativeTrial` is never called (offline guarantee).

## Ordering of changes (atomic, each independently testable)

1. `config.mjs` constant (trivial; no behavior).
2. Module skeleton: descriptor + `assertSpec` + `seedMetadataFor` +
   `metadataPinLines` + tests for the first two.
3. Prompt builders + tests.
4. `isNoOpRevision` + `assertInPalette` + `assertTrialId` + tests.
5. Record builders (`buildRoundRecord`/`buildIterativeRecord` + `sumTotals`) + tests.
6. `runIterativeTrial` live glue (no new tests; covered by the pure surface +
   documented live round-trip).

Each of 1–5 is a green `npm test` and an atomic commit; 6 is the final glue commit.
