# T-125-01 idiom-recognition — Research

Phase artifact 1/6 (RDSPI). Descriptive only: what exists, where, how it connects.

## The ticket in one line

The model reads **concept image + conditioned sketch** (T-123) and emits a **building program** in
pack vocabulary (T-124), schema-validated, re-asked on violation within a declared budget; a
validated program **realizes through the idiom registry** into a complete clean build, rendered at
the 4 gate azimuths, committed and byte-replayable — no judge calls, no fit tolerances.

## Upstream seam 1 — the conditioned sketch (T-123, committed)

- Pure core `src/form/form-sketch.mjs` (`conditionGlb`), plotter `src/form/sketch-plot.mjs`,
  runner `benchmarks/sculpture/form-sketch.mjs` (`npm run sketch:<key>`, `--repro` byte-compare).
- Committed artifacts per subject in `benchmarks/sculpture/form-sketch/`:
  `{key}.json` (schema `form-sketch/v1`, pin), `{key}.md` (pin), `{key}-sheet.png` (evidence —
  plan + elevations with raw mesh outline; PNGs never route through the pin guard).
- Record contents useful to recognition: `footprint.polygon` (rectilinear, cell coords),
  `planDims`, `pitch.class` + `ridgeAxis` + `eaveLayer`/`ridgeLayer`, `symmetry`,
  `proportions` (`eaveBlocks`, `heightBlocks`, `storeyCandidates` with `plausible` flags,
  `masses`), `params.registryScale` (cottage/gatehouse 32, church/barn 48), `substrate.dims`.
  NOTE: sketch cells are at `sampleScale` 48 with `registryScale` recorded separately — block-space
  numbers (`eaveBlocks` etc.) are already converted.
- E-31 Rule 3 banner in the runner: the sketch "informs recognition (S-125); it is never a fit
  target, and no tolerance anywhere may reference it."

## Upstream seam 2 — the style pack + registry (T-124, committed)

