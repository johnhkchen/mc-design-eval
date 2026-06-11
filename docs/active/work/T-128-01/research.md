# T-128-01 — brush-registry — Research

Phase 1 of 6. Descriptive map of what exists, where, and how it connects. No solutions proposed.

## The ticket in one line

Make the E-31 idiom registry (T-124) the universal door to every build technique: a **brush
contract** (params schema + composition interface + test + preview-card requirements), the full
technique inventory registered, byte-identical migration proofs, and a committed **catalog** whose
brush count is the E-32 factory baseline.

## 1. The seed: the idiom registry (T-124, committed)

`src/pack/idiom-registry.mjs` — one frozen table, `IDIOM_REGISTRY`, 15 entries in two kinds:

- **`kind:"construct"` (11)** — uniformly callable `generate(spec) → {cells:[{pos,block,state?}],…meta}`:
  `roof.gable`/`roof.hip`/`roof.pyramid` (adapters over `generateRoof`, src/view/roof-generate.mjs),
  `arch`/`head.flat`/`course.stairs`/`course.slab` (over src/form/shaped-vocab.mjs),
  `dormer`/`chimney`/`jetty`/`plinth` (src/form/idiom-constructs.mjs). All fail-loud on malformed
  specs; all pure.
- **`kind:"pass"` (4)** — name-registered with **natural signatures**, deliberately not force-fitted
  into spec→cells: `timber-frame` (`placementGrammar`), `opening-dressing` (`dressOpenings`),
  `hollow` (`markHollowable` + `apply: carveArtifact`), `floorplan` (`generateFloorplan`).
- Every entry carries `paramsSchema` — style-level partials (properties only, nothing required;
  compiles under Ajv). Construct schemas are tight (`additionalProperties:false`); the four pass
  schemas are deliberately open (`additionalProperties:true`) — T-124 review concern #4.
- API surface: `IDIOM_REGISTRY`, `IDIOM_REGISTRY_SCHEMA` ("idiom-registry/v1"), `idiomNames()`
  (sorted), `getIdiom(name)` (throws on unknown).

### Live consumers (the wrap-don't-fork constraint)

| Consumer | Uses | Hard expectations |
|---|---|---|
| `src/workshop/program.mjs` (T-126, **sibling in flight**) | `IDIOM_REGISTRY[name]`, `getIdiom(n).generate(spec).cells` | `entry.kind === "construct"` gate at program parse (program.mjs:147-151); passes rejected as elements |
| `src/recognition/program.mjs` (T-125, **sibling in flight**) | `validateProgramAgainstPack(…, {registry})` | idiom names resolve; paramsSchema validates |
| `src/recognition/prompt.mjs` | `packDigest(pack, {registry})` | enumerable entries |
| `src/pack/style-pack.mjs` | `validateStylePack(…, {registry})` | pack idioms resolve, style params validate vs `paramsSchema` |
| `src/pack/idiom-card.mjs` | `getIdiom`, `IDIOM_REGISTRY` filtered to constructs | every construct must appear on the card (`cardCoverage` pin) |

Any change to `idiom-registry.mjs` must be **additive** — exports, entry shapes, `kind` values, and
throw semantics are load-bearing for two in-flight sibling tickets (work-dir mtimes minutes old;
their modules are committed and tested).

## 2. The preview-card machinery (the existing half of the contract)

- **Pure layout:** `src/pack/idiom-card.mjs` — `IDIOM_CARD_SPECS` (21 committed synthetic specs
  covering all 11 constructs incl. orientation variants), `idiomCardLayout` (plots on a baseplate
  grid, deterministic), `cardCoverage` (completeness pin: every construct carded),
  `idiomCard()` (schema-valid artifact, the fixtureCard pattern).
- **Impure runner:** `benchmarks/sculpture/idiom-card.mjs` (`npm run idioms:card`) — AJV gate →
  `unmapped===0` through `buildWorldFromVoxels` → 5 GL renders (4 gate azimuths + front) with
  sha256 receipts as **evidence, never verdict** (`reproducibility-excludes-gl-from-decisions`) →
  commits `benchmarks/sculpture/idiom-card/{card.json,record.json,idiom-card.md,5 PNGs}`.
