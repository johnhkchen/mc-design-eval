# T-046-01 — Structure: llm-form-edit-route

The blueprint. **Additive only** — no existing module is modified (AC #3). New files: the pure editor
core, a BAML edit function + its tsx bridge, the pure unit suite, the A/B harness, and a GL-gated live
proof. The generated `baml_client/` is regenerated and committed.

## File change set

| File | Action | What |
|------|--------|------|
| `src/revise/form-edit.mjs` | **create** | the LLM editor: edit-op vocabulary, PURE `applyFormEdit` + bounds, `makeFormEditor` factory (diagnose/tweakFor seams + stash), live `defaultProposeEdit` leaf |
| `src/revise/form-edit.test.mjs` | **create** | PURE unit suite — op application, bounds rejection, AJV gate, router dispatch, stash replay (no GL/SDK) |
| `baml_src/revise.baml` | **create** | `ReviseRegion` BAML fn + `RegionEdit`/`EditOp` types |
| `src/revise/baml-revise.mts` | **create** | tsx bridge: render `ReviseRegion`, pipe via `requestTextWithImage`, SAP-parse, emit `{ops}` |
| `baml_client/**` | **regenerate** | `baml-cli generate` after revise.baml (committed, like siblings) |
| `benchmarks/sculpture/form-revise-ab.mjs` | **create** | koi + heart A/B: before/after IoU + kept/rolled-back trace + saved renders → committed `.json` + `.md` |
| `render/test/form-edit.live.test.mjs` | **create** | GL-gated live proof — one real ReviseRegion round-trip through the loop |
| `benchmarks/sculpture/form-revise-ab.{json,md}` | **generate** | committed A/B output (when run with GL+subscription) |

**Unmodified (depended on):** `src/revise/loop.mjs`, `src/revise/region.mjs`, `src/revise/tweak.mjs`,
`src/sdk-binding.mjs`, `src/artifact.mjs`, `src/sculptor/review.mjs`, `src/form/form-fidelity.mjs`,
`src/config.mjs`, `src/expand.mjs`.

## `src/revise/form-edit.mjs` — public API

```js
export const FORM_EDIT_SCHEMA = "form-edit/v1";
export const LLM_EDIT_ROUTE = "llm-edit";            // the new route key (outside the procedural set)
export const EDIT_KINDS = Object.freeze(["add", "remove", "move", "swap"]);

// --- the pure heart (AC #5) ------------------------------------------------
// Apply a bounded edit-op list to an in-region placement set, clamped to R.
// Ops address placements by ORIGINAL index (tombstones keep indices stable across removes).
// add/move are bounds-checked with expandPlacement against subBounds; an op that escapes R is
// REJECTED (recorded), not thrown. remove/swap cannot escape. Never returns an empty set if the
// input was non-empty (schema floor). PURE; inputs never mutated; deterministic.
export function applyFormEdit(inRegion, subBounds, ops);
//   -> { placements: Placement[], applied: EditOp[], rejected: Array<{op, reason}> }

// True iff every expanded voxel of `placement` lies inside `subBounds` (reuses coordInBounds).
export function placementInBounds(placement, subBounds);  // -> boolean

// A stable string key for a region's subBounds (stash key). PURE.
export function regionKey(subBounds);                     // -> string

// --- the editor factory (D1/D4) -------------------------------------------
// Returns the two loop seams sharing a private Map<regionKey, Placement[]> (the stash).
// `critic`   : (artifact,R,observation) => routed[]   default proceduralDiagnose
// `propose`  : (artifact,R,observation,defect) => Promise<{ops}>   default defaultProposeEdit (live)
// `validate` : (candidateArtifact) => void (throws)   default assertArtifact (AJV)
// `applyEdit`: (artifact,R,placements) => artifact    default applyRegionEdit (the lock)
export function makeFormEditor(opts = {});
//   -> { diagnose, tweakFor, stash }   // stash exposed for the A/B trace + tests

// --- the live leaf (GL + metered; NOT unit-tested) ------------------------
// Spawn baml-revise.mts with the crop image + indexed in-region placements; return parsed {ops}.
export async function defaultProposeEdit(artifact, R, observation, defect, opts = {});
```

### `makeFormEditor` internals (no loop change)

```
const stash = new Map();
async function diagnose(artifact, R, observation) {
  const routed = await critic(artifact, R, observation);
  if (!routed?.length) return [];
  const top = routed[0];
  if (top.route === "relief" || top.route === "material") return [top];   // procedural editor
  // form defect → LLM editor
  try {
    const { ops } = await propose(artifact, R, observation, top.defect);
    const { placements } = applyFormEdit(R.placements, R.subBounds, ops);
    const candidate = applyEdit(artifact, R, placements);                  // the lock (region.mjs)
    validate(candidate);                                                   // AJV (artifact.mjs)
    if (placements.length) stash.set(regionKey(R.subBounds), placements);  // else: no stash → no-op
  } catch { /* invalid/out-of-bounds → leave unstashed → identity no-op rolled back */ }
  return [{ defect: top.defect, where: top.where, route: LLM_EDIT_ROUTE }];
}
function tweakFor(route, attempt, intent) {
  if (route === LLM_EDIT_ROUTE) return (inRegion, sub) => stash.get(regionKey(sub)) ?? inRegion;
  return scopedTweakFor(route, attempt, intent);
}
```

**Imports:** `applyRegionEdit` from `./region.mjs`; `scopedTweakFor`, `proceduralDiagnose` from
`./tweak.mjs`; `expandPlacement` + bounds helpers (`coordInBounds`) from `./region.mjs`/`../expand.mjs`;
`assertArtifact` from `../artifact.mjs`. The live `defaultProposeEdit` LAZY-imports `node:child_process`
+ path/fs (the `defaultDiagnose` idiom) so the pure core loads no subprocess machinery. **No top-level
GL/SDK/render import** — enforced by a static-import-scan test (the loop.test Group-LE idiom).

## `baml_src/revise.baml`

```
class EditAdd    { kind "add"    placement Voxel | Line | Box | Fill }
class EditRemove { kind "remove" target int }
class EditMove   { kind "move"   target int  delta int[] @description("[dx,dy,dz]") }
class EditSwap   { kind "swap"   target int  block string }
class RegionEdit { ops (EditAdd | EditRemove | EditMove | EditSwap)[] }

function ReviseRegion(subject: string, defect: string, region: string,
                      placements: string, crop: image) -> RegionEdit { client ClaudeStub  prompt #" … "# }
```

Placement classes reuse the facade.baml shapes (Voxel/Line/Box/Fill) — copied locally (BAML files do not
cross-import) or referenced if shared. Prompt: tight-crop semantics, the indexed in-region placement list,
the form defect + region, and a hard rule that every edit stays within the region.

## `src/revise/baml-revise.mts` — bridge (mirrors baml-review.mts)

stdin `{imagePath, subject, defect, region, placements}` → throwaway `ANTHROPIC_API_KEY` →
`b.request.ReviseRegion(subject, defect, region, placements, Image.fromBase64(...))` → extract text+image
blocks → `requestTextWithImage({prompt, images, model: PHASE1_MODEL_ID})` → strip fences/slice braces →
`b.parse.ReviseRegion(cleaned)` → `stdout.write(JSON.stringify({ ops }))`.

## `src/revise/form-edit.test.mjs` — pure groups (AC #5)

- **FE-apply**: each op kind applied; order; index stability under removes (tombstones).
- **FE-bounds**: an in-R `add`/`move` applied; an out-of-R `add`/`move` rejected (recorded, not thrown);
  `remove`/`swap` never rejected.
- **FE-ajv**: a candidate that violates the schema → editor stashes nothing (identity no-op).
- **FE-router**: `relief`/`material` defect → returns that route, stash empty, `tweakFor` delegates to
  `scopedTweakFor`; a form defect (`curve`) with a stubbed `propose` → route `llm-edit`, stash populated,
  `tweakFor` replays the stashed placements.
- **FE-cage**: `makeFormEditor` + `reviseLoop` with a stubbed `propose` + synthetic `score` — an improving
  proposal is **kept** (artifact changes, region locked); a non-improving one is **rolled back**
  (artifact deep-equal to input). Proves AC #3 (no loop change) end to end with no GL/SDK.
- **FE-imports**: static scan of form-edit.mjs source — no top-level `render`/`world`/`gl`/`child_process`/
  `sdk-binding` import.

## `render/test/form-edit.live.test.mjs` — GL-gated live proof

Skips unless `GL_AVAILABLE`. Loads the koi artifact, builds `makeFormEditor({ propose: defaultProposeEdit })`,
runs one `reviseLoop` iteration with `observe: observeRegion`, `score: liveFormScore({conceptPath})`,
forcing a form route so the real ReviseRegion path runs; asserts a numeric before/after and a boolean
`accepted` in the trace (the metered round-trip wired end to end).

## Ordering of changes

1. `form-edit.mjs` pure core (`applyFormEdit`, bounds, `regionKey`) + `makeFormEditor` with injected
   `propose`/`critic` → `form-edit.test.mjs` green (no GL/SDK). Commit.
2. `revise.baml` + regenerate `baml_client/` + `baml-revise.mts` + `defaultProposeEdit` live leaf +
   `form-edit.live.test.mjs` (GL-gated) + `form-revise-ab.mjs`. Commit.
3. Run the A/B (GL+subscription) → commit `form-revise-ab.{json,md}` + saved renders (when available).
