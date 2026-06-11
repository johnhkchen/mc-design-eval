# T-125-01 idiom-recognition — Structure

Phase artifact 3/6. Files, boundaries, interfaces, ordering.

## New package: `src/recognition/` (pure, under the `src/**/*.test.mjs` glob)

Subject-agnostic throughout — no building names in code or comments (the grep matches comments).

### `src/recognition/program.mjs` (+ `program.test.mjs`)

The recognition program contract — `building-program/v1`.

```
export const BUILDING_PROGRAM_SCHEMA = "building-program/v1";
export const PROGRAM_SCHEMA_PATH;            // schema/building-program.schema.json
export const PROGRAM_REPLY_BUDGET = 3;       // the declared re-ask budget (= MAX_REPLY_ATTEMPTS)
export function loadProgramSchema(path?)     // committed-file read (the style-pack idiom)
export function parseBuildingProgram(input)  // Ajv2020 strict, memoized; {ok,program}|{ok:false,code,errors}
export function assertBuildingProgram(input) // fail-fast wrapper
export function validateProgramAgainstPack(program, pack, { registry = IDIOM_REGISTRY } = {})
  // → {ok, findings:[{level,where,msg}]}; pure. Checks (all ERROR level):
  //   roof idioms ∈ pack.idioms ∩ registry constructs; pitchClass ∈ pack.proportions.pitchClasses;
  //   storeyHeight within pack storeyHeight band; every material slot names an existing pack
  //   palette ROLE; walls.treatment (if any) names a pack PASS idiom; opening count/w/spacing
  //   feasible within the wall under pack openingRhythm bounds; dormer count feasible for span.
```