- `src/pack/style-pack.mjs`: AJV 2020 gate against `schema/style-pack.schema.json` +
  `validateStylePack` semantic pass + `loadStylePack(path)` (fail-loud) + `packPolicy`.
  Exports `MATERIAL_PRECEDENCE = ["concept-evidence", "pack-assignment", "vernacular-default"]`
  **explicitly for S-125** ("a subject's explicit concept evidence beats the pack's assignment;
  the pack beats the vernacular default").
- `packs/rustic.json` — the one pack (cottage + barn): 13 palette roles (each `role`, `block`,
  `rationale`, `provenance`, optional `zone {band, tier}`), 15 idioms (11 constructs + 4 passes)
  each with style-level `params`, `proportions` (storeyHeight 3–4, pitchClasses [1],
  openingRhythm 2–5), `decoration` (door-lantern), `conformance.checks` (all six).
- `src/pack/idiom-registry.mjs`: `IDIOM_REGISTRY` name → entry. **Constructs** (uniform
  `generate(spec) → {cells:[{pos,block,state?}]}`): `roof.gable`, `roof.hip`, `roof.pyramid`
  (footprint/ridgeAxis/eaveY/ridgeY/pitch/blocks), `arch`, `head.flat` (shaped-vocab rings),
  `course.stairs`, `course.slab`, `dormer` (origin/facing/width/depth/wallHeight/blocks),
  `chimney` (base/footprint/height/block/cap), `jetty` (edge {axis,at,side,range}/y/overhang/
  beams), `plinth` (footprint/y0/courses/inset/block). **Passes** (natural signatures, full build
  context — NOT uniformly callable): `timber-frame` (= placementGrammar: needs kit, policy,
  zoneOf, floorLines), `opening-dressing`, `hollow`, `floorplan`. `getIdiom(name)` throws on
  unknown. There is **no wall/shell construct** in the registry.
- `src/pack/conformance.mjs`: `runConformance({occ, declarations}, pack)` runs exactly the pack's
  checks. Declarations are **declared, never inferred**: `bands[{name,yRange,blocks,mixed?}]`,
  `symmetry {axis,at}|null` (vacuous pass if absent), `openings[{wall,min,max}]` (world AABBs,
  also the watertight allow-regions). Occupancy comes from `src/view/occupancy.mjs`
  (`artifactOccupancy(artifact)` / `occupancyFromCells`).
- `src/pack/idiom-card.mjs` + runner `benchmarks/sculpture/idiom-card.mjs` (`npm run idioms:card`)
  — the committed-card runner pattern: AJV gate → `buildWorldFromVoxels` mapping (gates) →
  `renderViews` at `[...MULTI_ANGLE_GATE.azimuths, "front"]` (evidence with sha256, never gates).

## The sibling contract — src/workshop/program.mjs (T-126-01, IN FLIGHT, uncommitted at 1:14 pm)

A parallel Lisa thread (T-126-01, workshop loop) created `src/workshop/program.mjs` minutes ago.
Its header is explicit about the boundary: it is "THE LOCAL CONTRACT, NOT THE RECOGNITION SCHEMA.
S-125 owns the model-authored building program (recognition prompt + pack-validated schema)…
When S-125 lands, its accepted program realizes through the same registry and plugs into the same
loop." It provides exactly what T-125's realization needs:

- `boxShell(spec)` — the one generic hollow perimeter shell (footprint/y0/height/wallBlock/
  per-course overrides/openings as TRUE holes, corners protected) obeying the generated-build
  chain contracts (hollow, floorless, true holes).
- `WORKSHOP_PROGRAM_SCHEMA = "workshop-program/v1"`, `parseWorkshopProgram` /
  `assertWorkshopProgram` — elements are `{id, kind:"shell"|"idiom", idiom?, spec}`; idiom
  elements must be registry **constructs** (passes rejected); requires `subject`, `pack`,
  `budget.rounds`, `declarations`.
- `realizeProgram(program)` — elements in order, later cells win, assembles a schema-valid design
  artifact (namespaced ids, sorted manifest, `metadata.prompting_method_id:
  "procedural/workshop@1"`) — deterministic, byte-identical serialization (Rule 5 substrate).
- `applyParamAdjust` — the workshop's revision action (not T-125's concern).

T-126's plan (observations 15463/15473) commits in atomic steps; step 1 (pin-guard domain
refusal) is already at `d8bcc18`; program.mjs is their step 2 and will be committed ahead of us.
Risk to track: T-125 consuming an uncommitted sibling module.

## The model seams

- `src/sdk-binding.mjs` — `requestTextWithImage({prompt, images:[{base64,mediaType}|Buffer…],
  model, system?, effort?, onMessage?}) → {text, raw}`: plain text + image(s) via the `claude -p`
  subscription shim (`--input-format stream-json`), NO schema enforcement, no artifact
  validation. This is the recognition transport (the E-26 kit-extraction precedent:
  `benchmarks/sculpture/kit-extract.mjs` `callModel` sends concept PNG base64 + prompt at
  `MODEL_TIERS.strong`, then `extractJson` strips fences/prose).
- `src/model-tier.mjs` — `runTieredOp({tier, prompt, images, invoke?})` resolves tier → `--model`
  and **structurally cannot reach the metered API**; `ROUTING_RUBRIC.strong` names exactly this
  op's class ("AUTHORING a generator / cross-view judgement / material zoning").
- `src/config.mjs` — `PHASE1_MODEL_ID = "claude-opus-4-8"`, `MODEL_TIERS.strong` aliases it;
  `MULTI_ANGLE_GATE.azimuths = ["+x+z","+x-z","-x-z","-x+z"]` (frozen config, never per-run).

## The reply-budget pattern (T-114)

