# T-046-01 — Research: llm-form-edit-route

Epic **E-15**'s payoff ticket. The cage (observe → tweak → re-observe → accept-if-improved → lock) is
already built and proven (T-043/044/045). This ticket adds an **LLM block-edit** as *just another
editor behind the same gate*. Research maps what exists and where the seams are; it does **not**
propose the wiring (that is Design).

## The measured gap (why an LLM editor at all)

Text→JSON keeps palette + parts but loses **line** (E-13 form baseline, `benchmarks/sculpture/form-baseline.json`,
mean IoU **0.479**). The two A/B subjects this ticket targets:

- **koi** (`009-vConcept-a-koi-fish`): IoU **0.481**, render aspect 1.2 vs concept 1.553 — the swimming
  **S-curve flattens** to a straight body.
- **heart** (`006-...-human-heart`): IoU **0.347**, render aspect 0.501 vs concept 1.833 — the **aortic
  arch never builds as a loop**.

No procedural pass encodes *form*: E-11's passes do material/depth (relief = a Z move; material = a
block swap), not *shape*. So the loop needs a freeform LLM block-edit primitive. The defect vocabulary
already names these as **non-relief/material routes** (see below), which the procedural passes leave
unhandled — exactly the slot the LLM editor fills.

## The cage and its seams (the spine this ticket plugs into)

### `src/revise/loop.mjs` — `reviseLoop(artifact, opts)` (T-045-01)

The control flow (per region, in order):

```
R = selectRegion(current, spec)                         // region addressing (region.mjs)
if locked overlaps R.subBounds: skip (trace locked-overlap)
observation = observe ? await observe(current, R) : null    // async seam, default undefined → skipped
routed = await diagnose(current, R, observation)            // async seam, default proceduralDiagnose
{ defect, where, route } = routed[0]                        // ← destructured; extra fields dropped
before = await score(current, R)                            // async seam, once per region
for attempt in 0..perRegion-1:
  tweakFn = tweakFor(route, attempt, intent)                // SYNC seam, default scopedTweakFor
  candidate = applyRegionEdit(current, R, (inR) => tweakFn(inR, sub))   // SYNC, lock-checked
  after = await score(candidate, R)
  accepted = after > before + epsilon
  if accepted: current = candidate; locked.push(sub); break // else roll back (drop candidate)
```

Returns `{schema, artifact, trace, iterations, converged, locked}`. The trace entry already carries
`{region, defect, where, route, tweak, scoreBefore, scoreAfter, accepted, reason}` — the A/B's required
fields are **already produced**.

**The five injectable seams** (loop.mjs:61–72): `regions`, `score`, `diagnose`, `observe`, `tweakFor`,
`budget`, `intent`, `fraction`, `epsilon`. Three are async-awaited by the loop (`observe`, `diagnose`,
`score`); **`tweakFor` and the edit it returns are SYNC** — `applyRegionEdit` calls `edit(R.placements)`
synchronously and `throw`s unless it gets an array back (region.mjs:289–292). This is the central
constraint: an LLM call is async, but the tweak it feeds must be sync. The async seams (`observe`,
`diagnose`) run *before* the sync tweak — that is where model work must live.

### `src/revise/tweak.mjs` — the tweak interface (T-045-01)

`scopedTweakFor(route, attempt, intent) → (inRegion, subBounds) => newPlacements`. Routes handled:
`relief` (Z move, clamped to R.z), `material` (block swap); **any other route → identity no-op**
(tweak.mjs:144). `proceduralDiagnose(_artifact, R)` is the model-free default critic. Both import the
shared E-11 route vocabulary `ROUTING_TABLE`/`ROUTE_TARGETS` from `sculptor/review.mjs` — *"so the
metered model critic (T-046-01) is a drop-in for `proceduralDiagnose` with zero loop changes."* The
header literally anticipates this ticket.

### `src/revise/region.mjs` — region-lock (T-044-01)

- `selectRegion(artifact, spec) → R` (frozen `{schema, spec, subBounds, placements, indices, fraction}`).
- `applyRegionEdit(artifact, R, edit)` — **the lock**: out-of-R cells are byte-identical after; any edit
  voxel outside `subBounds` throws `RegionEditOutOfBoundsError`; rebuilds `palette.manifest`; returns a
  fresh artifact. **NOT AJV-validated here** (region.mjs:281 — *"callers run it through src/artifact.mjs"*).
- `observeRegion(artifact, R, opts) → {path, bytes, view, bounds}` — tight crop render via
  `framedCamera(subBoundsOf(R))`; LAZY-imports the render stack (no GL at module load).

### `src/form/form-fidelity.mjs` — the FORM number (T-043-01)

`formFidelity(renderImg, conceptImg, opts)` / `formFidelityFromPair(renderPath, conceptPath, opts)` →
`{iou, regionIoU?, render, concept, ...}`. Whole-object silhouette IoU by default; `regionIoU(a,b,region)`
takes a **normalized [0,1] 2-D rect** over the grid. `liveFormScore(cfg)` (loop.mjs:162) is the default
`score`: renders via `observeRegion` (camera framed on R) → `formFidelityFromPair` against
`cfg.conceptPath`; returns `result.regionIoU` iff `cfg.region` is given, else whole-object `iou`. **Note**
(loop.mjs:158, T-045 design): a 3-D→2-D projection of R onto the concept is **out of scope** — there is
no built code that maps `R.subBounds` to a concept-space rect.