Program shape (the JSON schema's content, abridged — full schema is its own deliverable):

```
{ schema, subject, pack,
  reading: { summary, symmetryClaim: {axis}|null },          // model's evidence, recorded
  masses: [ { id, rect:{x0,z0,w,d},                          // integers, plan coords, w,d ≥ 3
      storeys (1..3), storeyHeight,                          // pack-banded
      walls: { treatment: string|null,                       // recorded; realized by S-126 passes
               ground:{role}, upper:{role}, dressing:{role}|null },
      plinth: {courses, role}|null,
      jetty:  {walls:[dir…], beamRole, joistRole|null}|null,
      roof:   { idiom, ridgeAxis ("x"|"z"; absent for pyramid), pitchClass,
                fieldRole, trimRole|null, gableRole|null,    // gable-end infill material
                dormers: {count, wall?}|null },
      chimney:{role, capRole, atEnd:"lo"|"hi"|"center"}|null,
      openings: [ { wall, kind:"door"|"window"|"wagon-door", count, w, h, sill,
                    head:"arch"|"flat"|null, headRole|null } ] } ] }
```

### `src/recognition/compile.mjs` (+ `compile.test.mjs`)

The pure, deterministic lowering: `building-program/v1` + pack → `workshop-program/v1`.
Consumes ONLY (program, pack) — never the sketch, never a mesh; imports nothing from
`src/workshop/` (it emits a plain object; the sibling module asserts/realizes it downstream).

```
export function roleBlock(pack, role)        // role → block id; throws on unknown role
export function compileProgram(program, pack)
  // → { workshopProgram } where workshopProgram = {
  //     schema: "workshop-program/v1", subject, pack, budget:{rounds:1},
  //     declarations: { bands, symmetry: null, openings },   // the conformance contract
  //     elements: [ shell(s) with banded courses + TRUE-hole openings,
  //                 plinth, jetty…, roof construct per mass, gable-end fills (gable roofs),
  //                 dormers (count → evenly spaced on the slope), chimney,
  //                 arch / head.flat per dressed opening ] }
```

Layout rules inside compile (all arithmetic, no tolerances): y0 = 0; eaveY = storeys·storeyHeight;
ridgeY = eaveY + pitchClass·⌊span/2⌋; openings spaced evenly, spacing clamped-validated against
pack openingRhythm, shared sill per wall group; dormer origins from roof geometry; chimney shaft
spanning the roof band so it intersects roof cells (single-component by construction).
Declarations: bands ground/upper/roof with exactly the blocks compile assigned there (`mixed:
true` where heads/stairs legitimately mix a course); openings as world AABBs (the watertight
allow-regions); symmetry null v1 (the model's claim stays recorded in `reading`, never declared —
declared symmetry would gate cell-perfect mirroring that dormer/chimney placement cannot yet
guarantee).

### `src/recognition/prompt.mjs` (+ `prompt.test.mjs`)

```
export function buildRecognitionPrompt({ pack, sketch, schemaJson })
  // pure string: role table (role/block/rationale digest), construct idioms + their style params,
  // proportion bounds, pitch-class vocabulary, the sketch digest (footprint polygon, plan dims,
  // pitch class + ridge axis, eave/height blocks, storey candidates, masses, symmetry score),
  // then the JSON schema + the strict bare-JSON output rules (withSchemaInstruction's tone, local
  // copy — that function is artifact-schema-specific).
export function parseProgramReply(text, { pack, registry })
  // fence/prose strip (kit-extract idiom) → JSON.parse → assertBuildingProgram →
  // validateProgramAgainstPack (errors throw). THE runReplyPolicy `parse`: any throw ⇒ malformed
  // ⇒ bounded same-prompt re-ask. Returns the validated program.
```

## Modified files

- **`schema/building-program.schema.json`** (NEW) — JSON Schema 2020-12, strict
  (additionalProperties false everywhere), the shape above. The model-facing schema embedded in
  the prompt is this same file (single source).
- **`src/form/idiom-constructs.mjs`** (+ its test) — ADD `gableEndFill(spec)`: the vertical
  triangular wall infill above the eave on a gable end (per-row shrinking extents toward the
  ridge; full cubes; pure). Needed because `boxShell` is rectangular-per-course and `roof.*`
  constructs emit slope planes only — without it a gable build cannot be watertight.
  CONTINGENCY: if implement-time inspection shows `generateRoof` already closes gable ends, skip
  this file and the registry/card changes entirely.
- **`src/pack/idiom-registry.mjs`** (+ test) — register `"gable.end"` (kind construct, generate
  gableEndFill, paramsSchema {block}). Registry growth is sanctioned (E-32 header). The pack does
  NOT list it: it is compiler-emitted structure, not a model-vocabulary idiom; pack validation
  gates the model's program only.
- **`src/pack/idiom-card.mjs`** (+ committed card artifacts) — `cardCoverage()` pins "every
  construct on the card": add an `IDIOM_CARD_SPECS` entry for `gable.end`, re-run
  `npm run idioms:card`, commit the regenerated card (this ticket owns that rotation; the card
  runner writes plainly — renders are evidence).
- **`package.json`** — scripts: `"recognize:cottage"`, `"recognize:barn"` →
  `node benchmarks/sculpture/recognize.mjs --subject <key>`; `"recognize:offline"` →
  `node benchmarks/sculpture/recognize.mjs --offline --all` (flags live in the script string —
  nothing rides through npm).

## New runner: `benchmarks/sculpture/recognize.mjs` (impure, untested, registry-driven)

```
SUBJECTS (from durable-skin.mjs) → def.concept (PNG), form-sketch/{key}.json + {key}-sheet.png
OUT_DIR  benchmarks/sculpture/recognition/
LIVE  (npm run recognize:<key>):
  1. loadStylePack(packs/rustic.json); read sketch record + sheet; read concept PNG
  2. preflightPins([program, replies, prompt-md, artifact, record, md], {rotate, intent})  — before spend
  3. prompt = buildRecognitionPrompt(...); ask = () => requestTextWithImage({prompt,
       images:[concept, sketchSheet], model: MODEL_TIERS.strong})  (full texts teed to rawTexts[])
  4. runReplyPolicy(ask, {parse: t => parseProgramReply(t, {pack}), maxAttempts: PROGRAM_REPLY_BUDGET})
     — refusal (all malformed) exits nonzero, ledger still committed (honest record)
  5. compileProgram → assertWorkshopProgram → realizeProgram → assertArtifact   (src/workshop/program.mjs)
  6. runConformance({occ: artifactOccupancy(artifact), declarations}, pack) — FAILING CHECKS ⇒ exit 1
     (records still written: honest first-draft evidence)
  7. renderViews(artifact, MULTI_ANGLE_GATE.azimuths, …) — evidence + sha256; render absence recorded, never fatal
  8. guardedWriteRecord each .json/.md; PNGs written directly
  9. generalizationGrep() — self-read, no SUBJECTS key in this runner's source
OFFLINE (npm run recognize:offline):
  read committed {key}.program.json → compile → realize → byte-compare committed {key}.artifact.json
  → re-run conformance → print verdicts; no model call, no writes; nonzero on any divergence.
```

### Committed records (all pins except PNGs)

```
benchmarks/sculpture/recognition/
  {key}.program.json    accepted building-program/v1 (THE replay input)
  {key}.replies.json    recognition-replies/v1: model id, prompt sha256, runReplyPolicy ledger,
                        rawTexts[] (full, unclipped), askCount, budget
  {key}.prompt.md       the exact prompt (the AC's "prompt/schema documented"; schema is in-repo)
  {key}.artifact.json   the realized design artifact (byte-compare target for --offline)
  {key}.record.json     conformance verdicts + render receipts (angle/path/sha256) + element census
  {key}.md              human review: program table, conformance, render links
  {key}-{angle}.png     4 gate-azimuth renders (evidence)
```

## Import graph (the boundary that matters)

```
recognition/program.mjs  → ajv, artifact.mjs(formatErrors), pack/idiom-registry (names only)
recognition/compile.mjs  → recognition/program.mjs (assert), pack/style-pack (roleBlock source data)
recognition/prompt.mjs   → recognition/program.mjs, (no transport imports — pure)
recognize.mjs (runner)   → all of the above + workshop/program.mjs (assert/realize)
                           + sdk-binding (requestTextWithImage) + judge-reply (runReplyPolicy)
                           + pin-guard + conformance + occupancy + multi-angle + config
```

`src/recognition/*` never imports sdk-binding (transport stays in the runner), never imports
`src/workshop/` (the sibling dependency is confined to the runner + one integration test file),
and never reads the sketch inside compile (replay self-containment).

## Ordering

1. `schema/building-program.schema.json` + `program.mjs` + tests (no new deps)
2. `prompt.mjs` + tests
3. Gable-end decision point: inspect `generateRoof` ends → either add construct + registry +
   card rotation, or record the skip
4. `compile.mjs` + tests; integration test (synthetic program → realizeProgram → conformance
   passes) — re-check `git log -- src/workshop/` for the sibling's commit before landing this
5. runner + npm scripts + self-grep
6. LIVE: cottage then barn; commit programs/replies/artifacts/records/renders
7. `recognize:offline` re-assert + full `npm test` + review.md