`src/form/judge-reply.mjs` — pure, seam-generic: `runReplyPolicy(ask, {parse, maxAttempts, seed})`
loops ONLY while every reply is malformed (parse throws ⇒ malformed; a parsed reply is final),
bounded (`MAX_REPLY_ATTEMPTS = 3`), every attempt ledgered (`replies[]`, raw clipped to 400
chars, transport throws are malformed attempts). The header notes it is judge-generic and
explicitly contrasts the sdk-binding artifact-path retries (which mutate the prompt — "NOT
reusable here"). For recognition, "parse" = schema + pack validation, so an off-vocabulary reply
classifies as malformed → bounded same-prompt re-ask, exactly the ticket's AC. The memory
`judge-reply-policy-seam` warns: never copy the prompt-mutating retry to this seam.

## Pins, replay, runners

- `src/form/pin-guard.mjs` — `guardedWriteRecord({root, rel, content, rotate})` for every
  `.json`/`.md` record write (PNGs exempt); `preflightPins({pins, rotate, intent})` BEFORE any
  metered spend (recognition is a live model call ⇒ preflight applies, unlike form-sketch which
  spends nothing); `--rotate-pins` (`ROTATE_FLAG`); workshop-domain refusal exists but T-125
  writes only its own namespace.
- Replay precedents: form-sketch `--repro` (fresh-process derive + byte-compare, exit nonzero on
  divergence, nothing written); the kit `--offline` flow (re-assert from committed record, no
  model call). The ticket asks for a named `npm run` with `--offline` re-assert: realize the
  committed program → byte-compare the committed artifact.
- npm flag swallowing (memory `npm-run-flag-swallowing`): args after `npm run x` need `--`;
  a dropped flag once live-swept pins. Subject scripts here pin flags inside the script text.
- Runner conventions: `ROOT/HERE/OUT_DIR` pattern, `--subject <key>` against the `SUBJECTS`
  registry (`benchmarks/sculpture/durable-skin.mjs` — cottage: concept
  `runs/014-vConcept-a-cottage/concept.png`, glb, scale 32; barn: concept `runs/017-…tithe-barn…/
  concept.png`, scale 48), `{runner}:{subject}` npm scripts, exit nonzero on gate failure.
- Generalization grep precedent: `generated-milestone.mjs` `generalizationGrep()` — self-read the
  runner source, assert no `SUBJECTS` key appears. Memory `generalization-grep…`: it matches
  comments too — keep subject names out of code AND comments in new modules.

## Constraints and assumptions surfaced

1. **Walls have no registry construct.** The only sanctioned generic shell is the sibling's
   `boxShell`. The generated-chain wall path needs fit lineage (mesh) — off-limits per Rule 3.
2. **Passes are not program elements** (sibling contract enforces constructs-only for `kind:
   "idiom"`). The ticket's example "walls timber-frame, jetty: upper" must be expressible in the
   program; `timber-frame` (= placementGrammar) needs kit/zone/policy context that does not exist
   on the clean-by-construction path. How treatments are recorded vs realized is a Design call.
3. **The pack's vocabulary is roles + blocks.** `paletteInPackCheck` admits palette ∪ decoration
   blocks; the program's blocks must come from the pack (T-100 foreign semantics). The
   `MATERIAL_PRECEDENCE` export anticipates concept-evidence overrides of pack assignments
   within the pack's palette (e.g. the cottage's dressed-stone ground storey vs the cobble
   default — memory `cottage-concept-ground-storey-is-stone`).
4. **Conformance needs declarations the program must carry** (bands/symmetry/openings) — the
   cage-solid-shells lesson: definitions supply the lines, never inference.
5. **Renders are evidence, never pins/gates** (`reproducibility-excludes-gl-from-decisions`);
   byte-replay gates on JSON only.
6. **Test glob `src/**/*.test.mjs` must stay pure** — no GL, no IO (committed-file reads are the
   tolerated class), no Date/random; live calls live in runners only, untested.
7. **AJV idiom**: artifact-style modules use Ajv2020 strict + memoized validator + non-throwing
   parse / fail-fast assert + `formatErrors` reuse (style-pack.mjs is the model to copy).
8. **No judge calls anywhere** on this ticket (S-127 owns grading); conformance + renders only.
9. Schema files live in `schema/*.schema.json` with examples under `schema/examples/`.
