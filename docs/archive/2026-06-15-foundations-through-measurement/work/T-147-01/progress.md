# T-147-01 Progress — articulation-brushes

Status: **implementation complete** (4 commits). `npm test` green (2092/0). All byte-identity gates
byte-identical. The plan's optional Step 5 (live `pattern-book` hook) is **deferred by design** —
rationale below.

## Commits

1. `16b6b24` — **Step 1**: `src/view/facade-articulation.mjs` (pilaster, quoin, infillPanel,
   eaveOverhang) + `.test.mjs` (FA1–FA9). Each brush delegates to `surfaceRelief`.
2. `32cf02b` — **Step 2**: four `kind:pass` registry entries; `facade-articulation` joins TECHNIQUES
   + allowlist; brush count 24→28; `idiom-registry.test.mjs` pass-coverage. Also repaired two
   sibling-left brush-door violations (see Deviation 2).
3. `1e41ff3` — **Step 3**: `compileProgram` returns `{workshopProgram, articulation}`;
   `facadeArticulationPlan` (roles via `roleBlock`); `applyArticulation` (via the door); jetty
   `overhang` refined from `facade.faces[].jettyDepth`. `compile.test.mjs` invariance + plan tests.
4. `f85f165` — **Step 4**: `fixtures/facade/articulated-program.json` + `facade-build.test.mjs` — the
   end-to-end build proof (compile → realize → articulate → no-regress).

## Acceptance criteria status

- **AC#1 — four registry brushes through the relief op, each composition/tests/preview card** ✓.
  `pilaster`, `quoin`, `infill-panel`, `eave-overhang` are registered passes, each delegating to
  `surfaceRelief`, each with closed `paramsSchema`, `tests`, and a substrate+realize preview (passes
  are catalog-plotted via `realizePassPreview`; no card spec needed — that machinery is
  construct-only). `brush-catalog` coverage green (every brush plotted). pilaster preserves the rake;
  quoin steps stretcher/header by course parity; infill-panel emits proud studs + recessed-by-
  exclusion field; eave-overhang is a soffit course at the eave (distinct from jetty).
- **AC#2 — jetty/dormer build the recognised grammar; the grammar actually builds** ✓.
  Premise corrected (Deviation 1): jetty/dormer were already wired (E-31); the real gap was the
  T-145 `facade` record being recorded-only. Now `compile` consumes `facade` → an articulation plan +
  jetty-depth refinement; `realize` builds the constructs; `applyArticulation` builds the relief.
  `facade-build.test.mjs` proves a facade-bearing program builds end-to-end with the no-regress
  charter holding.
- **AC#3 — vocabulary authority + conformance; new idioms on the card; no per-building constants** ✓.
  Every facade role resolves through `roleBlock` (the one program-path composition point); the
  brush-door closed sweep is green; the four brushes appear in the brush catalog; periods come from
  the grammar (or `count`→period over the wall extent), depths from `ARTICULATION_DEFAULTS` — no
  subject constants. The applier reaches brushes via `getBrush` (the door), never a direct import.
- **AC#4 — tests per brush + preview cards; `npm test` green; `--repro`/`--offline` byte-identical** ✓.
  FA1–FA9 (placement, rhythm, idempotence, purity, silhouette no-regress via the exported
  `reliefNoRegress`); preview cards on all four entries; `npm test` 2092/0; `patternbook:repro`,
  `patternbook:offline`, `recognize:offline`, `facade:offline` all byte-identical.

## Deviations from the plan

1. **Ticket premise corrected.** The ticket said jetty/dormer are "not wired into the program path at
   all." They were already wired in `compile.mjs` (E-31). The true unwired surface was T-145's
   `facade` grammar record. Scope was redirected accordingly (research §6, design D0/D4): the brushes
   realize the facade articulation, and "wiring" = consuming `facade` in compile + the applier.

2. **Cross-ticket conformance repair (forced by the shared tree).** Sibling **T-148-01** had
   committed `src/form/relief-presence.mjs` and `benchmarks/sculpture/relief-calibration.mjs` — both
   import `surface-relief.mjs` — **without** adding brush-door allowlist entries, leaving HEAD red on
   the closed sweep. I added both allowlist entries (objectively correct: each delegates to the one
   relief op) so my branch lands green. Duplicate-key-safe if T-148 later adds the same entries
   ([[shared-file-commit-sweep]]).

3. **`applyArticulation` lives in `compile.mjs`, not `facade-articulation.mjs`** (structure §S1 had it
   in the brush module). Reason: the applier needs `getBrush` (the door); putting it in the brush
   module would create a circular import (door → brushes → door) AND would force `pattern-book` to
   import a technique module directly. Hosting it in `compile.mjs` (a non-technique module that
   already owns role resolution) keeps the door clean and the import graph acyclic.

4. **courseLines map to the `eave-overhang` brush at an explicit row** (not a new brush). A horizontal
   belt course IS a proud course at a given row — exactly `eave-overhang` with `eaveRow:y`. This
   reuses an AC brush with plain-data params (no function in the plan), keeping the plan replay-stable.

5. **Step 5 (live `pattern-book` hook) deferred — recorded, not lost.** See below.

## Why Step 5 is deferred

The plan flagged Step 5 as droppable if it risked the pins/self-grep. It does, and the value is nil
right now:
- No committed subject (cottage/barn/…) carries a `facade`, so a live hook would be exercised by zero
  pinned inputs — untested dead code in a record-pinned, self-grep-guarded runner.
- The correct live integration couples with **S-148**'s relief-aware gate: the gate must *see* the
  articulation to score it, and the multi-round workshop-loop ordering (where in the loop articulation
  applies) is an S-148-adjacent decision, not a T-147 add-on.
- The deliverable is ready: `applyArticulation` is exported from `compile.mjs`; wiring is a single
  guarded call when a facade-bearing subject + the relief-aware gate land together.

AC#2 is satisfied without it — the program path (compile→realize→articulate) is wired and proven by
`facade-build.test.mjs`.

## Verification log

- `node --test src/view/facade-articulation.test.mjs` → 9/9.
- `node --test src/recognition/compile.test.mjs` → 14/14.
- `node --test src/recognition/facade-build.test.mjs` → 5/5.
- pack suites (idiom-registry, brush-contract, brush-door, brush-catalog) → 36/36.
- `npm test` → 2092/0.
- `patternbook:repro` / `patternbook:offline` / `recognize:offline` / `facade:offline` →
  byte-identical.
