# T-046-01 — Design: llm-form-edit-route

Decisions weighed against the research. Six questions: **(D1)** how the async model call fits the SYNC
tweak seam without touching loop.mjs; **(D2)** the bounded-edit op vocabulary the model emits and the
pure application/bounds core; **(D3)** the BAML edit function + bridge; **(D4)** the router (form →
LLM, known → procedural) behind one gate; **(D5)** AJV revalidation + the lock; **(D6)** the per-region
IoU accept signal and the A/B.

## D1 — Fitting an async model call behind a SYNC tweak (the crux)

The loop awaits `observe` and `diagnose` but applies `tweakFor`'s result **synchronously**
(`applyRegionEdit(current, R, edit)` calls `edit(R.placements)` and throws unless it gets an array). An
LLM call is async. Three options:

- **(a) Change the loop to `await` the tweak.** *Rejected* — violates AC #3 ("no change to the S-045
  loop control flow") and breaks the cage abstraction the ticket is testing.
- **(b) Pre-render every region and call the model in one batch before the loop.** *Rejected* — couples
  region selection to a pre-pass, and the model should see the *current* (possibly already-revised)
  artifact per region, which only exists mid-loop.
- **(c) Compute the edit in the async `diagnose` seam, stash it, and have the sync `tweakFor` REPLAY the
  stashed edit (chosen).** The loop already `await`s `diagnose(current, R, observation)` *before* the
  attempt loop. So the editor is a **factory** `makeFormEditor(opts) → {diagnose, tweakFor}` that share a
  closed-over `Map<regionKey, placements>`. `diagnose` (async) does the model work and stashes; `tweakFor`
  (sync) returns `(inRegion, sub) => stash.get(keyOf(sub)) ?? inRegion`. **Zero loop.mjs edits** — the
  loop wires `observe: observeRegion`, `diagnose: editor.diagnose`, `tweakFor: editor.tweakFor`.

This is exactly the seam shape the loop was built for: the header of tweak.mjs already says the model
critic is "a drop-in for `proceduralDiagnose` with zero loop changes." The stash is the channel the
`route` string cannot be (research §5): the loop carries `route` from diagnose to tweakFor, and the
shared closure carries the *payload*.

**Why a factory, not module-level state:** the stash must not leak across loop runs or A/B subjects; a
fresh `makeFormEditor()` per `reviseLoop` call gives each run an isolated Map. The key is a string of
`R.subBounds` (`min.join(',')|max.join(',')`) — stable, collision-free within one artifact.

## D2 — The bounded edit: explicit ops + a pure application/bounds core

AC #1 enumerates **add / remove / move / swap of placements within R**; AC #5 wants **"pure
edit-application/bounds logic unit-tested."** That points away from "model restates all in-region
placements" (option i) and toward an **explicit op list** (option ii):

```
EditOp =
  | { kind: "add",    placement: Placement }          // a new placement (must lie in R)
  | { kind: "remove", target: number }                // index into R.placements
  | { kind: "move",   target: number, delta: [dx,dy,dz] }  // translate a placement
  | { kind: "swap",   target: number, block: string } // change a placement's block
```

`applyFormEdit(inRegion, subBounds, ops) → { placements, applied, rejected }` (PURE, in
`src/revise/form-edit.mjs`):

- starts from a copy of `inRegion`; applies ops in order; `remove`/`move`/`swap` address surviving
  placements by their **original index** (a tombstone list, so indices stay stable as removes happen).
- **bounds guard:** `add` and `move` are checked with `expandPlacement` against `subBounds` (reusing the
  same `coordInBounds` test the lock uses) — an op whose every-voxel is in R is **applied**; one that
  escapes is **rejected** (recorded, not thrown — the model is allowed to over-reach; we drop the bad
  op, not the whole edit). `remove`/`swap` never move geometry, so they cannot escape.