- **Passes have no preview cards today.** The card iterates constructs only.

## 3. The unregistered inventory (E-23 spray/paint ops)

All pure cores (no GL/IO/Date/random), occupancy + zone/feature context in, placements + report out:

| Module | Pure exports | In → Out |
|---|---|---|
| `src/view/zone-fill.mjs` | `zoneFill`, `inRun`, `surfaceVoxelEntries`, `exposedVoxelEntries`, `dominantCoverage`, `coverageGate` | occ + {zoneOf, zones, skin, minRun} → recolor placements + kept/byZone; gate fns are instruments |
| `src/view/face-paint.mjs` | `paintFace`, `mergePaints`, `applyPaint` | occ + dir + targetGrid + allowed sets → recolor placements; merge dedups passes; apply appends to artifact |
| `src/view/surface-pattern.mjs` | `regularizeRoofCourses` (ADD-only pit fill), `stripStraySalt` (recolor isolates) | occ + zone policy → placements |

The already-registered passes' cores (for contract comparison): `dressOpenings(targetOcc, apertures,
treatments) → {placements, perOpening, regions, stats}` (+ `extractApertures`, `treatmentsFromKit`,
`applyDressing`); `markHollowable(occ, opts) → {remove,…}` with `carveArtifact(artifact, remove)`;
`generateFloorplan(occ, read, spec) → {plan, placements}` with `gateFloorplan`; `placementGrammar(occ,
opts) → {placements, frame, fill, frameRefilled,…}` (kit/zone/policy context fed by
`composeVocabulary` — the T-113 authority).

Adjacent but distinct: `src/workshop/program.mjs` `boxShell` ("the one generic composer the registry
lacks" per its header — a T-126 element kind, not a registry entry); `src/workshop/actions.mjs`
spray-paint action (projectSurface + recolor — the workshop's hands over the same E-23 canvas).

## 4. The byte-identity discipline (what "behavior-preserving" must prove)

`sha256(JSON.stringify(artifact, null, 2) + "\n")` over artifact JSON text, hex compare; plus
double-run `JSON.stringify(r1)===JSON.stringify(r2)` determinism proofs.

- `benchmarks/sculpture/challenge-milestone.mjs` — `--offline` re-asserts committed
  `challenge/{key}.json` `reproducible.sha256.{shell,final}` + gates; `--repro` re-runs the chain
  fresh (no GL/judge) and compares base/shell/final/reconstructed sha256s. Subjects: cottage,
  gatehouse, church, barn (`npm run challenge:<subject> -- --offline|--repro`; flags need `--`,
  the npm-flag-swallowing lesson).
- `benchmarks/sculpture/durable-skin.mjs` — `--offline` re-asserts `durable-skin/{key}.json`
  (artifact sha256, coverage PASS vs splat-only REJECT, bands, plaster invariant).
- `benchmarks/sculpture/workshop.mjs` (T-126) — `--replay` rebuilds from committed program + ledger,
  byte-compares serialized artifact; `--offline` re-asserts ledger/conformance internal consistency
  (`npm run workshop:replay` / `workshop:offline`).
- Call chains those records pin: durable-skin's `buildSkin` calls `zoneFill`/`paintFace`/
  `mergePaints`/`applyPaint`/`regularizeRoofCourses`/`stripStraySalt`/`composeVocabulary` **directly
  by import** — not through the registry. Same for dressing/hollow/floorplan runners. The committed
  records pin those functions' behavior, not their call path.

## 5. Enforcement precedent (the "single door" mechanism)

`src/form/material-vocabulary.conformance.test.mjs` (T-113) — the structural-tripwire pattern: read
consumer **source from disk**, closed sweep over `src/form`, `src/view`, `benchmarks/sculpture`;
forbidden composition patterns allowed only in the authority file; enumerated consumers must import
the authority; the sweep is closed so a new file cannot bypass quietly. Same pattern as the T-107
lens-guard. This is the codebase's existing answer to "X is the only door".

## 6. Contract/loader idioms to conform to

- **Schema gate:** `schema/*.schema.json` (draft 2020-12, strict, `additionalProperties:false`) +
  memoized Ajv validator + non-throwing `parseX` / fail-fast `assertX` + `formatErrors` reused from
  `src/artifact.mjs` (style-pack.mjs:51-91 is the latest copy of the idiom).
- **Pure modules under `src/**` run in the `npm run test:unit` glob** (`node --test`); impure
  runners live in `benchmarks/sculpture/` and are seam-invariant wiring (not unit-tested).
- **Versioned schema-string exports** (`IDIOM_REGISTRY_SCHEMA = "idiom-registry/v1"` etc.).
- Occupancy authority: `src/view/occupancy.mjs` (`occupancyFromCells`, `bareBlock`).
- `PHASE1_MODEL_ID` from `src/config.mjs` stamps generated artifacts.

## 7. E-32 framing (binding rules that touch this ticket)

- **Rule 1:** a brush is parametrized, composable, unit-tested, preview-carded; **the registry is
  the only door**; an epic-specific fix that could be a brush gets written as one.
- S-128 goal (a) contract, (b) registry-as-single-door + catalog page, (c) byte-identical migration.
- Downstream dependents: S-131 (design-backlog factory "targets the registry" — needs the registry
  state enumerable/countable), S-132 (reuse stats "registry count before/after" — needs the
  **brush count** committed as the baseline).
- Pipeline-philosophy Stage 4 names brushes explicitly; the idiom-card header already calls the
  card "the preview-card half of the brush contract."

## 8. Constraints & assumptions surfaced

1. **Two sibling tickets are mid-flight on the same module's consumers** (T-125 recognition,
   T-126 workshop). The registry surface they consume is frozen in practice.
2. The committed records (challenge/durable-skin/workshop/idiom-card) pin **function behavior**;
   registration that only adds name-resolution cannot move them — but any signature change,
   wrapper indirection with different defaults, or import-graph cycle could.
3. `npm test` currently green at 1703 tests (T-124 review); `src/**/*.test.mjs` glob means any new
   pure module gets tested for free if named `*.test.mjs`.
4. Pass paramsSchemas are open (`additionalProperties:true`) — the ticket's "parameter docs" for
   the catalog will surface this gap; tightening was deferred to S-125/126 and both are in flight.
5. No `brush` code exists yet (only comments referencing the concept); no naming collision.
6. "Preview-carded on a declared synthetic subject through the fixed lens" — for passes this needs
   a synthetic subject to act on (no precedent exists; constructs use committed local-coord specs;
   `boxShell` is the obvious synthetic substrate and is pure/committed).
7. The generalization grep checks code for building names (E-31 Rule 2); catalog/card fixture data
   follows the CARD_ROWS status (committed fixture data is sanctioned).
8. GL renders are evidence with sha256 receipts, never gating verdicts (committed-record memory).

## 9. Files certain to be in play

- `src/pack/idiom-registry.mjs` (+test) — the seed table.
- `src/pack/idiom-card.mjs` (+test), `benchmarks/sculpture/idiom-card.mjs` + committed card dir.
- `src/view/zone-fill.mjs`, `face-paint.mjs`, `surface-pattern.mjs` (registration targets).
- `src/view/opening-dressing.mjs`, `hollow-carve.mjs`, `floorplan.mjs`,
  `src/form/placement-grammar.mjs` (already registered; contract metadata may reference them).
- `schema/` (a brush contract schema would live here), `package.json` (catalog script),
  `benchmarks/sculpture/` (catalog runner + committed outputs).
- Verification: `challenge:*` `--offline`/`--repro`, `workshop:replay`/`workshop:offline`,
  durable-skin `--offline`, `npm test`.
