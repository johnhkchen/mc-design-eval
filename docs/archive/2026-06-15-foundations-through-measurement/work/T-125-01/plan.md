# T-125-01 idiom-recognition — Plan

Phase artifact 4/6. Ordered steps, each independently verifiable and atomically committable.
Baseline before step 1: run `npm run test:unit` and record the count (sibling T-126 is committing
to the same branch — re-baseline after any pull of their steps).

## Step 0 — Preconditions check (no commit)

- `npm run test:unit` green; record count.
- Confirm committed inputs exist: `packs/rustic.json`, `benchmarks/sculpture/form-sketch/
  {cottage,barn}.json` + `-sheet.png`, both concept PNGs from the SUBJECTS registry.
- Read the committed barn/cottage sketch records' pitch class + footprint (prompt-digest facts).
- `git log --oneline -- src/workshop/` — note whether the sibling's `program.mjs` is committed
  yet (affects step 5 commit notes only; the file is in the shared working tree either way).

## Step 1 — Program contract (schema + parse/assert + pack validation)

Files: `schema/building-program.schema.json`, `src/recognition/program.mjs`,
`src/recognition/program.test.mjs`.

Tests (pure): schema gate accepts a full synthetic program (two masses, jetty, dormers, chimney,
mixed opening kinds) and rejects: missing schema id, unknown extra keys, non-integer rect, empty
masses. Pack validation against the REAL loaded rustic pack (committed-file read is the tolerated
class — style-pack.test.mjs precedent): accepts in-vocabulary program; rejects off-pack role,
off-registry roof idiom, pass idiom in roof slot, pitchClass 2 (pack says [1]), storeyHeight 7,
infeasible opening rhythm. Verify: `node --test src/recognition/`.

Commit: `feat(E-31 T-125-01): building-program contract — schema gate + pack-vocabulary validation`.

## Step 2 — Prompt builder + reply parser

Files: `src/recognition/prompt.mjs`, `src/recognition/prompt.test.mjs`.

Tests: prompt contains every pack role + every construct idiom name + pitch classes + the literal
schema text + the sketch digest numbers fed in; prompt is deterministic (same inputs → same
string). parseProgramReply: strips ```json fences and prose brackets; valid JSON+vocabulary →
program; schema violation throws; off-vocabulary throws (so runReplyPolicy classifies malformed);
error messages name the violation (the re-ask is same-prompt, so the message only feeds the
ledger, never the model — assert it's still informative for the audit trail).

Commit: `feat(E-31 T-125-01): recognition prompt + reply parser — the bounded re-ask's parse fn`.

## Step 3 — Gable-end closure (decision point)

First inspect `src/view/roof-generate.mjs` + run a quick scratch realization of `roof.gable` on a
synthetic footprint; check end columns. THEN:

- If ends are open (expected): add `gableEndFill` to `src/form/idiom-constructs.mjs` (pure
  triangle infill: for each row y in (eaveY, ridgeY], wall cells on the end plane between the
  roof slopes; parameterized {endPlane:{axis,at}, uRange, eaveY, ridgeY, ridgeU, pitch, block}),
  unit tests (orientation × both ends, degenerate small spans, pitch 1 and 2); register
  `"gable.end"` in `src/pack/idiom-registry.mjs` (+ registry test count update); add an
  `IDIOM_CARD_SPECS` entry; `npm run idioms:card` and commit the regenerated card record/sheet
  (this ticket owns that rotation — note it in the commit body).
- If closed already: record the finding in progress.md and skip.

Verification: watertight closureCheck passes on (shell + gable roof + 2 gable ends) synthetic
build in a test. Commit: `feat(E-31 T-125-01): gable-end infill construct — watertight gables by
construction` (or a progress.md note if skipped).

## Step 4 — Compiler

Files: `src/recognition/compile.mjs`, `src/recognition/compile.test.mjs`.

Order of emission per mass: shell (banded courses, openings as true holes) → plinth → jetty →
roof construct → gable ends → dormers → chimney → opening heads (later cells win on overlap —
heads must follow shell). Declarations assembled last (bands incl. every block actually assigned;
openings AABBs; symmetry null).

