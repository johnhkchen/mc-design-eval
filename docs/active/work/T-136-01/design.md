# T-136-01 geometry-levers — Design

## The shape of the problem

The workshop revises a **compiled** object (workshop-program elements); proportion lives in the
**source** object (building-program masses). A proportion fix must move shell height, roof
eaveY/ridgeY, dormer seats, chimney, heads and the declarations bands together — exactly what
`compileProgram` already does deterministically. So the design question is not "how to edit
geometry" but "how does the loop carry the source program and re-enter the compiler legally".

## Decision 1 — geometry via source-mass adjust + recompile (not a workshop-level editor)

**Chosen**: the loop optionally carries `source = {program: building-program/v1, sketch?}`.
`adjust-params` is extended: when `elementId` names a **source mass id** (mass ids like `main`
are disjoint from element ids like `main-shell` — compile derives the latter by suffixing), the
params are the T-133 measured surface, flat scalars: `{pitchClass?, eaveHeight?, storeys?,
storeyHeight?, width?, depth?}`. A new pure module applies them to that mass (eaveHeight goes
through `factorEave` — deterministic schema-bounded factorization; width/depth resize `rect`
keeping the origin; pitchClass passes the pack-vocabulary gate), re-validates
(`assertBuildingProgram` + `validateProgramAgainstPack`, strict — any finding throws and the
round records `apply-failed`, the model's re-aim signal), recompiles via `compileProgram`
(budget preserved from the live program), and returns the new workshop program **and** the new
source. Realized through the registry by construction.

**Rejected — workshop-level coherent geometry editor**: duplicates compile's geometry math
(eave/ridge/dormer-seat/band coupling); two sources of truth, the exact drift the
drift-pinned `impliedRidgeRise` mirror exists to avoid.

**Rejected — new action name (`adjust-geometry`)**: the AC says "*adjust-params* reaches
geometry"; `ACTION_NAMES` is the ratified vocabulary (T-126: "the vocabulary is the ticket's"),
and the BAML reply union already models adjust-params as elementId+params. Extending the
grounding of `elementId` is additive; no schema churn, prompt stays one action shape.

**Rejected — letting adjust-params keep merging raw element specs for geometry keys**: that is
the unwired state being closed; single-element merges produce incoherent builds the cage rolls
back (T-127's measured limit).

## Decision 2 — re-recognize as an injected, mass-scoped exchange

**Chosen**: `re-recognize.elementId` accepts a source **mass id** (or a compiled element id,
resolved to its owning mass by the compile naming rule `${massId}-…`, longest match). The
applier is **injected by the runner** (ISO4 forbids the pure core importing model transport —
the `exchange` precedent; the seam already exists: `DEFAULT_APPLIERS` is injectable and tested).
Runner-side flow, the recognition donor pattern scoped to a fragment:

- New BAML function `ReRecognizeMass(pack_digest, sketch_digest, mass_json, critique_block,
  mass_schema_json)` — the model re-recognizes ONE mass with its own round critique attached
  (the AC's "critique attached as context"); text-only (the sketch digest is the recognition
  channel's native evidence; no images, no GL).
- Reply parser: strip → JSON → substitute the mass into the source program →
  `assertBuildingProgram` + `validateProgramAgainstPack` (whole-program: catches roles, pitch
  vocabulary, opening/dormer feasibility, connectivity). Throws = MALFORMED = judge-reply's
  bounded same-prompt re-ask (`runReplyPolicy`, `MAX_REPLY_ATTEMPTS` — the T-114 pattern).
- Applier returns `{kind:"recognize", mass, replies, askCount, program, source}` — the round's
  ledger entry carries the **raw inner replies** and the accepted fragment verbatim.
- New `OP_ROUTING` row: op `workshop-rerecognize`, tier **strong** (authoring a program fragment
  against a schema + pack vocabulary — generative, the rubric's strong side), used by the runner.
- Bounded by the round budget: it consumes its round like any action; its inner re-asks are
  bounded by the reply policy; no extra loop iterations.

**Rejected — whole-building re-recognition**: replaces parts the model did not flag; the AC says
"a named part… replaces that part of the program". Mass scope is the smallest unit that
revalidates cleanly (walls/roof/openings cohere within a mass).

**Rejected — pure-core applier calling the model**: ISO4 violation by construction.

## Decision 3 — replay: re-derive geometry, carry fragments verbatim

`replayLedger` gains an optional `pack` argument (required iff the ledger contains
geometry/recognize rounds — the pack is a committed input already sha-pinned in `meta.packRef`,
so determinism holds). Accepted rounds replay as:

- `applied.kind === "program"` (legacy spec merge): unchanged.
- `"geometry"`: re-run the pure geometry adjust on the tracked source + recompile — **re-derived,
  never copied** (it is deterministic; copying would hide drift).
- `"recognize"`: substitute the **recorded fragment** (a model output — the ledger IS the input,
  the paint precedent) + recompile.
- `"paint"`: unchanged, but see Decision 5.

The ledger root records the seed source program (`ledger.source`) so replay can track it.
`offlineAssert` re-checks final conformance with the **replayed program's** declarations (the
"declarations constant across adjust-params" shortcut no longer holds once geometry moves) and
asserts recognize rounds carry their inner raw replies.

**Rejected — carrying the recompiled workshop program verbatim per round**: makes replay a copy
instead of a check; geometry is pure, so re-derivation is strictly stronger evidence.

## Decision 4 — the ratio guard lives in the loop, not in conformance.mjs

T-135 (proportion check inside the conformance gate) is in flight in a sibling session and not
landed; the AC pre-authorizes a fallback. **Chosen**: a pure `ratioGuard` applied **in addition
to** the conformance regression gate, only on rounds whose action changed geometry
(`geometry`/`recognize` kinds): compare `silhouetteRatios(candidate)` and `ratios(current)`
against the target (`sketchTargetRatios(sketch)`, threaded in as `source.targets` data); reject
iff the worst relative deviation strictly increases (lateral moves accepted, mirroring
`isRegression`'s posture). No targets (fixture, sketchless subjects) → guard records
`vacuous` and passes. Rollback reason strings name the guard so the ledger shows which gate bit.

This touches **zero lines of `src/pack/conformance.mjs`** — no collision with T-135; when T-135
lands its check, the lexicographic conformance score subsumes proportion regressions and the
guard remains a harmless second opinion (a follow-up may retire it under S-135's pins).

**Rejected — adding a check to conformance.mjs here**: same-file concurrent-session collision
(the T-133/T-134 interleave precedent), and the gate's checks run on occupancy + declarations —
ratios want program geometry + sketch targets, which the gate signature doesn't carry.

## Decision 5 — paint survives geometry by deterministic pruning

`applyPaint` appends placements; after a geometry change a stale paint voxel becomes a floating
block (watertight/single-component failures → unfair rollback of a good geometry move).
**Chosen**: on geometry/recognize candidates, prune the paint trail to positions still occupied
by the new realization (pure set-membership filter; in-place recolors like timber studs on an
unchanged wall survive; orphans drop). The pruned count is recorded on the round
(`paintPruned`), and replay applies the same rule at the same point — byte-identical.

**Rejected — drop all paint on geometry change**: throws away accepted work the move didn't
invalidate. **Rejected — keep all paint**: floaters; the cage would veto most geometry moves.

## Decision 6 — the cottage proof runs under NEW record paths

A live workshop run on the T-127 cottage with levers wired, seeded from the **committed** T-127
seed (`workshop/cottage/program.json`, ratios 2.25 vs target 1.4145) and the committed
recognition program as source (`recognition/cottage.program.json`, storeys 2 × sh 4) + the
committed sketch for targets. Records go to a new namespace `benchmarks/sculpture/levers/`
(`geometry-levers.mjs` evidence runner, the measured-proportions precedent): **no T-127 pin is
rotated**, pattern-book `--repro` stays valid. Modes: live / `--replay` / `--offline`; the run
record carries per-round before/after/target ratios so "the model aimed the lever" or "the model
still didn't" is a recorded capability finding either way (the AC's honest branch). Runner joins
ISO1's explicit scan list; writes are pin-guarded under domain "workshop".

**Rejected — rotating `workshop/cottage.*` pins**: invalidates the pattern-book chain's
byte-compares (the reskin-rejudges-pins lesson); the proof doesn't need to replace T-127's
record, it needs to exist beside it.

## Decision 7 — prompt surface

`critiqueRenderArgs` gains a source block (rendered only when `source` is present): the masses
JSON, the current vs target silhouette ratios, and the geometry params vocabulary on the
adjust-params action line; the re-recognize line documents mass targeting. `critique.baml`
template extended accordingly; the byte-pinned golden fixture is re-minted
(`scripts/mint-baml-fixture.mjs` path). Sketchless runs render an empty source block —
byte-identical prompts for legacy subjects, so the fixture-subject goldens stay valid if the
fixture carries no source.

## Loop mechanics summary

`runWorkshopLoop` gains optional `source`; `applyAction` is awaited (async appliers); appliers
receive `{program, occ, source, pack}`; accepted geometry/recognize rounds advance BOTH
`current` and `source` and prune paint; the ledger gains `source` at root and per-round
`applied` payloads as above. All additive — sketchless/sourceless runs are byte-identical to
today (geometry grounding simply never matches, re-recognize stays unavailable unless injected).