## The model seam(s) this ticket must reuse

### `src/sdk-binding.mjs` — the single live, metered seam

- `requestTextWithImage({prompt, images, model, ...}) → {text, raw}` — image in, **plain text** out, no
  schema. The basis for the LLM-as-judge and the E-11 critic bridge.
- `requestDesignArtifactWithImage(...)` — image in, **schema-forced** artifact out (full artifact, not a
  region edit). `toImageBlock`/`buildImageTurn`/`serializeStreamJsonInput` are the PURE, offline-tested
  shapers. `claude -p` subscription path (`--input-format stream-json`); **nothing here needs to change**
  (AC: "claude -p subscription seam unchanged").

### BAML pattern (the "new BAML edit function" sibling)

`baml_src/{facade,judge,review}.baml` define `BuildTempleFacade` / `JudgeFacade` / `DiagnoseFacade`.
Each is rendered (not called) by BAML and piped through `claude -p` via a **`.mts` tsx bridge** that:
(1) `b.request.<Fn>(...)` to render the prompt (needs a throwaway `ANTHROPIC_API_KEY`, dropped before the
call), (2) extracts text+image blocks, (3) `requestTextWithImage(...)` (subscription), (4)
`b.parse.<Fn>(cleaned)` to SAP-parse, (5) writes JSON to stdout. The canonical example is
`src/sculptor/baml-review.mts` (read in full). Client `ClaudeStub` (clients.baml) pins `claude-opus-4-8`,
`max_tokens 32000`. The generated `baml_client/` is committed.

### `src/sculptor/review.mjs` — the E-11 router (AC #2's "one router")

`ROUTING_TABLE = {flat:[material,relief], ringing:[curve], under-detailed-focal:[detail], proportion:[massing]}`.
`routeDefect(state, {defect, where})` resolves `flat`→material/relief from state, else the table head.
**Key fact:** of the route targets `{material, relief, curve, detail, massing}`, the procedural passes
implement **only `material` and `relief`**. `curve`/`detail`/`massing` are the **form defects with no
procedural editor** — the natural set to route to the LLM. `DiagnoseFacade`/`baml-review.mts` produce the
raw `{defect, where}[]`; `reviewBuildState(state, {render, diagnose})` orchestrates render→diagnose→route
with both leaves injectable (stubbed in `npm test`). Note: the live critic consumes a `BuildState`, while
the loop has a `DesignArtifact` + `R` — a small impedance the design must address.

## The A/B harness conventions (AC #4)

Generators live in `benchmarks/sculpture/`: `form-baseline.mjs` (→ `.json` + `.md`), `codesign-ab.mjs`,
`value-match-ab.mjs`. Pattern: discover run dirs under `runs/`, deterministic (sorted, no clock/RNG),
write a committed `.json` + `.md` table. Each run dir has `artifact.json`, `concept.png`, `render-3q.png`,
`summary.json` (`.term`). The koi + heart artifacts + concepts are on disk. Live proofs are **GL-gated**
node:test files under `render/test/` that `t.skip` when `GL_AVAILABLE` is false
(`render/test/revise-loop.live.test.mjs`, read in full — drives `liveFormScore` on the koi).

## Constraints / assumptions surfaced

1. **Sync tweak vs async model** — the load-bearing constraint. The model call must be hoisted into an
   async seam (`observe`/`diagnose`); the sync `tweakFor` can only *replay* a precomputed edit.
2. **AJV revalidation** (AC #1) must happen somewhere the loop already permits — `applyRegionEdit` does
   not validate; `assertArtifact`/`parseArtifact` (artifact.mjs) is the gate. It must run inside the
   editor before the loop scores (rendering an invalid artifact would otherwise throw in `score`).
3. **Bounds** — `applyRegionEdit` already rejects out-of-R cells. AC #5 wants a **pure** edit-application
   + bounds unit, so the editor needs its own bounds guard (belt-and-suspenders, like the procedural
   passes clamp themselves) that is unit-testable without the lock throwing.
4. **Per-region IoU** (AC #1) — `liveFormScore` renders R-framed (camera on `subBounds`), so its IoU is
   already region-local against the *whole* concept; a true region-vs-region IoU needs the 3-D→2-D concept
   projection that T-045 declared out of scope. A decision is required (Design).
5. **No loop.mjs edit** (AC #3) — the loop destructures only `{defect, where, route}` from diagnose and
   passes `route` to `tweakFor`. Any LLM-proposed edit must reach the sync `tweakFor` through a channel
   the loop already carries (a shared stash, or `intent`), since the `route` string alone cannot carry it.
6. **Per-region attempts** — the loop calls `tweakFor` up to `perRegion` times per region; one model
   proposal per region means attempts >0 replay the same edit (harmless no-ops). `perRegion: 1` is the
   natural budget for the LLM route.