Tests (synthetic programs only, AC #2): role→block resolution (throws on unknown);
eave/ridge arithmetic; opening spacing even + within pack rhythm + shared sill; dormer spacing;
chimney intersects the roof-band columns; band declarations carry exactly the assigned blocks;
determinism (two compiles → deep-equal); compiled output satisfies `parseWorkshopProgram` and
`realizeProgram` yields a nonempty artifact that passes `assertArtifact` AND `runConformance`
against the real rustic pack — all six checks PASS (this is the clean-by-construction proof and
the watertight/single-component regression for step 3). That integration test imports
`src/workshop/program.mjs` — re-check the sibling's commit status; flag in the commit message if
still untracked (working tree is green regardless; never edit their file).

Commit: `feat(E-31 T-125-01): program compiler — recognition program lowers to the workshop
contract, conformance-clean by construction`.

## Step 5 — Runner + npm scripts

Files: `benchmarks/sculpture/recognize.mjs`, `package.json`.

Implement LIVE + OFFLINE modes per structure.md: preflightPins before the model call;
runReplyPolicy with PROGRAM_REPLY_BUDGET; full raw texts teed; conformance failure exits 1 but
still writes records (honest); renders best-effort evidence; generalizationGrep self-check; all
.json/.md through guardedWriteRecord; `--rotate-pins` passthrough for future re-runs.

Verification without spend: `node benchmarks/sculpture/recognize.mjs --offline --all` on a
fabricated uncommitted program fixture is NOT possible (offline reads committed records) — so
verify wiring with `--subject` + a `--dry-run` flag? NO new flags: instead verify the offline
path in step 7 and the live path by running it (step 6); pre-verify imports with `node --input-type=module -e "await import(...)"`.

Commit: `feat(E-31 T-125-01): recognize runner — preflight, bounded live recognition, realize +
conformance + 4-azimuth render evidence, offline replay`.

## Step 6 — LIVE first drafts (cottage, then barn) — METERED (subscription)

- `npm run recognize:cottage`; inspect: ledger askCount, conformance verdicts, the 4 renders
  (eyes on: roof reads as a roof, openings rhythmic, bands banded).
- `npm run recognize:barn`; same inspection (expect wagon doors + steep-roof recognition to land
  on pitchClass 1 — the pack's vocabulary; if the model's first reply is off-vocabulary the
  ledger should show the re-ask doing its job).
- Failure handling: a refusal after 3 attempts → commit the ledger anyway, mark the draft
  refused in record.json, STOP and surface in review.md (do not widen the budget — it is the
  declared contract). A conformance FAIL → keep records, fix the COMPILER (never hand-edit the
  program), re-run with `--rotate-pins` (this ticket owns these pins).
- Commit records per subject:
  `feat(E-31 T-125-01): <key> first draft — committed program, reply ledger, realized build,
  conformance + renders`.

## Step 7 — Replay re-assert + full suite

- `npm run recognize:offline` → byte-identical artifacts re-derived from committed programs,
  conformance re-verdicts match record.json. Run it TWICE (fresh processes) for determinism.
- `npm test` (artifact self-test + full unit glob) green.
- Self-grep: `grep -rn "cottage\|barn\|gatehouse\|church" src/recognition/` returns nothing.
- Commit (if any record drift fixes were needed, they happened in step 6's loop; this step
  normally commits only progress.md).

## Step 8 — Review phase artifact

`review.md`: files created/modified, test coverage map + gaps, AC trace, open concerns
(sibling-commit status, deferred treatment realization, symmetry-declaration gap, card rotation
note), follow-ups for S-126/S-127.

## Testing strategy summary

- Unit (pure, no GL/IO/live): program gate, pack validation, prompt determinism, parser throw
  taxonomy, compiler arithmetic + determinism, gable-end geometry.
- Integration (pure still): synthetic program → compile → realize → assertArtifact +
  runConformance all-pass; watertight on gabled builds.
- Live evidence (not in npm test): the two committed drafts + their renders + ledgers.
- Replay: `recognize:offline` byte-compare (the AC's named npm run), double-run.

## Contingencies

- **Sibling program.mjs changes shape under us** (it's their step 2; later steps may touch it):
  our integration surface is 4 exports (schema const, assert, realize, boxShell-spec shape via
  compiled elements). If realize/assert signatures move, only compile.test.mjs + runner adjust.
  Their applyParamAdjust/actions work is additive. Watch `git log` between our steps.
- **TRELLIS-style sketch facts mislead the model** (e.g. barn pitch reads steep): fine — pack
  validation re-asks toward vocabulary; the ledger records the correction pressure. No pack edit.
- **Renders unavailable headless**: recorded as renderError, never fatal (idiom-card precedent);
  AC's "renders show clean builds" then needs a local re-run — surface in review.md if hit.
- **`claude` CLI absent/logged out**: step 6 blocks; commit code + tests, mark ticket blocked in
  review.md (everything else verifiable offline). Do NOT fabricate records.
- **Conformance fail loops**: 2 compiler-fix iterations max per subject before surfacing the
  failure honestly in review.md with the failing check's findings (E-25 Rule 6 spirit).