- guards the schema floor: never lets the in-region set go empty if that would zero the artifact (the
  loop's `applyRegionEdit` throws on zero total placements; we avoid feeding it that).

This pure function — op application + bounds rejection — is the unit-tested heart (AC #5). It is
deterministic and RNG/GL/SDK-free, so it lives under `src/**/*.test.mjs`.

**Why ops, not a replacement set:** (1) faithful to AC #1's verbs; (2) smaller, auditable model output
that the trace can record ("3 ops: +1 add, 1 move"); (3) the bounds logic has something concrete to
test (reject an out-of-R `move`); (4) a replacement set hands the lock a blank check, where ops make
the model's *intent* legible and boundable. Cost: the model must reference placements by index —
mitigated by sending the indexed in-region list in the prompt.

## D3 — The BAML edit function `ReviseRegion` + the `.mts` bridge

A new `baml_src/revise.baml`, sibling of facade/judge/review, defining the edit-op union and:

```
function ReviseRegion(subject: string, defect: string, region: string,
                      placements: string, crop: image) -> RegionEdit
```

`RegionEdit { ops: EditOp[] }`, `EditOp` a BAML tagged union (Add/Remove/Move/Swap) — SAP-parseable,
small output (no prose-wrap risk, like the judge/critic). The prompt: *here is a tight crop of region R
of a voxel <subject>; the form defect is <defect> in <region>; here are the in-region placements
indexed; return ONLY bounded edits that fix the form — add/remove/move/swap, all within the region.*

The bridge `src/revise/baml-revise.mts` mirrors `baml-review.mts` verbatim in shape: read
`{imagePath, subject, defect, region, placements}` on stdin → `b.request.ReviseRegion(...)` (throwaway
key) → extract text+image → `requestTextWithImage({prompt, images, model: PHASE1_MODEL_ID})`
(subscription, **sdk-binding unchanged**) → `b.parse.ReviseRegion(cleaned)` → write `{ops}` to stdout.
GL/metered, **not** in `npm test`. After editing `revise.baml`, regenerate `baml_client/` (`baml-cli
generate`); the regenerated client is committed like the others.

The live leaf `defaultProposeEdit(artifact, R, observation, defect)` in form-edit.mjs spawns the bridge
(lazy `child_process`, the `defaultDiagnose` idiom), passing the crop path from `observation` (the
`observeRegion` result) and the indexed in-region placements; returns the parsed `ops`.

## D4 — The router: form → LLM, known → procedural, one gate (AC #2)

`makeFormEditor({ critic, propose, ... }).diagnose(artifact, R, observation)`:

1. `routed = await critic(artifact, R, observation)` — default the model-free `proceduralDiagnose`
   (deterministic tests); the live wiring injects the E-11 `DiagnoseFacade` critic adapted to
   `(artifact, R)`.
2. take `routed[0]`. **The router:** if `route ∈ {relief, material}` → return it **unchanged** (the
   procedural editor handles it via `scopedTweakFor` — `tweakFor` delegates). Else (a **form** defect —
   `curve`/`detail`/`massing`, or any unhandled route) → call `propose(artifact, R, observation, defect)`,
   run `applyFormEdit` (D2) + AJV (D5), **stash** the resulting in-region placements under `keyOf(sub)`,
   and return `{defect, where, route: "llm-edit"}`.

`tweakFor(route, attempt, intent)`: `route === "llm-edit"` → `(inRegion, sub) => stash.get(keyOf(sub)) ??
inRegion` (identity fallback when nothing valid was stashed → the gate rolls it back); else →
`scopedTweakFor(route, attempt, intent)`. **One router, two interchangeable editors, the same
accept-gate** — the LLM editor and the procedural pass are indistinguishable to the loop; both are a
`route` the diagnose seam emits and a closure `tweakFor` returns. `"llm-edit"` is a new route key
*outside* the procedural set, so `scopedTweakFor` would already treat it as identity — we only need to
intercept it to replay the stash.

## D5 — AJV revalidation + the lock (belt and suspenders)

AC #1: "applied under the T-044-01 region-lock (out-of-R rejected, AJV-revalidated)." Two enforcement
layers, both *before* the loop scores:

- **In the editor (async, in `diagnose`):** after `applyFormEdit`, assemble the candidate via the loop's
  own `applyRegionEdit(artifact, R, newInRegion)` (lock-checked) and run `assertArtifact(candidate)`
  (AJV). If either throws — bad op slipped the bounds guard, or the model produced a schema-invalid
  placement — **catch it, stash nothing**, and the `route:"llm-edit"` tweak becomes an identity no-op the
  gate rolls back. Invalid model output therefore **never reaches the renderer** and never crashes a
  (metered) run.
- **In the loop (sync, unchanged):** `applyRegionEdit` re-checks the lock on the stashed placements when
  it builds the real candidate. Redundant with the editor's pre-check by design — the same belt-and-
  suspenders the procedural passes use (they clamp *and* the lock guards).

So bounds are checked twice (editor + lock), schema once (editor), and the score-gate decides keep/roll.

## D6 — Per-region IoU accept signal + the A/B (AC #1, #4)

`liveFormScore` renders **R-framed** (camera on `subBounds`) and scores its silhouette IoU against the
whole concept. Because the camera frames R, that IoU is already **region-local** — the accept signal the
gate hill-climbs *is* a per-region form score, with no loop change. A *true* region-vs-region IoU would
need the 3-D→2-D projection of `R.subBounds` onto the concept image, which T-045 declared out of scope;
we **do not** add it. Decision: accept on the R-framed IoU (reusing `liveFormScore` verbatim), and the
A/B **additionally reports whole-object IoU** before/after (the `form-baseline` number) so the headline
form gain is comparable to the baseline. This is documented as a known limitation, mirroring
form-fidelity's honesty ledger.

The A/B harness `benchmarks/sculpture/form-revise-ab.mjs` (sibling of `form-baseline.mjs`): for koi +
heart, load `artifact.json`, run `reviseLoop` with the LLM editor over a curated region list (the head
end / the S-curve for koi; the aortic arch for heart), `score: liveFormScore({conceptPath})`,
`budget:{perRegion:1}`. Write a committed `.json` + `.md`: before/after whole-object **and** R-framed
IoU, the per-iteration **kept/rolled-back trace** (already in the loop result), and saved before/after
renders. GL+metered → run on demand, not in `npm test`; a GL-gated live proof
(`render/test/form-edit.live.test.mjs`) asserts one real round-trip wires end to end.

## What this design explicitly does NOT do

No loop.mjs / region.mjs / tweak.mjs / sdk-binding.mjs edits (only *additions*: form-edit.mjs,
revise.baml, the bridge, tests, the A/B). No 3-D→2-D `regionIoU` projection. No autonomous region
discovery (the region list is curated, per T-045 D1). No GLB target (T-047). No change to the procedural
passes — they remain the other editor behind the gate, untouched.
