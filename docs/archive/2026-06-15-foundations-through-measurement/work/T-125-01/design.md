# T-125-01 idiom-recognition — Design

Phase artifact 2/6. Options weighed against the research; decisions with rationale.

## Decision 1 — Program abstraction level: recognition-level schema, compiled to workshop-program/v1

**Options considered:**

- **(A) The model emits `workshop-program/v1` directly** (the sibling T-126 contract: shell +
  construct elements with absolute geometry and raw block ids). Rejected: the ticket and S-125
  define the program as *idiom instances with style parameters in pack vocabulary* ("roof gable,
  pitch-class 45°, dormers: 2", "jetty: upper", "plinth: stone") — not cell-level geometry. Raw
  blocks invite foreign-block re-asks; absolute coordinates make the model do arithmetic the
  compiler can do deterministically; and the workshop contract requires fields (budget.rounds)
  that are not recognition outputs.
- **(B) Recognition-level schema (`building-program/v1`) + a pure deterministic compiler that
  lowers it to `workshop-program/v1`, realized by the sibling's `realizeProgram`.** CHOSEN.
  The model authors masses, storeys, roof idiom + pitch class, wall bands *by pack role*,
  openings by rhythm — all small, checkable, in-vocabulary. The compiler resolves role → block
  via the pack (everything in-pack **by construction**, so `palette-in-pack` cannot fail),
  computes geometry from declared integers, and emits the workshop shape — so the accepted
  program "realizes through the same registry and plugs into the same loop" exactly as the
  sibling header requests. One realization path in the codebase, not two
  (`parallel-roots-duplicate-shared-deps`).
- **(C) BAML structured output.** Rejected for this ticket: the established recognition seam is
  `claude -p` + committed raw replies (E-26 kit-extract precedent); BAML revival is E-32's charter.

**Geometry self-containment:** the model declares integer dimensions (it reads them off the
sketch, which is in the prompt); the compiler consumes ONLY program + pack. The committed program
is therefore a closed replay input — `--offline` needs no sketch, no GLB, no model. The sketch
*informs* recognition (E-31 Rule 3) but realization never references it: no fit, no tolerance.

## Decision 2 — Validation = AJV schema gate + pack-semantic pass; re-asks via runReplyPolicy

Two layers, mirroring style-pack.mjs (the project's validation idiom):

1. `schema/building-program.schema.json` (Ajv2020 strict, memoized validator, non-throwing
   `parseBuildingProgram` / fail-fast assert, `formatErrors` reuse).
2. `validateProgramAgainstPack(program, pack, {registry})` — pure: every named idiom ∈
   pack.idioms ∩ registry constructs; every material slot names a pack palette **role** (roles,
   not blocks — `MATERIAL_PRECEDENCE` is honored by letting the model pick ANY pack role per
   surface on concept evidence, e.g. a dressed-stone ground storey, while staying in-pack);
   pitchClass ∈ pack.proportions.pitchClasses; storeyHeight within pack storeyHeight band;
   declared opening spacing within openingRhythm bounds; dormer count ≥ 0 sane for span.

The reply loop is `runReplyPolicy` (T-114) verbatim: `parse` = extract JSON → schema gate →
pack-semantic gate, any violation throws ⇒ MALFORMED ⇒ bounded same-prompt re-ask
(`MAX_REPLY_ATTEMPTS = 3` is the declared budget); a parsed+valid program is FINAL. The prompt is
never mutated between attempts (`judge-reply-policy-seam`: never copy the sdk-binding corrective
retry here). The ledger is committed; additionally the FULL raw text of every attempt is teed by
the ask thunk and committed (the ledger clips to 400 chars; the AC says raw replies committed).

## Decision 3 — Realization scope v1: structure realized, surface treatments recorded but deferred

Realized on this ticket (all registry constructs + the sibling's `boxShell`):
- per-mass hollow banded shell (ground/upper bands as `courses` overrides; openings as TRUE holes)
- `plinth`, `jetty` (when declared), `roof.gable`/`roof.hip`/`roof.pyramid` per mass,
  `dormer` (count → evenly spaced by the compiler — canonical substitution IS regular spacing),
  `chimney`, opening heads (`arch` / `head.flat`).

Recorded in the program but NOT realized here:
- `walls.treatment` (e.g. `timber-frame`) and opening fixture fills (door leaves, lattices,
  decoration). Rationale: these are registry **passes** needing full build context (kit, zone
  policy, floor lines) — the sibling contract correctly rejects passes as program elements, and
  the workshop (S-126) + brush factory (E-32) own surface dressing/revision. Realizing them here
  would mean inventing a second, degenerate timber-frame realization. First drafts must be
  "clean, regular, passing the pack's conformance checks" — a banded watertight shell with
  dressed opening heads satisfies every check. Openings stay true holes (the
  facade-recess-by-exclusion rule) and are declared as watertight allow-regions.

**Multi-mass plans:** the schema allows N rectangular masses with explicit integer rects in plan
coordinates (the model authors the decomposition — e.g. the cottage's cross-wing). Each mass gets
its own shell + roof; interior partition walls where masses abut are acceptable v1 (invisible,
watertight, single-component).

## Decision 4 — Compiler also authors the conformance declarations

`runConformance` demands declared bands/symmetry/openings (declared-never-inferred). The compiler
derives them from the same program facts it builds geometry from: bands = ground/upper/roof
y-ranges with the blocks it actually assigned there; symmetry only if the program declares it
(axis + computed plane); openings = the world AABBs it computed. Declarations ride inside the
workshop program's required `declarations` field — so the workshop loop (T-126) inherits them
with zero extra wiring. `budget.rounds: 1` (this ticket commits the accepted draft; re-sampling
is the workshop's).

## Decision 5 — Module layout and the runner

New package `src/recognition/` (S-125's seam; `src/workshop/` is the sibling's):
- `program.mjs` — schema id `building-program/v1`, AJV gate + pack-semantic validation.
- `compile.mjs` — `compileProgram(program, pack)` → `{workshopProgram}` (pure, deterministic,
  no IO beyond nothing — pack is passed in).
- `prompt.mjs` — `buildRecognitionPrompt({pack, sketch})` (pure: pack vocabulary digest, sketch
  digest, the JSON schema, strict output rules) and `parseProgramReply(text, {pack})` (the
  runReplyPolicy parse: fence-strip via the kit-extract idiom, then both gates).

Impure runner `benchmarks/sculpture/recognize.mjs` (`npm run recognize:cottage|barn`):
1. registry lookup (SUBJECTS — concept PNG, sketch record + sheet, no subject constants in the
   runner; self-grep like generated-milestone's), load + validate pack;
2. `preflightPins` over every record path BEFORE the live call (recognition is spend);
3. live: `requestTextWithImage` (strong tier via `MODEL_TIERS.strong`) with concept PNG + sketch
   sheet PNG, driven by `runReplyPolicy`;
4. compile → `assertWorkshopProgram` → `realizeProgram` → `assertArtifact` → conformance gate
   (exit nonzero on failure) → renders at the 4 gate azimuths (evidence, sha256, never gating);
5. commit via `guardedWriteRecord`: `recognition/{key}.program.json` (accepted program),
   `{key}.replies.json` (ledger + full raw texts + prompt sha), `{key}.prompt.md` (the exact
   prompt + schema — the AC's "prompt/schema documented"), `{key}.artifact.json` (realized
   build), `{key}.record.json` (conformance + render receipts), `{key}.md` (human review).
   PNGs written directly (never through the guard).

`--offline` (the Rule 5 re-assert, AC #4): read the committed program → compile → realize →
byte-compare against the committed artifact JSON; re-run conformance; no model, no writes,
nonzero on divergence. npm scripts embed the flag (`recognize:offline` runs both subjects) so no
flag rides through npm (`npm-run-flag-swallowing`).

## Decision 6 — Dependency on the in-flight sibling module

`src/recognition/compile.mjs` emits the workshop shape; the runner imports
`assertWorkshopProgram`/`realizeProgram`/`boxShell` from `src/workshop/program.mjs` — which
exists in the shared working tree but is (as of research time) uncommitted by T-126. Mitigation:
implement pure modules first (schema, program, prompt — no workshop import); the compile/realize
steps import it last, and before the commit that introduces the import we re-check
`git log --oneline -- src/workshop/` for the sibling's commit (their step cadence is atomic and
fast). If it is still uncommitted at that point, the commit message notes the cross-ticket
dependency (same branch, Lisa-serialized) — the working tree stays green either way. We never
edit the sibling's file.

## Rejected along the way

- **Realizing timber-frame via 1×1 chimney columns at shell corners** — semantically wrong use of
  a construct, plus mixed-course conformance contortions; surface treatment belongs to passes.
- **Reading the sketch record inside the compiler** (footprint → shell rects automatically) —
  couples realization to the mesh derivative and makes replay depend on the sketch; the model
  declaring integers keeps recognition at the center and the committed program self-contained.
- **A second realization path in src/recognition/** — duplicates the sibling's; one composition
  point per concern (`vocabulary-authority-one-composition-point` precedent).
- **Judge calls / resemblance scoring of the drafts** — explicitly out (S-127 owns grading).
- **Editing packs/rustic.json** (e.g. adding pitch class 2 for the barn) — the pack is T-124's
  curated data; recognition conforms to the pack's vocabulary (off-vocabulary is rejected and
  re-asked toward it). If the barn truly demands a steep class, that is a pack-curation ticket.

## Acceptance-criteria trace

- Recognition seam (strong tier, shim, schema-validated, bounded re-asks, ledger) → D2, D5.
- Realization through the registry, zero mesh cells, no tolerances, synthetic-program tests → D1,
  D3 (compiler is pure; tests run program→cells with no GLB anywhere in the import graph).
- Cottage + barn drafts committed with raw replies + prompt/schema, rendered at 4 azimuths,
  conformance-passing → D5 runner.
- Replayable via named npm run with --offline re-assert → D5.
- No per-building code (runner self-grep; src/recognition stays subject-free) + `npm test` green.
